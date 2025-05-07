import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import { 
  getWeeklyAnalytics, 
  getMonthlyAnalytics, 
  getYearlyAnalytics 
} from "../controllers/analyticsController";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Analytics routes
router.get("/weekly", getWeeklyAnalytics);
router.get("/monthly", getMonthlyAnalytics);
router.get("/yearly", getYearlyAnalytics);

export default router;