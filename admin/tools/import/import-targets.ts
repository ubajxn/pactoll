import { Pool } from "pg";

const ORG_ID = "f5a9438a-e65c-417c-b2d2-3bcec2a5204b";
const USER_ID = "e68b0aed-025a-499c-b82b-0fcbf4d056c0";
const DB_URL = "postgres://crm:crm_local@127.0.0.1:5432/crm";

// Dynamically import the target data (it's an ES module export)
const dataPath = "D:/NewProjects/pactoll/admin/src/data/targets/target-data.js";
const { TARGET_ACCOUNTS } = await import(dataPath);

const compDataPath = "D:/NewProjects/pactoll/admin/src/data/competitors/competitor-data.js";
let COMPETITORS: any[] = [];
try {
  const mod = await import(compDataPath);
  COMPETITORS = mod.COMPETITORS || mod.COMPETITOR_DATA || mod.default || [];
} catch (e) {
  console.log("No competitor data found, skipping");
}

const pool = new Pool({ connectionString: DB_URL, max: 5 });

function slugToId(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 100);
}

function parseRevenue(rev: string | null | undefined): number | null {
  if (!rev) return null;
  const cleaned = rev.replace(/[^0-9.BMK]/gi, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  if (rev.includes("B")) return num * 1_000_000_000;
  if (rev.includes("M")) return num * 1_000_000;
  if (rev.includes("K")) return num * 1_000;
  return num;
}

function parseHeadcount(emp: string | null | undefined): number | null {
  if (!emp) return null;
  const cleaned = emp.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : null;
}

function parseDealValue(val: string | null | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (val.includes("M")) return num * 1_000_000;
  if (val.includes("K")) return num * 1_000;
  return num;
}

function mapPipelineStage(stage: string | undefined): string {
  const map: Record<string, string> = {
    awareness: "qualification",
    engagement: "discovery",
    consideration: "proposal",
    proposal: "negotiation",
    closed: "won",
  };
  return map[stage ?? "awareness"] ?? "qualification";
}

const owner = { id: USER_ID, name: "Jeff Jack" };
const now = new Date().toISOString();

console.log(`\nImporting ${TARGET_ACCOUNTS.length} target accounts...`);

let accountCount = 0;
let contactCount = 0;
let noteCount = 0;
let opportunityCount = 0;

const client = await pool.connect();
try {
  await client.query("BEGIN");

  for (const target of TARGET_ACCOUNTS) {
    const accountId = slugToId(target.slug);

    // Build account payload — id, createdAt, updatedAt, notes, activity all go in the JSONB
    const accountPayload: Record<string, any> = {
      id: accountId,
      name: target.n,
      website: target.website || "",
      industry: target.cat || "",
      revenue: parseRevenue(target.revenue),
      headcount: parseHeadcount(target.employees),
      location: target.loc || "",
      linkedin: target.linkedin || "",
      facebook: target.socialLinks?.facebook || "",
      instagram: target.socialLinks?.instagram || "",
      twitter: target.socialLinks?.twitter || "",
      owner,
      relationshipType: "target",
      steelProducts: target.steel || "",
      steelNeeds: target.needs || "",
      mediaProductionCosts: false,
      mediaPlacementCosts: false,
      createdAt: now,
      updatedAt: now,
      notes: [] as any[],
      activity: [
        {
          id: `act-${accountId}-created`,
          type: "created",
          summary: `Created from PTP target database`,
          actor: owner,
          createdAt: now,
        },
      ],
    };

    // Insert account
    await client.query(
      `INSERT INTO crm_entities (id, organization_id, kind, created_by, owner_id, payload)
       VALUES ($1, $2, 'accounts', $3, $3, $4)
       ON CONFLICT (id) DO UPDATE SET payload = $4`,
      [accountId, ORG_ID, USER_ID, JSON.stringify(accountPayload)]
    );
    accountCount++;

    // Insert contacts for this account
    if (target.contacts && Array.isArray(target.contacts)) {
      for (let i = 0; i < target.contacts.length; i++) {
        const contact = target.contacts[i];
        const contactId = `${accountId}-contact-${i}`;

        const contactPayload: Record<string, any> = {
          id: contactId,
          name: contact.name,
          email: contact.email || "",
          phone: contact.phone || "",
          role: contact.title || "",
          accountId: accountId,
          owner: contact.isPrimary ? owner : null,
          createdAt: now,
          updatedAt: now,
          notes: [] as any[],
          activity: [
            {
              id: `act-${contactId}-created`,
              type: "created",
              summary: `Imported from PTP target database`,
              actor: owner,
              createdAt: now,
            },
          ],
        };

        await client.query(
          `INSERT INTO crm_entities (id, organization_id, kind, created_by, owner_id, payload)
           VALUES ($1, $2, 'contacts', $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET payload = $5`,
          [contactId, ORG_ID, USER_ID, contact.isPrimary ? USER_ID : null, JSON.stringify(contactPayload)]
        );

        // Add entity link (contact -> account)
        await client.query(
          `INSERT INTO crm_entity_links (organization_id, source_id, target_id)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [ORG_ID, contactId, accountId]
        );

        contactCount++;
      }
    }

    // Create an opportunity for accounts that have deal values
    if (target.estDealValue) {
      const oppId = `${accountId}-opp`;
      const oppPayload: Record<string, any> = {
        id: oppId,
        name: `${target.n} — Steel Processing`,
        accountId: accountId,
        stage: mapPipelineStage(target.pipelineStage),
        amount: parseDealValue(target.estDealValue),
        currency: "USD",
        owner,
        closeDate: null,
        contactIds: target.contacts ? target.contacts.filter((c: any) => c.isPrimary).map((_: any, i: number) => `${accountId}-contact-${i}`) : [],
        nextStep: "",
        createdAt: now,
        updatedAt: now,
        notes: [] as any[],
        activity: [
          {
            id: `act-${oppId}-created`,
            type: "created",
            summary: `Pipeline opportunity created from PTP targets`,
            actor: owner,
            createdAt: now,
          },
        ],
      };

      await client.query(
        `INSERT INTO crm_entities (id, organization_id, kind, created_by, owner_id, payload)
         VALUES ($1, $2, 'opportunities', $3, $3, $4)
         ON CONFLICT (id) DO UPDATE SET payload = $4`,
        [oppId, ORG_ID, USER_ID, JSON.stringify(oppPayload)]
      );

      // Link opportunity to account
      await client.query(
        `INSERT INTO crm_entity_links (organization_id, source_id, target_id)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [ORG_ID, oppId, accountId]
      );

      opportunityCount++;
    }

    // Add touch log entries and notes as account notes
    const allNotes: string[] = [];

    if (target.touchLog && Array.isArray(target.touchLog)) {
      for (const touch of target.touchLog) {
        allNotes.push(`[${touch.date}] ${touch.type.toUpperCase()}: ${touch.note} (by ${touch.who})`);
      }
    }

    if (target.notes && Array.isArray(target.notes)) {
      for (const note of target.notes) {
        allNotes.push(note);
      }
    }

    if (target.news && Array.isArray(target.news)) {
      for (const item of target.news) {
        allNotes.push(`[NEWS ${item.date}] ${item.title} — ${item.source}`);
      }
    }

    if (target.description) {
      allNotes.unshift(`Company: ${target.description}`);
    }

    if (allNotes.length > 0) {
      const combinedNote = allNotes.join("\n\n");
      // Add the notes directly to the account payload
      const noteObj = {
        id: `note-${accountId}-import`,
        content: combinedNote,
        author: owner,
        createdAt: now,
        updatedAt: now,
      };

      // Update the account payload with the note
      accountPayload.notes = [noteObj];
      await client.query(
        `UPDATE crm_entities SET payload = $1 WHERE id = $2 AND organization_id = $3`,
        [JSON.stringify(accountPayload), accountId, ORG_ID]
      );
      noteCount++;
    }
  }

  await client.query("COMMIT");
  console.log(`\nImport complete!`);
  console.log(`  Accounts: ${accountCount}`);
  console.log(`  Contacts: ${contactCount}`);
  console.log(`  Opportunities: ${opportunityCount}`);
  console.log(`  Notes: ${noteCount}`);
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Import failed:", error);
  throw error;
} finally {
  client.release();
  await pool.end();
}
