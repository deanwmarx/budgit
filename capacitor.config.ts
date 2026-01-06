import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.budgit.app.dev',
  appName: 'Budgit - Dev',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
