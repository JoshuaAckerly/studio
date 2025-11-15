/**
 * Game Configuration - Clean Version
 * Central configuration for all game settings
 */
export const GameConfig = {
    // Screen settings
    screen: {
        width: 800,
        height: 600,
        backgroundColor: 0x2d2d2d,
    },

    // Using frame-by-frame sprite animations only
    useSpine: false,

    // Physics settings
    physics: {
        gravity: { x: 0, y: 300 },
        debug: false,
    },

    // Player settings
    player: {
        startPosition: { x: 400, y: 300 },
        speed: 160,
        jumpPower: 330,
        health: 100,
        maxHealth: 100,
        scale: 0.3,
        targetPixelHeight: 96,
    },

    // Enemy settings
    enemies: {
        spawnInterval: 3000, // milliseconds
        maxEnemies: 5, // Maximum number of enemies allowed at once
        spawnDistance: {
            minFromEdge: 50,
            maxFromEdge: 200,
        },
        types: {
            zombie: {
                health: 5,
                speed: 60,
                jumpPower: 200,
                damage: 20,
                detectionRange: 800,
                color: 0x00ff00,
                score: 10,
            },
            skeleton: {
                health: 7,
                speed: 100,
                jumpPower: 250,
                damage: 25,
                detectionRange: 850,
                color: 0xcccccc,
                score: 15,
            },
            ghost: {
                health: 4,
                speed: 120,
                jumpPower: 0, // Ghosts float
                damage: 15,
                detectionRange: 900,
                color: 0x8888ff,
                score: 20,
            },
            boss: {
                health: 15,
                speed: 80,
                jumpPower: 300,
                damage: 40,
                detectionRange: 1000,
                color: 0xff0000,
                score: 100,
            },
        },
    },

    // Combat settings
    combat: {
        knockback: {
            forceX: 200,        // Horizontal knockback force
            forceY: -100,       // Vertical knockback force (negative = upward)
            enemyMass: 1,       // Enemy physics mass
            enemyDrag: 80,      // Enemy drag for natural deceleration
            stunDuration: 800,  // Time in ms enemy can't move after knockback
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
        textures: {
            skeleton: { width: 64, height: 96, color: 0xff0000 },
            enemy: { width: 32, height: 40, color: 0x008000 },
            ground: { width: 64, height: 32, color: 0x4a4a4a },
            background: { width: 800, height: 600, color: 0x2d2d2d },
            dagger: { width: 16, height: 4, color: 0xc0c0c0 },
            fireball: { width: 16, height: 16, color: 0xff4400 },
            arrow: { width: 20, height: 4, color: 0x8b4513 },
            magic_bolt: { width: 12, height: 12, color: 0x9900ff },
        },
    },

    // Debug settings (disabled by default for clean version)
    debug: {
        enablePlayerDebugOverlay: false,
        suppressLogPrefixes: ['[Player]', '[Spine]'],
        syncDOM: false,
    },
};

export default GameConfig;