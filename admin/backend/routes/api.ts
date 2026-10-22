import {
  type DataAdapter,
  DataError,
  type ErrorCode,
  type RecordKind,
  recordKinds,
} from "../../src/lib/data/contracts";

const statusCodes: Record<ErrorCode, number> = {
  unauthorized: 401,
  workspace_required: 409,
  validation: 400,
  not_found: 404,
  conflict: 409,
  server: 500,
  unavailable: 503,
  forbidden: 403,
  unsupported_media_type: 415,
};
export function createHandler(
  resolveAdapter: DataAdapter | ((request: Request) => Promise<DataAdapter>),
  allowedOrigins: string[],
) {
  const origins = new Set(allowedOrigins);
  return async (request: Request): Promise<Response> => {
    const headers = new Headers({
      "Cache-Control": "no-store",
      Vary: "Origin",
    });
    try {
      const url = new URL(request.url);
      if (
        process.env.NODE_ENV !== "production" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
        throw new DataError("forbidden", "Only loopback hosts are allowed");
      const origin = request.headers.get("origin");
      if (origin && !origins.has(origin))
        throw new DataError("forbidden", "Origin is not allowed");
      if (origin) headers.set("Access-Control-Allow-Origin", origin);
      if (request.method === "OPTIONS") {
        headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PATCH, DELETE, OPTIONS",
        );
        headers.set("Access-Control-Allow-Headers", "Content-Type");
        return new Response(null, { status: 204, headers });
      }
      const path = url.pathname
        .split("/")
        .filter(Boolean)
        .map(decodeURIComponent);
      if (request.method === "GET" && url.pathname === "/api/health")
        return Response.json(
          { status: "ok", service: "crm", version: 1 },
          { headers },
        );
      if (path[0] !== "api")
        throw new DataError("not_found", "Route not found");
      const adapter =
        typeof resolveAdapter === "function"
          ? await resolveAdapter(request)
          : resolveAdapter;
      const [, kind, id, nested, childId] = path;
      let payload: never = undefined as never;
      if (["POST", "PATCH", "DELETE"].includes(request.method)) {
        if (
          request.headers
            .get("content-type")
            ?.split(";")[0]
            .trim()
            .toLowerCase() !== "application/json"
        )
          throw new DataError(
            "unsupported_media_type",
            "Mutations require application/json",
          );
        if (request.method !== "DELETE") {
          try {
            payload = (await request.json()) as never;
          } catch {
            throw new DataError("validation", "Invalid JSON body");
          }
        }
      }
      let result: unknown;
      const method = request.method;
      let matched = true;
      if (kind === "lists") {
        if (path.length === 2 && method === "GET")
          result = await adapter.listLists();
        else if (path.length === 2 && method === "POST")
          result = await adapter.createList(payload);
        else if (path.length === 3 && method === "GET")
          result = await adapter.getList(id);
        else if (path.length === 3 && method === "PATCH")
          result = await adapter.updateList(id, payload);
        else if (path.length === 3 && method === "DELETE")
          result = await adapter.deleteList(id);
        else if (path.length === 4 && nested === "records" && method === "POST")
          result = await adapter.addToList(id, payload);
        else if (
          path.length === 5 &&
          nested === "records" &&
          method === "DELETE"
        )
          result = await adapter.removeFromList(id, childId);
        else matched = false;
      } else if (kind === "members") {
        if (path.length === 2 && method === "GET")
          result = await adapter.listMembers();
        else matched = false;
      } else if (recordKinds.includes(kind as RecordKind)) {
        const type = kind as RecordKind;
        if (path.length === 2 && method === "GET")
          result = await adapter.list(type);
        else if (path.length === 2 && method === "POST")
          result = await adapter.create(type, payload, {
            listId: url.searchParams.get("listId") ?? undefined,
          });
        else if (path.length === 3 && method === "GET")
          result = await adapter.get(type, id);
        else if (path.length === 3 && method === "PATCH")
          result = await adapter.update(type, id, payload);
        else if (path.length === 3 && method === "DELETE")
          result = await adapter.delete(type, id);
        else if (path.length === 4 && nested === "activity" && method === "GET")
          result = await adapter.listActivity(type, id);
        else if (path.length === 4 && nested === "notes" && method === "GET")
          result = (await adapter.get(type, id)).notes;
        else if (path.length === 4 && nested === "notes" && method === "POST")
          result = await adapter.addNote(type, id, payload);
        else if (path.length === 5 && nested === "notes" && method === "PATCH")
          result = await adapter.updateNote(type, id, childId, payload);
        else if (path.length === 5 && nested === "notes" && method === "DELETE")
          result = await adapter.deleteNote(type, id, childId);
        else matched = false;
      } else if (kind === "conversations") {
        if (path.length === 2 && method === "GET")
          result = await adapter.listConversations();
        else if (path.length === 2 && method === "POST")
          result = await adapter.createConversation(payload);
        else if (path.length === 3 && method === "GET")
          result = await adapter.getConversation(id);
        else if (path.length === 3 && method === "PATCH")
          result = await adapter.updateConversation(id, payload);
        else if (path.length === 3 && method === "DELETE")
          result = await adapter.deleteConversation(id);
        else if (path.length === 4 && nested === "sharing" && method === "GET")
          result = await adapter.listConversationShares(id);
        else if (path.length === 4 && nested === "sharing" && method === "POST")
          result = await adapter.shareConversation(id, payload);
        else if (
          path.length === 5 &&
          nested === "sharing" &&
          method === "DELETE"
        )
          result = await adapter.unshareConversation(id, childId);
        else if (path.length === 4 && nested === "messages" && method === "GET")
          result = await adapter.listMessages(id);
        else if (
          path.length === 4 &&
          nested === "messages" &&
          method === "POST"
        )
          result = await adapter.appendMessage(id, payload);
        else if (
          path.length === 5 &&
          nested === "messages" &&
          method === "PATCH"
        )
          result = await adapter.updateMessage(id, childId, payload);
        else if (
          path.length === 4 &&
          nested === "generations" &&
          method === "POST"
        )
          result = await adapter.beginAssistantGeneration(id, payload);
        else if (
          path.length === 5 &&
          nested === "generations" &&
          method === "PATCH"
        )
          result = await adapter.saveAssistantGeneration(id, childId, payload);
        else if (
          path.length === 4 &&
          nested === "mutations" &&
          method === "POST"
        )
          result = await adapter.applyChatMutation(id, payload);
        else matched = false;
      } else matched = false;
      if (!matched)
        throw new DataError("not_found", "Route or method not found");
      return result === undefined
        ? new Response(null, { status: 204, headers })
        : Response.json(result, {
            status: method === "POST" ? 201 : 200,
            headers,
          });
    } catch (error) {
      const safe =
        error instanceof URIError
          ? new DataError("validation", "Invalid URL encoding")
          : error instanceof DataError
            ? error
            : new DataError(
                "server",
                "The CRM service could not complete the request",
              );
      if (!(error instanceof DataError)) console.error(error);
      return Response.json(
        { error: { code: safe.code, message: safe.message } },
        { status: statusCodes[safe.code], headers },
      );
    }
  };
}
