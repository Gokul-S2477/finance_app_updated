import { pgTable, serial, text, integer, date, boolean, decimal, timestamp } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
    id: serial("id").primaryKey(),
    ownId: text("own_id").notNull().unique(), // DL Number — mandatory primary identifier
    name: text("name").notNull(),
    address: text("address").notNull(),
    idProof: text("id_proof"),               // Optional
    idNumber: text("id_number"),             // Optional
    dob: date("dob"),                        // Optional
    mobile: text("mobile_no").notNull(),
    mobileAlt: text("mobile_alt"),           // Alternate phone number (optional)
    status: boolean("status").default(true),
    isDeleted: boolean("is_deleted").default(false),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const loans = pgTable("loans", {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id).notNull(),
    loanAmount: decimal("loan_amount", { precision: 10, scale: 2 }).notNull(),
    givenAmount: decimal("given_amount", { precision: 10, scale: 2 }).notNull(),
    interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).default("12.00"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: text("status", { enum: ["active", "closed"] }).default("active"),
    closedDate: timestamp("closed_date"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const collections = pgTable("collections", {
    id: serial("id").primaryKey(),
    loanId: integer("loan_id").references(() => loans.id).notNull(),
    paymentDate: date("payment_date").notNull(),
    amountCollected: decimal("amount_collected", { precision: 10, scale: 2 }).notNull(),
    status: text("status", { enum: ["paid", "missed"] }).default("paid"),
    createdAt: timestamp("created_at").defaultNow(),
});
