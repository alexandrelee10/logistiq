"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logistiqLogo from "@/public/assets/logo/logo.png";

const NAV_LINKS = [
  { label: "Platform", href: "/landingPage/platform" },
  { label: "Solutions", href: "/landingPage/solutions" },
  { label: "Pricing", href: "/landingPage/pricing" },
  { label: "Resources", href: "/landingPage/resources" },
  { label: "About", href: "/landingPage/about" },
];

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <Link className="flex items-center gap-2" href="/landingPage">
          {logoError ? (
            <span className="font-extrabold text-lg text-[#0B1A3E]">Logistiq</span>
          ) : (
            <Image
              src={logistiqLogo}
              alt="Logistiq"
              className="h-44 w-auto object-contain"
              priority
              onError={() => setLogoError(true)}
              height={400}
              width={400}
            />
          )}
        </Link>

        {/* Nav Elements */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-semibold text-[#0B1A3E] hover:text-[#C4123A] transition-colors no-underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-bold text-[#C4123A] border border-[#C4123A] px-5 py-2 hover:bg-[#C4123A]/5 transition-colors no-underline"
          >
            Sign In
          </Link>
          <Link
            href="/landingPage/pricing"
            className="text-sm font-bold text-white bg-[#C4123A] hover:bg-[#a30f30] px-5 py-2 transition-colors no-underline"
          >
            Get Pricing
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-[#0B1A3E]"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-black/10 px-6 py-6 flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-semibold text-[#0B1A3E] no-underline"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/sign-in"
              className="text-sm font-bold text-[#C4123A] border border-[#C4123A] px-5 py-2 text-center no-underline"
            >
              Sign In
            </Link>
            <Link
              href="/landingPage/pricing"
              className="text-sm font-bold text-white bg-[#C4123A] px-5 py-2 text-center no-underline"
            >
              Get Pricing
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
