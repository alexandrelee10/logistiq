import WarehouseFilter from "@/app/components/dashboard/Inventory/WarehouseFilter";
import InventoryTable from "@/app/components/dashboard/Inventory/InventoryTable";
import { getCurrentUser } from "@/app/lib/auth";
import { orchestrate } from "@/app/lib/orchestrate";
import { redirect } from "next/navigation";

// Side-effect import: same reason dashboard/page.tsx needs it — Next.js
// compiles this page as its own module graph, so without this import here
// too, orchestrate() below finds an empty registry.
import "@/app/modules";

function bodyArray<T>(result: { status: number; body: any }, key: string): T[] {
  if (result.status !== 200) return [];
  const value = result.body?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ warehouse?: string }>;
}) {
  const { warehouse: warehouseId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };

  const [productsRes, inventoryRes, warehousesRes] = await Promise.all([
    orchestrate({ action: "listProducts" }, ctx),
    orchestrate({ action: "listInventory", warehouseId }, ctx),
    orchestrate({ action: "listWarehouse" }, ctx),
  ]);

  const products = bodyArray<{ id: string; sku: string; name: string; reorderPoint: number }>(
    productsRes,
    "products"
  );
  const inventoryItems = bodyArray<{ productId: string; quantity: number }>(inventoryRes, "items");
  const warehouses = bodyArray<{ id: string; name: string }>(warehousesRes, "warehouses");

  // Always start from every product (listProducts), not from the inventory
  // items themselves — a product with zero stock in the selected warehouse
  // has no InventoryItem row at all, and would silently disappear from the
  // table if we only iterated listInventory's results.
  const quantityByProduct = new Map<string, number>();
  for (const item of inventoryItems) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  const rows = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    reorderPoint: p.reorderPoint,
    quantity: quantityByProduct.get(p.id) ?? 0,
  }));

  return (
    <div className="p-5 sm:p-8 max-w-[1440px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            {products.length.toLocaleString()} product{products.length === 1 ? "" : "s"} tracked across your organization.
          </p>
        </div>
        <WarehouseFilter warehouses={warehouses} selectedId={warehouseId} />
      </div>

      <InventoryTable products={rows} />
    </div>
  );
}
