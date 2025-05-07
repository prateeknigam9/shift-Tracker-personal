import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertPayScheduleSchema, updatePayScheduleSchema } from '@shared/schema';

// Get all pay schedules for a user
export const getPaySchedules = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const schedules = await storage.getPaySchedules(userId);
    res.json(schedules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get a specific pay schedule
export const getPayScheduleById = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id, 10);
    
    if (isNaN(scheduleId)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }
    
    const schedule = await storage.getPayScheduleById(userId, scheduleId);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Pay schedule not found' });
    }
    
    res.json(schedule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new pay schedule
export const createPaySchedule = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const scheduleData = insertPayScheduleSchema.parse({
      ...req.body,
      user_id: userId
    });
    
    const newSchedule = await storage.createPaySchedule(scheduleData);
    res.status(201).json(newSchedule);
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update an existing pay schedule
export const updatePaySchedule = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id, 10);
    
    if (isNaN(scheduleId)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }
    
    const existingSchedule = await storage.getPayScheduleById(userId, scheduleId);
    
    if (!existingSchedule) {
      return res.status(404).json({ error: 'Pay schedule not found' });
    }
    
    const updateData = updatePayScheduleSchema.parse(req.body);
    const updatedSchedule = await storage.updatePaySchedule(userId, scheduleId, updateData);
    
    res.json(updatedSchedule);
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete a pay schedule
export const deletePaySchedule = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id, 10);
    
    if (isNaN(scheduleId)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }
    
    const success = await storage.deletePaySchedule(userId, scheduleId);
    
    if (!success) {
      return res.status(404).json({ error: 'Pay schedule not found' });
    }
    
    res.status(200).json({ message: 'Pay schedule deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};