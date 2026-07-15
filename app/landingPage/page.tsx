"use client";

import Link from "next/link";
import {
  ArrowRight,
  Store,
  Building2,
  Factory,
  PackageCheck,
  Star,
  Sparkles,
} from "lucide-react";

const STATS = [
  { label: "TRUSTED BY MORE THAN", value: "8,200+", sub: "Businesses" },
  { label: "WE TRACK OVER", value: "40M", sub: "SKUs every month" },
  { label: "HELPING TEAMS FOR", value: "10+", sub: "years" },
];

const SEGMENTS = [
  {
    icon: Store,
    tag: "1-49 SKUs",
    title: "Small Business",
    slug: "small-business",
    body: "Faster, easier, more reliable inventory tools designed to help you focus on what matters.",
    links: [
      { label: "Inventory Tracking", href: "/landingPage/platform#inventory-tracking" },
      { label: "Order Management", href: "/landingPage/platform#order-management" },
      { label: "Barcode Scanning", href: "/landingPage/platform#barcode-scanning" },
      { label: "Basic Reporting", href: "/landingPage/platform#reporting" },
    ],
  },
  {
    icon: Building2,
    tag: "50-999 SKUs",
    title: "Growing Business",
    slug: "growing-business",
    body: "Superior inventory and order tech designed to help you manage your whole catalog with ease.",
    links: [
      { label: "Multi-Warehouse", href: "/landingPage/platform#multi-warehouse" },
      { label: "Purchase Orders", href: "/landingPage/platform#purchase-orders" },
      { label: "App Integrations", href: "/landingPage/platform#app-integrations" },
      { label: "Automated Reorder", href: "/landingPage/platform#automated-reorder" },
    ],
  },
  {
    icon: Factory,
    tag: "1,000+ SKUs",
    title: "Enterprise",
    slug: "enterprise",
    body: "Adaptable inventory infrastructure designed to drive operational performance at any scale.",
    links: [
      { label: "Advanced Analytics", href: "/landingPage/platform#advanced-analytics" },
      { label: "API Access", href: "/landingPage/platform#api-access" },
      { label: "Dedicated Support", href: "/landingPage/platform#dedicated-support" },
      { label: "Custom Workflows", href: "/landingPage/platform#custom-workflows" },
    ],
  },
];

const RESOURCES = [
  {
    tag: "Report",
    title: "The State of Inventory Management, 2026",
    body: "Benchmarks and trends from operations teams managing multi-channel stock this year.",
    href: "/landingPage/resources#state-of-inventory-2026",
  },
  {
    tag: "Webinar",
    title: "Live demo: multi-warehouse workflows",
    body: "See how transfers, reorder points, and reporting work together across locations.",
    href: "/landingPage/resources#multi-warehouse-demo",
  },
  {
    tag: "Guide",
    title: "Why operations teams switch to Logistiq",
    body: "A practical look at what changes when reconciliation moves from days to real time.",
    href: "/landingPage/resources#why-teams-switch",
  },
];

const RATINGS = [
  { score: "4.8", label: "Ease of setup" },
  { score: "4.9", label: "Customer support" },
  { score: "4.7", label: "Value for money" },
];

const INTEREST_OPTIONS = [
  "Inventory Tracking",
  "Order Management",
  "Warehousing",
  "Integrations",
  "Enterprise / Custom",
];

