import { eq, desc, and, sql, like, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  branches, InsertBranch,
  categories, InsertCategory,
  products, InsertProduct,
  invoices, InsertInvoice,
  invoiceItems, InsertInvoiceItem,
  orders, InsertOrder,
  tasks, InsertTask,
  payments, InsertPayment,
  paymentMethods, InsertPaymentMethod,
  deliveries, InsertDelivery,
  allocations, InsertAllocation,
  purchases, InsertPurchase,
  inventory, InsertInventory,
  inventoryTransactions, InsertInventoryTransaction,
  attachments, InsertAttachment,
  notifications, InsertNotification,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== Users ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: InsertUser["role"]) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: role! }).where(eq(users.id, userId));
}

// ==================== Branches ====================

export async function listBranches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(branches).orderBy(branches.id);
}

export async function createBranch(data: InsertBranch) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(branches).values(data);
}

// ==================== Categories ====================

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(categories).values(data);
  return result[0].insertId;
}

// ==================== Products ====================

export async function listProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

// ==================== Invoices ====================

export async function listInvoices(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (branchId) {
    return db.select().from(invoices).where(eq(invoices.branchId, branchId)).orderBy(desc(invoices.createdAt));
  }
  return db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}

export async function createInvoice(data: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(invoices).values(data);
  return result[0].insertId;
}

export async function updateInvoice(id: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) return;
  await db.update(invoices).set(data).where(eq(invoices.id, id));
}

export async function getInvoiceItems(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
}

export async function createInvoiceItems(items: InsertInvoiceItem[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (items.length === 0) return;
  await db.insert(invoiceItems).values(items);
}

// ==================== Orders ====================

export async function listOrders(filters?: { branchId?: number; status?: string; createdBy?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.branchId) conditions.push(eq(orders.branchId, filters.branchId));
  if (filters?.status) conditions.push(eq(orders.status, filters.status as any));
  if (filters?.createdBy) conditions.push(eq(orders.createdBy, filters.createdBy));
  if (conditions.length > 0) {
    return db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt));
  }
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(orders).values(data);
  return result[0].insertId;
}

export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set(data).where(eq(orders.id, id));
}

// ==================== Tasks ====================

export async function listTasks(filters?: { workerId?: number; orderId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.workerId) conditions.push(eq(tasks.workerId, filters.workerId));
  if (filters?.orderId) conditions.push(eq(tasks.orderId, filters.orderId));
  if (filters?.status) conditions.push(eq(tasks.status, filters.status as any));
  if (conditions.length > 0) {
    return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
  }
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(tasks).values(data);
  return result[0].insertId;
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

// ==================== Payments ====================

export async function listPayments(invoiceId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (invoiceId) {
    return db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(desc(payments.createdAt));
  }
  return db.select().from(payments).orderBy(desc(payments.createdAt));
}

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(payments).values(data);
  return result[0].insertId;
}

export async function listPaymentMethods() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true));
}

export async function createPaymentMethod(data: InsertPaymentMethod) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(paymentMethods).values(data);
}

// ==================== Deliveries ====================

export async function listDeliveries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
}

export async function createDelivery(data: InsertDelivery) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(deliveries).values(data);
  return result[0].insertId;
}

export async function updateDelivery(id: number, data: Partial<InsertDelivery>) {
  const db = await getDb();
  if (!db) return;
  await db.update(deliveries).set(data).where(eq(deliveries.id, id));
}

// ==================== Allocations & Purchases ====================

export async function listAllocations(managerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (managerId) {
    return db.select().from(allocations).where(eq(allocations.managerId, managerId)).orderBy(desc(allocations.createdAt));
  }
  return db.select().from(allocations).orderBy(desc(allocations.createdAt));
}

export async function createAllocation(data: InsertAllocation) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(allocations).values(data);
  return result[0].insertId;
}

export async function updateAllocation(id: number, data: Partial<InsertAllocation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(allocations).set(data).where(eq(allocations.id, id));
}

export async function listPurchases(allocationId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (allocationId) {
    return db.select().from(purchases).where(eq(purchases.allocationId, allocationId)).orderBy(desc(purchases.createdAt));
  }
  return db.select().from(purchases).orderBy(desc(purchases.createdAt));
}

export async function createPurchase(data: InsertPurchase) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(purchases).values(data);
  return result[0].insertId;
}

// ==================== Inventory ====================

export async function listInventory(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (branchId) {
    return db.select().from(inventory).where(eq(inventory.branchId, branchId));
  }
  return db.select().from(inventory);
}

export async function upsertInventory(data: InsertInventory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(inventory).values(data).onDuplicateKeyUpdate({
    set: { quantity: data.quantity },
  });
}

export async function createInventoryTransaction(data: InsertInventoryTransaction) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(inventoryTransactions).values(data);
}

// ==================== Notifications ====================

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ==================== Attachments ====================

export async function createAttachment(data: InsertAttachment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(attachments).values(data);
}

export async function listAttachments(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attachments).where(
    and(eq(attachments.entityType, entityType as any), eq(attachments.entityId, entityId))
  );
}

// ==================== Dashboard Stats ====================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { invoicesToday: 0, activeOrders: 0, tasksInProgress: 0, completedDeliveries: 0 };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [invoiceCount] = await db.select({ count: sql<number>`count(*)` }).from(invoices).where(sql`DATE(${invoices.invoiceDate}) = CURDATE()`);
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(inArray(orders.status, ["new", "assigned", "in_progress"]));
  const [taskCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "in_progress"));
  const [deliveryCount] = await db.select({ count: sql<number>`count(*)` }).from(deliveries).where(eq(deliveries.status, "completed"));

  return {
    invoicesToday: invoiceCount?.count ?? 0,
    activeOrders: orderCount?.count ?? 0,
    tasksInProgress: taskCount?.count ?? 0,
    completedDeliveries: deliveryCount?.count ?? 0,
  };
}

// ==================== Sequence Generators ====================

export async function generateSequence(prefix: string): Promise<string> {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
