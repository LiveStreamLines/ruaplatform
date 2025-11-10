# Deployment Guide for AHC Watch Platform

## Files Ready for Deployment

### Frontend Files (Built)
Location: `dist/lslplatform/browser/`
- All Angular application files are built and ready
- Main files: `index.html`, `main-*.js`, `styles-*.css`
- Assets: All images, videos, and static files included

### Backend Files
Location: `backend/`
- Node.js Express server
- All controllers, routes, and data files
- Package.json with dependencies

## Deployment Steps

### 1. Upload Frontend Files
Upload all files from `dist/lslplatform/browser/` to your web server's document root:
- Target: `https://ahcwatch.awjholding.com/`
- Files: All contents of `dist/lslplatform/browser/`

### 2. Upload Backend Files
Upload the entire `backend/` folder to your server:
- Target: `https://ahcwatch.awjholding.com/backend/`
- Files: All contents of `backend/` folder

### 3. Install Backend Dependencies
On your server, navigate to the backend folder and run:
```bash
cd /path/to/backend
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the backend folder with:
```env
# Twilio Configuration (Required for OTP functionality)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_SERVICE_SID=your_twilio_service_sid_here

# Media Path Configuration
MEDIA_PATH=/path/to/media/directory

# Add other environment variables as needed
```

### 5. Start Backend Server
```bash
cd /path/to/backend
node server.js
```

### 6. Configure Web Server
Ensure your web server (Apache/Nginx) is configured to:
- Serve the frontend files from the document root
- Proxy API requests to the backend server
- Handle Angular routing (serve index.html for all routes)

## Microsoft Login Configuration (After Deployment)

### 1. Azure AD App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `AHC Watch Platform`
   - **Supported account types**: Choose based on your organization needs
   - **Redirect URI**: 
     - Type: `Single-page application (SPA)`
     - URI: `https://ahcwatch.awjholding.com`

### 2. Configure Authentication
1. In your app registration, go to **Authentication**
2. Under **Single-page application**, add:
   - `https://ahcwatch.awjholding.com`
3. Under **Implicit grant and hybrid flows**, check:
   - ✅ Access tokens
   - ✅ ID tokens

### 3. Update Environment Configuration
After getting your Azure AD details, update `src/environment/environments.ts`:
```typescript
msalConfig: {
  auth: {
    clientId: 'YOUR_AZURE_AD_CLIENT_ID', // Replace with your Client ID
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID', // Replace with your Tenant ID
    redirectUri: 'https://ahcwatch.awjholding.com'
  }
}
```

### 4. Enable Microsoft Login
After deployment and Azure AD setup:
1. Uncomment all Microsoft login code in the source files
2. Rebuild the application
3. Upload the updated files

## Testing Checklist

- [ ] Frontend loads correctly at `https://ahcwatch.awjholding.com`
- [ ] Backend API responds at `https://ahcwatch.awjholding.com/backend`
- [ ] Login page displays with Microsoft login tab
- [ ] Legacy email/password login works
- [ ] After Azure AD setup: Microsoft login works
- [ ] After Microsoft login: Redirects to developers page
- [ ] All existing functionality works as before

## Current Status

✅ **Frontend Built**: Ready for upload
✅ **Backend Ready**: Ready for upload  
⏳ **Microsoft Login**: Temporarily disabled for deployment
⏳ **Azure AD Setup**: Pending after deployment
⏳ **Testing**: Pending after upload

## Next Steps

1. Upload files to server using your preferred method
2. Configure backend environment variables
3. Start backend server
4. Test basic functionality
5. Set up Azure AD app registration
6. Enable Microsoft login
7. Test complete Microsoft login flow
