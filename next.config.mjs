/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Every client-app route returns 200 from the catch-all page, so keep the sign-in and
  // account pages out of search results with a header instead of a per-page meta tag.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex" }];
    return [
      "/login",
      "/register",
      "/registration-success/:path*",
      "/dashboard",
      "/dashboard/:path*",
    ].map((source) => ({ source, headers: noindex }));
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: "buffer",
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: "util",
    };

    return config;
  },
};

export default nextConfig;
