import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.huntergames.pumpkinpatch',
  appName: 'Pumpkin Patch',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'PumpkinPatch'
  }
};

export default config;