/**
 * Noteleks Game - Modular Entry Point
 * 
 * This is the main entry point for the refactored, modular version of the game.
 * 
 * Key improvements:
 * - Configuration-driven design
 * - Modular manager system
 * - Separated concerns
 * - Better maintainability
 * - Cleaner architecture
 */

import NoteleksGame from './NoteleksGameModular.js';

// Initialize the game
const game = NoteleksGame.create('game-container');

if (game) {
    console.log('✅ Noteleks Heroes Beyond Light initialized successfully!');
    console.log('🏗️  Using modular architecture');
    
    // Expose game instance globally for debugging (optional)
    if (typeof window !== 'undefined') {
        window.noteleksGame = game;
    }
} else {
    console.error('❌ Failed to initialize Noteleks Heroes Beyond Light');
}

export default game;