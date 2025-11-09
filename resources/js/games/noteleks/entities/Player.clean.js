import AttackComponent from '../components/AttackComponent.js';
import HealthComponent from '../components/HealthComponent.js';
import InputComponent from '../components/InputComponent.js';
import MovementComponent from '../components/MovementComponent.js';
import PhysicsComponent from '../components/PhysicsComponent.js';
import GameConfig from '../config/GameConfig.js';
import GameObject from '../core/GameObject.js';

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
        this._currentSpineAnim = null;
        
        // Create player and setup components
        this.createPlayer();
        this.setupComponents();
    }

    createPlayer() {
        // Create physics sprite for collisions
        try {
            this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'skeleton');
            this.sprite.playerRef = this;
            this.sprite.setOrigin(0.5, 1);
            this.sprite.setScale(GameConfig.player.scale);
            this.sprite.setVisible(true);
        } catch (e) {
            console.warn('[Player] Failed to create physics sprite:', e.message);
            return;
        }

        // Try to create Spine display
        this.spine = null;
        this.createSpineDisplay();
    }

    createSpineDisplay() {
        try {
            // Check if Spine plugin is available
            if (!this.scene.add.spine) {
                console.warn('[Player] Spine plugin not available, using fallback');
                return;
            }

            // Create Spine display
            this.spine = this.scene.add.spine(this.x, this.y, 'noteleks-data', 'noteleks-data');
            
            if (this.spine) {
                this.spine.setOrigin(0.5, 1);
                this.spine.setScale(GameConfig.player.scale);
                this.spine.setDepth(500);
                
                // Set initial animation
                this.setSpineAnimation('idle', true);
                
                // Hide physics sprite since we have Spine
                this.sprite.setVisible(false);
                
                console.log('[Player] Spine display created successfully');
            }
        } catch (e) {
            console.warn('[Player] Failed to create Spine display:', e.message);
        }
    }

    setSpineAnimation(name, loop = true) {
        if (!this.spine) return;
        
        try {
            if (this._currentSpineAnim === name) return;
            
            // Try different animation API patterns
            if (this.spine.animationState && typeof this.spine.animationState.setAnimation === 'function') {
                this.spine.animationState.setAnimation(0, name, loop);
                this._currentSpineAnim = name;
            } else if (typeof this.spine.setAnimation === 'function') {
                this.spine.setAnimation(0, name, loop);
                this._currentSpineAnim = name;
            }
        } catch (e) {
            console.warn('[Player] Failed to set animation:', name, e.message);
        }
    }

    setupComponents() {
        const config = GameConfig.player;

        // Add physics component
        this.addComponent('physics', new PhysicsComponent({
            bounce: 0.2,
            collideWorldBounds: true,
            bodyWidth: 32,
            bodyHeight: 48,
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

    update(cursors, wasd, spaceKey) {
        if (this.scene.gameState !== 'playing') return;

        // Check if this is being called from SystemManager with deltaTime only
        if (typeof cursors === 'number' && wasd === undefined && spaceKey === undefined) {
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
            const inputState = {
                left: cursors.left?.isDown || wasd.A?.isDown || false,
                right: cursors.right?.isDown || wasd.D?.isDown || false,
                up: cursors.up?.isDown || wasd.W?.isDown || false,
                attack: false, // Mouse input handled separately
            };

            this.processInputState(inputState, inputComponent, movementComponent);
        }

        // Sync visual position
        this.syncVisual();
    }

    updateWithInputState(inputState) {
        if (this.scene.gameState !== 'playing') return;

        // Update all components first
        super.update(16);

        // Handle input
        const inputComponent = this.getComponent('input');
        const movementComponent = this.getComponent('movement');

        if (inputComponent && movementComponent && inputState) {
            this.processInputState(inputState, inputComponent, movementComponent);
        }

        // Sync visual position
        this.syncVisual();
    }

    syncVisual() {
        if (!this.spine) return;

        try {
            // Sync position
            this.spine.x = this.sprite.x;
            this.spine.y = this.sprite.y;

            // Sync flip
            if (this.sprite.flipX) {
                this.spine.scaleX = -Math.abs(GameConfig.player.scale);
            } else {
                this.spine.scaleX = Math.abs(GameConfig.player.scale);
            }
        } catch (e) {
            console.warn('[Player] Failed to sync visual:', e.message);
        }
    }

    processInputState(inputState, inputComponent, movementComponent) {
        // Process movement input
        inputComponent.processInput(inputState);

        // Check if jumping
        const isJumping = !movementComponent.isOnGround();
        
        // Handle jump input
        if (inputState.up && movementComponent.isOnGround()) {
            const jumped = movementComponent.jump();
            if (jumped) {
                this._isJumping = true;
                this.setSpineAnimation('jump', false);
                
                // Clear jumping state after animation
                setTimeout(() => {
                    this._isJumping = false;
                }, 600);
            }
        }
        
        // Handle movement animations
        if (!this._isJumping && !isJumping && !this._isAttacking) {
            if (inputState.left) {
                movementComponent.moveLeft();
                this.setSpineAnimation('run', true);
            } else if (inputState.right) {
                movementComponent.moveRight();
                this.setSpineAnimation('run', true);
            } else {
                movementComponent.stopHorizontal();
                this.setSpineAnimation('idle', true);
            }
        } else if (!this._isJumping && !this._isAttacking) {
            // Allow horizontal movement while in air
            if (inputState.left) {
                movementComponent.moveLeft();
            } else if (inputState.right) {
                movementComponent.moveRight();
            } else {
                movementComponent.stopHorizontal();
            }
        }

        // Process attack input
        if (inputState.attack && !this._isAttacking) {
            this.attack();
        }
    }

    attack(pointer) {
        const attackComponent = this.getComponent('attack');
        if (attackComponent && attackComponent.canAttack()) {
            const target = pointer ? { x: pointer.x, y: pointer.y } : null;
            attackComponent.attack(target);
            
            // Play attack animation
            this._isAttacking = true;
            this.setSpineAnimation('attack', false);
            
            // Clear attacking state after animation
            setTimeout(() => {
                this._isAttacking = false;
                this.setSpineAnimation('idle', true);
            }, 800);

            // Create melee hitbox
            this.createMeleeHitbox();
        }
    }

    createMeleeHitbox() {
        try {
            const movementComp = this.getComponent('movement');
            const facing = movementComp?.getFacing() || 'right';
            const offsetX = facing === 'right' ? 28 : -28;
            
            const hx = this.sprite.x + offsetX;
            const hy = this.sprite.y - (this.sprite.displayHeight / 2);
            
            // Create hitbox zone
            const zone = this.scene.add.zone(hx, hy, 40, 28);
            this.scene.physics.world.enable(zone);
            
            if (zone.body) {
                zone.body.setAllowGravity(false);
                zone.body.setImmovable(true);
            }

            // Handle enemy collisions
            const enemyGroup = this.scene.enemyManager?.enemies;
            if (enemyGroup) {
                const hitCallback = (z, enemySprite) => {
                    if (enemySprite?.enemyRef) {
                        const enemy = enemySprite.enemyRef;
                        const damage = this.getComponent('attack')?.getDamage() || 1;
                        const score = enemy.takeDamage(damage);
                        
                        if (score && this.scene.addScore) {
                            this.scene.addScore(score);
                        }
                    }
                };

                this.scene.physics.add.overlap(zone, enemyGroup, hitCallback);
            }

            // Remove hitbox after short duration
            setTimeout(() => {
                if (zone?.destroy) zone.destroy();
            }, 200);
        } catch (e) {
            console.warn('[Player] Failed to create melee hitbox:', e.message);
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
            this.sprite.setVelocity(0, 0);
        }

        // Reset animation states
        this._isJumping = false;
        this._isAttacking = false;
        this.setSpineAnimation('idle', true);
    }
}

export default Player;