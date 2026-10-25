import type { NextConfig } from "next";

// Commit publicado (lo pone la CI al compilar para Vercel). Sirve para comprobar que producción
// tiene exactamente la versión del repositorio: se ve en el encabezado X-App-Version de cada respuesta.
const APP_VERSION = process.env.APP_VERSION ?? "local";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-App-Version", value: APP_VERSION }] }];
  },
  images: {
    // Fotos de perfil de Google y GitHub.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;