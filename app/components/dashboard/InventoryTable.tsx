"use client";

import { useMemo, useState } from "react";
import { Search, Package } from "lucide-react";

type InventoryRow = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  reorderPoint: number;
};

export default function InventoryTable({ products }: { products: InventoryRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-foreground">
          {filtered.length} of {products.length} product{products.length === 1 ? "" : "s"}
        </h2>
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full rounded-full bg-slate-100/80 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white border border-transparent focus:border-accent/30 transition-colors"
          />
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400">
            <th className="px-6 py-3 font-semibold">Product</th>
            <th className="px-4 py-3 font-semibold">Quantity</th>
            <th className="px-4 py-3 font-semibold">Reorder point</th>
            <th className="px-6 py-3 font-semibold text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                {products.length === 0 ? "No products yet" : "No products match your search"}
              </td>
            </tr>
          ) : (
            filtered.map((p) => {
              const low = p.quantity <= p.reorderPoint;
              return (
                <tr key={p.id} className="border-b border-slate-50 last:border-b-0">
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/8 text-accent">
                        <Package size={14} />
                      </span>
                      <span className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.sku}</p>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{p.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{p.reorderPoint.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        low ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {low ? "Low stock" : "In stock"}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
