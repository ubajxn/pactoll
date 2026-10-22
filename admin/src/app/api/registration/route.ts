import { getRegistrationStatus } from "@/lib/api/singleton";

export const runtime = "nodejs";

export async function GET() {
  const status = await getRegistrationStatus();
  return Response.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
