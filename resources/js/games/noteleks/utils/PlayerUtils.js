/**
 * Player Utility Functions
 * 
 * Common utility functions to help clean up and simplify Player.js
 * These utilities can be used immediately to reduce code complexity.
 */

/**
 * Safe execution wrapper for operations that might throw
 * @param {Function} operation - Function to execute safely
 * @param {*} fallback - Value to return if operation fails
 * @param {boolean} logError - Whether to log errors
 * @returns {*} Result of operation or fallback value
 */
export const safeExecute = (operation, fallback = null, logError = false) => {
    try {
        return operation();
    } catch (e) {
        if (logError) {
            console.warn('Safe execution failed:', e.message);
        }
        return fallback;
    }
};

/**
 * Debug logger that respects configuration settings
 */
export class DebugLogger {
    /**
     * Log a debug message if debug mode is enabled
     * @param {string} category - Log category (e.g., 'Player', 'Spine')
     * @param {string} message - Log message
     * @param {*} data - Optional data to log
     */
    static log(category, message, data = null) {
        try {
            // Check if debug is enabled via GameConfig or window flag
            const debugEnabled = (typeof window !== 'undefined' && window.noteleksDebug) ||
                                (typeof GameConfig !== 'undefined' && 
                                 GameConfig.debug && 
                                 GameConfig.debug.enablePlayerDebugOverlay);
            
            if (debugEnabled) {
                if (data !== null) {
                    console.log(`[${category}] ${message}`, data);
                } else {
                    console.log(`[${category}] ${message}`);
                }
            }
        } catch (e) {
            // Ignore logging errors
        }
    }

    /**
     * Log a warning message (always shown)
     * @param {string} category - Log category
     * @param {string} message - Warning message
     * @param {*} data - Optional data
     */
    static warn(category, message, data = null) {
        try {
            if (data !== null) {
                console.warn(`[${category}] ${message}`, data);
            } else {
                console.warn(`[${category}] ${message}`);
            }
        } catch (e) {
            // Ignore logging errors
        }
    }

    /**
     * Log an error message (always shown)
     * @param {string} category - Log category
     * @param {string} message - Error message
     * @param {*} error - Error object or data
     */
    static error(category, message, error = null) {
        try {
            if (error !== null) {
                console.error(`[${category}] ${message}`, error);
            } else {
                console.error(`[${category}] ${message}`);
            }
        } catch (e) {
            // Ignore logging errors
        }
    }
}

/**
 * Timeout management utilities
 */
export class TimeoutManager {
    /**
     * Create a safe timeout that won't throw if callback fails
     * @param {Function} callback - Function to call
     * @param {number} delay - Delay in milliseconds
     * @param {*} context - Context to bind callback to
     * @returns {number} Timeout ID
     */
    static createSafe(callback, delay, context = null) {
        return setTimeout(() => {
            try {
                callback.call(context);
            } catch (e) {
                DebugLogger.warn('TimeoutManager', 'Safe timeout callback failed', e.message);
            }
        }, delay);
    }

    /**
     * Clear a timeout safely
     * @param {number} timeoutId - Timeout ID to clear
     * @returns {null} Always returns null for easy assignment
     */
    static clearSafe(timeoutId) {
        if (timeoutId) {
            try {
                clearTimeout(timeoutId);
            } catch (e) {
                // Ignore clear errors
            }
        }
        return null;
    }
}

/**
 * Animation utilities for Spine and Phaser
 */
export class AnimationUtils {
    /**
     * Animation API methods in order of preference
     */
    static SPINE_METHODS = [
        (spine, track, name, loop) => spine.setAnimation(track, name, loop),
        (spine, track, name, loop) => spine.animationState?.setAnimation(track, name, loop),
        (spine, track, name, loop) => spine.state?.setAnimation(track, name, loop),
        (spine, track, name, loop) => spine.play?.(name, loop),
    ];

    /**
     * Try to set a Spine animation using multiple API methods
     * @param {*} spine - Spine object
     * @param {string} name - Animation name
     * @param {boolean} loop - Whether to loop
     * @param {number} track - Animation track (default 0)
     * @returns {boolean} Success status
     */
    static trySetSpineAnimation(spine, name, loop = true, track = 0) {
        if (!spine || !name) return false;

        for (const method of this.SPINE_METHODS) {
            if (safeExecute(() => method(spine, track, name, loop), false)) {
                DebugLogger.log('Animation', `Set spine animation: ${name}`);
                return true;
            }
        }

        DebugLogger.warn('Animation', `Failed to set spine animation: ${name}`);
        return false;
    }

