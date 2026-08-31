import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Resend SDK lazily imports the optional "@react-email/render" package.
  // We only ever send pre-rendered HTML strings, so keep Resend out of the
  // server bundle and let Node resolve it (and skip that optional import).
  serverExternalPackages: ["resend"],
};

export default nextConfig;
