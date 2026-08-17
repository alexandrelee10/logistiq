// Copilot panel 
"use client";


import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Ensure chat has all the following
type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const SUGGESTIONS = [
  "Which SKUs are at risk of stockout this week?",
  "Summarize today's inventory changes",
  "Draft a reorder for Warehouse B",
];

const INITIAL_MESSAGE: Message = {
  id: "intro",
  role: "assistant",
  content:
    "Hi, I'm your inventory Copilot. Ask me about stock levels, reorder points, warehouse transfers, or trends across your catalog.",
};

export default function CopilotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  
  // Ensure convo starts with initial messsage and ensure messages is an array containing Message objects 
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  
  const [input, setInput] = useState("");
  
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    const res = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMsg]
          .filter((m) => m.id !== "intro")
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", content: data.message },
    ]);
    setThinking(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={onClose} aria-hidden />

      <aside className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[72px] border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#7a0c24] text-white">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">Logistiq Copilot</p>
              <p className="text-xs text-slate-400 leading-tight">Beta &middot; inventory assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-foreground p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close Copilot"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                [&_strong]:font-bold [&_em]:italic [&_p]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0
                [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5
                [&_code]:bg-black/5 [&_code]:rounded [&_code]:px-1 [&_code]:text-[13px]
                [&_a]:underline ${
                m.role === "assistant"
                  ? "bg-slate-100 text-foreground self-start rounded-tl-sm [&_a]:text-accent"
                  : "bg-accent text-white self-end rounded-tr-sm [&_a]:text-white"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            </div>
          ))}
          {thinking && (
            <div className="bg-slate-100 text-slate-400 self-start rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs font-medium">Thinking...</span>
            </div>
          )}

          {messages.length === 1 && (
            <div className="flex flex-col gap-2 mt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-left text-sm font-medium text-foreground rounded-xl border border-slate-200 px-4 py-2.5 hover:border-accent/40 hover:bg-accent/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="p-4 border-t border-slate-100 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your inventory..."
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </form>
      </aside>
    </div>
  );
}
