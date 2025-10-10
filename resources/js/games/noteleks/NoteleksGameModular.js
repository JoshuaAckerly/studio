/* global Phaser */
import GameScene from './scenes/GameScene.js';
import GameConfig from './config/GameConfig.js';

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
        return {
            type: Phaser.AUTO,
            width: GameConfig.screen.width,
            height: GameConfig.screen.height,
            backgroundColor: GameConfig.screen.backgroundColor,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: GameConfig.physics.gravity,
                    debug: GameConfig.physics.debug
                }
            },
            scene: [GameScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                min: {
                    width: 400,
                    height: 300
                },
                max: {
                    width: 1600,
                    height: 1200
                }
            }
        };
    }

    initialize(containerId = 'game-container') {
        // Check if container exists
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Game container '${containerId}' not found`);
            return false;
        }

        // Create the game
        this.game = new Phaser.Game({
            ...this.config,
            parent: containerId
        });

        // Add game event listeners
        this.setupEventListeners();

        return true;
    }

    setupEventListeners() {
        // Game ready event
        this.game.events.once('ready', () => {
            console.log('🎮 Noteleks Heroes Beyond Light - Game Ready!');
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