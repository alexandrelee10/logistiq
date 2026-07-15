"use client";

import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Package,
  ClipboardList,
  Warehouse,
  Plug,
  LayoutGrid,
  Store,
  Building2,
  Factory,
  Boxes,
  FileText,
  Video,
  LifeBuoy,
  Code2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logistiqLogo from "@/public/assets/logo/logo.png";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  description: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const PLATFORM: NavGroup = {
  label: "Platform",
  items: [
    {
      icon: Package,
      label: "Inventory Tracking",
      href: "/landingPage/platform#inventory-tracking",
      description: "Real-time visibility into every SKU, everywhere.",
    },
    {
      icon: ClipboardList,
      label: "Order Management",
      href: "/landingPage/platform#order-management",
      description: "Pick, pack, and fulfill without the spreadsheets.",
    },
    {
      icon: Warehouse,
      label: "Warehousing",
      href: "/landingPage/platform#multi-warehouse",
      description: "Coordinate transfers across every location.",
    },
    {
      icon: Plug,
      label: "Integrations",
      href: "/landingPage/platform#app-integrations",
      description: "Connect the tools already running your business.",
    },
    {
      icon: LayoutGrid,
      label: "App Marketplace",
      href: "/landingPage/platform",
      description: "Browse every Logistiq-ready integration.",
    },
  ],
};

const SOLUTIONS: NavGroup = {
  label: "Solutions",
  items: [
    {
      icon: Store,
      label: "Small Business",
      href: "/landingPage/solutions#small-business",
      description: "1-49 SKUs. Simple tools that get out of your way.",
    },
    {
      icon: Building2,
      label: "Growing Business",
      href: "/landingPage/solutions#growing-business",
      description: "50-999 SKUs. Scale without adding headcount.",
    },
    {
      icon: Factory,
      label: "Enterprise",
      href: "/landingPage/solutions#enterprise",
      description: "1,000+ SKUs. Infrastructure built for scale.",
    },
    {
      icon: Boxes,
      label: "By Industry",
      href: "/landingPage/solutions",
      description: "Retail, wholesale, manufacturing, and more.",
    },
  ],
};

const RESOURCES: NavGroup = {
  label: "Resources",
  items: [
    {
      icon: FileText,
      label: "Reports & Guides",
      href: "/landingPage/resources",
      description: "Benchmarks and playbooks from the field.",
    },
    {
      icon: Video,
      label: "Webinars",
      href: "/landingPage/resources",
      description: "Live product walkthroughs and demos.",
    },
    {
      icon: LifeBuoy,
      label: "Help Center",
      href: "/landingPage/resources",
      description: "Answers, docs, and how-tos.",
    },
    {
      icon: Code2,
      label: "API Docs",
      href: "/landingPage/platform#api-access",
      description: "Build on top of the Logistiq platform.",
    },
  ],
};

const NAV_GROUPS: NavGroup[] = [PLATFORM, SOLUTIONS, RESOURCES];

const SIMPLE_LINKS = [
  { label: "Pricing", href: "/landingPage/pricing" },
  { label: "About", href: "/landingPage/about" },
];

function NavDropdown({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-[15px] font-semibold text-slate-700 hover:text-[#0B1A3E] transition-colors py-2"
      >
        {group.label}
        <ChevronDown
          size={15}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute left-1/2 top-full z-50 w-[360px] -translate-x-1/2 pt-3 transition-all duration-150 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="rounded-2xl border border-slate-200/70 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-900/[0.08] p-2.5">
          {group.items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors no-underline group"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C4123A]/8 text-[#C4123A] group-hover:bg-[#C4123A] group-hover:text-white transition-colors">
                <item.icon size={17} strokeWidth={2} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#0B1A3E]">{item.label}</span>
                <span className="block text-xs text-slate-500 leading-snug mt-0.5">{item.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileGroup({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3.5 text-[15px] font-semibold text-[#0B1A3E]"
        aria-expanded={open}
      >
        {group.label}
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="flex flex-col gap-1 pb-3">
          {group.items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 no-underline"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C4123A]/8 text-[#C4123A]">
                <item.icon size={15} />
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link className="flex items-center gap-2" href="/landingPage">
          {logoError ? (
            <span className="font-extrabold text-lg text-[#0B1A3E]">Logistiq</span>
          ) : (
            <Image
              src={logistiqLogo}
              alt="Logistiq"
              className="h-11 w-auto object-contain"
              priority
              onError={() => setLogoError(true)}
              height={400}
              width={400}
            />
          )}
        </Link>

        {/* Nav Elements */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_GROUPS.map((group) => (
            <NavDropdown key={group.label} group={group} />
          ))}
          {SIMPLE_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-semibold text-slate-700 hover:text-[#0B1A3E] transition-colors no-underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-semibold text-slate-700 hover:text-[#0B1A3E] px-4 py-2.5 rounded-full transition-colors no-underline"
          >
            Sign In
          </Link>
          <Link
            href="/landingPage/pricing"
            className="text-sm font-bold text-white bg-[#C4123A] hover:bg-[#a30f30] px-5 py-2.5 rounded-full shadow-sm shadow-[#C4123A]/30 transition-all hover:shadow-md hover:shadow-[#C4123A]/40 no-underline"
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
        <div className="lg:hidden bg-white border-t border-slate-200/70 px-6 py-4 max-h-[calc(100vh-72px)] overflow-y-auto">
          <div className="flex flex-col">
            {NAV_GROUPS.map((group) => (
              <MobileGroup key={group.label} group={group} />
            ))}
            {SIMPLE_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-3.5 text-[15px] font-semibold text-[#0B1A3E] no-underline border-b border-slate-100 last:border-b-0"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-5">
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-[#0B1A3E] border border-slate-200 rounded-full px-5 py-2.5 text-center no-underline"
              onClick={() => setMobileOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/landingPage/pricing"
              className="text-sm font-bold text-white bg-[#C4123A] rounded-full px-5 py-2.5 text-center no-underline"
              onClick={() => setMobileOpen(false)}
            >
              Get Pricing
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
