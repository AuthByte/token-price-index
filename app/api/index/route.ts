import { getIndexSnapshot } from "@/lib/get-index";

export async function GET() {
  const snapshot = await getIndexSnapshot();
  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
