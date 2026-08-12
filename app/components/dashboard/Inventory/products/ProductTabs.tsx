"use client";

import { useState, type ReactNode } from "react";

// Kept dumb on purpose: the server page (page.tsx) does all the data
// fetching/shaping and just hands us three pre-rendered panels. That way
// this component only owns "which tab is active" and nothing about
// products, orders, or inventory leaks into client-side state.
export default function ProductTabs({
  overview,
  orderHistory,
  movementHistory,
}: {
  overview: ReactNode;
  orderHistory: ReactNode;
  movementHistory: ReactNode;
}) {
  const [active, setActive] = useState<"overview" | "orders" | "movement">("overview");

  const tabs: { key: typeof active; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: "Order history" },
    { key: "movement", label: "Movement history" },
  ];

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              active === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-slate-400 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "overview" && overview}
      {active === "orders" && orderHistory}
      {active === "movement" && movementHistory}
    </div>
  );
}
