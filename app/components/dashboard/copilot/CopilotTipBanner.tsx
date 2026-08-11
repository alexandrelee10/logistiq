"use client";

import { useState } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { OPEN_COPILOT_EVENT } from "../DashboardShell";

export default function CopilotTipBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const open = () => window.dispatchEvent(new Event(OPEN_COPILOT_EVENT));

  return (
    <div className="relative flex items-center gap-4 rounded-2xl border border-accent/15 bg-accent/5 px-5 py-4">
      <span className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-accent shadow-sm">
        <Sparkles size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">Let Copilot handle the busywork</p>
        <p className="text-sm text-slate-500 mt-0.5">
          Ask it to draft reorders, summarize today&apos;s changes, or flag what needs attention.
        </p>
      </div>
      <button
        type="button"
        onClick={open}
        className="hidden sm:flex items-center gap-1.5 rounded-full bg-accent hover:bg-accent-hover transition-colors text-white text-sm font-bold px-4 py-2 shrink-0"
      >
        Ask Copilot
        <ArrowRight size={14} />
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute top-3 right-3 sm:static text-slate-400 hover:text-foreground p-1 shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
