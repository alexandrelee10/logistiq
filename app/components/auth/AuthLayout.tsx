import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import logistiqLogo from "@/public/assets/logo/logo.png";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6 py-16">
      {/* Soft ambient accent glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-navy/10 blur-3xl"
      />

      {/* Card */}
      <div className="relative w-full max-w-[600px] rounded-3xl border border-slate-100 bg-white p-12 shadow-xl shadow-slate-900/[0.06] sm:p-14">
        <div className="flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
            <Lock size={15} className="text-foreground/30" />
          </span>
        </div>

        <Link href="/landingPage" className="mt-4 flex justify-center">
          <Image src={logistiqLogo} alt="Logistiq" height={400} width={400} className="h-44 w-auto" />
        </Link>

        <h1 className="mt-8 text-center text-2xl font-extrabold text-foreground tracking-tight">{title}</h1>
        <p className="mt-2 text-center text-sm text-foreground/60">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">{footer}</div>
      </div>
    </main>
  );
}
