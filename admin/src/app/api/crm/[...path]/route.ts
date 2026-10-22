import { getCrmHandler } from "@/lib/api/singleton";

export const runtime = "nodejs";

async function handler(request: Request) {
  const url = new URL(request.url);
  const rewritten = new URL(
    url.pathname.replace(/^\/api\/crm/, "/api"),
    url.origin,
  );
  rewritten.search = url.search;
  const forwarded = new Request(rewritten, request);
  const h = await getCrmHandler();
  return h(forwarded);
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
};
