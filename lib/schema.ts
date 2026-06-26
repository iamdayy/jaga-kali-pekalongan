import { pgTable, uuid, text, numeric, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  report_type: text("report_type").notNull().default("general"),
  severity: text("severity").notNull().default("medium"),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  address: text("address"),
  image_urls: text("image_urls").array().default([]),
  user_name: text("user_name"),
  user_email: text("user_email"),
  user_phone: text("user_phone"),
  status: text("status").notNull().default("pending"),
  confirmations_count: integer("confirmations_count").default(0),
  is_anonymous: boolean("is_anonymous").default(true),
  is_valuable: boolean("is_valuable").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  proof_image_urls: text("proof_image_urls").array().default([]),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  admin_notes: text("admin_notes"),
  assigned_to: text("assigned_to"),
  last_updated_by: text("last_updated_by"),
});

export const reportsRelations = relations(reports, ({ many }) => ({
  admin_logs: many(admin_logs),
  confirmations: many(confirmations),
}));

export const confirmations = pgTable("confirmations", {
  id: uuid("id").primaryKey().defaultRandom(),
  report_id: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  user_identifier: text("user_identifier"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const confirmationsRelations = relations(confirmations, ({ one }) => ({
  report: one(reports, {
    fields: [confirmations.report_id],
    references: [reports.id],
  }),
}));

export const admin_logs = pgTable("admin_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  report_id: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  admin_user: text("admin_user").notNull(),
  details: jsonb("details"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const adminLogsRelations = relations(admin_logs, ({ one }) => ({
  report: one(reports, {
    fields: [admin_logs.report_id],
    references: [reports.id],
  }),
}));
