"use client";

import { useState } from "react";
import { unresolvedComments } from "@/lib/collaboration";
import { useExecutiveStore } from "@/store/executive-store";

export function CollaborationPanel({ caseId }: { caseId:string }) {
  const store=useExecutiveStore(); const [body,setBody]=useState("");
  const comments=unresolvedComments(store.collaborationComments,caseId);
  const memberById=new Map(store.organizationMembers.map((item)=>[item.id,item]));
  function submit(){ const clean=body.trim(); if(!clean)return; store.addComment({caseId,targetType:"case",targetId:caseId,body:clean}); setBody(""); }
  return <div className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#9d83ff]">B9 · Collaboration</div><h3 className="mt-2 text-xl font-semibold">Salle de décision partagée</h3></div><span className="rounded-full border border-white/[.08] px-3 py-1 text-xs text-[#71839e]">{comments.length} discussion(s) ouverte(s)</span></div>
    <div className="mt-4 flex gap-2"><input aria-label="Nouveau commentaire" value={body} onChange={(event)=>setBody(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter")submit();}} placeholder="Ajouter une question, une objection ou une validation…" className="min-w-0 flex-1 rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-3 text-sm outline-none"/><button onClick={submit} className="rounded-xl bg-[#7c5cff] px-4 py-2 text-xs font-bold">Commenter</button></div>
    <div className="mt-4 space-y-2">{comments.map((comment)=><article key={comment.id} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{memberById.get(comment.authorMemberId)?.displayName ?? "Membre"}</strong><button onClick={()=>store.resolveComment(comment.id)} className="text-[10px] font-semibold text-[#9d83ff]">Marquer résolu</button></div><p className="mt-2 text-sm leading-6 text-[#91a2bd]">{comment.body}</p><time className="mt-2 block text-[10px] text-[#667995]">{new Date(comment.createdAt).toLocaleString("fr-FR")}</time></article>)}{!comments.length&&<p className="text-sm text-[#71839e]">Aucune discussion ouverte sur ce dossier.</p>}</div>
  </div>;
}
