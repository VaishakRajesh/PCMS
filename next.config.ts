import type { NextConfig } from "next";

// Best-practice production config:
// - "standalone" output builds a tiny self-contained server for Docker
//   (only the files Next.js needs, ~100MB instead of the full project).
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
