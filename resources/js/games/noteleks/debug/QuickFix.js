/**
 * Quick fixes for common Spine issues
 */
export class QuickFix {
    static enableDebugMode() {
        if (typeof window !== 'undefined') {
            window.noteleksDebug = true;
            console.log('Debug mode enabled. Reload the page to see debug overlays.');
        }
    }
    
    static forceCreateSpine() {
        const scene = window.NOTELEKS_LAST_SCENE;
        if (!scene) {
            console.error('Scene not found. Make sure the game is loaded.');
            return;
        }
        
        try {
            // Try to create spine directly
            const spine = scene.add.spine(400, 300, 'noteleks-data', 'noteleks-data');
            if (spine) {
                // Try different animation methods
                if (spine.play) {
                    spine.play('idle', true);
                } else if (spine.animationState && spine.animationState.setAnimation) {
                    spine.animationState.setAnimation(0, 'idle', true);
                }
                console.log('✅ Spine created successfully:', spine);
                return spine;
            }
        } catch (error) {
            console.error('❌ Failed to create spine:', error.message);
        }
        
        return null;
    }
    
    static checkAssets() {
        const scene = window.NOTELEKS_LAST_SCENE;
        if (!scene) {
            console.error('Scene not found');
            return;
        }
        
        console.log('=== ASSET CHECK ===');
        
        // Check textures
        const textures = [
            'noteleks-texture',
            'noteleks-data!noteleks-texture',
            'skeleton'
        ];
        
        textures.forEach(key => {
            const exists = scene.textures.exists(key);
            console.log(`Texture "${key}": ${exists ? '✅' : '❌'}`);
        });
        
        // Check cache
        const cacheKeys = [
            'noteleks-skeleton-data',
            'noteleks-atlas-text',
            'noteleks-data'
        ];
        
        cacheKeys.forEach(key => {
            const jsonExists = scene.cache.json.exists(key);
            const textExists = scene.cache.text.exists(key);
            console.log(`Cache "${key}": JSON=${jsonExists ? '✅' : '❌'} TEXT=${textExists ? '✅' : '❌'}`);
        });
        
        // Check plugin
        console.log(`Spine plugin: ${scene.sys.spine ? '✅' : '❌'}`);
        console.log(`scene.add.spine: ${typeof scene.add.spine === 'function' ? '✅' : '❌'}`);
    }
    
    static fixPlayerVisibility() {
        const player = window.noteleksPlayer;
        if (!player) {
            console.error('Player not found');
            return;
        }
        
        console.log('=== PLAYER FIX ===');
        
        // Check player sprite
        if (player.sprite) {
            player.sprite.setVisible(true);
            player.sprite.setAlpha(1);
            console.log('✅ Player sprite made visible');
        }
        
        // Check spine
        if (player.spine) {
            player.spine.setVisible(true);
            player.spine.setAlpha(1);
            player.spine.setScale(0.6); // Use config scale
            console.log('✅ Player spine made visible');
        } else {
            console.log('❌ Player spine not found, trying to create...');
            // Try to create spine for player
            const scene = player.scene;
            if (scene && scene.add && scene.add.spine) {
                try {
                    const spine = scene.add.spine(player.sprite.x, player.sprite.y, 'noteleks-data', 'noteleks-data');
                    if (spine) {
                        player.spine = spine;
                        // Try different animation methods
                        if (spine.play) spine.play('idle', true);
                        else if (spine.animationState) spine.animationState.setAnimation(0, 'idle', true);
                        spine.setScale(0.6);
                        spine.setOrigin(0.5, 1);
                        console.log('✅ Created new spine for player');
                    }
                } catch (error) {
                    console.error('❌ Failed to create spine for player:', error.message);
                }
            }
        }
        
        // Center camera on player
        if (player.scene && player.scene.cameras && player.scene.cameras.main) {
            const cam = player.scene.cameras.main;
            cam.centerOn(player.sprite.x, player.sprite.y);
            console.log('✅ Camera centered on player');
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.QuickFix = QuickFix;
    console.log('QuickFix available. Try: QuickFix.checkAssets(), QuickFix.fixPlayerVisibility()');
}