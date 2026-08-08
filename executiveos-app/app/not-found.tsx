import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center p-6"><section className="executive-card max-w-lg p-8 text-center"><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0071e3]">404</div><h1 className="mt-3 text-3xl font-semibold">Cette vue n’existe pas.</h1><p className="mt-3 text-sm text-[#6e6e73]">Reviens à ton espace exécutif pour poursuivre le travail.</p><Link href="/" className="executive-button executive-primary mt-6 inline-block">Ouvrir ExecutiveOS</Link></section></main>;
}
