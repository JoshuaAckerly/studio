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
                    console.log(`Texture '${key}' already exists, skipping creation`);
                    return;
                }
                
                // Create graphics object
                const graphics = scene.add.graphics();
                graphics.fillStyle(textureConfig.color);
                graphics.fillRect(0, 0, textureConfig.width, textureConfig.height);
                
                // Generate texture and destroy graphics object
                graphics.generateTexture(key, textureConfig.width, textureConfig.height);
                graphics.destroy();
                
                console.log(`Created placeholder texture '${key}': ${textureConfig.width}x${textureConfig.height}, color: 0x${textureConfig.color.toString(16)}`);
            }
        });
    }

    static async loadSpineAssets(scene, config) {
        const { atlas, json, png } = config.assets.spine;
        
        try {
            if (scene.load.spine) {
                scene.load.spine('noteleks-data', json, atlas);
            } else {
                // Fallback to manual loading
                scene.load.image('noteleks-texture', png);
                scene.load.text('noteleks-atlas-text', atlas);
                scene.load.json('noteleks-skeleton-data', json);
            }
        } catch (error) {
            console.warn('Failed to load Spine assets:', error);
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
                const textureAtlas = new window.spine.TextureAtlas(modifiedAtlasText, (path) => {
                    return texture.getSourceImage();
                });
                
                const attachmentLoader = new window.spine.AtlasAttachmentLoader(textureAtlas);
                const json = new window.spine.SkeletonJson(attachmentLoader);
                const skeletonDataObj = json.readSkeletonData(skeletonData);
                
                scene.cache.custom = scene.cache.custom || {};
                scene.cache.custom['spine-atlas'] = textureAtlas;
                scene.cache.custom['spine-skeleton-data'] = skeletonDataObj;
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to setup Spine data:', error);
            return false;
        }
    }
}

export default AssetManager;