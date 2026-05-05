import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "id.ac.itb.ecodrop",
  appName: "EcoDrop",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
