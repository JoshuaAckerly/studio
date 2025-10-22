/* global Phaser */
import GameConfig from './config/GameConfig.js';
import GameScene from './scenes/GameScene.js';

/**
 * Noteleks Game - Main Game Class
 * Refactored for modularity and maintainability
 */
class NoteleksGame {
    constructor() {
        this.game = null;
        this.config = this.createGameConfig();
    }

    createGameConfig() {
        // Try to detect a Spine plugin exposed on window by the spine-phaser iife.
        // The IIFE commonly exposes a global namespace `window.spine` which may contain a plugin constructor
        // such as `SpinePlugin` or `SpineGameObject`. We prefer a real constructor function to register.
        let possibleSpineGlobal = null;
        if (typeof window !== 'undefined') {
            possibleSpineGlobal = window.SpinePlugin || window.spinePlugin || window.Spine || window.spine || null;
        }

        let pluginConstructor = null;
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

    initialize(containerId = 'phaser-game') {
        // Check if container exists
        const container = document.getElementById(containerId);
        if (!container) {
            return false;
        }

        // Create the game
        this.game = new Phaser.Game({
            ...this.config,
            parent: containerId,
        });

        // If the plugin mapping didn't register automatically, try to install it via
        // Phaser's PluginManager which will correctly initialize plugin lifecycle.
        try {
            const scene = this.game.scene.getScene('GameScene');
            // If scene not ready yet, we'll attempt installation once when ready
            const tryInstall = () => {
                if (this._spinePluginConstructor && scene && typeof scene.load.spine !== 'function') {
                    if (this.game && this.game.plugins && typeof this.game.plugins.installScenePlugin === 'function') {
                        try {
                            console.info('[NoteleksGame] Installing Spine plugin via PluginManager.installScenePlugin');
                            this.game.plugins.installScenePlugin('SpinePlugin', this._spinePluginConstructor, 'spine');
                        } catch (e) {
                            console.warn('[NoteleksGame] installScenePlugin failed:', e);
                        }
                    }
                }
            };

            // Try immediately and again when the scene is ready
            tryInstall();
            this.game.events.once('ready', tryInstall);
        } catch (e) {
            // ignore
        }

        // Log plugin registration status once a scene is booted
        this.game.events.once('ready', () => {
            const scene = this.game.scene.getScene('GameScene');
            if (scene) {
                console.info('[NoteleksGame] Scene ready. scene.load.spine available:', typeof scene.load.spine === 'function');

                // If the scene doesn't have spine methods but the runtime exposes a SpinePlugin
                // constructor, instantiate it and map its methods onto the scene to provide
                // scene.add.spine and scene.load.spine at runtime.
                // If a SpinePlugin constructor exists on window, do NOT attempt to instantiate it here.
                // The Phaser ScenePlugin lifecycle expects the plugin to be registered via the
                // PluginManager so direct construction will often fail (missing internal context).
                if (window.spine && typeof window.spine.SpinePlugin === 'function') {
                    console.info('[NoteleksGame] Detected window.spine.SpinePlugin but will not instantiate it directly (requires PluginManager). Using fallback adapter if needed.');
                }

                // If scene.add.spine is still not available, provide a lightweight adapter that
                // constructs a SpineGameObject from cached spine data (prepared by AssetManager.setupSpineData)
                if (typeof scene.add.spine !== 'function' && window.spine && typeof window.spine.SpineGameObject === 'function') {
                    console.info('[NoteleksGame] Installing fallback scene.add.spine adapter using window.spine.SpineGameObject');

                    scene.add.spine = function (x = 0, y = 0, keyOrSkeletonKey, initialAnim = 'idle', loop = true) {
                        // Use cached skeleton and atlas prepared by AssetManager.setupSpineData
                        const cached = scene.cache.custom || {};
                        const skeletonData = cached['spine-skeleton-data'];
                        const atlas = cached['spine-atlas'];

                        if (!skeletonData || !atlas) {
                            console.warn('[NoteleksGame] No cached spine data available to create SpineGameObject');
                            return null;
                        }

                        const SpineGO = window.spine.SpineGameObject;

                        const constructorAttempts = [
                            // (scene, x, y, skeletonData, atlas)
                            (S) => new SpineGO(S, x, y, skeletonData, atlas),
                            // (scene, x, y, skeletonData)
                            (S) => new SpineGO(S, x, y, skeletonData),
                            // (scene, skeletonData, atlas)
                            (S) => new SpineGO(S, skeletonData, atlas),
                            // (scene, x, y, keyOrSkeletonKey)
                            (S) => new SpineGO(S, x, y, keyOrSkeletonKey)
                        ];

                        let spineObj = null;
                        for (const attempt of constructorAttempts) {
                            try {
                                spineObj = attempt(scene);
                                if (spineObj) break;
                            } catch (err) {
                                // ignore and try next
                            }
                        }

                        if (!spineObj) {
                            console.warn('[NoteleksGame] Unable to construct SpineGameObject with known signatures');
                            return null;
                        }

                        // Add to the scene display list and update list
                        try {
                            scene.add.existing(spineObj);
                        } catch (err) {
                            // If add.existing fails, still try to attach to displayList
                            try { scene.sys.displayList.add(spineObj); } catch (e) { /* ignore */ }
                        }

                        // Set origin/scale and initial animation when possible
                        try {
                            if (typeof spineObj.setOrigin === 'function') spineObj.setOrigin(0.5, 1);
                            if (typeof spineObj.setAnimation === 'function') {
                                spineObj.setAnimation(0, initialAnim, loop);
                            } else if (spineObj.state && typeof spineObj.state.setAnimation === 'function') {
                                spineObj.state.setAnimation(0, initialAnim, loop);
                            }
                        } catch (err) {
                            // ignore animation errors
                        }

                        return spineObj;
                    };
                } else if (typeof scene.add.spine === 'function' && window.spine && typeof window.spine.SpineGameObject === 'function') {
                    // If plugin provided scene.add.spine but assets were loaded manually into scene.cache.custom,
                    // the plugin may expect its own cache. Wrap scene.add.spine so we prefer using the cached
                    // skeleton/atlas when available to construct a SpineGameObject directly and avoid plugin cache errors.
                    try {
                        const originalAddSpine = scene.add.spine.bind(scene.add);
                        scene.add.spine = function (x = 0, y = 0, keyOrSkeletonKey, initialAnim = 'idle', loop = true) {
                            const cached = scene.cache.custom || {};
                            const skeletonData = cached['spine-skeleton-data'];
                            const atlas = cached['spine-atlas'];
                            // If we have cached data, construct SpineGameObject directly
                            if (skeletonData && atlas) {
                                try {
                                    const SpineGO = window.spine.SpineGameObject;
                                    let spineObj = null;
                                    try {
                                        spineObj = new SpineGO(scene, x, y, skeletonData, atlas);
                                    } catch (err) {
                                        try {
                                            spineObj = new SpineGO(scene, skeletonData, atlas);
                                        } catch (err2) {
                                            // fallback to original plugin add
                                            return originalAddSpine(x, y, keyOrSkeletonKey, initialAnim, loop);
                                        }
                                    }
                                    // Add to display list
                                    try { scene.add.existing(spineObj); } catch (e) { try { scene.sys.displayList.add(spineObj); } catch (e2) {} }
                                    // set animation
                                    try {
                                        if (typeof spineObj.setAnimation === 'function') spineObj.setAnimation(0, initialAnim, loop);
                                        else if (spineObj.state && typeof spineObj.state.setAnimation === 'function') spineObj.state.setAnimation(0, initialAnim, loop);
                                    } catch (e) {}
                                    return spineObj;
                                } catch (e) {
                                    console.warn('[NoteleksGame] Direct SpineGameObject construction failed, falling back to plugin add:', e);
                                    return originalAddSpine(x, y, keyOrSkeletonKey, initialAnim, loop);
                                }
                            }
                            // Otherwise defer to plugin's add
                            return originalAddSpine(x, y, keyOrSkeletonKey, initialAnim, loop);
                        };
                        console.info('[NoteleksGame] Wrapped scene.add.spine to use cached spine data when available');
                    } catch (e) {
                        console.warn('[NoteleksGame] Failed to wrap scene.add.spine:', e);
                    }
                }
            }
        });
        // Add game event listeners
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
    static create(containerId) {
        const game = new NoteleksGame();
        const success = game.initialize(containerId);
        return success ? game : null;
    }
}

export default NoteleksGame;
