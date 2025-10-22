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
        // Create player sprite with physics (physics sprite used for collisions)
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'skeleton');
        // Store reference to this player class in the sprite
        this.sprite.playerRef = this;

        // Try to create a Spine display for the character if the runtime/plugin and assets are available.
        // We keep the physics sprite for collisions and sync the Spine visual to it, avoiding physics-plugin mismatches.
        this.spine = null;
        this._currentSpineAnim = null;

        try {
            if (this.scene.add && typeof this.scene.add.spine === 'function') {
                // Attempt to add the spine object using the key used by AssetManager ('noteleks-data')
                // If the skeleton isn't loaded yet this may throw — catch and fallback silently.
                this.spine = this.scene.add.spine(this.x, this.y, 'noteleks-data', 'idle', true);
                console.info('[Player] Spine display created via scene.add.spine', { spine: !!this.spine });
                // Slight tuning for origin/scale so it sits on the physics body
                if (typeof this.spine.setOrigin === 'function') {
                    this.spine.setOrigin(0.5, 1);
                }
                // Ensure the spine is above the physics sprite visually
                if (this.spine.setDepth) this.spine.setDepth(10);
            }
        } catch (e) {
            // Silent fallback: leave this.spine as null
            this.spine = null;
            console.info('[Player] Spine display not created, falling back to sprite visual');
        }

        // If the spine data was prepared before this Player was constructed, try to create from cache now.
        try {
            const cached = this.scene && this.scene.cache && this.scene.cache.custom ? this.scene.cache.custom : null;
            if (!this.spine && cached && (cached['spine-skeleton-data'] || cached['spine-atlas'])) {
                if (this.scene.add && typeof this.scene.add.spine === 'function') {
                    try {
                        this.spine = this.scene.add.spine(this.x, this.y, 'noteleks-data', 'idle', true);
                        if (this.spine && typeof this.spine.setOrigin === 'function') this.spine.setOrigin(0.5, 1);
                        if (this.spine && this.spine.setDepth) this.spine.setDepth(10);
                        console.info('[Player] Spine display created from cache during construction', { spine: !!this.spine });
                    } catch (err) {
                        console.warn('[Player] Failed to create spine display from cache during construction:', err);
                    }
                }
            }
        } catch (e) {
            // ignore
        }

        // If spine still wasn't ready yet, listen for the spine-ready event and try again once
        if (!this.spine && this.scene && this.scene.events && typeof this.scene.events.once === 'function') {
            this.scene.events.once('spine-ready', () => {
                try {
                    if (this.scene.add && typeof this.scene.add.spine === 'function') {
                        this.spine = this.scene.add.spine(this.x, this.y, 'noteleks-data', 'idle', true);
                        if (this.spine && typeof this.spine.setOrigin === 'function') this.spine.setOrigin(0.5, 1);
                        if (this.spine && this.spine.setDepth) this.spine.setDepth(10);
                        console.info('[Player] Spine display created on spine-ready event', { spine: !!this.spine });
                    }
                } catch (e) {
                    console.warn('[Player] Failed to create spine display on spine-ready:', e);
                }
            });
        }
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
                up: cursors.up?.isDown || false || wasd.W?.isDown || false,
                attack: false, // Mouse input handled separately
            };

            this.processInputState(inputState, inputComponent, movementComponent);
        }

        // Sync spine position/flip if available
        if (this.spine) {
            try {
                // Spine display may be a Phaser Spine Game Object with x/y properties
                this.spine.x = this.sprite.x;
                this.spine.y = this.sprite.y + (this.sprite.displayHeight / 2) - 4; // tuck into the sprite
                // Flip spine horizontally to match sprite
                if (this.sprite.flipX) {
                    if (this.spine.scaleX && this.spine.scaleX > 0) this.spine.scaleX = -Math.abs(this.spine.scaleX || 1);
                    else this.spine.scaleX = -1;
                } else {
                    if (this.spine.scaleX && this.spine.scaleX < 0) this.spine.scaleX = Math.abs(this.spine.scaleX || 1);
                    else this.spine.scaleX = 1;
                }
            } catch (e) {
                // ignore sync errors
            }
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
            this._setSpineAnimation('run', true);
        } else if (inputState.right) {
            movementComponent.moveRight();
            this._setSpineAnimation('run', true);
        } else {
            movementComponent.stopHorizontal();
            this._setSpineAnimation('idle', true);
        }

        if (inputState.up && movementComponent.isOnGround()) {
            movementComponent.jump();
            this._setSpineAnimation('jump', false);
        }

        // Process attack input for mobile
        if (inputState.attack) {
            this.attack();
            this._setSpineAnimation('attack', false);
        }
    }

    _setSpineAnimation(name, loop = true) {
        if (!this.spine) return;

        try {
            if (this._currentSpineAnim === name) return;
            if (typeof this.spine.setAnimation === 'function') {
                this.spine.setAnimation(0, name, loop);
            } else if (this.spine.state && typeof this.spine.state.setAnimation === 'function') {
                this.spine.state.setAnimation(0, name, loop);
            }
            this._currentSpineAnim = name;
        } catch (e) {
            // ignore animation errors
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
