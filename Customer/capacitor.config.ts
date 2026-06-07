import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fivgo.app',
  appName: 'FivGo',
  webDir: 'www',
  plugins: {
      SplashScreen: {
        launchShowDuration: 0,
        launchAutoHide: true,
        backgroundColor: "#ffffff",
        showSpinner: false,
        androidSpinnerStyle: "small",
        iosSpinnerStyle: "small",
        splashFullScreen: false,
      },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false
      },
      logLevel: 1
    }
  }
};

export default config;
