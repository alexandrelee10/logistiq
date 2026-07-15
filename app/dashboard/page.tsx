import { cookies } from "next/headers";
import {
  RefreshCw,
  ClipboardList,
  Trophy,
  Users,
  BarChart3,
  Receipt,
  Activity,
  ShoppingCart,
  Repeat,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import WarehouseFilter from "@/app/components/dashboard/WarehouseFilter";
import CopilotTipBanner from "@/app/components/dashboard/CopilotTipBanner";
import { SESSION_COOKIE_NAME } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function CardHeader({ icon: Icon, count, label, action }: { icon: LucideIcon; count?: string; label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        {count && <p className="text-2xl font-extrabold text-foreground leading-none">{count}</p>}
        <p className="text-sm text-slate-500 mt-1.5 font-medium">{label}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {action}
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/8 text-accent">
          <Icon size={15} />
        </span>
      </div>
    </div>
  );
}

// --- Mock data -------------------------------------------------------------

const REORDER_ITEMS = [
  { name: "Wireless Mouse", sku: "SKU-10234", kind: "purchase" as const },
  { name: 'Packing Tape 3" Clear', sku: "SKU-88213", kind: "transfer" as const },
  { name: "USB-C Cable 2m", sku: "SKU-33110", kind: "purchase" as const },
  { name: "Bubble Mailers #2", sku: "SKU-55291", kind: "purchase" as const },
  { name: "Thermal Printer Paper", sku: "SKU-91002", kind: "purchase" as const },
  { name: "Nitrile Gloves (L)", sku: "SKU-40871", kind: "transfer" as const },
  { name: "Shipping Labels 4x6", sku: "SKU-77410", kind: "purchase" as const },
  { name: 'Stainless Steel Pan 12"', sku: "SKU-32063", kind: "transfer" as const },
];
const TO_PURCHASE = REORDER_ITEMS.filter((i) => i.kind === "purchase").length;
const TO_TRANSFER = REORDER_ITEMS.filter((i) => i.kind === "transfer").length;

const OPEN_PURCHASE_ORDERS = [
  { po: "PO-2043", supplier: "Meridian Packaging Co.", status: "Draft" },
  { po: "PO-2041", supplier: "Northline Supply", status: "Submitted" },
  { po: "PO-2038", supplier: "Meridian Packaging Co.", status: "Partially Received" },
  { po: "PO-2035", supplier: "Coastal Hardware", status: "Submitted" },
  { po: "PO-2031", supplier: "Northline Supply", status: "Draft" },
];
const PO_STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Submitted: "bg-sky-50 text-sky-700",
  "Partially Received": "bg-amber-50 text-amber-700",
};

const TOP_PRODUCTS = [
  { name: "Shipping Labels 4x6", sku: "SKU-77410", tag: "Packaging", value: "3,204 units" },
  { name: "Bubble Mailers #2", sku: "SKU-55291", tag: "Packaging", value: "2,118 units" },
  { name: "Nitrile Gloves (L)", sku: "SKU-40871", tag: "Safety", value: "1,894 units" },
];

const TOP_CUSTOMERS = [
  { name: "Northline Supply", sub: "Wholesale account", value: "$18,240" },
  { name: "Coastal Hardware", sub: "Wholesale account", value: "$12,960" },
  { name: "Meridian Packaging Co.", sub: "Net-30 account", value: "$9,410" },
];

const REVENUE_BARS = [40, 55, 48, 60, 52, 70, 45, 38, 64, 58, 90, 72, 50, 66, 80, 62];

const UNPAID_ORDERS = [
  { so: "SO-1042", customer: "Northline Supply", due: "Jul 18, 2026", balance: "$2,140.00", overdue: false },
  { so: "SO-1039", customer: "Coastal Hardware", due: "Jul 10, 2026", balance: "$960.50", overdue: true },
  { so: "SO-1035", customer: "Meridian Packaging Co.", due: "Jul 22, 2026", balance: "$4,320.00", overdue: false },
  { so: "SO-1031", customer: "Beacon Retail Group", due: "Jul 5, 2026", balance: "$615.25", overdue: true },
  { so: "SO-1028", customer: "Northline Supply", due: "Jul 28, 2026", balance: "$1,890.00", overdue: false },
];

const ACTIVITY = [
  { item: "Wireless Mouse", warehouse: "Warehouse A", change: "-12 units", status: "Low Stock", updated: "2m ago" },
  { item: "Packing Tape 3\"", warehouse: "Warehouse B", change: "+500 units", status: "Restocked", updated: "18m ago" },
  { item: "USB-C Cable 2m", warehouse: "Warehouse A", change: "-3 units", status: "In Stock", updated: "1h ago" },
  { item: "Shipping Labels 4x6", warehouse: "Warehouse C", change: "+1,200 units", status: "Restocked", updated: "3h ago" },
  { item: "Bubble Mailers #2", warehouse: "Warehouse B", change: "-45 units", status: "Low Stock", updated: "5h ago" },
];
const ACTIVITY_STATUS_STYLES: Record<string, string> = {
  "Low Stock": "bg-amber-50 text-amber-700",
  Restocked: "bg-emerald-50 text-emerald-700",
  "In Stock": "bg-slate-100 text-slate-600",
};

