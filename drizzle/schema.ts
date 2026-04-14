import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  longtext,
  date,
  time,
} from "drizzle-orm/mysql-core";

/**
 * جداول نظام أناقة ERP المتكامل
 * يشمل: المستخدمين، الفواتير، الطلبيات، المشتريات، المخزون، والمحاسبة
 */

// ==================== جداول المستخدمين والأدوار ====================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [
    "admin",
    "seller_shop",
    "seller_workshop",
    "foreman",
    "worker",
    "manager_purchases",
    "auditor_purchases",
    "accountant_paint",
    "purchases_paint",
    "invoices_paint",
    "manager_inventory",
    "accountant",
    "auditor",
    "hr",
    "designer_2d",
    "designer_3d",
    "user",
  ]).default("user").notNull(),
  branch: mysqlEnum("branch", ["main", "branch1", "branch2", "branch3"]).default("main"),
  department: mysqlEnum("department", [
    "sales",
    "production",
    "carpentry",
    "drilling",
    "lathe",
    "cnc",
    "3d",
    "painting",
    "assembly",
    "purchases",
    "accounting",
    "design",
    "hr",
  ]),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== جداول الفروع والأقسام ====================

export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  location: text("location"),
  phone: varchar("phone", { length: 20 }),
  manager: int("manager"),
  type: mysqlEnum("type", ["main", "shop", "workshop", "paint"]).notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

// ==================== جداول المنتجات والفئات ====================

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  categoryId: int("categoryId"),
  description: text("description"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("piece"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ==================== جداول الفواتير والطلبيات ====================

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  customerId: int("customerId"),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }),
  sellerId: int("sellerId").notNull(),
  branchId: int("branchId").notNull(),
  invoiceType: mysqlEnum("invoiceType", ["standard", "custom"]).default("standard"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default("0"),
  remainingAmount: decimal("remainingAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "partial", "paid", "completed"]).default("pending"),
  notes: text("notes"),
  invoiceDate: timestamp("invoiceDate").defaultNow().notNull(),
  dueDate: date("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export const invoiceItems = mysqlTable("invoiceItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  productId: int("productId"),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  customDetails: text("customDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 100 }).notNull().unique(),
  invoiceId: int("invoiceId"),
  customerId: int("customerId"),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  description: text("description"),
  drawingUrl: varchar("drawingUrl", { length: 500 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  additionalDetails: text("additionalDetails"),
  createdBy: int("createdBy").notNull(),
  branchId: int("branchId").notNull(),
  status: mysqlEnum("status", ["new", "assigned", "in_progress", "completed", "delivered"]).default("new"),
  expectedCompletionDate: date("expectedCompletionDate"),
  actualCompletionDate: date("actualCompletionDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ==================== جداول المهام والإنجازات ====================

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  taskNumber: varchar("taskNumber", { length: 100 }).notNull().unique(),
  orderId: int("orderId").notNull(),
  workerId: int("workerId").notNull(),
  taskType: mysqlEnum("taskType", [
    "carpentry",
    "drilling",
    "lathe",
    "cnc",
    "3d",
    "painting",
    "assembly",
    "sanding",
    "other",
  ]).notNull(),
  description: text("description"),
  drawingUrl: varchar("drawingUrl", { length: 500 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  additionalDetails: text("additionalDetails"),
  status: mysqlEnum("status", ["assigned", "in_progress", "completed", "reviewed"]).default("assigned"),
  assignedDate: timestamp("assignedDate").defaultNow(),
  expectedCompletionDate: date("expectedCompletionDate"),
  actualCompletionDate: date("actualCompletionDate"),
  completionImageUrl: varchar("completionImageUrl", { length: 500 }),
  qualityNotes: text("qualityNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ==================== جداول الدفع ====================

export const paymentMethods = mysqlTable("paymentMethods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  requiresTrackingNumber: boolean("requiresTrackingNumber").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  paymentNumber: varchar("paymentNumber", { length: 100 }).notNull().unique(),
  invoiceId: int("invoiceId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  methodId: int("methodId").notNull(),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  paymentDate: timestamp("paymentDate").defaultNow(),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending"),
  notes: text("notes"),
  recordedBy: int("recordedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==================== جداول التسليم ====================

export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  deliveryNumber: varchar("deliveryNumber", { length: 100 }).notNull().unique(),
  orderId: int("orderId").notNull(),
  invoiceId: int("invoiceId").notNull(),
  deliveryDate: timestamp("deliveryDate").defaultNow(),
  productImageUrl: varchar("productImageUrl", { length: 500 }),
  deliveredBy: int("deliveredBy").notNull(),
  receivedBy: varchar("receivedBy", { length: 255 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "completed", "rejected"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;

// ==================== جداول المشتريات والعهد ====================

export const allocations = mysqlTable("allocations", {
  id: int("id").autoincrement().primaryKey(),
  allocationNumber: varchar("allocationNumber", { length: 100 }).notNull().unique(),
  managerId: int("managerId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: decimal("remainingAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Allocation = typeof allocations.$inferSelect;
export type InsertAllocation = typeof allocations.$inferInsert;

export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  purchaseNumber: varchar("purchaseNumber", { length: 100 }).notNull().unique(),
  allocationId: int("allocationId").notNull(),
  vendorName: varchar("vendorName", { length: 255 }).notNull(),
  itemDescription: text("itemDescription").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  invoiceImageUrl: varchar("invoiceImageUrl", { length: 500 }),
  purchaseDate: timestamp("purchaseDate").defaultNow(),
  recordedBy: int("recordedBy").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "completed"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

// ==================== جداول المخزون ====================

export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  branchId: int("branchId").notNull(),
  quantity: int("quantity").default(0),
  minimumLevel: int("minimumLevel").default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

export const inventoryTransactions = mysqlTable("inventoryTransactions", {
  id: int("id").autoincrement().primaryKey(),
  transactionNumber: varchar("transactionNumber", { length: 100 }).notNull().unique(),
  productId: int("productId").notNull(),
  branchId: int("branchId").notNull(),
  type: mysqlEnum("type", ["in", "out", "transfer", "adjustment"]).notNull(),
  quantity: int("quantity").notNull(),
  fromBranch: int("fromBranch"),
  toBranch: int("toBranch"),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  recordedBy: int("recordedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;

// ==================== جداول الملفات والمرفقات ====================

export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  attachmentNumber: varchar("attachmentNumber", { length: 100 }).notNull().unique(),
  entityType: mysqlEnum("entityType", [
    "order",
    "task",
    "delivery",
    "purchase",
    "invoice",
  ]).notNull(),
  entityId: int("entityId").notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileType: varchar("fileType", { length: 50 }),
  fileName: varchar("fileName", { length: 255 }),
  uploadedBy: int("uploadedBy").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

// ==================== جداول الإشعارات ====================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", [
    "new_order",
    "task_assigned",
    "payment_completed",
    "delivery_ready",
    "system",
  ]).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ==================== جداول التقارير والإحصائيات ====================

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reportNumber: varchar("reportNumber", { length: 100 }).notNull().unique(),
  reportType: mysqlEnum("reportType", [
    "sales",
    "purchases",
    "inventory",
    "payments",
    "productivity",
    "financial",
  ]).notNull(),
  generatedBy: int("generatedBy").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  data: longtext("data"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
