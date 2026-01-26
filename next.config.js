/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next_temp',
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
      "@grpc/grpc-js",
      "stripe"
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
  allowedDevOrigins: ["https://6000-firebase-studio-1747996775311.cluster-3gc7bglotjgwuxlqpiut7yyqt4.cloudworkstations.dev"]
};

module.exports = nextConfig;
