import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProjectOperations,
  getOperationsByMonth,
  upsertOperations,
  deleteOperations,
} from '../controllers/operationsController';

const router = express.Router();

// Get all operations for a project
router.get('/projects/:projectId/operations', authenticate, getProjectOperations);

// Get specific month's operations data
router.get('/projects/:projectId/operations/:month/:year', authenticate, getOperationsByMonth);

// Create or update operations data
router.post('/projects/:projectId/operations', authenticate, upsertOperations);

// Delete operations data
router.delete('/projects/:projectId/operations/:id', authenticate, deleteOperations);

export default router;
