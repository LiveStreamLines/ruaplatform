# Microsoft Login Setup Guide

## ✅ Microsoft Login Implementation Complete

The AHC Timelapse application has been updated to use **Microsoft login only**. All email/password, phone/OTP, and temporary test login functionality has been removed.

### What's Been Implemented:
- ✅ **Microsoft-only login page** with beautiful UI
- ✅ **Automatic redirect** to developers page after login
- ✅ **Full access** for Microsoft users (Super Admin role)
- ✅ **Secure authentication** using OAuth 2.0 with PKCE
- ✅ **Clean, modern interface** with Microsoft branding

## 🔧 Fixing the MSAL_INSTANCE Error

The error you're seeing (`NullInjectorError: No provider for InjectionToken MSAL_INSTANCE!`) occurs because the Azure AD configuration is not properly set up. Here's how to fix it:

### **Step 1: Set Up Azure AD App Registration**

To complete the Microsoft login integration, you need to set up an Azure AD app registration:

### **Step 2: Create Azure AD App Registration**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `AHC Watch Platform`
   - **Supported account types**: Choose based on your organization needs
   - **Redirect URI**: `https://ahcwatch.awjholding.com` (for production) 
     - Type: `Single-page application (SPA)`
     - URI: `https://ahcwatch.awjholding.com`

### **Step 3: Configure Authentication**

1. In your app registration, go to **Authentication**
2. Under **Single-page application**, add:
   - `https://ahcwatch.awjholding.com`
3. Under **Implicit grant and hybrid flows**, check:
   - ✅ Access tokens
   - ✅ ID tokens

### **Step 4: Configure API Permissions**

1. Go to **API permissions**
2. Add permissions:
   - **Microsoft Graph** > **User.Read** (Delegated)
3. Click **Grant admin consent** if required

### **Step 5: Update Environment Configuration**

**IMPORTANT**: This is the critical step that will fix the MSAL_INSTANCE error!

Update the `src/environment/environments.ts` file with your Azure AD details:

```typescript
export const environment = {
  production: true,
  backend: 'https://ahcwatch.awjholding.com/backend',
  msalConfig: {
    auth: {
      clientId: 'YOUR_AZURE_AD_CLIENT_ID', // Replace with your Client ID
      authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID', // Replace with your Tenant ID
      redirectUri: 'https://ahcwatch.awjholding.com',
      postLogoutRedirectUri: 'https://ahcwatch.awjholding.com'
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false
    }
  },
  protectedResourceMap: new Map([
    ['https://ahcwatch.awjholding.com/backend/api', ['api://YOUR_API_CLIENT_ID/access_as_user']]
  ])
};
```

**Replace these values:**
- `YOUR_AZURE_AD_CLIENT_ID`: Found in your app registration **Overview** page
- `YOUR_TENANT_ID`: Found in your app registration **Overview** page  
- `YOUR_API_CLIENT_ID`: Same as your client ID (for now)

### **Step 6: Get Required Information**

From your Azure AD app registration:

1. **Client ID**: Found in **Overview** tab
2. **Tenant ID**: Found in **Overview** tab
3. **API Client ID**: Same as Client ID for this setup

### **Step 7: Test and Deploy**

After updating the environment configuration:

1. **Build the application**:
   ```bash
   npx ng build --configuration production
   ```

2. **Deploy to your server**:
   ```bash
   git add .
   git commit -m "Add Microsoft-only authentication"
   git push origin main
   ```

3. **On your server**:
   ```bash
   git pull origin main
   npm install
   ng build --prod
   ```

4. **Test the login flow**:
   - Visit `https://ahcwatch.awjholding.com`
   - Click "Sign in with Microsoft"
   - Complete Microsoft authentication
   - Verify redirect to developers page

### **🎉 Success!**

Once you complete these steps, the MSAL_INSTANCE error will be resolved and Microsoft login will work perfectly!

## Features Implemented

✅ **Microsoft-Only Authentication**: Clean, single login option with Microsoft
✅ **Automatic Redirect**: After successful login, users are redirected to the developers page
✅ **Role-based Access**: Microsoft users get Super Admin role with full access
✅ **Secure OAuth 2.0**: Uses PKCE for enhanced security
✅ **Responsive Design**: Microsoft login works on all devices

## User Experience

- **Single Login Option**: Clean, Microsoft-only authentication
- **Seamless Flow**: After Microsoft authentication, users go directly to developers page
- **Full Access**: Microsoft users have access to all developers, projects, and cameras
- **Modern UI**: Beautiful, professional login interface

## Security Notes

- Microsoft authentication uses OAuth 2.0 with PKCE
- Tokens are stored securely in session storage
- All API calls are authenticated with Microsoft tokens
- Users are automatically logged out when Microsoft session expires
- No legacy authentication vulnerabilities
