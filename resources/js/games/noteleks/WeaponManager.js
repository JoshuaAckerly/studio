/* global Phaser */

/**
 * WeaponManager class handles all projectiles and weapons in the game
 */
class WeaponManager {
    constructor(scene) {
        this.scene = scene;
        this.weapons = null;
        this.weaponTypes = {
            'dagger': { speed: 300, damage: 1, sprite: 'dagger' },
            'fireball': { speed: 250, damage: 2, sprite: 'fireball' },
            'arrow': { speed: 400, damage: 1, sprite: 'arrow' },
            'magic_bolt': { speed: 350, damage: 3, sprite: 'magic_bolt' }
        };
        this.currentWeaponType = 'dagger';
        
        this.createWeaponGroup();
    }

    createWeaponGroup() {
        this.weapons = this.scene.physics.add.group();
        
        // Setup collision with enemies
        this.scene.physics.add.overlap(this.weapons, this.scene.enemies, this.hitEnemy, null, this.scene);
    }

    createWeapon(x, y, direction = 'right', pointer = null) {
        const weaponConfig = this.weaponTypes[this.currentWeaponType];
        const weapon = this.weapons.create(x, y, weaponConfig.sprite);
        
        // Store weapon properties
        weapon.weaponType = this.currentWeaponType;
        weapon.damage = weaponConfig.damage;
        weapon.startTime = this.scene.time.now;
        
        if (pointer) {
            // Throw toward mouse/touch position
            const angle = Phaser.Math.Angle.Between(x, y, pointer.x, pointer.y);
            this.scene.physics.velocityFromAngle(angle * 180 / Math.PI, weaponConfig.speed, weapon.body.velocity);
        } else {
            // Throw in facing direction
            const velocityX = direction === 'right' ? weaponConfig.speed : -weaponConfig.speed;
            weapon.setVelocityX(velocityX);
            weapon.setVelocityY(-50); // Slight upward arc
        }
        
        // Add rotation for visual effect
        weapon.setAngularVelocity(direction === 'right' ? 300 : -300);
        
        return weapon;
    }

    update() {
        // Clean up weapons that are off-screen or too old
        this.weapons.children.entries.forEach(weapon => {
            const age = this.scene.time.now - weapon.startTime;
            
            // Remove if off-screen or older than 3 seconds
            if (weapon.x > this.scene.cameras.main.worldView.right + 50 || 
                weapon.x < this.scene.cameras.main.worldView.left - 50 ||
                weapon.y > this.scene.cameras.main.worldView.bottom + 50 ||
                age > 3000) {
                weapon.destroy();
            }
        });
    }

    hitEnemy(weapon, enemySprite) {
        // Get enemy reference from sprite
        const enemy = enemySprite.enemyRef;
        if (!enemy) return;
        
        // Deal damage to enemy
        const destroyed = enemy.takeDamage(weapon.damage);
        
        // Destroy weapon
        weapon.destroy();
        
        // Add score if enemy was destroyed
        if (destroyed) {
            const score = enemy.destroy();
            this.scene.addScore(score);
        }
        
        // Create hit effect
        this.createHitEffect(weapon.x, weapon.y);
    }

    createHitEffect(x, y) {
        // Simple hit effect - could be enhanced with particles
        const effect = this.scene.add.graphics();
        effect.fillStyle(0xffff00);
        effect.fillCircle(x, y, 10);
        
        // Fade out effect
        this.scene.tweens.add({
            targets: effect,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 200,
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    setWeaponType(weaponType) {
        if (this.weaponTypes[weaponType]) {
            this.currentWeaponType = weaponType;
        }
    }

    getCurrentWeaponType() {
        return this.currentWeaponType;
    }

    getWeaponsGroup() {
        return this.weapons;
    }

    getAvailableWeapons() {
        return Object.keys(this.weaponTypes);
    }
}

export default WeaponManager;