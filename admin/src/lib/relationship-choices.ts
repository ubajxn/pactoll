import type { DataAdapter, Member, RecordKind } from "@/lib/data/contracts";

export type RelationshipChoice = {
  kind: RecordKind;
  id: string;
  name: string;
  description?: string;
};

const relationshipDependencies: Record<RecordKind, readonly RecordKind[]> = {
  accounts: [],
  contacts: ["accounts"],
  opportunities: ["accounts", "contacts"],
  tasks: ["accounts", "contacts", "opportunities"],
};

export async function loadRelationshipChoices(
  data: DataAdapter,
  kind: RecordKind,
): Promise<{ options: RelationshipChoice[]; members: Member[] }> {
  const [groups, members] = await Promise.all([
    Promise.all(
      relationshipDependencies[kind].map(async (optionKind) => ({
        kind: optionKind,
        records: await data.list(optionKind),
      })),
    ),
    data.listMembers(),
  ]);
  return {
    options: groups.flatMap(({ kind: optionKind, records }) =>
      records.map((record) => ({
        kind: optionKind,
        id: record.id,
        name: "name" in record ? record.name : record.title,
        description: "email" in record ? record.email : undefined,
      })),
    ),
    members,
  };
}
