import { Request, Response } from "express";
import { storage } from "../storage";
import { groqService } from "../services/groqService";

export const getWeeklyAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Get all shifts for the user
    const shifts = await storage.getShifts(userId);
    
    // Get the last 7 days of shifts
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    const weeklyShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= lastWeek && shiftDate <= today;
    });
    
    // Format data for weekly view
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dailyData = days.map(day => {
      const dayShifts = weeklyShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.getDay() === days.indexOf(day);
      });
      
      const totalHours = dayShifts.reduce((acc, shift) => {
        const startTime = new Date(`2000-01-01T${shift.start_time}`);
        const endTime = new Date(`2000-01-01T${shift.end_time}`);
        const breakDuration = shift.break_duration || 0;
        
        // Calculate hours worked
        let hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        hoursWorked -= breakDuration / 60; // Convert break minutes to hours
        
        return acc + hoursWorked;
      }, 0);
      
      const totalEarnings = dayShifts.reduce((acc, shift) => {
        const startTime = new Date(`2000-01-01T${shift.start_time}`);
        const endTime = new Date(`2000-01-01T${shift.end_time}`);
        const breakDuration = shift.break_duration || 0;
        
        // Calculate hours worked
        let hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        hoursWorked -= breakDuration / 60; // Convert break minutes to hours
        
        return acc + (hoursWorked * (shift.hourly_rate || 0));
      }, 0);
      
      return {
        name: day,
        hours: parseFloat(totalHours.toFixed(2)),
        earnings: parseFloat(totalEarnings.toFixed(2))
      };
    });
    
    // Generate insights using GROQ
    let insights = "";
    try {
      insights = await groqService.generateReportInsights({
        timeframe: "weekly",
        data: dailyData
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      insights = "Unable to generate insights at this time.";
    }
    
    res.json({
      dailyData,
      summary: {
        totalHours: parseFloat(dailyData.reduce((acc, day) => acc + day.hours, 0).toFixed(2)),
        totalEarnings: parseFloat(dailyData.reduce((acc, day) => acc + day.earnings, 0).toFixed(2)),
        averageHoursPerDay: parseFloat((dailyData.reduce((acc, day) => acc + day.hours, 0) / 7).toFixed(2)),
        mostActiveDay: dailyData.reduce((prev, current) => 
          (prev.hours > current.hours) ? prev : current
        ).name,
      },
      shiftTypes: calculateShiftTypes(weeklyShifts),
      insights
    });
  } catch (error) {
    console.error("Error getting weekly analytics:", error);
    res.status(500).json({ error: "Failed to get weekly analytics" });
  }
};

export const getMonthlyAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Get all shifts for the user
    const shifts = await storage.getShifts(userId);
    
    // Get the last 30 days of shifts
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    
    const monthlyShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= lastMonth && shiftDate <= today;
    });
    
    // Format data for weekly grouping
    const weeklyData = [];
    
    // Group data by week
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(lastMonth);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekShifts = monthlyShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= weekStart && shiftDate <= weekEnd;
      });
      
      const totalHours = weekShifts.reduce((acc, shift) => {
        const startTime = new Date(`2000-01-01T${shift.start_time}`);
        const endTime = new Date(`2000-01-01T${shift.end_time}`);
        const breakDuration = shift.break_duration || 0;
        
        // Calculate hours worked
        let hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        hoursWorked -= breakDuration / 60; // Convert break minutes to hours
        
        return acc + hoursWorked;
      }, 0);
      
      const totalEarnings = weekShifts.reduce((acc, shift) => {
        const startTime = new Date(`2000-01-01T${shift.start_time}`);
        const endTime = new Date(`2000-01-01T${shift.end_time}`);
        const breakDuration = shift.break_duration || 0;
        
        // Calculate hours worked
        let hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        hoursWorked -= breakDuration / 60; // Convert break minutes to hours
        
        return acc + (hoursWorked * (shift.hourly_rate || 0));
      }, 0);
      
      weeklyData.push({
        name: `Week ${i + 1}`,
        hours: parseFloat(totalHours.toFixed(2)),
        earnings: parseFloat(totalEarnings.toFixed(2))
      });
    }
    
    // Generate insights using GROQ
    let insights = "";
    try {
      insights = await groqService.generateReportInsights({
        timeframe: "monthly",
        data: weeklyData
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      insights = "Unable to generate insights at this time.";
    }
    
    res.json({
      weeklyData,
      summary: {
        totalHours: parseFloat(weeklyData.reduce((acc, week) => acc + week.hours, 0).toFixed(2)),
        totalEarnings: parseFloat(weeklyData.reduce((acc, week) => acc + week.earnings, 0).toFixed(2)),
        averageHoursPerWeek: parseFloat((weeklyData.reduce((acc, week) => acc + week.hours, 0) / 4).toFixed(2)),
        mostActiveWeek: weeklyData.reduce((prev, current) => 
          (prev.hours > current.hours) ? prev : current
        ).name,
      },
      shiftTypes: calculateShiftTypes(monthlyShifts),
      insights
    });
  } catch (error) {
    console.error("Error getting monthly analytics:", error);
    res.status(500).json({ error: "Failed to get monthly analytics" });
  }
};

