"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, RefreshCw, Plus } from "lucide-react";
import ReorderModal from "./ReorderModal";
import CreateProductModal from "./Inventory/products/CreateProductModal";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  reorderPoint: number;
  price: number | null;
  category: { id: string; name: string } | null;
  createdAt: string | Date;
  quantity: number;
  lowStock: boolean;
};

type Supplier = { id: string; name: string };
type Category = { id: string; name: string };

// null = closed, "any" = page-level button (product picker shown),
// a ProductRow = opened from that row (product locked in)
type ReorderTarget = ProductRow | "any" | null;

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPrice(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function ProductsTable({
  products,
  suppliers,
  categories,
  canReorder,
  canCreateProduct,
}: {
  products: ProductRow[];
  suppliers: Supplier[];
  categories: Category[];
  canReorder: boolean;
  canCreateProduct: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [reorderTarget, setReorderTarget] = useState<ReorderTarget>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId !== "all" && p.category?.id !== categoryId) return false;
      if (lowStockOnly && !p.lowStock) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, query, categoryId, lowStockOnly]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-foreground shrink-0">
          {filtered.length} of {products.length} product{products.length === 1 ? "" : "s"}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {canReorder && (
            <button
              type="button"
              onClick={() => setReorderTarget("any")}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-sm font-bold text-accent hover:bg-accent/5"
            >
              <RefreshCw size={14} />
              Reorder
            </button>
          )}
          {canCreateProduct && (
            <button
              type="button"
              onClick={() => setShowCreateProduct(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover"
            >
              <Plus size={14} />
              New product
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 px-6 py-4 border-b border-slate-100">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          >
            <option value="all">All categories</option>
            {sortedCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-2 text-sm text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="accent-accent"
            />
            Low stock only
          </label>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, SKU, or category..."
              className="w-full rounded-full bg-slate-100/80 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white border border-transparent focus:border-accent/30 transition-colors"
            />
          </div>
      </div>

      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400">
            <th className="px-6 py-3 font-semibold w-[26%]">Product</th>
            <th className="px-4 py-3 font-semibold w-[13%]">SKU</th>
            <th className="px-4 py-3 font-semibold w-[13%]">Category</th>
            <th className="px-4 py-3 font-semibold w-[11%]">Price</th>
            <th className="px-4 py-3 font-semibold w-[12%]">Quantity</th>
            <th className="px-4 py-3 font-semibold w-[11%]">Added</th>
            {canReorder && <th className="px-6 py-3 font-semibold text-right w-[14%]">Action</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={canReorder ? 7 : 6} className="px-6 py-10 text-center text-sm text-slate-400">
                {products.length === 0 ? "No products yet" : "No products match your filters"}
              </td>
            </tr>
          ) : (
            filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => router.push(`/dashboard/inventory/products/${p.id}`)}
                className="cursor-pointer border-b border-slate-50 last:border-b-0 hover:bg-slate-50/70 transition-colors"
              >
                <td className="px-6 py-3">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/8 text-accent">
                      <Package size={14} />
                    </span>
                    <span className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      {p.lowStock && (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 mt-0.5">
                          Low stock
                        </span>
                      )}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 truncate">{p.sku}</td>
                <td className="px-4 py-3">
                  {p.category ? (
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 truncate">
                      {p.category.name}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-slate-500">{p.quantity.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{formatDate(p.createdAt)}</td>
                {canReorder && (
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReorderTarget(p);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5"
                    >
                      <RefreshCw size={12} />
                      Reorder
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {reorderTarget === "any" && (
        <ReorderModal products={products} suppliers={suppliers} onClose={() => setReorderTarget(null)} />
      )}
      {reorderTarget && reorderTarget !== "any" && (
        <ReorderModal product={reorderTarget} suppliers={suppliers} onClose={() => setReorderTarget(null)} />
      )}
      {showCreateProduct && (
        <CreateProductModal categories={categories} onClose={() => setShowCreateProduct(false)} />
      )}
    </div>
  );
}
