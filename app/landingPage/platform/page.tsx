import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  ScanBarcode,
  BarChart3,
  Warehouse,
  FileText,
  Plug,
  RefreshCw,
  LineChart,
  Code2,
  Headset,
  Workflow,
} from "lucide-react";

const GROUPS = [
  {
    heading: "Inventory basics",
    subheading: "Everything a small operation needs to stop guessing and start tracking.",
    features: [
      {
        id: "inventory-tracking",
        icon: Boxes,
        title: "Inventory Tracking",
        body: "See stock levels update in real time as sales, returns, and transfers happen — no more end-of-day recounts.",
      },
      {
        id: "order-management",
        icon: ClipboardList,
        title: "Order Management",
        body: "Manage sales orders and purchase orders from a single queue, from the moment they're placed to the moment they ship.",
      },
      {
        id: "barcode-scanning",
        icon: ScanBarcode,
        title: "Barcode Scanning",
        body: "Generate and scan barcodes with any phone or handheld scanner to receive, pick, and count stock faster.",
      },
      {
        id: "reporting",
        icon: BarChart3,
        title: "Basic Reporting",
        body: "Get straightforward reports on stock levels, sell-through, and order history without needing a BI tool.",
      },
    ],
  },
  {
    heading: "Scaling operations",
    subheading: "Tools for teams juggling more warehouses, vendors, and channels.",
    features: [
      {
        id: "multi-warehouse",
        icon: Warehouse,
        title: "Multi-Warehouse",
        body: "Track stock separately by location and transfer inventory between warehouses without losing the paper trail.",
      },
      {
        id: "purchase-orders",
        icon: FileText,
        title: "Purchase Orders",
        body: "Create, send, and receive purchase orders against vendor price lists, with partial receiving built in.",
      },
      {
        id: "app-integrations",
        icon: Plug,
        title: "App Integrations",
        body: "Connect Logistiq to the storefronts, accounting software, and shipping tools you already run your business on.",
      },
      {
        id: "automated-reorder",
        icon: RefreshCw,
        title: "Automated Reorder",
        body: "Set reorder points by SKU and let Logistiq flag — or automatically draft — purchase orders before you run out.",
      },
    ],
  },
  {
    heading: "Enterprise-grade",
    subheading: "For operations teams running inventory at serious scale.",
    features: [
      {
        id: "advanced-analytics",
        icon: LineChart,
        title: "Advanced Analytics",
        body: "SKU-level margin, turnover, and forecasting reports that hold up in a leadership review.",
      },
      {
        id: "api-access",
        icon: Code2,
        title: "API Access",
        body: "A full REST API and webhooks to build custom integrations into your ERP, WMS, or internal tools.",
      },
      {
        id: "dedicated-support",
        icon: Headset,
        title: "Dedicated Support",
        body: "A named onboarding and support contact who already knows your setup when you reach out.",
      },
      {
        id: "custom-workflows",
        icon: Workflow,
        title: "Custom Workflows",
        body: "Configure approval chains, notifications, and automations around how your team actually operates.",
      },
    ],
  },
];

export default function PlatformPage() {
  return (
    <main className="bg-white text-[#0B1A3E]">
      <section className="bg-[#EEF0F1]">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 pt-20 pb-16 text-center">
          <h1 className="text-[32px] sm:text-[40px] font-extrabold leading-[1.15] mb-6">
            One platform for every part of your inventory
          </h1>
          <p className="text-lg text-slate-600 mb-10">
            From your first SKU to your thousandth, Logistiq scales with the way you actually work.
          </p>
          <Link
            href="/landingPage/pricing"
            className="inline-block bg-[#C4123A] hover:bg-[#a30f30] text-white font-bold px-8 py-3.5 text-[15px] transition-colors no-underline"
          >
            Get Pricing
          </Link>
        </div>
      </section>

      {GROUPS.map((group, i) => (
        <section key={group.heading} className={i % 2 === 1 ? "bg-[#EEF0F1]" : "bg-white"}>
          <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20">
            <div className="max-w-2xl mb-14">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">{group.heading}</h2>
              <p className="text-slate-600">{group.subheading}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              {group.features.map((f) => (
                <div key={f.id} id={f.id} className="scroll-mt-24 flex gap-5">
                  <f.icon size={28} className="text-[#C4123A] shrink-0" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="bg-[#0A1330]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <h2 className="text-white font-extrabold text-2xl sm:text-3xl">
            See the whole platform in action.
          </h2>
          <Link
            href="/landingPage/pricing"
            className="bg-white text-[#C4123A] font-bold px-8 py-3.5 text-[15px] hover:bg-slate-100 transition-colors no-underline whitespace-nowrap"
          >
            Get Pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
