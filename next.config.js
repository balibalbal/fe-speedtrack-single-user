/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      'demo.speedtrack.id',
      'localhost',
      '127.0.0.1'
    ]
  }
}

module.exports = nextConfig