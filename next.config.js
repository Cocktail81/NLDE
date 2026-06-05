/** @type {import('next').NextConfig} */

const isDevelopment = process.env.NODE_ENV !== 'production'

const supabaseConnectSrc = [
  'https://*.supabase.co',
  'wss://*.supabase.co',
]

const developmentConnectSrc = [
  'http://localhost:*',
  'ws://localhost:*',
  'http://127.0.0.1:*',
  'ws://127.0.0.1:*',
  'http://192.168.20.10:*',
  'ws://192.168.20.10:*',
  'https://app.cocktail-hl.net.eu.org',
  'wss://app.cocktail-hl.net.eu.org',
]

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  [
    'script-src',
    "'self'",
    "'unsafe-inline'",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ].join(' '),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  [
    'connect-src',
    "'self'",
    ...supabaseConnectSrc,
    ...(isDevelopment ? developmentConnectSrc : []),
  ].join(' '),
  "media-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
  ...(isDevelopment
    ? []
    : [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ]),
]

const nextConfig = {
  images: {
    unoptimized: true,
  },

  allowedDevOrigins: [
    '192.168.20.10',
    'localhost',
    'app.cocktail-hl.net.eu.org'
  ],

  staticPageGenerationTimeout: 120,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig