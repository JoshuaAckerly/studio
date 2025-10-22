// import GameConfig from '../config/GameConfig.js';
import TouchInputComponent from '../components/TouchInputComponent.js';

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
        this._onFirstTouch = this._onFirstTouch.bind(this);
        this._onFirstPointer = this._onFirstPointer.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
    }

    initialize() {
        try {
            // Initialize touch input component
            this.touchInput = new TouchInputComponent(this.scene);
            this.isMobile = this.touchInput.isMobileDevice();

            console.log('InputManager: Mobile device detected:', this.isMobile);
            console.log('InputManager: User agent:', navigator.userAgent);

            // Create control scheme (always create for desktop fallback)
            this.controls = {
                cursors: this.scene.input.keyboard.createCursorKeys(),
                wasd: this.scene.input.keyboard.addKeys('W,S,A,D,P,R,ESC'),
                space: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
                mouse: this.scene.input.activePointer,
            };

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

            // Auto-detect input method at runtime: listen for the first touch or pointer/keyboard
            // Touchstart will switch to mobile controls; mouse/keyboard will switch to desktop.
            try {
                window.addEventListener('touchstart', this._onFirstTouch, { once: true, passive: true });
            } catch (e) {
                // Some test environments may not have window
            }

            try {
                window.addEventListener('mousedown', this._onFirstPointer, { once: true });
            } catch (e) {
                // ignore
            }

            // Listen for keyboard input to trigger actions (attack via space/enter/z)
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
        // On mobile, touch input component handles this
        if (this.isMobile && this.touchInput) {
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
    _onFirstTouch() {
        if (!this.isMobile) {
            this.isMobile = true;
            if (!this.touchInput) {
                this.touchInput = new (require('../components/TouchInputComponent.js').default)(this.scene);
            }
            if (this.touchInput && !this.touchInput.isEnabled) {
                this.touchInput.initialize();
            }
            // Ensure mobile area is visible
            if (this.touchInput && this.touchInput.setMobileAreaVisible) {
                this.touchInput.setMobileAreaVisible(true);
            }
            this.showTouchControls(true);
            console.log('InputManager: Switched to mobile input (first touch detected)');
        }
    }

    /**
     * Called when the first pointer (mouse) is observed — switch to desktop controls.
     */
    _onFirstPointer() {
        if (this.isMobile) {
            this.isMobile = false;
            // Hide the mobile area when a pointer/mouse is used
            if (this.touchInput && this.touchInput.setMobileAreaVisible) {
                this.touchInput.setMobileAreaVisible(false);
            }
            this.showTouchControls(false);
            console.log('InputManager: Switched to desktop input (pointer detected)');
        }
    }

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
        if (this.isMobile && this.touchInput) {
            const touchState = this.touchInput.getTouchState();
            return touchState.left;
        }
        return this.controls.cursors.left.isDown || this.controls.wasd.A.isDown;
    }

    isMovingRight() {
        if (this.isMobile && this.touchInput) {
            const touchState = this.touchInput.getTouchState();
            return touchState.right;
        }
        return this.controls.cursors.right.isDown || this.controls.wasd.D.isDown;
    }

    isJumping() {
        if (this.isMobile && this.touchInput) {
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
        if (this.isMobile) {
            return false; // Implement pause button in UI for mobile
        }
        return Phaser.Input.Keyboard.JustDown(this.controls.wasd.P);
    }

    isRestartPressed() {
        // On mobile, restart is typically via UI button
        if (this.isMobile) {
            return false; // Implement restart button in UI for mobile
        }
        return Phaser.Input.Keyboard.JustDown(this.controls.wasd.R);
    }

    isEscapePressed() {
        // On mobile, escape is typically via UI button
        if (this.isMobile) {
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
        if (this.isMobile && this.touchInput) {
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
