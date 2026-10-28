import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "nodemailer"],
  async rewrites() {
    return [
      {
        source: "/invoice/:number",
        destination: "/api/invoice/:number",
      },
    ];
  },
};
export default nextConfig;
