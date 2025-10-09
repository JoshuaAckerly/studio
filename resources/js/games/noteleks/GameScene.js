/* global Phaser */
import Player from './Player.js';
import Enemy from './Enemy.js';
import WeaponManager from './WeaponManager.js';
import GameUI from './GameUI.js';

// Import Spine assets as static files
import noteleksAtlas from '../../../static/games/noteleks/spine/characters/Noteleks.atlas?url';
import noteleksJson from '../../../static/games/noteleks/spine/characters/Noteleks.json?url';

/**
 * Main game scene for Noteleks Heroes Beyond Light
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameState = 'playing'; // playing, paused, gameOver
        this.enemySpawnTimer = null;
        this.enemies = null;
        this.platforms = null;
        this.player = null;
        this.weaponManager = null;
        this.gameUI = null;
    }

    preload() {
        // Loading screen
        this.add.text(400, 250, 'Loading Noteleks Heroes...', {
            fontSize: '24px',
            fill: '#4ade80',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Load Spine animations with error handling
        console.log('Loading Spine assets...');
        
        // Add comprehensive error handling for file loading
        this.load.on('loaderror', (file) => {
            console.error('Failed to load file:', {
                key: file.key,
                url: file.url,
                src: file.src,
                type: file.type
            });
        });
        
        this.load.on('filecomplete', (key, type, data) => {
            console.log('Successfully loaded:', key, type);
        });
        
        this.load.on('complete', () => {
            console.log('All assets loaded');
        });
        
        // Use Vite-imported asset URLs
        console.log('Attempting to load assets from:', { 
            atlasPath: noteleksAtlas, 
            jsonPath: noteleksJson 
        });
        
        // Test if we can fetch the files first
        this.testAssetAvailability(noteleksAtlas, noteleksJson);
        
        // Load Spine assets using Vite asset URLs
        this.load.spineAtlas('noteleks-atlas', noteleksAtlas);
        this.load.spineJson('noteleks-data', noteleksJson);

        // Create placeholder sprites as textures
        this.createPlaceholderTextures();
    }

    async testAssetAvailability(atlasPath, jsonPath) {
        try {
            const atlasResponse = await fetch(atlasPath);
            console.log('Atlas availability:', atlasResponse.status, atlasResponse.statusText);
            
            const jsonResponse = await fetch(jsonPath);
            console.log('JSON availability:', jsonResponse.status, jsonResponse.statusText);
        } catch (error) {
            console.error('Asset availability test failed:', error);
        }
    }

    createPlaceholderTextures() {
        // Skeleton Hero (player fallback)
        this.add.graphics()
            .fillStyle(0xffffff)
            .fillRect(0, 0, 32, 48)
            .generateTexture('skeleton', 32, 48);

        // Weapons
        this.add.graphics()
            .fillStyle(0xc0c0c0)
            .fillRect(0, 0, 16, 4)
            .generateTexture('dagger', 16, 4);

        this.add.graphics()
            .fillStyle(0xff4400)
            .fillCircle(8, 8, 8)
            .generateTexture('fireball', 16, 16);

        this.add.graphics()
            .fillStyle(0x8b4513)
            .fillRect(0, 0, 20, 4)
            .generateTexture('arrow', 20, 4);

        this.add.graphics()
            .fillStyle(0x9900ff)
            .fillCircle(6, 6, 6)
            .generateTexture('magic_bolt', 12, 12);

        // Enemy
        this.add.graphics()
            .fillStyle(0x008000)
            .fillRect(0, 0, 32, 40)
            .generateTexture('enemy', 32, 40);

        // Ground/Platform
        this.add.graphics()
            .fillStyle(0x4a4a4a)
            .fillRect(0, 0, 64, 32)
            .generateTexture('ground', 64, 32);

        // Background
        this.add.graphics()
            .fillStyle(0x2d2d2d)
            .fillRect(0, 0, 800, 600)
            .generateTexture('background', 800, 600);
    }

    create() {
        console.log('Creating Noteleks game scene...');

        // Background
        this.add.image(400, 300, 'background');

        // Create platforms
        this.createPlatforms();

        // Initialize game systems
        this.weaponManager = new WeaponManager(this);
        this.gameUI = new GameUI(this);

        // Create player - position relative to screen
        const screenHeight = this.cameras.main.height;
        this.player = new Player(this, 100, screenHeight - 150);

        // Create enemies group
        this.enemies = this.physics.add.group();

        // Setup collisions
        this.setupCollisions();

        // Setup controls
        this.setupControls();

        // Start enemy spawning
        this.startEnemySpawning();

        console.log('Game scene created successfully');
    }

    createPlatforms() {
        this.platforms = this.physics.add.staticGroup();
        
        // Get screen dimensions
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Ground - scale to full width
        const groundScale = screenWidth / 64; // ground texture is 64px wide
        this.platforms.create(screenWidth / 2, screenHeight - 16, 'ground')
            .setScale(groundScale, 1).refreshBody();
        
        // Floating platforms - positioned relative to screen size
        this.platforms.create(screenWidth * 0.75, screenHeight * 0.6, 'ground');
        this.platforms.create(screenWidth * 0.1, screenHeight * 0.4, 'ground');
        this.platforms.create(screenWidth * 0.9, screenHeight * 0.35, 'ground');
        
        // Additional platforms for wider screens
        if (screenWidth > 1200) {
            this.platforms.create(screenWidth * 0.5, screenHeight * 0.3, 'ground');
            this.platforms.create(screenWidth * 0.3, screenHeight * 0.7, 'ground');
        }
    }

    setupCollisions() {
        // Player vs enemies
        this.physics.add.overlap(this.player.getSprite(), this.enemies, this.playerHitEnemy, null, this);
        
        // Weapons vs enemies
        this.weaponManager.setupEnemyCollisions(this.enemies);
    }

    setupControls() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,P,R,ESC');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Mouse/touch controls for attacking
        this.input.on('pointerdown', (pointer) => {
            if (this.gameState === 'playing' && !this.player.isAttacking) {
                this.player.attack(pointer);
            }
        });
    }

    startEnemySpawning() {
        this.enemySpawnTimer = this.time.addEvent({
            delay: 3000, // Spawn every 3 seconds
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Spawn first enemy immediately
        this.spawnEnemy();
    }

    spawnEnemy() {
        if (this.gameState !== 'playing') return;

        // Random spawn position - relative to screen width
        const screenWidth = this.cameras.main.width;
        const x = Phaser.Math.Between(screenWidth * 0.7, screenWidth * 0.95);
        
        // Choose enemy type based on score
        let enemyType = 'zombie';
        const score = this.gameUI.getScore();
        
        if (score > 100) {
            const types = ['zombie', 'skeleton'];
            enemyType = Phaser.Utils.Array.GetRandom(types);
        }
        if (score > 300) {
            const types = ['zombie', 'skeleton', 'ghost'];
            enemyType = Phaser.Utils.Array.GetRandom(types);
        }
        if (score > 500 && Math.random() < 0.1) {
            enemyType = 'boss';
        }

        const enemy = new Enemy(this, x, 0, enemyType);
        this.enemies.add(enemy.getSprite());
    }

    update() {
        if (this.gameState === 'gameOver') {
            this.handleGameOverInput();
            return;
        }

        if (this.gameState === 'paused') {
            this.handlePausedInput();
            return;
        }

        // Handle pause input
        if (Phaser.Input.Keyboard.JustDown(this.wasd.P)) {
            this.pauseGame();
            return;
        }

        // Update game systems
        if (this.player) {
            this.player.update(this.cursors, this.wasd, this.spaceKey);
        }

        if (this.weaponManager) {
            this.weaponManager.update();
        }

        // Update enemies
        this.enemies.children.entries.forEach(enemySprite => {
            const enemy = enemySprite.enemyRef;
            if (enemy) {
                enemy.update(this.player);
            }
        });
    }

    handleGameOverInput() {
        if (Phaser.Input.Keyboard.JustDown(this.wasd.R)) {
            this.restartGame();
        } else if (Phaser.Input.Keyboard.JustDown(this.wasd.ESC)) {
            // Could add functionality to return to main menu
            window.location.href = '/';
        }
    }

    handlePausedInput() {
        if (Phaser.Input.Keyboard.JustDown(this.wasd.P)) {
            this.resumeGame();
        }
    }

    playerHitEnemy(playerSprite, enemySprite) {
        const enemy = enemySprite.enemyRef;
        if (!enemy) return;

        // Player takes damage
        const damage = this.player.takeDamage(enemy.getDamageAmount());
        const gameOver = this.gameUI.takeDamage(damage);

        // Remove enemy
        enemy.destroy();

        // Check for game over
        if (gameOver) {
            this.gameOver();
        }
    }

    addScore(points) {
        this.gameUI.addScore(points);
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.physics.pause();
            this.gameUI.showPauseScreen();
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.physics.resume();
            this.gameUI.hidePauseScreen();
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.physics.pause();
        this.gameUI.showGameOver();
        
        // Stop enemy spawning
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.remove();
        }
    }

    restartGame() {
        // Reset game state
        this.gameState = 'playing';
        
        // Clear enemies
        this.enemies.clear(true, true);
        
        // Clear weapons
        this.weaponManager.getWeaponsGroup().clear(true, true);
        
        // Reset UI
        this.gameUI.reset();
        
        // Reset player - position relative to screen
        const screenHeight = this.cameras.main.height;
        this.player.reset(100, screenHeight - 150);
        
        // Resume physics
        this.physics.resume();
        
        // Restart enemy spawning
        this.startEnemySpawning();
    }
}

export default GameScene;