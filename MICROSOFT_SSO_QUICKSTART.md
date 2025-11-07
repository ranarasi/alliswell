# Microsoft SSO Quick Start Guide

This is a condensed guide to get Microsoft Single Sign-On working quickly. For detailed information, see `MICROSOFT_SSO_SETUP.md`.

## ✅ What's Already Done

The code is already integrated! You just need to:
1. Set up Azure AD App Registration
2. Add credentials to `.env` file
3. Restart the app

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Azure AD App Registration

1. Go to **https://portal.azure.com**
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **+ New registration**
4. Fill in:
   - **Name**: `AllIsWell Project Tracker`
   - **Supported account types**: Single tenant (your organization only)
   - **Redirect URI**:
     - Type: `Web`
     - URL: `http://localhost:3001/api/auth/microsoft/callback`
5. Click **Register**

### Step 2: Get Application Credentials

After registration, you'll see the Overview page:

**Copy these 3 values:**
- ✏️ **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- ✏️ **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 3: Create Client Secret

1. Click **Certificates & secrets** (left menu)
2. Click **+ New client secret**
3. Description: `AllIsWell Backend`
4. Expires: 6 months or 1 year
5. Click **Add**
6. ✏️ **IMMEDIATELY COPY THE SECRET VALUE** (shown once only!)

### Step 4: Add API Permissions

1. Click **API permissions** (left menu)
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - ✅ `User.Read`
   - ✅ `email`
   - ✅ `profile`
   - ✅ `openid`
6. Click **Add permissions**
7. *(Optional)* Click **Grant admin consent** if you're an admin

### Step 5: Update Backend Environment Variables

Open `/Users/ramesh/Documents/projects/alliswell/backend/.env`:

```env
# Uncomment and fill in these values:
AZURE_AD_CLIENT_ID=paste-your-client-id-here
AZURE_AD_CLIENT_SECRET=paste-your-secret-value-here
AZURE_AD_TENANT_ID=paste-your-tenant-id-here
AZURE_AD_REDIRECT_URI=http://localhost:3001/api/auth/microsoft/callback
```

### Step 6: Restart the Application

```bash
cd /Users/ramesh/Documents/projects/alliswell
./restart.sh
```

### Step 7: Test It!

1. Open **http://localhost:3000/login**
2. You should now see a **"Sign in with Microsoft"** button
3. Click it and sign in with your Microsoft work account
4. You'll be redirected back and logged in automatically!

---

## 🎯 How It Works

### User Flow

1. User clicks "Sign in with Microsoft"
2. Redirected to Microsoft login page
3. Signs in with work/school account
4. Grants permissions to AllIsWell
5. Redirected back to AllIsWell, automatically logged in
6. User profile created/updated from Microsoft data

### What Data Is Retrieved

From Microsoft Graph API:
- **Name**: Display name from Microsoft profile
- **Email**: Work/school email address
- **Profile Picture**: User's Microsoft profile photo (if available)
- **Microsoft ID**: Unique identifier to link accounts

### Account Linking

- **New users**: Automatically created with role "PDM" (can be changed by admin)
- **Existing users**: If email matches, Microsoft account is linked
- **Duplicate logins**: Users can use either password OR Microsoft SSO

---

## 🔒 Security Features

✅ **OAuth 2.0 Authorization Code Flow** (most secure)
✅ **HTTPS enforced** for production
✅ **Token validation** via Microsoft Graph API
✅ **No password stored** for SSO users
✅ **Role-based access control** maintained
✅ **Automatic account linking** for existing users

---

## 🐛 Troubleshooting

### Microsoft button not showing?

**Check if SSO is enabled:**
```bash
curl http://localhost:3001/api/auth/microsoft/config
```

Should return: `{"enabled":true,"provider":"microsoft"}`

If `enabled: false`, verify:
- All 3 Azure variables are set in `.env`
- Backend server was restarted after adding variables
- No syntax errors in `.env` file

### Error: "Reply URL does not match"

**Solution**: Verify redirect URI in Azure AD exactly matches:
```
http://localhost:3001/api/auth/microsoft/callback
```

### Error: "Application not found"

**Solution**: Check that tenant ID and client ID are correct

### Users can't sign in

**Check:**
1. Is the user's account active in Azure AD?
2. Does the app have the required API permissions?
3. Has admin consent been granted?

---

## 📊 Database Changes Made

The following columns were added to the `users` table:

```sql
microsoft_id       VARCHAR(255)  -- Unique MS identifier
auth_provider      VARCHAR(50)   -- 'local' or 'microsoft'
profile_picture    VARCHAR(500)  -- Profile photo URL
```

The `password` column is now optional (NULL allowed) for SSO users.

---

## 🌐 Production Deployment

When deploying to production:

### 1. Update Azure AD Redirect URI

Add production URL in Azure Portal:
```
https://your-domain.com/api/auth/microsoft/callback
```

### 2. Update Production Environment

```env
AZURE_AD_REDIRECT_URI=https://your-domain.com/api/auth/microsoft/callback
FRONTEND_URL=https://your-domain.com
```

### 3. Use HTTPS

Microsoft requires HTTPS for production OAuth flows (except localhost).

---

## 🎓 Next Steps

After SSO is working:

1. **Test with multiple users** - Have team members try logging in
2. **Assign roles** - Admin can change user roles after first login
3. **Restrict access** - In Azure AD, limit which users can access the app
4. **Monitor sign-ins** - Use Azure AD logs to track authentication

---

## 📚 Additional Resources

- **Detailed Setup Guide**: `MICROSOFT_SSO_SETUP.md`
- **Azure AD Documentation**: https://docs.microsoft.com/azure/active-directory/
- **Microsoft Graph API**: https://docs.microsoft.com/graph/

---

## ✉️ Support

If you encounter issues:
1. Check backend logs: `tail -f logs/backend.log`
2. Check browser console for frontend errors
3. Verify Azure AD configuration
4. Review detailed setup guide: `MICROSOFT_SSO_SETUP.md`

---

**Last Updated**: 2024-10-30
**Version**: 1.0
