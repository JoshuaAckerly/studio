/* global Phaser */
import GameConfig from '../config/GameConfig.js';
import Player from '../entities/Player.js';
import AssetManager from '../utils/AssetManager.js';
import { GameStateUtils } from '../utils/GameUtils.js';

// Managers
import EnemyManager from '../managers/EnemyManager.js';
import InputManager from '../managers/InputManager.js';
import PlatformManager from '../managers/PlatformManager.js';

// Legacy imports (to be refactored)
import GameObjectFactory from '../factories/GameObjectFactory.js';
import GameUI from '../GameUI.js';
import SystemManager from '../systems/SystemManager.js';
import WeaponManager from '../WeaponManager.js';

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

    async create() {
        this.gameState = GameStateUtils.STATES.PLAYING;

        // Initialize core systems in the correct order
        this.initializeManagers(); // Creates managers, initializes input only
        this.createGameWorld(); // Creates textures, then initializes platform & enemy managers
    await this.setupGameObjects(); // Creates player and other game objects (waits for spine data)
        this.setupCollisions(); // Sets up physics collisions
        this.registerInputHandlers(); // Registers input event handlers

        // Start game systems
        this.startGame();

        // Defensive retry: if AssetManager.setupSpineData didn't run or the
        // spine cache wasn't prepared during preload (race), try again shortly
        // after create to ensure skeleton data is available for the Player.
        try {
            setTimeout(() => {
                try {
                    const hasCache = this.cache && this.cache.custom && this.cache.custom['spine-skeleton-data'];
                    if (!hasCache) {
                        const ok = AssetManager.setupSpineData(this);
                        console.info('[GameScene] Retried AssetManager.setupSpineData, success=', !!ok);
                    } else {
                        console.info('[GameScene] Spine skeleton data already present in cache');
                    }
                } catch (e) {
                    console.warn('[GameScene] Retry setupSpineData failed:', e && e.message);
                }
            }, 500);
        } catch (e) {
            // ignore
        }
    }

    initializeManagers() {
        // Initialize all managers (but don't initialize them yet)
        this.enemyManager = new EnemyManager(this);
        this.inputManager = new InputManager(this);
        this.platformManager = new PlatformManager(this);

        // Initialize legacy systems
        this.weaponManager = new WeaponManager(this);
        this.gameUI = new GameUI(this);

        // Initialize only input manager first (doesn't need textures)
        this.inputManager.initialize();

        // NOTE: PlatformManager will be initialized AFTER textures are created
        // NOTE: EnemyManager will be initialized AFTER textures are created

        // Initialize legacy systems
        this.systemManager.registerSystem('weaponManager', this.weaponManager);
        this.systemManager.registerSystem('gameUI', this.gameUI);
        this.systemManager.initialize();
    }

    createGameWorld() {
        // Set physics world bounds
        this.physics.world.setBounds(0, 0, GameConfig.screen.width, GameConfig.screen.height);

        // Create placeholder textures FIRST
        AssetManager.createPlaceholderTextures(this, GameConfig);

        // Create background
        this.add.image(GameConfig.screen.width / 2, GameConfig.screen.height / 2, 'background');

        // NOW initialize platform manager (after textures exist)
        this.platformManager.initialize();
        this.platforms = this.platformManager.getPlatforms();

        // Initialize enemy manager after textures exist
        this.enemyManager.initialize();
    }

    async setupGameObjects() {
        // Wait for spine skeleton data to be available to avoid the player
        // creating a sprite fallback due to a race with the loader/plugin.
        const maxWaitMs = 2000;
        const pollInterval = 50;
        let waited = 0;
        let ready = false;

        while (waited < maxWaitMs) {
            try {
                const hasCache = this.cache && this.cache.custom && this.cache.custom['spine-skeleton-data'];
                if (hasCache) {
                    ready = true;
                    break;
                }

                // Try to (re)build the spine data from raw assets if possible
                try {
                    const ok = AssetManager.setupSpineData(this);
                    if (ok) {
                        ready = true;
                        break;
                    }
                } catch (e) {
                    // ignore and continue polling
                }
            } catch (e) {
                // ignore and continue polling
            }

            // Sleep
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, pollInterval));
            waited += pollInterval;
        }

        if (!ready) {
            console.warn('[GameScene] Spine skeleton data not ready after wait — proceeding to create Player (may fallback)');
        } else {
            console.info('[GameScene] Spine skeleton data available before Player creation');
        }

        // Create player
        const playerConfig = GameConfig.player;
        this.player = new Player(this, playerConfig.startPosition.x, playerConfig.startPosition.y);
        // Player is updated manually in GameScene, not through SystemManager

        // Initialize UI with player's starting health
        if (this.gameUI && this.player) {
            this.gameUI.updateHealth(this.player.getHealth());
        }
    }

    setupCollisions() {
        // Setup player-platform collisions
        if (this.player && this.platforms) {
            this.physics.add.collider(this.player.sprite, this.platforms);
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
            if (this.inputManager.isMobileDevice()) {
                // Mobile: use touch input state
                const touchState = this.inputManager.getMovementInput();
                this.player.updateWithInputState(touchState);
            } else {
                // Desktop: use keyboard controls
                const controls = this.inputManager.getControls();
                if (controls && controls.cursors && controls.wasd && controls.space) {
                    this.player.update(controls.cursors, controls.wasd, controls.space);
                }
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
        this.add
            .text(GameConfig.screen.width / 2, GameConfig.screen.height / 2, 'Loading Noteleks Heroes...', {
                fontSize: '24px',
                fill: '#4ade80',
                fontFamily: 'Arial',
            })
            .setOrigin(0.5);
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
        this.player.reset(playerConfig.startPosition.x, playerConfig.startPosition.y);

        // Update UI with reset health
        if (this.gameUI && this.player) {
            this.gameUI.updateHealth(this.player.getHealth());
        }

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
