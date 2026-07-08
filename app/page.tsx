import { TriangleAlert } from "lucide-react"

export default function LandingPage() {
  const problemsSection = [
    { problem: "Difficulty tracking stock levels and product movement." },
    { problem: "Time-consuming manual inventory updates and reconciliation." },
    { problem: "Excessive time spent on inventory and operational tasks." },
    { problem: "Time-consuming manual inventory updates and reconciliation." },
    { problem: "Inventory spread across disconnected spreadsheets and software."},
    { problem: "Slow purchasing and restocking workflows."}

  ]
  return (
    <main className="bg-[#FCF0DB]">
      {/* Hero Section */}
      <section className="px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-800 leading-[1.1]">
          Trucking software that puts you in control
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          Dispatch loads, track your fleet, and get paid faster &mdash; all from one place with Logistiq.
        </p>

        <div className="mt-8">
          {/* Replace with a button and input field for customers to reach out for direct questions */}
          <a
            href="/sign-up"
            className="inline-block text-[15px] font-bold text-slate-900 bg-[#F5A623] hover:bg-[#e69712] px-6 py-3 rounded-full transition-colors no-underline"
          >
            Try Logistiq for free!
          </a>

        </div>

        <p className="mt-4 text-sm text-slate-500 leading-relaxed">
          Free 14-day trial.
          <br />
          No credit card required.
        </p>
      </section>

      {/* Hero image */}
      <section className="mx-auto">

        <img
          src="/assets/hero/hero-group.png"
          alt="Logistiq product screens showing inventory, quantity on hand, sales orders, and product barcode labels"
          className="w-full h-auto"
        />
      </section>
      {/* Problems Page  */}
      <section className="bg-white">
        <div className="pt-20 pb-16 px-6">
          <h2 className="block mx-auto w-fit text-4xl text-zinc-800 font-extrabold mb-12">Does this sound familiar?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-2 gap-x-10 gap-y-8 max-w-5xl mx-auto">
            {problemsSection.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-600">
                <TriangleAlert size={20} className="shrink-0 text-[#F5A623]" />
                <p className="text-sm leading-snug">{p.problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      { /* Info Cards */}
      <section>
            
      </section>
    </main>
  );
}
