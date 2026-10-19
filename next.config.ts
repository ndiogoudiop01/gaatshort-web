import type { NextConfig } from 'next';

/**
 * `standalone` : le site a besoin d'un serveur Node — rendu serveur des fiches série (SEO,
 * FR-CAT-008) et appels à l'API depuis le serveur, qui résout la marque par l'hôte (02-TRD §4.3).
 * `.next/standalone` embarque le strict nécessaire de `node_modules` : c'est lui que copie l'image.
 */
const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    // Affiches et bannières : variantes déjà redimensionnées côté stockage (T2.5), servies par le CDN.
    unoptimized: true,
  },
  allowedDevOrigins: ['127.0.0.1'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
