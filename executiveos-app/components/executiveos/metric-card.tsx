const TONE_CLASSES = {
  violet: "text-[#b8acf8]",
  red: "text-[#ff9dab]",
  amber: "text-[#ffd895]",
  blue: "text-[#8fc6ff]",
  green: "text-[#7aefc2]"
} as const;

type MetricTone = keyof typeof TONE_CLASSES;

export function MetricCard({ label, value, tone }: { label: string; value: number; tone: MetricTone }) {
  return (
    <article className="executive-card p-5">
      <span className="text-xs text-[#91a2bd]">{label}</span>
      <strong className={`mt-2 block text-4xl ${TONE_CLASSES[tone]}`}>{value}</strong>
    </article>
  );
}

export function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.025] p-3">
      <span className="block text-xs text-[#91a2bd]">{label}</span>
      <strong className="mt-1 block text-xl">{value}</strong>
    </div>
  );
}
