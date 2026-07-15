"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";

const WAREHOUSES = ["All Warehouses", "Warehouse A", "Warehouse B", "Warehouse C"];

export default function WarehouseFilter() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(WAREHOUSES[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-3.5 pr-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-slate-300 transition-colors"
      >
        <MapPin size={14} className="text-accent" />
        {selected}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 top-full z-20 mt-2 w-48 rounded-xl border border-slate-200/70 bg-white shadow-xl shadow-slate-900/[0.08] p-1.5">
          {WAREHOUSES.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => {
                setSelected(w);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
            >
              {w}
              {selected === w && <Check size={14} className="text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
