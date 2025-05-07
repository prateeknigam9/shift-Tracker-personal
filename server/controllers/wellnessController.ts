import { Request, Response } from "express";
import { storage } from "../storage";
import { 
  insertWellnessMetricSchema, 
  updateWellnessMetricSchema,
  insertWellnessGoalSchema,
  updateWellnessGoalSchema,
  WellnessMetric,
  WellnessGoal
} from "@shared/schema";
import { ZodError } from "zod";

// Wellness Metrics Controllers
export const getWellnessMetrics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const metrics = await storage.getWellnessMetrics(userId);
    res.status(200).json(metrics);
  } catch (error) {
    console.error("Error fetching wellness metrics:", error);
    res.status(500).json({ message: "Failed to fetch wellness metrics" });
  }
};

export const getWellnessMetricById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const metricId = parseInt(req.params.id);
    if (isNaN(metricId)) return res.status(400).json({ message: "Invalid metric ID" });

    const metric = await storage.getWellnessMetricById(userId, metricId);
    if (!metric) return res.status(404).json({ message: "Wellness metric not found" });

    res.status(200).json(metric);
  } catch (error) {
    console.error("Error fetching wellness metric:", error);
    res.status(500).json({ message: "Failed to fetch wellness metric" });
  }
};

export const createWellnessMetric = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const validatedData = insertWellnessMetricSchema.parse({
      ...req.body,
      user_id: userId
    });

    const metric = await storage.createWellnessMetric(validatedData);
    res.status(201).json(metric);
  } catch (error) {
    console.error("Error creating wellness metric:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create wellness metric" });
  }
};

export const updateWellnessMetric = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const metricId = parseInt(req.params.id);
    if (isNaN(metricId)) return res.status(400).json({ message: "Invalid metric ID" });

    const validatedData = updateWellnessMetricSchema.parse(req.body);

    const updatedMetric = await storage.updateWellnessMetric(userId, metricId, validatedData);
    if (!updatedMetric) return res.status(404).json({ message: "Wellness metric not found" });

    res.status(200).json(updatedMetric);
  } catch (error) {
    console.error("Error updating wellness metric:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update wellness metric" });
  }
};

export const deleteWellnessMetric = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const metricId = parseInt(req.params.id);
    if (isNaN(metricId)) return res.status(400).json({ message: "Invalid metric ID" });

    const success = await storage.deleteWellnessMetric(userId, metricId);
    if (!success) return res.status(404).json({ message: "Wellness metric not found" });

    res.status(200).json({ message: "Wellness metric deleted successfully" });
  } catch (error) {
    console.error("Error deleting wellness metric:", error);
    res.status(500).json({ message: "Failed to delete wellness metric" });
  }
};

// Wellness Goals Controllers
export const getWellnessGoals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const goals = await storage.getWellnessGoals(userId);
    res.status(200).json(goals);
  } catch (error) {
    console.error("Error fetching wellness goals:", error);
    res.status(500).json({ message: "Failed to fetch wellness goals" });
  }
};

export const getWellnessGoalById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const goalId = parseInt(req.params.id);
    if (isNaN(goalId)) return res.status(400).json({ message: "Invalid goal ID" });

    const goal = await storage.getWellnessGoalById(userId, goalId);
    if (!goal) return res.status(404).json({ message: "Wellness goal not found" });

    res.status(200).json(goal);
  } catch (error) {
    console.error("Error fetching wellness goal:", error);
    res.status(500).json({ message: "Failed to fetch wellness goal" });
  }
};

export const createWellnessGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const validatedData = insertWellnessGoalSchema.parse({
      ...req.body,
      user_id: userId
    });

    const goal = await storage.createWellnessGoal(validatedData);
    res.status(201).json(goal);
  } catch (error) {
    console.error("Error creating wellness goal:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create wellness goal" });
  }
};

