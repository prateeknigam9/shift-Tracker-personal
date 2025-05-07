import express from "express";
import { getDashboardData, getDashboardSummary, processNotes } from "../controllers/dashboardController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = express.Router();

// All routes are protected by the isAuthenticated middleware
router.use(isAuthenticated);

// Get dashboard data (weekly or monthly)
router.get("/data", getDashboardData);

// Get AI-generated dashboard summary
router.get("/summary", getDashboardSummary);

// Process notes with AI
router.post("/notes/process", processNotes);

export default router;
