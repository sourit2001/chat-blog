/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    let base = process.env.NEXT_PUBLIC_API_BASE;
    if (base) {
      // ensure protocol present
      if (!base.startsWith('http://') && !base.startsWith('https://')) {
        base = `https://${base}`;
      }
      // strip trailing slash
      base = base.replace(/\/$/, '');
      return [
        {
          source: '/api/:path*',
          destination: `${base}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
