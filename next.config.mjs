/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Prevent browsers from MIME-sniffing a response away from the declared content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking — never render in an iframe
  { key: "X-Frame-Options", value: "DENY" },
  // Stop XSS auditing legacy bypass (now retired, but belt-and-suspenders)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Enforce HTTPS for 1 year and include subdomains
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Strict referrer policy: no leakage across origins
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Content-Security-Policy — allow only trusted sources
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://generativelanguage.googleapis.com https://*.googleapis.com https://*.firebaseio.com https://*.neon.tech wss://*.firebaseio.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  // Permissions Policy — disable sensors/microphone/camera we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "mammoth"],
  },
  // Apply security headers globally across all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Aggressive caching for Next.js static assets (fingerprinted by hash)
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    // Enable module concatenation for smaller bundles
    config.optimization = {
      ...config.optimization,
      moduleIds: "deterministic",
    };
    return config;
  },
};

export default nextConfig;
