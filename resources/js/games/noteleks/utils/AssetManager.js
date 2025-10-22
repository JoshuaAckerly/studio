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
            if (scene.load.spine) {
                // Phaser Spine plugin available: load using plugin loader
                console.info('[AssetManager] Loading spine via plugin: noteleks-data', { json, atlas });
                scene.load.spine('noteleks-data', json, atlas);
            } else {
                // Fallback to manual loading
                console.info('[AssetManager] Spine plugin missing; loading raw assets for manual setup', { png, atlas, json });
                scene.load.image('noteleks-texture', png);
                scene.load.text('noteleks-atlas-text', atlas);
                scene.load.json('noteleks-skeleton-data', json);
            }
        } catch {
            // Silently handle error
            console.warn('[AssetManager] Failed to queue spine assets for loading', { json, atlas, png });
        }
    }

    static setupSpineData(scene) {
        try {
            const atlasText = scene.cache.text.get('noteleks-atlas-text');
            const skeletonData = scene.cache.json.get('noteleks-skeleton-data');
            const texture = scene.textures.get('noteleks-texture');

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
