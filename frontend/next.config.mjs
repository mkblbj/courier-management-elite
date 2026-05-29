/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
  // 添加webpack配置来减少警告
  webpack: (config, { dev, isServer }) => {
    // 减少开发环境的警告
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      };
      
      // 忽略特定的弃用警告
      config.ignoreWarnings = [
        /Critical dependency: the request of a dependency is an expression/,
        /Module not found: Can't resolve/,
      ];
    }

    // 优化构建性能
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/scan-count-sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/scan-count/mobile/'
          }
        ],
      },
      {
        source: '/scan-count/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache'
          }
        ],
      },
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
