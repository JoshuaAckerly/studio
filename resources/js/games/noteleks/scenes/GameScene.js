/* global Phaser */
import GameConfig from '../config/GameConfig.js';
import AssetManager from '../utils/AssetManagerSimple.js';
import { GameStateUtils } from '../utils/GameUtils.js';
import EnemyManager from '../managers/EnemyManager.js';

import PlatformManager from '../managers/PlatformManager.js';
import PhysicsManager from '../managers/PhysicsManager.js';
import EntityFactory from '../factories/EntityFactory.js';
import GameUI from '../GameUI.js';
import SystemManager from '../systems/SystemManager.js';
import WeaponManager from '../WeaponManager.js';
import TouchInputManager from '../managers/TouchInputManager.js';

/**
 * Minimal, robust GameScene replacement.
 * Keeps Spine opt-out via GameConfig.useSpine and wires AssetManager fallbacks.
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.gameState = GameStateUtils.STATES.LOADING;
        this.player = null;
        this.enemyManager = null;

        this.platformManager = null;
        this.physicsManager = null;
        this.weaponManager = null;
        this.gameUI = null;
        this.inputManager = null;

        this.systemManager = new SystemManager(this);
        this.entityFactory = new EntityFactory(this);

        // --- ROUND SYSTEM ---
        this.currentRound = 1;
        this.maxRounds = 10;
        this.enemiesToSpawn = 0;
        this.enemiesSpawnedThisRound = 0;
        this.roundActive = false;
        this.roundInTransition = false;
    }

    preload() {
        this.showLoadingScreen();

        // Note: asset loading is handled by LoadingScene. GameScene.preload
        // keeps spine raw asset queuing in case GameScene is started directly
        // (defensive), but avoid re-queuing player sprites here.

        // Queue Spine raw assets only when configured
        if (GameConfig && GameConfig.useSpine && GameConfig.assets && GameConfig.assets.spine) {
            try { this.load.text('noteleks-atlas-text', GameConfig.assets.spine.atlas); } catch { /* ignore */ }
            try { this.load.json('noteleks-skeleton-data', GameConfig.assets.spine.json); } catch { /* ignore */ }
            try { this.load.image('noteleks-texture', GameConfig.assets.spine.png); } catch { /* ignore */ }
        }

        if (GameConfig && GameConfig.useSpine) {
            this.load.once('complete', () => {
                try { AssetManager.setupSpineData(this); } catch { console.warn('[GameScene] setupSpineData failed on loader complete'); }
            });
        }
    }

    async create() {
        this.gameState = GameStateUtils.STATES.PLAYING;

        // expose for debugging
        if (typeof window !== 'undefined') window.NOTELEKS_LAST_SCENE = this;

        // try an early setup (no-op if spine disabled)
        if (GameConfig && GameConfig.useSpine) {
            try { AssetManager.setupSpineData(this); } catch { /* ignore */ }
        }
        this.initializeManagers();
        this.createGameWorld();
        await this.setupGameObjects();
        try { this._ensurePlayerAnimatedFallback(); } catch { /* ignore */ }
        this.setupCollisions();
        this.registerInputHandlers();
        this.startGame();
        this.startNextRound();
        try { this.events.emit('noteleks:scene-ready'); } catch { /* ignore */ }
    }

    _ensurePlayerAnimatedFallback() {
        try {
            const tryCreate = () => {
                try {
                    if (!this || !this.anims) return false;
                    if (!this.anims.exists || !this.anims.exists('player-idle')) return false;
                    const p = (typeof window !== 'undefined') ? window.noteleksPlayer : null;
                    if (!p || !p.sprite) return false;

                    // Avoid recreating
                    if (p._persistentFallbackSprite && p._persistentFallbackSprite.scene) return true;

                    const fx = (p.sprite && typeof p.sprite.x === 'number') ? p.sprite.x : (this.cameras && this.cameras.main && this.cameras.main.centerX) || 0;
                    const fy = (p.sprite && typeof p.sprite.y === 'number') ? p.sprite.y : (this.cameras && this.cameras.main && this.cameras.main.centerY) || 0;

                    let baseTex = null;
                    if (this.textures.exists('skeleton-idle-frame-0')) baseTex = 'skeleton-idle-frame-0';
                    else if (this.textures.exists('skeleton-idle')) baseTex = 'skeleton-idle';
                    else if (this.textures.exists('skeleton')) baseTex = 'skeleton';

                    const spr = this.add.sprite(fx, fy, baseTex || null).setOrigin(0.5, 1);
                    try {
                        // Prefer the Player's applied scale (which may be an override from setDisplayHeight)
                        const baseScale = (p && typeof p.getAppliedScale === 'function') ? p.getAppliedScale() : ((GameConfig && GameConfig.player && typeof GameConfig.player.scale === 'number') ? GameConfig.player.scale : 1);
                        if (spr && typeof spr.setScale === 'function') spr.setScale(baseScale);
                    } catch { /* ignore */ }
                    try { if (spr && spr.play) spr.play('player-idle'); } catch { /* ignore */ }
                    if (spr && spr.setDepth) spr.setDepth(501);
                    try { if (p.sprite && typeof p.sprite.setVisible === 'function') p.sprite.setVisible(false); } catch { /* ignore */ }
                    p._persistentFallbackSprite = spr;
                    // If a precise target pixel height is configured, ask the Player
                    // to compute and apply the final scale so the on-screen height
                    // matches exactly (this handles timing races where AssetManager
                    // prepared animations after the Player constructor ran).
                    try { if (GameConfig && GameConfig.player && GameConfig.player.targetPixelHeight && p && typeof p.setDisplayHeight === 'function') p.setDisplayHeight(GameConfig.player.targetPixelHeight); } catch { /* ignore */ }
                    console.info('[GameScene] Created persistent animated fallback for player (player-idle) using', baseTex);
                    return true;
                } catch { return false; }
            };

            // Try right away, then poll briefly if needed
            tryCreate();
            if (!tryCreate()) {
                let attempts = 0;
                const iv = setInterval(() => {
                    attempts += 1;
                    try {
                        if (tryCreate()) {
                            clearInterval(iv);
                            return;
                        }
                    } catch { /* ignore */ }
                    if (attempts >= 30) clearInterval(iv);
                }, 200);
            }
        } catch { /* ignore */ }
    }

    initializeManagers() {
        this.enemyManager = new EnemyManager(this);
        this.physicsManager = new PhysicsManager(this);
        this.platformManager = new PlatformManager(this);

        this.weaponManager = new WeaponManager(this);
        this.inputManager = new TouchInputManager(this);
        this.gameUI = new GameUI(this);


        try {
            this.systemManager.registerSystem('weaponManager', this.weaponManager);
            this.systemManager.registerSystem('inputManager', this.inputManager);
            this.systemManager.registerSystem('gameUI', this.gameUI);
            this.systemManager.initialize();
        } catch { /* ignore */ }
    }

    createGameWorld() {
        try { this.physics.world.setBounds(0, 0, GameConfig.screen.width, GameConfig.screen.height); } catch { /* ignore */ }
        try { 
            AssetManager.createPlaceholderTextures(this, GameConfig);
        } catch { /* ignore */ }
        try { this.add.image(GameConfig.screen.width / 2, GameConfig.screen.height / 2, 'background'); } catch { /* ignore */ }

        try { this.platformManager.initialize(); } catch { /* ignore */ }
        try { this.platforms = this.platformManager.getPlatforms(); } catch { this.platforms = null; }
        try { this.enemyManager.initialize(); } catch { /* ignore */ }
    }

    createBasicAnimations() {
        try {
            // Create WebP animations from loaded frames
            if (!this.anims.exists('player-idle')) {
                this.anims.create({
                    key: 'player-idle',
                    frames: [
                        { key: 'Skeleton-Idle-0' },
                        { key: 'Skeleton-Idle-00' },
                        { key: 'Skeleton-Idle-01' },
                        { key: 'Skeleton-Idle-02' },
                        { key: 'Skeleton-Idle-03' },
                        { key: 'Skeleton-Idle-04' },
                        { key: 'Skeleton-Idle-05' },
                        { key: 'Skeleton-Idle-06' },
                        { key: 'Skeleton-Idle-07' },
                        { key: 'Skeleton-Idle-08' }
                    ],
                    frameRate: 8,
                    repeat: -1
                });
            }
            
            if (!this.anims.exists('player-run')) {
                this.anims.create({
                    key: 'player-run',
                    frames: [
                        { key: 'Skeleton-Run-0' },
                        { key: 'Skeleton-Run-00' },
                        { key: 'Skeleton-Run-01' },
                        { key: 'Skeleton-Run-02' },
                        { key: 'Skeleton-Run-03' },
                        { key: 'Skeleton-Run-04' },
                        { key: 'Skeleton-Run-05' },
                        { key: 'Skeleton-Run-06' }
                    ],
                    frameRate: 12,
                    repeat: -1
                });
            }
            
            if (!this.anims.exists('player-attack')) {
                this.anims.create({
                    key: 'player-attack',
                    frames: [
                        { key: 'Skeleton-Attack1-0' },
                        { key: 'Skeleton-Attack1-1' }
                    ],
                    frameRate: 8,
                    repeat: 0
                });
            }
            
            if (!this.anims.exists('player-jump')) {
                this.anims.create({
                    key: 'player-jump',
                    frames: [{ key: 'Skeleton-Jump-0' }],
                    frameRate: 1,
                    repeat: 0
                });
            }
        } catch { /* ignore */ }
    }

    async setupGameObjects() {
        const playerConfig = GameConfig.player || { startPosition: { x: 100, y: 100 } };
        
        // Use EntityFactory to create player
        this.player = this.entityFactory.createPlayer(
            playerConfig.startPosition.x, 
            playerConfig.startPosition.y
        );
    }

    setupCollisions() {
        try {
            if (this.player && this.platforms) {
                this.physicsManager.setupCollision(this.player.sprite, this.platforms);
            }
        } catch { /* ignore */ }
        try { if (this.enemyManager) this.enemyManager.setupCollisions(this.player, this.weaponManager); } catch { /* ignore */ }
    }

    registerInputHandlers() {
        // Input handling is now managed by Player's InputHandler
    }

    startGame() { this.gameState = GameStateUtils.STATES.PLAYING; }

    update() {
        try {
            // Global quick-exit: pressing Escape should return the user to the
            // site's home page. Check first so it works from any game state.
            // Global input handling is now done by Player's InputHandler
            if (this.player && this.player.inputHandler) {
                this.player.inputHandler.update();
            }
            // When playing, run the main gameplay update
            if (this.gameState === GameStateUtils.STATES.PLAYING) {
                this.handleGameplayUpdate();
                this.handleRoundLogic();
                return;
            }

            // When paused, allow pause-specific input handling
            if (this.gameState === GameStateUtils.STATES.PAUSED) {
                try { this.handlePausedInput(); } catch { /* ignore */ }
                return;
            }

            // When game over, listen for restart/quit input
            if (this.gameState === GameStateUtils.STATES.GAME_OVER) {
                try { this.handleGameOverInput(); } catch { /* ignore */ }
                return;
            }
        } catch { /* ignore */ }
    }

    // --- ROUND SYSTEM ---
    startNextRound() {
        if (this.currentRound > this.maxRounds) {
            this.handleVictory();
            return;
        }
        this.roundActive = false;
        this.roundInTransition = true;
        // Example: 3 + round*2 enemies per round
        this.enemiesToSpawn = 3 + this.currentRound * 2;
        this.enemiesSpawnedThisRound = 0;
        if (this.enemyManager) {
            this.enemyManager.clearAllEnemies();
        }
        // Optionally show round UI here
        if (this.gameUI && this.gameUI.showRound) {
            this.gameUI.showRound(this.currentRound);
        }
        // Delay before round starts
        this.time.delayedCall(1500, () => {
            this.roundActive = true;
            this.roundInTransition = false;
        });
    }

    handleRoundLogic() {
        if (!this.roundActive || this.roundInTransition) return;
        // Spawn enemies for this round
        if (this.enemiesSpawnedThisRound < this.enemiesToSpawn) {
            // Only spawn if not exceeding maxEnemies
            if (this.enemyManager && this.enemyManager.getEnemyCount() < GameConfig.enemies.maxEnemies) {
                this.enemyManager.spawnEnemy();
                this.enemiesSpawnedThisRound++;
            }
        } else {
            // All enemies spawned, check if all defeated
            if (this.enemyManager && this.enemyManager.getEnemyCount() === 0) {
                this.currentRound++;
                this.startNextRound();
            }
        }
    }

    handleVictory() {
        this.gameState = GameStateUtils.STATES.GAME_OVER;
        if (this.gameUI && this.gameUI.showVictory) {
            this.gameUI.showVictory();
        } else {
            this.add.text(GameConfig.screen.width / 2, GameConfig.screen.height / 2, 'Victory! All rounds complete!', { fontSize: '32px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);
        }
        if (this.enemyManager) this.enemyManager.stopSpawning();
    }

    handleGameplayUpdate() {
        try { if (this.inputManager) this.inputManager.update(); } catch { /* ignore */ }
        try { if (this.systemManager && this.systemManager.update) this.systemManager.update(16); } catch { /* ignore */ }
        try { if (this.player) this.player.update(); } catch { /* ignore */ }
        try { if (this.enemyManager && this.enemyManager.update) this.enemyManager.update(this.player); } catch { /* ignore */ }
    }

    handleGameOverInput() { 
        // Game over input is handled by Player's InputHandler
    }
    handlePausedInput() { 
        // Pause input handling simplified
    }

    showLoadingScreen() {
        try {
            this.add.text(GameConfig.screen.width / 2, GameConfig.screen.height / 2, 'Loading Noteleks Heroes...', { fontSize: '24px', fill: '#4ade80', fontFamily: 'Arial' }).setOrigin(0.5);
        } catch { /* ignore */ }
    }

    addScore(points) { try { if (this.gameUI) this.gameUI.addScore(points); } catch { /* ignore */ } }

    pauseGame() {
        if (this.gameState === GameStateUtils.STATES.PLAYING) {
            this.gameState = GameStateUtils.STATES.PAUSED;
            try { if (this.physics) this.physics.pause(); } catch { /* ignore */ }
            try { if (this.systemManager) this.systemManager.pause(); } catch { /* ignore */ }
            try { if (this.gameUI) this.gameUI.showPauseScreen(); } catch { /* ignore */ }
        }
    }
    resumeGame() {
        if (this.gameState === GameStateUtils.STATES.PAUSED) {
            this.gameState = GameStateUtils.STATES.PLAYING;
            try { if (this.physics) this.physics.resume(); } catch { /* ignore */ }
            try { if (this.systemManager) this.systemManager.resume(); } catch { /* ignore */ }
            try { if (this.gameUI) this.gameUI.hidePauseScreen(); } catch { /* ignore */ }
        }
    }
    gameOver() {
        this.gameState = GameStateUtils.STATES.GAME_OVER;
        // Reset round state
        this.currentRound = 1;
        this.enemiesToSpawn = 0;
        this.enemiesSpawnedThisRound = 0;
        this.roundActive = false;
        this.roundInTransition = false;
        try { if (this.physics) this.physics.pause(); } catch { /* ignore */ }
        try { if (this.gameUI) this.gameUI.showGameOver(); } catch { /* ignore */ }
        try { if (this.enemyManager) this.enemyManager.stopSpawning(); } catch { /* ignore */ }
    }
    restartGame() {
        this.gameState = GameStateUtils.STATES.PLAYING;
        // Reset round state
        this.currentRound = 1;
        this.enemiesToSpawn = 0;
        this.enemiesSpawnedThisRound = 0;
        this.roundActive = false;
        this.roundInTransition = false;
        try { if (this.enemyManager) this.enemyManager.reset(); } catch { /* ignore */ }
        try { if (this.weaponManager && this.weaponManager.getWeaponsGroup) this.weaponManager.getWeaponsGroup().clear(true, true); } catch { /* ignore */ }
        try { if (this.gameUI) this.gameUI.reset(); } catch { /* ignore */ }
        try { const playerConfig = GameConfig.player || { startPosition: { x: 100, y: 100 } }; if (this.player && this.player.reset) this.player.reset(playerConfig.startPosition.x, playerConfig.startPosition.y); } catch { /* ignore */ }
        try { if (this.physics) this.physics.resume(); } catch { /* ignore */ }
        // Start first round again
        this.startNextRound();
    }
    shutdown() {
        try { if (this.enemyManager) this.enemyManager.shutdown(); } catch { /* ignore */ }
        try { if (this.inputManager) this.inputManager.destroy(); } catch { /* ignore */ }
        try { if (this.platformManager) this.platformManager.shutdown(); } catch { /* ignore */ }
        try { this.physicsManager = null; } catch { /* ignore */ }
        try { if (this.systemManager) this.systemManager.shutdown(); } catch { /* ignore */ }
    }
}

export default GameScene;
