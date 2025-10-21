import express from 'express';
import {
  getStatuses,
  getLatestStatuses,
  getStatus,
  createStatus,
  updateStatus,
  deleteStatus,
  getPreviousStatus,
} from '../controllers/statusController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getStatuses);
router.get('/latest', authenticate, getLatestStatuses);
router.get('/previous/:projectId', authenticate, getPreviousStatus);
router.get('/:id', authenticate, getStatus);
router.post('/', authenticate, createStatus);
router.put('/:id', authenticate, updateStatus);
router.delete('/:id', authenticate, deleteStatus);

export default router;
