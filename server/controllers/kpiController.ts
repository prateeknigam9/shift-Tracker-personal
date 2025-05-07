import { Request, Response } from "express";
import { storage } from "../storage";
import { 
  insertSalesKpiSchema, 
  updateSalesKpiSchema,
  SalesKpi
} from "@shared/schema";
import { ZodError } from "zod";

// KPI Controllers
export const getSalesKpis = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const kpis = await storage.getSalesKpis(userId);
    res.status(200).json(kpis);
  } catch (error: any) {
    console.error("Error fetching sales KPIs:", error);
    res.status(500).json({ message: "Failed to fetch sales KPIs" });
  }
};

export const getSalesKpiById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const kpiId = parseInt(req.params.id);
    if (isNaN(kpiId)) return res.status(400).json({ message: "Invalid KPI ID" });

    const kpi = await storage.getSalesKpiById(userId, kpiId);
    if (!kpi) return res.status(404).json({ message: "Sales KPI not found" });

    res.status(200).json(kpi);
  } catch (error: any) {
    console.error("Error fetching sales KPI:", error);
    res.status(500).json({ message: "Failed to fetch sales KPI" });
  }
};

export const getSalesKpiByShiftId = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const shiftId = parseInt(req.params.shiftId);
    if (isNaN(shiftId)) return res.status(400).json({ message: "Invalid Shift ID" });

    const kpi = await storage.getSalesKpiByShiftId(userId, shiftId);
    
    // Return empty object if no KPI found for this shift (not an error condition)
    res.status(200).json(kpi || { 
      shift_id: shiftId,
      tech_insurance_sales: 0,
      instant_insurance_sales: 0,
      sky_tv_sales: 0,
      sky_broadband_sales: 0,
      sky_streaming_sales: 0
    });
  } catch (error: any) {
    console.error("Error fetching sales KPI for shift:", error);
    res.status(500).json({ message: "Failed to fetch sales KPI for shift" });
  }
};

export const createSalesKpi = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const validatedData = insertSalesKpiSchema.parse({
      ...req.body,
      user_id: userId
    });

    // Check if a KPI record already exists for this shift
    if (validatedData.shift_id) {
      const existingKpi = await storage.getSalesKpiByShiftId(userId, validatedData.shift_id);
      if (existingKpi) {
        return res.status(400).json({ 
          message: "A KPI record already exists for this shift. Use the update endpoint instead." 
        });
      }
    }

    const kpi = await storage.createSalesKpi(validatedData);
    res.status(201).json(kpi);
  } catch (error: any) {
    console.error("Error creating sales KPI:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create sales KPI" });
  }
};

export const updateSalesKpi = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const kpiId = parseInt(req.params.id);
    if (isNaN(kpiId)) return res.status(400).json({ message: "Invalid KPI ID" });

    const validatedData = updateSalesKpiSchema.parse(req.body);

    const updatedKpi = await storage.updateSalesKpi(userId, kpiId, validatedData);
    if (!updatedKpi) return res.status(404).json({ message: "Sales KPI not found" });

    res.status(200).json(updatedKpi);
  } catch (error: any) {
    console.error("Error updating sales KPI:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update sales KPI" });
  }
};

export const deleteSalesKpi = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const kpiId = parseInt(req.params.id);
    if (isNaN(kpiId)) return res.status(400).json({ message: "Invalid KPI ID" });

    const success = await storage.deleteSalesKpi(userId, kpiId);
    if (!success) return res.status(404).json({ message: "Sales KPI not found" });

    res.status(200).json({ message: "Sales KPI deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting sales KPI:", error);
    res.status(500).json({ message: "Failed to delete sales KPI" });
  }
};

