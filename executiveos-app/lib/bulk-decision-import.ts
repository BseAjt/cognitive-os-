export interface ExtractedDecision {
  title: string;
  context: string;
  choice: string;
  rationale: string;
  outcome: string;
}

const clean = (value: string) => value.replace(/^[\s\-*#\d.)]+/, "").trim();

export function extractBulkDecisions(raw: string, limit = 5): ExtractedDecision[] {
  const normalized = raw.replace(/\r/g, "").trim();
  if (!normalized) return [];
  let blocks = normalized.split(/\n\s*\n+|\n(?=(?:décision|decision|objet|sujet)\s*[:#-])/i).map(clean).filter((item) => item.length >= 24);
  if (blocks.length < 2) {
    blocks = normalized.split(/(?<=[.!?])\s+(?=(?:nous|j['’]ai|le comité|la direction|décision|decision)\b)/i).map(clean).filter((item) => item.length >= 24);
  }
  return blocks.slice(0, limit).map((block, index) => {
    const lines = block.split("\n").map(clean).filter(Boolean);
    const sentences = block.split(/(?<=[.!?])\s+/).map(clean).filter(Boolean);
    const labelled = (label: RegExp) => lines.find((line) => label.test(line))?.replace(/^[^:]+:\s*/, "").trim() ?? "";
    const title = labelled(/^(décision|decision|objet|sujet)/i) || lines[0]?.replace(/[.!?]$/, "").slice(0, 90) || `Décision ${index + 1}`;
    const choice = labelled(/^(choix|décision prise|decision made|option retenue)/i) || sentences.find((sentence) => /nous avons|j['’]ai|retenu|choisi|décidé|approved|selected/i.test(sentence)) || "Choix à confirmer";
    const rationale = labelled(/^(raison|pourquoi|motif|rationale)/i) || sentences.find((sentence) => /parce que|afin de|car |preuve|risque|because|evidence/i.test(sentence)) || sentences[1] || block;
    const outcome = labelled(/^(résultat|resultat|issue|outcome)/i) || sentences.find((sentence) => /résultat|six mois|trois mois|finalement|a permis|échoué|réussi|resulted|months later/i.test(sentence)) || "Résultat à documenter";
    return { title, context: block, choice, rationale, outcome };
  });
}
