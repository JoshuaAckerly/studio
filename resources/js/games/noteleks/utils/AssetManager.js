/**
 * Asset Management Utilities
 */
export class AssetManager {
    static createPlaceholderTextures(scene, config) {
        const textures = config.assets.textures;

        Object.entries(textures).forEach(([key, textureConfig]) => {
            if (textureConfig.color !== undefined) {
                // Check if texture already exists
                if (scene.textures.exists(key)) {
                    return;
                }

                // Create graphics object
                const graphics = scene.add.graphics();
                graphics.fillStyle(textureConfig.color);
                graphics.fillRect(0, 0, textureConfig.width, textureConfig.height);

                // Generate texture and destroy graphics object
                graphics.generateTexture(key, textureConfig.width, textureConfig.height);
                graphics.destroy();
            }
        });
    }

    static async loadSpineAssets(scene, config) {
        const { atlas, json, png } = config.assets.spine;

        try {
            // Always queue raw assets as a reliable fallback. This guarantees that
            // AssetManager.setupSpineData can access atlas text and skeleton JSON
            // from the scene cache even if the Spine plugin/loader isn't available
            // at preload time (race conditions, plugin init delays, etc.).
            try {
                console.info('[AssetManager] Queuing raw spine assets (fallback safe):', { png, atlas, json });
                scene.load.image('noteleks-texture', png);
                scene.load.text('noteleks-atlas-text', atlas);
                scene.load.json('noteleks-skeleton-data', json);
            } catch (e) {
                console.warn('[AssetManager] Failed to queue raw spine assets:', e && e.message);
            }

            // If the official Spine loader is available, also use it (this may
            // provide optimized loading and cache entries the plugin expects).
            if (scene.load && typeof scene.load.spine === 'function') {
                try {
                    console.info('[AssetManager] Spine loader detected, also loading via plugin loader: noteleks-data', { json, atlas });
                    scene.load.spine('noteleks-data', json, atlas);
                } catch (e) {
                    console.warn('[AssetManager] scene.load.spine threw while queuing plugin load:', e && e.message);
                }
            } else {
                console.info('[AssetManager] Spine loader not detected at preload; relying on raw assets fallback');
            }
        } catch {
            // Silently handle error
            console.warn('[AssetManager] Failed to queue spine assets for loading', { json, atlas, png });
        }
    }

    static setupSpineData(scene) {
        try {
            // Diagnostic: list current cache keys and textures so we can debug
            try {
                const textKeys = scene.cache && scene.cache.text ? scene.cache.text.keys ? Object.keys(scene.cache.text.keys) : [] : [];
                const jsonKeys = scene.cache && scene.cache.json ? scene.cache.json.keys ? Object.keys(scene.cache.json.keys) : [] : [];
                const textureKeys = scene.textures ? Object.keys(scene.textures.list || {}) : [];
                console.info('[AssetManager] setupSpineData diagnostics: textKeys=', textKeys, 'jsonKeys=', jsonKeys, 'textureKeys=', textureKeys);
            } catch (diagErr) {
                console.warn('[AssetManager] diagnostics failed:', diagErr && diagErr.message);
            }

            const atlasText = scene.cache.text.get('noteleks-atlas-text');
            const skeletonData = scene.cache.json.get('noteleks-skeleton-data');
            const texture = scene.textures.get('noteleks-texture');

            console.info('[AssetManager] setupSpineData: atlasText=', !!atlasText, 'skeletonData=', !!skeletonData, 'texture=', !!texture);

            if (!atlasText || !skeletonData || !texture) {
                return false;
            }

            const modifiedAtlasText = atlasText.replace('Noteleks.png', 'noteleks-texture');

            if (window.spine) {
                const textureAtlas = new window.spine.TextureAtlas(modifiedAtlasText, (_path) => {
                    return texture.getSourceImage();
                });

                const attachmentLoader = new window.spine.AtlasAttachmentLoader(textureAtlas);
                const json = new window.spine.SkeletonJson(attachmentLoader);
                const skeletonDataObj = json.readSkeletonData(skeletonData);

                scene.cache.custom = scene.cache.custom || {};
                scene.cache.custom['spine-atlas'] = textureAtlas;
                scene.cache.custom['spine-skeleton-data'] = skeletonDataObj;

                // Create a lightweight canvas renderer fallback so we can still display
                // Spine animations even if the SpinePlugin can't be used directly.
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d');

                    // Prepare Spine runtime objects for rendering
                    const atlasLoader = textureAtlas;
                    const attachmentLoader = new window.spine.AtlasAttachmentLoader(atlasLoader);
                    const skeletonJson = new window.spine.SkeletonJson(attachmentLoader);
                    const runtimeSkeletonData = skeletonDataObj; // already created above

                    // Create basic Spine objects required to update/pose
                    const skeleton = new window.spine.Skeleton(runtimeSkeletonData);
                    skeleton.setToSetupPose();
                    const stateData = new window.spine.AnimationStateData(runtimeSkeletonData);
                    const state = new window.spine.AnimationState(stateData);

                    // Default animation if present
                    try { state.setAnimation(0, 'idle', true); } catch (e) { /* ignore */ }

                    // Store a small render helper object in cache.custom
                    scene.cache.custom['spine-canvas-fallback'] = {
                        canvas,
                        ctx,
                        skeleton,
                        state,
                        time: 0,
                        drawToTexture: function(phaserScene, textureKey) {
                            // advance state and render skeleton onto canvas
                            const dt = 1/60;
                            this.time += dt;
                            this.state.update(dt);
                            this.state.apply(this.skeleton);
                            this.skeleton.updateWorldTransform();

                            // Clear and render
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            // Very small, naive renderer: draw attachments as images if possible
                            for (let i = 0; i < this.skeleton.slots.length; i++) {
                                const slot = this.skeleton.slots[i];
                                const attachment = slot.getAttachment();
                                if (attachment && attachment.region) {
                                    const img = atlasLoader.getRegions && atlasLoader.getRegions()[0] ? atlasLoader.getRegions()[0].page.getTexture().image : null;
                                    if (img) {
                                        // naive draw at skeleton position
                                        ctx.drawImage(img, canvas.width/2 - img.width/2, canvas.height/2 - img.height/2);
                                    }
                                }
                            }

                            // Copy to Phaser texture
                            try {
                                if (!phaserScene.textures.exists(textureKey)) {
                                    phaserScene.textures.addImage(textureKey, canvas);
                                } else {
                                    const tex = phaserScene.textures.get(textureKey);
                                    tex.source[0].image = canvas;
                                    phaserScene.textures.refresh();
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                    };
                } catch (e) {
                    // if fallback creation fails, ignore
                    console.warn('[AssetManager] Failed to create spine canvas fallback:', e);
                }
                
                // Notify the scene that spine data is ready so game objects can create displays
                try {
                    if (scene && scene.events && typeof scene.events.emit === 'function') {
                        scene.events.emit('spine-ready');
                    }
                } catch (e) {
                    // ignore
                }

                console.info('[AssetManager] Spine data prepared and cached under scene.cache.custom', Object.keys(scene.cache.custom));
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }
}

export default AssetManager;
