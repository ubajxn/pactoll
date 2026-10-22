import { CollectionDetailPanel } from "@/components/crm/collection-detail-panel";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionDetailPanel id={id} kind="contacts" />;
}
