"use client";

import { useExecutiveStore } from "@/store/executive-store";

export function HistoryControls() {
  const activeCaseId = useExecutiveStore((state) => state.activeCaseId);
  const messageCount = useExecutiveStore(
    (state) => state.messages.filter((message) => message.caseId === state.activeCaseId).length
  );
  const clearConversationHistory = useExecutiveStore((state) => state.clearConversationHistory);

  function clearHistory() {
    if (!messageCount) return;

    const confirmed = window.confirm(
      "Effacer définitivement tout l’historique de conversation du dossier actif ?"
    );

    if (!confirmed) return;

    clearConversationHistory(activeCaseId);
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={clearHistory}
      disabled={!messageCount}
      title="Effacer l’historique du dossier actif"
      className="fixed bottom-5 right-5 z-40 rounded-xl border border-[#ff7185]/40 bg-[#2a1420]/95 px-4 py-3 text-sm font-semibold text-[#ffc0ca] shadow-2xl backdrop-blur transition hover:bg-[#3a1725] disabled:cursor-not-allowed disabled:opacity-40"
    >
      Effacer l’historique
    </button>
  );
}
