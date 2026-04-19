/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        stream: false,
        util: false,
        os: false,
        events: false,
      };
    }
    return config;
  },
};

export default config;