export default function LandingPage() {
  return (
    <main className="bg-white text-[#0B1A3E]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-120px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#C4123A]/10 blur-3xl"
        />
        <div className="relative max-w-[900px] mx-auto px-6 md:px-10 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm mb-7">
            <Sparkles size={13} className="text-[#C4123A]" />
            Inventory management, modernized
          </div>

          <h1 className="font-extrabold leading-[1.12] mb-6 text-[36px] sm:text-[48px] tracking-tight">
            Take control of your inventory.
            <br />
            <span className="bg-gradient-to-r from-[#C4123A] to-[#7a0c24] bg-clip-text text-transparent">
              We&apos;ll take care of the guesswork.
            </span>
          </h1>
          <p className="text-lg text-slate-500 mb-10">
            Get matched with the right plan for your business.
          </p>

          <form
            action="/landingPage/pricing"
            method="GET"
            className="flex flex-col sm:flex-row items-stretch justify-center gap-2 max-w-2xl mx-auto rounded-2xl sm:rounded-full border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/[0.06]"
          >
            <input
              type="text"
              name="skus"
              placeholder="# of SKUs"
              className="rounded-xl sm:rounded-full bg-slate-50 sm:bg-transparent px-5 py-3 text-[15px] flex-1 focus:outline-none focus:ring-2 focus:ring-[#C4123A]/20"
            />
            <div className="hidden sm:block w-px bg-slate-200 my-2" />
            <select
              name="interest"
              defaultValue=""
              className="rounded-xl sm:rounded-full bg-slate-50 sm:bg-transparent px-5 py-3 text-[15px] flex-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C4123A]/20"
            >
              <option value="" disabled>
                What are you managing?
              </option>
              {INTEREST_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-[#C4123A] hover:bg-[#a30f30] transition-colors text-white font-bold px-8 py-3 text-[15px] rounded-xl sm:rounded-full shadow-sm shadow-[#C4123A]/30 whitespace-nowrap"
            >
              Let&apos;s Go
            </button>
          </form>
        </div>
      </section>

      {/* Promo band */}
      <section className="bg-white">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 pb-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1330] to-[#132152] px-8 py-12 md:px-14 md:py-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-900/10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#C4123A]/20 blur-3xl"
            />
            <div className="relative flex items-center gap-6">
              <span className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <PackageCheck size={28} className="text-white" strokeWidth={1.5} />
              </span>
              <div>
                <h2 className="text-white font-extrabold text-2xl sm:text-3xl leading-tight mb-2 tracking-tight">
                  Getting started with Logistiq is easy.
                  <br />
                  Sign up today and get your first month FREE.
                </h2>
                <p className="text-sm text-white/60">
                  See the{" "}
                  <Link href="/landingPage/pricing#terms" className="underline text-white/80 hover:text-white">
                    terms and conditions
                  </Link>
                </p>
              </div>
            </div>
            <Link
              href="/landingPage/pricing"
              className="relative bg-white text-[#C4123A] font-bold px-8 py-3.5 text-[15px] rounded-full hover:bg-slate-100 transition-colors no-underline whitespace-nowrap shadow-sm"
            >
              Get Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20 text-center">
          <h2 className="text-3xl font-extrabold mb-14 tracking-tight">
            Managing and tracking inventory has never been easier
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-14">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 px-8 py-10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="text-xs font-bold tracking-[0.08em] text-slate-400 mb-3">{s.label}</div>
                <div className="text-3xl font-extrabold mb-1">{s.value}</div>
                <div className="text-base text-slate-500">{s.sub}</div>
              </div>
            ))}
          </div>
          <Link
            href="/landingPage/pricing"
            className="inline-block bg-[#C4123A] hover:bg-[#a30f30] text-white font-bold px-8 py-3.5 text-[15px] rounded-full shadow-sm shadow-[#C4123A]/25 transition-all hover:shadow-md hover:shadow-[#C4123A]/30 no-underline"
          >
            Get Pricing
          </Link>
        </div>
      </section>

      {/* Business size segments */}
      <section className="bg-slate-50">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20">
          <h2 className="text-3xl font-extrabold text-center mb-14 tracking-tight">
            No matter your business size, we&apos;ve got you covered
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {SEGMENTS.map((seg) => (
              <div
                key={seg.title}
                className="rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
              >
                <div className="p-8 flex flex-col items-center text-center flex-1">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C4123A]/8 mb-5">
                    <seg.icon size={30} className="text-[#C4123A]" strokeWidth={1.5} />
                  </span>
                  <div className="text-xs font-bold tracking-[0.08em] text-[#C4123A] mb-2">{seg.tag}</div>
                  <h3 className="text-xl font-extrabold mb-3">{seg.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">{seg.body}</p>
                  <div className="w-full">
                    {seg.links.map((l) => (
                      <Link
                        key={l.label}
                        href={l.href}
                        className="flex items-center justify-between py-3 border-t border-slate-100 text-sm font-semibold text-[#0B1A3E] hover:text-[#C4123A] transition-colors no-underline"
                      >
                        {l.label}
                        <ArrowRight size={15} className="text-[#C4123A]" />
                      </Link>
                    ))}
                  </div>
                </div>
                <Link
                  href={`/landingPage/solutions#${seg.slug}`}
                  className="bg-[#0B1A3E] hover:bg-[#0A1330] transition-colors text-white text-xs font-bold tracking-[0.05em] py-4 flex items-center justify-center gap-1.5 no-underline"
                >
                  MORE {seg.title.toUpperCase()} SOLUTIONS
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest resources */}
      <section className="bg-white">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20">
          <h2 className="text-3xl font-extrabold mb-14 tracking-tight">Latest from Logistiq</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {RESOURCES.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-br from-[#0A1330] to-[#132152] flex items-center px-6">
                  <span className="text-white/70 text-xs font-bold tracking-[0.08em] rounded-full bg-white/10 px-3 py-1">
                    {r.tag.toUpperCase()}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{r.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{r.body}</p>
                  <Link href={r.href} className="text-sm font-bold text-[#C4123A] no-underline inline-flex items-center gap-1">
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ratings / recognition */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-16">
          <h2 className="text-2xl font-extrabold text-center mb-10 tracking-tight">As rated by our customers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {RATINGS.map((r) => (
              <div
                key={r.label}
                className="rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center py-8 px-4"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="#C4123A" color="#C4123A" />
                  ))}
                </div>
                <div className="text-2xl font-extrabold mb-1">
                  {r.score}
                  <span className="text-slate-400 text-base">/5</span>
                </div>
                <div className="text-xs font-bold tracking-[0.06em] text-slate-400">{r.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get started form */}
      <section className="bg-white">
        <div className="max-w-[640px] mx-auto px-6 md:px-10 py-20">
          <div className="rounded-3xl border border-slate-100 shadow-lg shadow-slate-900/[0.05] p-10 sm:p-12 text-center">
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight">Get started</h2>
            <p className="text-slate-500 mb-10">Let&apos;s find the perfect plan for your business.</p>

            <form action="/landingPage/pricing" method="GET">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left mb-6">
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Full Name</span>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C4123A]/20 focus:border-[#C4123A]"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C4123A]/20 focus:border-[#C4123A]"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Company Name</span>
                  <input
                    name="company"
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C4123A]/20 focus:border-[#C4123A]"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5"># of SKUs</span>
                  <input
                    name="skus"
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C4123A]/20 focus:border-[#C4123A]"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="bg-[#C4123A] hover:bg-[#a30f30] transition-colors text-white font-bold px-10 py-3.5 text-[15px] rounded-full shadow-sm shadow-[#C4123A]/25 mb-4"
              >
                Get Pricing
              </button>
            </form>
            <p className="text-xs text-slate-400">
              Your <Link href="/landingPage/about#data-privacy" className="text-[#C4123A] font-semibold no-underline">privacy</Link> is assured.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
