import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/api/singleton";

export const runtime = "nodejs";

async function handler(request: Request) {
  const auth = await getAuth();
  const wrapped = toNextJsHandler(auth);
  const method = request.method.toUpperCase();
  const fn =
    method === "GET"
      ? wrapped.GET
      : method === "POST"
        ? wrapped.POST
        : method === "PATCH"
          ? wrapped.PATCH
          : method === "PUT"
            ? wrapped.PUT
            : method === "DELETE"
              ? wrapped.DELETE
              : null;
  if (!fn) return new Response("Method not allowed", { status: 405 });
  return fn(request);
}

export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
