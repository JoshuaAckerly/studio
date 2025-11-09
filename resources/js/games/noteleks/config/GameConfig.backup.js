/**
 * Game Configuration
 * Central configuration for all game settings
 */
export const GameConfig = {
    // Screen settings
    screen: {
        width: 800,
        height: 600,
        backgroundColor: 0x2d2d2d,
    },

    // Toggle whether the Spine runtime and skeleton assets should be used.
    // Set to `false` to run using only frame-by-frame sprite animations.
    useSpine: false,

    // Physics settings
    physics: {
        gravity: { x: 0, y: 300 },
        debug: false,
    },

    // Player settings
    player: {
        startPosition: { x: 100, y: 520 }, // Ground at y=568, player height=48, so y=568-24=544 minus some clearance
        speed: 160,
        jumpPower: 330,
        health: 100,
        maxHealth: 100,
    // Visual scale applied to the Spine/GameObject display. Use <1 to shrink the character.
    // Increased the base scale because incoming Spine skins were exported smaller.
    // Set to 1.0 by default and rely on targetPixelHeight for precise sizing.
    scale: 2.0,
    // Optional: target on-screen height in pixels. When set, Player will compute
    // an override scale so the visual height matches this value (preferred
    // precise sizing method). Increase this value to make the player visually larger.
    // Previously 96 — bumping to 140 to better match the new, smaller imported skins.
    targetPixelHeight: 120,
    },

    // Enemy settings
    enemies: {
        spawnInterval: 3000, // milliseconds
        spawnDistance: {
            minFromEdge: 50,
            maxFromEdge: 200,
        },
        types: {
            zombie: {
                health: 2,
                speed: 60,
                jumpPower: 200,
                damage: 20,
                detectionRange: 800,
                color: 0x00ff00,
                score: 10,
            },
            skeleton: {
                health: 3,
                speed: 100,
                jumpPower: 250,
                damage: 25,
                detectionRange: 850,
                color: 0xcccccc,
                score: 15,
            },
            ghost: {
                health: 1,
                speed: 120,
                jumpPower: 0, // Ghosts float
                damage: 15,
                detectionRange: 900,
                color: 0x8888ff,
                score: 20,
            },
            boss: {
                health: 10,
                speed: 80,
                jumpPower: 300,
                damage: 40,
                detectionRange: 1000,
                color: 0xff0000,
                score: 100,
            },
        },
    },

    // Weapon settings
    weapons: {
        dagger: {
            damage: 1,
            range: 50,
            cooldown: 500,
        },
        fireball: {
            damage: 2,
            speed: 300,
            cooldown: 800,
        },
        arrow: {
            damage: 1.5,
            speed: 400,
            cooldown: 600,
        },
        magic_bolt: {
            damage: 3,
            speed: 350,
            cooldown: 1000,
        },
    },

    // UI settings
    ui: {
        healthBar: {
            position: { x: 20, y: 20 },
            width: 200,
            height: 20,
        },
        score: {
            position: { x: 20, y: 50 },
            fontSize: '20px',
            color: '#4ade80',
        },
    },

    // Asset paths
    assets: {
        spine: {
            atlas: '/games/noteleks/spine/characters/Noteleks.atlas',
            json: '/games/noteleks/spine/characters/Noteleks.json',
            png: '/games/noteleks/spine/characters/Noteleks.png',
        },
        textures: {
            skeleton: { width: 64, height: 96, color: 0xffffff },
            enemy: { width: 32, height: 40, color: 0x008000 },
            ground: { width: 64, height: 32, color: 0x4a4a4a },
            background: { width: 800, height: 600, color: 0x2d2d2d },
            dagger: { width: 16, height: 4, color: 0xc0c0c0 },
            fireball: { width: 16, height: 16, color: 0xff4400 },
            arrow: { width: 20, height: 4, color: 0x8b4513 },
            magic_bolt: { width: 12, height: 12, color: 0x9900ff },
        },
    },
    // Debugging toggles (keep disabled by default)
    debug: {
        // When true, the in-page Player debug overlay will be shown automatically
        // Set to `true` during development when you want the UI. You can also
        // enable it at runtime by setting `window.noteleksDebug = true` in the
        // browser console before loading the game.
        enablePlayerDebugOverlay: true,
        // Prefixes to suppress from the console when debug UI is disabled.
        // Messages that contain any of these substrings will be filtered out
        // from `console.log/info/debug` to reduce noise.
        suppressLogPrefixes: [],
        // When true, small convenience DOM syncs (like updating an external #score-value)
        // will run. Keep false in production so UI concerns remain in-canvas only.
        syncDOM: false,
    },
};

export default GameConfig;
