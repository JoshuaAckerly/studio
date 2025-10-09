/* global Phaser */

/**
 * Player class for Noteleks character
 * Handles movement, animations, combat, and Spine 2D integration
 */
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.facing = 'right';
        this.isAttacking = false;
        this.useSpineAnimations = true;
        this.availableAnimations = [];
        this.currentAnimation = null;
        
        this.createPlayer();
        this.setupPhysics();
    }

    createPlayer() {
        if (this.useSpineAnimations && this.scene.add.spine) {
            try {
                this.sprite = this.scene.add.spine(this.x, this.y, 'noteleks-data', 'noteleks-atlas');
                this.scene.physics.add.existing(this.sprite);
                this.sprite.body.setBounce(0.2);
                this.sprite.body.setCollideWorldBounds(true);
                this.sprite.setScale(0.1);
                
                // Store available animations
                if (this.sprite.skeleton && this.sprite.skeleton.data && this.sprite.skeleton.data.animations) {
                    this.availableAnimations = this.sprite.skeleton.data.animations.map(a => a.name);
                    
                    // Set default animation
                    if (this.availableAnimations.length > 0) {
                        const defaultAnim = this.availableAnimations[0];
                        this.sprite.animationState.setAnimation(0, defaultAnim, true);
                        this.currentAnimation = defaultAnim;
                    }
                }
                console.log('Spine player created successfully with animations:', this.availableAnimations);
            } catch (error) {
                console.error('Failed to create Spine player, falling back to placeholder:', error);
                this.useSpineAnimations = false;
                this.createPlaceholderPlayer();
            }
        } else {
            this.createPlaceholderPlayer();
        }
    }

    createPlaceholderPlayer() {
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'skeleton');
        this.sprite.setBounce(0.2);
        this.sprite.setCollideWorldBounds(true);
    }

    setupPhysics() {
        // Player collision with platforms
        this.scene.physics.add.collider(this.sprite, this.scene.platforms);
    }

    update(cursors, wasd, spaceKey) {
        if (this.scene.gameState !== 'playing') return;

        // Handle movement
        this.handleMovement(cursors, wasd);
        
        // Handle jumping
        this.handleJumping(cursors, wasd);
        
        // Handle attacking
        this.handleAttacking(spaceKey);
    }

    handleMovement(cursors, wasd) {
        if (cursors.left.isDown || wasd.A.isDown) {
            this.sprite.body.setVelocityX(-160);
            this.facing = 'left';
            if (this.useSpineAnimations) {
                this.sprite.setScale(-0.1, 0.1);
                if (!this.isAttacking) {
                    this.playAnimation('run');
                }
            } else {
                this.sprite.setFlipX(true);
            }
        } else if (cursors.right.isDown || wasd.D.isDown) {
            this.sprite.body.setVelocityX(160);
            this.facing = 'right';
            if (this.useSpineAnimations) {
                this.sprite.setScale(0.1, 0.1);
                if (!this.isAttacking) {
                    this.playAnimation('run');
                }
            } else {
                this.sprite.setFlipX(false);
            }
        } else {
            this.sprite.body.setVelocityX(0);
            if (!this.isAttacking) {
                this.playAnimation('idle');
            }
        }
    }

    handleJumping(cursors, wasd) {
        if ((cursors.up.isDown || wasd.W.isDown) && this.sprite.body.touching.down && !this.isAttacking) {
            this.sprite.body.setVelocityY(-330);
            this.playAnimation('jump');
        }
    }

    handleAttacking(spaceKey) {
        if (Phaser.Input.Keyboard.JustDown(spaceKey) && !this.isAttacking) {
            this.attack();
        }
    }

    attack() {
        this.isAttacking = true;
        this.playAnimation('attack');
        
        // Create weapon/projectile
        this.scene.weaponManager.createWeapon(this.sprite.x, this.sprite.y - 10, this.facing);
        
        // Reset attack state after animation
        this.scene.time.delayedCall(500, () => {
            this.isAttacking = false;
        });
    }

    playAnimation(animationName) {
        if (!this.useSpineAnimations || !this.sprite.skeleton) return;

        // Check if animation exists and is different from current
        if (this.availableAnimations.includes(animationName) && this.currentAnimation !== animationName) {
            try {
                this.sprite.animationState.setAnimation(0, animationName, true);
                this.currentAnimation = animationName;
            } catch (error) {
                console.warn(`Failed to play animation: ${animationName}`, error);
            }
        }
    }

    takeDamage(amount = 20) {
        // Flash effect when taking damage
        if (this.useSpineAnimations && this.sprite.skeleton) {
            this.sprite.setAlpha(0.5);
            this.scene.time.delayedCall(200, () => {
                this.sprite.setAlpha(1.0);
            });
        } else {
            this.sprite.setTint(0xff0000);
            this.scene.time.delayedCall(200, () => {
                this.sprite.setTint(0xffffff);
            });
        }
        
        return amount;
    }

    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    getSprite() {
        return this.sprite;
    }
}

export default Player;