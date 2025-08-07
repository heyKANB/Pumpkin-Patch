import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hunter-games.pumpkin-patch',
  appName: 'Pumpkin Patch',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Pumpkin Patch'
  }
};

export default config;