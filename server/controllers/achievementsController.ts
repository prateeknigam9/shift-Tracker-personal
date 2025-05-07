import { Request, Response } from "express";
import { storage } from "../storage";
import { groqService } from "../services/groqService";

export const getAchievements = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const achievements = await storage.getUserAchievements(req.user.id);
    res.status(200).json(achievements);
  } catch (error: any) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ message: "Failed to fetch achievements" });
  }
};

export const checkAchievements = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get all user shifts
    const shifts = await storage.getShifts(req.user.id);
    
    // Calculate total hours worked
    let totalHours = 0;
    let totalPay = 0;
    
    shifts.forEach(shift => {
      // Calculate hours
      const startTime = new Date(`1970-01-01T${shift.start_time}`);
      const endTime = new Date(`1970-01-01T${shift.end_time}`);
      let shiftHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      shiftHours -= Number(shift.break_time);
      
      totalHours += shiftHours;
      totalPay += Number(shift.total_pay);
    });
    
    // Get existing achievements
    const existingAchievements = await storage.getUserAchievements(req.user.id);
    const existingTypes = existingAchievements.map(a => a.title);
    
    // Define achievement criteria
    const newAchievements = [];
    
    // Hours milestones
    if (totalHours >= 50 && !existingTypes.includes('50 Hours Milestone')) {
      const description = await groqService.generateAchievementDescription('HOURS_MILESTONE_50', { hours: totalHours });
      const achievement = await storage.addAchievement({
        user_id: req.user.id,
        title: '50 Hours Milestone',
        description
      });
      newAchievements.push(achievement);
    }
    
    if (totalHours >= 100 && !existingTypes.includes('100 Hours Milestone')) {
      const description = await groqService.generateAchievementDescription('HOURS_MILESTONE_100', { hours: totalHours });
      const achievement = await storage.addAchievement({
        user_id: req.user.id,
        title: '100 Hours Milestone',
        description
      });
      newAchievements.push(achievement);
    }
    
    // Pay milestones
    if (totalPay >= 1000 && !existingTypes.includes('$1000 Earned')) {
      const description = await groqService.generateAchievementDescription('PAY_MILESTONE_1000', { pay: totalPay });
      const achievement = await storage.addAchievement({
        user_id: req.user.id,
        title: '$1000 Earned',
        description
      });
      newAchievements.push(achievement);
    }
    
    // Shifts milestone
    if (shifts.length >= 10 && !existingTypes.includes('10 Shifts Completed')) {
      const description = await groqService.generateAchievementDescription('SHIFTS_MILESTONE_10', { shifts: shifts.length });
      const achievement = await storage.addAchievement({
        user_id: req.user.id,
        title: '10 Shifts Completed',
        description
      });
      newAchievements.push(achievement);
    }
    
    res.status(200).json({
      newAchievements,
      totalAchievements: existingAchievements.length + newAchievements.length
    });
  } catch (error: any) {
    console.error("Error checking achievements:", error);
    res.status(500).json({ message: "Failed to check achievements" });
  }
};
