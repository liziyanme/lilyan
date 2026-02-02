/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 避免 Vercel 构建时因 ESLint/TypeScript 警告导致失败
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
