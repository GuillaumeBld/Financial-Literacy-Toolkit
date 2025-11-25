/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Temporary workaround for Vercel build using unsupported ESLint options
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
