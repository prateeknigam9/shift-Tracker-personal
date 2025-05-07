import { Request, Response } from "express";
import { storage } from "../storage";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertShiftSchema } from "@shared/schema";

export const getShifts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const shifts = await storage.getShifts(req.user.id);
    res.status(200).json(shifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    res.status(500).json({ message: "Failed to fetch shifts" });
  }
};

export const getShiftById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const shiftId = parseInt(req.params.id);
    if (isNaN(shiftId)) {
      return res.status(400).json({ message: "Invalid shift ID" });
    }
    
    const shift = await storage.getShiftById(req.user.id, shiftId);
    
    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }
    
    res.status(200).json(shift);
  } catch (error) {
    console.error("Error fetching shift:", error);
    res.status(500).json({ message: "Failed to fetch shift" });
  }
};

export const createShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Prepare shift data - ensure numeric fields are properly formatted as strings
    const formattedData = {
      ...req.body,
      user_id: req.user.id,
      // Convert numeric values to strings if they aren't already
      break_time: typeof req.body.break_time === 'number' ? String(req.body.break_time) : req.body.break_time,
      hourly_rate: typeof req.body.hourly_rate === 'number' ? String(req.body.hourly_rate) : req.body.hourly_rate,
      total_pay: typeof req.body.total_pay === 'number' ? String(req.body.total_pay) : req.body.total_pay
    };
    
    // Validate shift data
    const shiftData = insertShiftSchema.parse(formattedData);
    
    // Calculate total pay if not provided
    if (!shiftData.total_pay) {
      // Parse times
      const startTime = new Date(`1970-01-01T${shiftData.start_time}`);
      const endTime = new Date(`1970-01-01T${shiftData.end_time}`);
      
      // Calculate hours worked
      let hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Subtract break time
      hoursWorked -= Number(shiftData.break_time);
      
      // Calculate total pay and convert to string (for numeric db field)
      shiftData.total_pay = String(hoursWorked * Number(shiftData.hourly_rate));
    }
    
    const shift = await storage.createShift(shiftData);
    res.status(201).json(shift);
  } catch (error) {
    console.error("Error creating shift:", error);
    
    if (error instanceof ZodError) {
      // Format validation errors
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    
    res.status(500).json({ message: "Failed to create shift" });
  }
};

export const updateShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const shiftId = parseInt(req.params.id);
    if (isNaN(shiftId)) {
      return res.status(400).json({ message: "Invalid shift ID" });
    }
    
    // Check if shift exists and belongs to user
    const existingShift = await storage.getShiftById(req.user.id, shiftId);
    if (!existingShift) {
      return res.status(404).json({ message: "Shift not found" });
    }
    
    // Prepare and format updated data
    const updateData = { ...req.body };
    
    // Convert numeric values to strings
    if (typeof updateData.break_time === 'number') {
      updateData.break_time = String(updateData.break_time);
    }
    
    if (typeof updateData.hourly_rate === 'number') {
      updateData.hourly_rate = String(updateData.hourly_rate);
    }
    
    if (typeof updateData.total_pay === 'number') {
      updateData.total_pay = String(updateData.total_pay);
    }
    
    // Calculate total pay if times or rates are updated
    if (updateData.start_time || updateData.end_time || 
        updateData.break_time || updateData.hourly_rate) {
      
      // Use updated values or fall back to existing values
      const startTime = new Date(`1970-01-01T${updateData.start_time || existingShift.start_time}`);
      const endTime = new Date(`1970-01-01T${updateData.end_time || existingShift.end_time}`);
      const breakTime = Number(updateData.break_time !== undefined ? updateData.break_time : existingShift.break_time);
      const hourlyRate = Number(updateData.hourly_rate !== undefined ? updateData.hourly_rate : existingShift.hourly_rate);
      
      // Calculate hours worked
      let hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Subtract break time
      hoursWorked -= breakTime;
      
      // Calculate total pay and convert to string (for numeric db field)
      updateData.total_pay = String(hoursWorked * hourlyRate);
    }
    
    const updatedShift = await storage.updateShift(req.user.id, shiftId, updateData);
    
    if (!updatedShift) {
      return res.status(404).json({ message: "Failed to update shift" });
    }
    
    res.status(200).json(updatedShift);
  } catch (error) {
    console.error("Error updating shift:", error);
    
    if (error instanceof ZodError) {
      // Format validation errors
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    
    res.status(500).json({ message: "Failed to update shift" });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const shiftId = parseInt(req.params.id);
    if (isNaN(shiftId)) {
      return res.status(400).json({ message: "Invalid shift ID" });
    }
    
    const success = await storage.deleteShift(req.user.id, shiftId);
    
    if (!success) {
      return res.status(404).json({ message: "Shift not found" });
    }
    
    res.status(200).json({ message: "Shift deleted successfully" });
  } catch (error) {
    console.error("Error deleting shift:", error);
    res.status(500).json({ message: "Failed to delete shift" });
  }
};
