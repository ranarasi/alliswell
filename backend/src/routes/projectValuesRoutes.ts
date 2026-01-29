import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllValues,
  getProjectValues,
  createProjectValue,
  deleteProjectValue,
} from '../controllers/projectValuesController';

const router = express.Router();

// Get all values across all projects (with optional date filtering)
router.get('/values', authenticate, getAllValues);

// Get all values for a project
router.get('/projects/:projectId/values', authenticate, getProjectValues);

// Create a new value entry
router.post('/projects/:projectId/values', authenticate, createProjectValue);

// Delete a value entry
router.delete('/projects/values/:id', authenticate, deleteProjectValue);

export default router;
