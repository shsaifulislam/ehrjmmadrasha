/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "contribution.usercontent.google.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://contribution.usercontent.google.com",
              "connect-src 'self'",
              "frame-src 'self' https://maps.google.com https://www.google.com https://www.youtube.com https://youtube.com",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin/admission",
        destination: "/admin/admissions",
        permanent: true,
      },
      {
        source: "/admin/communication",
        destination: "/admin/communications",
        permanent: true,
      },
      {
        source: "/admin/cms",
        destination: "/admin/content",
        permanent: true,
      },
      {
        source: "/guardian",
        destination: "/portal",
        permanent: true,
      },
      {
        source: "/login/guardian",
        destination: "/login?tab=GUARDIAN",
        permanent: false,
      },
      {
        source: "/login/admin",
        destination: "/login?tab=INSTITUTIONAL",
        permanent: false,
      },
      {
        source: "/dashboard/admin",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/dashboard/admin/teachers",
        destination: "/admin?tab=TEACHERS",
        permanent: false,
      },
      {
        source: "/dashboard/admin/:path*",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/departments",
        destination: "/academic",
        permanent: false,
      },
      {
        source: "/admissions",
        destination: "/admission",
        permanent: false,
      },
      {
        source: "/admissions/apply",
        destination: "/admission/apply",
        permanent: false,
      },
      {
        source: "/admissions/track",
        destination: "/admission/track",
        permanent: false,
      },
      {
        source: "/verify/student",
        destination: "/verify",
        permanent: false,
      },
      {
        source: "/verify/gatepass",
        destination: "/verify",
        permanent: false,
      },
      {
        source: "/verify/receipt",
        destination: "/verify",
        permanent: false,
      },
      {
        source: "/verify/result",
        destination: "/results",
        permanent: false,
      },
      {
        source: "/wings-info",
        destination: "/about",
        permanent: false,
      },
      {
        source: "/teachers",
        destination: "/about",
        permanent: false,
      },
      {
        source: "/admission-status",
        destination: "/admission/track",
        permanent: false,
      },
      {
        source: "/admit-card",
        destination: "/downloads",
        permanent: false,
      },
      {
        source: "/pay-fees",
        destination: "/portal?tab=FINANCE",
        permanent: false,
      },
      {
        source: "/donation",
        destination: "/donate",
        permanent: false,
      },
      {
        source: "/seasonal-campaign",
        destination: "/donate",
        permanent: false,
      },
      {
        source: "/fatwa-blog",
        destination: "/knowledge",
        permanent: false,
      },
      {
        source: "/career",
        destination: "/about",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
