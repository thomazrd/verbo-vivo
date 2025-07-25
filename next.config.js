/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! ATENÇÃO !!
    // Permite que builds de produção sejam concluídas com sucesso mesmo que
    // seu projeto tenha erros de tipo.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Atenção: Isso permite que builds de produção sejam concluídas com sucesso
    // mesmo que seu projeto tenha erros de ESLint.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@opentelemetry/api', '@genkit-ai/googleai'],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
};

module.exports = nextConfig;
