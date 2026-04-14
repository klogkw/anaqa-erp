import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ==================== Helper: generate unique numbers ====================
async function genSeq(prefix: string) {
  return db.generateSequence(prefix);
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== Dashboard ====================
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
  }),

  // ==================== Users & Employees ====================
  users: router({
    list: protectedProcedure.query(async () => {
      return db.listUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role as any);
        return { success: true };
      }),
  }),

  // ==================== Branches ====================
  branches: router({
    list: protectedProcedure.query(async () => {
      return db.listBranches();
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        location: z.string().optional(),
        phone: z.string().optional(),
        type: z.enum(["main", "shop", "workshop", "paint"]),
      }))
      .mutation(async ({ input }) => {
        await db.createBranch(input);
        return { success: true };
      }),
  }),

  // ==================== Categories ====================
  categories: router({
    list: protectedProcedure.query(async () => {
      return db.listCategories();
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        const id = await db.createCategory(input);
        return { id };
      }),
  }),

  // ==================== Products ====================
  products: router({
    list: protectedProcedure.query(async () => {
      return db.listProducts();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        categoryId: z.number().optional(),
        description: z.string().optional(),
        basePrice: z.string(),
        unit: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createProduct(input);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        basePrice: z.string().optional(),
        unit: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProduct(id, data);
        return { success: true };
      }),
  }),

  // ==================== Invoices ====================
  invoices: router({
    list: protectedProcedure
      .input(z.object({ branchId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listInvoices(input?.branchId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "الفاتورة غير موجودة" });
        const items = await db.getInvoiceItems(input.id);
        return { ...invoice, items };
      }),
    create: protectedProcedure
      .input(z.object({
        customerName: z.string().min(1),
        customerPhone: z.string().optional(),
        branchId: z.number(),
        invoiceType: z.enum(["standard", "custom"]),
        totalAmount: z.string(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number().optional(),
          productName: z.string().min(1),
          quantity: z.number().min(1),
          unitPrice: z.string(),
          totalPrice: z.string(),
          description: z.string().optional(),
          customDetails: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const invoiceNumber = await genSeq("INV");
        const invoiceId = await db.createInvoice({
          invoiceNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          sellerId: ctx.user.id,
          branchId: input.branchId,
          invoiceType: input.invoiceType,
          totalAmount: input.totalAmount,
          paidAmount: "0",
          remainingAmount: input.totalAmount,
          status: "pending",
          notes: input.notes,
        });
        if (input.items.length > 0) {
          await db.createInvoiceItems(
            input.items.map(item => ({
              invoiceId,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              description: item.description,
              customDetails: item.customDetails,
            }))
          );
        }
        return { id: invoiceId, invoiceNumber };
      }),
  }),

  // ==================== Orders ====================
  orders: router({
    list: protectedProcedure
      .input(z.object({
        branchId: z.number().optional(),
        status: z.string().optional(),
        createdBy: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listOrders(input ?? undefined);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "الطلبية غير موجودة" });
        return order;
      }),
    create: protectedProcedure
      .input(z.object({
        invoiceId: z.number().optional(),
        customerName: z.string().min(1),
        description: z.string().optional(),
        drawingUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        additionalDetails: z.string().optional(),
        branchId: z.number(),
        expectedCompletionDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const orderNumber = await genSeq("ORD");
        const id = await db.createOrder({
          orderNumber,
          invoiceId: input.invoiceId,
          customerName: input.customerName,
          description: input.description,
          drawingUrl: input.drawingUrl,
          imageUrl: input.imageUrl,
          additionalDetails: input.additionalDetails,
          createdBy: ctx.user.id,
          branchId: input.branchId,
          expectedCompletionDate: input.expectedCompletionDate ? new Date(input.expectedCompletionDate) : undefined,
        });
        return { id, orderNumber };
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["new", "assigned", "in_progress", "completed", "delivered"]) }))
      .mutation(async ({ input }) => {
        await db.updateOrder(input.id, { status: input.status });
        return { success: true };
      }),
  }),

  // ==================== Tasks (Foreman & Workers) ====================
  tasks: router({
    list: protectedProcedure
      .input(z.object({
        workerId: z.number().optional(),
        orderId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listTasks(input ?? undefined);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTaskById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        workerId: z.number(),
        taskType: z.enum(["carpentry", "drilling", "lathe", "cnc", "3d", "painting", "assembly", "sanding", "other"]),
        description: z.string().optional(),
        drawingUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        additionalDetails: z.string().optional(),
        expectedCompletionDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const taskNumber = await genSeq("TSK");
        const id = await db.createTask({
          taskNumber,
          orderId: input.orderId,
          workerId: input.workerId,
          taskType: input.taskType,
          description: input.description,
          drawingUrl: input.drawingUrl,
          imageUrl: input.imageUrl,
          additionalDetails: input.additionalDetails,
          expectedCompletionDate: input.expectedCompletionDate ? new Date(input.expectedCompletionDate) : undefined,
        });
        return { id, taskNumber };
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["assigned", "in_progress", "completed", "reviewed"]),
        completionImageUrl: z.string().optional(),
        qualityNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = { status: input.status };
        if (input.status === "completed") {
          updateData.actualCompletionDate = new Date();
          if (input.completionImageUrl) updateData.completionImageUrl = input.completionImageUrl;
        }
        if (input.qualityNotes) updateData.qualityNotes = input.qualityNotes;
        await db.updateTask(input.id, updateData);
        return { success: true };
      }),
  }),

  // ==================== Payments ====================
  payments: router({
    list: protectedProcedure
      .input(z.object({ invoiceId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listPayments(input?.invoiceId);
      }),
    methods: protectedProcedure.query(async () => {
      return db.listPaymentMethods();
    }),
    create: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        amount: z.string(),
        methodId: z.number(),
        trackingNumber: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const paymentNumber = await genSeq("PAY");
        const id = await db.createPayment({
          paymentNumber,
          invoiceId: input.invoiceId,
          amount: input.amount,
          methodId: input.methodId,
          trackingNumber: input.trackingNumber,
          notes: input.notes,
          recordedBy: ctx.user.id,
          status: "confirmed",
        });
        // Update invoice paid/remaining amounts
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (invoice) {
          const newPaid = parseFloat(invoice.paidAmount ?? "0") + parseFloat(input.amount);
          const newRemaining = parseFloat(invoice.totalAmount) - newPaid;
          const newStatus = newRemaining <= 0 ? "paid" : "partial";
          await db.updateInvoice(input.invoiceId, {
            paidAmount: newPaid.toFixed(2),
            remainingAmount: Math.max(0, newRemaining).toFixed(2),
            status: newStatus,
          });
        }
        return { id, paymentNumber };
      }),
    seedMethods: adminProcedure.mutation(async () => {
      const methods = [
        { name: "كاش", code: "cash", requiresTrackingNumber: false },
        { name: "كي نت", code: "knet", requiresTrackingNumber: true },
        { name: "بوكي", code: "bookey", requiresTrackingNumber: true },
        { name: "كريديت (دين)", code: "credit", requiresTrackingNumber: false },
      ];
      for (const m of methods) {
        try { await db.createPaymentMethod(m); } catch { /* skip duplicates */ }
      }
      return { success: true };
    }),
  }),

  // ==================== Deliveries ====================
  deliveries: router({
    list: protectedProcedure.query(async () => {
      return db.listDeliveries();
    }),
    create: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        invoiceId: z.number(),
        productImageUrl: z.string().optional(),
        receivedBy: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check invoice is fully paid
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice || parseFloat(invoice.remainingAmount ?? "0") > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن التسليم قبل اكتمال الدفع" });
        }
        const deliveryNumber = await genSeq("DLV");
        const id = await db.createDelivery({
          deliveryNumber,
          orderId: input.orderId,
          invoiceId: input.invoiceId,
          productImageUrl: input.productImageUrl,
          deliveredBy: ctx.user.id,
          receivedBy: input.receivedBy,
          notes: input.notes,
          status: "completed",
        });
        // Update order status
        await db.updateOrder(input.orderId, { status: "delivered" });
        // Update invoice status
        await db.updateInvoice(input.invoiceId, { status: "completed" });
        return { id, deliveryNumber };
      }),
  }),

  // ==================== Allocations & Purchases ====================
  allocations: router({
    list: protectedProcedure
      .input(z.object({ managerId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listAllocations(input?.managerId);
      }),
    create: protectedProcedure
      .input(z.object({
        managerId: z.number(),
        amount: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const allocationNumber = await genSeq("ALC");
        const id = await db.createAllocation({
          allocationNumber,
          managerId: input.managerId,
          amount: input.amount,
          remainingAmount: input.amount,
          notes: input.notes,
        });
        return { id, allocationNumber };
      }),
  }),

  purchases: router({
    list: protectedProcedure
      .input(z.object({ allocationId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listPurchases(input?.allocationId);
      }),
    create: protectedProcedure
      .input(z.object({
        allocationId: z.number(),
        vendorName: z.string().min(1),
        itemDescription: z.string().min(1),
        amount: z.string(),
        invoiceImageUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const purchaseNumber = await genSeq("PUR");
        const id = await db.createPurchase({
          purchaseNumber,
          allocationId: input.allocationId,
          vendorName: input.vendorName,
          itemDescription: input.itemDescription,
          amount: input.amount,
          invoiceImageUrl: input.invoiceImageUrl,
          recordedBy: ctx.user.id,
          notes: input.notes,
        });
        // Deduct from allocation
        const alloc = (await db.listAllocations()).find(a => a.id === input.allocationId);
        if (alloc) {
          const newRemaining = parseFloat(alloc.remainingAmount) - parseFloat(input.amount);
          await db.updateAllocation(input.allocationId, {
            remainingAmount: Math.max(0, newRemaining).toFixed(2),
            status: newRemaining <= 0 ? "completed" : "active",
          });
        }
        return { id, purchaseNumber };
      }),
  }),

  // ==================== Inventory ====================
  inventory: router({
    list: protectedProcedure
      .input(z.object({ branchId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listInventory(input?.branchId);
      }),
  }),

  // ==================== Notifications ====================
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listNotifications(ctx.user.id);
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ==================== File Upload ====================
  upload: router({
    file: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileBase64: z.string(),
        contentType: z.string(),
        folder: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const folder = input.folder || "uploads";
        const ext = input.fileName.split(".").pop() || "bin";
        const key = `${folder}/${ctx.user.id}-${nanoid(8)}.${ext}`;
        const buffer = Buffer.from(input.fileBase64, "base64");
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  // ==================== Seed Data ====================
  seed: router({
    branches: adminProcedure.mutation(async () => {
      const defaultBranches = [
        { name: "المنجرة", code: "main", type: "main" as const },
        { name: "ورشة الصبغ", code: "paint", type: "paint" as const },
        { name: "محل المطوع", code: "branch1", type: "shop" as const },
        { name: "محل الياقوت", code: "branch2", type: "shop" as const },
        { name: "محل الضجيج", code: "branch3", type: "shop" as const },
      ];
      for (const b of defaultBranches) {
        try { await db.createBranch(b); } catch { /* skip duplicates */ }
      }
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
