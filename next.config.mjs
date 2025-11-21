/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only enable static export for mobile builds (when MOBILE_BUILD is set)
  // This allows normal dev server with API routes for local development
  ...(process.env.MOBILE_BUILD === 'true' && {
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=*, interest-cohort=()',
          },
        ],
      },
    ];
  },
  // Skip TypeScript checking during mobile builds (API routes are temporarily removed)
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
  },
};

export default nextConfig;
