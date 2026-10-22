import type { Metadata } from "next";
import { ChatWorkspace } from "@/components/chat/workspace";

export const metadata: Metadata = { title: "New chat" };

export default function Page() {
  return <ChatWorkspace enabled={process.env.AI_ENABLED !== "false"} />;
}
