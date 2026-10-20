/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/',
                destination: '/site/',
                permanent: false,
            },
        ];
    },
    trailingSlash: true,
    sassOptions: {
        quietDeps: true, // Suppresses warnings from dependencies
        api: 'modern-compiler',
    },
};

export default nextConfig;