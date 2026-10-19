export function GET() {
  return Response.json(
    { data: { status: "ok", service: "spotted", scope: "application" } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
