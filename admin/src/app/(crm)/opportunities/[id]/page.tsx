import type { Metadata } from "next";
import { DetailPage } from "@/components/crm/detail-page";

export const metadata: Metadata = { title: "Opportunity" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailPage kind="opportunities" id={id} />;
}
