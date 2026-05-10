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
  
  // Disable static optimization for pages that use Supabase
  // This prevents prerendering errors
  staticPageGenerationTimeout: 120,
};

module.exports = nextConfig;