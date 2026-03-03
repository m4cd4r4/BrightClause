/** @type {import('next').NextConfig} */
const nextConfig = {
  // BACKEND_URL and BACKEND_API_KEY are read from process.env
  // inside the API route proxy (server-side only, never exposed to the client).
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
