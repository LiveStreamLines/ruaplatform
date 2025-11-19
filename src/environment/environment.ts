export const environment = {
  production: false,
  backend: 'http://10.100.72.10/backend',
  proxy: 'https://lsl-platform.com/proxy',
  hik: 'http://localhost:3000',
  msalConfig: {
    auth: {
      clientId: 'YOUR_AZURE_AD_CLIENT_ID', // Replace with your Client ID
      authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID', // Replace with your Tenant ID
      redirectUri: 'http://localhost:4200', // Update for production
      postLogoutRedirectUri: 'http://localhost:4200' // Update for production
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false
    }
  },
  protectedResourceMap: new Map([
    ['http://10.100.72.10/backend/api', ['api://YOUR_API_CLIENT_ID/access_as_user']]
  ])
};
