/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "pdfjs-dist",
      "canvas",
      "@napi-rs/canvas",
      "@napi-rs/canvas-win32-x64-msvc",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 將含有原生 .node 二進制檔的套件標記為外部套件
      const externals = config.externals || [];
      config.externals = [
        ...externals,
        ({ request }, callback) => {
          if (
            request === "@napi-rs/canvas" ||
            request?.startsWith("@napi-rs/canvas") ||
            request === "canvas" ||
            request === "pdfjs-dist" ||
            request?.startsWith("pdfjs-dist/")
          ) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
