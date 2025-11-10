import AttackComponent from '../components/AttackComponent.js';
import HealthComponent from '../components/HealthComponent.js';
import InputComponent from '../components/InputComponent.js';
import MovementComponent from '../components/MovementComponent.js';
import PhysicsComponent from '../components/PhysicsComponent.js';
import GameConfig from '../config/GameConfig.js';
import GameObject from '../core/GameObject.js';
import AnimationManager from '../managers/AnimationManager.js';
import InputHandler from '../managers/InputHandler.js';
import PhysicsManager from '../managers/PhysicsManager.js';

/**
 * Player Entity - Clean Version
 * Simplified player character with essential functionality only
 */
class Player extends GameObject {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Animation states
        this._isJumping = false;
        this._isAttacking = false;
        this.animationManager = null;
        
        // Input handler
        this.inputHandler = new InputHandler(scene);
        
        // Physics manager
        this.physicsManager = new PhysicsManager(scene);
        
        // Create player and setup components
        this.createPlayer();
        this.setupComponents();
    }

    createPlayer() {
        // Use WebP sprite
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'skeleton-idle-0');
        console.log('[Player] WebP sprite created - Dimensions:', this.sprite.width, 'x', this.sprite.height);
        
        this.sprite.playerRef = this;
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setScale(GameConfig.player.scale);
        this.sprite.setVisible(true);
        this.sprite.setDepth(100);
        
        // Setup physics using PhysicsManager
        this.physicsManager.setupPlayerPhysics(this.sprite);
        
        // Initialize animation manager
        this.animationManager = new AnimationManager(this.sprite, this.scene);
        this.animationManager.play('player-idle', true);
    }

    playAnimation(name, loop = true) {
        if (!this.animationManager) return;
        
        // Map game animation names to player animation names
        let animKey = null;
        if (name === 'idle') animKey = 'player-idle';
        else if (name === 'run') animKey = 'player-run';
        else if (name === 'attack') animKey = 'player-attack';
        else if (name === 'jump') animKey = 'player-jump';
        
        if (animKey) {
            this.animationManager.play(animKey, loop);
        }
    }

    setupComponents() {
        const config = GameConfig.player;

        // Add physics component
        this.addComponent('physics', new PhysicsComponent({
            bounce: 0.2,
            collideWorldBounds: true,
        }));

        // Add movement component
        this.addComponent('movement', new MovementComponent(config.speed, config.jumpPower));

        // Add health component
        this.addComponent('health', new HealthComponent(config.health, config.maxHealth));

        // Add input component
        this.addComponent('input', new InputComponent());

        // Add attack component
        this.addComponent('attack', new AttackComponent());

        // Setup component callbacks
        this.setupComponentCallbacks();
    }

    setupComponentCallbacks() {
        // Health component callbacks
        const healthComponent = this.getComponent('health');
        healthComponent.onDeath(() => {
            this.scene.gameOver();
        });

        // Attack component callbacks
        const attackComponent = this.getComponent('attack');
        attackComponent.onAttack((target, facing, damage) => {
            // Handle attack logic here if needed
        });
    }

    update() {
        if (this.scene.gameState !== 'playing') return;
        if (!this.sprite || !this.sprite.body) return;

        // Get input state from InputHandler
        const inputState = this.inputHandler.getInputState();
        if (inputState) {
            this.inputHandler.processPlayerInput(this, inputState);
        }
        
        // Update InputHandler
        this.inputHandler.update();
    }



    createMeleeHitbox() {
        const enemyGroup = this.scene.enemyManager?.enemies;
        if (!enemyGroup) return;

        const onHitCallback = (enemy, enemySprite, facing) => {
            // Apply knockback
            this.physicsManager.applyKnockback(enemySprite, facing);
            
            // Stun the enemy
            const aiComponent = enemy.getComponent('ai');
            if (aiComponent) {
                const knockbackConfig = GameConfig.combat.knockback;
                aiComponent.stun(knockbackConfig.stunDuration);
                console.log('[Player] Enemy stunned for', knockbackConfig.stunDuration, 'ms');
            }
            
            // Apply damage
            const damage = 1;
            const score = enemy.takeDamage(damage);
            
            console.log('[Player] Hit enemy, health remaining:', enemy.getHealth());
            
            if (score && this.scene.addScore) {
                this.scene.addScore(score);
            }
        };

        this.physicsManager.createMeleeHitbox(this, enemyGroup, onHitCallback);
    }

    takeDamage(amount) {
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            return healthComponent.takeDamage(amount);
        }
        return { died: false, currentHealth: 0 };
    }

    heal(amount) {
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            healthComponent.heal(amount);
        }
    }

    getHealth() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.getHealth() : 0;
    }

    getMaxHealth() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.getMaxHealth() : 0;
    }

    isAlive() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.isAlive() : false;
    }

    reset(x, y) {
        // Reset position
        this.setPosition(x, y);

        // Reset health
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            healthComponent.reset();
        }

        // Reset movement
        const movementComponent = this.getComponent('movement');
        if (movementComponent) {
            movementComponent.stopHorizontal();
        }

        // Reset sprite
        if (this.sprite) {
            this.sprite.setPosition(x, y);
            this.physicsManager.resetVelocity(this.sprite);
        }

        // Reset animation states
        this._isJumping = false;
        this._isAttacking = false;
        this.playAnimation('idle', true);
    }

    destroy() {
        // Clean up InputHandler
        if (this.inputHandler) {
            this.inputHandler.destroy();
            this.inputHandler = null;
        }
        
        // Clean up PhysicsManager reference
        this.physicsManager = null;
        
        // Call parent destroy if it exists
        if (super.destroy) {
            super.destroy();
        }
    }
}

export default Player;