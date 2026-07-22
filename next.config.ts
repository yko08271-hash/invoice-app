import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // OneDrive配下では .next/cache への書き込みが同期と競合しビルドが失敗するため無効化
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
