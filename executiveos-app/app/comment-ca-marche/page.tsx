import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description: "Raconter, confronter, apprendre : découvrez comment ExecutiveOS construit un jumeau décisionnel traçable."
};

const STEPS = [
  { number: "01", title: "Raconter", text: "Collez plusieurs décisions, mémos ou notes de réunion. ExecutiveOS extrait le contexte, le choix, les raisons et le résultat sans vous imposer un formulaire par décision." },
  { number: "02", title: "Confronter", text: "Le jumeau compare une nouvelle option aux critères observés, cite les décisions qui la soutiennent et rend visibles les contradictions ou informations manquantes." },
  { number: "03", title: "Apprendre", text: "Vous confirmez ou corrigez chaque tendance. Les résultats réels et vos retours affinent la doctrine au lieu de figer vos habitudes." }
] as const;

export default function HowItWorksPage() {
  return <main className="min-h-screen bg-[#07111f] px-5 py-8 text-white sm:px-8 md:py-14">
    <nav className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#9b82ff] to-[#5b39e7] text-sm font-black">EO</span><span><strong className="block text-sm">ExecutiveOS</strong><small className="text-[#8294af]">Jumeau décisionnel privé</small></span></Link><Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold">Explorer la démonstration</Link></nav>
    <section className="mx-auto max-w-6xl py-20 md:py-28"><div className="text-[10px] font-black uppercase tracking-[.22em] text-[#b7a9ff]">Comment ça marche</div><h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-.05em] md:text-7xl">Votre expérience devient une doctrine que vous pouvez vérifier.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-[#aab7ca]">ExecutiveOS ne décide pas à votre place. Il retrouve les critères qui ont guidé vos choix, confronte une nouvelle décision à leurs preuves et apprend de vos corrections.</p>
      <div className="mt-14 grid gap-5 lg:grid-cols-3">{STEPS.map((step)=><article key={step.number} className="rounded-[28px] border border-white/[.08] bg-[#0d192b] p-6 md:p-8"><span className="text-xs font-black text-[#9d83ff]">{step.number}</span><h2 className="mt-8 text-3xl font-semibold">{step.title}</h2><p className="mt-4 text-sm leading-7 text-[#91a2bd]">{step.text}</p></article>)}</div>
      <div className="mt-12 rounded-[30px] border border-[#7c5cff]/30 bg-[linear-gradient(135deg,rgba(124,92,255,.16),rgba(13,25,43,.96))] p-7 md:flex md:items-center md:justify-between md:p-10"><div><h2 className="text-2xl font-semibold">Commencez avec une doctrine fictive crédible.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#aab7ca]">Explorez le profil de Claire, DG fictive d’une ETI industrielle, puis remplacez les exemples par vos propres décisions en un clic.</p></div><Link href="/" className="mt-6 inline-flex rounded-full bg-[#7c5cff] px-6 py-3 text-sm font-bold md:mt-0">Voir ExecutiveOS →</Link></div>
    </section>
  </main>;
}
