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
import { getCurrentUser } from "@/app/lib/auth";
import { orchestrate } from "../lib/orchestrate";
import { redirect } from "next/navigation";

// testing info
// Email: test@testcenter.com
// Password: test123456

import "@/app/modules";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function activityLabel(delta: number): string {
  return delta > 0 ? "Restocked" : "Adjusted";
}

function bodyArray<T>(result: { status: number; body: any }, key: string): T[] {
  if (result.status !== 200) return [];
  const value = result.body?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
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

// Real purchase order statuses are lowercase strings ("draft", "submitted",
// "partially_received") — these two lookups replace the old capitalized
// mock keys with the real values, instead of adding a separate mapping step.
const PO_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-sky-50 text-sky-700",
  partially_received: "bg-amber-50 text-amber-700",
};
const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  partially_received: "Partially Received",
};

const ACTIVITY_STATUS_STYLES: Record<string, string> = {
  Restocked: "bg-emerald-50 text-emerald-700",
  Adjusted: "bg-slate-100 text-slate-600",
};

// --- Page -------------------------------------------------------------------

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ warehouse?: string }>;
}) {
  const { warehouse: warehouseId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };

  const [lowStockRes, purchaseOrdersRes, topProductsRes, topCustomersRes, revenueRes, unpaidRes, activityRes, productsRes, warehouseRes] =
    await Promise.all([
      orchestrate({ action: "lowStock", warehouseId }, ctx),
      orchestrate({ action: "listPurchaseOrders" }, ctx),
      orchestrate({ action: "topProducts", limit: 3 }, ctx),
      orchestrate({ action: "topCustomers", limit: 3 }, ctx),
      orchestrate({ action: "revenueByDay", days: 30 }, ctx),
      orchestrate({ action: "listSalesOrders", unpaidOnly: true }, ctx),
      orchestrate({ action: "listInventoryEvents", limit: 5, warehouseId }, ctx),
      orchestrate({ action: "listProducts" }, ctx),
      orchestrate({ action: "listWarehouse" }, ctx),
    ]);

  const reorderItems = bodyArray<{ id: string; name: string; sku: string }>(lowStockRes, "products");

  const openPurchaseOrders = bodyArray<{
    id: string;
    poNumber: string;
    status: string;
    supplier: { name: string };
  }>(purchaseOrdersRes, "purchaseOrders").filter((po) => po.status !== "received");

  const topProducts = bodyArray<{ id: string; name: string; sku: string; unitsSold: number }>(
    topProductsRes,
    "products"
  );

  const topCustomers = bodyArray<{
    id: string;
    name: string;
    email: string | null;
    totalRevenue: number;
  }>(topCustomersRes, "customers");

  const revenueSeries = bodyArray<{ date: string; total: number }>(revenueRes, "series");

  const unpaidOrders = bodyArray<{
    id: string;
    soNumber: string;
    dueDate: Date | string | null;
    balanceDue: number;
    customer: { name: string };
  }>(unpaidRes, "salesOrders");

  const activity = bodyArray<{
    id: string;
    delta: number;
    createdAt: Date | string;
    product: { name: string };
    warehouse: { name: string };
  }>(activityRes, "events");

  const totalSkuCount = bodyArray<unknown>(productsRes, "products").length;
  const warehouses = bodyArray<{ id: string, name: string }>(warehouseRes, "warehouses");

  const toPurchaseCount = reorderItems.length;
  const toTransferCount = 0;

  const maxRevenue = Math.max(...revenueSeries.map((d) => d.total), 1); // avoid divide-by-zero on an empty series
  const revenueBarHeights = revenueSeries.map((d) => (d.total / maxRevenue) * 100);
  const totalRevenue = revenueSeries.reduce((sum, d) => sum + d.total, 0);

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
            {totalSkuCount.toLocaleString()} SKUs tracked across your organization.
          </p>
        </div>
        <WarehouseFilter warehouses={warehouses} selectedId={warehouseId} />
      </div>

      <div className="mb-6">
        <CopilotTipBanner />
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Products to reorder */}
        <div className="xl:col-span-4 h-full flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <CardHeader
            icon={RefreshCw}
            count={String(reorderItems.length)}
            label="Products to reorder"
          />
          <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShoppingCart size={13} className="text-accent" /> {toPurchaseCount} to purchase
            </span>
            <span className="flex items-center gap-1.5">
              <Repeat size={13} className="text-slate-400" /> {toTransferCount} to transfer
            </span>
          </div>
          <div className="flex flex-1 flex-col divide-y divide-slate-50 max-h-[380px] overflow-y-auto -mx-1">
            {reorderItems.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                Nothing needs reordering here
              </div>
            ) : (
              reorderItems.map((it) => (
                <div key={it.id} className="flex items-center gap-3 px-1 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/8 text-accent">
                    <ShoppingCart size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{it.name}</p>
                    <p className="text-xs text-slate-400">{it.sku}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button type="button" className="mt-auto pt-4 flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-hover">
            Reorder <ArrowRight size={14} />
          </button>
        </div>

        {/* Open purchase orders */}
        <div className="xl:col-span-4 h-full flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <CardHeader icon={ClipboardList} count={String(openPurchaseOrders.length)} label="Open purchase orders" />
          <div className="flex flex-1 flex-col divide-y divide-slate-50">
            {openPurchaseOrders.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                No open purchase orders
              </div>
            ) : (
              openPurchaseOrders.map((po) => (
                <div key={po.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{po.poNumber}</p>
                    <p className="text-xs text-slate-400 truncate">{po.supplier.name}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${PO_STATUS_STYLES[po.status]}`}>
                    {PO_STATUS_LABELS[po.status] ?? po.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <button type="button" className="mt-auto pt-4 flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-hover">
            All purchase orders <ArrowRight size={14} />
          </button>
        </div>

        {/* Top products + Top customers, stacked */}
        <div className="xl:col-span-4 h-full flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <CardHeader icon={Trophy} label="Top 3 products" />
            <div className="flex flex-col divide-y divide-slate-50">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground shrink-0">{p.unitsSold.toLocaleString()} units</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <CardHeader icon={Users} label="Top 3 customers" />
            <div className="flex flex-col divide-y divide-slate-50">
              {topCustomers.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.email ?? "No email on file"}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground shrink-0">{formatCurrency(c.totalRevenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue chart — full width, its own row */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mt-6">
        <CardHeader icon={BarChart3} count={formatCurrency(totalRevenue)} label="Total sales revenue · last 30 days" />
        <div className="flex items-end gap-1.5 h-36">
          {revenueBarHeights.map((v, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-md ${i === revenueBarHeights.length - 1 ? "bg-accent" : "bg-slate-200"}`}
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
                {unpaidOrders.length} unpaid sales orders
              </h2>
            </div>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {unpaidOrders.map((o) => {
                const overdue = o.dueDate ? new Date(o.dueDate) < new Date() : false;
                const dueLabel = o.dueDate
                  ? new Date(o.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "No due date";

                return (
                  <tr key={o.id} className="border-b border-slate-50 last:border-b-0">
                    <td className="px-6 py-3">
                      <p className="font-semibold text-foreground">{o.soNumber}</p>
                      <p className="text-xs text-slate-400">{o.customer.name}</p>
                    </td>
                    <td className={`px-4 py-3 text-xs font-semibold ${overdue ? "text-red-500" : "text-slate-400"}`}>
                      Due {dueLabel}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-foreground">{formatCurrency(o.balanceDue)}</td>
                  </tr>
                );
              })}
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
              {activity.map((row) => {
                const label = activityLabel(row.delta);

                return (
                  <tr key={row.id} className="border-b border-slate-50 last:border-b-0">
                    <td className="px-6 py-3">
                      <p className="font-semibold text-foreground">{row.product.name}</p>
                      <p className="text-xs text-slate-400">{row.warehouse.name}</p>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${row.delta > 0 ? "text-emerald-600" : "text-slate-600"}`}>
                      {row.delta > 0 ? "+" : ""}
                      {row.delta} units
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${ACTIVITY_STATUS_STYLES[label]}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-xs text-slate-400">{formatRelativeTime(new Date(row.createdAt))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
