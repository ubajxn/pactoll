import { ChatWorkspace } from "@/components/chat/workspace";

export const metadata = { title: "Chat" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ChatWorkspace
      key={id}
      id={id}
      enabled={process.env.AI_ENABLED !== "false"}
    />
  );
}
