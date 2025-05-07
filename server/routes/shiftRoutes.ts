import express from "express";
import { getShifts, getShiftById, createShift, updateShift, deleteShift } from "../controllers/shiftController";
import { isAuthenticated } from "../middleware/authMiddleware";

const router = express.Router();

// All routes are protected by the isAuthenticated middleware
router.use(isAuthenticated);

// Get all shifts for the authenticated user
router.get("/", getShifts);

// Get a specific shift by ID
router.get("/:id", getShiftById);

// Create a new shift
router.post("/", createShift);

// Update an existing shift
router.put("/:id", updateShift);

// Delete a shift
router.delete("/:id", deleteShift);

export default router;
