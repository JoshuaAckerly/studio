import PhysicsManager from './PhysicsManager.js';

/**
 * InputHandler - Manages keyboard input for the player
 * Extracted from Player class for better separation of concerns
 */
class InputHandler {
    constructor(scene) {
        this.scene = scene;
        this.keys = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 300; // milliseconds - matches animation duration
        this.physicsManager = new PhysicsManager(scene);
        this.lastJumpKeyState = false; // Track jump key state for edge detection
        
        this.setupKeys();
    }

    setupKeys() {
        // Create keyboard keys once
        this.keys = this.scene.input.keyboard.addKeys('W,S,A,D,UP,DOWN,LEFT,RIGHT,SPACE,R,ESC');
    }

    /**
     * Get current input state
     * @returns {Object} Input state object
     */
    getInputState() {
        if (!this.keys) return null;

        // Get keyboard input
        const keyboardState = {
            left: this.keys.LEFT.isDown || this.keys.A.isDown,
            right: this.keys.RIGHT.isDown || this.keys.D.isDown,
            up: this.keys.UP.isDown || this.keys.W.isDown,
            down: this.keys.DOWN.isDown || this.keys.S.isDown,
            attack: this.keys.SPACE.isDown && this.canAttack(),
            // Raw key states for other uses
            raw: {
                left: this.keys.LEFT.isDown,
                right: this.keys.RIGHT.isDown,
                up: this.keys.UP.isDown,
                down: this.keys.DOWN.isDown,
                a: this.keys.A.isDown,
                d: this.keys.D.isDown,
                w: this.keys.W.isDown,
                s: this.keys.S.isDown,
                space: this.keys.SPACE.isDown
            }
        };

        // Merge with touch input if available
        if (this.scene.inputManager && this.scene.inputManager.isMobileDevice()) {
            const touchState = this.scene.inputManager.getTouchState();
            return {
                left: keyboardState.left || touchState.left,
                right: keyboardState.right || touchState.right,
                up: keyboardState.up || touchState.jump,
                down: keyboardState.down || touchState.down,
                attack: (keyboardState.attack || touchState.attack) && this.canAttack(),
                raw: keyboardState.raw
            };
        }

        return keyboardState;
    }

    /**
     * Check if attack is available (cooldown check)
     */
    canAttack() {
        const currentTime = Date.now();
        return currentTime - this.lastAttackTime > this.attackCooldown;
    }

    /**
     * Register that an attack was performed
     */
    registerAttack() {
        this.lastAttackTime = Date.now();
    }

    /**
     * Process input for player movement and actions
     * @param {Object} player - Player instance
     * @param {Object} inputState - Current input state
     */
    processPlayerInput(player, inputState) {
        if (!player || !player.sprite || !player.sprite.body) return;
        if (this.scene.gameState !== 'playing') return;

        // Reset horizontal velocity
        this.physicsManager.setVelocityX(player.sprite, 0);

        // Check if player is on ground
        const isOnGround = this.physicsManager.isTouchingDown(player.sprite);

        // Handle horizontal movement
        if (inputState.left) {
            this.physicsManager.setVelocityX(player.sprite, -160);
            player.sprite.setFlipX(true);
            if (isOnGround) {
                player.playAnimation('run');
            }
        } else if (inputState.right) {
            this.physicsManager.setVelocityX(player.sprite, 160);
            player.sprite.setFlipX(false);
            if (isOnGround) {
                player.playAnimation('run');
            }
        } else if (isOnGround) {
            player.playAnimation('idle');
        }

        // Handle jump with double jump support - detect key press edge
        const jumpKeyPressed = inputState.up;
        const jumpKeyJustPressed = jumpKeyPressed && !this.lastJumpKeyState;
        
        // Update the key state for next frame
        this.lastJumpKeyState = jumpKeyPressed;

        if (jumpKeyJustPressed) {
            // Try to jump (will work for first and second jump)
            const movementComponent = player.getComponent('movement');
            if (movementComponent && movementComponent.jump()) {
                player.playAnimation('jump', false);
            }
        }

        // Play jump animation while in air
        if (!isOnGround) {
            player.playAnimation('jump', false);
        }

        // Handle attack
        if (inputState.attack) {
            this.registerAttack();
            player.playAnimation('attack', false);
            player.createMeleeHitbox();
        }
    }

    /**
     * Check if restart key is pressed
     */
    isRestartPressed() {
        return this.keys && Phaser.Input.Keyboard.JustDown(this.keys.R);
    }

    /**
     * Check if escape key is pressed
     */
    isEscapePressed() {
        return this.keys && Phaser.Input.Keyboard.JustDown(this.keys.ESC);
    }

    /**
     * Update method called each frame
     */
    update() {
        // Handle global keys
        if (this.isEscapePressed()) {
            try {
                if (typeof window !== 'undefined') window.location.href = '/';
            } catch (e) {}
        }
        
        // Handle restart in game over state
        if (this.scene.gameState === 'gameOver' && this.isRestartPressed()) {
            this.scene.restartGame();
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.keys = null;
        this.scene = null;
        this.physicsManager = null;
    }
}

export default InputHandler;