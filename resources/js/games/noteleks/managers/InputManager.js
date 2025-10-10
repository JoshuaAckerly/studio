import GameConfig from '../config/GameConfig.js';

/**
 * Input Manager
 * Centralizes input handling and provides clean interface for game controls
 */
export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.controls = null;
        this.inputHandlers = new Map();
    }

    initialize() {
        try {
            // Create control scheme
            this.controls = {
                cursors: this.scene.input.keyboard.createCursorKeys(),
                wasd: this.scene.input.keyboard.addKeys('W,S,A,D,P,R,ESC'),
                space: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
                mouse: this.scene.input.activePointer
            };

            // Verify controls were created successfully
            if (!this.controls.cursors || !this.controls.wasd || !this.controls.space) {
                return false;
            }

            // Setup mouse/touch input
            this.scene.input.on('pointerdown', this.handlePointerDown.bind(this));
            
            return true;
        } catch (error) {
            return false;
        }
    }

    handlePointerDown(pointer) {
        // Trigger attack input handler if registered
        const attackHandler = this.inputHandlers.get('attack');
        if (attackHandler) {
            attackHandler(pointer);
        }
    }

    registerInputHandler(action, handler) {
        this.inputHandlers.set(action, handler);
    }

    unregisterInputHandler(action) {
        this.inputHandlers.delete(action);
    }

    // Movement input checks
    isMovingLeft() {
        return this.controls.cursors.left.isDown || this.controls.wasd.A.isDown;
    }

    isMovingRight() {
        return this.controls.cursors.right.isDown || this.controls.wasd.D.isDown;
    }

    isJumping() {
        return this.controls.cursors.up.isDown || 
               this.controls.wasd.W.isDown || 
               this.controls.space.isDown;
    }

    // Action input checks
    isPausePressed() {
        return Phaser.Input.Keyboard.JustDown(this.controls.wasd.P);
    }

    isRestartPressed() {
        return Phaser.Input.Keyboard.JustDown(this.controls.wasd.R);
    }

    isEscapePressed() {
        return Phaser.Input.Keyboard.JustDown(this.controls.wasd.ESC);
    }

    // Get raw controls for components that need direct access
    getControls() {
        if (!this.controls) {
            return null;
        }
        return this.controls;
    }

    // Create input state object
    getMovementInput() {
        return {
            left: this.isMovingLeft(),
            right: this.isMovingRight(),
            up: this.isJumping(),
            attack: false // Handled via pointer events
        };
    }

    shutdown() {
        this.inputHandlers.clear();
        if (this.scene.input) {
            this.scene.input.off('pointerdown', this.handlePointerDown);
        }
    }
}

export default InputManager;