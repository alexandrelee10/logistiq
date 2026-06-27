export default function DriverNav() {
  return (
    <nav className="bg-white border-b border-slate-200 px-8 h-[60px] flex items-center justify-between">

      {/* Logo */}
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <span className="text-[16px] font-bold text-slate-900 tracking-tight">Logistiq</span>
      </a>

      {/* Nav links */}
      <ul className="flex items-center gap-1 list-none">
        {["Products", "Features", "About us", "Contact Us"].map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-sm text-slate-500 font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors no-underline"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>

      {/* Auth buttons */}
      <div className="flex items-center gap-2">
        <a href="/sign-in" className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3.5 py-1.5 rounded-[7px] transition-colors no-underline">
          Sign in
        </a>
        <a href="/sign-up" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-[7px] transition-colors no-underline tracking-tight">
          Sign up
        </a>
      </div>

    </nav>
  );
}