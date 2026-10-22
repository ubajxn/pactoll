import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Server-only provider selection. Replace this factory with any AI SDK model. */
export function getChatModel() {
  const provider = createOpenAICompatible({
    name: "crm-model",
    baseURL: process.env.AI_BASE_URL || "http://localhost:1234/v1",
    apiKey: process.env.AI_API_KEY || undefined,
  });
  return provider.chatModel(process.env.AI_MODEL || "qwen/qwen3.8-27b");
}
