import GameConfig from '../config/GameConfig.js';

/**
 * Platform Manager
 * Handles creation and management of game platforms/terrain
 */
export class PlatformManager {
    constructor(scene) {
        this.scene = scene;
        this.platforms = null;
    }

    initialize() {
        this.platforms = this.scene.physics.add.staticGroup();
        this.createPlatforms();
    }

    createPlatforms() {
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;

        // Ground platform - create multiple tiles to ensure full coverage
        const groundTileWidth = GameConfig.assets.textures.ground.width; // 64px
        const groundTileHeight = GameConfig.assets.textures.ground.height; // 32px
        const tilesNeeded = Math.ceil(screenWidth / groundTileWidth) + 2; // Add extra tiles for safety

        for (let i = 0; i < tilesNeeded; i++) {
            const tileX = i * groundTileWidth + groundTileWidth / 2;
            const tileY = screenHeight - groundTileHeight / 2; // Position at bottom of screen

            const groundTile = this.scene.entityFactory.createPlatform(tileX, tileY, 'ground');
            this.platforms.add(groundTile);
        }

        // Floating platforms - positioned relative to screen size
        this.createFloatingPlatform(screenWidth * 0.75, screenHeight * 0.6);
        this.createFloatingPlatform(screenWidth * 0.1, screenHeight * 0.4);
        this.createFloatingPlatform(screenWidth * 0.9, screenHeight * 0.35);

        // Additional platforms for wider screens
        if (screenWidth > 1200) {
            this.createFloatingPlatform(screenWidth * 0.5, screenHeight * 0.3);
            this.createFloatingPlatform(screenWidth * 0.3, screenHeight * 0.7);
        }
    }

    createFloatingPlatform(x, y, width = 64, height = 32) {
        const overrides = {};
        
        if (width !== 64 || height !== 32) {
            const scaleX = width / GameConfig.assets.textures.ground.width;
            const scaleY = height / GameConfig.assets.textures.ground.height;
            overrides.scale = { x: scaleX, y: scaleY };
        }
        
        const platform = this.scene.entityFactory.createPlatform(x, y, 'floating', overrides);
        this.platforms.add(platform);
        
        return platform;
    }

    addCustomPlatform(x, y, width, height, texture = 'ground') {
        const scaleX = width / GameConfig.assets.textures.ground.width;
        const scaleY = height / GameConfig.assets.textures.ground.height;
        
        const overrides = {
            sprite: texture,
            scale: { x: scaleX, y: scaleY }
        };
        
        const platform = this.scene.entityFactory.createPlatform(x, y, 'ground', overrides);
        this.platforms.add(platform);
        
        return platform;
    }

    getPlatforms() {
        return this.platforms;
    }

    removePlatform(platform) {
        if (this.platforms && platform) {
            this.platforms.remove(platform);
            platform.destroy();
        }
    }

    clearAllPlatforms() {
        if (this.platforms) {
            this.platforms.clear(true, true);
        }
    }

    reset() {
        this.clearAllPlatforms();
        this.initialize();
    }

    shutdown() {
        this.clearAllPlatforms();
    }
}

export default PlatformManager;
