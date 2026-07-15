import Link from "next/link";

const SOCIALS = ["F", "X", "in", "YT"];

const FOOTER_COLUMNS = [
  {
    heading: "Platform",
    links: [
      { label: "Inventory Tracking", href: "/landingPage/platform#inventory-tracking" },
      { label: "Order Management", href: "/landingPage/platform#order-management" },
      { label: "Warehousing", href: "/landingPage/platform#multi-warehouse" },
      { label: "Integrations", href: "/landingPage/platform#app-integrations" },
      { label: "App Marketplace", href: "/landingPage/platform" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "Small Business", href: "/landingPage/solutions#small-business" },
      { label: "Growing Business", href: "/landingPage/solutions#growing-business" },
      { label: "Enterprise", href: "/landingPage/solutions#enterprise" },
      { label: "By Industry", href: "/landingPage/solutions" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Reports & Guides", href: "/landingPage/resources" },
      { label: "Webinars", href: "/landingPage/resources" },
      { label: "Help Center", href: "/landingPage/resources" },
      { label: "API Docs", href: "/landingPage/platform#api-access" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/landingPage/about" },
      { label: "Careers", href: "/landingPage/about#careers" },
      { label: "Data Security", href: "/landingPage/about#data-security" },
      { label: "Data Privacy", href: "/landingPage/about#data-privacy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#0A1330] to-[#060b1f] text-white/70">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-14">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white font-bold text-sm mb-4">{col.heading}</h4>
              <ul className="flex flex-col gap-3 list-none p-0 m-0">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/60 hover:text-white transition-colors no-underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/10">
          <Link href="/landingPage" className="flex items-center gap-2 no-underline">
            <span className="font-bold text-white text-sm">Logistiq</span>
          </Link>

          <div className="flex items-center gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 hover:bg-white/5 transition-colors text-xs font-bold no-underline"
              >
                {s}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link href="/landingPage/pricing#terms" className="text-white/60 hover:text-white transition-colors no-underline">Terms</Link>
            <Link href="/landingPage/about#data-privacy" className="text-white/60 hover:text-white transition-colors no-underline">Privacy</Link>
            <Link href="/landingPage/resources" className="text-white/60 hover:text-white transition-colors no-underline">Site Map</Link>
          </div>
        </div>

        <p className="text-xs text-white/40 mt-8">
          Logistiq and the Logistiq logo are trademarks of Logistiq, Inc. Copyright &copy; {new Date().getFullYear()} Logistiq, Inc.
        </p>
      </div>
    </footer>
  );
}
