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

// Initialize the game but wait for the Spine runtime to be available so the plugin
// constructor can be detected and registered in the Phaser config. This avoids
// race conditions where the game is created before the spine plugin is ready.
function bootstrap() {
    const game = NoteleksGame.create('phaser-game');

    if (game && typeof window !== 'undefined') {
        window.noteleksGame = game;
    }

    return game;
}

// If spine runtime is already loaded, start immediately. Otherwise wait for the
// window load event which should fire after external scripts are executed.
if (typeof window !== 'undefined') {
    if (window.spine) {
        bootstrap();
    } else {
        window.addEventListener('load', () => {
            if (window.spine) {
                console.info('[NoteleksMain] Spine runtime detected on load, bootstrapping game');
            } else {
                console.info('[NoteleksMain] Spine runtime not detected on load, bootstrapping anyway (adapter will be used)');
            }
            bootstrap();
        }, { once: true });
    }
}

export default null;
