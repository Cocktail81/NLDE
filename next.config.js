/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    unoptimized: true,
  },

  allowedDevOrigins: ['192.168.20.10', 'localhost'],

  staticPageGenerationTimeout: 120,
}

module.exports = nextConfig