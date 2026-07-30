import { getCurrentUser } from "@/app/lib/auth"
import { orchestrate } from "@/app/lib/orchestrate";
import { redirect } from "next/navigation"

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
    const products = bodyArray<{ id: string; sku: string; name: string }>(productsRes, "products");
    const warehouses = bodyArray<{ id: string, name: string }>(warehousesRes, "warehouses");
    const events = bodyArray<InventoryEvents>(eventsRes, "events");


    return (
        <div>
            place holder
        </div>
    )
}