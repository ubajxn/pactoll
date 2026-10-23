import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "nodemailer"],
  async redirects() {
    return [
      {
        source: "/site",
        destination: "/site/",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
