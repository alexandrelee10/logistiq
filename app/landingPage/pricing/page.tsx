import Link from "next/link";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    cadence: "per month",
    description: "For a single location just getting off spreadsheets.",
    features: ["Up to 50 orders / month", "1 user", "1 location", "Barcode scanning"],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "Standard",
    price: "$29",
    cadence: "per month, billed annually",
    description: "For small teams running one or two channels.",
    features: ["Up to 500 orders / month", "3 users", "2 locations", "App integrations"],
    cta: "Get Pricing",
    featured: false,
  },
  {
    name: "Premium",
    price: "$79",
    cadence: "per month, billed annually",
    description: "For growing catalogs across multiple warehouses.",
    features: ["Up to 3,000 orders / month", "5 users", "4 locations", "Automated reorder"],
    cta: "Get Pricing",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "talk to sales",
    description: "For operations teams that need scale and support.",
    features: ["Unlimited orders", "Unlimited users", "Unlimited locations", "Dedicated support"],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <main className="bg-white text-[#0B1A3E]">
      <section className="bg-[#EEF0F1]">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 pt-20 pb-16 text-center">
          <h1 className="text-[32px] sm:text-[40px] font-extrabold leading-[1.15] mb-6">
            Simple pricing. No surprises.
          </h1>
          <p className="text-lg text-slate-600">
            Every plan includes a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col border ${
                  plan.featured ? "border-[#C4123A] border-2" : "border-slate-200"
                } p-8`}
              >
                {plan.featured && (
                  <div className="text-xs font-bold tracking-[0.06em] text-[#C4123A] mb-3">MOST POPULAR</div>
                )}
                <h2 className="text-lg font-extrabold mb-1">{plan.name}</h2>
                <p className="text-sm text-slate-500 mb-6">{plan.description}</p>
                <div className="mb-1">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">{plan.cadence}</p>

                <ul className="flex flex-col gap-3 list-none p-0 m-0 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check size={16} className="text-[#C4123A] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/sign-up"
                  className={`text-center font-bold text-[15px] px-6 py-3 no-underline transition-colors ${
                    plan.featured
                      ? "bg-[#C4123A] hover:bg-[#a30f30] text-white"
                      : "border border-[#C4123A] text-[#C4123A] hover:bg-[#C4123A]/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="terms" className="scroll-mt-24 bg-[#EEF0F1] border-t border-slate-200">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 py-16">
          <h2 className="text-xl font-extrabold mb-4">Terms &amp; conditions</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            First-month and trial promotions apply to new Logistiq accounts only, are limited to one per business,
            and may not be combined with other offers. Plan limits (orders, users, and locations) reset monthly and
            reflect the terms of the plan active on your account at the time of billing. Full terms of service are
            provided at signup.
          </p>
        </div>
      </section>
    </main>
  );
}
