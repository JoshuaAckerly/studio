/* global Phaser */
import GameConfig from '../config/GameConfig.js';
import Player from '../entities/Player.js';
import AssetManager from '../utils/AssetManager.js';
import { GameStateUtils } from '../utils/GameUtils.js';
import { QuickFix } from '../debug/QuickFix.js';
import { createSimpleSpine } from '../debug/SimpleSpineFix.js';
import { ultimateFix } from '../debug/UltimateFix.js';

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

        // Handle spine loading completion: use `once` to avoid duplicate handlers
        // and run setup to populate caches/frames as soon as the loader finishes.
        this.load.once('complete', () => {
            try {
                AssetManager.setupSpineData(this);
            } catch (e) {
                console.warn('[GameScene] AssetManager.setupSpineData in preload complete threw:', e && e.message);
            }
        });
    }

    async create() {

        this.gameState = GameStateUtils.STATES.PLAYING;

        // Expose the active scene globally for short-term debugging so
        // DevTools snippets can easily find the scene and inspect caches.
        // This is intentionally lightweight and temporary.
        try {
            if (typeof window !== 'undefined') {
                window.NOTELEKS_LAST_SCENE = this;
                try {
                    const cache = this.cache || {};
                    const js = cache.json ? Object.keys(cache.json) : [];
                    const txt = cache.text ? Object.keys(cache.text) : [];
                    const img = cache.image ? Object.keys(cache.image) : [];
                    console.info('[Noteleks-debug] window.NOTELEKS_LAST_SCENE set — cache samples:', {
                        json: js.slice(0, 40),
                        text: txt.slice(0, 40),
                        image: img.slice(0, 40),
                    });
                } catch (inner) {
                    console.info('[Noteleks-debug] window.NOTELEKS_LAST_SCENE set');
                }
            }
        } catch (e) {
            // Do not allow debug wiring to break scene creation
        }

        // Defensive: ensure spine data and atlas frames are prepared early in create
        // Some runtime/plugin orderings cause the loader-complete handler to fire
        // before plugin caches are fully consumable; calling setup here reduces
        // the race window prior to Player creation.
        try {
            AssetManager.setupSpineData(this);
        } catch (e) {
            console.warn('[GameScene] Early setupSpineData call threw:', e && e.message);
        }

        // Initialize core systems in the correct order
        this.initializeManagers(); // Creates managers, initializes input only
        this.createGameWorld(); // Creates textures, then initializes platform & enemy managers
    await this.setupGameObjects(); // Creates player and other game objects (waits for spine data)
        this.setupCollisions(); // Sets up physics collisions
        this.registerInputHandlers(); // Registers input event handlers

        // Start game systems
        this.startGame();
        


        // Emit a tiny diagnostic event so external devices (or probes)
        // can detect that the Noteleks scene has been created and is ready.
        // This helps triage devices that report the scene is never found.
        try {
            console.info('[Noteleks] scene-ready');
            this.events.emit('noteleks:scene-ready');
        } catch (e) {
            console.warn('[GameScene] Failed to emit noteleks:scene-ready', e && e.message);
        }

        // Also set a global flag and dispatch a window-level CustomEvent so
        // external probes (or devices where `window.game` isn't discoverable)
        // can still detect that the Noteleks scene has been created.
        try {
            if (typeof window !== 'undefined') {
                try {
                    window.noteleksSceneReady = true;
                    window.noteleksSceneReadyAt = new Date().toISOString();
                    // Provide minimal detail so listeners can identify the scene
                    const detail = { key: 'GameScene', at: window.noteleksSceneReadyAt };
                    window.dispatchEvent(new CustomEvent('noteleks:scene-ready', { detail }));
                    console.info('[Noteleks] window.noteleksSceneReady set and event dispatched', detail);
                } catch (we) {
                    // Some strict environments may block CustomEvent or window writes
                    console.warn('[Noteleks] Failed to set global scene-ready flag or dispatch event', we && we.message);
                }
            }
        } catch (e) {
            // ignore
        }

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

        // Watch for spine plugin registration: some environments register the
        // spine plugin after scene `create()` runs which can cause a timing
        // race where Player is created before the plugin has populated its
        // internal caches. Poll for the plugin for a short window and call
        // setupSpineData when it's detected so caches are populated.
        try {
            const watchMaxMs = 5000;
            const watchIntervalMs = 100;
            let elapsed = 0;

            if (this.sys && this.sys.spine) {
                // Already present — ensure setup run
                try {
                    console.info('[GameScene] spine plugin already present at create() — running setupSpineData');
                } catch (e) {}
                AssetManager.setupSpineData(this);
            } else if (this.sys) {
                const handle = setInterval(() => {
                    elapsed += watchIntervalMs;
                    try {
                        if (this.sys && this.sys.spine) {
                            clearInterval(handle);
                            try {
                                console.info('[GameScene] Detected spine plugin registration; calling setupSpineData');
                                if (typeof window !== 'undefined') window.noteleksSpinePluginReady = new Date().toISOString();
                            } catch (e) {}
                            AssetManager.setupSpineData(this);
                            return;
                        }
                    } catch (e) {
                        // ignore transient errors while polling
                    }

                    if (elapsed >= watchMaxMs) {
                        clearInterval(handle);
                        try { console.info('[GameScene] Spine plugin did not register within watch window'); } catch (e) {}
                    }
                }, watchIntervalMs);
            }
        } catch (e) {
            // ignore watcher failures
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
        // Prefer the explicit 'spine-ready' event emitted by AssetManager.setupSpineData,
        // but fall back to the previous polling/rebuild strategy if the event
        // doesn't arrive within timeout.
        const maxWaitMs = 2000;
        let ready = false;

        try {
            // If cache already present, proceed immediately
            const hasCache = this.cache && this.cache.custom && this.cache.custom['spine-skeleton-data'];
            if (hasCache) {
                ready = true;
                console.info('[GameScene] Spine skeleton data already present in cache');
            } else {
                // Wait for 'spine-ready' event with timeout
                await new Promise((resolve) => {
                    let resolved = false;
                    const onReady = () => {
                        if (resolved) return;
                        resolved = true;
                        resolve(true);
                    };

                    this.events.once('spine-ready', onReady);

                    // If event doesn't fire within maxWaitMs, try the rebuild/poll fallback
                    setTimeout(() => {
                        if (resolved) return;
                        resolved = true;
                        resolve(false);
                    }, maxWaitMs);
                }).then((eventFired) => {
                    if (eventFired) {
                        ready = true;
                        console.info('[GameScene] Received spine-ready before Player creation');
                    } else {
                        // Event did not fire in time; try to (re)build the spine data from raw assets
                        try {
                            const ok = AssetManager.setupSpineData(this);
                            if (ok) {
                                ready = true;
                                console.info('[GameScene] setupSpineData succeeded in fallback after timeout');
                            }
                        } catch (e) {
                            // ignore; ready remains false and we'll log below
                        }
                    }
                });
            }
        } catch (e) {
            // ignore and continue to player creation (may fallback)
            console.warn('[GameScene] Error while waiting for spine-ready:', e && e.message);
        }

        if (!ready) {
            console.warn('[GameScene] Spine skeleton data not ready after wait — proceeding to create Player (may fallback)');
        }

        // Create player
        const playerConfig = GameConfig.player;
        this.player = new Player(this, playerConfig.startPosition.x, playerConfig.startPosition.y);
        
        // Auto-fix spine creation after player is created
        setTimeout(() => {
            if (this.player && !this.player.spine) {
                try {
                    const spine = this.add.spine(this.player.sprite.x, this.player.sprite.y, 'noteleks-data', 'noteleks-data');
                    if (spine) {
                        this.player.spine = spine;
                        spine.setScale(0.3);
                        spine.setOrigin(0.5, 1);
                        spine.setDepth(500);
                        
                        // Use working animation API
                        if (spine.animationState && spine.animationState.setAnimation) {
                            spine.animationState.setAnimation(0, 'idle', true);
                        }
                        
                        // Hide physics sprite since we have spine now
                        if (this.player.sprite) this.player.sprite.setVisible(false);
                        
                        console.log('[GameScene] Auto-created spine for player');
                    }
                } catch (e) {
                    console.warn('[GameScene] Auto spine creation failed:', e.message);
                }
            }
        }, 1000);
        
        // Ensure the camera is centered on the player so it is visible on first frame
        try {
            const cam = this.cameras && this.cameras.main ? this.cameras.main : null;
            if (cam && this.player && this.player.sprite) {
                // Center immediately and start following the player for gameplay
                cam.centerOn(this.player.sprite.x, this.player.sprite.y);
                try { cam.startFollow(this.player.sprite); } catch (e) { /* ignore follow errors */ }
                console.info('[GameScene] Camera centered on player at', this.player.sprite.x, this.player.sprite.y);
            }
        } catch (e) {
            // ignore camera centering failures
        }
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
        // Diagnostic: log input mode and control availability to help trace left/right failures
        try {
            const im = this.inputManager;
            const modeReported = typeof im.isMobileDevice === 'function' ? im.isMobileDevice() : im.isMobile;
            const modeController = im.inputMode ? im.inputMode.isMobileDevice() : (im.inputMode || null);
            const controls = (typeof im.getControls === 'function') ? im.getControls() : null;
            // input diagnostics removed to reduce console noise in production
        } catch (e) {
            // ignore diagnostics errors
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
