import Link from "next/link";
import Image from "next/image"

export default function LandingNav() {
  return (
    <nav className="bg-[#FCF0DB] px-8 h-[76px] flex items-center justify-between">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <Image
          src="/logistiq-logo.svg"
          alt="Logistiq"
          width={40}
          height={40}
          className="h-50 w-50"
        />
      </Link>

      {/* Nav links */}
      <ul className="hidden md:flex items-center gap-8 list-none">
        {["Support", "Pricing", "Book a Demo"].map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-lg  text-slate-900 font-bold hover:text-slate-600 transition-colors no-underline"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>

      {/* Auth buttons */}
      <div className="flex items-center gap-3">
        <a
          href="/sign-in"
          className="text-[15px] font-semibold text-slate-900 border border-slate-900/70 hover:bg-slate-900 hover:text-white px-5 py-2 rounded-full transition-colors no-underline"
        >
          Log in
        </a>
        <a
          href="/sign-up"
          className="text-[15px] font-bold text-slate-900 bg-[#F5A623] hover:bg-[#e69712] px-5 py-2 rounded-full transition-colors no-underline"
        >
          Free trial
        </a>
      </div>

    </nav>
  );
}
