import { Request, Response } from "express";
import { storage } from "../storage";
import { groqService } from "../services/groqService";

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const period = req.query.period as string || 'weekly';
    
    if (period !== 'weekly' && period !== 'monthly') {
      return res.status(400).json({ message: "Invalid period. Use 'weekly' or 'monthly'" });
    }
    
    let data;
    
    if (period === 'weekly') {
      data = await storage.getWeeklyData(req.user.id);
    } else {
      data = await storage.getMonthlyData(req.user.id);
    }
    
    // Get weekly totals for summary
    const weeklyData = await storage.getWeeklyData(req.user.id);
    const weeklyHours = weeklyData.days.reduce((sum, day) => sum + day.hours, 0);
    const weeklyPay = weeklyData.days.reduce((sum, day) => sum + day.pay, 0);
    
    // Get next scheduled shift
    const nextShift = await storage.getNextShift(req.user.id);
    
    // Format next shift data
    let nextShiftData = null;
    if (nextShift) {
      const shiftDate = new Date(nextShift.date.toString());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let dayLabel;
      if (shiftDate.getTime() === today.getTime()) {
        dayLabel = "Today";
      } else {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (shiftDate.getTime() === tomorrow.getTime()) {
          dayLabel = "Tomorrow";
        } else {
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          dayLabel = daysOfWeek[shiftDate.getDay()];
        }
      }
      
      nextShiftData = {
        id: nextShift.id,
        day: dayLabel,
        date: nextShift.date,
        time: `${nextShift.start_time} - ${nextShift.end_time}`,
        breakTime: nextShift.break_time,
        hourlyRate: nextShift.hourly_rate,
        totalPay: nextShift.total_pay
      };
    }
    
    res.status(200).json({
      period,
      data,
      summary: {
        weeklyHours,
        weeklyPay,
        nextShift: nextShiftData
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get user's shifts for analysis
    const shifts = await storage.getShifts(req.user.id);
    
    // Generate AI summary
    const summary = await groqService.generateDashboardSummary(shifts);
    
    res.status(200).json({ summary });
  } catch (error) {
    console.error("Error generating dashboard summary:", error);
    res.status(500).json({ message: "Failed to generate dashboard summary" });
  }
};

export const processNotes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { notes } = req.body;
    
    if (!notes || typeof notes !== 'string') {
      return res.status(400).json({ message: "Notes must be provided as a string" });
    }
    
    // Process notes with AI
    const processedNotes = await groqService.processNotes(notes);
    
    res.status(200).json({ processedNotes });
  } catch (error) {
    console.error("Error processing notes:", error);
    res.status(500).json({ message: "Failed to process notes" });
  }
};
