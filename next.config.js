/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark ONNX and similar packages as external on the server
      config.externals.push(
        "onnxruntime-node",
        "chromadb-default-embed",
        "chromadb"
      );
    }
    return config;
  },
};

module.exports = nextConfig;
