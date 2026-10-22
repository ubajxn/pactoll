import { type DataAdapter, DataError, type ErrorResponse } from "./contracts";

export function createHttpAdapter(
  baseUrl: string,
  fetcher: (input: string, init?: RequestInit) => Promise<Response> = fetch,
): DataAdapter {
  const base = baseUrl.replace(/\/$/, "");
  const part = encodeURIComponent;
  async function request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetcher(`${base}${path}`, {
        method,
        headers: method === "GET" ? {} : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
        credentials: "include",
      });
    } catch {
      throw new DataError(
        "unavailable",
        `CRM service unavailable at ${base}. Start the backend and retry; changes were not saved locally.`,
      );
    }
    if (!response.ok) {
      let error: ErrorResponse;
      try {
        error = await response.json();
      } catch {
        throw new DataError(
          "server",
          `CRM API returned HTTP ${response.status}`,
        );
      }
      throw new DataError(
        error.error?.code || "server",
        error.error?.message || `CRM API returned HTTP ${response.status}`,
      );
    }
    if (response.status === 204) return undefined as T;
    try {
      return (await response.json()) as T;
    } catch {
      throw new DataError("server", "CRM API returned an invalid response");
    }
  }
  const record = (kind: string, id: string) => `/${kind}/${part(id)}`;
  const conversation = (id: string) => `/conversations/${part(id)}`;
  return {
    listLists: () => request("/lists"),
    getList: (id) => request(`/lists/${part(id)}`),
    createList: (input) => request("/lists", "POST", input),
    updateList: (id, input) => request(`/lists/${part(id)}`, "PATCH", input),
    deleteList: (id) => request(`/lists/${part(id)}`, "DELETE"),
    addToList: (id, input) =>
      request(`/lists/${part(id)}/records`, "POST", input),
    removeFromList: (id, recordId) =>
      request(`/lists/${part(id)}/records/${part(recordId)}`, "DELETE"),
    listMembers: () => request("/members"),
    list: (kind) => request(`/${kind}`),
    get: (kind, id) => request(record(kind, id)),
    create: (kind, input, options) =>
      request(
        `/${kind}${options?.listId !== undefined ? `?listId=${part(options.listId)}` : ""}`,
        "POST",
        input,
      ),
    update: (kind, id, input) => request(record(kind, id), "PATCH", input),
    delete: (kind, id) => request(record(kind, id), "DELETE"),
    addNote: (kind, id, input) =>
      request(`${record(kind, id)}/notes`, "POST", input),
    updateNote: (kind, id, noteId, input) =>
      request(`${record(kind, id)}/notes/${part(noteId)}`, "PATCH", input),
    deleteNote: (kind, id, noteId) =>
      request(`${record(kind, id)}/notes/${part(noteId)}`, "DELETE"),
    listActivity: (kind, id) => request(`${record(kind, id)}/activity`),
    listConversations: () => request("/conversations"),
    getConversation: (id) => request(conversation(id)),
    createConversation: (input) => request("/conversations", "POST", input),
    updateConversation: (id, input) =>
      request(conversation(id), "PATCH", input),
    deleteConversation: (id) => request(conversation(id), "DELETE"),
    listConversationShares: (id) => request(`${conversation(id)}/sharing`),
    shareConversation: (id, input) =>
      request(`${conversation(id)}/sharing`, "POST", input),
    unshareConversation: (id, memberId) =>
      request(`${conversation(id)}/sharing/${part(memberId)}`, "DELETE"),
    listMessages: (id) => request(`${conversation(id)}/messages`),
    appendMessage: (id, input) =>
      request(`${conversation(id)}/messages`, "POST", input),
    updateMessage: (id, messageId, input) =>
      request(
        `${conversation(id)}/messages/${part(messageId)}`,
        "PATCH",
        input,
      ),
    beginAssistantGeneration: (id, input) =>
      request(`${conversation(id)}/generations`, "POST", input),
    saveAssistantGeneration: (id, responseId, input) =>
      request(
        `${conversation(id)}/generations/${part(responseId)}`,
        "PATCH",
        input,
      ),
    applyChatMutation: (id, input) =>
      request(`${conversation(id)}/mutations`, "POST", input),
  };
}
