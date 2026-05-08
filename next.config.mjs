/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  // Permite que o Sanity Studio funcione em /studio
  transpilePackages: ['next-sanity'],
}

export default nextConfig
