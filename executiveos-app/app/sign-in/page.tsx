import { redirect } from "next/navigation";
import { CloudSignIn } from "@/components/cloud-sign-in";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function SignInPage() {
  if (!isSupabaseConfigured()) return <CloudSignIn configured={false}/>;
  const client = await createClient();
  const { data:{ user } } = await client!.auth.getUser();
  if (user) redirect("/");
  return <CloudSignIn configured/>;
}
