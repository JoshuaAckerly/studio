/* global Phaser */
import GameConfig from './config/GameConfig.js';
import GameScene from './scenes/GameScene.js';
import LoadingScene from './scenes/LoadingScene.js';

// Spine plugin is imported dynamically inside initialize() to keep the main
// bundle smaller and allow code-splitting. Do not import it at top-level.

/**
 * Noteleks Game - Main Game Class
 * Refactored for modularity and maintainability
 */
class NoteleksGame {
    constructor() {
        this.game = null;
        // Install global error handlers early so mobile-only failures can be captured
        // into localStorage for post-mortem inspection. See _installGlobalErrorHandlers().
        this._installGlobalErrorHandlers();

        // Lightweight low-end device detection: use conservative heuristics to
        // decide whether to enable a lowQuality fallback mode that avoids heavy
        // assets (Spine) and reduces resolution. This helps small/old phones.
        try {
            const deviceMemory = (navigator && navigator.deviceMemory) ? Number(navigator.deviceMemory) : null;
            const cores = (navigator && navigator.hardwareConcurrency) ? Number(navigator.hardwareConcurrency) : null;
            const ua = navigator && navigator.userAgent || '';
            // Heuristics: memory < 2GB or 1-2 cores => lowQuality
            const lowMem = deviceMemory !== null ? deviceMemory < 2 : false;
            const lowCores = cores !== null ? cores <= 2 : false;
            const smallScreenUA = /iPhone|Android/i.test(ua) && window.innerWidth <= 420;
            this._detectedDeviceInfo = { deviceMemory, cores, ua };
            // Expose a global flag for debug/QA toggles
            window.noteleks_lowQuality = (lowMem || lowCores || smallScreenUA) ? true : false;
            GameConfig.lowQuality = !!window.noteleks_lowQuality;
            if (GameConfig.lowQuality) {
                console.info('[NoteleksGame] Low-quality mode enabled by device heuristics', this._detectedDeviceInfo);
            }
        } catch (e) {
            // ignore detection errors
            GameConfig.lowQuality = false;
        }

        this.config = this.createGameConfig();
    }

    _installGlobalErrorHandlers() {
        try {
            // Keep the original handlers if set so we don't clobber other code.
            const originalOnError = window.onerror;
            window.onerror = (message, source, lineno, colno, error) => {
                try {
                    const payload = {
                        type: 'error',
                        message: message && (message.stack || message) || (error && error.message) || String(message),
                        stack: (error && (error.stack || null)) || null,
                        source,
                        lineno,
                        colno,
                        userAgent: navigator.userAgent,
                        deviceMemory: navigator.deviceMemory || null,
                        cores: navigator.hardwareConcurrency || null,
                        ts: Date.now(),
                    };
                    try { localStorage.setItem('noteleks_last_error', JSON.stringify(payload)); } catch (e) {}
                    // Try sendBeacon as a best-effort remote capture (server endpoint optional)
                    try {
                        if (navigator && typeof navigator.sendBeacon === 'function') {
                            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                            navigator.sendBeacon('/__noteleks_error', blob);
                        }
                    } catch (e) {}
                } catch (e) {
                    // ignore storage/set errors
                }
                if (typeof originalOnError === 'function') {
                    try { originalOnError(message, source, lineno, colno, error); } catch (e) {}
                }
                // Do not suppress the default handler return value (let it run normally)
                return false;
            };

            window.addEventListener('unhandledrejection', (ev) => {
                try {
                    const reason = ev && ev.reason;
                    const payload = {
                        type: 'unhandledrejection',
                        message: reason && (reason.message || String(reason)) || 'unhandledrejection',
                        stack: reason && (reason.stack || null) || null,
                        userAgent: navigator.userAgent,
                        deviceMemory: navigator.deviceMemory || null,
                        cores: navigator.hardwareConcurrency || null,
                        ts: Date.now(),
                    };
                    try { localStorage.setItem('noteleks_last_error', JSON.stringify(payload)); } catch (e) {}
                    try {
                        if (navigator && typeof navigator.sendBeacon === 'function') {
                            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                            navigator.sendBeacon('/__noteleks_error', blob);
                        }
                    } catch (e) {}
                } catch (e) {
                    // ignore
                }
            });
        } catch (e) {
            // ignore any errors while installing handlers (best-effort)
        }
    }

