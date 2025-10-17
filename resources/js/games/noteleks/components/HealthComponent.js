import Component from '../core/Component.js';

/**
 * Health component - manages health and damage for game objects
 */
class HealthComponent extends Component {
    constructor(maxHealth = 100, invulnerabilityTime = 200) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.invulnerabilityTime = invulnerabilityTime;
        this.lastDamageTime = 0;
        this.isDead = false;
        this.onDeathCallbacks = [];
        this.onDamageCallbacks = [];
    }

    update(_deltaTime) {
        if (!this.enabled) return;

        // Update invulnerability
        const currentTime = Date.now();
        if (this.isInvulnerable() && currentTime - this.lastDamageTime > this.invulnerabilityTime) {
            this.clearVisualEffects();
        }
    }

    /**
     * Take damage
     * @param {number} amount - Damage amount
     * @returns {boolean} - True if object died from this damage
     */
    takeDamage(amount) {
        if (!this.enabled || this.isDead || this.isInvulnerable()) {
            return false;
        }

        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.lastDamageTime = Date.now();

        // Apply visual damage effect
        this.applyDamageEffect();

        // Trigger damage callbacks
        this.onDamageCallbacks.forEach((callback) => callback(amount, this.currentHealth));

        // Check for death
        if (this.currentHealth <= 0) {
            this.isDead = true;
            this.onDeathCallbacks.forEach((callback) => callback());
            return true;
        }

        return false;
    }

    /**
     * Heal the object
     * @param {number} amount - Heal amount
     */
    heal(amount) {
        if (this.isDead) return;

        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    /**
     * Check if currently invulnerable
     */
    isInvulnerable() {
        const currentTime = Date.now();
        return currentTime - this.lastDamageTime < this.invulnerabilityTime;
    }

    /**
     * Apply visual damage effect
     */
    applyDamageEffect() {
        if (this.gameObject.sprite) {
            this.gameObject.sprite.setTint(0xff0000);

            // Clear effect after invulnerability period
            if (this.gameObject.scene) {
                this.gameObject.scene.time.delayedCall(this.invulnerabilityTime, () => {
                    this.clearVisualEffects();
                });
            }
        }
    }

    /**
     * Clear visual effects
     */
    clearVisualEffects() {
        if (this.gameObject.sprite) {
            this.gameObject.sprite.setTint(0xffffff);
            this.gameObject.sprite.setAlpha(1.0);
        }
    }

    /**
     * Get current health
     */
    getHealth() {
        return this.currentHealth;
    }

    /**
     * Get maximum health
     */
    getMaxHealth() {
        return this.maxHealth;
    }

    /**
     * Get health percentage (0-1)
     */
    getHealthPercentage() {
        return this.currentHealth / this.maxHealth;
    }

    /**
     * Check if dead
     */
    isAlive() {
        return !this.isDead;
    }

    /**
     * Reset health to full
     */
    reset() {
        this.currentHealth = this.maxHealth;
        this.isDead = false;
        this.lastDamageTime = 0;
        this.clearVisualEffects();
    }

    /**
     * Add callback for when object dies
     */
    onDeath(callback) {
        this.onDeathCallbacks.push(callback);
    }

    /**
     * Add callback for when object takes damage
     */
    onDamage(callback) {
        this.onDamageCallbacks.push(callback);
    }
}

export default HealthComponent;
