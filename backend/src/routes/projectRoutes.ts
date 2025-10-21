import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProject);
router.post('/', authenticate, authorize('Admin'), createProject);
router.put('/:id', authenticate, authorize('Admin'), updateProject);
router.delete('/:id', authenticate, authorize('Admin'), deleteProject);

export default router;
