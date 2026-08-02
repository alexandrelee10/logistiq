"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

type Category = { id: string; name: string };
// 
export default function CreateProductModal({
  categories,
  onClose,
}: {
  categories: Category[]; // Product category
  onClose: () => void; // Function to close mini screen
}) {
  const router = useRouter(); 

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");

  const [reorderPoint, setReorderPoint] = useState("0");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Ensure sku or name isn't empty
    if (!sku.trim() || !name.trim()) {
      setError("SKU and name are required.");
      return;
    }
    // Set button to "creating..."
    setSubmitting(true);
    try {
      // Category Id 
      let resolvedCategoryId = categoryId || undefined;

      // If user enters something new, use createCategory function to add it to the db 
      if (newCategory.trim()) {
        // Category Response
        const catRes = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "createCategory", name: newCategory.trim() }),
        });
        // Get the info out of response 
        const catData = await catRes.json();
        if (!catRes.ok) {
          setError(catData.error ?? "Unable to create category.");
          return;
        }
        resolvedCategoryId = catData.category.id;
      }
      // Create product
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createProduct",
          sku: sku.trim(),
          name: name.trim(),
          reorderPoint: reorderPoint === "" ? 0 : Number(reorderPoint),
          price: price === "" ? undefined : Number(price),
          categoryId: resolvedCategoryId,
        }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to create product.");
        return;
      }

      router.refresh();
      onClose();
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
          <h2 className="text-sm font-bold text-foreground">New product</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ABC-123"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Quantity</label>
              <input
                type="number"
                min={0}
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product name"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Price (optional)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Category (optional)</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (e.target.value) setNewCategory("");
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                if (e.target.value) setCategoryId("");
              }}
              placeholder="...or create a new category"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          {error && <p className="text-xs font-semibold text-accent">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Creating..." : "Create product"}
          </button>
        </form>
      </div>
    </div>
  );
}
