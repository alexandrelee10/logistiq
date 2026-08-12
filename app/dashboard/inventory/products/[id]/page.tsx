import Link from "next/link";
import { ArrowLeft, Package, Paperclip, Copy, Tag, Ban } from "lucide-react";
import ProductDetailActions from "@/app/components/dashboard/Inventory/products/ProductDetailActions";
import ProductTabs from "@/app/components/dashboard/Inventory/products/ProductTabs";
import QuantityByLocationPanel from "@/app/components/dashboard/Inventory/products/QuantityByLocationPanel";
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

// Product.attributes is a Prisma Json column, so at runtime it can be an
// object, array, string, number, or null — this narrows it down to the
// one shape we actually want to render as a label/value grid.
function isAttributeRecord(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Keys createProduct treats as "known" fields with a dedicated spot in the
// UI below (image, description, dimensions, pricing, remarks). Everything
// else in `attributes` is a user-defined custom field and falls into the
// generic "Product details" grid instead. See product.ts's createProduct
// comment for the full rationale.
const RESERVED_ATTRIBUTE_KEYS = new Set([
  "description",
  "imageUrl",
  "barcode",
  "dimensions",
  "weight",
  "baseUnit",
  "packageUnit",
  "unitsPerPackage",
  "cost",
  "notes",
]);

type RawProduct = {
  id: string;
  sku: string;
  name: string;
  reorderPoint: number;
  price: { toString(): string } | null;
  category: { id: string; name: string } | null;
  createdAt: string;
  attributes: unknown;
  purchaseOrderLines: {
    id: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitCost: { toString(): string } | null;
    purchaseOrder: { poNumber: string; status: string; createdAt: string; supplier: { name: string } };
  }[];
  salesOrderLines: {
    id: string;
    quantityOrdered: number;
    quantityFufilled: number;
    unitPrice: { toString(): string } | null;
    salesOrder: { soNumber: string; status: string; createdAt: string; customer: { name: string } };
  }[];
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

  // Pull the reserved display fields out of the attributes blob, and keep
  // whatever's left over for the generic custom-fields grid.
  const attrs = isAttributeRecord(rawProduct.attributes) ? rawProduct.attributes : {};
  const description = attrs.description;
  const imageUrl = attrs.imageUrl;
  const barcode = attrs.barcode;
  const dimensions = attrs.dimensions;
  const weight = attrs.weight;
  const baseUnit = attrs.baseUnit || "unit";
  const packageUnit = attrs.packageUnit;
  const unitsPerPackage = attrs.unitsPerPackage;
  const cost = attrs.cost ? Number(attrs.cost) : undefined;
  const notes = attrs.notes;
  const customAttributes = Object.entries(attrs).filter(([key]) => !RESERVED_ATTRIBUTE_KEYS.has(key));

  const priceNumber = rawProduct.price ? Number(rawProduct.price.toString()) : undefined;
  const markupPercent =
    cost && cost > 0 && priceNumber !== undefined ? ((priceNumber - cost) / cost) * 100 : undefined;

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
            {barcode && <> · {barcode}</>}
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

        {/* Attachments/Copy/Deactivate are drawn to match the reference
            layout but left disabled — each would need its own real feature
            (file storage, product duplication, a soft-delete flag) that
            doesn't exist yet, and a button that looks clickable but silently
            does nothing is worse than one that's honestly disabled. */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled
            title="Not implemented yet"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
          >
            <Paperclip size={13} />
            Attachments
          </button>
          <button
            type="button"
            disabled
            title="Not implemented yet"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
          >
            <Copy size={13} />
            Copy
          </button>
          <button
            type="button"
            disabled
            title="Not implemented yet"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
          >
            <Ban size={13} />
            Deactivate
          </button>
          {canReorder && <ProductDetailActions product={product} suppliers={suppliers} />}
        </div>
      </div>

      {/* Image + details + custom-attributes panel, mirroring the
          image-left / fields-middle / custom-fields-right layout from the
          reference screenshot. */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_1fr] gap-6">
          <div className="h-40 w-40 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, not a local/optimized asset
              <img src={imageUrl} alt={rawProduct.name} className="h-full w-full object-cover" />
            ) : (
              <Package size={32} className="text-slate-300" />
            )}
          </div>

          <div className="flex flex-col gap-3 min-w-0">
            {description && <p className="text-sm text-slate-600 leading-relaxed">{description}</p>}
            {dimensions && (
              <p className="text-xs text-slate-500">
                {dimensions}
                {weight && <> · {weight}</>}
              </p>
            )}
            <div className="text-xs text-slate-500 flex flex-col gap-0.5">
              <p>
                1 {baseUnit} = 1 {baseUnit}
              </p>
              {packageUnit && unitsPerPackage && (
                <p>
                  1 {packageUnit} = {unitsPerPackage} {baseUnit}
                </p>
              )}
            </div>
          </div>

          <div>
            {customAttributes.length === 0 ? (
              <p className="text-xs text-slate-400">No custom attributes yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {customAttributes.map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs font-semibold text-slate-400 mb-0.5">{key}</p>
                    <p className="text-sm font-semibold text-foreground">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductTabs
        overview={
          <div key="overview" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuantityByLocationPanel items={inventoryItems} totalQuantity={totalQuantity} unitLabel={baseUnit} />

            {/* Single real pricing scheme (Product.price is one Decimal
                column) shown in the same row layout as the reference's
                multi-currency table — Markup/Cost only appear when a Cost
                attribute was actually set, instead of a fake "0.00%" row. */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-foreground">Pricing &amp; cost</h2>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">Sales price</p>
                  <p className="text-sm font-bold text-foreground">{formatPrice(rawProduct.price)}</p>
                </div>
                {markupPercent !== undefined && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">Markup</p>
                    <p className="text-sm font-bold text-foreground">{markupPercent.toFixed(2)}%</p>
                  </div>
                )}
                {cost !== undefined && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">Cost</p>
                    <p className="text-sm font-bold text-foreground">{formatPrice(cost)}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">Reorder point</p>
                  <p className="text-sm font-bold text-foreground">{rawProduct.reorderPoint.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">Added</p>
                  <p className="text-sm font-bold text-foreground">{formatDate(rawProduct.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        }
        orderHistory={
          <div key="orderHistory" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-foreground">Purchase orders</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {rawProduct.purchaseOrderLines.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-center text-sm text-slate-400">
                        This product hasn&apos;t been ordered from a supplier yet
                      </td>
                    </tr>
                  ) : (
                    rawProduct.purchaseOrderLines.map((line) => (
                      <tr key={line.id} className="border-b border-slate-50 last:border-b-0">
                        <td className="px-6 py-3">
                          <p className="font-semibold text-foreground">{line.purchaseOrder.poNumber}</p>
                          <p className="text-xs text-slate-400">
                            {line.purchaseOrder.supplier.name} · {line.purchaseOrder.status}
                          </p>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <p className="font-bold text-foreground">
                            {line.quantityReceived}/{line.quantityOrdered}
                          </p>
                          <p className="text-xs text-slate-400">received</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-foreground">Sales orders</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {rawProduct.salesOrderLines.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-center text-sm text-slate-400">
                        This product hasn&apos;t been sold to a customer yet
                      </td>
                    </tr>
                  ) : (
                    rawProduct.salesOrderLines.map((line) => (
                      <tr key={line.id} className="border-b border-slate-50 last:border-b-0">
                        <td className="px-6 py-3">
                          <p className="font-semibold text-foreground">{line.salesOrder.soNumber}</p>
                          <p className="text-xs text-slate-400">
                            {line.salesOrder.customer.name} · {line.salesOrder.status}
                          </p>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <p className="font-bold text-foreground">
                            {line.quantityFufilled}/{line.quantityOrdered}
                          </p>
                          <p className="text-xs text-slate-400">fulfilled</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
        movementHistory={
          <div key="movementHistory" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-foreground">Movement history</h2>
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
        }
      />

      {/* Remarks — reads attrs.notes. No dedicated UI to edit an existing
          product's remarks yet (or any other attribute); this only reflects
          what was set at creation time via CreateProductModal's "More
          details" section. */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={14} className="text-slate-400" />
          <h2 className="text-sm font-bold text-foreground">Remarks</h2>
        </div>
        <p className="text-sm text-slate-500">{notes || "No remarks yet"}</p>
      </div>
    </div>
  );
}
