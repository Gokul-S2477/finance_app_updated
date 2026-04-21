import { pgTable, serial, text, integer, date, boolean, decimal, timestamp } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
    id: serial("id").primaryKey(),
    ownId: text("own_id").unique(), // Manual ID
    name: text("name").notNull(),
    address: text("address").notNull(),
    idProof: text("id_proof").notNull(), // Aadhar, PAN
    idNumber: text("id_number").notNull(),
    dob: date("dob").notNull(),
    mobile: text("mobile_no").notNull(),
    status: boolean("status").default(true), // active/inactive
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
