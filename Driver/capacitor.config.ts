import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Driver',
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
  },
};
export default config;
