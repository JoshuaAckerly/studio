import GameConfig from '../config/GameConfig.js';
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
                mouse: this.scene.input.activePointer
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
            return touchState.up;
        }
        return this.controls.cursors.up.isDown || 
               this.controls.wasd.W.isDown || 
               this.controls.space.isDown;
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
            attack: false // Handled via pointer events
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