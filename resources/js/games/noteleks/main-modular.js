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
const game = NoteleksGame.create('phaser-game');

if (game) {
    // Expose game instance globally (optional)
    if (typeof window !== 'undefined') {
        window.noteleksGame = game;
    }
}

export default game;
