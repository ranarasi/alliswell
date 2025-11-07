import express from 'express';
import {
  getBusinessUnitHeads,
  getBusinessUnitHeadById,
  createBusinessUnitHead,
  updateBusinessUnitHead,
  deleteBusinessUnitHead,
} from '../controllers/businessUnitHeadsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all active Business Unit Heads
router.get('/', getBusinessUnitHeads);

// Get a single Business Unit Head by ID
router.get('/:id', getBusinessUnitHeadById);

// Create a new Business Unit Head (Admin only)
router.post('/', createBusinessUnitHead);

// Update a Business Unit Head (Admin only)
router.put('/:id', updateBusinessUnitHead);

// Delete (deactivate) a Business Unit Head (Admin only)
router.delete('/:id', deleteBusinessUnitHead);

export default router;
