import { users, shifts, achievements, type User, type InsertUser, type Shift, type InsertShift, type Achievement, type InsertAchievement } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, lt, gt, gte, lte, between } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: number, fullName: string): Promise<User | undefined>;
  updateUserPassword(userId: number, newPassword: string): Promise<User | undefined>;
  
  // Shift methods
  getShifts(userId: number): Promise<Shift[]>;
  getShiftById(userId: number, shiftId: number): Promise<Shift | undefined>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(userId: number, shiftId: number, shiftData: Partial<InsertShift>): Promise<Shift | undefined>;
  deleteShift(userId: number, shiftId: number): Promise<boolean>;
  
  // Pay calculations
  getDailyPay(userId: number, date: string): Promise<{ total: number, hours: number }>;
  getWeeklyPay(userId: number, weekStart: string): Promise<{ total: number, hours: number, days: { date: string, pay: number, hours: number }[] }>;
  getMonthlyPay(userId: number, month: number, year: number): Promise<{ total: number, hours: number }>;
  
  // Dashboard data
  getWeeklyData(userId: number): Promise<{ days: { date: string, hours: number, pay: number }[] }>;
  getMonthlyData(userId: number): Promise<{ weeks: { weekStart: string, hours: number, pay: number }[] }>;
  getNextShift(userId: number): Promise<Shift | undefined>;
  
  // Achievements
  getUserAchievements(userId: number): Promise<Achievement[]>;
  addAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: (pool as any),
      createTableIfMissing: true,
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUserProfile(userId: number, fullName: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ full_name: fullName })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  // Shift methods
  async getShifts(userId: number): Promise<Shift[]> {
    return await db
      .select()
      .from(shifts)
      .where(eq(shifts.user_id, userId))
      .orderBy(desc(shifts.date), desc(shifts.start_time));
  }
  
  async getShiftById(userId: number, shiftId: number): Promise<Shift | undefined> {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.id, shiftId), eq(shifts.user_id, userId)));
    return shift;
  }
  
  async createShift(shiftData: InsertShift): Promise<Shift> {
    const [shift] = await db.insert(shifts).values(shiftData).returning();
    return shift;
  }
  
  async updateShift(userId: number, shiftId: number, shiftData: Partial<InsertShift>): Promise<Shift | undefined> {
    const [updatedShift] = await db
      .update(shifts)
      .set(shiftData)
      .where(and(eq(shifts.id, shiftId), eq(shifts.user_id, userId)))
      .returning();
    return updatedShift;
  }
  
  async deleteShift(userId: number, shiftId: number): Promise<boolean> {
    const result = await db
      .delete(shifts)
      .where(and(eq(shifts.id, shiftId), eq(shifts.user_id, userId)))
      .returning({ id: shifts.id });
    return result.length > 0;
  }
  
  // Pay calculations
  async getDailyPay(userId: number, date: string): Promise<{ total: number, hours: number }> {
    const dailyShifts = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.user_id, userId), eq(shifts.date, date)));
    
    let total = 0;
    let hours = 0;
    
    dailyShifts.forEach(shift => {
      total += Number(shift.total_pay);
      
      // Calculate hours
      const startTime = new Date(`1970-01-01T${shift.start_time}`);
      const endTime = new Date(`1970-01-01T${shift.end_time}`);
      let shiftHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      shiftHours -= Number(shift.break_time);
      
      hours += shiftHours;
    });
    
    return { total, hours };
  }
  
  async getWeeklyPay(userId: number, weekStart: string): Promise<{ total: number, hours: number, days: { date: string, pay: number, hours: number }[] }> {
    // Calculate week end (weekStart + 6 days)
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];
    
    const weeklyShifts = await db
      .select()
      .from(shifts)
      .where(and(
        eq(shifts.user_id, userId),
        gte(shifts.date, weekStart),
        lte(shifts.date, weekEnd)
      ))
      .orderBy(shifts.date);
    
    let total = 0;
    let hours = 0;
    const days: { date: string, pay: number, hours: number }[] = [];
    
    // Group by date
    const shiftsByDate = weeklyShifts.reduce((acc, shift) => {
      const date = shift.date.toString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(shift);
      return acc;
    }, {} as Record<string, Shift[]>);
    
    // Process each day
    Object.entries(shiftsByDate).forEach(([date, dayShifts]) => {
      let dayPay = 0;
      let dayHours = 0;
      
      dayShifts.forEach(shift => {
        dayPay += Number(shift.total_pay);
        
        // Calculate hours
        const startTime = new Date(`1970-01-01T${shift.start_time}`);
        const endTime = new Date(`1970-01-01T${shift.end_time}`);
        let shiftHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        shiftHours -= Number(shift.break_time);
        
        dayHours += shiftHours;
      });
      
      days.push({ date, pay: dayPay, hours: dayHours });
      total += dayPay;
      hours += dayHours;
    });
    
    return { total, hours, days };
  }
  
  async getMonthlyPay(userId: number, month: number, year: number): Promise<{ total: number, hours: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const monthlyShifts = await db
      .select()
      .from(shifts)
      .where(and(
        eq(shifts.user_id, userId),
        gte(shifts.date, startDate.toISOString().split('T')[0]),
        lte(shifts.date, endDate.toISOString().split('T')[0])
      ));
    
    let total = 0;
    let hours = 0;
    
    monthlyShifts.forEach(shift => {
      total += Number(shift.total_pay);
      
      // Calculate hours
      const startTime = new Date(`1970-01-01T${shift.start_time}`);
      const endTime = new Date(`1970-01-01T${shift.end_time}`);
      let shiftHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      shiftHours -= Number(shift.break_time);
      
      hours += shiftHours;
    });
    
    return { total, hours };
  }
  
  // Dashboard data
  async getWeeklyData(userId: number): Promise<{ days: { date: string, hours: number, pay: number }[] }> {
    // Get today's date
    const today = new Date();
    
    // Calculate the start of current week (Sunday)
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    currentWeekStart.setDate(today.getDate() - dayOfWeek);
    
    // Calculate the end of current week (Saturday)
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    
    const weeklyShifts = await db
      .select()
      .from(shifts)
      .where(and(
        eq(shifts.user_id, userId),
        gte(shifts.date, currentWeekStart.toISOString().split('T')[0]),
        lte(shifts.date, currentWeekEnd.toISOString().split('T')[0])
      ))
      .orderBy(shifts.date);
    
    // Initialize days array with all days of the week
    const days: { date: string, hours: number, pay: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        hours: 0,
        pay: 0
      });
    }
    
    // Group shifts by date
    const shiftsByDate = weeklyShifts.reduce((acc, shift) => {
      const date = shift.date.toString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(shift);
      return acc;
    }, {} as Record<string, Shift[]>);
    
    // Update days with actual data
    days.forEach(day => {
      const dayShifts = shiftsByDate[day.date];
      if (dayShifts) {
        dayShifts.forEach(shift => {
          day.pay += Number(shift.total_pay);
          
          // Calculate hours
          const startTime = new Date(`1970-01-01T${shift.start_time}`);
          const endTime = new Date(`1970-01-01T${shift.end_time}`);
          let shiftHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          shiftHours -= Number(shift.break_time);
          
          day.hours += shiftHours;
        });
      }
    });
    
    return { days };
  }
  
  async getMonthlyData(userId: number): Promise<{ weeks: { weekStart: string, hours: number, pay: number }[] }> {
    // Get today's date
    const today = new Date();
    
    // Calculate the start of current month
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Calculate the end of current month
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const monthlyShifts = await db
      .select()
      .from(shifts)
      .where(and(
        eq(shifts.user_id, userId),
        gte(shifts.date, currentMonthStart.toISOString().split('T')[0]),
        lte(shifts.date, currentMonthEnd.toISOString().split('T')[0])
      ))
      .orderBy(shifts.date);
    
    // Initialize weeks array
    const weeks: { weekStart: string, hours: number, pay: number }[] = [];
    
    // Find the first Sunday of the month or before
    const firstWeekStart = new Date(currentMonthStart);
    const dayOfWeek = firstWeekStart.getDay();
    firstWeekStart.setDate(firstWeekStart.getDate() - dayOfWeek);
    
    // Create weeks until end of month
    let weekStart = new Date(firstWeekStart);
    while (weekStart <= currentMonthEnd) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeks.push({
        weekStart: weekStart.toISOString().split('T')[0],
        hours: 0,
        pay: 0
      });
      
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
    }
    
    // Update weeks with actual data
    monthlyShifts.forEach(shift => {
      const shiftDate = new Date(shift.date.toString());
      
      // Find the corresponding week
      const weekIndex = weeks.findIndex(week => {
        const weekStartDate = new Date(week.weekStart);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        
        return shiftDate >= weekStartDate && shiftDate <= weekEndDate;
      });
      
      if (weekIndex !== -1) {
        weeks[weekIndex].pay += Number(shift.total_pay);
        
        // Calculate hours
        const startTime = new Date(`1970-01-01T${shift.start_time}`);
        const endTime = new Date(`1970-01-01T${shift.end_time}`);
        let shiftHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        shiftHours -= Number(shift.break_time);
        
        weeks[weekIndex].hours += shiftHours;
      }
    });
    
    return { weeks };
  }
  
  async getNextShift(userId: number): Promise<Shift | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [nextShift] = await db
      .select()
      .from(shifts)
      .where(and(
        eq(shifts.user_id, userId),
        gte(shifts.date, today.toISOString().split('T')[0])
      ))
      .orderBy(shifts.date, shifts.start_time)
      .limit(1);
    
    return nextShift;
  }
  
  // Achievements
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.user_id, userId))
      .orderBy(desc(achievements.unlocked_at));
  }
  
  async addAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(achievementData)
      .returning();
    
    return achievement;
  }
}

export const storage = new DatabaseStorage();
