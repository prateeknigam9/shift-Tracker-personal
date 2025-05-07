import express from "express";
import { getDailyPay, getWeeklyPay, getMonthlyPay, getYearlyPaySummary } from "../controllers/payController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = express.Router();

// All routes are protected by the isAuthenticated middleware
router.use(isAuthenticated);

// Get pay for a specific day
router.get("/daily", getDailyPay);

// Get pay for a specific week
router.get("/weekly", getWeeklyPay);

// Get pay for a specific month
router.get("/monthly", getMonthlyPay);

// Get yearly pay summary
router.get("/yearly", getYearlyPaySummary);

export default router;
