import express from "express";
import { exportShifts, importShifts } from "../controllers/backupController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = express.Router();

// All routes are protected by the isAuthenticated middleware
router.use(isAuthenticated);

// Export shifts as CSV
router.get("/export", exportShifts);

// Import shifts from CSV
router.post("/import", importShifts);

export default router;
