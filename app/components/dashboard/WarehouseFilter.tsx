"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, ChevronDown, Check } from "lucide-react";

type Warehouse = { id: string; name: string };

export default function WarehouseFilter({
  warehouses,
  selectedId,
}: {
  warehouses: Warehouse[];
  selectedId?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = warehouses.find((w) => w.id === selectedId);
  const label = selected ? selected.name : "All Warehouses";

  function select(id: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("warehouse", id);
    } else {
      params.delete("warehouse");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-3.5 pr-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-slate-300 transition-colors"
      >
        <MapPin size={14} className="text-accent" />
        {label}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 top-full z-20 mt-2 w-48 rounded-xl border border-slate-200/70 bg-white shadow-xl shadow-slate-900/[0.08] p-1.5">
          <button
            type="button"
            onClick={() => select(null)}
            className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
          >
            All Warehouses
            {!selected && <Check size={14} className="text-accent" />}
          </button>
          {warehouses.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => select(w.id)}
              className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
            >
              {w.name}
              {selected?.id === w.id && <Check size={14} className="text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
