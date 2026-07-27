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
  // lowStock and listInventoryEvents are both dashboard cards (every role
  // lands on the dashboard), so — like the reports above — they need every
  // role, not just the ones who'd naturally touch inventory day-to-day.
  lowStock: [
    ...ALWAYS_ALLOWED,
    "WAREHOUSE_STAFF",
    "PURCHASING",
    "ACCOUNTING",
    "VIEWER",
  ],
  transferStock: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF"],
  listInventoryEvents: [
    ...ALWAYS_ALLOWED,
    "WAREHOUSE_STAFF",
    "PURCHASING",
    "ACCOUNTING",
    "VIEWER",
  ],

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
  // listSalesOrders backs the "unpaid sales orders" dashboard card too, so
  // it needs the same full-role coverage as the other dashboard-feeding
  // actions above, not just the roles that create/manage sales orders.
  listSalesOrders: [
    ...ALWAYS_ALLOWED,
    "ACCOUNTING",
    "WAREHOUSE_STAFF",
    "PURCHASING",
    "VIEWER",
  ],
  confirmSalesOrder: [...ALWAYS_ALLOWED, "ACCOUNTING"],
  fulfillSalesOrder: [...ALWAYS_ALLOWED, "WAREHOUSE_STAFF"],
  recordPayment: [...ALWAYS_ALLOWED, "ACCOUNTING"],

  // Reports — the dashboard (every signed-in role lands here) calls all
  // three of these unconditionally, so every role needs read access, the
  // same way listProducts does above. A gap here doesn't just hide a report
  // card, it 403s the dashboard's Promise.all and crashes the whole page.
  topCustomers: [
    ...ALWAYS_ALLOWED,
    "WAREHOUSE_STAFF",
    "PURCHASING",
    "ACCOUNTING",
    "VIEWER",
  ],
  revenueByDay: [
    ...ALWAYS_ALLOWED,
    "WAREHOUSE_STAFF",
    "PURCHASING",
    "ACCOUNTING",
    "VIEWER",
  ],
  topProducts: [
    ...ALWAYS_ALLOWED,
    "WAREHOUSE_STAFF",
    "PURCHASING",
    "ACCOUNTING",
    "VIEWER",
  ],
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