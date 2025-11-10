/**
 * InputHandler - Manages keyboard input for the player
 * Extracted from Player class for better separation of concerns
 */
class InputHandler {
    constructor(scene) {
        this.scene = scene;
        this.keys = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 500; // milliseconds
        
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

        return {
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
        player.sprite.body.setVelocityX(0);

        // Handle horizontal movement
        if (inputState.left) {
            player.sprite.body.setVelocityX(-160);
            player.sprite.setFlipX(true);
            player.playAnimation('run');
        } else if (inputState.right) {
            player.sprite.body.setVelocityX(160);
            player.sprite.setFlipX(false);
            player.playAnimation('run');
        } else {
            player.playAnimation('idle');
        }

        // Handle jump
        if (inputState.up && player.sprite.body.touching.down) {
            player.sprite.body.setVelocityY(-330);
            player.playAnimation('jump');
        }

        // Handle attack
        if (inputState.attack) {
            this.registerAttack();
            player.playAnimation('attack');
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
    }
}

export default InputHandler;