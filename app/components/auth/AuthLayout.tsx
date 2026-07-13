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

// One isometric crate: top rhombus + two side faces, anchored at its top vertex.
function crate(cx: number, cy: number, hw: number, th: number, sh: number) {
  const top = `${cx},${cy} ${cx + hw},${cy + th} ${cx},${cy + 2 * th} ${cx - hw},${cy + th}`;
  const left = `${cx - hw},${cy + th} ${cx},${cy + 2 * th} ${cx},${cy + 2 * th + sh} ${cx - hw},${cy + th + sh}`;
  const right = `${cx + hw},${cy + th} ${cx},${cy + 2 * th} ${cx},${cy + 2 * th + sh} ${cx + hw},${cy + th + sh}`;
  return { top, left, right };
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const backLeft = crate(70, 55, 46, 24, 56);
  const backRight = crate(160, 75, 42, 22, 52);
  const front = crate(115, 8, 40, 21, 50);

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface flex items-center justify-center px-6 py-16">
      {/* Corner accent — a stack of crates, standing in for inventory */}
      <svg
        className="pointer-events-none absolute -bottom-6 -right-6 h-[260px] w-[260px] opacity-90"
        viewBox="0 0 240 220"
        aria-hidden="true"
      >
        <polygon points={backLeft.right} fill="#060b1f" />
        <polygon points={backLeft.left} fill="#0a1330" />
        <polygon points={backLeft.top} fill="#132152" />

        <polygon points={backRight.right} fill="#060b1f" />
        <polygon points={backRight.left} fill="#0a1330" />
        <polygon points={backRight.top} fill="#132152" />

        <polygon points={front.right} fill="#7a0c24" />
        <polygon points={front.left} fill="#991230" />
        <polygon points={front.top} fill="#c4123a" />
      </svg>

      {/* Card */}
      <div className="relative w-full max-w-[600px] rounded-2xl border border-black/10 bg-white p-12 shadow-sm sm:p-14">
        <div className="flex items-center justify-between">
          <Lock size={16} className="text-foreground/30" />
        </div>

        <Link href="/landingPage" className="mt-2 flex justify-center">
          <Image src={logistiqLogo} alt="Logistiq" height={400} width={400} className="h-60 w-auto" />
        </Link>

        <h1 className="mt-8 text-center text-2xl font-extrabold text-foreground">{title}</h1>
        <p className="mt-2 text-center text-sm text-foreground/60">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <div className="mt-8 border-t border-black/10 pt-6 text-center">{footer}</div>
      </div>
    </main>
  );
}
