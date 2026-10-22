import { DetailPage } from "@/components/crm/detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailPage kind="accounts" id={id} />;
}
