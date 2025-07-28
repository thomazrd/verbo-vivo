/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@genkit-ai/googleai'],
  experimental: {
    // Essencial para garantir que dependências do lado do servidor não sejam incorretamente empacotadas.
    // Isso resolve problemas de autenticação com o Firebase Admin SDK em produção.
    serverComponentsExternalPackages: ['firebase-admin'],
  },
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
      },
       {
        protocol: 'https',
        hostname: 'dynamic.tiggomark.com.br',
      }
    ],
  },
};

module.exports = nextConfig;
