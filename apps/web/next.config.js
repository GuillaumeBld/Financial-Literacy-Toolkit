/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    typedRoutes: true,
  },
  // Disable Next.js telemetry for privacy
  telemetry: false,
};

module.exports = nextConfig;
