import type { NextConfig } from "next";
import os from "os";

// Automatically detect all local IPv4 addresses to prevent dev server connection issues
// when the user's IP changes (e.g. via DHCP on Wi-Fi/LAN)
const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = ["localhost:3000", "127.0.0.1:3000"];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
        ips.push(`${iface.address}:3000`);
      }
    }
  }
  return ips;
};

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: getLocalIPs()
};

export default nextConfig;

