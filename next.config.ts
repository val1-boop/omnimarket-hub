import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de perfil de Google y GitHub.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;