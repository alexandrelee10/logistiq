"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type InventoryItem = {
  id: string;
  quantity: number;
  warehouse: { id: string; name: string; code: string };
};

// Split into its own client component only because of the search box and
// "show more locations" toggle — page.tsx stays a server component and just
// hands this the already-fetched inventory rows.
export default function QuantityByLocationPanel({
  items,
  totalQuantity,
  unitLabel,
}: {
  items: InventoryItem[];
  totalQuantity: number;
  unitLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const maxQuantity = Math.max(1, ...items.map((i) => i.quantity));

  const filtered = items.filter((i) => i.warehouse.name.toLowerCase().includes(query.trim().toLowerCase()));

  // Mirrors inFlow collapsing to 3 rows with a "Show more locations" link —
  // only relevant once an org has more than a handful of warehouses.
  const visible = expanded ? filtered : filtered.slice(0, 3);
  const hiddenCount = filtered.length - visible.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 mb-1">Quantity on hand for all locations</p>
        <p className="text-2xl font-extrabold text-foreground">
          {totalQuantity.toLocaleString()} <span className="text-base font-semibold text-slate-400">{unitLabel}</span>
        </p>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {items.length > 3 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search locations..."
              className="w-full rounded-full bg-slate-100/80 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white border border-transparent focus:border-accent/30 transition-colors"
            />
          </div>
        )}

        {visible.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-4">
            {items.length === 0 ? "No stock recorded yet" : "No locations match your search"}
          </p>
        ) : (
          visible.map((item) => (
            <div key={item.id}>
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-sm font-semibold text-foreground">
                  {item.warehouse.name} <span className="text-xs font-normal text-slate-400">{item.warehouse.code}</span>
                </p>
                <p className="text-sm font-bold text-foreground">{item.quantity.toLocaleString()}</p>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(item.quantity / maxQuantity) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}

        {!expanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs font-bold text-accent self-start"
          >
            Show {hiddenCount} more location{hiddenCount === 1 ? "" : "s"}
          </button>
        )}
      </div>
    </div>
  );
}
