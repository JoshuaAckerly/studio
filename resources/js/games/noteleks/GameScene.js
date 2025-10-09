/* global Phaser */
import Player from './Player.js';
import Enemy from './Enemy.js';
import WeaponManager from './WeaponManager.js';
import GameUI from './GameUI.js';

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

        // Load Spine animations
        this.load.spineAtlas('noteleks-atlas', '/games/noteleks-assets/spine/characters/Noteleks.atlas');
        this.load.spineJson('noteleks-data', '/games/noteleks-assets/spine/characters/Noteleks.json');

        // Create placeholder sprites as textures
        this.createPlaceholderTextures();
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

        // Create player
        this.player = new Player(this, 100, 450);

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
        
        // Ground
        this.platforms.create(400, 568, 'ground').setScale(12.5, 1).refreshBody();
        
        // Floating platforms
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');
    }

    setupCollisions() {
        // Player vs enemies
        this.physics.add.overlap(this.player.getSprite(), this.enemies, this.playerHitEnemy, null, this);
    }

    setupControls() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,P,R,ESC');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Mouse/touch controls for weapon throwing
        this.input.on('pointerdown', (pointer) => {
            if (this.gameState === 'playing') {
                this.weaponManager.createWeapon(
                    this.player.getPosition().x,
                    this.player.getPosition().y - 10,
                    this.player.facing,
                    pointer
                );
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

        // Random spawn position
        const x = Phaser.Math.Between(600, 750);
        
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
            console.log('ESC pressed - could return to menu');
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
        
        // Reset player position
        this.player.getSprite().setPosition(100, 450);
        this.player.getSprite().setVelocity(0, 0);
        
        // Resume physics
        this.physics.resume();
        
        // Restart enemy spawning
        this.startEnemySpawning();
    }
}

export default GameScene;