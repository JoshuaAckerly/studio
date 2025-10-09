/* global Phaser */

/**
 * Enemy class for various enemy types in Noteleks
 * Handles AI, movement, and combat behavior
 */
class Enemy {
    constructor(scene, x, y, type = 'zombie') {
        this.scene = scene;
        this.type = type;
        this.health = this.getMaxHealth();
        this.maxHealth = this.health;
        this.speed = this.getSpeed();
        this.damage = this.getDamage();
        
        this.createEnemy(x, y);
        this.setupPhysics();
    }

    getMaxHealth() {
        const healthMap = {
            'zombie': 2,
            'skeleton': 3,
            'ghost': 1,
            'boss': 10
        };
        return healthMap[this.type] || 2;
    }

    getSpeed() {
        const speedMap = {
            'zombie': 50,
            'skeleton': 70,
            'ghost': 90,
            'boss': 30
        };
        return speedMap[this.type] || 50;
    }

    getDamage() {
        const damageMap = {
            'zombie': 20,
            'skeleton': 25,
            'ghost': 15,
            'boss': 40
        };
        return damageMap[this.type] || 20;
    }

    createEnemy(x, y) {
        // Create enemy sprite (placeholder for now)
        this.sprite = this.scene.physics.add.sprite(x, y, 'enemy');
        this.sprite.setBounce(0.2);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setTint(this.getEnemyColor());
        
        // Store reference to this enemy class in the sprite
        this.sprite.enemyRef = this;
    }

    getEnemyColor() {
        const colorMap = {
            'zombie': 0x00ff00,  // Green
            'skeleton': 0xcccccc, // Light gray
            'ghost': 0x8888ff,   // Light blue
            'boss': 0xff0000     // Red
        };
        return colorMap[this.type] || 0x00ff00;
    }

    setupPhysics() {
        // Enemy collision with platforms
        this.scene.physics.add.collider(this.sprite, this.scene.platforms);
    }

    update(player) {
        if (this.scene.gameState !== 'playing') return;

        // AI behavior based on enemy type
        switch (this.type) {
            case 'zombie':
                this.zombieAI(player);
                break;
            case 'skeleton':
                this.skeletonAI(player);
                break;
            case 'ghost':
                this.ghostAI(player);
                break;
            case 'boss':
                this.bossAI(player);
                break;
            default:
                this.basicAI(player);
        }
    }

    basicAI(player) {
        // Simple movement toward player
        if (this.sprite.body.touching.down) {
            const playerPos = player.getPosition();
            if (this.sprite.x < playerPos.x) {
                this.sprite.setVelocityX(this.speed);
            } else {
                this.sprite.setVelocityX(-this.speed);
            }
        }
    }

    zombieAI(player) {
        // Slow but persistent movement toward player
        this.basicAI(player);
    }

    skeletonAI(player) {
        // Faster movement with occasional jumps
        this.basicAI(player);
        
        // Random jump chance
        if (this.sprite.body.touching.down && Math.random() < 0.005) {
            this.sprite.setVelocityY(-200);
        }
    }

    ghostAI(player) {
        // Floating movement (ignore gravity for ghosts)
        const playerPos = player.getPosition();
        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPos.x, playerPos.y);
        
        if (distance > 50) {
            // Move toward player
            const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerPos.x, playerPos.y);
            this.sprite.setVelocityX(Math.cos(angle) * this.speed);
            this.sprite.setVelocityY(Math.sin(angle) * this.speed);
        } else {
            // Stop when close
            this.sprite.setVelocityX(0);
            this.sprite.setVelocityY(0);
        }
    }

    bossAI(player) {
        // More complex AI for boss enemies
        const playerPos = player.getPosition();
        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPos.x, playerPos.y);
        
        if (distance > 150) {
            // Move toward player when far
            this.basicAI(player);
        } else if (distance < 100) {
            // Move away when too close (ranged attack pattern)
            if (this.sprite.x < playerPos.x) {
                this.sprite.setVelocityX(-this.speed);
            } else {
                this.sprite.setVelocityX(this.speed);
            }
        } else {
            // Stay in optimal range
            this.sprite.setVelocityX(0);
        }
        
        // Boss jump attack
        if (this.sprite.body.touching.down && Math.random() < 0.01) {
            this.sprite.setVelocityY(-300);
        }
    }

    takeDamage(amount = 1) {
        this.health -= amount;
        
        // Flash effect when hit
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.setTint(this.getEnemyColor());
        });
        
        // Check if enemy should be destroyed
        if (this.health <= 0) {
            return this.destroy();
        }
        
        return false;
    }

    destroy() {
        // Calculate score based on enemy type
        const scoreMap = {
            'zombie': 10,
            'skeleton': 15,
            'ghost': 20,
            'boss': 100
        };
        
        const score = scoreMap[this.type] || 10;
        
        // Remove sprite
        this.sprite.destroy();
        
        return score;
    }

    getSprite() {
        return this.sprite;
    }

    getType() {
        return this.type;
    }

    getDamageAmount() {
        return this.damage;
    }
}

export default Enemy;