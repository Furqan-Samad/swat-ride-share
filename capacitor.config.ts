import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a852693ac58a4c31ade302a60c02adb4',
  appName: 'SwatPool',
  webDir: 'dist',
  // PRODUCTION CONFIG: Remove server block for standalone APK
  // For development hot-reload, uncomment the server block below:
  // server: {
  //   url: 'https://a852693a-c58a-4c31-ade3-02a60c02adb4.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
