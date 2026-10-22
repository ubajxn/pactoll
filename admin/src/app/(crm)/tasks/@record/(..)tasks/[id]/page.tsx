import { CollectionDetailPanel } from "@/components/crm/collection-detail-panel";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionDetailPanel kind="tasks" id={id} />;
}
