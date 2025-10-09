/* global Phaser */
import NoteleksGame from './NoteleksGame.js';

/**
 * Main entry point for Noteleks Heroes Beyond Light
 * Handles game initialization and DOM integration
 */
class GameMain {
    constructor() {
        this.game = null;
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) {
            console.warn('Game already initialized');
            return;
        }

        console.log('Starting Noteleks Heroes Beyond Light...');
        
        try {
            // Create the game instance
            this.game = new NoteleksGame();
            
            // Store global reference for debugging
            window.gameInstance = this.game;
            
            // Setup DOM controls
            this.setupDOMControls();
            
            this.isInitialized = true;
            console.log('Game initialization complete');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showInitializationError(error);
        }
    }

    setupDOMControls() {
        // Pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.togglePause();
                this.updatePauseButtonText();
            });
        }

        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
                this.updatePauseButtonText();
            });
        }

        // Keyboard shortcuts for DOM controls
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyP':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.togglePause();
                        this.updatePauseButtonText();
                    }
                    break;
                case 'KeyR':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.restartGame();
                        this.updatePauseButtonText();
                    }
                    break;
            }
        });
    }

    togglePause() {
        if (this.game) {
            this.game.togglePause();
        }
    }

    restartGame() {
        if (this.game) {
            this.game.restartGame();
        }
    }

    updatePauseButtonText() {
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn && this.game) {
            const scene = this.game.getScene();
            if (scene) {
                pauseBtn.textContent = scene.gameState === 'paused' ? 'Resume' : 'Pause';
            }
        }
    }

    showInitializationError(error) {
        const gameContainer = document.getElementById('phaser-game');
        if (gameContainer) {
            gameContainer.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 600px;
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    color: #ff4444;
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                    border: 2px solid #4ade80;
                ">
                    <h2 style="color: #ff4444; margin-bottom: 20px;">🎮 Game Initialization Failed</h2>
                    <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 5px 0; color: #ffaa44;">Error Details:</p>
                        <code style="
                            display: block;
                            background: #000;
                            color: #ff6666;
                            padding: 10px;
                            border-radius: 5px;
                            margin: 10px 0;
                            font-size: 12px;
                            word-break: break-word;
                        ">${error.message}</code>
                    </div>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.reload()" style="
                            padding: 12px 24px;
                            background: #4ade80;
                            border: none;
                            border-radius: 8px;
                            color: white;
                            font-weight: bold;
                            cursor: pointer;
                            margin: 5px;
                            font-size: 16px;
                        ">🔄 Reload Game</button>
                        <button onclick="console.log('Debug info:', ${JSON.stringify({
                            userAgent: navigator.userAgent,
                            webGL: !!window.WebGLRenderingContext,
                            spine: typeof window.spine !== 'undefined'
                        })})" style="
                            padding: 12px 24px;
                            background: #666;
                            border: none;
                            border-radius: 8px;
                            color: white;
                            font-weight: bold;
                            cursor: pointer;
                            margin: 5px;
                            font-size: 16px;
                        ">🔍 Debug Info</button>
                    </div>
                    <p style="margin-top: 20px; color: #888; font-size: 14px;">
                        If this problem persists, please check the browser console for more details.
                    </p>
                </div>
            `;
        }

        // Also update the external UI elements
        const scoreElement = document.getElementById('score-value');
        const healthElement = document.getElementById('health-value');
        
        if (scoreElement) scoreElement.textContent = 'Error';
        if (healthElement) healthElement.textContent = 'Error';
        
        // Disable buttons
        const pauseBtn = document.getElementById('pause-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        if (pauseBtn) {
            pauseBtn.disabled = true;
            pauseBtn.textContent = 'Game Error';
        }
        if (restartBtn) {
            restartBtn.disabled = true;
            restartBtn.textContent = 'Reload Required';
        }
    }

    getGame() {
        return this.game;
    }

    destroy() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        this.isInitialized = false;
        
        // Clean up global reference
        if (window.gameInstance === this.game) {
            delete window.gameInstance;
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const gameMain = new GameMain();
    gameMain.initialize();
    
    // Store reference for potential cleanup
    window.gameMain = gameMain;
});

// Handle page unload cleanup
window.addEventListener('beforeunload', () => {
    if (window.gameMain) {
        window.gameMain.destroy();
    }
});

export default GameMain;