import express from "express";
import { getProfile, updateProfile, updatePassword } from "../controllers/profileController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = express.Router();

// All routes are protected by the isAuthenticated middleware
router.use(isAuthenticated);

// Get user profile
router.get("/", getProfile);

// Update user profile (name only)
router.put("/", updateProfile);

// Update user password
router.put("/password", updatePassword);

export default router;
