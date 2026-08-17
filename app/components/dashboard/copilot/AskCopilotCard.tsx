

"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { OPEN_COPILOT_EVENT } from "../DashboardShell";

const PROMPTS = [
  "Which SKUs are at risk of stockout this week?",
  "Summarize today's inventory changes",
  "Draft a reorder for Warehouse B",
];

export default function AskCopilotCard() {
  const open = () => window.dispatchEvent(new Event(OPEN_COPILOT_EVENT));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-[#132152] p-6 text-white shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex items-center gap-2.5 mb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <Sparkles size={16} />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">Ask Copilot</p>
          <p className="text-xs text-white/50 leading-tight">Your inventory assistant</p>
        </div>
      </div>

      <div className="relative flex flex-col gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={open}
            className="flex items-center justify-between gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2.5 text-left text-sm font-medium text-white/85 transition-colors"
          >
            {p}
            <ArrowRight size={14} className="shrink-0 text-white/40" />
          </button>
        ))}
      </div>
    </div>
  );
}
