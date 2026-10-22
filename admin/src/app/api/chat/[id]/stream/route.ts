import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { z } from "zod";
import {
  authErrorResponse,
  authorizeConversation,
  sameOrigin,
} from "@/lib/auth/server";
import { persistGeneratedResponse } from "@/lib/chat/server-persistence";
import {
  acknowledgeChatStream,
  getChatStream,
  resumeChatStream,
  setChatStreamPersistence,
} from "@/lib/chat/stream-store";
import { type DataAdapter, idSchema } from "@/lib/data/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = idSchema.safeParse((await params).id);
  if (!parsed.success)
    return new Response("Invalid conversation.", { status: 400 });
  try {
    await authorizeConversation(request, parsed.data);
  } catch (error) {
    return authErrorResponse(error);
  }
  const stream = resumeChatStream(parsed.data);
  if (!stream) return new Response(null, { status: 204 });
  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: {
      ...UI_MESSAGE_STREAM_HEADERS,
      "Cache-Control": "no-store",
    },
  });
}

const acknowledgementSchema = z.strictObject({
  responseId: idSchema,
  attemptId: idSchema,
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request))
    return new Response("Cross-origin request denied.", { status: 403 });
  const conversationId = idSchema.safeParse((await params).id);
  if (!conversationId.success)
    return new Response("Invalid acknowledgement.", { status: 400 });
  try {
    await authorizeConversation(request, conversationId.data);
  } catch (error) {
    return authErrorResponse(error);
  }
  const input = acknowledgementSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!input.success)
    return new Response("Invalid acknowledgement.", { status: 400 });
  const outcome = acknowledgeChatStream(
    conversationId.data,
    input.data.responseId,
    input.data.attemptId,
  );
  if (outcome === "acknowledged") return new Response(null, { status: 204 });
  return Response.json(
    {
      outcome,
      message:
        outcome === "failed"
          ? getChatStream(conversationId.data)?.persistenceError
          : undefined,
    },
    { status: outcome === "failed" || outcome === "pending" ? 409 : 404 },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request))
    return new Response("Cross-origin request denied.", { status: 403 });
  const conversationId = idSchema.safeParse((await params).id);
  if (!conversationId.success)
    return new Response("Invalid persistence retry.", { status: 400 });
  let data: DataAdapter;
  try {
    data = await authorizeConversation(request, conversationId.data);
  } catch (error) {
    return authErrorResponse(error);
  }
  const input = acknowledgementSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!input.success)
    return new Response("Invalid persistence retry.", { status: 400 });
  const stream = getChatStream(conversationId.data);
  if (
    stream?.responseId === input.data.responseId &&
    stream.attemptId === input.data.attemptId &&
    stream.persistence === "startup_failed"
  )
    return Response.json(
      {
        saved: false,
        message:
          "This attempt failed before producing a result; retry generation instead.",
      },
      { status: 409 },
    );
  if (
    !stream ||
    stream.responseId !== input.data.responseId ||
    stream.attemptId !== input.data.attemptId ||
    !stream.persistenceSnapshot
  )
    return new Response("Response recovery state was not found.", {
      status: 404,
    });
  const result = await persistGeneratedResponse(data, conversationId.data, {
    ...stream.persistenceSnapshot,
    attemptId: stream.attemptId,
  });
  setChatStreamPersistence(stream, stream.persistenceSnapshot, result);
  return Response.json(result, { status: result.saved ? 200 : 409 });
}
