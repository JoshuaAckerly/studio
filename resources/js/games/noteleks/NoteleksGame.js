/* global Phaser */
import GameScene from './GameScene.js';

/**
 * Main game class that initializes and configures the Phaser game
 */
class NoteleksGame {
    constructor() {
        this.config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-game',
            backgroundColor: '#1a1a2e',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 300 },
                    debug: false // Set to true for physics debugging
                }
            },
            scene: GameScene,
            plugins: {
                scene: this.getSpinePlugin()
            }
        };

        this.game = null;
        this.initialize();
    }

    getSpinePlugin() {
        // Check if Spine plugin is available
        if (typeof window.spine !== 'undefined' && window.spine.SpinePlugin) {
            return [{
                key: 'spine.SpinePlugin',
                plugin: window.spine.SpinePlugin,
                mapping: 'spine',
                start: true
            }];
        }
        return [];
    }

    initialize() {
        try {
            console.log('Initializing Noteleks Heroes Beyond Light...');
            this.game = new Phaser.Game(this.config);
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showErrorMessage(error);
        }
    }

    showErrorMessage(error) {
        const gameContainer = document.getElementById('phaser-game');
        if (gameContainer) {
            gameContainer.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 600px;
                    background: #1a1a2e;
                    color: #ff4444;
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                ">
                    <h2>Game Failed to Load</h2>
                    <p>There was an error initializing the game:</p>
                    <code style="background: #000; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        ${error.message}
                    </code>
                    <p>Please refresh the page to try again.</p>
                    <button onclick="window.location.reload()" style="
                        padding: 10px 20px;
                        background: #4ade80;
                        border: none;
                        border-radius: 5px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        margin-top: 10px;
                    ">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }

    getGame() {
        return this.game;
    }

    getScene(sceneKey = 'GameScene') {
        return this.game ? this.game.scene.getScene(sceneKey) : null;
    }

    pauseGame() {
        const scene = this.getScene();
        if (scene && scene.pauseGame) {
            scene.pauseGame();
        }
    }

    resumeGame() {
        const scene = this.getScene();
        if (scene && scene.resumeGame) {
            scene.resumeGame();
        }
    }

    restartGame() {
        const scene = this.getScene();
        if (scene && scene.restartGame) {
            scene.restartGame();
        }
    }

    togglePause() {
        const scene = this.getScene();
        if (scene) {
            if (scene.gameState === 'playing') {
                scene.pauseGame();
            } else if (scene.gameState === 'paused') {
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
}

export default NoteleksGame;