// --- Page -------------------------------------------------------------------

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionUserId
    ? await prisma.user.findUnique({ where: { id: sessionUserId }, select: { firstName: true } })
    : null;

  return (
    <div className="p-5 sm:p-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {greeting()}
            {user ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            8,412 SKUs tracked &middot; $1.82M inventory value across your network.
          </p>
        </div>
        <WarehouseFilter />
      </div>

      <div className="mb-6">
        <CopilotTipBanner />
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Products to reorder */}
        <div className="xl:col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <CardHeader
            icon={RefreshCw}
            count={String(REORDER_ITEMS.length)}
            label="Products to reorder"
          />
          <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShoppingCart size={13} className="text-accent" /> {TO_PURCHASE} to purchase
            </span>
            <span className="flex items-center gap-1.5">
              <Repeat size={13} className="text-slate-400" /> {TO_TRANSFER} to transfer
            </span>
          </div>
          <div className="flex flex-col divide-y divide-slate-50 max-h-[380px] overflow-y-auto -mx-1">
            {REORDER_ITEMS.map((it) => (
              <div key={it.sku} className="flex items-center gap-3 px-1 py-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    it.kind === "purchase" ? "bg-accent/8 text-accent" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {it.kind === "purchase" ? <ShoppingCart size={14} /> : <Repeat size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{it.name}</p>
                  <p className="text-xs text-slate-400">{it.sku}</p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="mt-4 flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-hover">
            Reorder <ArrowRight size={14} />
          </button>
        </div>

        {/* Open purchase orders */}
        <div className="xl:col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <CardHeader icon={ClipboardList} count={String(OPEN_PURCHASE_ORDERS.length)} label="Open purchase orders" />
          <div className="flex flex-col divide-y divide-slate-50">
            {OPEN_PURCHASE_ORDERS.map((po) => (
              <div key={po.po} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{po.po}</p>
                  <p className="text-xs text-slate-400 truncate">{po.supplier}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${PO_STATUS_STYLES[po.status]}`}>
                  {po.status}
                </span>
              </div>
            ))}
          </div>
          <button type="button" className="mt-4 flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-hover">
            All purchase orders <ArrowRight size={14} />
          </button>
        </div>

        {/* Top products + Top customers, stacked */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <CardHeader icon={Trophy} label="Top 3 products" />
            <div className="flex flex-col divide-y divide-slate-50">
              {TOP_PRODUCTS.map((p, i) => (
                <div key={p.sku} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      {p.sku} &middot; {p.tag}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground shrink-0">{p.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <CardHeader icon={Users} label="Top 3 customers" />
            <div className="flex flex-col divide-y divide-slate-50">
              {TOP_CUSTOMERS.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.sub}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground shrink-0">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue chart — full width, its own row */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mt-6">
        <CardHeader icon={BarChart3} count="$182,400" label="Total sales revenue · last 30 days" />
        <div className="flex items-end gap-1.5 h-36">
          {REVENUE_BARS.map((v, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-md ${i === 10 ? "bg-accent" : "bg-slate-200"}`}
              style={{ height: `${v}%` }}
            />
          ))}
        </div>
      </div>

      {/* Bottom row: tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/8 text-accent">
                <Receipt size={15} />
              </span>
              <h2 className="text-sm font-bold text-foreground">
                {UNPAID_ORDERS.length} unpaid sales orders
              </h2>
            </div>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {UNPAID_ORDERS.map((o) => (
                <tr key={o.so} className="border-b border-slate-50 last:border-b-0">
                  <td className="px-6 py-3">
                    <p className="font-semibold text-foreground">{o.so}</p>
                    <p className="text-xs text-slate-400">{o.customer}</p>
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold ${o.overdue ? "text-red-500" : "text-slate-400"}`}>
                    Due {o.due}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-foreground">{o.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/8 text-accent">
                <Activity size={15} />
              </span>
              <h2 className="text-sm font-bold text-foreground">Recent inventory activity</h2>
            </div>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {ACTIVITY.map((row) => (
                <tr key={row.item} className="border-b border-slate-50 last:border-b-0">
                  <td className="px-6 py-3">
                    <p className="font-semibold text-foreground">{row.item}</p>
                    <p className="text-xs text-slate-400">{row.warehouse}</p>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${row.change.startsWith("+") ? "text-emerald-600" : "text-slate-600"}`}>
                    {row.change}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${ACTIVITY_STATUS_STYLES[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-slate-400">{row.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
