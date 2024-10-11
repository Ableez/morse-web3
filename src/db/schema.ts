import { relations } from "drizzle-orm";
import {
  timestamp,
  varchar,
  boolean,
  text,
  pgEnum,
  index,
  pgTableCreator,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `morse_web3_${name}`);

// Create an enum for user roles
export const userRoleEnum = pgEnum("user_role", ["buyer", "seller"]);

export const users = createTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  username: varchar("username", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }),
  profileImage: varchar("profile_image", { length: 256 }),
  walletAddress: varchar("wallet_address"),
});

export const contents = createTable(
  "contents",
  {
    id: varchar("id", { length: 255 }).primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    creatorId: varchar("creator_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 256 }).notNull(),
    description: text("description"),
    priceUSD: varchar("priceUSD").notNull(),
    priceETH: varchar("priceETH").notNull(),
    tokenId: varchar("token_id").notNull(),
    creatorAddress: varchar("creator_address"),
    coverImage: varchar("cover_image", { length: 256 }),
  },
  (table) => ({
    creatorIdIdx: index("creator_id_idx").on(table.creatorId),
    titleIdx: index("title_idx").on(table.title),
  })
);

export const contentAccess = createTable(
  "content_access",
  {
    id: varchar("id", { length: 255 }).primaryKey().notNull(),
    contentId: varchar("content_id", { length: 255 })
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => ({
    contentIdIdx: index("content_id_idx").on(table.contentId),
    userIdIdx: index("user_id_idx").on(table.userId),
    contentUserIdx: index("content_user_idx").on(table.contentId, table.userId),
  })
);

export const userRelations = relations(users, ({ many }) => ({
  createdContents: many(contents),
  accessedContents: many(contentAccess),
}));

export const contentsRelations = relations(contents, ({ one, many }) => ({
  accesses: many(contentAccess),
  creator: one(users, {
    fields: [contents.creatorId],
    references: [users.id],
  }),
}));

export const contentAccessRelations = relations(contentAccess, ({ one }) => ({
  content: one(contents, {
    fields: [contentAccess.contentId],
    references: [contents.id],
  }),
  user: one(users, {
    fields: [contentAccess.userId],
    references: [users.id],
  }),
}));

export type AddContent = typeof contents.$inferInsert;
