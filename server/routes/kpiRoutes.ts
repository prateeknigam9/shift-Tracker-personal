import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import {
  getSalesKpis,
  getSalesKpiById,
  getSalesKpiByShiftId,
  createSalesKpi,
  updateSalesKpi,
  deleteSalesKpi,
  getKpiSummary
} from "../controllers/kpiController";

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// KPI Routes
router.get("/", getSalesKpis);
router.get("/summary", getKpiSummary);
router.get("/:id", getSalesKpiById);
router.get("/shift/:shiftId", getSalesKpiByShiftId);
router.post("/", createSalesKpi);
router.put("/:id", updateSalesKpi);
router.delete("/:id", deleteSalesKpi);

export default router;