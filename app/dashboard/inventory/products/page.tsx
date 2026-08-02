import ProductsTable from "@/app/components/dashboard/ProductsTable";
import { getCurrentUser } from "@/app/lib/auth";
import { orchestrate } from "@/app/lib/orchestrate";
import { redirect } from "next/navigation";

import "@/app/modules";

// Generic Array for searching the body and finding property
function bodyArray<T>(result: { status: number; body: Record<string, unknown> }, key: string): T[] {
  if (result.status !== 200) return [];
  const value = result.body?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

type RawProduct = {
  id: string;
  sku: string;
  name: string;
  reorderPoint: number;
  price: { toString(): string } | null;
  category: { id: string; name: string } | null;
  createdAt: string | Date;
};

export default async function ProductsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };

  const [productsRes, inventoryRes, suppliersRes, categoriesRes] = await Promise.all([
    orchestrate({ action: "listProducts" }, ctx),
    orchestrate({ action: "listInventory" }, ctx),
    orchestrate({ action: "listSuppliers" }, ctx),
    orchestrate({ action: "listCategories" }, ctx),
  ]);

  const rawProducts = bodyArray<RawProduct>(productsRes, "products");
  const inventoryItems = bodyArray<{ productId: string; quantity: number }>(inventoryRes, "items");
  const suppliers = bodyArray<{ id: string; name: string }>(suppliersRes, "suppliers");
  const categories = bodyArray<{ id: string; name: string }>(categoriesRes, "categories");

  const quantityByProduct = new Map<string, number>();
  for (const item of inventoryItems) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  const products = rawProducts.map((p) => {
    const quantity = quantityByProduct.get(p.id) ?? 0;
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      reorderPoint: p.reorderPoint,
      price: p.price ? Number(p.price.toString()) : null,
      category: p.category,
      createdAt: new Date(p.createdAt).toISOString(),
      quantity,
      lowStock: quantity <= p.reorderPoint,
    };
  });

  // User permissions
  const canReorder = ["ADMIN", "MANAGER", "PURCHASING"].includes(user.role);
  const canCreateProduct = ["ADMIN", "MANAGER"].includes(user.role);

  return (
    <div className="p-5 sm:p-8 w-full">
      <ProductsTable
        products={products}
        suppliers={suppliers}
        categories={categories}
        canReorder={canReorder}
        canCreateProduct={canCreateProduct}
      />
    </div>
  );
}


/**
 * This file is the server page responsible for gathering all product-related data, cleaning it up, combining it, checking permissions, and then passing it into ProductsTable.
 */