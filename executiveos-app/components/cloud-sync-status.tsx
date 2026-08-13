"use client";
import { useEffect,useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { readLocalSnapshot,type CloudSnapshot } from "@/lib/cloud-sync";
import { useExecutiveStore } from "@/store/executive-store";

type Status="checking"|"local"|"ready"|"syncing"|"synced"|"conflict"|"error";

export function CloudSyncStatus(){
  const [status,setStatus]=useState<Status>("checking"); const [revision,setRevision]=useState(0); const [userEmail,setUserEmail]=useState("");
  useEffect(()=>{const client=createClient();if(!client){setStatus("local");return;}client.auth.getUser().then(({data})=>{if(data.user){setUserEmail(data.user.email??"");setStatus("ready");}else setStatus("local");}).catch(()=>setStatus("error"));},[]);
  useEffect(()=>{const listener=()=>void sync();window.addEventListener("executiveos:sync",listener);return()=>window.removeEventListener("executiveos:sync",listener);});
  async function sync(){
    setStatus("syncing");
    const organizationId=useExecutiveStore.getState().activeOrganizationId;
    if(!organizationId){setStatus("error");return;}
    const remote=await fetch(`/api/cloud/workspace?organizationId=${encodeURIComponent(organizationId)}`,{cache:"no-store"});
    if(remote.status===401){setStatus("local");return;}
    if(!remote.ok){setStatus("error");return;}
    const {snapshot}=await remote.json() as {snapshot:CloudSnapshot|null};
    if(snapshot && revision===0){useExecutiveStore.setState(snapshot.payload);setRevision(snapshot.revision);setStatus("synced");return;}
    const local=readLocalSnapshot(localStorage);
    if(!local||!organizationId){setStatus("error");return;}
    const saved=await fetch("/api/cloud/workspace",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({organizationId,revision,payload:local})});
    if(saved.status===409){setStatus("conflict");return;}
    if(!saved.ok){setStatus("error");return;}
    const body=await saved.json() as {snapshot:{revision:number}};setRevision(body.snapshot.revision);setStatus("synced");
  }
  async function signOut(){const client=createClient();await client?.auth.signOut();location.reload();}
  const labels:Record<Status,string>={checking:"Cloud…",local:"Démo · données fictives",ready:"Cloud disponible",syncing:"Synchronisation…",synced:`Synchronisé · v${revision}`,conflict:"Conflit à résoudre",error:"Cloud indisponible"};
  return <aside aria-live="polite" className="fixed right-3 top-[4.5rem] z-40 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full border border-black/10 bg-[#fbfaf7]/95 p-1.5 pl-3 text-xs text-[#3a3a3c] shadow-md shadow-black/5 backdrop-blur-xl sm:right-4 lg:top-4"><span className={`size-2 shrink-0 rounded-full ${status==="synced"?"bg-emerald-600":status==="conflict"||status==="error"?"bg-amber-600":status==="local"?"bg-zinc-500":"bg-[#007aff]"}`}/><span className="hidden sm:inline" title={userEmail}>{labels[status]}</span>{status==="local"?<a href="/sign-in" className="min-h-10 rounded-full bg-black px-3 py-2 font-semibold text-white"><span className="sm:hidden">Connexion</span><span className="hidden sm:inline">Se connecter</span></a>:<><button onClick={sync} disabled={status==="syncing"} className="min-h-10 rounded-full bg-[#007aff] px-3 py-2 font-semibold text-white disabled:opacity-50">Sync</button><button onClick={signOut} aria-label="Se déconnecter" className="min-h-10 rounded-full px-2 py-2 text-[#6e6e73]">Quitter</button></>}</aside>;
}
