/* global Phaser */
import GameConfig from '../config/GameConfig.js';
import Player from '../entities/Player.js';
import AssetManager from '../utils/AssetManager.js';
import { GameStateUtils } from '../utils/GameUtils.js';
import EnemyManager from '../managers/EnemyManager.js';
import InputManager from '../managers/InputManager.js';
import PlatformManager from '../managers/PlatformManager.js';
import GameObjectFactory from '../factories/GameObjectFactory.js';
import GameUI from '../GameUI.js';
import SystemManager from '../systems/SystemManager.js';
import WeaponManager from '../WeaponManager.js';

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
        this.inputManager = null;
        this.platformManager = null;
        this.weaponManager = null;
        this.gameUI = null;

        this.systemManager = new SystemManager(this);
        this.gameObjectFactory = new GameObjectFactory(this);
    }

    preload() {
        this.showLoadingScreen();

        // Always load player spritesheets/atlases (fallbacks)
        AssetManager.loadPlayerSpriteSheets(this, GameConfig);

        // Queue Spine raw assets only when configured
        if (GameConfig && GameConfig.useSpine && GameConfig.assets && GameConfig.assets.spine) {
            try { this.load.text('noteleks-atlas-text', GameConfig.assets.spine.atlas); } catch (e) {}
            try { this.load.json('noteleks-skeleton-data', GameConfig.assets.spine.json); } catch (e) {}
            try { this.load.image('noteleks-texture', GameConfig.assets.spine.png); } catch (e) {}
        }

        if (GameConfig && GameConfig.useSpine) {
            this.load.once('complete', () => {
                try { AssetManager.setupSpineData(this); } catch (e) { console.warn('[GameScene] setupSpineData failed on loader complete'); }
            });
        }
    }

    async create() {
        this.gameState = GameStateUtils.STATES.PLAYING;

        // expose for debugging
        if (typeof window !== 'undefined') window.NOTELEKS_LAST_SCENE = this;

        // try an early setup (no-op if spine disabled)
        if (GameConfig && GameConfig.useSpine) {
            try { AssetManager.setupSpineData(this); } catch (e) { /* ignore */ }
        }

        this.initializeManagers();
        this.createGameWorld();
        await this.setupGameObjects();
    // Ensure an animated fallback is created once both the player and
    // the fallback animation exist. This bridges timing races where
    // AssetManager prepared animations after the Player was constructed.
    try { this._ensurePlayerAnimatedFallback(); } catch (e) {}
        this.setupCollisions();
        this.registerInputHandlers();
        this.startGame();

        try { this.events.emit('noteleks:scene-ready'); } catch (e) {}
    }

    _ensurePlayerAnimatedFallback() {
        try {
            const scene = this;
            const tryCreate = () => {
                try {
                    if (!scene || !scene.anims) return false;
                    if (!scene.anims.exists || !scene.anims.exists('player-idle')) return false;
                    const p = (typeof window !== 'undefined') ? window.noteleksPlayer : null;
                    if (!p || !p.sprite) return false;

                    // Avoid recreating
                    if (p._persistentFallbackSprite && p._persistentFallbackSprite.scene) return true;

                    const fx = (p.sprite && typeof p.sprite.x === 'number') ? p.sprite.x : (scene.cameras && scene.cameras.main && scene.cameras.main.centerX) || 0;
                    const fy = (p.sprite && typeof p.sprite.y === 'number') ? p.sprite.y : (scene.cameras && scene.cameras.main && scene.cameras.main.centerY) || 0;

                    let baseTex = null;
                    if (scene.textures.exists('skeleton-idle-frame-0')) baseTex = 'skeleton-idle-frame-0';
                    else if (scene.textures.exists('skeleton-idle')) baseTex = 'skeleton-idle';
                    else if (scene.textures.exists('skeleton')) baseTex = 'skeleton';

                    const spr = scene.add.sprite(fx, fy, baseTex || null).setOrigin(0.5, 1);
                    try {
                        const baseScale = (GameConfig && GameConfig.player && typeof GameConfig.player.scale === 'number') ? GameConfig.player.scale : 1;
                        if (spr && typeof spr.setScale === 'function') spr.setScale(baseScale);
                    } catch (e) {}
                    try { if (spr && spr.play) spr.play('player-idle'); } catch (e) {}
                    if (spr && spr.setDepth) spr.setDepth(501);
                    try { if (p.sprite && typeof p.sprite.setVisible === 'function') p.sprite.setVisible(false); } catch (e) {}
                    p._persistentFallbackSprite = spr;
                    console.info('[GameScene] Created persistent animated fallback for player (player-idle) using', baseTex);
                    return true;
                } catch (e) {
                    return false;
                }
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
                    } catch (e) {}
                    if (attempts >= 30) clearInterval(iv);
                }, 200);
            }
        } catch (e) {
            // ignore
        }
    }

    initializeManagers() {
        this.enemyManager = new EnemyManager(this);
        this.inputManager = new InputManager(this);
        this.platformManager = new PlatformManager(this);

        this.weaponManager = new WeaponManager(this);
        this.gameUI = new GameUI(this);

        try { this.inputManager.initialize(); } catch (e) {}
        try {
            this.systemManager.registerSystem('weaponManager', this.weaponManager);
            this.systemManager.registerSystem('gameUI', this.gameUI);
            this.systemManager.initialize();
        } catch (e) {}
    }

    createGameWorld() {
        try { this.physics.world.setBounds(0, 0, GameConfig.screen.width, GameConfig.screen.height); } catch (e) {}
        try { AssetManager.createPlaceholderTextures(this, GameConfig); } catch (e) {}
        try { this.add.image(GameConfig.screen.width / 2, GameConfig.screen.height / 2, 'background'); } catch (e) {}

        try { this.platformManager.initialize(); } catch (e) {}
        try { this.platforms = this.platformManager.getPlatforms(); } catch (e) { this.platforms = null; }
        try { this.enemyManager.initialize(); } catch (e) {}
    }

    async setupGameObjects() {
        if (!(GameConfig && GameConfig.useSpine)) {
            const playerConfig = GameConfig.player || { startPosition: { x: 100, y: 100 } };
            this.player = new Player(this, playerConfig.startPosition.x, playerConfig.startPosition.y);
            return;
        }

        const maxWaitMs = 2000;
        const eventFired = await new Promise((resolve) => {
            let resolved = false;
            const onReady = () => { if (resolved) return; resolved = true; resolve(true); };
            this.events.once('spine-ready', onReady);
            setTimeout(() => { if (resolved) return; resolved = true; resolve(false); }, maxWaitMs);
        });

        if (!eventFired) {
            try { AssetManager.setupSpineData(this); } catch (e) {}
        }

        const playerConfig = GameConfig.player || { startPosition: { x: 100, y: 100 } };
        this.player = new Player(this, playerConfig.startPosition.x, playerConfig.startPosition.y);
    }

    setupCollisions() {
        try { if (this.player && this.platforms) this.physics.add.collider(this.player.sprite, this.platforms); } catch (e) {}
        try { if (this.enemyManager) this.enemyManager.setupCollisions(this.player, this.weaponManager); } catch (e) {}
    }

    registerInputHandlers() {
        try {
            this.inputManager.registerInputHandler('attack', (pointer) => {
                if (this.gameState === GameStateUtils.STATES.PLAYING && this.player) this.player.attack(pointer);
            });
        } catch (e) {}
    }

    startGame() { this.gameState = GameStateUtils.STATES.PLAYING; }

    update() {
        try {
            // Global quick-exit: pressing Escape should return the user to the
            // site's home page. Check first so it works from any game state.
            try {
                if (this.inputManager && typeof this.inputManager.isEscapePressed === 'function' && this.inputManager.isEscapePressed()) {
                    try { if (typeof window !== 'undefined') window.location.href = '/'; } catch (e) {}
                    return;
                }
            } catch (e) {}
            // When playing, run the main gameplay update
            if (this.gameState === GameStateUtils.STATES.PLAYING) {
                this.handleGameplayUpdate();
                return;
            }

            // When paused, allow pause-specific input handling
            if (this.gameState === GameStateUtils.STATES.PAUSED) {
                try { this.handlePausedInput(); } catch (e) {}
                return;
            }

            // When game over, listen for restart/quit input
            if (this.gameState === GameStateUtils.STATES.GAME_OVER) {
                try { this.handleGameOverInput(); } catch (e) {}
                return;
            }
        } catch (e) {
            // swallow update errors to avoid breaking the main loop
        }
    }

    handleGameplayUpdate() {
        try { this.systemManager.update && this.systemManager.update(16); } catch (e) {}
        try {
            if (this.player && this.inputManager) {
                if (this.inputManager.isMobileDevice && this.inputManager.isMobileDevice()) {
                    const touchState = this.inputManager.getMovementInput();
                    this.player.updateWithInputState && this.player.updateWithInputState(touchState);
                } else {
                    const controls = this.inputManager.getControls && this.inputManager.getControls();
                    if (controls && controls.cursors) this.player.update && this.player.update(controls.cursors, controls.wasd, controls.space);
                }
            }
        } catch (e) {}
        try { this.enemyManager && this.enemyManager.update && this.enemyManager.update(this.player); } catch (e) {}
    }

    handleGameOverInput() { if (this.inputManager && this.inputManager.isRestartPressed && this.inputManager.isRestartPressed()) this.restartGame(); }
    handlePausedInput() { if (this.inputManager && this.inputManager.isPausePressed && this.inputManager.isPausePressed()) this.resumeGame(); }

    showLoadingScreen() {
        try {
            this.add.text(GameConfig.screen.width / 2, GameConfig.screen.height / 2, 'Loading Noteleks Heroes...', { fontSize: '24px', fill: '#4ade80', fontFamily: 'Arial' }).setOrigin(0.5);
        } catch (e) {}
    }

    addScore(points) { try { this.gameUI && this.gameUI.addScore(points); } catch (e) {} }

    pauseGame() {
        if (this.gameState === GameStateUtils.STATES.PLAYING) {
            this.gameState = GameStateUtils.STATES.PAUSED;
            try { this.physics && this.physics.pause(); } catch (e) {}
            try { this.systemManager && this.systemManager.pause(); } catch (e) {}
            try { this.gameUI && this.gameUI.showPauseScreen(); } catch (e) {}
        }
    }

    resumeGame() {
        if (this.gameState === GameStateUtils.STATES.PAUSED) {
            this.gameState = GameStateUtils.STATES.PLAYING;
            try { this.physics && this.physics.resume(); } catch (e) {}
            try { this.systemManager && this.systemManager.resume(); } catch (e) {}
            try { this.gameUI && this.gameUI.hidePauseScreen(); } catch (e) {}
        }
    }

    gameOver() {
        this.gameState = GameStateUtils.STATES.GAME_OVER;
        try { this.physics && this.physics.pause(); } catch (e) {}
        try { this.gameUI && this.gameUI.showGameOver(); } catch (e) {}
        try { this.enemyManager && this.enemyManager.stopSpawning(); } catch (e) {}
    }

    restartGame() {
        this.gameState = GameStateUtils.STATES.PLAYING;
        try { this.enemyManager && this.enemyManager.reset(); } catch (e) {}
        try { this.weaponManager && this.weaponManager.getWeaponsGroup && this.weaponManager.getWeaponsGroup().clear(true, true); } catch (e) {}
        try { this.gameUI && this.gameUI.reset(); } catch (e) {}
        try { const playerConfig = GameConfig.player || { startPosition: { x: 100, y: 100 } }; this.player && this.player.reset && this.player.reset(playerConfig.startPosition.x, playerConfig.startPosition.y); } catch (e) {}
        try { this.physics && this.physics.resume(); } catch (e) {}
    }

    shutdown() {
        try { this.enemyManager && this.enemyManager.shutdown(); } catch (e) {}
        try { this.inputManager && this.inputManager.shutdown(); } catch (e) {}
        try { this.platformManager && this.platformManager.shutdown(); } catch (e) {}
        try { this.systemManager && this.systemManager.shutdown(); } catch (e) {}
    }
}

export default GameScene;
