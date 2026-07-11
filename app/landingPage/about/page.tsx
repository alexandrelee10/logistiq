import Link from "next/link";
import { ShieldCheck, Lock, Briefcase } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="bg-white text-[#0B1A3E]">
      <section className="bg-[#EEF0F1]">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 pt-20 pb-16 text-center">
          <h1 className="text-[32px] sm:text-[40px] font-extrabold leading-[1.15] mb-6">
            Built for operations teams who are done guessing
          </h1>
          <p className="text-lg text-slate-600">
            Logistiq started as a way to answer one question honestly: how much stock do we actually have,
            right now, everywhere. Everything we build still points back to that.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 py-20">
          <h2 className="text-2xl font-extrabold mb-4">What we&apos;re trying to do</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Most inventory problems aren&apos;t really inventory problems — they&apos;re reconciliation problems.
            Stock is scattered across spreadsheets, marketplaces, and warehouses that don&apos;t talk to each other,
            so the number on the screen and the number on the shelf drift apart. Logistiq exists to close that gap,
            in real time, for teams of every size.
          </p>
          <p className="text-slate-600 leading-relaxed">
            We&apos;d rather ship fewer features that hold up under real operational load than a long list of
            features that only work in a demo.
          </p>
        </div>
      </section>

      <section id="careers" className="scroll-mt-24 bg-[#EEF0F1]">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 py-16">
          <Briefcase size={32} className="text-[#C4123A] mb-5" strokeWidth={1.5} />
          <h2 className="text-2xl font-extrabold mb-4">Careers</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            We&apos;re a small team building for operations people, and we hire the same way we build: carefully,
            and for the long run. Open roles will be listed here as they come up.
          </p>
          <a
            href="mailto:careers@logistiq.example"
            className="inline-block border border-[#C4123A] text-[#C4123A] hover:bg-[#C4123A]/5 font-bold px-6 py-3 text-[15px] transition-colors no-underline"
          >
            Get in touch
          </a>
        </div>
      </section>

      <section id="data-security" className="scroll-mt-24 bg-white">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 py-16">
          <ShieldCheck size={32} className="text-[#C4123A] mb-5" strokeWidth={1.5} />
          <h2 className="text-2xl font-extrabold mb-4">Data security</h2>
          <p className="text-slate-600 leading-relaxed">
            Your inventory and order data is encrypted in transit and at rest, with role-based access so
            teammates only see what they need to. Access to production systems is limited and logged.
          </p>
        </div>
      </section>

      <section id="data-privacy" className="scroll-mt-24 bg-[#EEF0F1]">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 py-16">
          <Lock size={32} className="text-[#C4123A] mb-5" strokeWidth={1.5} />
          <h2 className="text-2xl font-extrabold mb-4">Data privacy</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            We only collect the data we need to run your account, we don&apos;t sell it, and we&apos;ll tell you
            plainly if that ever changes. A full privacy policy will be published here before launch.
          </p>
          <Link
            href="/landingPage/pricing#terms"
            className="text-[#C4123A] font-bold text-sm no-underline"
          >
            See our terms &amp; conditions
          </Link>
        </div>
      </section>
    </main>
  );
}
