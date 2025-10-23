/* global Phaser */
import GameConfig from './config/GameConfig.js';
import GameScene from './scenes/GameScene.js';

// Spine plugin is imported dynamically inside initialize() to keep the main
// bundle smaller and allow code-splitting. Do not import it at top-level.

/**
 * Noteleks Game - Main Game Class
 * Refactored for modularity and maintainability
 */
class NoteleksGame {
    constructor() {
        this.game = null;
        this.config = this.createGameConfig();
    }

    createGameConfig(passedPluginConstructor) {
        // Try to detect a Spine plugin exposed on window by the spine-phaser iife.
        // The IIFE commonly exposes a global namespace `window.spine` which may contain a plugin constructor
        // such as `SpinePlugin` or `SpineGameObject`. We prefer a real constructor function to register.
        let possibleSpineGlobal = null;
        if (typeof window !== 'undefined') {
            possibleSpineGlobal = window.SpinePlugin || window.spinePlugin || window.Spine || window.spine || null;
        }

    // Start with any constructor provided by the caller (e.g. imported package)
    let pluginConstructor = passedPluginConstructor || null;
        // If the global itself is a constructor, use it
        if (possibleSpineGlobal && typeof possibleSpineGlobal === 'function') {
            pluginConstructor = possibleSpineGlobal;
            console.info('[NoteleksGame] Detected spine plugin constructor on window root.');
        }

        // If it's an object/namespace, inspect for known constructor properties
        if (!pluginConstructor && possibleSpineGlobal && typeof possibleSpineGlobal === 'object') {
            const candidateKeys = ['SpinePlugin', 'SpineGameObject', 'Spine', 'plugin', 'default'];
            for (const k of candidateKeys) {
                if (typeof possibleSpineGlobal[k] === 'function') {
                    pluginConstructor = possibleSpineGlobal[k];
                    console.info('[NoteleksGame] Found spine plugin constructor at window.spine.%s', k);
                    break;
                }
            }
        }

        let pluginsConfig = undefined;
    if (pluginConstructor) {
            pluginsConfig = {
                scene: [
                    {
                        key: 'SpinePlugin',
                        plugin: pluginConstructor,
                        mapping: 'spine',
                    },
                ],
            };
            // Persist constructor so we can attempt to install it later if needed
            this._spinePluginConstructor = pluginConstructor;
        } else if (possibleSpineGlobal) {
            console.info('[NoteleksGame] Detected spine global, but no plugin constructor found. Will not register as Phaser plugin.');
        } else {
            console.info('[NoteleksGame] No spine global detected on window.');
        }

        return {
            type: Phaser.AUTO,
            width: GameConfig.screen.width,
            height: GameConfig.screen.height,
            backgroundColor: GameConfig.screen.backgroundColor,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: GameConfig.physics.gravity,
                    debug: GameConfig.physics.debug,
                },
            },
            plugins: pluginsConfig,
            scene: [GameScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                min: {
                    width: 400,
                    height: 300,
                },
                max: {
                    width: 1600,
                    height: 1200,
                },
            },
        };
    }

    async initialize(containerId = 'phaser-game') {
        console.info('[NoteleksGame] initialize start, containerId=%s', containerId);

        // Check if container exists
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('[NoteleksGame] initialize aborted: container not found:', containerId);
            return false;
        }

        // Try to dynamically import the spine-phaser plugin so we can pass its
        // constructor into the Phaser config. If that fails, we fall back to
        // detecting window.spine at runtime (existing behavior).
        let spinePluginConstructor = null;
        try {
            const mod = await import('@esotericsoftware/spine-phaser-v3');
            // The package exports a plugin; try common export names
            spinePluginConstructor = mod?.default?.SpinePlugin || mod?.SpinePlugin || mod?.default || mod;
            console.info('[NoteleksGame] Imported spine plugin via package');
        } catch (e) {
            console.info('[NoteleksGame] Could not import spine package, will fallback to window global detection');
        }

        // Build the actual config now, preferring the imported constructor if any
        const finalConfig = this.createGameConfig(spinePluginConstructor || this._spinePluginConstructor);

        console.info('[NoteleksGame] Creating Phaser.Game with final config (plugins may be registered by Phaser)');
        this.game = new Phaser.Game({
            ...finalConfig,
            parent: containerId,
        });
        console.info('[NoteleksGame] Phaser.Game instance created:', !!this.game);
        // Phaser will auto-add the scene(s) declared in config.scene and start them.

        // After boot, verify plugin/loader presence and install fallback adapter if needed
        this.game.events.once('ready', () => {
            const scene = this.game.scene.getScene('GameScene');
            if (!scene) return;
            console.info('[NoteleksGame] Scene ready. scene instance:', scene && scene.sys && scene.sys.settings && scene.sys.settings.key);
            console.info('[NoteleksGame] scene.load.spine available:', typeof (scene.load && scene.load.spine) === 'function');

            // If the loader/plugin isn't available at this point we will keep our adapter
            // wrapper in place below to prefer cached data or fall back to a safe image.

            // Install adapter/wrapper if loader/add are still missing
            try {
                if (typeof scene.add.spine !== 'function') {
                    // Plugin add missing: install a simple fallback that creates a static image
                    // from the preloaded noteleks texture. Avoid attempting to construct
                    // SpineGameObject directly because it expects plugin internals.
                    console.info('[NoteleksGame] scene.add.spine missing - installing safe image fallback');
                    scene.add.spine = function(x = 0, y = 0, keyOrSkeletonKey, initialAnim = 'idle', loop = true) {
                        try {
                            if (scene.textures.exists('noteleks-texture')) {
                                const img = scene.add.image(x, y, 'noteleks-texture').setOrigin(0.5, 1);
                                console.info('[NoteleksGame] Created image fallback for spine (plugin absent)');
                                return img;
                            }
                        } catch (e) {
                            console.warn('[NoteleksGame] Image fallback failed for scene.add.spine:', e);
                        }
                        return null;
                    };
                    console.info('[NoteleksGame] Installed safe scene.add.spine fallback');
                } else if (typeof scene.add.spine === 'function') {
                    // Wrap existing plugin add to provide a safe fallback if the plugin add
                    // throws due to missing loader cache or other initialization issues.
                    const original = scene.add.spine;
                    scene.add.spine = function(x = 0, y = 0, keyOrSkeletonKey, initialAnim = 'idle', loop = true) {
                        try {
                            return original.call(scene, x, y, keyOrSkeletonKey, initialAnim, loop);
                        } catch (err) {
                            console.warn('[NoteleksGame] scene.add.spine plugin add threw an error, using image fallback:', err);
                            try {
                                if (scene.textures.exists('noteleks-texture')) {
                                    const img = scene.add.image(x, y, 'noteleks-texture').setOrigin(0.5, 1);
                                    return img;
                                }
                            } catch (e) {
                                console.warn('[NoteleksGame] Image fallback failed after plugin error:', e);
                            }
                            return null;
                        }
                    };
                    console.info('[NoteleksGame] Wrapped existing scene.add.spine to use plugin add with image fallback');
                }
            } catch (e) {
                console.warn('[NoteleksGame] Failed to install spine adapter:', e);
            }
        });

        // Add game event listeners
        console.info('[NoteleksGame] Installing event listeners');
        this.setupEventListeners();

        return true;
    }

    setupEventListeners() {
        // Game ready event
        this.game.events.once('ready', () => {
            // Game is ready
        });

        // Handle browser visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Handle window focus
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
    }

    pause() {
        if (this.game && this.game.scene) {
            const scene = this.game.scene.getScene('GameScene');
            if (scene && scene.gameState === 'playing') {
                scene.pauseGame();
            }
        }
    }

    resume() {
        if (this.game && this.game.scene) {
            const scene = this.game.scene.getScene('GameScene');
            if (scene && scene.gameState === 'paused') {
                scene.resumeGame();
            }
        }
    }

    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }

    // Utility methods for external integration
    getGame() {
        return this.game;
    }

    getScene(key = 'GameScene') {
        return this.game ? this.game.scene.getScene(key) : null;
    }

    isRunning() {
        return this.game && this.game.isRunning;
    }

    getConfig() {
        return this.config;
    }

    // Static factory method
    // Static factory method
    static async create(containerId) {
        const game = new NoteleksGame();
        try {
            const success = await game.initialize(containerId);
            return success ? game : null;
        } catch (e) {
            return null;
        }
    }
}

export default NoteleksGame;
