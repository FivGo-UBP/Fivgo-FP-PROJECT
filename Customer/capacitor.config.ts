import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fivgo.app',
  appName: 'FivGo',
  webDir: 'www',
  plugins: {
     SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#079cff",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      splashFullScreen: false,
      layoutName: "custom_splash",
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
