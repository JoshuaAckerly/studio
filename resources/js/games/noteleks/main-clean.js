/**
 * Noteleks Game - Clean Entry Point
 * Simplified main entry point without extensive logging and debug systems
 */

import GameConfig from './config/GameConfig.clean.js';

/**
 * Initialize the game but wait for Phaser and Spine to be available
 */
async function bootstrap() {
    try {
        const mod = await import('./NoteleksGameModular.js');
        const NoteleksGame = mod && mod.default ? mod.default : mod;
        const game = await NoteleksGame.create('phaser-game');
        
        if (game && typeof window !== 'undefined') {
            window.noteleksGame = game;
        }
        
        console.log('[Noteleks] Game initialized successfully');
        return game;
    } catch (e) {
        console.error('[Noteleks] Failed to initialize game:', e.message);
        throw e;
    }
}

if (typeof window !== 'undefined') {
    // Only auto-bootstrap when the game container is present
    const hasGameContainer = !!document.getElementById('phaser-game');
    
    if (hasGameContainer) {
        const startGame = async () => {
            // Wait for Phaser and Spine to be available
            const maxWait = 3000; // 3 seconds
            const interval = 100;
            let waited = 0;

            const checkReady = () => {
                return new Promise((resolve) => {
                    const timer = setInterval(() => {
                        if (window.Phaser) {
                            clearInterval(timer);
                            console.log('[Noteleks] Phaser detected, starting game');
                            resolve(true);
                            return;
                        }

                        waited += interval;
                        if (waited >= maxWait) {
                            clearInterval(timer);
                            console.warn('[Noteleks] Phaser not detected, starting anyway');
                            resolve(false);
                        }
                    }, interval);
                });
            };

            await checkReady();
            
            try {
                await bootstrap();
            } catch (e) {
                console.error('[Noteleks] Bootstrap failed:', e.message);
            }
        };

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            startGame();
        } else {
            window.addEventListener('load', startGame, { once: true });
        }
    } else {
        console.log('[Noteleks] Game container not found, skipping auto-start');
    }
}

export default null;