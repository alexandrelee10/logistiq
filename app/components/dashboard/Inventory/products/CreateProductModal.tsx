"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, ChevronDown, Plus, Trash2 } from "lucide-react";

type Category = { id: string; name: string };
type AttributeRow = { key: string; value: string };

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

  // Everything below lives in Product.attributes (a Json column) rather than
  // dedicated schema columns — see the comment on createProduct in
  // product.ts for why. Kept behind a collapsed section so the common case
  // (just SKU/name/price) stays a two-second form.
  const [showMore, setShowMore] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [barcode, setBarcode] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [baseUnit, setBaseUnit] = useState("unit");
  const [packageUnit, setPackageUnit] = useState("");
  const [unitsPerPackage, setUnitsPerPackage] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [customAttributes, setCustomAttributes] = useState<AttributeRow[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addAttributeRow = () => setCustomAttributes((prev) => [...prev, { key: "", value: "" }]);
  const updateAttributeRow = (index: number, field: "key" | "value", value: string) =>
    setCustomAttributes((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const removeAttributeRow = (index: number) =>
    setCustomAttributes((prev) => prev.filter((_, i) => i !== index));

  // Collapses all the "more details" inputs down into the single JSON blob
  // createProduct expects. Reserved keys here are the ones the product
  // detail page knows to pull out into dedicated slots (image, dimensions,
  // pricing, remarks); anything typed into the custom rows below just
  // passes through as-is into the generic attributes grid.
  function buildAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {};
    if (description.trim()) attrs.description = description.trim();
    if (imageUrl.trim()) attrs.imageUrl = imageUrl.trim();
    if (barcode.trim()) attrs.barcode = barcode.trim();
    if (length || width || height) {
      attrs.dimensions = `${length || "?"}cm × ${width || "?"}cm × ${height || "?"}cm`;
    }
    if (weight) attrs.weight = `${weight}g`;
    if (baseUnit.trim()) attrs.baseUnit = baseUnit.trim();
    if (packageUnit.trim() && unitsPerPackage) {
      attrs.packageUnit = packageUnit.trim();
      attrs.unitsPerPackage = unitsPerPackage;
    }
    if (cost) attrs.cost = cost;
    if (notes.trim()) attrs.notes = notes.trim();

    for (const row of customAttributes) {
      if (row.key.trim()) attrs[row.key.trim()] = row.value;
    }
    return attrs;
  }

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
          body: JSON.stringify({
            action: "createCategory",
            name: newCategory.trim(),
          }),
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
          attributes: buildAttributes(),
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

  const inputClass =
    "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent";
  const labelClass = "text-xs font-semibold text-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
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
              <label className={labelClass}>SKU</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="ABC-123" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Low stock limit</label>
              <input
                type="number"
                min={0}
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Price (optional)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Category (optional)</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (e.target.value) setNewCategory("");
              }}
              className={`${inputClass} bg-white`}
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
              className={inputClass}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-accent self-start"
          >
            <ChevronDown size={14} className={`transition-transform ${showMore ? "rotate-180" : ""}`} />
            {showMore ? "Hide" : "Show"} more details
          </button>

          {showMore && (
            <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Image URL</label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Barcode</label>
                <input value={barcode} onChange={(e) => setBarcode(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Dimensions (cm) &amp; weight (g)</label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  <input value={length} onChange={(e) => setLength(e.target.value)} placeholder="L" type="number" min={0} className={inputClass} />
                  <input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="W" type="number" min={0} className={inputClass} />
                  <input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="H" type="number" min={0} className={inputClass} />
                  <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Wt" type="number" min={0} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Unit of measure</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  <input value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} placeholder="foot" className={inputClass} />
                  <input
                    value={unitsPerPackage}
                    onChange={(e) => setUnitsPerPackage(e.target.value)}
                    placeholder="250"
                    type="number"
                    min={0}
                    className={inputClass}
                  />
                  <input value={packageUnit} onChange={(e) => setPackageUnit(e.target.value)} placeholder="spool" className={inputClass} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">e.g. base unit &quot;foot&quot;, 250 per &quot;spool&quot;</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Cost (optional — used to show markup)</label>
                <input value={cost} onChange={(e) => setCost(e.target.value)} type="number" min={0} step="0.01" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Remarks</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass}>Custom attributes</label>
                  <button
                    type="button"
                    onClick={addAttributeRow}
                    className="flex items-center gap-1 text-xs font-bold text-accent"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {customAttributes.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={row.key}
                        onChange={(e) => updateAttributeRow(i, "key", e.target.value)}
                        placeholder="Brand"
                        className={inputClass}
                      />
                      <input
                        value={row.value}
                        onChange={(e) => updateAttributeRow(i, "value", e.target.value)}
                        placeholder="Acme"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => removeAttributeRow(i)}
                        className="text-slate-400 hover:text-accent shrink-0"
                        aria-label="Remove attribute"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
