"use client";

import { useState } from "react";
import { Loader2, X, CheckCircle2, AlertTriangle } from "lucide-react";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; sku: string };

export default function ReorderModal({
  product,
  products,
  suppliers,
  onClose,
}: {
  // Pass a specific product when reordering from a row (pre-filled, locked).
  // Pass `products` instead when opened from the page-level button, so the
  // person picks which product they're reordering first.
  product?: Product;
  products?: Product[];
  suppliers: Supplier[];
  onClose: () => void;
}) {
  const [productId, setProductId] = useState(product?.id ?? products?.[0]?.id ?? "");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  // Kept as a string, not a number — a controlled numeric input that
  // coerces on every keystroke fights the user (cursor jumps to the end,
  // leading zeros get eaten mid-type), which made typing feel like only
  // the spinner arrows worked. Parsed to a number only on submit below.
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [poNumber, setPoNumber] = useState<string | null>(null);

  const selectedProduct = product ?? products?.find((p) => p.id === productId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!productId) {
      setError("Pick a product first.");
      return;
    }
    if (!supplierId) {
      setError("Pick a supplier first.");
      return;
    }
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be at least 1.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createPurchaseOrder",
          supplierId,
          lines: [{ productId, quantity: parsedQuantity }],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to create purchase order.");
        return;
      }

      setPoNumber(data.purchaseOrder?.poNumber ?? "created");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground">Reorder</h2>
            {selectedProduct && (
              <p className="text-xs text-slate-500 truncate">
                {selectedProduct.name} · {selectedProduct.sku}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {poNumber ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </span>
            <p className="text-sm font-semibold text-foreground">Purchase order {poNumber} created</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 rounded-full bg-accent px-5 py-2 text-sm font-bold text-white hover:bg-accent-hover"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!product && products && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Product</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  {products.length === 0 && <option value="">No products yet</option>}
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {suppliers.length === 0 ? (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                No suppliers yet — add one before you can create a purchase order.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>

            {error && <p className="text-xs font-semibold text-accent">{error}</p>}

            <button
              type="submit"
              disabled={submitting || suppliers.length === 0}
              className="mt-1 flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Creating..." : "Create purchase order"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
