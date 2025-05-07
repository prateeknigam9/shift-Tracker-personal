import express from 'express';
import { 
  getTables,
  getTableData,
  updateRecord,
  deleteRecord,
  executeQuery,
  runMigration
} from '../controllers/adminController';
import { isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Apply admin middleware to all routes
router.use(isAdmin);

// Database management routes
router.get('/tables', getTables);
router.get('/tables/:tableName', getTableData);
router.put('/tables/:tableName/:id', updateRecord);
router.delete('/tables/:tableName/:id', deleteRecord);
router.post('/execute', executeQuery);
router.post('/migrate', runMigration);

export default router;