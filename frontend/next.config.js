/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    NEXT_PUBLIC_WS_URL:
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws",
  },
  turbopack: {},
  serverExternalPackages: ["jspdf", "html2canvas"],
};

module.exports = nextConfig;
