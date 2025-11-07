import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import axios from 'axios';

// Check if Microsoft SSO is configured
const isMicrosoftSsoConfigured = (): boolean => {
  return !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  );
};

// Lazy initialization of MSAL client
let pcaInstance: ConfidentialClientApplication | null = null;

const getMsalClient = (): ConfidentialClientApplication => {
  if (!isMicrosoftSsoConfigured()) {
    throw new Error('Microsoft SSO is not configured. Please set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_TENANT_ID in environment variables.');
  }

  if (!pcaInstance) {
    const msalConfig: Configuration = {
      auth: {
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      },
      system: {
        loggerOptions: {
          loggerCallback(loglevel, message, containsPii) {
            if (!containsPii) {
              console.log(message);
            }
          },
          piiLoggingEnabled: false,
          logLevel: 3, // Error level
        },
      },
    };

    pcaInstance = new ConfidentialClientApplication(msalConfig);
  }

  return pcaInstance;
};

// Microsoft Graph API endpoints
const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

interface MicrosoftUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  officeLocation?: string;
}

/**
 * Generate authorization URL for Microsoft login
 */
export const getAuthUrl = async (): Promise<string> => {
  const pca = getMsalClient();
  const redirectUri = process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3001/api/auth/microsoft/callback';

  const authCodeUrlParameters = {
    scopes: ['user.read', 'email', 'profile', 'openid'],
    redirectUri,
  };

  try {
    const response = await pca.getAuthCodeUrl(authCodeUrlParameters);
    return response;
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw error;
  }
};

/**
 * Exchange authorization code for access token
 */
export const getTokenFromCode = async (code: string): Promise<string> => {
  const pca = getMsalClient();
  const redirectUri = process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3001/api/auth/microsoft/callback';

  const tokenRequest = {
    code,
    scopes: ['user.read', 'email', 'profile', 'openid'],
    redirectUri,
  };

  try {
    const response = await pca.acquireTokenByCode(tokenRequest);

    if (!response || !response.accessToken) {
      throw new Error('No access token received');
    }

    return response.accessToken;
  } catch (error) {
    console.error('Error acquiring token:', error);
    throw error;
  }
};

/**
 * Get user profile from Microsoft Graph API
 */
export const getUserProfile = async (accessToken: string): Promise<MicrosoftUser> => {
  try {
    const response = await axios.get(GRAPH_ME_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Get user profile picture from Microsoft Graph API
 */
export const getUserPhoto = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await axios.get(GRAPH_PHOTO_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: 'arraybuffer',
    });

    // Convert image to base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';

    return `data:${mimeType};base64,${base64Image}`;
  } catch (error: any) {
    // User might not have a profile picture - this is not an error
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching user photo:', error);
    return null;
  }
};

/**
 * Validate Microsoft access token
 */
export const validateToken = async (accessToken: string): Promise<boolean> => {
  try {
    await axios.get(GRAPH_ME_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  getAuthUrl,
  getTokenFromCode,
  getUserProfile,
  getUserPhoto,
  validateToken,
};
