/**
 * Simple Spine Fix - Minimal approach
 */
export function createSimpleSpine() {
    const scene = window.NOTELEKS_LAST_SCENE;
    const player = window.noteleksPlayer;
    
    if (!scene || !player) {
        console.error('Scene or player not found');
        return;
    }
    
    // Remove existing spine if any
    if (player.spine && player.spine.destroy) {
        player.spine.destroy();
    }
    
    try {
        // Create spine with minimal setup
        const spine = scene.add.spine(player.sprite.x, player.sprite.y, 'noteleks-data');
        
        if (spine) {
            player.spine = spine;
            spine.setScale(0.6);
            spine.setOrigin(0.5, 1);
            spine.setDepth(500);
            
            // Try to start animation
            setTimeout(() => {
                try {
                    if (spine.animationState) {
                        spine.animationState.setAnimation(0, 'idle', true);
                        console.log('✅ Animation started via animationState');
                    }
                } catch (e) {
                    console.log('Animation failed:', e.message);
                }
            }, 100);
            
            console.log('✅ Simple spine created');
            return spine;
        }
    } catch (error) {
        console.error('❌ Simple spine creation failed:', error.message);
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.createSimpleSpine = createSimpleSpine;
}