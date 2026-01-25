/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@genkit-ai/core", 
      "genkit", 
      "require-in-the-middle", 
      "@opentelemetry/exporter-jaeger", 
      "protobufjs", 
      "@google-cloud/firestore", 
      "firebase-admin",
      "firebase-admin/app",
      "@grpc/grpc-js"
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

module.exports = nextConfig;
