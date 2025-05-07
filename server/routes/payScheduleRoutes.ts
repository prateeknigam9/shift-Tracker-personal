import express from 'express';
import { getPaySchedules, getPayScheduleById, createPaySchedule, updatePaySchedule, deletePaySchedule } from '../controllers/payScheduleController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all pay schedules
router.get('/', getPaySchedules);

// Get a single pay schedule by ID
router.get('/:id', getPayScheduleById);

// Create a new pay schedule
router.post('/', createPaySchedule);

// Update a pay schedule
router.patch('/:id', updatePaySchedule);

// Delete a pay schedule
router.delete('/:id', deletePaySchedule);

export default router;