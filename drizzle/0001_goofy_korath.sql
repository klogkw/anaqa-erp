CREATE TABLE `allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`allocationNumber` varchar(100) NOT NULL,
	`managerId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`remainingAmount` decimal(12,2) NOT NULL,
	`status` enum('active','completed','cancelled') DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `allocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `allocations_allocationNumber_unique` UNIQUE(`allocationNumber`)
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attachmentNumber` varchar(100) NOT NULL,
	`entityType` enum('order','task','delivery','purchase','invoice') NOT NULL,
	`entityId` int NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileType` varchar(50),
	`fileName` varchar(255),
	`uploadedBy` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `attachments_attachmentNumber_unique` UNIQUE(`attachmentNumber`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`location` text,
	`phone` varchar(20),
	`manager` int,
	`type` enum('main','shop','workshop','paint') NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`),
	CONSTRAINT `branches_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryNumber` varchar(100) NOT NULL,
	`orderId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`deliveryDate` timestamp DEFAULT (now()),
	`productImageUrl` varchar(500),
	`deliveredBy` int NOT NULL,
	`receivedBy` varchar(255),
	`notes` text,
	`status` enum('pending','completed','rejected') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveries_deliveryNumber_unique` UNIQUE(`deliveryNumber`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`branchId` int NOT NULL,
	`quantity` int DEFAULT 0,
	`minimumLevel` int DEFAULT 0,
	`lastUpdated` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionNumber` varchar(100) NOT NULL,
	`productId` int NOT NULL,
	`branchId` int NOT NULL,
	`type` enum('in','out','transfer','adjustment') NOT NULL,
	`quantity` int NOT NULL,
	`fromBranch` int,
	`toBranch` int,
	`reference` varchar(100),
	`notes` text,
	`recordedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventoryTransactions_transactionNumber_unique` UNIQUE(`transactionNumber`)
);
--> statement-breakpoint
CREATE TABLE `invoiceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`productId` int,
	`productName` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(12,2) NOT NULL,
	`description` text,
	`customDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(100) NOT NULL,
	`customerId` int,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(20),
	`sellerId` int NOT NULL,
	`branchId` int NOT NULL,
	`invoiceType` enum('standard','custom') DEFAULT 'standard',
	`totalAmount` decimal(12,2) NOT NULL,
	`paidAmount` decimal(12,2) DEFAULT '0',
	`remainingAmount` decimal(12,2) NOT NULL,
	`status` enum('pending','partial','paid','completed') DEFAULT 'pending',
	`notes` text,
	`invoiceDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('new_order','task_assigned','payment_completed','delivery_ready','system') NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(100) NOT NULL,
	`invoiceId` int,
	`customerId` int,
	`customerName` varchar(255) NOT NULL,
	`description` text,
	`drawingUrl` varchar(500),
	`imageUrl` varchar(500),
	`additionalDetails` text,
	`createdBy` int NOT NULL,
	`branchId` int NOT NULL,
	`status` enum('new','assigned','in_progress','completed','delivered') DEFAULT 'new',
	`expectedCompletionDate` date,
	`actualCompletionDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `paymentMethods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`requiresTrackingNumber` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentMethods_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentMethods_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentNumber` varchar(100) NOT NULL,
	`invoiceId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`methodId` int NOT NULL,
	`trackingNumber` varchar(100),
	`paymentDate` timestamp DEFAULT (now()),
	`status` enum('pending','confirmed','failed') DEFAULT 'pending',
	`notes` text,
	`recordedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_paymentNumber_unique` UNIQUE(`paymentNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(100) NOT NULL,
	`categoryId` int,
	`description` text,
	`basePrice` decimal(10,2) NOT NULL,
	`unit` varchar(50) DEFAULT 'piece',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseNumber` varchar(100) NOT NULL,
	`allocationId` int NOT NULL,
	`vendorName` varchar(255) NOT NULL,
	`itemDescription` text NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`invoiceImageUrl` varchar(500),
	`purchaseDate` timestamp DEFAULT (now()),
	`recordedBy` int NOT NULL,
	`status` enum('pending','approved','completed') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchases_purchaseNumber_unique` UNIQUE(`purchaseNumber`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportNumber` varchar(100) NOT NULL,
	`reportType` enum('sales','purchases','inventory','payments','productivity','financial') NOT NULL,
	`generatedBy` int NOT NULL,
	`startDate` date,
	`endDate` date,
	`data` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_reportNumber_unique` UNIQUE(`reportNumber`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskNumber` varchar(100) NOT NULL,
	`orderId` int NOT NULL,
	`workerId` int NOT NULL,
	`taskType` enum('carpentry','drilling','lathe','cnc','3d','painting','assembly','sanding','other') NOT NULL,
	`description` text,
	`drawingUrl` varchar(500),
	`imageUrl` varchar(500),
	`additionalDetails` text,
	`status` enum('assigned','in_progress','completed','reviewed') DEFAULT 'assigned',
	`assignedDate` timestamp DEFAULT (now()),
	`expectedCompletionDate` date,
	`actualCompletionDate` date,
	`completionImageUrl` varchar(500),
	`qualityNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tasks_taskNumber_unique` UNIQUE(`taskNumber`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','seller_shop','seller_workshop','foreman','worker','manager_purchases','auditor_purchases','accountant_paint','purchases_paint','invoices_paint','manager_inventory','accountant','auditor','hr','designer_2d','designer_3d','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `branch` enum('main','branch1','branch2','branch3') DEFAULT 'main';--> statement-breakpoint
ALTER TABLE `users` ADD `department` enum('sales','production','carpentry','drilling','lathe','cnc','3d','painting','assembly','purchases','accounting','design','hr');--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true;