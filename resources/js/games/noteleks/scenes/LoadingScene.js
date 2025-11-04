/* global Phaser */
import GameConfig from '../config/GameConfig.js';
import AssetManager from '../utils/AssetManager.js';

class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        try { this.cameras.main.setBackgroundColor(GameConfig.screen.backgroundColor); } catch (e) {}

        // Show a simple progress text
        try {
            const w = (GameConfig && GameConfig.screen && GameConfig.screen.width) || this.cameras.main.width;
            const h = (GameConfig && GameConfig.screen && GameConfig.screen.height) || this.cameras.main.height;
            this._progressText = this.add.text(w / 2, h / 2, 'Loading...', { font: '16px Arial', fill: '#ffffff' }).setOrigin(0.5);
        } catch (e) { /* ignore */ }

        // Two-stage preload:
        // 1) Fetch the manifest and any minimal UI assets
        // 2) When manifest is available, enqueue all frame WebP assets and
        //    spine assets, then start the loader again so the LoadingScene
        //    remains visible while the full asset set downloads.
        try {
            const manifestCacheKey = 'noteleks-sprites-manifest';
            const manifestUrl = '/games/noteleks/sprites/manifest.json';

            // Stage 1: enqueue manifest (and keep the loading UI)
            try { this.load.json(manifestCacheKey, manifestUrl); } catch (e) {}

            // Show progress for both stages
            try { this.load.on('progress', (p) => { try { if (this._progressText) this._progressText.setText('Loading: ' + Math.round(p * 100) + '%'); } catch (e) {} }); } catch (e) {}

            // When the manifest file is loaded, queue the rest of the assets
            try {
                this.load.once('filecomplete-json-' + manifestCacheKey, () => {
                    try {
                        const mf = (this.cache && this.cache.json && typeof this.cache.json.get === 'function') ? this.cache.json.get(manifestCacheKey) : null;
                        // Synchronously queue manifest-declared assets
                        try { AssetManager.queueAssetsFromManifest(this, mf); } catch (e) { console.warn('[LoadingScene] queueAssetsFromManifest failed', e && e.message); }

                        // Also queue Spine raw assets if configured
                        if (GameConfig && GameConfig.useSpine && GameConfig.assets && GameConfig.assets.spine) {
                            try { this.load.text('noteleks-atlas-text', GameConfig.assets.spine.atlas); } catch (e) {}
                            try { this.load.json('noteleks-skeleton-data', GameConfig.assets.spine.json); } catch (e) {}
                            try { this.load.image('noteleks-texture', GameConfig.assets.spine.png); } catch (e) {}
                        }

                        // Start the loader for stage 2 (assets enqueued above)
                        try {
                            if (this.load && !this.load.isLoading) {
                                this.load.start();
                            }
                        } catch (e) { /* ignore */ }

                        // When second-stage loading completes, start GameScene
                        try {
                            this.load.once('complete', () => {
                                try { this.scene.start('GameScene'); } catch (e) { console.warn('[LoadingScene] Failed to start GameScene', e && e.message); }
                            });
                        } catch (e) { /* ignore */ }
                    } catch (e) { console.warn('[LoadingScene] manifest handler failed', e && e.message); }
                });
            } catch (e) { console.warn('[LoadingScene] Failed to register manifest filecomplete handler', e && e.message); }
        } catch (e) { console.warn('[LoadingScene] AssetManager load failed', e && e.message); }
    }

    create() {
        // nothing — transition happens on loader complete
    }
}

export default LoadingScene;
