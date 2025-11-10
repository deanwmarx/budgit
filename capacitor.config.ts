import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.budg.app',
  appName: 'budgapp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
