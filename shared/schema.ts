import { pgTable, text, serial, integer, date, time, numeric, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  full_name: text("full_name").notNull(),
});

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  break_time: numeric("break_time").notNull(), // in hours
  notes: text("notes"),
  hourly_rate: numeric("hourly_rate").notNull(),
  total_pay: numeric("total_pay").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const pay_schedules = pgTable("pay_schedules", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  pay_date: date("pay_date").notNull(),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, delayed
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  unlocked_at: timestamp("unlocked_at").defaultNow(),
});

export const wellness_metrics = pgTable("wellness_metrics", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  work_hours: numeric("work_hours").notNull().default("0"),
  overtime_hours: numeric("overtime_hours").notNull().default("0"),
  stress_level: integer("stress_level").notNull().default(0), // 1-5 scale
  rest_quality: integer("rest_quality").notNull().default(0), // 1-5 scale
  work_satisfaction: integer("work_satisfaction").notNull().default(0), // 1-5 scale
  balance_score: integer("balance_score").notNull().default(0), // 0-100 scale
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

export const wellness_goals = pgTable("wellness_goals", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  goal_type: text("goal_type").notNull(), // e.g., "max_weekly_hours", "min_rest_days", etc.
  target_value: numeric("target_value").notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date"),
  is_active: integer("is_active").notNull().default(1),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  shifts: many(shifts),
  pay_schedules: many(pay_schedules),
  achievements: many(achievements),
  wellness_metrics: many(wellness_metrics),
  wellness_goals: many(wellness_goals),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
  user: one(users, {
    fields: [shifts.user_id],
    references: [users.id],
  }),
}));

export const pay_schedulesRelations = relations(pay_schedules, ({ one }) => ({
  user: one(users, {
    fields: [pay_schedules.user_id],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.user_id],
    references: [users.id],
  }),
}));

export const wellness_metricsRelations = relations(wellness_metrics, ({ one }) => ({
  user: one(users, {
    fields: [wellness_metrics.user_id],
    references: [users.id],
  }),
}));

export const wellness_goalsRelations = relations(wellness_goals, ({ one }) => ({
  user: one(users, {
    fields: [wellness_goals.user_id],
    references: [users.id],
  }),
}));

// Create insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
// Create base insert schema for shifts
export const baseInsertShiftSchema = createInsertSchema(shifts).omit({ id: true, created_at: true });

// Modified insert schema for shifts that handles numeric fields more flexibly
export const insertShiftSchema = baseInsertShiftSchema
  .extend({
    break_time: z.union([z.string(), z.number()]).transform(val => String(val)),
    hourly_rate: z.union([z.string(), z.number()]).transform(val => String(val)),
    total_pay: z.union([z.string(), z.number()]).transform(val => String(val)),
  });
  
// Create a schema for partial updates to shifts
export const updateShiftSchema = z.object({
  date: z.union([z.string(), z.date()]).transform(val => {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return val;
  }).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  break_time: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  notes: z.string().nullable().optional(),
  hourly_rate: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  total_pay: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
});
export const insertPayScheduleSchema = createInsertSchema(pay_schedules).omit({ id: true, created_at: true })
  .extend({
    amount: z.union([z.string(), z.number()]).transform(val => String(val)),
  });

export const updatePayScheduleSchema = z.object({
  pay_date: z.union([z.string(), z.date()]).transform(val => {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return val;
  }).optional(),
  period_start: z.union([z.string(), z.date()]).transform(val => {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return val;
  }).optional(),
  period_end: z.union([z.string(), z.date()]).transform(val => {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return val;
  }).optional(),
  amount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  status: z.enum(["pending", "paid", "delayed"]).optional(),
  notes: z.string().nullable().optional(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, unlocked_at: true });

export const insertWellnessMetricSchema = createInsertSchema(wellness_metrics).omit({ id: true, created_at: true })
  .extend({
    work_hours: z.union([z.string(), z.number()]).transform(val => String(val)),
    overtime_hours: z.union([z.string(), z.number()]).transform(val => String(val)),
  });

export const updateWellnessMetricSchema = z.object({
  date: z.union([z.string(), z.date()]).transform(val => {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return val;
  }).optional(),
  work_hours: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  overtime_hours: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  stress_level: z.number().min(0).max(5).optional(),
  rest_quality: z.number().min(0).max(5).optional(),
  work_satisfaction: z.number().min(0).max(5).optional(),
  balance_score: z.number().min(0).max(100).optional(),
  notes: z.string().nullable().optional(),
});

export const insertWellnessGoalSchema = createInsertSchema(wellness_goals).omit({ id: true, created_at: true })
  .extend({
    target_value: z.union([z.string(), z.number()]).transform(val => String(val)),
  });

export const updateWellnessGoalSchema = z.object({
  goal_type: z.string().optional(),
  target_value: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  start_date: z.union([z.string(), z.date()]).transform(val => {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return val;
  }).optional(),
  end_date: z.union([z.string(), z.date()]).transform(val => {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return val;
  }).optional(),
  is_active: z.number().min(0).max(1).optional(),
  notes: z.string().nullable().optional(),
});

// Create validation schemas
export const userLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userRegisterSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;
export type PaySchedule = typeof pay_schedules.$inferSelect;
export type InsertPaySchedule = typeof pay_schedules.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type WellnessMetric = typeof wellness_metrics.$inferSelect;
export type InsertWellnessMetric = typeof wellness_metrics.$inferInsert;
export type WellnessGoal = typeof wellness_goals.$inferSelect;
export type InsertWellnessGoal = typeof wellness_goals.$inferInsert;

// Additional validation types
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserRegister = z.infer<typeof userRegisterSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;
export type UpdateShift = z.infer<typeof updateShiftSchema>;
export type UpdatePaySchedule = z.infer<typeof updatePayScheduleSchema>;
export type UpdateWellnessMetric = z.infer<typeof updateWellnessMetricSchema>;
export type UpdateWellnessGoal = z.infer<typeof updateWellnessGoalSchema>;
