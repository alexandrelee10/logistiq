"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import ReorderModal from "../reorder/ReorderModal";

type Product = { id: string; name: string; sku: string };
type Supplier = { id: string; name: string };

export default function ProductDetailActions({
  product,
  suppliers,
}: {
  product: Product;
  suppliers: Supplier[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover"
      >
        <RefreshCw size={14} />
        Reorder
      </button>

      {open && <ReorderModal product={product} suppliers={suppliers} onClose={() => setOpen(false)} />}
    </>
  );
}
