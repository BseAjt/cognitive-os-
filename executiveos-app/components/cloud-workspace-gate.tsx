"use client";

import { useEffect, useState } from "react";
import { ProductOnboarding } from "@/components/product-onboarding";
import { useExecutiveStore } from "@/store/executive-store";

type Membership={id:string;organization_id:string;user_id:string;display_name:string;email:string;role:"owner"|"admin"|"member"|"viewer";status:"active"|"suspended";joined_at:string;organizations:{id:string;name:string;slug:string;plan:"demo"|"team"|"enterprise";created_at:string;updated_at:string}|null};

export function CloudWorkspaceGate({user,membership,children}:{user:{id:string;email:string}|null;membership:Membership|null;children:React.ReactNode}){
  const [demoOpen,setDemoOpen]=useState(false);
  const activate=useExecutiveStore((state)=>state.activateCloudOrganization);
  const loadInvestorDemo=useExecutiveStore((state)=>state.loadInvestorDemo);

  useEffect(()=>{
    const organization=membership?.organizations;
    if(!membership || !organization)return;
    activate({
      organization:{id:organization.id,name:organization.name,slug:organization.slug,plan:organization.plan,createdAt:organization.created_at,updatedAt:organization.updated_at},
      member:{id:membership.id,organizationId:membership.organization_id,userId:membership.user_id,displayName:membership.display_name,email:membership.email,role:membership.role,status:membership.status,joinedAt:membership.joined_at}
    });
  },[activate,membership]);

  if(user && !membership)return <ProductOnboarding email={user.email}/>;
  if(user && membership)return children;
  if(demoOpen)return children;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f3ee] p-6 text-[#1d1d1f]">
      <section className="w-full max-w-3xl rounded-[36px] border border-black/10 bg-white/85 p-8 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-12">
        <span className="text-xs font-black uppercase tracking-[.22em] text-[#0066cc]">ExecutiveOS</span>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-.04em] sm:text-6xl">
          Décidez avec votre expérience, sans répéter vos erreurs.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#59636f] sm:text-lg">
          Découvrez ExecutiveOS avec un cas fictif ou connectez-vous pour retrouver vos décisions, votre profil et vos apprentissages.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={()=>{loadInvestorDemo();setDemoOpen(true);}}
            className="rounded-3xl border border-black/10 bg-[#fff8e7] p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="block text-xs font-black uppercase tracking-[.16em] text-[#9a4d09]">Découvrir</span>
            <strong className="mt-3 block text-xl">Explorer la démo</strong>
            <span className="mt-2 block text-sm leading-6 text-[#6f3b0b]">Données fictives de Claire, dirigeante d’une ETI industrielle. Rien n’est enregistré comme donnée personnelle.</span>
          </button>
          <a
            href="/sign-in"
            className="rounded-3xl bg-[#0071e3] p-6 text-left text-white transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="block text-xs font-black uppercase tracking-[.16em] text-white/70">Travailler</span>
            <strong className="mt-3 block text-xl">Me connecter</strong>
            <span className="mt-2 block text-sm leading-6 text-white/85">Retrouver mes décisions, mon profil personnalisé et la synchronisation sécurisée.</span>
          </a>
        </div>
        <p className="mt-6 text-center text-xs leading-5 text-[#6e6e73]">
          L’usage personnel nécessite un compte. La démo utilise exclusivement des informations fictives.
        </p>
      </section>
    </main>
  );
}
