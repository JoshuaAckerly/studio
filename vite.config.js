import { defineConfig } from 'vite';
import path from 'path';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    server: {
        port: 8084,
        host: '0.0.0.0',
        origin: 'http://studio.graveyardjokes.local:8084',
        hmr: {
            host: 'studio.graveyardjokes.local'
        },
        cors: {
            origin: ['http://studio.graveyardjokes.local'],
            credentials: true
        },
        allowedHosts: ['studio.graveyardjokes.local']
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css', 
                'resources/js/app.tsx'
            ],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': path.resolve(__dirname, 'vendor/tightenco/ziggy'),
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
        dedupe: ['react', 'react-dom'],
    },
    ssr: {
        noExternal: ['react', 'react-dom', '@inertiajs/react', '@inertiajs/core', '@headlessui/react'],
    },
    build: {
        // Raise warning limit slightly and add manual chunking to avoid huge vendor bundles
        chunkSizeWarningLimit: 1000, // kB
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id) return;
                    // Keep special explicit chunks
                    if (id.includes('@esotericsoftware/spine-phaser-v3')) return 'spine-plugin';
                    if (id.includes('phaser')) return 'phaser';

                    // Split node_modules into per-package chunks to avoid a single huge vendor bundle
                    if (id.includes('node_modules')) {
                        const partsSplit = id.split(/node_modules[/]/);
                        if (!partsSplit || partsSplit.length < 2) return;
                        const parts = partsSplit[1].split(path.sep);
                        let pkg = parts[0];
                        // Scoped packages have form @scope/package
                        if (pkg && pkg.startsWith('@') && parts.length > 1) {
                            pkg = pkg + '/' + parts[1];
                        }
                        // Sanitize package name for filenames
                        const name = pkg.replace('@', '').replace('/', '_');
                        return `npm.${name}`;
                    }
                    if (id.includes('resources/js/games')) {
                        return 'games';
                    }
                },
                globals: {
                    phaser: 'Phaser'
                }
            },
            // Treat Phaser as external — we load it via CDN/script tag in the page
            external: ['phaser'],
        },
    },
});