    createGameConfig() {
        // Simple game config without Spine plugin
        return {
            type: Phaser.AUTO,
            width: GameConfig.screen.width,
            height: GameConfig.screen.height,
            backgroundColor: GameConfig.screen.backgroundColor,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: GameConfig.physics.gravity,
                    debug: GameConfig.physics.debug,
                },
            },
            // Start with a LoadingScene so all assets (manifest, sprites, spine)
            // are loaded before we start the main GameScene.
            scene: [LoadingScene, GameScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                min: {
                    width: 400,
                    height: 300,
                },
                max: {
                    width: 1600,
                    height: 1200,
                },
            },
        };
    }

    async initialize(containerId = 'phaser-game') {
        console.info('[NoteleksGame] initialize start, containerId=%s', containerId);

        // Check if container exists
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('[NoteleksGame] initialize aborted: container not found:', containerId);
            return false;
        }

        // Build the game config
        const finalConfig = this.createGameConfig();

        // If lowQuality mode is enabled, reduce resolution and disable heavy features
        if (GameConfig.lowQuality) {
            try {
                // Reduce the target width/height to lower memory use and texture sizes
                finalConfig.width = Math.max(320, Math.floor((finalConfig.width || GameConfig.screen.width) / 1.5));
                finalConfig.height = Math.max(240, Math.floor((finalConfig.height || GameConfig.screen.height) / 1.5));
                // Prefer a lower resolution canvas scale to reduce GPU memory
                finalConfig.render = finalConfig.render || {};
                finalConfig.render.pixelArt = true;
                finalConfig.resolution = 1; // keep device resolution low
                // Ensure we do not attempt to register the Spine plugin
                finalConfig.plugins = undefined;
            } catch (e) {
                // ignore adjustments
            }
        }
        console.info('[NoteleksGame] Creating Phaser.Game with final config (plugins may be registered by Phaser)');
        this.game = new Phaser.Game({
            ...finalConfig,
            parent: containerId,
        });
        console.info('[NoteleksGame] Phaser.Game instance created:', !!this.game);
        // Phaser will auto-add the scene(s) declared in config.scene and start them.

        // If a mobile-only crash previously happened and was captured, reveal it
        // in the page so the developer can copy the error payload from the device.
        try {
            this._showStoredErrorIfAny(container);
        } catch (e) {
            // ignore
        }

        // Game ready event
        this.game.events.once('ready', () => {
            console.log('[NoteleksGame] Game ready');
        });

        // Add game event listeners
        console.info('[NoteleksGame] Installing event listeners');
        this.setupEventListeners();

        return true;
    }

    _showStoredErrorIfAny(container) {
        try {
            const raw = localStorage.getItem('noteleks_last_error');
            if (!raw) return;
            let payload = null;
            try { payload = JSON.parse(raw); } catch (e) { payload = { raw }; }

            // Log to console for remote debugging tools
            try { console.warn('[NoteleksGame] previous mobile error captured:', payload); } catch (e) {}

            // Create a lightweight banner element at the top of the container so
            // users can copy the error from the device screen and paste it into
            // a bug report. The banner includes a clear button.
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.left = '8px';
            div.style.right = '8px';
            div.style.top = '8px';
            div.style.zIndex = 999999;
            div.style.background = 'rgba(0,0,0,0.85)';
            div.style.color = '#fff';
            div.style.padding = '8px';
            div.style.fontSize = '12px';
            div.style.borderRadius = '6px';
            div.style.maxHeight = '40vh';
            div.style.overflow = 'auto';
            div.id = 'noteleks-error-banner';

            const pre = document.createElement('pre');
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.margin = '0 0 6px 0';
            pre.textContent = JSON.stringify(payload, null, 2);

            const controls = document.createElement('div');
            controls.style.display = 'flex';
            controls.style.gap = '8px';

            const clearBtn = document.createElement('button');
            clearBtn.textContent = 'Clear saved error';
            clearBtn.style.fontSize = '12px';
            clearBtn.onclick = () => {
                try { localStorage.removeItem('noteleks_last_error'); } catch (e) {}
                const el = document.getElementById('noteleks-error-banner');
                if (el && el.parentNode) el.parentNode.removeChild(el);
            };

            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy to clipboard';
            copyBtn.style.fontSize = '12px';
            copyBtn.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                    copyBtn.textContent = 'Copied';
                } catch (e) {
                    try { alert('Copy failed — long-press the error text to copy.'); } catch (x) {}
                }
            };

            controls.appendChild(copyBtn);
            controls.appendChild(clearBtn);
            div.appendChild(pre);
            div.appendChild(controls);

            // Append to the provided container if possible, otherwise to body
            try {
                const host = (container && typeof container.appendChild === 'function') ? container : document.body;
                host.appendChild(div);
            } catch (e) {
                try { document.body.appendChild(div); } catch (e) {}
            }
        } catch (e) {
            // ignore anything in error reporting
        }
    }

    setupEventListeners() {
        // Game ready event
        this.game.events.once('ready', () => {
            // Game is ready
        });

        // Handle browser visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Handle window focus
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
    }

    pause() {
        if (this.game && this.game.scene) {
            const scene = this.game.scene.getScene('GameScene');
            if (scene && scene.gameState === 'playing') {
                scene.pauseGame();
            }
        }
    }

    resume() {
        if (this.game && this.game.scene) {
            const scene = this.game.scene.getScene('GameScene');
            if (scene && scene.gameState === 'paused') {
                scene.resumeGame();
            }
        }
    }

    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }

    // Utility methods for external integration
    getGame() {
        return this.game;
    }

    getScene(key = 'GameScene') {
        return this.game ? this.game.scene.getScene(key) : null;
    }

    isRunning() {
        return this.game && this.game.isRunning;
    }

    getConfig() {
        return this.config;
    }

    // Static factory method
    // Static factory method
    static async create(containerId) {
        const game = new NoteleksGame();
        try {
            const success = await game.initialize(containerId);
            return success ? game : null;
        } catch (e) {
            return null;
        }
    }
}

export default NoteleksGame;
