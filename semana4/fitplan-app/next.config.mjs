/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent stripe (Node.js-only) from leaking into the Edge Runtime bundle
  serverExternalPackages: ["stripe", "@anthropic-ai/sdk"],
};

export default nextConfig;
