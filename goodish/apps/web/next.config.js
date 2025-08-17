/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@goodish/ui', '@goodish/lib', '@goodish/goodheart'],
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
