import { Invitation } from "@/components/auth/invitation";
export const metadata = { title: "Join your team" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Invitation id={(await params).id} />;
}
