/**
 * Ultimate Spine Fix - Just make the character visible
 */
export function ultimateFix() {
    const scene = window.NOTELEKS_LAST_SCENE;
    const player = window.noteleksPlayer;
    
    if (!scene || !player) {
        console.error('Scene or player not found');
        return;
    }
    
    console.log('=== ULTIMATE FIX ===');
    
    // Method 1: Just use the fallback sprite
    if (player.sprite) {
        player.sprite.setVisible(true);
        player.sprite.setAlpha(1);
        player.sprite.setTint(0x00ff00); // Green tint so we can see it
        console.log('✅ Made sprite visible with green tint');
        
        // Center camera on sprite
        if (scene.cameras && scene.cameras.main) {
            scene.cameras.main.centerOn(player.sprite.x, player.sprite.y);
            console.log('✅ Camera centered on sprite');
        }
        
        return true;
    }
    
    // Method 2: Create a simple image fallback
    try {
        if (scene.textures.exists('noteleks-texture')) {
            const fallback = scene.add.image(player.sprite.x, player.sprite.y, 'noteleks-texture');
            fallback.setScale(0.6);
            fallback.setOrigin(0.5, 1);
            fallback.setDepth(500);
            
            // Replace player's spine with this image
            if (player.spine && player.spine.destroy) {
                player.spine.destroy();
            }
            player.spine = fallback;
            
            console.log('✅ Created image fallback');
            return true;
        }
    } catch (error) {
        console.error('Image fallback failed:', error.message);
    }
    
    return false;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ultimateFix = ultimateFix;
}