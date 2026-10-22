import { Suspense } from "react";
import { ListCollection } from "@/components/crm/list-collection";

export const metadata = { title: "Lists" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense>
      <ListCollection id={id} />
    </Suspense>
  );
}
