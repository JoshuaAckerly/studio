import { defineConfig } from 'vite';
import path from 'path';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    server: {
        port: 5177,
        host: '0.0.0.0', // Allow access from network
        hmr: {
            host: 'studio.test'
        }
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css', 
                'resources/js/app.tsx',
                'resources/js/games/noteleks/main-modular.js'
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
        noExternal: ['@inertiajs/react', '@inertiajs/core'],
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
                        const partsSplit = id.split(/node_modules[\/\\]/);
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
                        // Keep most game source modules grouped, but avoid forcing
                        // the Noteleks modular runtime files into the shared 'games'
                        // chunk. That can cause a dynamic-imported module (which
                        // expects Phaser at runtime) to be inlined into the entry
                        // bundle and evaluated on non-game pages, producing
                        // "Phaser is not defined". Let Rollup decide chunking for
                        // files under the noteleks folder so dynamic import stays
                        // as a separate chunk.
                        if (id.includes('resources/js/games/noteleks/')) return;
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
