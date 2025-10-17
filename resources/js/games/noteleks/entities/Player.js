import AttackComponent from '../components/AttackComponent.js';
import HealthComponent from '../components/HealthComponent.js';
import InputComponent from '../components/InputComponent.js';
import MovementComponent from '../components/MovementComponent.js';
import PhysicsComponent from '../components/PhysicsComponent.js';
import GameConfig from '../config/GameConfig.js';
import GameObject from '../core/GameObject.js';

/**
 * Player Entity
 * Represents the player character with all necessary components
 */
class Player extends GameObject {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.createPlayer();
        this.setupComponents();
    }

    createPlayer() {
        // Create player sprite with physics
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'skeleton');

        // Store reference to this player class in the sprite
        this.sprite.playerRef = this;
    }

    setupComponents() {
        const config = GameConfig.player;

        // Add physics component
        this.addComponent(
            'physics',
            new PhysicsComponent({
                bounce: 0.2,
                collideWorldBounds: true,
                bodyWidth: 32,
                bodyHeight: 48,
            }),
        );

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
            // Player death logic
            this.scene.gameOver();
        });

        // Attack component callbacks
        const attackComponent = this.getComponent('attack');
        attackComponent.onAttack((target, facing, _damage) => {
            // Handle attack logic
            if (this.scene.weaponManager) {
                const direction = facing || this.getComponent('movement').getFacing();
                this.scene.weaponManager.createWeapon(this.sprite.x, this.sprite.y, direction, target);
            }
        });
    }

    update(cursors, wasd, spaceKey) {
        if (this.scene.gameState !== 'playing') return;

        // Check if this is being called from SystemManager with deltaTime only
        if (typeof cursors === 'number' && wasd === undefined && spaceKey === undefined) {
            // This is a deltaTime call from SystemManager - just update base components
            super.update(cursors);
            return;
        }

        // Defensive check for input objects
        if (!cursors || !wasd || !spaceKey) {
            return;
        }

        // Update all components first
        super.update(16); // 16ms for 60fps

        // Handle input
        const inputComponent = this.getComponent('input');
        const movementComponent = this.getComponent('movement');

        if (inputComponent && movementComponent) {
            // Create input state object
            const inputState = {
                left: cursors.left?.isDown || false || wasd.A?.isDown || false,
                right: cursors.right?.isDown || false || wasd.D?.isDown || false,
                up: cursors.up?.isDown || false || wasd.W?.isDown || false || spaceKey.isDown || false,
                attack: false, // Mouse input handled separately
            };

            this.processInputState(inputState, inputComponent, movementComponent);
        }
    }

    updateWithInputState(inputState) {
        if (this.scene.gameState !== 'playing') return;

        // Update all components first
        super.update(16); // 16ms for 60fps

        // Handle input
        const inputComponent = this.getComponent('input');
        const movementComponent = this.getComponent('movement');

        if (inputComponent && movementComponent && inputState) {
            this.processInputState(inputState, inputComponent, movementComponent);
        }
    }

    processInputState(inputState, inputComponent, movementComponent) {
        // Process movement input
        inputComponent.processInput(inputState);

        // Apply movement based on input state directly
        if (inputState.left) {
            movementComponent.moveLeft();
        } else if (inputState.right) {
            movementComponent.moveRight();
        } else {
            movementComponent.stopHorizontal();
        }

        if (inputState.up && movementComponent.isOnGround()) {
            movementComponent.jump();
        }

        // Process attack input for mobile
        if (inputState.attack) {
            this.attack();
        }
    }

    attack(pointer) {
        const attackComponent = this.getComponent('attack');
        if (attackComponent && attackComponent.canAttack()) {
            const target = pointer ? { x: pointer.x, y: pointer.y } : null;
            attackComponent.attack(target);
        }
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

        // Reset health properly using the reset method instead of heal
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            healthComponent.reset(); // This resets isDead to false and restores full health
        }

        // Reset movement
        const movementComponent = this.getComponent('movement');
        if (movementComponent) {
            movementComponent.stopHorizontal();
        }

        // Reset sprite
        if (this.sprite) {
            this.sprite.setPosition(x, y);
            this.sprite.setVelocity(0, 0);
        }
    }
}

export default Player;
