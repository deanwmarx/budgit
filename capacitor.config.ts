import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.budgit.app',
  appName: 'budgit',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
