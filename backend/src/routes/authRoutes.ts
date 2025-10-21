import express from 'express';
import { login, me } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, me);

export default router;
