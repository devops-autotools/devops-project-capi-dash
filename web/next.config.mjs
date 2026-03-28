/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Tạo bundle tối giản, không cần node_modules trong Docker
  async rewrites() {
    // Proxy chỉ dùng khi dev local (next dev)
    // Trong production (Docker), backend và frontend chạy cùng host
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
