"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  ChevronDown,
  Settings,
  LogOut,
  AlertTriangle,
  PackageCheck,
  ClipboardList,
} from "lucide-react";
import type { DashboardUser } from "./Sidebar";

const NOTIFICATIONS = [
  {
    icon: AlertTriangle,
    tone: "text-amber-600 bg-amber-50",
    title: "27 SKUs below reorder point",
    time: "12m ago",
  },
  {
    icon: PackageCheck,
    tone: "text-emerald-600 bg-emerald-50",
    title: "Warehouse B restock confirmed",
    time: "1h ago",
  },
  {
    icon: ClipboardList,
    tone: "text-slate-500 bg-slate-100",
    title: "3 purchase orders awaiting approval",
    time: "3h ago",
  },
];

function initials(user: DashboardUser) {
  return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U";
}

export default function Topbar({
  user,
  onOpenMobileSidebar,
  onCopilotClick,
}: {
  user: DashboardUser;
  onOpenMobileSidebar: () => void;
  onCopilotClick: () => void;
}) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } finally {
      router.push("/sign-in");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[72px] bg-white/80 backdrop-blur-md border-b border-slate-200/70 flex items-center gap-3 px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="lg:hidden text-foreground p-1.5 -ml-1.5"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKUs, orders, warehouses..."
            className="w-full rounded-full bg-slate-100/80 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white border border-transparent focus:border-accent/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Ask Copilot */}
      <button
        type="button"
        onClick={onCopilotClick}
        className="hidden sm:flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-[#7a0c24] text-white text-sm font-bold px-4 py-2.5 shadow-sm shadow-accent/25 hover:shadow-md hover:shadow-accent/35 transition-all"
      >
        <Sparkles size={15} />
        Ask Copilot
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setNotifOpen((v) => !v)}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-200/70 bg-white shadow-xl shadow-slate-900/[0.08] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-foreground">Notifications</span>
            </div>
            <div className="flex flex-col">
              {NOTIFICATIONS.map((n) => (
                <div key={n.title} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.tone}`}>
                    <n.icon size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative" ref={userRef}>
        <button
          type="button"
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-slate-100 transition-colors"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">
            {initials(user)}
          </span>
          <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200/70 bg-white shadow-xl shadow-slate-900/[0.08] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-foreground truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <div className="p-1.5">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 no-underline"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings size={15} />
                Settings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-accent hover:bg-accent/5 transition-colors disabled:opacity-60"
              >
                <LogOut size={15} />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
