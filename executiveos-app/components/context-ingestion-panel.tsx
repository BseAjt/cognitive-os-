"use client";

import { useMemo, useRef, useState } from "react";
import { sourceCitation, synthesizeCaseContext } from "@/lib/context-ingestion";
import { retrieveCaseContext } from "@/lib/cognitive-retrieval";
import { useExecutiveStore } from "@/store/executive-store";
import type { ContextSourceType } from "@/domain/canonical";

const ACCEPTED_EXTENSIONS=["txt","md","markdown","csv","json","html"];

export function ContextIngestionPanel({caseId}:{caseId:string}) {
  const store=useExecutiveStore();
  const fileRef=useRef<HTMLInputElement>(null);
  const [mode,setMode]=useState<"note"|"url"|"document">("note");
  const [title,setTitle]=useState("");
  const [origin,setOrigin]=useState("");
  const [content,setContent]=useState("");
  const [query,setQuery]=useState("");
  const [error,setError]=useState("");
  const sources=store.contextSources.filter((item)=>item.caseId===caseId);
  const evidence=store.contextEvidence.filter((item)=>item.caseId===caseId);
  const synthesis=store.contextSyntheses.find((item)=>item.caseId===caseId)??synthesizeCaseContext(caseId,sources,evidence);
  const totalWords=useMemo(()=>sources.reduce((sum,item)=>sum+item.wordCount,0),[sources]);
  const retrieval=useMemo(()=>retrieveCaseContext(caseId,query,sources,evidence),[caseId,query,sources,evidence]);

  function ingest() {
    try {
      setError("");
      store.ingestContextSource({caseId,type:mode,title:title.trim()||fallbackTitle(mode,origin),origin:origin.trim(),content});
      setTitle("");setOrigin("");setContent("");
    } catch(value) { setError(value instanceof Error?value.message:"Impossible d’analyser cette source."); }
  }

  async function selectFile(file:File|undefined) {
    if(!file)return;
    const extension=file.name.split(".").pop()?.toLowerCase()??"";
    if(!ACCEPTED_EXTENSIONS.includes(extension)){setError("Format non pris en charge dans B7.1. Utilise TXT, Markdown, CSV, JSON ou HTML.");return;}
    if(file.size>2_000_000){setError("Le fichier dépasse la limite de 2 Mo.");return;}
    setMode("document");setTitle(file.name);setOrigin(file.name);setContent(await file.text());setError("");
  }

  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
    <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5">
      <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#9d83ff]">Ajouter au contexte</div><h3 className="mt-2 text-xl font-semibold">Une source, une provenance</h3></div><span className="rounded-full bg-[#42d59d]/10 px-3 py-1 text-[10px] text-[#7ce6bb]">B7.1</span></div>
      <div className="mt-4 flex gap-2">{(["note","url","document"] as const).map((item)=><button key={item} onClick={()=>setMode(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode===item?"bg-[#7c5cff] text-white":"bg-white/[.04] text-[#91a2bd]"}`}>{item==="note"?"Texte":item==="url"?"URL":"Fichier"}</button>)}</div>
      {mode==="document"&&<><input ref={fileRef} type="file" accept=".txt,.md,.markdown,.csv,.json,.html,text/plain,text/markdown,text/csv,application/json,text/html" onChange={(event)=>selectFile(event.target.files?.[0])} className="hidden"/><button onClick={()=>fileRef.current?.click()} className="mt-4 w-full rounded-xl border border-dashed border-[#7c5cff]/45 bg-[#7c5cff]/[.06] px-4 py-5 text-sm text-[#c8c0ff]">Choisir un fichier textuel · 2 Mo max</button></>}
      <label className="mt-4 block text-xs text-[#91a2bd]">Titre<input value={title} onChange={(event)=>setTitle(event.target.value)} placeholder="Ex. Compte rendu COMEX" className="mt-2 w-full rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-sm text-white outline-none"/></label>
      {mode==="url"&&<label className="mt-3 block text-xs text-[#91a2bd]">URL<input value={origin} onChange={(event)=>setOrigin(event.target.value)} placeholder="https://…" type="url" className="mt-2 w-full rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-sm text-white outline-none"/></label>}
      <label className="mt-3 block text-xs text-[#91a2bd]">Contenu à analyser<textarea value={content} onChange={(event)=>setContent(event.target.value)} placeholder={mode==="url"?"Colle le contenu utile de la page pour conserver une preuve stable…":"Colle une note, un message ou un compte rendu…"} className="mt-2 min-h-36 w-full resize-y rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-sm leading-6 text-white outline-none"/></label>
      {error&&<p role="alert" className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">{error}</p>}
      <button onClick={ingest} disabled={!content.trim()} className="mt-4 w-full rounded-xl bg-[#7c5cff] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Analyser et rattacher au dossier</button>
    </article>

    <div className="space-y-5">
      <article className="rounded-[26px] border border-[#7c5cff]/25 bg-[linear-gradient(135deg,rgba(124,92,255,.11),rgba(13,25,43,.94))] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#b7a9ff]">Synthèse sourcée</div><span className="text-xs text-[#8294af]">{sources.length} source(s) · {totalWords} mots</span></div>
        <p className="mt-3 text-sm leading-7 text-[#d8e0ed]">{synthesis.summary}</p>
        {!!synthesis.keyFacts.length&&<div className="mt-4 grid gap-2">{synthesis.keyFacts.slice(0,5).map((fact,index)=>{const item=evidence.find((candidate)=>candidate.claim===fact);return <div key={`${fact}-${index}`} className="rounded-xl border border-white/[.07] bg-black/10 p-3 text-sm leading-6"><span className="mr-2 rounded bg-[#7c5cff]/20 px-2 py-1 text-[10px] font-black text-[#c8c0ff]">{item?sourceCitation(item.sourceId,sources):"S?"}</span>{fact}</div>;})}</div>}
      </article>
      <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#42d59d]">Cognitive Retrieval</div><h3 className="mt-2 text-lg font-semibold">Interroger les preuves du dossier</h3></div><span className="rounded-full bg-[#42d59d]/10 px-3 py-1 text-[10px] text-[#7ce6bb]">B7.2 · Hybride</span></div>
        <div className="mt-4 flex gap-2"><label className="sr-only" htmlFor={`retrieval-${caseId}`}>Question sur le contexte</label><input id={`retrieval-${caseId}`} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Ex. Quel budget a été confirmé ?" className="min-w-0 flex-1 rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-sm text-white outline-none focus:border-[#42d59d]/50"/><button onClick={()=>setQuery("")} disabled={!query} className="rounded-xl border border-white/[.08] px-3 text-xs text-[#91a2bd] disabled:opacity-30">Effacer</button></div>
        {query.trim()?<div className="mt-4 space-y-3">{retrieval.hits.length?retrieval.hits.map((hit)=><div key={hit.evidenceId} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded bg-[#42d59d]/15 px-2 py-1 text-[10px] font-black text-[#7ce6bb]">{hit.citation}</span><strong className="text-xs text-[#cbd5e5]">{hit.title}</strong></div><span className="text-[10px] font-semibold text-[#9d83ff]">Pertinence {hit.score}%</span></div><p className="mt-3 text-sm leading-6 text-[#d8e0ed]">{hit.excerpt}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#71839e]"><span>Lexical {hit.lexicalScore}%</span><span>·</span><span>Sémantique {hit.semanticScore}%</span><span>·</span><span>Confiance {hit.confidence}%</span>{hit.origin.startsWith("http")?<a href={hit.origin} target="_blank" rel="noreferrer" className="ml-auto text-[#7ce6bb] hover:underline">Ouvrir la source ↗</a>:<span className="ml-auto truncate" title={hit.origin}>{hit.origin}</span>}</div></div>):<p className="rounded-xl border border-dashed border-white/[.08] p-5 text-center text-sm text-[#71839e]">Aucune preuve suffisamment pertinente dans ce dossier.</p>}<p className="text-[10px] text-[#667995]">{retrieval.searchedEvidenceCount} preuve(s) recherchée(s) dans {retrieval.searchedSourceCount} source(s) · classement explicable</p></div>:<p className="mt-4 text-xs leading-5 text-[#71839e]">La recherche combine les termes exacts, les concepts proches et la confiance des preuves, sans faire remonter d’information d’un autre dossier.</p>}
      </article>
      <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Sources du dossier</h3><span className="text-[10px] uppercase tracking-[.12em] text-[#42d59d]">Provenance conservée</span></div>
        <div className="mt-4 space-y-3">{sources.length?sources.map((source,index)=><div key={source.id} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-black text-[#9d83ff]">S{index+1} · {source.type.toUpperCase()}</span><strong className="mt-1 block text-sm">{source.title}</strong><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8294af]">{source.summary}</p></div><button onClick={()=>store.removeContextSource(source.id)} aria-label={`Supprimer ${source.title}`} className="text-xs text-[#667995] hover:text-red-300">Supprimer</button></div><div className="mt-2 text-[10px] text-[#667995]">{source.wordCount} mots · traité le {new Date(source.processedAt??source.createdAt).toLocaleDateString("fr-FR")}</div></div>):<p className="rounded-xl border border-dashed border-white/[.08] p-5 text-center text-sm text-[#71839e]">Ajoute la première source réelle du dossier.</p>}</div>
      </article>
    </div>
  </div>;
}

function fallbackTitle(mode:ContextSourceType,origin:string):string { if(origin.trim())return origin.trim(); return mode==="url"?"Source web":mode==="document"?"Document":"Note de contexte"; }
