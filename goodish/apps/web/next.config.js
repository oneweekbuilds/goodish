/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@goodish/ui', '@goodish/lib'],
  async redirects() {
    return [
      {
        source: '/goodheart',
        destination: 'https://goodheart.goodish.org',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
