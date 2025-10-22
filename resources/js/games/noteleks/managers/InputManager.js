// import GameConfig from '../config/GameConfig.js';
import TouchInputComponent from '../components/TouchInputComponent.js';
import { InputUtils } from '../utils/GameUtils.js';
import InputModeController from './InputModeController.js';

/**
 * Input Manager
 * Centralizes input handling and provides clean interface for game controls
 */
export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.controls = null;
        this.inputHandlers = new Map();
        this.touchInput = null;
        this.isMobile = false;
        // Bound handlers for adding/removing event listeners
    this._onKeyDown = this._onKeyDown.bind(this);
    }

    initialize() {
        try {
            // Initialize touch input component
            this.touchInput = new TouchInputComponent(this.scene);
            this.isMobile = this.touchInput.isMobileDevice();
            // InputModeController handles runtime auto-detection and visibility
            this.inputMode = new InputModeController(this.scene, this.touchInput);
            this.inputMode.initialize();

            console.log('InputManager: Mobile device detected:', this.isMobile);
            console.log('InputManager: User agent:', navigator.userAgent);

            // Create control scheme (always create for desktop fallback)
            this.controls = InputUtils.createControlScheme(this.scene);

            // Verify controls were created successfully
            if (!this.controls.cursors || !this.controls.wasd || !this.controls.space) {
                return false;
            }

            // Initialize touch controls if on mobile
            if (this.isMobile) {
                console.log('InputManager: Initializing touch controls');
                this.touchInput.initialize();
            } else {
                console.log('InputManager: Using desktop controls');
            }

            // Keyboard handling remains in this manager for action mapping
            if (this.scene && this.scene.input && this.scene.input.keyboard) {
                this.scene.input.keyboard.on('keydown', this._onKeyDown);
            }

            // Setup pointer input (for both mouse and touch)
            this.scene.input.on('pointerdown', this.handlePointerDown.bind(this));

            return true;
        } catch (error) {
            console.error('InputManager initialization failed:', error);
            return false;
        }
    }

    handlePointerDown(pointer) {
        // Determine runtime mobile state (prefer inputMode if present)
        const runtimeIsMobile = this.inputMode ? this.inputMode.isMobileDevice() : this.isMobile;

        // On mobile, touch input component handles this
        if (runtimeIsMobile && this.touchInput) {
            // Touch input component will handle the pointer events
            // But we still need to trigger attack for screen touches outside virtual controls
            const touchState = this.touchInput.getTouchState();
            if (touchState.attack) {
                const attackHandler = this.inputHandlers.get('attack');
                if (attackHandler) {
                    attackHandler(pointer);
                }
            }
        } else {
            // Desktop mouse input
            const attackHandler = this.inputHandlers.get('attack');
            if (attackHandler) {
                attackHandler(pointer);
            }
        }
    }

    /**
     * Called when the first touch is observed on the page — switch to mobile controls.
     */


    /**
     * Keyboard handler for actions like attack/pause/restart when appropriate
     */
    _onKeyDown(event) {
        // Normalize code/name
        const code = event.code || event.key;
        // Attack keys: Space, KeyZ, Enter
        if (code === 'Space' || code === 'KeyZ' || code === 'Enter') {
            const attackHandler = this.inputHandlers.get('attack');
            const ptr = { x: this.scene.scale.width / 2, y: this.scene.scale.height / 2 };

            // On hybrid devices where touch UI exists but keyboard is used, mirror
            // the input into the touch component so virtual UI reflects the action.
            if (this.touchInput && this.touchInput.simulatePointerAttack) {
                try {
                    this.touchInput.simulatePointerAttack(ptr);
                } catch (e) {
                    // ignore
                }
            }

            if (attackHandler) {
                attackHandler(ptr);
            }
        }

        // Jump via UpArrow or KeyW
        if (code === 'ArrowUp' || code === 'KeyW') {
            if (this.touchInput && this.touchInput.simulateJumpPress) {
                try {
                    this.touchInput.simulateJumpPress();
                } catch (e) {}
            }
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
        const runtimeIsMobile2 = this.inputMode ? this.inputMode.isMobileDevice() : this.isMobile;
        if (runtimeIsMobile2 && this.touchInput) {
            const touchState = this.touchInput.getTouchState();
            return touchState.left;
        }
        return this.controls.cursors.left.isDown || this.controls.wasd.A.isDown;
    }

    isMovingRight() {
        const runtimeIsMobile3 = this.inputMode ? this.inputMode.isMobileDevice() : this.isMobile;
        if (runtimeIsMobile3 && this.touchInput) {
            const touchState = this.touchInput.getTouchState();
            return touchState.right;
        }
        return this.controls.cursors.right.isDown || this.controls.wasd.D.isDown;
    }

    isJumping() {
        const runtimeIsMobile4 = this.inputMode ? this.inputMode.isMobileDevice() : this.isMobile;
        if (runtimeIsMobile4 && this.touchInput) {
            const touchState = this.touchInput.getTouchState();
            // If joystick is active, only allow jump from the dedicated jump
            // button (touchState.up true) when joystick is not actively being used.
            if (touchState.joystickActive) {
                return false;
            }
            return touchState.up;
        }
        return this.controls.cursors.up.isDown || this.controls.wasd.W.isDown;
    }

    // Action input checks
    isPausePressed() {
        // On mobile, pause might be implemented differently (UI button)
        const runtimeIsMobile5 = this.inputMode ? this.inputMode.isMobileDevice() : this.isMobile;
        if (runtimeIsMobile5) {
            return false; // Implement pause button in UI for mobile
        }
        return Phaser.Input.Keyboard.JustDown(this.controls.wasd.P);
    }

    isRestartPressed() {
        // On mobile, restart is typically via UI button
        const runtimeIsMobile6 = this.inputMode ? this.inputMode.isMobileDevice() : this.isMobile;
        if (runtimeIsMobile6) {
            return false; // Implement restart button in UI for mobile
        }
        return Phaser.Input.Keyboard.JustDown(this.controls.wasd.R);
    }

    isEscapePressed() {
        // On mobile, escape is typically via UI button
        const runtimeIsMobile7 = this.inputMode ? this.inputMode.isMobileDevice() : this.isMobile;
        if (runtimeIsMobile7) {
            return false; // Implement back/menu button in UI for mobile
        }
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
        const runtimeIsMobile8 = this.inputMode ? this.inputMode.isMobileDevice() : this.isMobile;
        if (runtimeIsMobile8 && this.touchInput) {
            const touchState = this.touchInput.getTouchState();
            // Debug: Log touch state only when something is active
            if (touchState.left || touchState.right || touchState.up || touchState.attack) {
                console.log('InputManager: Touch state:', touchState);
            }
            return touchState;
        }

        return {
            left: this.isMovingLeft(),
            right: this.isMovingRight(),
            up: this.isJumping(),
            attack: false, // Handled via pointer events
        };
    }

    shutdown() {
        this.inputHandlers.clear();

        if (this.scene.input) {
            this.scene.input.off('pointerdown', this.handlePointerDown);
        }

        if (this.touchInput) {
            this.touchInput.destroy();
            this.touchInput = null;
        }

        if (this.inputMode) {
            try {
                this.inputMode.shutdown();
            } catch (e) {}
            this.inputMode = null;
        }

        // Remove global listeners if they were added
        try {
            window.removeEventListener('touchstart', this._onFirstTouch, { passive: true });
        } catch (e) {}
        try {
            window.removeEventListener('mousedown', this._onFirstPointer);
        } catch (e) {}
        try {
            if (this.scene && this.scene.input && this.scene.input.keyboard) {
                this.scene.input.keyboard.off('keydown', this._onKeyDown);
            }
        } catch (e) {}
    }

    // Additional mobile-specific methods
    isMobileDevice() {
        return this.isMobile;
    }

    showTouchControls(visible = true) {
        if (this.touchInput) {
            this.touchInput.setVisible(visible);
        }
    }

    getTouchInput() {
        return this.touchInput;
    }
}

export default InputManager;
