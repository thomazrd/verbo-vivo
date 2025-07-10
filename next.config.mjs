/** @type {import('next').NextConfig} */
const nextConfig = {
  watchOptions: {
    ignored: [
      '**/src/ai/**/*',
    ],
  },
};

export default nextConfig;
