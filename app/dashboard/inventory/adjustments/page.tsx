import { getCurrentUser } from "@/app/lib/auth"
import { orchestrate } from "@/app/lib/orchestrate";
import { redirect } from "next/navigation"
import AdjustStockForm from "@/app/components/dashboard/Inventory/adjustments/AdjustStockForm";

// Safe pulls orchestrate results
function bodyArray<T>(result: { status: number; body: any }, key: string): T[] {
  if (result.status !== 200) return [];
  const value = result.body?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

type InventoryEvents = {
    id: string;
    delta: number;
    reason: string | null;
    createdAt: string;
    product: { name: string, sku: string };
    warehouse: { name: string };
}

function formatDate(value: string) {
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default async function AdjustmentsPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/sign-in");
    }

    const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };

    const [productsRes, warehousesRes, eventsRes ] = await Promise.all([
        orchestrate({ action: "listProducts"}, ctx),
        orchestrate({ action: "listWarehouse"}, ctx),
        orchestrate({ action: "listInventoryEvents"}, ctx),
    ]);

    // Orchestrate variables and handling
    const rawProducts = bodyArray<{ id: string; sku: string; name: string }>(productsRes, "products");
    const warehouses = bodyArray<{ id: string, name: string }>(warehousesRes, "warehouses");
    const events = bodyArray<InventoryEvents>(eventsRes, "events");

    // listProducts returns full Prisma rows (Decimal price, nested category, etc.) which
    // aren't plain-serializable across the server -> client boundary — trim to what the
    // client form actually needs before handing it to AdjustStockForm.
    const products = rawProducts.map((p) => ({ id: p.id, sku: p.sku, name: p.name }));

    const canAdjust = ["ADMIN", "MANAGER", "WAREHOUSE_STAFF"].includes(user.role);

    return (
        <div className="p-5 sm:p-8 w-full max-w-3xl mx-auto flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Inventory adjustments</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Add or remove stock for a product in a specific warehouse. Every adjustment is logged below.
                </p>
            </div>

            {canAdjust ? (
                <AdjustStockForm products={products} warehouses={warehouses} />
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                    Your role ({user.role}) doesn&apos;t have permission to adjust stock.
                </div>
            )}

            <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-foreground">Recent adjustments</h2>
                </div>
                <table className="w-full table-fixed text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400">
                            <th className="px-6 py-3 font-semibold w-[28%]">Product</th>
                            <th className="px-4 py-3 font-semibold w-[18%]">Warehouse</th>
                            <th className="px-4 py-3 font-semibold w-[12%]">Change</th>
                            <th className="px-4 py-3 font-semibold w-[24%]">Reason</th>
                            <th className="px-4 py-3 font-semibold w-[18%]">When</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                                    No adjustments yet
                                </td>
                            </tr>
                        ) : (
                            events.map((ev) => (
                                <tr key={ev.id} className="border-b border-slate-50 last:border-b-0">
                                    <td className="px-6 py-3">
                                        <p className="text-sm font-semibold text-foreground truncate">{ev.product.name}</p>
                                        <p className="text-xs text-slate-400 truncate">{ev.product.sku}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 truncate">{ev.warehouse.name}</td>
                                    <td
                                        className={`px-4 py-3 font-bold ${
                                            ev.delta >= 0 ? "text-emerald-600" : "text-accent"
                                        }`}
                                    >
                                        {ev.delta >= 0 ? "+" : ""}
                                        {ev.delta.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 truncate">{ev.reason ?? "—"}</td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(ev.createdAt)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
