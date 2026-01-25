/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. ČIA YRA NAUJAS PATAISYMAS (leidžia tavo Google IDX adresą)
  experimental: {
    serverActions: {
      allowedOrigins: [
        "3000-firebase-studio-1747996775311.cluster-3gc7bglotjgwuxlqpiut7yyqt4.cloudworkstations.dev",
        "localhost:3000"
      ]
    },
    // Šitas konkrečiai panaikina "Blocked cross-origin" klaidą
    allowedDevOrigins: [
        "3000-firebase-studio-1747996775311.cluster-3gc7bglotjgwuxlqpiut7yyqt4.cloudworkstations.dev",
        "localhost:3000"
    ]
  },

  // 2. ČIA TAVO SENAS KODAS (kad veiktų auto-atsinaujinimas)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

export default nextConfig