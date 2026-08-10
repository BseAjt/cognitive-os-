import { redirect } from "next/navigation";
import { CloudSignIn } from "@/components/cloud-sign-in";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function SignInPage({ searchParams }:{ searchParams:Promise<{ next?:string }> }) {
  const requestedNext=(await searchParams).next;
  const nextPath=requestedNext?.startsWith("/")&&!requestedNext.startsWith("//")?requestedNext:"/";
  if (!isSupabaseConfigured()) return <CloudSignIn configured={false} nextPath={nextPath}/>;
  const client = await createClient();
  const { data:{ user } } = await client!.auth.getUser();
  if (user) redirect(nextPath);
  return <CloudSignIn configured nextPath={nextPath}/>;
}