    /**
     * Get available animation names from a Spine object
     * @param {*} spine - Spine object
     * @returns {string[]} Array of animation names
     */
    static getSpineAnimationNames(spine) {
        try {
            const skeleton = spine?.spine?.skeleton || spine?.skeleton;
            if (skeleton?.data?.animations) {
                return skeleton.data.animations.map(a => a.name);
            }
        } catch (e) {
            DebugLogger.warn('Animation', 'Failed to get spine animation names', e.message);
        }
        return [];
    }

    /**
     * Get animation duration in milliseconds
     * @param {*} spine - Spine object
     * @param {string} animName - Animation name
     * @returns {number|null} Duration in ms or null if not found
     */
    static getSpineAnimationDuration(spine, animName) {
        try {
            const skeleton = spine?.spine?.skeleton || spine?.skeleton;
            if (skeleton?.data?.animations) {
                const anim = skeleton.data.animations.find(a => a.name === animName);
                if (anim && typeof anim.duration === 'number') {
                    return Math.max(120, Math.round(anim.duration * 1000));
                }
            }
        } catch (e) {
            DebugLogger.warn('Animation', 'Failed to get animation duration', e.message);
        }
        return null;
    }
}

/**
 * Visual utilities for display management
 */
export class VisualUtils {
    /**
     * Get texture height from a Phaser texture key
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {string} textureKey - Texture key
     * @returns {number|null} Height in pixels or null
     */
    static getTextureHeight(scene, textureKey) {
        return safeExecute(() => {
            if (!scene?.textures?.exists(textureKey)) return null;
            
            const texture = scene.textures.get(textureKey);
            if (!texture) return null;

            // Try to get frame height first
            const frameNames = texture.getFrameNames?.();
            if (frameNames?.length) {
                const frame = texture.get(frameNames[0]);
                if (frame?.height > 0) return frame.height;
            }

            // Fallback to source image height
            const source = texture.getSourceImage?.() || texture.source?.[0]?.image;
            return source?.height > 0 ? source.height : null;
        }, null);
    }

    /**
     * Calculate scale to achieve target pixel height
     * @param {number} sourceHeight - Source height in pixels
     * @param {number} targetHeight - Target height in pixels
     * @returns {number} Scale factor
     */
    static calculateScale(sourceHeight, targetHeight) {
        if (!sourceHeight || sourceHeight <= 0 || !targetHeight || targetHeight <= 0) {
            return 1;
        }
        return targetHeight / sourceHeight;
    }

    /**
     * Ensure a value is within reasonable bounds for display
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clampDisplayValue(value, min = 0.1, max = 10) {
        if (typeof value !== 'number' || !isFinite(value)) return 1;
        return Math.max(min, Math.min(max, Math.abs(value)));
    }
}

/**
 * Input utilities
 */
export class InputUtils {
    /**
     * Safely check if an input key is pressed
     * @param {*} key - Phaser key object
     * @returns {boolean} True if pressed
     */
    static isKeyDown(key) {
        return safeExecute(() => !!key?.isDown, false);
    }

    /**
     * Create a safe input state object
     * @param {*} cursors - Cursor keys object
     * @param {*} wasd - WASD keys object
     * @param {*} spaceKey - Space key object
     * @returns {Object} Input state
     */
    static createInputState(cursors, wasd, spaceKey) {
        return {
            left: this.isKeyDown(cursors?.left) || this.isKeyDown(wasd?.A),
            right: this.isKeyDown(cursors?.right) || this.isKeyDown(wasd?.D),
            up: this.isKeyDown(cursors?.up) || this.isKeyDown(wasd?.W) || this.isKeyDown(spaceKey),
            attack: false, // Mouse input handled separately
        };
    }
}

/**
 * Constants that should eventually move to GameConfig.js
 */
export const PlayerConstants = {
    SPINE: {
        RETRY_ATTEMPTS: 8,
        RETRY_DELAY: 100,
        LOADING_TIMEOUT: 6000,
        WATCHDOG_MAX_ATTEMPTS: 20,
        WATCHDOG_INTERVAL: 500,
    },
    COMBAT: {
        ATTACK_TIMEOUT: 900,
        MELEE_HITBOX_WIDTH: 40,
        MELEE_HITBOX_HEIGHT: 28,
        MELEE_FORWARD_SHIFT: 28,
        HITBOX_DURATION: 220,
    },
    VISUAL: {
        MIN_VISIBLE_PIXELS: 48,
        FALLBACK_BOB_SPEED: 0.1,
        DEBUG_MARKER_DURATION: 5000,
        DEFAULT_SOURCE_HEIGHT: 48,
    },
    JUMP: {
        CLEAR_BUFFER_MS: 150,
        DEFAULT_AIRTIME_MS: 600,
    },
};

export default {
    safeExecute,
    DebugLogger,
    TimeoutManager,
    AnimationUtils,
    VisualUtils,
    InputUtils,
    PlayerConstants,
};