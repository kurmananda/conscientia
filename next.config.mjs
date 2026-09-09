/** @type {import('next').NextConfig} */
const nextConfig = {
  // Off because @supabase/gotrue-js's cross-tab auth lock doesn't tolerate
  // Strict Mode's double-invoked effects in dev: the abandoned first
  // invocation holds the lock, every other Supabase call then stalls ~5s
  // waiting on it and force-recovers into an inconsistent state, which
  // shows up as random sign-outs while navigating. Doesn't affect prod
  // (Strict Mode's double-invoke is dev-only regardless of this flag).
  reactStrictMode: false,
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
