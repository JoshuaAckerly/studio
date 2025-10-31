/**
 * Spine Debug Helper
 * Run this in browser console to diagnose Spine loading issues
 */
export class SpineDebugger {
    static diagnose(scene) {
        console.log('=== SPINE DIAGNOSTIC REPORT ===');
        
        // Check if scene exists
        if (!scene) {
            console.error('No scene provided');
            return;
        }
        
        // Check Spine plugin
        console.log('1. Spine Plugin Check:');
        console.log('   - scene.sys.spine exists:', !!(scene.sys && scene.sys.spine));
        console.log('   - scene.add.spine exists:', !!(scene.add && scene.add.spine));
        
        // Check asset loading
        console.log('2. Asset Loading Check:');
        const textures = scene.textures;
        const cache = scene.cache;
        
        console.log('   - noteleks-texture exists:', textures.exists('noteleks-texture'));
        console.log('   - noteleks-data atlas exists:', cache.text.exists('noteleks-atlas-text'));
        console.log('   - noteleks-skeleton-data exists:', cache.json.exists('noteleks-skeleton-data'));
        
        // List all loaded textures
        console.log('3. All Loaded Textures:');
        Object.keys(textures.list).forEach(key => {
            console.log(`   - ${key}`);
        });
        
        // List all cached JSON
        console.log('4. All Cached JSON:');
        if (cache.json.keys) {
            Object.keys(cache.json.keys).forEach(key => {
                console.log(`   - ${key}`);
            });
        }
        
        // Check player object
        console.log('5. Player Object Check:');
        const player = window.noteleksPlayer;
        if (player) {
            console.log('   - Player exists:', !!player);
            console.log('   - Player.sprite exists:', !!player.sprite);
            console.log('   - Player.spine exists:', !!player.spine);
            if (player.spine) {
                console.log('   - Spine visible:', player.spine.visible);
                console.log('   - Spine alpha:', player.spine.alpha);
                console.log('   - Spine position:', player.spine.x, player.spine.y);
                console.log('   - Spine scale:', player.spine.scaleX, player.spine.scaleY);
            }
        } else {
            console.log('   - Player not found in window.noteleksPlayer');
        }
        
        console.log('=== END DIAGNOSTIC ===');
    }
    
    static forceCreateSpine(scene) {
        if (!scene || !scene.add || !scene.add.spine) {
            console.error('Spine plugin not available');
            return null;
        }
        
        try {
            const spine = scene.add.spine(400, 300, 'noteleks-data', 'noteleks-data');
            console.log('Force created spine:', spine);
            return spine;
        } catch (error) {
            console.error('Failed to force create spine:', error);
            return null;
        }
    }
}

// Make available globally for console debugging
if (typeof window !== 'undefined') {
    window.SpineDebugger = SpineDebugger;
}