export const updateWellnessGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const goalId = parseInt(req.params.id);
    if (isNaN(goalId)) return res.status(400).json({ message: "Invalid goal ID" });

    const validatedData = updateWellnessGoalSchema.parse(req.body);

    const updatedGoal = await storage.updateWellnessGoal(userId, goalId, validatedData);
    if (!updatedGoal) return res.status(404).json({ message: "Wellness goal not found" });

    res.status(200).json(updatedGoal);
  } catch (error) {
    console.error("Error updating wellness goal:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update wellness goal" });
  }
};

export const deleteWellnessGoal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const goalId = parseInt(req.params.id);
    if (isNaN(goalId)) return res.status(400).json({ message: "Invalid goal ID" });

    const success = await storage.deleteWellnessGoal(userId, goalId);
    if (!success) return res.status(404).json({ message: "Wellness goal not found" });

    res.status(200).json({ message: "Wellness goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting wellness goal:", error);
    res.status(500).json({ message: "Failed to delete wellness goal" });
  }
};

// Aggregate Wellness Data Controllers
export const getWellnessSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    // Get metrics from the last 30 days
    const recentMetrics = await storage.getRecentWellnessMetrics(userId, 30);
    
    // Get all active goals
    const activeGoals = await storage.getActiveWellnessGoals(userId);
    
    // Calculate average scores
    const averageScores = {
      stress_level: 0,
      rest_quality: 0,
      work_satisfaction: 0,
      balance_score: 0
    };
    
    if (recentMetrics.length > 0) {
      averageScores.stress_level = recentMetrics.reduce((sum: number, metric: WellnessMetric) => sum + metric.stress_level, 0) / recentMetrics.length;
      averageScores.rest_quality = recentMetrics.reduce((sum: number, metric: WellnessMetric) => sum + metric.rest_quality, 0) / recentMetrics.length;
      averageScores.work_satisfaction = recentMetrics.reduce((sum: number, metric: WellnessMetric) => sum + metric.work_satisfaction, 0) / recentMetrics.length;
      averageScores.balance_score = recentMetrics.reduce((sum: number, metric: WellnessMetric) => sum + metric.balance_score, 0) / recentMetrics.length;
    }
    
    // Calculate total work hours and overtime
    const totalHours = recentMetrics.reduce((sum: number, metric: WellnessMetric) => sum + parseFloat(metric.work_hours as string), 0);
    const totalOvertime = recentMetrics.reduce((sum: number, metric: WellnessMetric) => sum + parseFloat(metric.overtime_hours as string), 0);
    
    // Calculate goal progress
    const goalProgress = activeGoals.map((goal: WellnessGoal) => {
      let progress = 0;
      let currentValue = 0;
      
      switch (goal.goal_type) {
        case 'max_weekly_hours':
          currentValue = recentMetrics
            .filter((m: WellnessMetric) => new Date(m.date as string) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .reduce((sum: number, m: WellnessMetric) => sum + parseFloat(m.work_hours as string), 0);
          progress = Math.min(100, (1 - (currentValue / parseFloat(goal.target_value as string))) * 100);
          break;
        case 'min_rest_days':
          const restDays = new Set(
            recentMetrics
              .filter((m: WellnessMetric) => parseFloat(m.work_hours as string) === 0)
              .map((m: WellnessMetric) => m.date)
          ).size;
          progress = Math.min(100, (restDays / parseFloat(goal.target_value as string)) * 100);
          break;
        case 'min_avg_satisfaction':
          progress = Math.min(100, (averageScores.work_satisfaction / parseFloat(goal.target_value as string)) * 100);
          break;
        default:
          progress = 50; // Default for unknown goal types
      }
      
      return {
        ...goal,
        progress,
        currentValue
      };
    });
    
    // Identify trends
    const trends: { 
      improving: string[], 
      declining: string[], 
      steady: string[] 
    } = {
      improving: [],
      declining: [],
      steady: []
    };
    
    if (recentMetrics.length > 7) {
      const firstWeek = recentMetrics.slice(-14, -7);
      const secondWeek = recentMetrics.slice(-7);
      
      const firstWeekAvg = {
        stress_level: firstWeek.reduce((sum: number, m: WellnessMetric) => sum + m.stress_level, 0) / firstWeek.length,
        rest_quality: firstWeek.reduce((sum: number, m: WellnessMetric) => sum + m.rest_quality, 0) / firstWeek.length,
        work_satisfaction: firstWeek.reduce((sum: number, m: WellnessMetric) => sum + m.work_satisfaction, 0) / firstWeek.length,
        balance_score: firstWeek.reduce((sum: number, m: WellnessMetric) => sum + m.balance_score, 0) / firstWeek.length
      };
      
      const secondWeekAvg = {
        stress_level: secondWeek.reduce((sum: number, m: WellnessMetric) => sum + m.stress_level, 0) / secondWeek.length,
        rest_quality: secondWeek.reduce((sum: number, m: WellnessMetric) => sum + m.rest_quality, 0) / secondWeek.length,
        work_satisfaction: secondWeek.reduce((sum: number, m: WellnessMetric) => sum + m.work_satisfaction, 0) / secondWeek.length,
        balance_score: secondWeek.reduce((sum: number, m: WellnessMetric) => sum + m.balance_score, 0) / secondWeek.length
      };
      
      // Check stress level (lower is better)
      if (secondWeekAvg.stress_level < firstWeekAvg.stress_level - 0.5) {
        trends.improving.push('stress_level');
      } else if (secondWeekAvg.stress_level > firstWeekAvg.stress_level + 0.5) {
        trends.declining.push('stress_level');
      } else {
        trends.steady.push('stress_level');
      }
      
      // Check rest quality (higher is better)
      if (secondWeekAvg.rest_quality > firstWeekAvg.rest_quality + 0.5) {
        trends.improving.push('rest_quality');
      } else if (secondWeekAvg.rest_quality < firstWeekAvg.rest_quality - 0.5) {
        trends.declining.push('rest_quality');
      } else {
        trends.steady.push('rest_quality');
      }
      
      // Check work satisfaction (higher is better)
      if (secondWeekAvg.work_satisfaction > firstWeekAvg.work_satisfaction + 0.5) {
        trends.improving.push('work_satisfaction');
      } else if (secondWeekAvg.work_satisfaction < firstWeekAvg.work_satisfaction - 0.5) {
        trends.declining.push('work_satisfaction');
      } else {
        trends.steady.push('work_satisfaction');
      }
      
      // Check balance score (higher is better)
      if (secondWeekAvg.balance_score > firstWeekAvg.balance_score + 5) {
        trends.improving.push('balance_score');
      } else if (secondWeekAvg.balance_score < firstWeekAvg.balance_score - 5) {
        trends.declining.push('balance_score');
      } else {
        trends.steady.push('balance_score');
      }
    }
    
    // Prepare personalized recommendations based on metrics and trends
    const recommendations: string[] = [];
    
    if (trends.declining.includes('stress_level')) {
      recommendations.push("Your stress levels appear to be increasing. Consider taking breaks between shifts and practicing stress-reduction techniques.");
    }
    
    if (trends.declining.includes('rest_quality')) {
      recommendations.push("Your rest quality is declining. Try to maintain a consistent sleep schedule and avoid working late shifts consecutively.");
    }
    
    if (totalOvertime > 8) {
      recommendations.push("You've accumulated significant overtime this month. Consider discussing workload management with your supervisor.");
    }
    
    if (averageScores.balance_score < 50) {
      recommendations.push("Your work-life balance score is low. Consider scheduling dedicated personal time and setting boundaries between work and personal life.");
    }
    
    // Overall wellness summary
    const summary = {
      averageScores,
      totalHours,
      totalOvertime,
      goalProgress,
      trends,
      recommendations,
      recentEntries: recentMetrics.slice(-5)
    };
    
    res.status(200).json(summary);
  } catch (error) {
    console.error("Error generating wellness summary:", error);
    res.status(500).json({ message: "Failed to generate wellness summary" });
  }
};