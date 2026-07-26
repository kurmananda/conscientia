/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Admins can set workshop/event image links to arbitrary external URLs
    // from /admin's Catalog tab, so next/image needs to accept any host.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  allowedDevOrigins: ['10.135.212.188'],
};

export default nextConfig;
