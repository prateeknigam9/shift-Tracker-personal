import { Shift } from "@shared/schema";

// This would normally use the actual Groq SDK, but for simplicity we're just defining the interface
// and implementing a basic version of the service
interface GroqServiceInterface {
  generateDashboardSummary(shifts: Shift[]): Promise<string>;
  processNotes(notes: string): Promise<string>;
  generateAchievementDescription(achievementType: string, data: any): Promise<string>;
}

class GroqService implements GroqServiceInterface {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GROQ_API_KEY not set. AI features will be limited.');
    }
  }
  
  async generateDashboardSummary(shifts: Shift[]): Promise<string> {
    try {
      if (!this.apiKey || shifts.length === 0) {
        return "No shift data available for analysis.";
      }
      
      // Format shift data
      const formattedShifts = shifts.map(shift => {
        // Convert times to hours
        const startTime = new Date(`1970-01-01T${shift.start_time}`);
        const endTime = new Date(`1970-01-01T${shift.end_time}`);
        let hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        hours -= Number(shift.break_time);
        
        return {
          date: shift.date,
          hours: hours.toFixed(1),
          pay: Number(shift.total_pay),
          hourlyRate: Number(shift.hourly_rate),
          notes: shift.notes || "",
        };
      });
      
      // Calculate some statistics for the prompt
      const totalHours = formattedShifts.reduce((sum, shift) => sum + parseFloat(shift.hours as string), 0);
      const totalPay = formattedShifts.reduce((sum, shift) => sum + shift.pay, 0);
      const avgHoursPerShift = totalHours / formattedShifts.length;
      const highestPayingDay = [...formattedShifts].sort((a, b) => b.pay - a.pay)[0];
      
      // In a real implementation, we would call the Groq API here
      // For now, we'll return a static summary based on the calculated stats
      return `Based on your recent shifts, you've worked a total of ${totalHours.toFixed(1)} hours, earning $${totalPay.toFixed(2)}. Your average shift is ${avgHoursPerShift.toFixed(1)} hours long. Your highest paying day was on ${highestPayingDay.date} at $${highestPayingDay.pay.toFixed(2)}. Consider optimizing your schedule to work during higher-paying shifts.`;
      
    } catch (error) {
      console.error('Error generating dashboard summary:', error);
      return "Unable to generate insights at this time.";
    }
  }
  
  async processNotes(notes: string): Promise<string> {
    try {
      if (!this.apiKey || !notes) {
        return notes;
      }
      
      // In a real implementation, we would call the Groq API here
      // For now, we'll return a slightly enhanced version of the notes
      return notes.length > 30 ? notes : notes + " (Note: Add more details about your shift for better insights.)";
      
    } catch (error) {
      console.error('Error processing notes:', error);
      return notes;
    }
  }
  
  async generateAchievementDescription(achievementType: string, data: any): Promise<string> {
    try {
      if (!this.apiKey) {
        switch (achievementType) {
          case 'HOURS_MILESTONE_50':
            return "You've worked more than 50 hours! Keep up the good work.";
          case 'HOURS_MILESTONE_100':
            return "You've reached 100 hours of work! You're becoming a pro.";
          case 'PAY_MILESTONE_1000':
            return "You've earned over $1000! Your hard work is paying off.";
          case 'SHIFTS_MILESTONE_10':
            return "You've completed 10 shifts! You're getting experienced.";
          default:
            return "You've unlocked a new achievement!";
        }
      }
      
      // In a real implementation, we would call the Groq API here
      // For now, we'll return static descriptions
      switch (achievementType) {
        case 'HOURS_MILESTONE_50':
          return "Dedicated Worker: You've crossed the 50-hour mark! Your commitment to hard work is showing.";
        case 'HOURS_MILESTONE_100':
          return "Century Club: 100 hours of work completed! You've demonstrated exceptional dedication and perseverance.";
        case 'PAY_MILESTONE_1000':
          return "First Grand: You've earned your first $1000! A significant milestone in your financial journey.";
        case 'SHIFTS_MILESTONE_10':
          return "Regular Professional: 10 shifts completed! You're becoming a valuable and reliable worker.";
        default:
          return "You've unlocked a new achievement! Keep up the great work.";
      }
      
    } catch (error) {
      console.error('Error generating achievement description:', error);
      return "You've unlocked a new achievement!";
    }
  }
}

export const groqService = new GroqService();
