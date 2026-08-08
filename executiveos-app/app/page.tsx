import { ExecutiveHomeV4 } from "@/components/executive-home-v4";
import { LiveMemoryDock } from "@/components/live-memory-dock";
import { OrionCyclesDock } from "@/components/orion-cycles-dock";
import { CloudWorkspaceGate } from "@/components/cloud-workspace-gate";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const client=await createClient();
  const {data:{user}}=client ? await client.auth.getUser() : {data:{user:null}};
  let membership=null;
  if(client && user){
    const result=await client.from("organization_members")
      .select("id,organization_id,user_id,display_name,email,role,status,joined_at,organizations(id,name,slug,plan,created_at,updated_at)")
      .eq("user_id",user.id).eq("status","active").order("joined_at",{ascending:true}).limit(1).maybeSingle();
    membership=result.data;
  }
  return <CloudWorkspaceGate user={user ? {id:user.id,email:user.email??""} : null} membership={membership as never}>
    <ExecutiveHomeV4 />
    <LiveMemoryDock />
    <OrionCyclesDock />
  </CloudWorkspaceGate>;
}
