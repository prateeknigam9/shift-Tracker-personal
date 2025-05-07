import { Request, Response } from "express";
import { storage } from "../storage";

export const getDailyPay = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const date = req.query.date as string;
    
    if (!date || !isValidDateFormat(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }
    
    const payData = await storage.getDailyPay(req.user.id, date);
    res.status(200).json(payData);
  } catch (error: any) {
    console.error("Error fetching daily pay:", error);
    res.status(500).json({ message: "Failed to fetch daily pay data" });
  }
};

export const getWeeklyPay = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const weekStart = req.query.week_start as string;
    
    if (!weekStart || !isValidDateFormat(weekStart)) {
      return res.status(400).json({ message: "Invalid date format for week_start. Use YYYY-MM-DD" });
    }
    
    const payData = await storage.getWeeklyPay(req.user.id, weekStart);
    res.status(200).json(payData);
  } catch (error: any) {
    console.error("Error fetching weekly pay:", error);
    res.status(500).json({ message: "Failed to fetch weekly pay data" });
  }
};

export const getMonthlyPay = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);
    
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({ message: "Invalid month or year" });
    }
    
    const payData = await storage.getMonthlyPay(req.user.id, month, year);
    res.status(200).json(payData);
  } catch (error: any) {
    console.error("Error fetching monthly pay:", error);
    res.status(500).json({ message: "Failed to fetch monthly pay data" });
  }
};

export const getYearlyPaySummary = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
    if (year < 2000 || year > 2100) {
      return res.status(400).json({ message: "Invalid year" });
    }
    
    // Fetch data for all months in the year
    const monthlyData = [];
    
    for (let month = 1; month <= 12; month++) {
      const data = await storage.getMonthlyPay(req.user.id, month, year);
      monthlyData.push({
        month,
        total: data.total,
        hours: data.hours
      });
    }
    
    const totalPay = monthlyData.reduce((sum, month) => sum + month.total, 0);
    const totalHours = monthlyData.reduce((sum, month) => sum + month.hours, 0);
    
    res.status(200).json({
      year,
      totalPay,
      totalHours,
      months: monthlyData
    });
  } catch (error: any) {
    console.error("Error fetching yearly pay summary:", error);
    res.status(500).json({ message: "Failed to fetch yearly pay summary" });
  }
};

// Helper function to validate date format (YYYY-MM-DD)
function isValidDateFormat(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
