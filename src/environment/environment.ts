export const environment = {
  production: false,
  backend: 'https://ahcwatch.awjholding.com/backend',
  proxy: 'https://lsl-platform.com/proxy',
  hik: 'http://localhost:3000',
  // Microsoft Azure AD Configuration
  msalConfig: {
    auth: {
      clientId: '888591c1-5f18-4343-bf7c-cd02b2154bac', // Your Azure AD app client ID
      authority: 'https://login.microsoftonline.com/9c8d0d3e-b6ba-4ef3-b023-37952c89fc65', // Your tenant ID
      redirectUri: 'https://ahcwatch.awjholding.com'
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: any, message: string, containsPii: boolean) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case 0: // LogLevel.Error
              console.error(message);
              return;
            case 1: // LogLevel.Warning
              console.warn(message);
              return;
            case 2: // LogLevel.Info
              console.info(message);
              return;
            case 3: // LogLevel.Verbose
              console.debug(message);
              return;
          }
        }
      }
    }
  },
  // API endpoints that require authentication
  protectedResourceMap: new Map([
    ['http://localhost:3000/api', ['api://888591c1-5f18-4343-bf7c-cd02b2154bac/access_as_user']]
  ])
};
