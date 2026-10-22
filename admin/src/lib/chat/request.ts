import { z } from "zod";
import { idSchema } from "@/lib/data/contracts";

export const chatRequestSchema = z.strictObject({
  conversationId: idSchema,
  responseId: idSchema.optional(),
  attemptId: idSchema,
  expectedAttemptId: idSchema.optional(),
  mode: z.enum(["append", "replace"]),
  startedAt: z.iso.datetime().optional(),
  messages: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        role: z.enum(["user", "assistant"]),
        parts: z.array(z.unknown()).max(100),
      }),
    )
    .min(1)
    .max(100),
});
