import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.huntergames.pumpkinpatch',
  appName: 'Pumpkin Patch',
  webDir: 'dist/public',
  version: '2.0.4',

  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  ios: {
    scheme: 'PumpkinPatch',
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#1a1a1a',
    allowsLinkPreview: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: false
    }
  }
};

export default config;