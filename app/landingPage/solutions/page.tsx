import Link from "next/link";
import { Store, Building2, Factory, ArrowRight } from "lucide-react";

const SEGMENTS = [
  {
    id: "small-business",
    icon: Store,
    tag: "1-49 SKUs",
    title: "Small Business",
    body: "You don't need an enterprise system — you need something fast to set up and easy for a small team to run day to day. Logistiq gives you accurate stock counts, simple order management, and barcode scanning without a steep learning curve.",
    points: [
      "Set up your full catalog in an afternoon, not a quarter",
      "Track stock across one or two locations with no spreadsheets",
      "Scan barcodes with a phone camera — no dedicated hardware required",
    ],
  },
  {
    id: "growing-business",
    icon: Building2,
    tag: "50-999 SKUs",
    title: "Growing Business",
    body: "As your catalog and channel count grow, so does the coordination problem. Logistiq adds multi-warehouse transfers, vendor purchase orders, and the integrations you need to keep every channel in sync automatically.",
    points: [
      "Move stock between warehouses without losing the audit trail",
      "Connect your storefront, accounting, and shipping tools natively",
      "Set reorder points so purchasing stops being reactive",
    ],
  },
  {
    id: "enterprise",
    icon: Factory,
    tag: "1,000+ SKUs",
    title: "Enterprise",
    body: "At scale, inventory is a system of record, not a checklist. Logistiq offers the analytics, API access, and dedicated support that operations and finance teams need to trust the numbers.",
    points: [
      "SKU-level margin and turnover reporting for leadership reviews",
      "A full REST API and webhooks for custom internal tooling",
      "A named support contact and custom approval workflows",
    ],
  },
];

export default function SolutionsPage() {
  return (
    <main className="bg-white text-[#0B1A3E]">
      <section className="bg-[#EEF0F1]">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 pt-20 pb-16 text-center">
          <h1 className="text-[32px] sm:text-[40px] font-extrabold leading-[1.15] mb-6">
            No matter your business size, we&apos;ve got you covered
          </h1>
          <p className="text-lg text-slate-600">
            Logistiq is built to grow with your catalog — from a single storeroom to a distributed warehouse network.
          </p>
        </div>
      </section>

      {SEGMENTS.map((seg, i) => (
        <section key={seg.id} id={seg.id} className={`scroll-mt-20 ${i % 2 === 1 ? "bg-[#EEF0F1]" : "bg-white"}`}>
          <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className={i % 2 === 1 ? "lg:order-2" : ""}>
              <seg.icon size={44} className="text-[#C4123A] mb-6" strokeWidth={1.5} />
              <div className="text-xs font-bold tracking-[0.08em] text-[#C4123A] mb-3">{seg.tag}</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">{seg.title}</h2>
              <p className="text-slate-600 leading-relaxed mb-8">{seg.body}</p>
              <Link
                href="/landingPage/pricing"
                className="inline-block bg-[#C4123A] hover:bg-[#a30f30] text-white font-bold px-7 py-3 text-[15px] transition-colors no-underline"
              >
                Get Pricing
              </Link>
            </div>
            <div className={i % 2 === 1 ? "lg:order-1" : ""}>
              <div className="bg-white border border-slate-200 p-8">
                <h3 className="text-sm font-bold tracking-[0.05em] text-slate-500 mb-5">WHAT YOU GET</h3>
                <ul className="flex flex-col gap-4 list-none p-0 m-0">
                  {seg.points.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <ArrowRight size={16} className="text-[#C4123A] shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
