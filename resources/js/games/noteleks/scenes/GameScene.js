/* global Phaser */
import Player from '../entities/Player.js';
import GameConfig from '../config/GameConfig.js';
import AssetManager from '../utils/AssetManager.js';
import { GameStateUtils } from '../utils/GameUtils.js';

// Managers
import EnemyManager from '../managers/EnemyManager.js';
import InputManager from '../managers/InputManager.js';
import PlatformManager from '../managers/PlatformManager.js';

// Legacy imports (to be refactored)
import WeaponManager from '../WeaponManager.js';
import GameUI from '../GameUI.js';
import SystemManager from '../systems/SystemManager.js';
import GameObjectFactory from '../factories/GameObjectFactory.js';

/**
 * Main Game Scene - Refactored for modularity
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Game state
        this.gameState = GameStateUtils.STATES.LOADING;
        
        // Core game objects
        this.player = null;
        
        // Managers
        this.enemyManager = null;
        this.inputManager = null;
        this.platformManager = null;
        this.weaponManager = null;
        this.gameUI = null;
        
        // Legacy systems (to be refactored)
        this.systemManager = new SystemManager(this);
        this.gameObjectFactory = new GameObjectFactory(this);
    }

    preload() {
        this.showLoadingScreen();
        
        // Load assets using AssetManager
        AssetManager.loadSpineAssets(this, GameConfig);
        
        // Handle spine loading completion
        this.load.on('complete', () => {
            AssetManager.setupSpineData(this);
        });
    }

    create() {
        this.gameState = GameStateUtils.STATES.PLAYING;
        
        // Initialize core systems
        this.initializeManagers();
        this.createGameWorld();
        this.setupGameObjects();
        this.setupCollisions();
        this.registerInputHandlers();
        
        // Start game systems
        this.startGame();
    }

    initializeManagers() {
        // Initialize all managers
        this.enemyManager = new EnemyManager(this);
        this.inputManager = new InputManager(this);
        this.platformManager = new PlatformManager(this);
        
        // Initialize legacy systems
        this.weaponManager = new WeaponManager(this);
        this.gameUI = new GameUI(this);
        
        // Initialize managers
        this.inputManager.initialize();
        this.platformManager.initialize();
        this.enemyManager.initialize();
        
        // Initialize legacy systems
        this.systemManager.registerSystem('weaponManager', this.weaponManager);
        this.systemManager.registerSystem('gameUI', this.gameUI);
        this.systemManager.initialize();
    }

    createGameWorld() {
        // Set physics world bounds
        this.physics.world.setBounds(0, 0, GameConfig.screen.width, GameConfig.screen.height);
        console.log('World bounds set to:', {
            x: this.physics.world.bounds.x,
            y: this.physics.world.bounds.y, 
            width: this.physics.world.bounds.width,
            height: this.physics.world.bounds.height
        });
        
        // Create background
        this.add.image(
            GameConfig.screen.width / 2, 
            GameConfig.screen.height / 2, 
            'background'
        );
        
        // Create placeholder textures
        AssetManager.createPlaceholderTextures(this, GameConfig);
        
        // Platforms are created by PlatformManager
        this.platforms = this.platformManager.getPlatforms();
    }

    setupGameObjects() {
        // Create player
        const playerConfig = GameConfig.player;
        this.player = new Player(
            this, 
            playerConfig.startPosition.x, 
            playerConfig.startPosition.y
        );
        // Player is updated manually in GameScene, not through SystemManager
    }

    setupCollisions() {
        // Setup player-platform collisions
        if (this.player && this.platforms) {
            this.physics.add.collider(this.player.sprite, this.platforms);
            console.log('Player-platform collision set up:', {
                playerSprite: !!this.player.sprite,
                playerBody: !!this.player.sprite.body,
                platforms: !!this.platforms,
                platformCount: this.platforms.children ? this.platforms.children.entries.length : 0
            });
        } else {
            console.warn('Failed to set up collisions:', { player: !!this.player, platforms: !!this.platforms });
        }
        
        // Setup collisions through managers
        this.enemyManager.setupCollisions(this.player, this.weaponManager);
    }

    registerInputHandlers() {
        // Register attack input handler
        this.inputManager.registerInputHandler('attack', (pointer) => {
            if (this.gameState === GameStateUtils.STATES.PLAYING && this.player) {
                this.player.attack(pointer);
            }
        });
    }

    startGame() {
        this.gameState = GameStateUtils.STATES.PLAYING;
    }

    update() {
        // Handle different game states
        switch (this.gameState) {
            case GameStateUtils.STATES.GAME_OVER:
                this.handleGameOverInput();
                return;
            case GameStateUtils.STATES.PAUSED:
                this.handlePausedInput();
                return;
            case GameStateUtils.STATES.PLAYING:
                this.handleGameplayUpdate();
                break;
        }
    }

    handleGameplayUpdate() {
        // Handle pause input
        if (this.inputManager.isPausePressed()) {
            this.pauseGame();
            return;
        }

        // Update core systems
        this.systemManager.update(16);

        // Update player
        if (this.player && this.inputManager) {
            const controls = this.inputManager.getControls();
            if (controls && controls.cursors && controls.wasd && controls.space) {
                this.player.update(controls.cursors, controls.wasd, controls.space);
            } else {
                console.warn('GameScene.update: Controls not properly initialized', { 
                    controls,
                    inputManager: !!this.inputManager,
                    scene: !!this.scene,
                    inputKeyboard: !!this.input?.keyboard
                });
            }
        }

        // Update managers
        this.enemyManager.update(this.player);
    }

    handleGameOverInput() {
        if (this.inputManager.isRestartPressed()) {
            this.restartGame();
        } else if (this.inputManager.isEscapePressed()) {
            // Return to main menu (if implemented)
            window.location.href = '/';
        }
    }

    handlePausedInput() {
        if (this.inputManager.isPausePressed()) {
            this.resumeGame();
        }
    }

    showLoadingScreen() {
        this.add.text(
            GameConfig.screen.width / 2, 
            GameConfig.screen.height / 2, 
            'Loading Noteleks Heroes...', 
            {
                fontSize: '24px',
                fill: '#4ade80',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
    }

    addScore(points) {
        if (this.gameUI) {
            this.gameUI.addScore(points);
        }
    }

    pauseGame() {
        if (this.gameState === GameStateUtils.STATES.PLAYING) {
            this.gameState = GameStateUtils.STATES.PAUSED;
            this.physics.pause();
            this.systemManager.pause();
            this.gameUI.showPauseScreen();
        }
    }

    resumeGame() {
        if (this.gameState === GameStateUtils.STATES.PAUSED) {
            this.gameState = GameStateUtils.STATES.PLAYING;
            this.physics.resume();
            this.systemManager.resume();
            this.gameUI.hidePauseScreen();
        }
    }

    gameOver() {
        this.gameState = GameStateUtils.STATES.GAME_OVER;
        this.physics.pause();
        this.gameUI.showGameOver();
        
        // Stop enemy spawning
        this.enemyManager.stopSpawning();
    }

    restartGame() {
        // Reset game state
        this.gameState = GameStateUtils.STATES.PLAYING;
        
        // Reset managers
        this.enemyManager.reset();
        this.weaponManager.getWeaponsGroup().clear(true, true);
        this.gameUI.reset();
        
        // Reset player
        const playerConfig = GameConfig.player;
        this.player.reset(
            playerConfig.startPosition.x, 
            playerConfig.startPosition.y
        );
        
        // Resume physics
        this.physics.resume();
    }

    shutdown() {
        // Shutdown all managers
        if (this.enemyManager) this.enemyManager.shutdown();
        if (this.inputManager) this.inputManager.shutdown();
        if (this.platformManager) this.platformManager.shutdown();
        if (this.systemManager) this.systemManager.shutdown();
        
        super.shutdown();
    }
}

export default GameScene;