export const environment = {
  production: false,
  backend: 'http://10.100.72.10/backend',
  proxy: 'http://10.100.72.10/proxy/',
  hik: 'https://10.100.72.10/backend',
  msalConfig: {
    auth: {
      clientId: 'YOUR_AZURE_AD_CLIENT_ID', // Replace with your Client ID
      authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID', // Replace with your Tenant ID
      redirectUri: 'https://time-lapse.ruaalmadinah.com', // Update with your production URL
      postLogoutRedirectUri: 'https://time-lapse.ruaalmadinah.com' // Update with your production URL
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
