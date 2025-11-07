import { Request, Response } from 'express';
import pool from '../database/db';
import { generateToken } from '../utils/jwt';
import * as microsoftAuth from '../services/microsoftAuth';

/**
 * Initiate Microsoft OAuth flow
 * Redirects user to Microsoft login page
 */
export const initiateLogin = async (req: Request, res: Response) => {
  try {
    // Check if Microsoft SSO is configured
    const isEnabled = !!(
      process.env.AZURE_AD_CLIENT_ID &&
      process.env.AZURE_AD_CLIENT_SECRET &&
      process.env.AZURE_AD_TENANT_ID
    );

    if (!isEnabled) {
      return res.status(503).json({
        message: 'Microsoft SSO is not configured. Please contact your administrator.'
      });
    }

    const authUrl = await microsoftAuth.getAuthUrl();
    res.json({ authUrl });
  } catch (error: any) {
    console.error('Microsoft auth initiation error:', error);
    res.status(500).json({
      message: error.message || 'Failed to initiate Microsoft authentication'
    });
  }
};

/**
 * Handle Microsoft OAuth callback
 * Exchanges code for token, fetches user profile, creates/updates user
 */
export const handleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    // Exchange code for access token
    const accessToken = await microsoftAuth.getTokenFromCode(code);

    // Fetch user profile from Microsoft Graph
    const microsoftUser = await microsoftAuth.getUserProfile(accessToken);

    // Fetch user photo (optional)
    const profilePicture = await microsoftAuth.getUserPhoto(accessToken);

    // Extract email (prefer mail, fallback to userPrincipalName)
    const email = microsoftUser.mail || microsoftUser.userPrincipalName;

    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);
    }

    // Check if user exists by Microsoft ID
    let result = await pool.query(
      'SELECT * FROM users WHERE microsoft_id = $1',
      [microsoftUser.id]
    );

    let user;

    if (result.rows.length > 0) {
      // User exists - update profile
      user = result.rows[0];

      await pool.query(
        `UPDATE users
         SET name = $1, email = $2, profile_picture = $3, last_login = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [microsoftUser.displayName, email, profilePicture, user.id]
      );

      // Fetch updated user
      result = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
      user = result.rows[0];
    } else {
      // Check if user exists by email (might be existing local account)
      result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length > 0) {
        // Link existing account to Microsoft
        user = result.rows[0];

        await pool.query(
          `UPDATE users
           SET microsoft_id = $1, auth_provider = 'microsoft',
               profile_picture = $2, last_login = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [microsoftUser.id, profilePicture, user.id]
        );

        // Fetch updated user
        result = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
        user = result.rows[0];
      } else {
        // Create new user
        // Default role: PDM (can be changed by admin later)
        const defaultRole = 'PDM';

        result = await pool.query(
          `INSERT INTO users (name, email, role, microsoft_id, auth_provider, profile_picture, is_active, created_at)
           VALUES ($1, $2, $3, $4, 'microsoft', $5, true, CURRENT_TIMESTAMP)
           RETURNING *`,
          [microsoftUser.displayName, email, defaultRole, microsoftUser.id, profilePicture]
        );

        user = result.rows[0];
      }
    }

    // Check if account is active
    if (!user.is_active) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_inactive`);
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Microsoft callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

/**
 * Get Microsoft SSO configuration status
 */
export const getConfig = (req: Request, res: Response) => {
  const isEnabled = !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  );

  res.json({
    enabled: isEnabled,
    provider: 'microsoft',
  });
};
