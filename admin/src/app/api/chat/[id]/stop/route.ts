import { z } from "zod";
import {
  authErrorResponse,
  authorizeConversation,
  sameOrigin,
} from "@/lib/auth/server";
import { stopChatStream } from "@/lib/chat/stream-store";
import { idSchema } from "@/lib/data/contracts";

export const runtime = "nodejs";

const stopSchema = z.strictObject({
  responseId: idSchema,
  attemptId: idSchema,
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request))
    return new Response("Cross-origin requests are not allowed.", {
      status: 403,
    });
  const conversationId = idSchema.safeParse((await params).id);
  if (!conversationId.success)
    return new Response("Invalid stop request.", { status: 400 });
  try {
    await authorizeConversation(request, conversationId.data);
  } catch (error) {
    return authErrorResponse(error);
  }
  const input = stopSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success)
    return new Response("Invalid stop request.", { status: 400 });
  const stopped = stopChatStream(
    conversationId.data,
    input.data.responseId,
    input.data.attemptId,
  );
  return Response.json({ stopped }, { status: stopped ? 200 : 409 });
}
