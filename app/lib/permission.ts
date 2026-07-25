// Central Permission Map

import { USERROLE } from "@/generated/prisma/enums";

const ALWAYS_ALLOWED: USERROLE[] = ["ADMIN", "MANAGER"];

const ACTION_ROLES: Record<string, USERROLE[]> = {
  // Products
  listProducts: [
    ...ALWAYS_ALLOWED,
    "WAREHOUSE_STAFF",
    "PURCHASING",
    "ACCOUNTING",
    "VIEWER",
  ],
  createProduct: [...ALWAYS_ALLOWED],

  // Warehouse
  listWarehouse: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF", "PURCHASING", "VIEWER"],
  createWarehouse: [...ALWAYS_ALLOWED],

  // Inventory
  adjustStock: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF"],
  listInventory: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF", "PURCHASING", "VIEWER"],
  lowStock: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF", "PURCHASING", "VIEWER"],
  transferStock: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF"],
  listInventoryEvents: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF", "VIEWER"],

  // Purchasing
  createSupplier: [...ALWAYS_ALLOWED, "PURCHASING"],
  listSuppliers: [...ALWAYS_ALLOWED, "PURCHASING", "VIEWER"],
  createPurchaseOrder: [...ALWAYS_ALLOWED, "PURCHASING"],
  listPurchaseOrders: [
    ...ALWAYS_ALLOWED,
    "PURCHASING",
    "WAREHOUSE_STAFF",
    "ACCOUNTING",
    "VIEWER",
  ],
  submitPurchaseOrder: [...ALWAYS_ALLOWED, "PURCHASING"],
  receivePurchaseOrder: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF"],
  approvePurchaseOrder: [...ALWAYS_ALLOWED],
  cancelPurchaseOrder: [...ALWAYS_ALLOWED, "PURCHASING"],

  // Sales
  createCustomer: [...ALWAYS_ALLOWED, "ACCOUNTING"],
  listCustomers: [...ALWAYS_ALLOWED, "ACCOUNTING", "VIEWER"],
  createSalesOrder: [...ALWAYS_ALLOWED, "ACCOUNTING"],
  listSalesOrders: [
    ...ALWAYS_ALLOWED,
    "ACCOUNTING",
    "WAREHOUSE_STAFF",
    "VIEWER",
  ],
  confirmSalesOrder: [...ALWAYS_ALLOWED, "ACCOUNTING"],
  fulfillSalesOrder: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF"],
  recordPayment: [...ALWAYS_ALLOWED, "ACCOUNTING"],

  // Reports
  topCustomers: [...ALWAYS_ALLOWED, "ACCOUNTING", "VIEWER"],
  revenueByDay: [...ALWAYS_ALLOWED, "ACCOUNTING", "VIEWER"],
  topProducts: [...ALWAYS_ALLOWED, "ACCOUNTING", "PURCHASING", "VIEWER"],
};

// Ensures users are allowed to call upon the helpers 
export function isActionAllowed(action: string, role: USERROLE): boolean {
    const allowed =ACTION_ROLES[action];

    if(!allowed) {
      return ALWAYS_ALLOWED.includes(role)
    }

    return allowed.includes(role);
}

/**
 * ACTION_ROLE takes in a string as a key and an action role array as a value. 
 * 
 *
 */