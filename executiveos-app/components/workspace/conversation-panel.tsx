import type { ConversationMessage } from "@/store/executive-store";

const QUICK_PROMPTS = [
  "J’ai une idée",
  "Je dois prendre une décision",
  "J’ai un problème",
  "Reprendre là où j’en étais"
];

export function ConversationPanel({ messages, input, onInput, onSubmit }: { messages: ConversationMessage[]; input: string; onInput: (value: string) => void; onSubmit: (value: string) => void }) {
  return (
    <article className="executive-card overflow-hidden">
      <div className="max-h-[560px] min-h-[500px] overflow-auto p-5">
        {messages.length ? messages.map((message) => (
          <div key={message.id} className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-7 ${message.role === "user" ? "bg-[#6b49df] text-white" : "border border-white/10 bg-[#16243c] text-[#e8edf6]"}`}>
              {message.text}
            </div>
          </div>
        )) : (
          <div className="grid min-h-[430px] place-items-center text-[#91a2bd]">Commence par « J’ai une idée », « J’ai un problème » ou « Je dois prendre une décision ».</div>
        )}
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="flex gap-3 max-sm:flex-col">
          <textarea
            value={input}
            onChange={(event) => onInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit(input);
              }
            }}
            aria-label="Message à ExecutiveOS"
            placeholder="J’ai une idée…"
            className="min-h-24 flex-1 resize-none rounded-2xl border border-white/10 bg-[#0d1727] p-4 outline-none"
          />
          <button onClick={() => onSubmit(input)} className="executive-button executive-primary self-end px-6 py-4">Analyser</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button key={prompt} onClick={() => onInput(`${prompt} : `)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-[#91a2bd]">{prompt}</button>
          ))}
        </div>
      </div>
    </article>
  );
}
