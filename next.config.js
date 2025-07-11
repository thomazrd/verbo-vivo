/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
