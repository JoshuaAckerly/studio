/* global Phaser */
import GameConfig from '../config/GameConfig.js';
import AssetManager from '../utils/AssetManagerSimple.js';

class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        try { this.cameras.main.setBackgroundColor(GameConfig.screen.backgroundColor); } catch (e) {}

        // Show a simple progress text
        try {
            const w = (GameConfig && GameConfig.screen && GameConfig.screen.width) || this.cameras.main.width;
            const h = (GameConfig && GameConfig.screen && GameConfig.screen.height) || this.cameras.main.height;
            this._progressText = this.add.text(w / 2, h / 2, 'Loading...', { font: '16px Arial', fill: '#ffffff' }).setOrigin(0.5);
        } catch (e) { /* ignore */ }

        // Load WebP animation frames directly
        try {
            // Load idle animation frames
            for (let i = 0; i <= 15; i++) {
                const frameNum = i.toString().padStart(2, '0');
                this.load.image(`skeleton-idle-${i}`, `/games/noteleks/sprites/Skeleton-Idle_${frameNum}.webp`);
            }
            
            // Load run animation frames
            for (let i = 0; i <= 15; i++) {
                const frameNum = i.toString().padStart(2, '0');
                this.load.image(`skeleton-run-${i}`, `/games/noteleks/sprites/Skeleton-Run_${frameNum}.webp`);
            }
            
            // Load attack animations
            for (let i = 0; i <= 2; i++) {
                this.load.image(`skeleton-attack1-${i}`, `/games/noteleks/sprites/Skeleton-Attack1_${i}.webp`);
            }
            
            // Load jump animation
            this.load.image('skeleton-jump-0', '/games/noteleks/sprites/Skeleton-Jump_0.webp');
            
            // Load jump attack animation
            for (let i = 0; i <= 7; i++) {
                this.load.image(`skeleton-jumpattack-${i}`, `/games/noteleks/sprites/Skeleton-JumpAttack_${i}.webp`);
            }
            
            // Load weapon sprites
            this.load.image('spear', '/games/noteleks/sprites/Spear.png');
            
            // Show progress
            this.load.on('progress', (p) => {
                if (this._progressText) this._progressText.setText('Loading: ' + Math.round(p * 100) + '%');
            });
            
            // When loading completes, create animations and start GameScene
            this.load.once('complete', () => {
                this.createAnimations();
                this.scene.start('GameScene');
            });
        } catch (e) {
            console.warn('[LoadingScene] WebP loading failed', e.message);
        }
    }

    create() {
        // nothing — transition happens on loader complete
    }
    
    createAnimations() {
        try {
            // Create idle animation
            const idleFrames = [];
            for (let i = 0; i <= 15; i++) {
                idleFrames.push({ key: `skeleton-idle-${i}` });
            }
            this.anims.create({
                key: 'player-idle',
                frames: idleFrames,
                frameRate: 8,
                repeat: -1
            });
            
            // Create run animation
            const runFrames = [];
            for (let i = 0; i <= 15; i++) {
                runFrames.push({ key: `skeleton-run-${i}` });
            }
            this.anims.create({
                key: 'player-run',
                frames: runFrames,
                frameRate: 12,
                repeat: -1
            });
            
            // Create attack animation
            const attackFrames = [];
            for (let i = 0; i <= 2; i++) {
                attackFrames.push({ key: `skeleton-attack1-${i}` });
            }
            this.anims.create({
                key: 'player-attack',
                frames: attackFrames,
                frameRate: 10,
                repeat: 0
            });
            
            // Create jump animation using JumpAttack frames for more dynamic movement
            const jumpFrames = [];
            for (let i = 0; i <= 7; i++) {
                jumpFrames.push({ key: `skeleton-jumpattack-${i}` });
            }
            this.anims.create({
                key: 'player-jump',
                frames: jumpFrames,
                frameRate: 15,
                repeat: 0
            });
            
            console.log('[LoadingScene] Created WebP animations');
        } catch (e) {
            console.error('[LoadingScene] Failed to create animations:', e.message);
        }
    }
}

export default LoadingScene;
