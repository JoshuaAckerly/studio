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
        console.log('Platform static group created:', !!this.platforms);
        this.createPlatforms();
    }

    createPlatforms() {
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        // Ground platform - create multiple tiles to ensure full coverage
        const groundTileWidth = GameConfig.assets.textures.ground.width; // 64px
        const groundTileHeight = GameConfig.assets.textures.ground.height; // 32px
        const tilesNeeded = Math.ceil(screenWidth / groundTileWidth);
        
        console.log('Creating ground tiles:', tilesNeeded, 'tiles of', groundTileWidth, 'px each');
        
        for (let i = 0; i < tilesNeeded; i++) {
            const tileX = (i * groundTileWidth) + (groundTileWidth / 2);
            const tileY = screenHeight - 16;
            
            const groundTile = this.platforms.create(tileX, tileY, 'ground');
            console.log('Ground tile', i, 'at x=', tileX, 'body:', groundTile.body ? 'yes' : 'no');
        }
            
        // Debug ground platform setup with delay to ensure body is ready
        setTimeout(() => {
            console.log('🟩 GROUND PLATFORM DEBUG:');
            console.log('  Total platforms:', this.platforms.children.entries.length);
            console.log('  Screen: ' + screenWidth + 'x' + screenHeight);
            console.log('  Ground coverage: 0 to', tilesNeeded * groundTileWidth);
            
            // Show first and last tile details
            const tiles = this.platforms.children.entries;
            if (tiles.length > 0) {
                const firstTile = tiles[0];
                const lastTile = tiles[tiles.length > 1 ? tiles.length - 1 : 0];
                console.log('  First tile: x=' + firstTile.x + ', body=' + (firstTile.body ? firstTile.body.x + '-' + (firstTile.body.x + firstTile.body.width) : 'none'));
                console.log('  Last tile: x=' + lastTile.x + ', body=' + (lastTile.body ? lastTile.body.x + '-' + (lastTile.body.x + lastTile.body.width) : 'none'));
            }
        }, 50);
        
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
        const platform = this.platforms.create(x, y, 'ground');
        
        if (width !== 64 || height !== 32) {
            const scaleX = width / GameConfig.assets.textures.ground.width;
            const scaleY = height / GameConfig.assets.textures.ground.height;
            platform.setScale(scaleX, scaleY).refreshBody();
        }
        
        return platform;
    }

    addCustomPlatform(x, y, width, height, texture = 'ground') {
        const platform = this.platforms.create(x, y, texture);
        
        const scaleX = width / GameConfig.assets.textures.ground.width;
        const scaleY = height / GameConfig.assets.textures.ground.height;
        platform.setScale(scaleX, scaleY).refreshBody();
        
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