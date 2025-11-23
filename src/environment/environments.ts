export const environment = {
  production: true,
  backend: 'http://10.100.72.10/backend',
  proxy: 'http://10.100.72.10/proxy/',
  hik: 'https://10.100.72.10/backend',
  msalConfig: {
    auth: {
      clientId: '42d12237-e179-4b53-9856-fc6eb19ebb3d', // Replace with your Client ID
      authority: 'https://login.microsoftonline.com/1a450556-a74f-4135-ac56-506d6b3bea05', // Replace with your Tenant ID
      redirectUri: 'https://time-lapse.ruaalmadinah.com/login', // Update with your production URL
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
