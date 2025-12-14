import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: "standalone",

  // Headers configuration
  async headers() {
    // Check if we're in remote CrunchyCone production environment
    const isRemoteCrunchyConeProduction = process.env.CRUNCHYCONE_PLATFORM === "1";

    const headers: Array<{
      source: string;
      headers: Array<{ key: string; value: string }>;
    }> = [
      {
        // Allow iframe embedding for mock pages
        source: "/backups",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
      {
        // Allow iframe embedding for dev-publish-dialog-read
        source: "/dev-publish-dialog-read",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
      {
        // Allow iframe embedding for dev-version-dropdown
        source: "/dev-version-dropdown",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
      {
        // Allow iframe embedding for admin embeded-versions
        source: "/admin/embeded-versions",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
    ];

    // Only allow admin routes to be embedded when NOT in remote CrunchyCone production
    if (!isRemoteCrunchyConeProduction) {
      headers.push({
        source: "/admin/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      });
      // Allow auth routes to be embedded in iframes
      headers.push({
        source: "/auth/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      });
    } else {
      // In production, also allow auth routes
      headers.push({
        source: "/auth/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      });
    }

    return headers;
  },

  // Allow external images for avatars and video thumbnails
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },

  // External packages that should not be bundled
  serverExternalPackages: [
    "@prisma/adapter-libsql",
    "@libsql/client",
    "@libsql/isomorphic-ws",
    "@libsql/darwin-arm64",
    "@libsql/darwin-x64",
    "@libsql/linux-arm64-gnu",
    "@libsql/linux-arm64-musl",
    "@libsql/linux-x64-gnu",
    "@libsql/linux-x64-musl",
    "@libsql/win32-x64-msvc",
    "nodemailer",
    "crunchycone-lib",
  ],

  // Turbopack configuration
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },

  // Webpack configuration to ignore optional crunchycone-lib cloud provider dependencies
  webpack: (config, { isServer }) => {
    // Add IgnorePlugin to ignore optional dependencies for both client and server

    const { IgnorePlugin } = require("webpack");

    config.plugins = config.plugins || [];
    config.plugins.push(
      // Ignore .md files from @libsql packages using regex
      new IgnorePlugin({
        resourceRegExp: /\.md$/,
        contextRegExp: /@libsql/,
      })
    );
    config.plugins.push(
      new IgnorePlugin({
        checkResource(resource: string, _context: string) {
          // Ignore optional AWS SDK packages
          if (
            resource === "@aws-sdk/client-s3" ||
            resource === "@aws-sdk/s3-request-presigner" ||
            resource === "@aws-sdk/client-ses"
          ) {
            return true;
          }
          // Ignore other optional cloud provider packages
          if (
            resource === "@azure/storage-blob" ||
            resource === "@google-cloud/storage" ||
            resource === "mailgun.js" ||
            resource === "resend"
          ) {
            return true;
          }
          return false;
        },
      })
    );

    // Add rule to ignore .md files (return empty module)
    // This works for both webpack and Turbopack
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.md$/,
      include: /node_modules\/@libsql/,
      use: {
        loader: "null-loader",
      },
    });

    if (isServer) {
      // Mark optional cloud provider SDKs as external for server-side
      config.externals = config.externals || [];
      config.externals.push({
        "@aws-sdk/client-ses": "commonjs @aws-sdk/client-ses",
        "@aws-sdk/client-s3": "commonjs @aws-sdk/client-s3",
        "@aws-sdk/s3-request-presigner": "commonjs @aws-sdk/s3-request-presigner",
        "@azure/storage-blob": "commonjs @azure/storage-blob",
        "@google-cloud/storage": "commonjs @google-cloud/storage",
        "mailgun.js": "commonjs mailgun.js",
        resend: "commonjs resend",
        nodemailer: "commonjs nodemailer",
        "@libsql/isomorphic-ws": "commonjs @libsql/isomorphic-ws",
        "crunchycone-lib": "commonjs crunchycone-lib",
      });
    } else {
      // For client-side, ignore Node.js built-in modules
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        tls: false,
        net: false,
        dns: false,
        fs: false,
        path: false,
      };
    }

    // Suppress webpack warnings about critical dependencies
    const originalWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings = [
      ...originalWarnings,
      {
        module: /mjml-core/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /crunchycone-lib/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};

export default nextConfig;
