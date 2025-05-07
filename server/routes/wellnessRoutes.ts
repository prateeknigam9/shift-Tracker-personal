import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import {
  getWellnessMetrics,
  getWellnessMetricById,
  createWellnessMetric,
  updateWellnessMetric,
  deleteWellnessMetric,
  getWellnessGoals,
  getWellnessGoalById,
  createWellnessGoal,
  updateWellnessGoal,
  deleteWellnessGoal,
  getWellnessSummary
} from "../controllers/wellnessController";

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Wellness Metrics Routes
router.get("/metrics", getWellnessMetrics);
router.get("/metrics/:id", getWellnessMetricById);
router.post("/metrics", createWellnessMetric);
router.put("/metrics/:id", updateWellnessMetric);
router.delete("/metrics/:id", deleteWellnessMetric);

// Wellness Goals Routes
router.get("/goals", getWellnessGoals);
router.get("/goals/:id", getWellnessGoalById);
router.post("/goals", createWellnessGoal);
router.put("/goals/:id", updateWellnessGoal);
router.delete("/goals/:id", deleteWellnessGoal);

// Wellness Summary Route
router.get("/summary", getWellnessSummary);

export default router;