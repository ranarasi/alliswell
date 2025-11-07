import { Router } from 'express';
import * as microsoftAuthController from '../controllers/microsoftAuthController';

const router = Router();

/**
 * @route   GET /api/auth/microsoft
 * @desc    Initiate Microsoft OAuth login
 * @access  Public
 */
router.get('/microsoft', microsoftAuthController.initiateLogin);

/**
 * @route   GET /api/auth/microsoft/callback
 * @desc    Handle Microsoft OAuth callback
 * @access  Public
 */
router.get('/microsoft/callback', microsoftAuthController.handleCallback);

/**
 * @route   GET /api/auth/microsoft/config
 * @desc    Get Microsoft SSO configuration status
 * @access  Public
 */
router.get('/microsoft/config', microsoftAuthController.getConfig);

export default router;
