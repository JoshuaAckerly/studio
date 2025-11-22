/**
 * AnimationManager - Handles sprite animations
 */
class AnimationManager {
    constructor(sprite, scene) {
        this.sprite = sprite;
        this.scene = scene;
        this.currentAnimation = null;
        this.setupAnimationListeners();
    }

    /**
     * Setup animation event listeners
     */
    setupAnimationListeners() {
        if (!this.sprite) return;
        
        // Listen for animation complete events
        this.sprite.on('animationcomplete', (animation) => {
            // When attack animation completes, return to idle
            if (animation.key === 'player-attack') {
                this.play('player-idle', true);
            }
        });
    }

    /**
     * Play an animation on the sprite
     */
    play(animationKey, loop = true) {
        if (!this.sprite || !this.sprite.play) return;
        
        // Allow attack animation to restart
        if (this.currentAnimation === animationKey && animationKey !== 'player-attack') return;
        
        try {
            if (this.scene.anims.exists(animationKey)) {
                this.sprite.play(animationKey);
                this.currentAnimation = animationKey;
            } else {
                console.warn('[AnimationManager] Animation not found:', animationKey);
            }
        } catch (e) {
            console.warn('[AnimationManager] Failed to play animation:', animationKey, e.message);
        }
    }

    /**
     * Get current animation
     */
    getCurrentAnimation() {
        return this.currentAnimation;
    }

    /**
     * Check if animation is playing
     */
    isPlaying(animationKey) {
        return this.currentAnimation === animationKey;
    }
}

export default AnimationManager;