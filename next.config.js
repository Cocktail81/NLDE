/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['192.168.20.10', 'localhost'],
};

module.exports = nextConfig;