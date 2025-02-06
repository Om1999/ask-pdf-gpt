const nextConfig = {
  reactStrictMode: true,
  images: {
      remotePatterns: [
          {
              protocol: "https",
              hostname: "i.imgur.com",
          },
          {
              protocol: "https",
              hostname: "img.clerk.com"
          }
      ],
  },
  webpack: (config, { isServer }) => {
      if (!isServer) {
          console.log("+++++++++++++++++++WEBPACK RUNNING=================");
          config.resolve.fallback = {
              fs: false,
              tls: false,
              net: false,
              child_process: false,
          };
      }
      config.resolve.alias = {
          ...config.resolve.alias,
          canvas: false,
      };
      return config;
  },
};

module.exports = nextConfig;
