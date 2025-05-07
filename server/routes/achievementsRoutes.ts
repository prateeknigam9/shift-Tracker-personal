import express from "express";
import { getAchievements, checkAchievements } from "../controllers/achievementsController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = express.Router();

// All routes are protected by the isAuthenticated middleware
router.use(isAuthenticated);

// Get user achievements
router.get("/", getAchievements);

// Check for new achievements
router.post("/check", checkAchievements);

export default router;
