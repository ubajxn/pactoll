import { DataError } from "@/lib/data/contracts";
import { getContext } from "@/lib/api/singleton";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getContext(request);
    return Response.json(context, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof DataError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        {
          status: error.code === "unauthorized" ? 401 : 409,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
    console.error("Session lookup failed");
    return Response.json(
      { error: { code: "unavailable", message: "Could not check your session" } },
      { status: 503 },
    );
  }
}
