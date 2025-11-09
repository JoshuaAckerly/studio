import AttackComponent from '../components/AttackComponent.js';
import HealthComponent from '../components/HealthComponent.js';
import InputComponent from '../components/InputComponent.js';
import MovementComponent from '../components/MovementComponent.js';
import PhysicsComponent from '../components/PhysicsComponent.js';
import GameConfig from '../config/GameConfig.js';
import GameObject from '../core/GameObject.js';
import AnimationManager from '../managers/AnimationManager.js';

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
        this.lastAttackTime = 0;
        
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
        
        // Ensure physics body is properly configured
        if (this.sprite.body) {
            this.sprite.body.setCollideWorldBounds(true);
            this.sprite.body.setBounce(0);
            // Set physics body to match skeleton body (157x237 sprite)
            this.sprite.body.setSize(60, 100); // Character-sized collision
            this.sprite.body.setOffset(48, 120); // Center on skeleton body
        }
        
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

    update(cursors, wasd, spaceKey) {
        if (this.scene.gameState !== 'playing') return;
        if (!this.sprite || !this.sprite.body) return;

        // Simple direct controls
        const keys = this.scene.input.keyboard.addKeys('W,S,A,D,UP,DOWN,LEFT,RIGHT,SPACE');
        
        // Reset velocity
        this.sprite.body.setVelocityX(0);
        
        // Left/Right movement
        if (keys.LEFT.isDown || keys.A.isDown) {
            this.sprite.body.setVelocityX(-160);
            this.sprite.setFlipX(true);
            this.playAnimation('run');
        } else if (keys.RIGHT.isDown || keys.D.isDown) {
            this.sprite.body.setVelocityX(160);
            this.sprite.setFlipX(false);
          
            this.playAnimation('run');
        } else {
            this.playAnimation('idle');
        }
        
        // Jump
        if ((keys.UP.isDown || keys.W.isDown) && this.sprite.body.touching.down) {
            this.sprite.body.setVelocityY(-330);
            this.playAnimation('jump');
        }
        
        // Attack with cooldown
        const currentTime = Date.now();
        if (keys.SPACE.isDown && currentTime - this.lastAttackTime > 500) {
            this.playAnimation('attack');
            this.createMeleeHitbox();
            this.lastAttackTime = currentTime;
        }
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
        // No additional sync needed for sprite-only mode
        // Sprite position and flip are handled by physics and movement components
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
                this.playAnimation('jump', false);
                
                // Clear jumping state after animation
                setTimeout(() => {
                    this._isJumping = false;
                }, 600);
            }
        }
        
        // Handle movement animations
        if (inputState.left) {
            movementComponent.moveLeft();
            this.playAnimation('run', true);
        } else if (inputState.right) {
            movementComponent.moveRight();
            this.playAnimation('run', true);
        } else {
            movementComponent.stopHorizontal();
            if (!this._isJumping && !isJumping && !this._isAttacking) {
                this.playAnimation('idle', true);
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
            this.playAnimation('attack', false);
            
            // Clear attacking state after animation
            setTimeout(() => {
                this._isAttacking = false;
                this.playAnimation('idle', true);
            }, 800);

            // Create melee hitbox
            this.createMeleeHitbox();
        }
    }

    createMeleeHitbox() {
        try {
            // Determine facing direction from sprite flip
            const facing = this.sprite.flipX ? 'left' : 'right';
            const offsetX = facing === 'right' ? 20 : -20; // Move hitbox closer to player

            const hx = this.sprite.x + offsetX;
            const hy = this.sprite.y - 20; // Position at character's hand/weapon level
   
            // Create hitbox zone
            const zone = this.scene.add.zone(hx, hy, 50, 100);
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
        this.playAnimation('idle', true);
    }
}

export default Player;