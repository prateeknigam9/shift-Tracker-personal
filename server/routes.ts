import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import shiftRoutes from "./routes/shiftRoutes";
import payRoutes from "./routes/payRoutes";
import payScheduleRoutes from "./routes/payScheduleRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import profileRoutes from "./routes/profileRoutes";
import backupRoutes from "./routes/backupRoutes";
import achievementsRoutes from "./routes/achievementsRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import kpiRoutes from "./routes/kpiRoutes";
import adminRoutes from "./routes/adminRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Register application routes
  app.use("/api/shifts", shiftRoutes);
  app.use("/api/pay", payRoutes);
  app.use("/api/pay-schedules", payScheduleRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/backup", backupRoutes);
  app.use("/api/achievements", achievementsRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/kpi", kpiRoutes);
  app.use("/api/admin", adminRoutes);
  
  const httpServer = createServer(app);
  
  return httpServer;
}
