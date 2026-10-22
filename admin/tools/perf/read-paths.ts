import type { Pool } from "pg";
import type { WorkspaceContext } from "../../src/lib/auth/types";
import type { DataAdapter } from "../../src/lib/data/contracts";
import { createDataService } from "../../src/lib/data/service";
import type { Store } from "../../src/lib/data/store";

interface ReadPathMetric {
  operation: string;
  queryCount: number;
  returnedRows: number;
  dataRows: number;
  serializedBytes: number;
  elapsedMs: number;
}

interface ProbeAgent {
  api: DataAdapter;
}

interface ProbeApp {
  pool: Pool;
  login(email?: string, name?: string): Promise<ProbeAgent>;
  workspace(user: ProbeAgent, name?: string): Promise<WorkspaceContext>;
  close(): Promise<void>;
}

const helperPath = ["../../backend/tests", "helpers"].join("/");
const databasePath = ["../../backend", "db"].join("/");
const { testApp } = (await import(helperPath)) as {
  testApp(): Promise<ProbeApp>;
};
const { createPostgresAdapter, createPostgresStore } = (await import(
  databasePath
)) as {
  createPostgresAdapter(
    pool: Pool,
    context: WorkspaceContext,
    options?: { onRead?: (metric: ReadPathMetric) => void },
  ): DataAdapter;
  createPostgresStore(
    pool: Pool,
    context: WorkspaceContext,
    options?: { onRead?: (metric: ReadPathMetric) => void },
  ): Store;
};

interface Result extends ReadPathMetric {
  stage: "small" | "larger";
  mode: "full snapshot" | "scoped";
  label: string;
}

const app = await testApp();
try {
  const owner = await app.login("read-probe@example.test", "Read Probe");
  const context = await app.workspace(owner, "Read Probe Workspace");
  const account = await owner.api.create("accounts", { name: "Exact account" });
  const selected = await owner.api.createConversation({
    title: "Selected chat",
  });
  await owner.api.appendMessage(selected.id, {
    role: "user",
    blocks: [{ type: "text", text: "Selected message" }],
  });
  const unrelated = await owner.api.createConversation({
    title: "Unrelated history",
  });
  await owner.api.appendMessage(unrelated.id, {
    role: "user",
    blocks: [{ type: "text", text: "Initial unrelated message" }],
  });

  let fullMetric: ReadPathMetric | undefined;
  let scopedMetric: ReadPathMetric | undefined;
  const full = createDataService(
    createPostgresStore(app.pool, context, {
      onRead: (metric) => {
        fullMetric = metric;
      },
    }),
    { id: context.user.id, name: context.user.name },
  );
  const scoped = createPostgresAdapter(app.pool, context, {
    onRead: (metric) => {
      scopedMetric = metric;
    },
  });
  const operations: Array<{
    label: string;
    run: (adapter: DataAdapter) => Promise<unknown>;
  }> = [
    { label: "member list", run: (adapter) => adapter.listMembers() },
    {
      label: "exact record",
      run: (adapter) => adapter.get("accounts", account.id),
    },
    {
      label: "record-kind list",
      run: (adapter) => adapter.list("accounts"),
    },
    {
      label: "chat recents",
      run: (adapter) => adapter.listConversations(),
    },
    {
      label: "exact conversation",
      run: (adapter) => adapter.getConversation(selected.id),
    },
    {
      label: "single-chat messages",
      run: (adapter) => adapter.listMessages(selected.id),
    },
  ];
  const results: Result[] = [];

  async function measure(stage: Result["stage"]) {
    for (const operation of operations) {
      fullMetric = undefined;
      await operation.run(full);
      if (!fullMetric) throw new Error("Full-snapshot metric was not recorded");
      results.push({
        ...(fullMetric as ReadPathMetric),
        stage,
        mode: "full snapshot",
        label: operation.label,
      });

      scopedMetric = undefined;
      await operation.run(scoped);
      if (!scopedMetric) throw new Error("Scoped metric was not recorded");
      results.push({
        ...(scopedMetric as ReadPathMetric),
        stage,
        mode: "scoped",
        label: operation.label,
      });
    }
  }

  await measure("small");
  const now = new Date().toISOString();
  await app.pool.query(
    `INSERT INTO crm_entities (id,organization_id,kind,created_by,owner_id,payload)
     SELECT 'perf-contact-' || value,$1,'contacts',$2,NULL,
       jsonb_build_object(
         'id','perf-contact-' || value,'name','Unrelated contact ' || value,
         'email','','phone','','role','','accountId',NULL,'owner',NULL,
         'createdAt',$3::text,'updatedAt',$3::text,
         'notes','[]'::jsonb,'activity','[]'::jsonb
       )
     FROM generate_series(1,250) AS value`,
    [context.workspace.id, context.user.id, now],
  );
  await app.pool.query(
    `INSERT INTO crm_messages (id,organization_id,conversation_id,sequence,payload)
     SELECT 'perf-message-' || value,$1,$2,value,
       jsonb_build_object(
         'id','perf-message-' || value,'conversationId',$2::text,'sequence',value,
         'role','user','blocks',jsonb_build_array(
           jsonb_build_object('type','text','text','Unrelated message ' || value)
         ),
         'status','final','isDemo',false,
         'createdAt',$3::text,'updatedAt',$3::text
       )
     FROM generate_series(2,501) AS value`,
    [context.workspace.id, unrelated.id, now],
  );
  await measure("larger");

  process.stdout.write(
    "stage\tmode\toperation\tqueries\tdata rows\tbytes\tms\n",
  );
  for (const result of results)
    process.stdout.write(
      `${result.stage}\t${result.mode}\t${result.label}\t${result.queryCount}\t${result.dataRows}\t${result.serializedBytes}\t${result.elapsedMs.toFixed(2)}\n`,
    );
} finally {
  await app.close();
}
