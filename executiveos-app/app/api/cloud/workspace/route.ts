import { createClient } from "@/lib/supabase/server";

const headers = { "Cache-Control": "private, no-store" };
function json(body: unknown, status = 200) { return Response.json(body, { status, headers }); }

export async function GET(request: Request) {
  const client = await createClient();
  if (!client) return json({ error: "cloud_not_configured" }, 503);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  const organizationId=new URL(request.url).searchParams.get("organizationId");
  if(!organizationId)return json({error:"organization_required"},400);
  const { data, error } = await client.from("workspace_snapshots").select("organization_id,revision,payload,updated_at").eq("organization_id",organizationId).maybeSingle();
  if (error) return json({ error: "read_failed" }, 500);
  return json({ snapshot:data ?? null });
}

export async function PUT(request: Request) {
  const client = await createClient();
  if (!client) return json({ error: "cloud_not_configured" }, 503);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  const contentLength=Number(request.headers.get("content-length")??0);
  if(contentLength>5_000_000)return json({error:"snapshot_too_large"},413);
  const input = await request.json().catch(() => null) as { organizationId?:string; revision?:number; payload?:unknown } | null;
  if (!input?.organizationId || !Number.isInteger(input.revision) || !input.payload) return json({ error:"invalid_snapshot" }, 400);
  const { data:member } = await client.from("organization_members").select("id").eq("organization_id",input.organizationId).eq("user_id",user.id).eq("status","active").maybeSingle();
  if (!member) return json({ error:"forbidden" }, 403);
  const { data,error } = await client.rpc("save_workspace_snapshot",{p_organization_id:input.organizationId,p_expected_revision:input.revision,p_payload:input.payload,p_updated_by:member.id});
  if (error?.code==="40001") return json({ error:"revision_conflict" },409);
  if (error) return json({ error:"write_failed" },500);
  return json({ snapshot:Array.isArray(data)?data[0]:data });
}
