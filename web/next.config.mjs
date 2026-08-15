/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@smarthealth/types', '@smarthealth/design-tokens'],
  reactStrictMode: true,
};

export default nextConfig;
