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

        // Log plugin registration status once a scene is booted
        this.game.events.once('ready', () => {
            const scene = this.game.scene.getScene('GameScene');
            if (scene) {
                console.info('[NoteleksGame] Scene ready. scene.load.spine available:', typeof scene.load.spine === 'function');

                // If the scene doesn't have spine methods but the runtime exposes a SpinePlugin
                // constructor, instantiate it and map its methods onto the scene to provide
                // scene.add.spine and scene.load.spine at runtime.
                try {
                    if (typeof scene.load.spine !== 'function' && window.spine && typeof window.spine.SpinePlugin === 'function') {
                        console.info('[NoteleksGame] Attempting to instantiate window.spine.SpinePlugin at runtime');
                        // The ScenePlugin constructor typically expects the Scene Systems object
                        const pluginInstance = new window.spine.SpinePlugin(scene.sys);

                        // If the plugin provides add/load methods, bind them to the scene
                        if (pluginInstance && typeof pluginInstance.add === 'function') {
                            scene.add.spine = pluginInstance.add.bind(pluginInstance);
                        }
                        if (pluginInstance && typeof pluginInstance.load === 'function') {
                            scene.load.spine = pluginInstance.load.bind(pluginInstance);
                        }

                        console.info('[NoteleksGame] SpinePlugin instance created and mapped to scene.add/scene.load where available');
                    }
                } catch (e) {
                    console.warn('[NoteleksGame] Failed to instantiate SpinePlugin at runtime:', e);
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
