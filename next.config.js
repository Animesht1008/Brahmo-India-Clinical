/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence Supabase realtime websocket warnings in production
  serverExternalPackages: [],
  // Required for Vercel deployment with API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
