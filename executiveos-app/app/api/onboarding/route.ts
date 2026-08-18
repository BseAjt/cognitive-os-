import { createClient } from "@/lib/supabase/server";
import { scoreDecisionAssessment, validateAssessmentAnswers, type AssessmentAnswer } from "@/lib/decision-thinking-profile";

const headers={"Cache-Control":"private, no-store"};
function json(body:unknown,status=200){return Response.json(body,{status,headers});}

export async function POST(request:Request){
  const client=await createClient(); if(!client)return json({error:"cloud_not_configured"},503);
  const {data:{user}}=await client.auth.getUser(); if(!user)return json({error:"unauthorized"},401);
  const input=await request.json().catch(()=>null) as {organizationName?:string;displayName?:string;assessmentAnswers?:AssessmentAnswer[]}|null;
  const organizationName=input?.organizationName?.trim()??""; const displayName=input?.displayName?.trim()??"";
  if(organizationName.length<2 || organizationName.length>80 || displayName.length<2 || displayName.length>80)return json({error:"invalid_input"},400);
  const {data,error}=await client.rpc("bootstrap_organization",{p_name:organizationName,p_display_name:displayName});
  if(error)return json({error:error.code==="P0001"?"already_initialized":"creation_failed"},error.code==="P0001"?409:500);
  const row=Array.isArray(data)?data[0]:data;
  if(!row)return json({error:"creation_failed"},500);
  let profileWarning:string|undefined;
  if(validateAssessmentAnswers(input?.assessmentAnswers??[])){
    const profile=scoreDecisionAssessment(input!.assessmentAnswers!);
    const {error:profileError}=await client.from("user_decision_profiles").upsert({organization_id:row.organization_id,user_id:user.id,disc_primary:profile.discPrimary,disc_secondary:profile.discSecondary,disc_adapted:profile.discPrimary,disc_scores:profile.discScores,dimension_scores:profile.dimensions,confidence:profile.confidence,evidence_count:profile.evidenceCount,assessment_answers:input!.assessmentAnswers,source:"self_assessment",updated_at:new Date().toISOString()},{onConflict:"organization_id,user_id"});
    if(profileError){
      profileWarning="profile_creation_deferred";
      console.error("[api/onboarding] decision profile creation deferred",{organizationId:row.organization_id,userId:user.id,errorCode:profileError.code});
    }
  }
  const now=row.organization_created_at;
  return json({organization:{id:row.organization_id,name:row.organization_name,slug:row.organization_slug,plan:row.organization_plan,createdAt:now,updatedAt:now},member:{id:row.member_id,organizationId:row.organization_id,userId:user.id,displayName:displayName,email:user.email??"",role:"owner",status:"active",joinedAt:row.member_joined_at},warning:profileWarning});
}
