const INTERNAL_IDENTITY_PATTERN = /\b(?:ORION|ATHENA|TURING|SENECA)\b/gi;

const PUBLIC_LABELS: Record<string, string> = {
  orion: "Assistant de décision",
  athena: "Perspective stratégique",
  turing: "Perspective de faisabilité",
  seneca: "Perspective de prudence"
};

/** Keeps internal reasoning identities out of every user-facing surface. */
export function publicCopy(value: string): string {
  return value.replace(INTERNAL_IDENTITY_PATTERN, (identity) => PUBLIC_LABELS[identity.toLocaleLowerCase("fr")] ?? "Perspective d’analyse");
}
