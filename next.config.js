/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [1024, 1280, 1440, 1920, 2560],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' }
    ],
  },
};
module.exports = nextConfig;