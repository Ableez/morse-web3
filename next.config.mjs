/** @type {import('next').NextConfig} */
const nextConfig = {
  crossOrigin: "use-credentials",
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "g-fvxujch8ow7.vusercontent.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
