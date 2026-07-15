"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  ClipboardList,
  BarChart3,
  Plug,
  Settings,
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Eye,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import logistiqLogo from "@/public/assets/logo/logo.png";

export type DashboardUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type NavAction = {
  icon: LucideIcon;
  label: string;
  href: string;
};

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  actions?: NavAction[];
};

const MAIN_NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  {
    icon: Package,
    label: "Inventory",
    href: "/dashboard/inventory",
    actions: [
      { icon: Eye, label: "View Inventory", href: "/dashboard/inventory" },
      { icon: Plus, label: "Add Product", href: "/dashboard/inventory/new" },
    ],
  },
  {
    icon: ShoppingCart,
    label: "Orders",
    href: "/dashboard/orders",
    actions: [
      { icon: Eye, label: "View Orders", href: "/dashboard/orders" },
      { icon: Plus, label: "Create Order", href: "/dashboard/orders/new" },
    ],
  },
  {
    icon: Warehouse,
    label: "Warehouses",
    href: "/dashboard/warehouses",
    actions: [
      { icon: Eye, label: "View Warehouses", href: "/dashboard/warehouses" },
      { icon: Plus, label: "Add Warehouse", href: "/dashboard/warehouses/new" },
    ],
  },
  {
    icon: ClipboardList,
    label: "Purchase Orders",
    href: "/dashboard/purchase-orders",
    actions: [
      { icon: Eye, label: "View Purchase Orders", href: "/dashboard/purchase-orders" },
      { icon: Plus, label: "Create Purchase Order", href: "/dashboard/purchase-orders/new" },
    ],
  },
  {
    icon: BarChart3,
    label: "Reports",
    href: "/dashboard/reports",
    actions: [
      { icon: Eye, label: "View Reports", href: "/dashboard/reports" },
      { icon: Plus, label: "Build Custom Report", href: "/dashboard/reports/new" },
    ],
  },
];

const SECONDARY_NAV: NavItem[] = [
  {
    icon: Plug,
    label: "Integrations",
    href: "/dashboard/integrations",
    actions: [
      { icon: Eye, label: "Browse Integrations", href: "/dashboard/integrations" },
      { icon: Plus, label: "Connect New", href: "/dashboard/integrations/new" },
    ],
  },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

function initials(user: DashboardUser) {
  return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U";
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function NavRow({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const hasActions = !!item.actions?.length;
  const [expanded, setExpanded] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openFlyout = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFlyoutOpen(true);
  };
  const closeFlyoutSoon = () => {
    closeTimer.current = setTimeout(() => setFlyoutOpen(false), 150);
  };

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFlyoutOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={collapsed && hasActions ? openFlyout : undefined}
      onMouseLeave={collapsed && hasActions ? closeFlyoutSoon : undefined}
    >
      <div
        className={`group relative flex items-center rounded-xl transition-colors ${
          active ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"
        }`}
      >
        <Link
          href={item.href}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={`flex flex-1 min-w-0 items-center gap-3 px-3 py-2.5 text-sm font-semibold no-underline ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <item.icon size={18} strokeWidth={2} className={active ? "text-accent" : ""} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>

        {hasActions && !collapsed && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={`${item.label} quick actions`}
            className="pr-3 text-white/30 hover:text-white transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}

        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
        )}
      </div>

      {/* Inline accordion — expanded sidebar / mobile drawer */}
      {hasActions && !collapsed && expanded && (
        <div className="mt-0.5 mb-1 ml-8 flex flex-col gap-0.5">
          {item.actions!.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/45 hover:text-white hover:bg-white/5 no-underline"
            >
              <a.icon size={13} />
              {a.label}
            </Link>
          ))}
        </div>
      )}

      {/* Flyout — collapsed icon-only sidebar */}
      {hasActions && collapsed && (
        <div
          className={`absolute left-full top-0 z-50 ml-2 w-56 transition-all duration-150 ${
            flyoutOpen ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 -translate-x-1 pointer-events-none"
          }`}
        >
          <div className="rounded-xl border border-slate-200/70 bg-white shadow-xl shadow-slate-900/10 p-1.5">
            <p className="px-3 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            {item.actions!.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                onClick={onNavigate}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 no-underline"
              >
                <a.icon size={15} className="text-accent" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarBody({
  collapsed,
  user,
  onNavigate,
  onCopilotClick,
}: {
  collapsed: boolean;
  user: DashboardUser;
  onNavigate?: () => void;
  onCopilotClick: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex items-center h-[72px] px-4 ${collapsed ? "justify-center" : "justify-start"}`}>
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <Image
            src={logistiqLogo}
            alt="Logistiq"
            height={400}
            width={400}
            className="h-50 w-auto object-contain brightness-0 invert"
          />
          {!collapsed && <span className="sr-only">Logistiq</span>}
        </Link>
      </div>

      {/* Ask Copilot */}
      <div className={`px-3 mb-4 ${collapsed ? "px-2" : ""}`}>
        <button
          type="button"
          onClick={onCopilotClick}
          title={collapsed ? "Ask Copilot" : undefined}
          className={`w-full flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#7a0c24] text-white text-sm font-bold px-3 py-2.5 shadow-sm shadow-accent/30 hover:shadow-md hover:shadow-accent/40 transition-all ${
            collapsed ? "justify-center" : "justify-center"
          }`}
        >
          <Sparkles size={16} />
          {!collapsed && "Ask Copilot"}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible px-3 flex flex-col gap-1">
        {MAIN_NAV.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}

        <div className={`my-3 h-px bg-white/10 ${collapsed ? "mx-1" : ""}`} />

        {SECONDARY_NAV.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* User footer */}
      <div className="relative px-3 pb-4 pt-2 border-t border-white/10 mt-2">
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-white/10 bg-[#0A1330] shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-60"
            >
              <LogOut size={15} />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`w-full flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">
            {initials(user)}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold text-white">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block truncate text-xs text-white/45">{formatRole(user.role)}</span>
              </span>
              <ChevronUp
                size={15}
                className={`text-white/40 transition-transform ${menuOpen ? "" : "rotate-180"}`}
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({
  user,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onCopilotClick,
}: {
  user: DashboardUser;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onCopilotClick: () => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-gradient-to-b from-[#0A1330] to-[#060b1f] transition-all duration-200 ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <SidebarBody collapsed={collapsed} user={user} onCopilotClick={onCopilotClick} />
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex items-center justify-center gap-2 border-t border-white/10 py-3 text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-gradient-to-b from-[#0A1330] to-[#060b1f] shadow-2xl flex flex-col">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={onCloseMobile}
                className="text-white/50 hover:text-white p-1"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 -mt-3">
              <SidebarBody
                collapsed={false}
                user={user}
                onNavigate={onCloseMobile}
                onCopilotClick={() => {
                  onCopilotClick();
                  onCloseMobile();
                }}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
