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
        // The IIFE commonly exposes a global like `SpinePlugin` or `spinePlugin` or `spine`.
        let possibleSpinePlugin = null;
        if (typeof window !== 'undefined') {
            possibleSpinePlugin = window.SpinePlugin || window.spinePlugin || window.Spine || window.spine || null;
        }

        // Only register as a Phaser Scene Plugin if it's a function/constructor. Some builds expose
        // a namespace object under `window.spine`, which is not a valid plugin class for Phaser.
        let pluginsConfig = undefined;
        if (possibleSpinePlugin && typeof possibleSpinePlugin === 'function') {
            pluginsConfig = {
                scene: [
                    {
                        key: 'SpinePlugin',
                        plugin: possibleSpinePlugin,
                        mapping: 'spine',
                    },
                ],
            };
        } else if (possibleSpinePlugin) {
            // Detected something, but it's not a constructor - log for debugging and don't register.
            console.info('[NoteleksGame] Detected spine global, but it is not a plugin constructor:', typeof possibleSpinePlugin, possibleSpinePlugin);
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
