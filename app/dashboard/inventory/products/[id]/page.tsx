import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import ProductDetailActions from "@/app/components/dashboard/Inventory/products/ProductDetailActions";
import { getCurrentUser } from "@/app/lib/auth";
import { orchestrate } from "@/app/lib/orchestrate";
import { redirect, notFound } from "next/navigation";

import "@/app/modules";

function bodyObj<T>(result: { status: number; body: Record<string, unknown> }, key: string): T | null {
  if (result.status !== 200) return null;
  return (result.body?.[key] as T) ?? null;
}

function bodyArray<T>(result: { status: number; body: Record<string, unknown> }, key: string): T[] {
  if (result.status !== 200) return [];
  const value = result.body?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatPrice(value: unknown) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}

type RawProduct = {
  id: string;
  sku: string;
  name: string;
  reorderPoint: number;
  price: { toString(): string } | null;
  category: { id: string; name: string } | null;
  createdAt: string;
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };

  const [productRes, inventoryRes, eventsRes, suppliersRes] = await Promise.all([
    orchestrate({ action: "getProduct", productId: id }, ctx),
    orchestrate({ action: "listInventory", productId: id }, ctx),
    orchestrate({ action: "listInventoryEvents", productId: id, limit: 20 }, ctx),
    orchestrate({ action: "listSuppliers" }, ctx),
  ]);

  const rawProduct = bodyObj<RawProduct>(productRes, "product");
  if (!rawProduct) notFound();

  const inventoryItems = bodyArray<{
    id: string;
    quantity: number;
    warehouse: { id: string; name: string; code: string };
  }>(inventoryRes, "items");

  const events = bodyArray<{
    id: string;
    delta: number;
    reason: string | null;
    createdAt: string;
    warehouse: { name: string };
  }>(eventsRes, "events");

  const suppliers = bodyArray<{ id: string; name: string }>(suppliersRes, "suppliers");

  const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = totalQuantity <= rawProduct.reorderPoint;
  const canReorder = ["ADMIN", "MANAGER", "PURCHASING"].includes(user.role);

  const product = {
    id: rawProduct.id,
    name: rawProduct.name,
    sku: rawProduct.sku,
  };

  return (
    <div className="p-5 sm:p-8 w-full max-w-4xl mx-auto">
      <Link
        href="/dashboard/inventory/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-foreground mb-6"
      >
        <ArrowLeft size={14} />
        Back to products
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-4 min-w-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/8 text-accent">
            <Package size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{rawProduct.name}</h1>
              {lowStock && (
                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  Low stock
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {rawProduct.sku}
              {rawProduct.category && (
                <>
                  {" "}
                  ·{" "}
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 align-middle">
                    {rawProduct.category.name}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {canReorder && <ProductDetailActions product={product} suppliers={suppliers} />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-400 mb-1">Total quantity</p>
          <p className="text-xl font-extrabold text-foreground">{totalQuantity.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-400 mb-1">Reorder point</p>
          <p className="text-xl font-extrabold text-foreground">{rawProduct.reorderPoint.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-400 mb-1">Price</p>
          <p className="text-xl font-extrabold text-foreground">{formatPrice(rawProduct.price)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-400 mb-1">Added</p>
          <p className="text-xl font-extrabold text-foreground">{formatDate(rawProduct.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-foreground">Stock by warehouse</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {inventoryItems.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-slate-400">No stock recorded yet</td>
                </tr>
              ) : (
                inventoryItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-b-0">
                    <td className="px-6 py-3">
                      <p className="font-semibold text-foreground">{item.warehouse.name}</p>
                      <p className="text-xs text-slate-400">{item.warehouse.code}</p>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-foreground">
                      {item.quantity.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-foreground">Recent activity</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-slate-400">No recent activity</td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-b-0">
                    <td className="px-6 py-3">
                      <p className={`font-semibold ${e.delta > 0 ? "text-emerald-600" : "text-slate-600"}`}>
                        {e.delta > 0 ? "+" : ""}
                        {e.delta.toLocaleString()} units
                      </p>
                      <p className="text-xs text-slate-400">
                        {e.warehouse.name}
                        {e.reason ? ` · ${e.reason}` : ""}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-right text-xs text-slate-400">{formatDateTime(e.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
