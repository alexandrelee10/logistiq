import { TriangleAlert } from "lucide-react"
import Image from "next/image"

export default function LandingPage() {
  const problemsSection = [
    { problem: "Difficulty tracking stock levels and product movement." },
    { problem: "Time-consuming manual inventory updates" },
    { problem: "Excessive time spent on inventory and operational tasks." },
    { problem: "Time-consuming manual inventory updates" },
    { problem: "Inventory spread across disconnected spreadsheets and software."},
    { problem: "Slow purchasing and restocking workflows."}

  ];

  const infoCard = [
    {
      title: "Spreadsheets slow you down",
      description: "Inventory spreadsheets are tedious. You have to update them manually and they’re notoriously hard to read.",
      heroImage: "/assets/info-cards/spreadsheet.png"
    },
    {
      title: "Access your business anywhere",
      description: "Manage inventory, process orders, and track operations from any device, whether you're in the warehouse or on the go.",
      heroImage: "/assets/info-cards/inventory.png"
    },
    {
      title: "Work from anywhere",
      description: "Stay connected to your inventory and orders from your phone, tablet, or computer so your business keeps moving wherever you are.",
      heroImage: "/assets/info-cards/Items.png"
    }
  ]
  return (
    <main className="bg-[#FCF0DB]">
      {/* Hero Section */}
      <section className="px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-800 leading-[1.1]">
          Inventory software that puts you in control
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          Track stock, manage orders, and restock faster &mdash; all from one place with Logistiq.
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
                <TriangleAlert size={25} className="shrink-0 text-[#F5A623]" />
                <p className="leading-snug text-md">{p.problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Info Cards */}
      <section className="bg-[#FCF0DB]">
        <div className="pt-20 pb-24 px-6">
          <h2 className="block mx-auto w-fit text-4xl text-zinc-800 font-extrabold mb-3">Why teams switch to Logistiq</h2>
          <p className="block mx-auto w-fit text-slate-500 text-lg mb-14 text-center max-w-xl">
            Everything you need to run inventory, in one simple place.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {infoCard.map((card, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-8 flex flex-col items-center text-center shadow-md shadow-black/10 ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative w-full h-40 mb-6 rounded-xl bg-[#FCF0DB]/60 overflow-hidden">
                  <Image
                    src={card.heroImage}
                    alt={card.title}
                    fill
                    className="object-contain p-4 transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-xl font-bold text-zinc-800 mb-2">{card.title}</h3>
                <p className="text-slate-600 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white">
        <div className="pt-20 pb-20 px-6">
          <h2 className="block mx-auto w-fit text-4xl text-zinc-800 font-extrabold mb-3">
            See everything, in real time
          </h2>
          <p className="block mx-auto w-fit text-slate-500 text-lg mb-14 text-center max-w-xl">
            Stock levels, order statuses, and margins &mdash; all live, all in one dashboard.
          </p>
          <div className="max-w-5xl mx-auto">
            <Image
              src="/assets/features/feature-cards.svg"
              alt="Logistiq dashboard cards showing product stock, order statuses, and cost and margins"
              width={1240}
              height={460}
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-zinc-900">
        <div className="py-20 px-6 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to take control of your inventory?
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Join teams who ditched the spreadsheets. Get started in minutes.
          </p>
          <a
            href="/sign-up"
            className="inline-block text-[15px] font-bold text-slate-900 bg-[#F5A623] hover:bg-[#e69712] px-6 py-3 rounded-full shadow-sm shadow-black/20 transition-colors no-underline"
          >
            Try Logistiq for free!
          </a>
          <p className="mt-4 text-sm text-zinc-500">
            Free 14-day trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-500 text-sm">
        <div className="px-6 py-8 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logistiq-logo.svg"
              alt="Logistiq"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="font-semibold text-zinc-300">Logistiq</span>
          </div>

          <p>&copy; {new Date().getFullYear()} Logistiq. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-300 transition-colors no-underline">Support</a>
            <a href="#" className="hover:text-zinc-300 transition-colors no-underline">Pricing</a>
            <a href="#" className="hover:text-zinc-300 transition-colors no-underline">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
