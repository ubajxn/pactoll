import { type Account, type Opportunity, stages } from "@/lib/data/contracts";
import { queryList } from "@/lib/data/query";

export type Stage = Opportunity["stage"];
export const stageLabels: Record<Stage, string> = {
  qualification: "Qualification",
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  current_client: "Current Client",
  shelved: "Shelved",
};
export const opportunityColumns = {
  account: "Account",
  stage: "Stage",
  amount: "Amount",
  owner: "Owner",
  closeDate: "Close date",
  nextStep: "Next step",
};
export type OpportunityColumn = keyof typeof opportunityColumns;
export function isStage(value: unknown): value is Stage {
  return stages.some((stage) => stage === value);
}
export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}
export function formatCloseDate(date: string | null) {
  return date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No close date";
}
export function stageTotal(records: Opportunity[]) {
  return formatMoney(
    records.reduce((total, record) => total + record.amount, 0),
  );
}
export function queryOpportunities(
  records: Opportunity[],
  accounts: Account[],
  params: URLSearchParams,
) {
  const names = new Map(accounts.map((account) => [account.id, account.name]));
  const search = (params.get("q") ?? "").trim().toLowerCase();
  const sort = params.get("sort") ?? "name";
  const direction = params.get("direction") === "desc" ? -1 : 1;
  return queryList(records, {
    pageSize: Math.max(1, records.length),
    filters: [
      (record) =>
        !search ||
        [
          record.name,
          names.get(record.accountId ?? ""),
          record.nextStep,
          record.owner?.name,
        ].some((value) => value?.toLowerCase().includes(search)),
      (record) => !params.get("stage") || record.stage === params.get("stage"),
      (record) =>
        !params.get("account") || record.accountId === params.get("account"),
      (record) =>
        !params.get("owner") ||
        (params.get("owner") === "unassigned"
          ? !record.owner
          : record.owner?.id === params.get("owner")),
    ],
    compare: (a, b) => {
      // Keep missing close dates at the end in either direction.
      if (sort === "closeDate" && (!a.closeDate || !b.closeDate))
        return a.closeDate ? -1 : b.closeDate ? 1 : a.id.localeCompare(b.id);
      const value =
        sort === "amount"
          ? a.amount - b.amount
          : sort === "stage"
            ? stages.indexOf(a.stage) - stages.indexOf(b.stage)
            : sort === "account"
              ? (names.get(a.accountId ?? "") ?? "").localeCompare(
                  names.get(b.accountId ?? "") ?? "",
                )
              : sort === "owner"
                ? (a.owner?.name ?? "").localeCompare(b.owner?.name ?? "")
                : sort === "closeDate"
                  ? (a.closeDate ?? "").localeCompare(b.closeDate ?? "")
                  : sort === "updatedAt"
                    ? a.updatedAt.localeCompare(b.updatedAt)
                    : sort === "nextStep"
                      ? a.nextStep.localeCompare(b.nextStep)
                      : a.name.localeCompare(b.name);
      return value * direction || a.id.localeCompare(b.id);
    },
  }).items;
}

/** Apply immediately, then restore only this record if its adapter rejects. */
export async function changeOpportunityStage(
  record: Opportunity,
  stage: Stage,
  persist: (id: string, stage: Stage) => Promise<Opportunity>,
  replace: (record: Opportunity) => void,
) {
  if (record.stage === stage) return record;
  replace({ ...record, stage });
  try {
    const saved = await persist(record.id, stage);
    replace(saved);
    return saved;
  } catch (error) {
    replace(record);
    throw error;
  }
}
