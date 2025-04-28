/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  experimental: {
    // 使用环境变量配置或默认使用更通用的配置
    // process.env.ALLOWED_ORIGINS可以在.env文件中设置为逗号分隔的域名或IP列表
    allowedDevOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['localhost', '.local', 'host.docker.internal'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 注意：这是一个非常宽松的CSP配置，仅用于开发和测试
          // 生产环境中应该使用更严格的配置
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Feature-Policy',
            value: 'mixed-content *'
          }
        ],
      },
    ]
  },
}

export default nextConfig
