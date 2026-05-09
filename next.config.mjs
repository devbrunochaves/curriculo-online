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
  // O Sanity Studio é completamente client-side — não tenta gerar estaticamente
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

export default nextConfig
