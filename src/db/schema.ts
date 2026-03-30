import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// NextAuth.js tables (required by @auth/drizzle-adapter)
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

// We're NOT using database sessions - keeping JWT strategy
// So we don't need sessions or verificationToken tables

// App-specific table: Schedule Items
export const scheduleItems = pgTable("schedule_items", {
  id: text("id").primaryKey(), // nanoid generated on client
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  title: text("title").notNull(),
  isDeepWork: boolean("isDeepWork").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  startTime: text("startTime"), // HH:mm format, optional
  endTime: text("endTime"), // HH:mm format, optional
  location: text("location"),
  notes: text("notes"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

// App-specific table: Presets (reusable schedule item templates)
export const presets = pgTable("presets", {
  id: text("id").primaryKey(), // nanoid generated on client
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isDeepWork: boolean("isDeepWork").notNull().default(false),
  startTime: text("startTime"), // HH:mm format, optional
  endTime: text("endTime"), // HH:mm format, optional
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});