export const getYearlyAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Get all shifts for the user
    const shifts = await storage.getShifts(userId);
    
    // Get the last 365 days of shifts
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);
    
    const yearlyShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= lastYear && shiftDate <= today;
    });
    
    // Format data for monthly grouping
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = months.map((month, index) => {
      const monthShifts = yearlyShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.getMonth() === index;
      });
      
      const totalHours = monthShifts.reduce((acc, shift) => {
        const startTime = new Date(`2000-01-01T${shift.start_time}`);
        const endTime = new Date(`2000-01-01T${shift.end_time}`);
        const breakDuration = shift.break_duration || 0;
        
        // Calculate hours worked
        let hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        hoursWorked -= breakDuration / 60; // Convert break minutes to hours
        
        return acc + hoursWorked;
      }, 0);
      
      const totalEarnings = monthShifts.reduce((acc, shift) => {
        const startTime = new Date(`2000-01-01T${shift.start_time}`);
        const endTime = new Date(`2000-01-01T${shift.end_time}`);
        const breakDuration = shift.break_duration || 0;
        
        // Calculate hours worked
        let hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        hoursWorked -= breakDuration / 60; // Convert break minutes to hours
        
        return acc + (hoursWorked * (shift.hourly_rate || 0));
      }, 0);
      
      return {
        name: month,
        hours: parseFloat(totalHours.toFixed(2)),
        earnings: parseFloat(totalEarnings.toFixed(2))
      };
    });
    
    // Generate insights using GROQ
    let insights = "";
    try {
      insights = await groqService.generateReportInsights({
        timeframe: "yearly",
        data: monthlyData
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      insights = "Unable to generate insights at this time.";
    }
    
    res.json({
      monthlyData,
      summary: {
        totalHours: parseFloat(monthlyData.reduce((acc, month) => acc + month.hours, 0).toFixed(2)),
        totalEarnings: parseFloat(monthlyData.reduce((acc, month) => acc + month.earnings, 0).toFixed(2)),
        averageHoursPerMonth: parseFloat((monthlyData.reduce((acc, month) => acc + month.hours, 0) / 12).toFixed(2)),
        mostActiveMonth: monthlyData.reduce((prev, current) => 
          (prev.hours > current.hours) ? prev : current
        ).name,
      },
      shiftTypes: calculateShiftTypes(yearlyShifts),
      insights
    });
  } catch (error) {
    console.error("Error getting yearly analytics:", error);
    res.status(500).json({ error: "Failed to get yearly analytics" });
  }
};

// Helper functions
function calculateShiftTypes(shifts: any[]) {
  const shiftTypes = {
    morning: 0,
    afternoon: 0,
    night: 0
  };
  
  shifts.forEach(shift => {
    const startHour = parseInt(shift.start_time.split(':')[0], 10);
    
    if (startHour >= 5 && startHour < 12) {
      shiftTypes.morning += 1;
    } else if (startHour >= 12 && startHour < 17) {
      shiftTypes.afternoon += 1;
    } else {
      shiftTypes.night += 1;
    }
  });
  
  // Convert to array format for pie chart
  return [
    { name: "Morning Shifts", value: shiftTypes.morning },
    { name: "Afternoon Shifts", value: shiftTypes.afternoon },
    { name: "Night Shifts", value: shiftTypes.night }
  ];
}