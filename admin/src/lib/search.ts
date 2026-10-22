import {
  type DataAdapter,
  type RecordKind,
  type Records,
  recordKinds,
} from "@/lib/data/contracts";
import { stageLabels } from "@/lib/opportunities";
import { taskStatusLabels } from "@/lib/tasks";

export type SearchRecord = {
  id: string;
  kind: RecordKind;
  title: string;
  subtitle: string;
  updatedAt: string;
  associatedNames: string[];
  keywords: string[];
};

export function searchRecord(
  kind: RecordKind,
  record: Records[RecordKind],
  relatedTitles: string[] = [],
  associatedNames: string[] = [],
): SearchRecord {
  const title = "title" in record ? record.title : record.name;
  const subtitle =
    "email" in record
      ? record.email || record.role
      : "website" in record
        ? record.website
        : "stage" in record
          ? stageLabels[record.stage]
          : "status" in record
            ? taskStatusLabels[record.status]
            : "";
  const objectName =
    kind === "opportunities" ? "opportunity" : kind.slice(0, -1);
  const keywords = [
    record.id,
    kind,
    objectName,
    title,
    subtitle,
    ...relatedTitles,
  ];
  if ("website" in record)
    keywords.push(
      record.industry,
      record.location,
      record.linkedin,
      record.facebook,
      record.instagram,
      record.twitter,
    );
  if ("phone" in record) keywords.push(record.phone, record.role);
  if ("nextStep" in record)
    keywords.push(record.nextStep, record.closeDate ?? "");
  if ("dueDate" in record) keywords.push(record.dueDate ?? "");
  if ("owner" in record && record.owner) keywords.push(record.owner.name);
  if ("assignee" in record && record.assignee)
    keywords.push(record.assignee.name);
  return {
    id: record.id,
    kind,
    title,
    updatedAt: record.updatedAt,
    associatedNames,
    subtitle: associatedNames[0] ?? relatedTitles[0] ?? subtitle,
    keywords,
  };
}

export async function loadSearchRecords(
  data: DataAdapter,
): Promise<SearchRecord[]> {
  const groups = await Promise.all(
    recordKinds.map(async (kind) => ({ kind, records: await data.list(kind) })),
  );
  // Resolve relationships from the same snapshot, without per-result requests.
  const titles = new Map<string, string>(
    groups.flatMap(({ kind, records }) =>
      records.map(
        (record) =>
          [
            `${kind}/${record.id}`,
            "title" in record ? record.title : record.name,
          ] as const,
      ),
    ),
  );
  return groups
    .flatMap(({ kind, records }) =>
      records.map((record) => {
        const references: string[] = [];
        if ("accountId" in record && record.accountId)
          references.push(`accounts/${record.accountId}`);
        if ("contactIds" in record)
          references.push(...record.contactIds.map((id) => `contacts/${id}`));
        if ("relatedRecords" in record)
          references.push(
            ...record.relatedRecords.map(({ type, id }) => `${type}/${id}`),
          );
        const relatedTitles = [
          ...new Set(
            references.flatMap((reference) => {
              const title = titles.get(reference);
              return title ? [title] : [];
            }),
          ),
        ];
        const associatedNames = [
          ...new Set(
            references.flatMap((reference) => {
              if (
                !reference.startsWith("accounts/") &&
                !reference.startsWith("opportunities/")
              )
                return [];
              const name = titles.get(reference);
              return name ? [name] : [];
            }),
          ),
        ];
        return searchRecord(kind, record, relatedTitles, associatedNames);
      }),
    )
    .sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export function matchesSearch(keywords: string[], query: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const text = normalize(keywords.join(" "));
  return normalize(query)
    .trim()
    .split(/\s+/)
    .every((word) => text.includes(word));
}
