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
import SpineBoneReader from '../utils/SpineBoneReader.js';

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
        this._attackLocked = false; // Lock player during attack
        this.animationManager = null;
        
        // Weapon sprite
        this.weaponSprite = null;
        this.boneReader = null;
        
        // Knockback state
        this.isKnockedBack = false;
        this.knockbackEndTime = 0;
        
        // Input handler
        this.inputHandler = new InputHandler(scene)
        
        // Physics manager
        this.physicsManager = new PhysicsManager(scene);
        
        // Create player and setup components
        this.createPlayer();
        this.setupComponents();
    }

    createPlayer() {
        // Use WebP sprite
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'skeleton-idle-0');
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
        
        // Listen for animation complete to reset attack state
        this.sprite.on('animationcomplete', (animation) => {
            if (animation.key === 'player-attack') {
                this._isAttacking = false;
                this._attackLocked = false;
            }
        });
        
        // Create weapon sprite
        this.createWeaponSprite();
    }

    createWeaponSprite() {
        try {
            if (!this.scene.textures.exists('spear')) {
                console.warn('[Player] Spear texture not loaded');
                return;
            }
            
            // Load Spine bone data for accurate positioning
            this.loadSpineBoneData();
            
            // Create spear sprite attached to player
            this.weaponSprite = this.scene.add.sprite(0, 0, 'spear');
            this.weaponSprite.setOrigin(0, 0.5); // Pivot at base of spear (left side, center height)
            this.weaponSprite.setDepth(99); // Just behind player
            this.weaponSprite.setScale(0.15); // Adjust size to match player scale
        } catch (e) {
            console.error('[Player] Failed to create weapon sprite:', e);
        }
    }
    
    async loadSpineBoneData() {
        try {
            // Load the Spine JSON file
            const response = await fetch('/games/noteleks/sprites/Skeleton.json');
            const spineData = await response.json();
            
            this.boneReader = new SpineBoneReader(spineData);
        } catch (e) {
            console.warn('[Player] Could not load Spine bone data, using fallback positioning:', e.message);
        }
    }

    updateWeaponPosition() {
        if (!this.weaponSprite || !this.sprite) return;
        
        // Get player's current animation state from actual playing animation
        const currentAnim = this.sprite.anims?.currentAnim?.key || 'player-idle';
        const isAttacking = currentAnim.includes('attack');
        const isRunning = currentAnim.includes('run');
        const facingRight = !this.sprite.flipX;
        
        // Get current animation progress (0 to 1)
        const animProgress = this.sprite.anims?.getProgress() || 0;
        
        let offsetX, offsetY, rotation;
        
        if (this.boneReader) {
            // Use Spine bone data for accurate hand position
            let state = 'idle';
            if (isAttacking) state = 'attack';
            else if (isRunning) state = 'run';
            
            // Map game states to Spine animation names and get duration
            const animMap = {
                'idle': { name: 'Idle', duration: 0.8 },
                'attack': { name: 'Attack1', duration: 0.3 },
                'run': { name: 'Run', duration: 0.8 },
                'jump': { name: 'Jump', duration: 0.4 }
            };
            
            const animInfo = animMap[state] || animMap['idle'];
            const animTime = animProgress * animInfo.duration; // Convert progress to actual time
            
            const boneTransform = this.boneReader.getBoneTransform('Handl', animInfo.name, animTime);
            
            // Debug logging (only log occasionally to avoid spam)
            if (Math.random() < 0.02) {
                console.log(`[Player] State: ${state}, Anim: ${animInfo.name}, Progress: ${animProgress.toFixed(2)}, Time: ${animTime.toFixed(3)}`);
                console.log(`[Player] Bone transform:`, boneTransform);
            }
            
            // Convert Spine coordinates to Phaser (Spine uses different coordinate system)
            // Scale down from Spine's coordinate space and apply player scale
            const spineScale = GameConfig.player.scale * 0.05; // Match the root bone scale from Spine
            
            offsetX = boneTransform.x * spineScale;
            offsetY = -boneTransform.y * spineScale; // Y is inverted in Phaser
            rotation = (boneTransform.rotation * Math.PI) / 180; // Convert to radians from Spine
            
            // Flip for left-facing
            if (!facingRight) {
                offsetX = -offsetX;
                rotation = -rotation; // Mirror the rotation
            }
        } else {
            // Fallback to manual positioning if bone data not available
            console.warn('[Player] Using fallback weapon positioning - Spine bone data not loaded');
            if (isAttacking) {
                offsetX = facingRight ? 50 : -50;
                offsetY = -35;
                rotation = facingRight ? 0 : Math.PI;
            } else {
                offsetX = facingRight ? 20 : -20;
                offsetY = -50;
                rotation = facingRight ? -Math.PI / 3 : Math.PI + Math.PI / 3;
            }
        }
        
        // Apply position and rotation from Spine bone data
        this.weaponSprite.setPosition(
            this.sprite.x + offsetX,
            this.sprite.y + offsetY
        );
        this.weaponSprite.setRotation(rotation);
        
        // No manual flipping - rotation handles orientation
    }

    playAnimation(name, loop = true) {
        if (!this.animationManager) return;
        
        // Map game animation names to player animation names
        let animKey = null;
        if (name === 'idle') {
            animKey = 'player-idle';
            this._isAttacking = false;
        }
        else if (name === 'run') {
            animKey = 'player-run';
            this._isAttacking = false;
        }
        else if (name === 'attack') {
            animKey = 'player-attack';
            loop = false; // Attack should never loop
            this._isAttacking = true;
            this._attackLocked = true;
        }
        else if (name === 'jump') {
            animKey = 'player-jump';
            this._isAttacking = false;
        }
        
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

        // Add movement component with double jump support
        this.addComponent('movement', new MovementComponent(
            config.speed, 
            config.jumpPower,
            config.doubleJumpPower,
            config.maxJumps
        ));

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

        // Check if knockback has expired
        if (this.isKnockedBack && Date.now() > this.knockbackEndTime) {
            this.isKnockedBack = false;
        }

        // Only process input if not knocked back AND not attack-locked
        if (!this.isKnockedBack && !this._attackLocked) {
            // Get input state from InputHandler
            const inputState = this.inputHandler.getInputState();
            if (inputState) {
                this.inputHandler.processPlayerInput(this, inputState);
            }
        } else if (this._attackLocked) {
            // Stop movement during attack
            this.physicsManager.setVelocityX(this.sprite, 0);
        }
        
        // Update InputHandler
        this.inputHandler.update();
        
        // Update weapon position to follow player
        this.updateWeaponPosition();
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
            }
            
            // Apply damage
            const damage = 1;
            const score = enemy.takeDamage(damage);
            
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

    applyKnockback(direction, duration = 500) {
        this.isKnockedBack = true;
        this.knockbackEndTime = Date.now() + duration;
        
        // Apply knockback through physics manager
        if (this.sprite && this.physicsManager) {
            this.physicsManager.applyKnockback(this.sprite, direction);
        }
    }

    reset(x, y) {
        // Reset position
        this.setPosition(x, y);

        // Reset health
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            healthComponent.reset();
        }

        // Reset movement and jumps
        const movementComponent = this.getComponent('movement');
        if (movementComponent) {
            movementComponent.stopHorizontal();
            movementComponent.resetJumps();
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
        // Clean up weapon sprite
        if (this.weaponSprite) {
            this.weaponSprite.destroy();
            this.weaponSprite = null;
        }
        
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