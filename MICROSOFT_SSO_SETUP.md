# Microsoft SSO Setup Guide for AllIsWell

This guide will walk you through setting up Microsoft Single Sign-On (SSO) using Azure Active Directory for the AllIsWell application.

## Overview

Users will be able to:
- Sign in with their Microsoft work/school accounts (Outlook, Office 365)
- Use existing email/password authentication (hybrid approach)
- Automatic user profile synchronization from Microsoft

## Prerequisites

- Azure Active Directory (Azure AD) tenant
- Admin access to Azure portal
- Microsoft work/school account

---

## Part 1: Azure AD App Registration

### Step 1: Create App Registration

1. **Go to Azure Portal**
   - Navigate to https://portal.azure.com
   - Sign in with your admin account

2. **Open Azure Active Directory**
   - Search for "Azure Active Directory" in the search bar
   - Click on "Azure Active Directory"

3. **Create New App Registration**
   - Click "App registrations" in the left menu
   - Click "+ New registration"
   - Fill in the details:
     - **Name**: `AllIsWell Project Tracker`
     - **Supported account types**:
       - Select "Accounts in this organizational directory only" (single tenant)
       - OR "Accounts in any organizational directory" (multi-tenant) if needed
     - **Redirect URI**:
       - Platform: `Web`
       - URL: `http://localhost:3001/api/auth/microsoft/callback` (for development)
   - Click "Register"

4. **Save Important Information**

   After registration, you'll see the "Overview" page. Copy these values:

   - **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 2: Create Client Secret

1. **Navigate to Certificates & secrets**
   - In your app registration, click "Certificates & secrets" in the left menu

2. **Create New Client Secret**
   - Click "+ New client secret"
   - Description: `AllIsWell Backend Secret`
   - Expires: Choose duration (recommended: 6 months or 1 year)
   - Click "Add"

3. **Copy the Secret Value**
   - **IMPORTANT**: Copy the **Value** immediately (not the Secret ID)
   - This will only be shown once!
   - Store it securely

### Step 3: Configure API Permissions

1. **Navigate to API permissions**
   - Click "API permissions" in the left menu

2. **Add Required Permissions**
   - Click "+ Add a permission"
   - Select "Microsoft Graph"
   - Select "Delegated permissions"
   - Add these permissions:
     - `User.Read` (Read user profile)
     - `email` (Read user email)
     - `profile` (Read user basic profile)
     - `openid` (Sign in and read user profile)
   - Click "Add permissions"

3. **Grant Admin Consent** (if required)
   - Click "Grant admin consent for [Your Organization]"
   - Confirm by clicking "Yes"

### Step 4: Add Redirect URIs

1. **Navigate to Authentication**
   - Click "Authentication" in the left menu

2. **Add Redirect URIs**
   - Under "Web" platform, add:
     - Development: `http://localhost:3001/api/auth/microsoft/callback`
     - Production: `https://your-domain.com/api/auth/microsoft/callback`

3. **Configure Implicit Grant** (optional, for SPA)
   - Under "Implicit grant and hybrid flows"
   - Check "ID tokens" if needed

4. **Save changes**

---

## Part 2: Backend Configuration

### Step 1: Install Dependencies

```bash
cd backend
npm install @azure/msal-node axios
```

### Step 2: Update Environment Variables

Create or update `backend/.env`:

```env
# Existing variables
PORT=3001
DATABASE_URL=postgresql://localhost:5432/alliswell
JWT_SECRET=your-jwt-secret-key

# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID=your-application-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret-value
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_REDIRECT_URI=http://localhost:3001/api/auth/microsoft/callback

# Frontend URL for redirect after auth
FRONTEND_URL=http://localhost:3000
```

### Step 3: Update Database Schema

Run this SQL to add SSO support:

```sql
-- Add columns for Microsoft SSO
ALTER TABLE users
ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Make password optional for SSO users
ALTER TABLE users
ALTER COLUMN password DROP NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_microsoft_id ON users(microsoft_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
```

---

## Part 3: Frontend Configuration

### Step 1: Update Environment Variables

Create or update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MICROSOFT_SSO_ENABLED=true
```

---

## Part 4: Testing

### Test SSO Flow

1. **Start the application**
   ```bash
   ./start.sh
   ```

2. **Navigate to login page**
   - Open http://localhost:3000/login

3. **Click "Sign in with Microsoft"**
   - You'll be redirected to Microsoft login
   - Sign in with your work/school account
   - Grant permissions when prompted
   - You'll be redirected back to AllIsWell

4. **Verify user creation**
   - Check the dashboard
   - User should be created automatically from Microsoft profile

---

## Part 5: Production Deployment

### Update Redirect URIs

1. **Go back to Azure Portal**
   - Open your App Registration
   - Click "Authentication"

2. **Add Production URLs**
   - Add: `https://your-production-domain.com/api/auth/microsoft/callback`

3. **Update Environment Variables**
   - Update `.env` in production with:
     - `AZURE_AD_REDIRECT_URI=https://your-production-domain.com/api/auth/microsoft/callback`
     - `FRONTEND_URL=https://your-production-domain.com`

---

## Security Best Practices

1. **Client Secret Rotation**
   - Rotate client secrets every 6-12 months
   - Update environment variables when rotating

2. **Restrict App Access**
   - In Azure AD, you can restrict which users/groups can access the app
   - Go to "Enterprise applications" > Your app > "Properties"
   - Set "User assignment required?" to "Yes"
   - Add specific users/groups in "Users and groups"

3. **Monitor Sign-ins**
   - Use Azure AD sign-in logs to monitor authentication attempts
   - Set up alerts for suspicious activity

---

## Troubleshooting

### Error: "AADSTS50011: The reply URL specified in the request does not match"
- **Solution**: Verify redirect URI in Azure AD matches exactly with your backend URL

### Error: "AADSTS700016: Application not found in the directory"
- **Solution**: Verify tenant ID and client ID are correct

### Error: "Invalid client secret"
- **Solution**: Generate a new client secret and update environment variables

### Users can't see the Microsoft login button
- **Solution**: Verify `NEXT_PUBLIC_MICROSOFT_SSO_ENABLED=true` in frontend `.env.local`

---

## Next Steps After Setup

1. ✅ Configure Azure AD App Registration
2. ✅ Add environment variables
3. ✅ Update database schema
4. ✅ Install dependencies
5. ✅ Test SSO flow
6. ✅ Deploy to production

---

## Support

For issues with:
- **Azure AD setup**: Contact your Azure administrator
- **Application issues**: Check application logs or contact development team

---

**Last Updated**: 2024
**Version**: 1.0