// KPI Summary and Analytics
export const getKpiSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    // Get all KPIs for the user
    const allKpis = await storage.getSalesKpis(userId);
    
    // Calculate totals
    const totals = {
      tech_insurance_sales: 0,
      instant_insurance_sales: 0,
      sky_tv_sales: 0,
      sky_broadband_sales: 0,
      sky_streaming_sales: 0
    };
    
    allKpis.forEach((kpi: SalesKpi) => {
      totals.tech_insurance_sales += kpi.tech_insurance_sales;
      totals.instant_insurance_sales += kpi.instant_insurance_sales;
      totals.sky_tv_sales += kpi.sky_tv_sales;
      totals.sky_broadband_sales += kpi.sky_broadband_sales;
      totals.sky_streaming_sales += kpi.sky_streaming_sales;
    });
    
    // Calculate total for all types
    const totalSales = 
      totals.tech_insurance_sales + 
      totals.instant_insurance_sales + 
      totals.sky_tv_sales + 
      totals.sky_broadband_sales +
      totals.sky_streaming_sales;
    
    // Get monthly breakdown (last 6 months)
    const monthlyBreakdown: Record<string, any>[] = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const monthKpis = allKpis.filter((kpi: SalesKpi) => {
        if (!kpi.created_at) return false;
        const kpiDate = new Date(kpi.created_at.toString());
        return kpiDate >= month && kpiDate <= monthEnd;
      });
      
      const monthTotals = {
        month: month.toLocaleString('default', { month: 'long' }),
        year: month.getFullYear(),
        tech_insurance_sales: 0,
        instant_insurance_sales: 0,
        sky_tv_sales: 0,
        sky_broadband_sales: 0,
        sky_streaming_sales: 0,
        total: 0
      };
      
      monthKpis.forEach((kpi: SalesKpi) => {
        monthTotals.tech_insurance_sales += kpi.tech_insurance_sales;
        monthTotals.instant_insurance_sales += kpi.instant_insurance_sales;
        monthTotals.sky_tv_sales += kpi.sky_tv_sales;
        monthTotals.sky_broadband_sales += kpi.sky_broadband_sales;
        monthTotals.sky_streaming_sales += kpi.sky_streaming_sales;
      });
      
      monthTotals.total = 
        monthTotals.tech_insurance_sales + 
        monthTotals.instant_insurance_sales + 
        monthTotals.sky_tv_sales + 
        monthTotals.sky_broadband_sales +
        monthTotals.sky_streaming_sales;
      
      monthlyBreakdown.push(monthTotals);
    }
    
    // Get recent KPIs (last 5)
    const recentKpis = allKpis.slice(0, 5);
    
    // Calculate performance trends
    const trends = {
      increasing: [] as string[],
      decreasing: [] as string[],
      steady: [] as string[]
    };
    
    if (monthlyBreakdown.length >= 2) {
      const currentMonth = monthlyBreakdown[0];
      const previousMonth = monthlyBreakdown[1];
      
      // Tech insurance trend
      if (currentMonth.tech_insurance_sales > previousMonth.tech_insurance_sales * 1.1) {
        trends.increasing.push('tech_insurance_sales');
      } else if (currentMonth.tech_insurance_sales < previousMonth.tech_insurance_sales * 0.9) {
        trends.decreasing.push('tech_insurance_sales');
      } else {
        trends.steady.push('tech_insurance_sales');
      }
      
      // Instant insurance trend
      if (currentMonth.instant_insurance_sales > previousMonth.instant_insurance_sales * 1.1) {
        trends.increasing.push('instant_insurance_sales');
      } else if (currentMonth.instant_insurance_sales < previousMonth.instant_insurance_sales * 0.9) {
        trends.decreasing.push('instant_insurance_sales');
      } else {
        trends.steady.push('instant_insurance_sales');
      }
      
      // Sky TV trend
      if (currentMonth.sky_tv_sales > previousMonth.sky_tv_sales * 1.1) {
        trends.increasing.push('sky_tv_sales');
      } else if (currentMonth.sky_tv_sales < previousMonth.sky_tv_sales * 0.9) {
        trends.decreasing.push('sky_tv_sales');
      } else {
        trends.steady.push('sky_tv_sales');
      }
      
      // Sky Broadband trend
      if (currentMonth.sky_broadband_sales > previousMonth.sky_broadband_sales * 1.1) {
        trends.increasing.push('sky_broadband_sales');
      } else if (currentMonth.sky_broadband_sales < previousMonth.sky_broadband_sales * 0.9) {
        trends.decreasing.push('sky_broadband_sales');
      } else {
        trends.steady.push('sky_broadband_sales');
      }
      
      // Sky Streaming trend
      if (currentMonth.sky_streaming_sales > previousMonth.sky_streaming_sales * 1.1) {
        trends.increasing.push('sky_streaming_sales');
      } else if (currentMonth.sky_streaming_sales < previousMonth.sky_streaming_sales * 0.9) {
        trends.decreasing.push('sky_streaming_sales');
      } else {
        trends.steady.push('sky_streaming_sales');
      }
    }
    
    // Prepare summary response
    const summary = {
      totals,
      totalSales,
      monthlyBreakdown,
      recentKpis,
      trends
    };
    
    res.status(200).json(summary);
  } catch (error: any) {
    console.error("Error generating KPI summary:", error);
    res.status(500).json({ message: "Failed to generate KPI summary" });
  }
};