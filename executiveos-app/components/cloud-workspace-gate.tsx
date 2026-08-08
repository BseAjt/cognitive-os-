"use client";

import { useEffect } from "react";
import { ProductOnboarding } from "@/components/product-onboarding";
import { useExecutiveStore } from "@/store/executive-store";

type Membership={id:string;organization_id:string;user_id:string;display_name:string;email:string;role:"owner"|"admin"|"member"|"viewer";status:"active"|"suspended";joined_at:string;organizations:{id:string;name:string;slug:string;plan:"demo"|"team"|"enterprise";created_at:string;updated_at:string}|null};

export function CloudWorkspaceGate({user,membership,children}:{user:{id:string;email:string}|null;membership:Membership|null;children:React.ReactNode}){
  const activate=useExecutiveStore((state)=>state.activateCloudOrganization);
  useEffect(()=>{
    const organization=membership?.organizations;
    if(!membership || !organization)return;
    activate({
      organization:{id:organization.id,name:organization.name,slug:organization.slug,plan:organization.plan,createdAt:organization.created_at,updatedAt:organization.updated_at},
      member:{id:membership.id,organizationId:membership.organization_id,userId:membership.user_id,displayName:membership.display_name,email:membership.email,role:membership.role,status:membership.status,joinedAt:membership.joined_at}
    });
  },[activate,membership]);
  if(user && !membership)return <ProductOnboarding email={user.email}/>;
  return children;
}
