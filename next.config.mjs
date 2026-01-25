/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['onnxruntime-node'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            }
        ]
    }
};

export default nextConfig;