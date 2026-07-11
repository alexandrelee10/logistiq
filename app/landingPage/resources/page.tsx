import { ArrowRight } from "lucide-react";

const RESOURCES = [
  {
    id: "state-of-inventory-2026",
    tag: "Report",
    title: "The State of Inventory Management, 2026",
    body: "Benchmarks and trends from operations teams managing multi-channel stock this year, including how often teams reconcile stock, where discrepancies come from, and what the fastest-growing teams do differently.",
  },
  {
    id: "multi-warehouse-demo",
    tag: "Webinar",
    title: "Live demo: multi-warehouse workflows",
    body: "A recorded walkthrough of transfers, reorder points, and location-specific reporting working together across two or more warehouses.",
  },
  {
    id: "why-teams-switch",
    tag: "Guide",
    title: "Why operations teams switch to Logistiq",
    body: "A practical look at what changes when reconciliation moves from a multi-day, end-of-month process to something continuous and always up to date.",
  },
  {
    id: "reorder-point-guide",
    tag: "Guide",
    title: "How to set reorder points that actually work",
    body: "A short framework for setting reorder thresholds from real sales velocity instead of gut feel, so you stop both stockouts and overstock.",
  },
  {
    id: "barcode-basics",
    tag: "Guide",
    title: "Barcode scanning without new hardware",
    body: "What you need — and don't need — to start scanning inventory with barcodes using devices your team already carries.",
  },
  {
    id: "api-quickstart",
    tag: "Developer",
    title: "API quickstart",
    body: "A short guide to authenticating and making your first request against the Logistiq REST API.",
  },
];

export default function ResourcesPage() {
  return (
    <main className="bg-white text-[#0B1A3E]">
      <section className="bg-[#EEF0F1]">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 pt-20 pb-16 text-center">
          <h1 className="text-[32px] sm:text-[40px] font-extrabold leading-[1.15] mb-6">
            Resources for operations teams
          </h1>
          <p className="text-lg text-slate-600">
            Guides, reports, and demos to help you run inventory better.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {RESOURCES.map((r) => (
              <div key={r.id} id={r.id} className="scroll-mt-24 border border-slate-200">
                <div className="h-32 bg-[#0A1330] flex items-center px-6">
                  <span className="text-white/70 text-xs font-bold tracking-[0.08em]">{r.tag.toUpperCase()}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{r.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{r.body}</p>
                  <span className="text-sm font-bold text-[#C4123A] inline-flex items-center gap-1">
                    Read more <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
