import AttackComponent from '../components/AttackComponent.js';
import HealthComponent from '../components/HealthComponent.js';
import InputComponent from '../components/InputComponent.js';
import MovementComponent from '../components/MovementComponent.js';
import PhysicsComponent from '../components/PhysicsComponent.js';
import GameConfig from '../config/GameConfig.js';
import GameObject from '../core/GameObject.js';

/**
 * Player Entity
 * Represents the player character with all necessary components
 */
class Player extends GameObject {
    constructor(scene, x, y) {
        super(scene, x, y);
        // Provide a safe stub for _tryCreateSpine so deferred callers (from
        // createPlayerDeferred) can invoke it before the full implementation
        // is attached inside createPlayer(). Calls are queued and drained
        // once the real implementation is available.
        this._pendingTryCreateCalls = [];
        this._tryCreateSpine = function() {
            try {
                const args = Array.prototype.slice.call(arguments);
                this._pendingTryCreateCalls.push(args);
            } catch (e) {
                // ignore
            }
            return false;
        };
        // Initialize animation states
        this._isJumping = false;
        this._isAttacking = false;
        
        // Create base player sprite and components immediately, but defer
        // Spine GameObject creation until AssetManager signals readiness to
        // avoid plugin/atlas races that lead to invisible skeletons.
        this.createPlayerDeferred();
        this.setupComponents();
    }

    // Returns a promise that resolves when the AssetManager/spine setup is ready
    // or when a timeout expires. It listens for the scene-level 'spine-ready'
    // event (emitted by AssetManager) and also checks a few immediate
    // readiness heuristics so already-ready pages resolve synchronously.
    _waitForSpineReady(timeoutMs = 6000) {
        return new Promise((resolve, reject) => {
            try {
                const sys = this.scene && this.scene.sys ? this.scene.sys : null;
                // Immediate readiness heuristics: a global flag, plugin instance, or expected texture key
                const immediateReady = () => {
                    try {
                        if (typeof window !== 'undefined' && window.noteleksSpineReady) return true;
                        if (this.scene && this.scene.textures && typeof this.scene.textures.exists === 'function') {
                            // 'noteleks-texture' duplicated by AssetManager is a good sign
                            if (this.scene.textures.exists('noteleks-texture')) return true;
                            // plugin-style page key used by some plugin builds
                            if (this.scene.textures.exists('noteleks-data!noteleks-texture')) return true;
                        }
                        // plugin instance presence
                        if (sys && sys.spine) return true;
                    } catch (e) {
                        // ignore heuristics errors
                    }
                    return false;
                };

                if (immediateReady()) return resolve(true);

                let timer = null;
                const onReady = () => {
                    try { if (timer) clearTimeout(timer); } catch (e) {}
                    resolve(true);
                };

                // Listen on scene.events if available. AssetManager uses scene.events.emit('spine-ready')
                if (this.scene && this.scene.events && typeof this.scene.events.once === 'function') {
                    this.scene.events.once('spine-ready', onReady);
                }

                // Safety timeout
                timer = setTimeout(() => {
                    // Remove listener if still attached
                    try {
                        if (this.scene && this.scene.events && typeof this.scene.events.off === 'function') {
                            this.scene.events.off('spine-ready', onReady);
                        }
                    } catch (e) {}
                    reject(new Error('spine-ready wait timed out'));
                }, timeoutMs);
            } catch (e) {
                reject(e);
            }
        });
    }

    // Deferred creation entrypoint used in constructor so we can await AssetManager
    createPlayerDeferred() {
        // Run base sprite creation immediately so physics/collisions are ready.
        // Much of createPlayers logic depends on the sprite existing; extract
        // the minimal base-creation here then defer spine-specific creation.
        try {
            // Create player sprite with physics (physics sprite used for collisions)
            this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'skeleton');
            this.sprite.playerRef = this;
            // Ensure the physics sprite uses bottom-centre origin so its
            // position corresponds to the character's feet. Many visual
            // assets expect origin (0.5, 1). Also align the physics body
            // to the visual by setting a sensible body size and offset so
            // the collision box sits at the character's lower torso/feet
            // instead of centering it and making the character appear to
            // float.
            try {
                if (typeof this.sprite.setOrigin === 'function') this.sprite.setOrigin(0.5, 1);
            } catch (e) {}
            try {
                // Defensive defaults - these match the PhysicsComponent defaults
                const bodyW = 32;
                const bodyH = 48;
                // Compute offsets relative to the sprite's displayed size
                const dw = (typeof this.sprite.displayWidth === 'number' && this.sprite.displayWidth > 0) ? this.sprite.displayWidth : (this.sprite.width || bodyW);
                const dh = (typeof this.sprite.displayHeight === 'number' && this.sprite.displayHeight > 0) ? this.sprite.displayHeight : (this.sprite.height || bodyH);
                const offsetX = Math.max(0, Math.round((dw / 2) - (bodyW / 2)));
                const offsetY = Math.max(0, Math.round(dh - bodyH));
                if (this.sprite.body) {
                    try { if (typeof this.sprite.body.setSize === 'function') this.sprite.body.setSize(bodyW, bodyH); } catch (e) {}
                    try { if (typeof this.sprite.body.setOffset === 'function') this.sprite.body.setOffset(offsetX, offsetY); } catch (e) {}
                }
            } catch (e) {}
        } catch (e) {
            // If physics isn't available yet, fallback to a simple image so other systems can proceed
            try {
                this.sprite = this.scene.add.image(this.x, this.y, 'skeleton');
                this.sprite.playerRef = this;
                try { if (typeof this.sprite.setOrigin === 'function') this.sprite.setOrigin(0.5, 1); } catch (e) {}
            } catch (e2) {
                // Ignore: other code will handle missing sprite at runtime
            }
        }

        // Expose quick debug handle as early as before
        try { if (typeof window !== 'undefined') window.noteleksPlayer = this; } catch (e) {}

        // Defer the heavier spine creation and probing to a promise so we avoid
        // creating the Spine GameObject before the AssetManager has finished
        // preparing atlas frames. If the wait times out we still attempt a best-effort creation.
        this._waitForSpineReady(6000).then(() => {
            try {
                // Try creation with generous retries now that assets are likely present
                this._tryCreateSpine(12, 100);
            } catch (e) {
                // attempt a smaller retry run on unexpected failures
                try { this._tryCreateSpine(6, 150); } catch (e2) {}
            }
        }).catch(() => {
            // Timed out waiting — still attempt creation but keep fallbacks in place
            try { this._tryCreateSpine(6, 150); } catch (e) {}
        });

        // Watchdog: if spine still isn't created after the initial attempts, run
        // periodic best-effort retries for a short time window. This helps when
        // plugin initialization or texture population completes slightly later
        // than the AssetManager signal (observed in some environments).
        try {
            this._spineWatchdogAttempts = 0;
            this._spineWatchdogMax = 20; // ~10s at 500ms intervals
            this._spineWatchdogInterval = setInterval(() => {
                try {
                    this._spineWatchdogAttempts += 1;
                    // If spine created, stop watchdog
                    if (this.spine) {
                        try { clearInterval(this._spineWatchdogInterval); } catch (e) {}
                        this._spineWatchdogInterval = null;
                        return;
                    }

                    // Try a light-weight creation attempt to recover
                    try { this._tryCreateSpine(2, 200); } catch (e) {}

                    // Give up after max attempts
                    if (this._spineWatchdogAttempts >= this._spineWatchdogMax) {
                        try { clearInterval(this._spineWatchdogInterval); } catch (e) {}
                        this._spineWatchdogInterval = null;
                    }
                } catch (e) {
                    // ignore per-interval errors
                }
            }, 500);
        } catch (e) {
            // ignore watchdog setup errors
        }
    }

    createPlayer() {
        // Create player sprite with physics (physics sprite used for collisions)
        // If a deferred initializer already created the sprite, reuse it.
        if (!this.sprite) {
            try {
                this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'skeleton');
                this.sprite.playerRef = this;
                // Make sprite visible as fallback
                this.sprite.setVisible(true);
                this.sprite.setAlpha(1);
            } catch (e) {
                // If physics not available, try a simple image fallback
                try {
                    this.sprite = this.scene.add.image(this.x, this.y, 'skeleton');
                    this.sprite.playerRef = this;
                    this.sprite.setVisible(true);
                    this.sprite.setAlpha(1);
                } catch (e2) {
                    // ignore - sprite will remain undefined and other code must handle it
                }
            }
        }

        // Try to create a Spine display for the character if the runtime/plugin and assets are available.
        // We keep the physics sprite for collisions and sync the Spine visual to it, avoiding physics-plugin mismatches.
        this.spine = null;
        this._currentSpineAnim = null;

        // Small in-Phaser loading indicator shown while we wait for the Spine plugin
        // and atlas/skeleton caches to become available. This keeps the overlay
        // inside the canvas and avoids DOM layering issues during tests/headless runs.
        this._showSpineLoading = () => {
            try {
                if (this._spineLoadingOverlay) return;
                if (!this.scene || !this.scene.add) return;

                // If renderer or GL context is not available (or in a bad state),
                // avoid creating canvas-backed text which triggers createTexture
                // and can flood logs. Use a lightweight DOM fallback instead.
                const renderer = this.scene && this.scene.sys && this.scene.sys.game && this.scene.sys.game.renderer;
                if (!renderer || !renderer.gl) {
                    try {
                        if (!document.getElementById('noteleks-spine-loading')) {
                            const el = document.createElement('div');
                            el.id = 'noteleks-spine-loading';
                            el.style.position = 'fixed';
                            el.style.left = '8px';
                            el.style.top = '8px';
                            el.style.zIndex = 2147483646;
                            el.style.background = 'rgba(0,0,0,0.6)';
                            el.style.color = '#fff';
                            el.style.padding = '6px 10px';
                            el.style.borderRadius = '6px';
                            el.style.fontFamily = 'Arial, sans-serif';
                            el.style.fontSize = '12px';
                            el.textContent = 'Loading character...';
                            document.body.appendChild(el);
                        }
                        this._spineLoadingOverlay = { dom: true };
                    } catch (domErr) {
                        // ignore DOM fallback failures
                    }
                    return;
                }

                // Create a fixed-position container using scrollFactor 0 so it stays
                // aligned to the camera regardless of world movement.
                const width = 180;
                const height = 28;

                // Background rectangle (black translucent)
                const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.72).setOrigin(0, 0);

                // Text label
                const style = { font: '12px Arial', fill: '#ffffff' };
                const txt = this.scene.add.text(8, 6, 'Loading character...', style).setOrigin(0, 0);

                const container = this.scene.add.container(8, 8, [bg, txt]);
                // Keep overlay fixed to camera
                if (container.setScrollFactor) container.setScrollFactor(0);
                // Put on an extremely high depth so game UI doesn't accidentally cover it
                if (container.setDepth) container.setDepth(2147483000);

                // Store references so we can remove everything cleanly
                this._spineLoadingOverlay = { container, bg, txt };
            } catch (e) {
                // ignore overlay creation errors
            }
        };

        this._hideSpineLoading = () => {
            try {
                if (!this._spineLoadingOverlay) return;
                try {
                    if (this._spineLoadingOverlay.container && typeof this._spineLoadingOverlay.container.destroy === 'function') {
                        this._spineLoadingOverlay.container.destroy();
                    }
                } catch (e) {
                    // ignore destroy errors
                }
                this._spineLoadingOverlay = null;
            } catch (e) {
                // ignore
            }
        };

    // Helper to attempt creating the Spine display with retries. Some builds
        // initialize plugin internals slightly after registration, so a short
        // retry loop before falling back reduces transient failures.
        // Finalize visual once a spine/image display is present. Ensures visibility,
        // sane scale/origin and hides the physics sprite on the next postupdate to
        // avoid render-order / early-hide issues in some environments.
        const finalizeSpineVisual = () => {
            try {
                if (!this.spine) return;
                // Ensure visible and reasonable scale/alpha
                if (typeof this.spine.setVisible === 'function') this.spine.setVisible(true);
                if (typeof this.spine.setAlpha === 'function') this.spine.setAlpha ? this.spine.setAlpha(1) : null;
                // Apply configured base scale for the character visual so it's not too large.
                    try {
                    const baseScale = this.getAppliedScale();
                    if (typeof this.spine.setScale === 'function') this.spine.setScale(baseScale);
                    // If a global target pixel height is configured, compute and apply
                    // a precise scale so the on-screen height matches the request.
                    try {
                        if (GameConfig && GameConfig.player && GameConfig.player.targetPixelHeight) {
                            this.setDisplayHeight(GameConfig.player.targetPixelHeight);
                        }
                    } catch (e) {}
                } catch (e) {
                    // ignore scale application errors
                }
                // Defensive normalization: ensure displayWidth is positive and not vanishingly small.
                // Skip auto-scaling while the player is performing an attack to avoid
                // animation-frame-size changes from causing visual shrinking.
                try {
                    if (!this._isAttacking) {
                        const minPixels = 48; // target minimum visible width in pixels
                        // If displayWidth is present and small, boost the scale so it becomes visible.
                        const dw = (typeof this.spine.displayWidth === 'number') ? Math.abs(this.spine.displayWidth) : null;
                        if (dw !== null && dw > 0 && dw < minPixels) {
                            const factor = minPixels / dw;
                            const applied = this.getAppliedScale() * factor;
                            if (typeof this.spine.setScale === 'function') {
                                this.spine.setScale(applied);
                            } else {
                                try { this.spine.scaleX = Math.abs(this.spine.scaleX || applied); } catch (e) {}
                                try { this.spine.scaleY = Math.abs(this.spine.scaleY || applied); } catch (e) {}
                            }
                        }
                        // Normalize sign of scaleX to match flip state (avoid negative displayWidth confusion)
                        try {
                            if (this.sprite && this.sprite.flipX) this.spine.scaleX = -Math.abs(this.spine.scaleX || this.getAppliedScale() || 1);
                            else this.spine.scaleX = Math.abs(this.spine.scaleX || this.getAppliedScale() || 1);
                        } catch (e) {
                            // ignore
                        }
                    }
                } catch (e) {
                    // ignore normalization errors
                }
                    if (typeof this.spine.setOrigin === 'function') this.spine.setOrigin(0.5, 1);
                // Keep the player visual behind UI elements (UI uses ~1000). Use a
                // moderate depth so game objects render above the player but UI stays on top.
                if (this.spine.setDepth) this.spine.setDepth(500);

                // Ensure a default animation is playing so the character is not static.
                // Prefer 'idle' if available; otherwise fall back to the first animation
                // name found on the skeleton data. This is placed here so it runs both
                // when the Spine display is created synchronously and when finalize
                // is invoked from async creation retries.
                try {
                    const playInitialAnimation = () => {
                        if (!this.spine) return;
                        let desired = 'idle';
                        try {
                            const sk = (this.spine && this.spine.spine && this.spine.spine.skeleton) || this.spine.skeleton || null;
                            if (sk && sk.data && Array.isArray(sk.data.animations) && sk.data.animations.length) {
                                const names = sk.data.animations.map(a => a.name);
                                if (names.indexOf('idle') === -1) desired = names[0];
                            }
                        } catch (e) {
                            // ignore skeleton inspection errors and stick with 'idle'
                        }

                        try {
                            console.warn('[Player] playInitialAnimation selected:', desired);
                            this._setSpineAnimation(desired, true);
                        } catch (e) {
                            // ignore failures to set animation (best-effort)
                        }
                    };
                    // Run immediately — finalizeSpineVisual may be called in both sync and async flows
                    playInitialAnimation();
                } catch (e) {
                    // swallow errors so finalize continues
                }

                // (debug forced-centering removed — camera should manage visibility)

                // Schedule hiding the physics sprite on the next postupdate to avoid
                // cases where immediate hide can leave both visuals invisible due to
                // render ordering or plugin initialization quirks.
                try {
                    if (this.sprite && typeof this.sprite.setVisible === 'function') {
                        if (this.scene && this.scene.sys && this.scene.sys.events && typeof this.scene.sys.events.once === 'function') {
                            this.scene.sys.events.once('postupdate', () => {
                                try { this.sprite.setVisible(false); } catch (e) { /* ignore */ }
                            });
                        } else {
                            // Fallback: next tick
                            setTimeout(() => { try { this.sprite.setVisible(false); } catch (e) { /* ignore */ } }, 0);
                        }
                    }
                } catch (e) {
                    // ignore
                }

                // DEBUG: create a short-lived red marker at the physics sprite position
                // to help visually locate the player if the Spine visual appears off-screen
                // or invisible. This marker follows the sprite for ~2s then removes itself.
                try {
                    // Only create debug visuals when explicit debug overlay is enabled
                    const overlayEnabled = (GameConfig && GameConfig.debug && GameConfig.debug.enablePlayerDebugOverlay) || (typeof window !== 'undefined' && !!window.noteleksDebug);
                    if (overlayEnabled && this.scene && this.scene.add && this.sprite) {
                        const marker = this.scene.add.rectangle(this.sprite.x, this.sprite.y - 24, 18, 18, 0xff0000, 0.95);
                        if (marker.setDepth) marker.setDepth(999999);
                        const follow = () => {
                            try {
                                if (!marker || !this.sprite) return;
                                marker.x = this.sprite.x;
                                marker.y = this.sprite.y - (this.sprite.displayHeight ? this.sprite.displayHeight / 2 : 24) - 4;
                            } catch (e) {
                                // ignore
                            }
                        };
                        if (this.scene && this.scene.sys && this.scene.sys.events && typeof this.scene.sys.events.on === 'function') {
                            this.scene.sys.events.on('postupdate', follow);
                        }
                        // Remove marker after 5s (longer so headless captures/drivers can see it)
                        setTimeout(() => {
                            try {
                                if (this.scene && this.scene.sys && this.scene.sys.events && typeof this.scene.sys.events.off === 'function') {
                                    this.scene.sys.events.off('postupdate', follow);
                                }
                                if (marker && typeof marker.destroy === 'function') marker.destroy();
                            } catch (e) {
                                // ignore
                            }
                        }, 5000);
                    }
                } catch (e) {
                    // ignore debug marker failures
                }

                // Additionally create a DOM overlay marker mapped to the player's on-screen position
                // so headless screenshot tools can see where the player is rendered relative to the page.
                // Compute a world -> canvas/screen conversion using the main camera and canvas bounding rect.
                try {
                    const canvas = (this.scene && this.scene.game && this.scene.game.canvas) || document.querySelector('#phaser-game canvas');
                    const overlayEnabled = (GameConfig && GameConfig.debug && GameConfig.debug.enablePlayerDebugOverlay) || (typeof window !== 'undefined' && !!window.noteleksDebug);
                    if (overlayEnabled && canvas && typeof document !== 'undefined' && this.sprite) {
                        const rect = canvas.getBoundingClientRect();
                        // Default to center if camera info is missing
                        let screenX = rect.left + (rect.width / 2);
                        let screenY = rect.top + (rect.height / 2);
                        try {
                            const cam = this.scene && this.scene.cameras && this.scene.cameras.main ? this.scene.cameras.main : null;
                            if (cam && typeof cam.worldView !== 'undefined') {
                                // Translate world coordinates (sprite.x/sprite.y) to camera-local coords
                                // then map to canvas pixels using the ratio of canvas pixel size to camera size.
                                const worldX = this.sprite.x;
                                const worldY = this.sprite.y;
                                const viewX = cam.worldView.x;
                                const viewY = cam.worldView.y;
                                const camW = cam.width || 1;
                                const camH = cam.height || 1;
                                const pxPerWorldX = rect.width / camW;
                                const pxPerWorldY = rect.height / camH;
                                screenX = rect.left + ((worldX - viewX) * pxPerWorldX);
                                screenY = rect.top + ((worldY - viewY) * pxPerWorldY);
                            }
                        } catch (convErr) {
                            // fallback to center if conversion fails
                        }

                        const el = document.createElement('div');
                        el.id = 'noteleks-debug-dom-marker';
                        el.style.position = 'absolute';
                        el.style.width = '18px';
                        el.style.height = '18px';
                        el.style.background = 'red';
                        el.style.borderRadius = '50%';
                        el.style.zIndex = 2147483647; // extremely high
                        el.style.pointerEvents = 'none';
                        document.body.appendChild(el);

                        // Make the DOM marker follow the player's screen position each frame
                        const followDom = () => {
                            try {
                                const rectNow = canvas.getBoundingClientRect();
                                let sx = rectNow.left + (rectNow.width / 2);
                                let sy = rectNow.top + (rectNow.height / 2);
                                const camNow = this.scene && this.scene.cameras && this.scene.cameras.main ? this.scene.cameras.main : null;
                                if (camNow && typeof camNow.worldView !== 'undefined') {
                                    const worldX = this.sprite.x;
                                    const worldY = this.sprite.y;
                                    const viewX = camNow.worldView.x;
                                    const viewY = camNow.worldView.y;
                                    const vw = camNow.worldView.width || (camNow.width || 1);
                                    const vh = camNow.worldView.height || (camNow.height || 1);
                                    const pxPerWorldX = rectNow.width / vw;
                                    const pxPerWorldY = rectNow.height / vh;
                                    sx = rectNow.left + ((worldX - viewX) * pxPerWorldX);
                                    sy = rectNow.top + ((worldY - viewY) * pxPerWorldY);
                                }
                                el.style.left = (Math.round(sx) - 9) + 'px';
                                el.style.top = (Math.round(sy) - 9) + 'px';
                            } catch (e) {
                                // ignore per-frame errors
                            }
                        };

                        // Attach to postupdate so it follows camera/sprite movements
                        if (this.scene && this.scene.sys && this.scene.sys.events && typeof this.scene.sys.events.on === 'function') {
                            this.scene.sys.events.on('postupdate', followDom);
                        }

                        // Run once immediately to position right away
                        try { followDom(); } catch (e) {}

                        console.warn('[Player] DOM debug marker created and following player on-screen position');

                        // Remove marker and listener after 5s
                        setTimeout(() => {
                            try {
                                if (this.scene && this.scene.sys && this.scene.sys.events && typeof this.scene.sys.events.off === 'function') {
                                    this.scene.sys.events.off('postupdate', followDom);
                                }
                                if (el && typeof el.remove === 'function') el.remove();
                            } catch (e) {
                                // ignore
                            }
                        }, 5000);

                        // After a short delay, verify the Spine object is actually rendering.
                        // Some runtime/plugin races lead to a created Spine GameObject that has
                        // no visible textures attached; in that case fall back to the prepared
                        // canvas renderer and display a Phaser image so the player is visible.
                        const checkSpineRendered = () => {
                            try {
                                // If no spine, nothing to do
                                if (!this.spine) return;

                                // Heuristic checks for visible spine:
                                // - spine.visible/alpha
                                // - skeleton presence and slots
                                // - expected plugin texture exists in Phaser textures
                                const spineVisible = (typeof this.spine.visible === 'undefined') ? true : !!this.spine.visible;
                                const spineAlpha = (typeof this.spine.alpha === 'undefined') ? 1 : (this.spine.alpha || 0);
                                const hasSkeleton = !!(this.spine.skeleton && this.spine.skeleton.slots && this.spine.skeleton.slots.length);
                                const expectedPluginTexKey = 'noteleks-data!noteleks-texture';
                                const pluginTexPresent = this.scene && this.scene.textures ? !!this.scene.textures.exists(expectedPluginTexKey) : false;

                                const maybeNotRendered = (!spineVisible || spineAlpha <= 0 || (hasSkeleton && !pluginTexPresent));

                                if (maybeNotRendered) {
                                    console.warn('[Player] Spine appears not to be rendering (visible=', spineVisible, 'alpha=', spineAlpha, 'hasSkeleton=', hasSkeleton, 'pluginTexPresent=', pluginTexPresent, '). Using canvas fallback if available.');

                                    const fallback = this.scene && this.scene.cache && this.scene.cache.custom ? this.scene.cache.custom['spine-canvas-fallback'] : null;
                                    if (fallback && typeof fallback.drawToTexture === 'function') {
                                        try {
                                            const texKey = 'noteleks-canvas-fallback';
                                            // render to a Phaser texture name and create an Image
                                            fallback.drawToTexture(this.scene, texKey);
                                            // Remove any existing fallback image
                                            try { if (this._spineFallbackImage && this._spineFallbackImage.destroy) this._spineFallbackImage.destroy(); } catch (e) {}
                                            this._spineFallbackImage = this.scene.add.image(this.sprite.x, this.sprite.y, texKey).setOrigin(0.5, 1);
                                            try { if (GameConfig && GameConfig.player && GameConfig.player.targetPixelHeight) this.setDisplayHeight(GameConfig.player.targetPixelHeight); } catch (e) {}
                                            try {
                                                const baseScale = this.getAppliedScale();
                                                if (this._spineFallbackImage && typeof this._spineFallbackImage.setScale === 'function') this._spineFallbackImage.setScale(baseScale);
                                            } catch (e) {}
                                            if (this._spineFallbackImage.setDepth) this._spineFallbackImage.setDepth(500);
                                            // Hide the problematic spine display so it doesn't occlude
                                            try { if (this.spine && typeof this.spine.setVisible === 'function') this.spine.setVisible(false); } catch (e) {}
                                                try { this._hideSpineLoading(); } catch (e) {}
                                                console.warn('[Player] Canvas fallback image created and placed at player position');
                                        } catch (e) {
                                            console.warn('[Player] Failed to draw canvas fallback to texture:', e && e.message);
                                        }
                                    } else {
                                        console.warn('[Player] No canvas fallback available in cache.custom to draw');
                                    }
                                } else {
                                    console.warn('[Player] Spine rendering appears healthy (visible=', spineVisible, 'alpha=', spineAlpha, 'hasSkeleton=', hasSkeleton, 'pluginTexPresent=', pluginTexPresent, ')');
                                }
                            } catch (e) {
                                console.warn('[Player] checkSpineRendered failed:', e && e.message);
                            }
                        };

                        setTimeout(checkSpineRendered, 350);
                    }
                } catch (e) {
                    // ignore DOM debug failures
                }

                // If the Spine display exists but doesn't render visible pixels (some headless / runtime builds
                // or atlas mapping issues cause blank output), create a short-lived Phaser Image fallback so the
                // player remains visible. We probe after a short delay to allow the renderer one frame to catch up.
                try {
                    const probeAndFallback = () => {
                        try {
                            // If spine is missing or destroyed, nothing to do
                            if (!this.spine) return;

                            // Heuristics to detect rendering: check display size and texture presence
                            let appearsVisible = false;
                            try {
                                // Many Phaser Spine GameObjects expose displayWidth/displayHeight
                                if (typeof this.spine.displayWidth === 'number' && typeof this.spine.displayHeight === 'number') {
                                    appearsVisible = (this.spine.displayWidth > 2 && this.spine.displayHeight > 2);
                                }
                                // Some runtimes expose skeleton/texture info
                                if (!appearsVisible && this.spine.skeleton && this.spine.skeleton.findSlot) {
                                    // If skeleton has attachments, consider it visible
                                    const sk = this.spine.skeleton;
                                    appearsVisible = Array.isArray(sk.data.attachments) ? sk.data.attachments.length > 0 : true;
                                }
                            } catch (probeErr) {
                                // ignore
                            }

                            if (!appearsVisible) {
                                try {
                                    // Create a fallback image using the duplicated texture key prepared by AssetManager
                                    if (this.scene && this.scene.add && this.scene.textures && this.scene.textures.exists && this.scene.textures.exists('noteleks-texture')) {
                                            // Prefer an animated spritesheet fallback if animations were generated
                                            try {
                                                // If the animation hasn't been created yet but the spritesheet
                                                // texture exists, create the anim on-demand so fallbacks
                                                // don't depend on strict loader ordering.
                                                try {
                                                    if (this.scene && this.scene.textures && this.scene.textures.exists && this.scene.textures.exists('skeleton-idle') && this.scene.anims && typeof this.scene.anims.exists === 'function' && !this.scene.anims.exists('player-idle')) {
                                                        try {
                                                            const tex = this.scene.textures.get('skeleton-idle');
                                                            const frameNames = (tex && typeof tex.getFrameNames === 'function') ? tex.getFrameNames() : null;
                                                            if (frameNames && frameNames.length) {
                                                                const frames = frameNames.map(n => ({ key: 'skeleton-idle', frame: n }));
                                                                this.scene.anims.create({ key: 'player-idle', frames, frameRate: 12, repeat: -1 });
                                                                console.info('[Player] Created missing animation player-idle from skeleton-idle frames');
                                                                try { this.scene.cache.custom = this.scene.cache.custom || {}; this.scene.cache.custom['player-idle-created-by'] = { by: 'Player', key: 'player-idle', ts: new Date().toISOString() }; } catch (e) {}
                                                            }
                                                        } catch (ae) {
                                                            // ignore animation creation failures
                                                        }
                                                    }
                                                } catch (e) {}

                                                if (this.scene.anims && this.scene.anims.exists && this.scene.anims.exists('player-idle')) {
                                                    // If we already have a persistent fallback sprite, reuse it
                                                    if (this._persistentFallbackSprite && this._persistentFallbackSprite.setPosition) {
                                                        try { this._persistentFallbackSprite.setPosition(this.sprite.x, this.sprite.y); } catch (e) {}
                                                        console.warn('[Player] Reused existing persistent Phaser animated fallback');
                                                    } else {
                                                        // Create an animated sprite using the packed spritesheet animation
                                                        try {
                                                            const spr = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'skeleton-idle').setOrigin(0.5, 1);
                                                            try {
                                                                const baseScale = this.getAppliedScale();
                                                                if (spr && typeof spr.setScale === 'function') spr.setScale(baseScale);
                                                            } catch (e) {}
                                                            if (spr && spr.play) spr.play('player-idle');
                                                            if (spr && spr.setDepth) spr.setDepth(501);
                                                            this._persistentFallbackSprite = spr;
                                                            try { if (GameConfig && GameConfig.player && GameConfig.player.targetPixelHeight) this.setDisplayHeight(GameConfig.player.targetPixelHeight); } catch (e) {}
                                                            try { if (this.spine && typeof this.spine.setVisible === 'function') this.spine.setVisible(false); } catch (e) {}
                                                            try { this._hideSpineLoading(); } catch (e) {}
                                                            console.warn('[Player] Spine visual appears blank — created persistent Phaser animated fallback for visibility');
                                                        } catch (e) {
                                                            // Fall back to static image if animation creation fails
                                                            const fb = this.scene.add.image(this.sprite.x, this.sprite.y, 'noteleks-texture').setOrigin(0.5, 1);
                                                            try {
                                                                const baseScale = this.getAppliedScale();
                                                                if (fb && typeof fb.setScale === 'function') fb.setScale(baseScale);
                                                            } catch (e) {}
                                                            if (fb && fb.setDepth) fb.setDepth(501);
                                                            this._persistentFallbackImage = fb;
                                                            try { if (GameConfig && GameConfig.player && GameConfig.player.targetPixelHeight) this.setDisplayHeight(GameConfig.player.targetPixelHeight); } catch (e) {}
                                                            try { if (this.spine && typeof this.spine.setVisible === 'function') this.spine.setVisible(false); } catch (e) {}
                                                            try { this._hideSpineLoading(); } catch (e) {}
                                                            console.warn('[Player] Fallback to static image after animated fallback failed');
                                                        }
                                                    }
                                                } else {
                                                    // No animation present, create a static image fallback
                                                    if (this._persistentFallbackImage && this._persistentFallbackImage.setPosition) {
                                                        try { this._persistentFallbackImage.setPosition(this.sprite.x, this.sprite.y); } catch (e) {}
                                                        console.warn('[Player] Reused existing persistent Phaser image fallback');
                                                    } else {
                                                        const fb = this.scene.add.image(this.sprite.x, this.sprite.y, 'noteleks-texture').setOrigin(0.5, 1);
                                                        try {
                                                            const baseScale = this.getAppliedScale();
                                                            if (fb && typeof fb.setScale === 'function') fb.setScale(baseScale);
                                                        } catch (e) {}
                                                        if (fb && fb.setDepth) fb.setDepth(501);
                                                        this._persistentFallbackImage = fb;
                                                        try { if (GameConfig && GameConfig.player && GameConfig.player.targetPixelHeight) this.setDisplayHeight(GameConfig.player.targetPixelHeight); } catch (e) {}
                                                        try { if (this.spine && typeof this.spine.setVisible === 'function') this.spine.setVisible(false); } catch (e) {}
                                                        try { this._hideSpineLoading(); } catch (e) {}
                                                        console.warn('[Player] Spine visual appears blank — created persistent Phaser image fallback for visibility');
                                                    }
                                                }
                                            } catch (e) {
                                                // If any of the above fails, create a simple static fallback image
                                                try {
                                                    const fb2 = this.scene.add.image(this.sprite.x, this.sprite.y, 'noteleks-texture').setOrigin(0.5, 1);
                                                    try {
                                                        const baseScale = this.getAppliedScale();
                                                        if (fb2 && typeof fb2.setScale === 'function') fb2.setScale(baseScale);
                                                    } catch (e) {}
                                                    if (fb2 && fb2.setDepth) fb2.setDepth(501);
                                                    this._persistentFallbackImage = fb2;
                                                    try { if (GameConfig && GameConfig.player && GameConfig.player.targetPixelHeight) this.setDisplayHeight(GameConfig.player.targetPixelHeight); } catch (e) {}
                                                } catch (ee) { /* ignore */ }
                                            }
                                    } else {
                                        console.warn('[Player] Spine visual appears blank but fallback texture not present');
                                    }
                                } catch (fbErr) {
                                    console.warn('[Player] Failed to create fallback image:', fbErr && fbErr.message);
                                }
                            } else {
                                console.warn('[Player] Spine visual appears to be rendering (probe passed)');
                            }
                        } catch (e) {
                            // ignore probe errors
                        }
                    };

                    // Probe after ~300ms to allow rendering pipeline to initialize
                    setTimeout(probeAndFallback, 300);
                } catch (e) {
                    // ignore
                }
                
            } catch (e) {
                // ignore
            }
        };

        this._tryCreateSpine = (attemptsLeft = 8, delayMs = 100) => {
            // Show a minimal loading indicator while we attempt to create the Spine display
            try { this._showSpineLoading(true); } catch (e) { /* ignore */ }
            // Improved creation flow:
            // 1. Wait until scene.sys.spine plugin instance exists (if plugin is registered)
            // 2. Verify the plugin or the Phaser caches contain the keys the plugin expects
            // 3. Only then call scene.add.spine to avoid plugin getAtlas/getSkeletonData races
            const dataKey = 'noteleks-data';
            const atlasKey = 'noteleks-data';
            const pageName = 'noteleks-texture';

            // Populate Spine plugin internal caches on-demand if they're empty
            // but we have the raw skeleton/atlas data in Phaser caches or custom cache.
            const populatePluginCachesIfNeeded = () => {
                try {
                    const sys = this.scene && this.scene.sys ? this.scene.sys : null;
                    const plugin = sys && sys.spine ? sys.spine : null;
                    if (!plugin) return false;

                    const atlasCache = plugin.atlasCache || plugin.atlasCacheMap || plugin.atlasCacheEntries || plugin.atlas || null;
                    const skeletonCache = plugin.skeletonDataCache || plugin.skeletonCache || plugin.skeletons || null;

                    const atlasHasKeys = atlasCache && (typeof atlasCache.keys === 'function' ? atlasCache.keys().length > 0 : Object.keys(atlasCache).length > 0);
                    const skelHasKeys = skeletonCache && (typeof skeletonCache.keys === 'function' ? skeletonCache.keys().length > 0 : Object.keys(skeletonCache).length > 0);
                    if (atlasHasKeys && skelHasKeys) return true;

                    // Try to locate skeleton data from several places AssetManager populates
                    let skeletonDataObj = null;
                    try {
                        if (this.scene.cache && this.scene.cache.json && typeof this.scene.cache.json.get === 'function') {
                            skeletonDataObj = this.scene.cache.json.get(dataKey) || this.scene.cache.json.get('noteleks-skeleton-data') || skeletonDataObj;
                        }
                    } catch (e) {}
                    if (!skeletonDataObj && this.scene.cache && this.scene.cache.custom) {
                        skeletonDataObj = this.scene.cache.custom['spine-skeleton-data'] || skeletonDataObj;
                    }
                    if (!skeletonDataObj && typeof window !== 'undefined' && window.NOTELEKS_DIAG && window.NOTELEKS_DIAG.skeleton) {
                        skeletonDataObj = window.NOTELEKS_DIAG.skeleton;
                    }

                    // Try to find a runtime TextureAtlas created by AssetManager
                    let textureAtlas = null;
                    try { textureAtlas = this.scene.cache && this.scene.cache.custom ? this.scene.cache.custom['spine-atlas'] : null; } catch (e) {}

                    // If we have something useful, attempt to populate plugin caches under tolerant keys
                    const trySet = (cache, k, v) => {
                        try {
                            if (!cache) return false;

                            // If the cache itself is a Map-like object
                            if (cache instanceof Map && typeof cache.set === 'function') {
                                cache.set(k, v);
                                return true;
                            }

                            // If the cache exposes an entries container that is Map-like
                            if (cache.entries && typeof cache.entries.set === 'function') {
                                try {
                                    cache.entries.set(k, v);
                                    return true;
                                } catch (e) {
                                    // fallthrough to other strategies
                                }
                            }

                            // Common plugin APIs
                            if (typeof cache.set === 'function') { cache.set(k, v); return true; }
                            if (typeof cache.add === 'function') { cache.add(k, v); return true; }
                            if (typeof cache.put === 'function') { cache.put(k, v); return true; }

                            // If entries is a plain object (older shapes)
                            if (cache.entries && typeof cache.entries === 'object') {
                                try { cache.entries[k] = v; } catch (e) {}
                                return true;
                            }

                            // Fallback: assign to object-like cache directly
                            try { cache[k] = v; } catch (e) { return false; }
                            return true;
                        } catch (e) { return false; }
                    };

                    const populated = { atlas: [], skeleton: [] };
                    try {
                        if (textureAtlas && atlasCache) {
                            // Include composite candidates the plugin sometimes looks up
                            const atlasCandidates = [
                                'noteleks-data', 'noteleks-atlas', 'noteleks-data-atlas', 'noteleks-atlas-text'
                            ];
                            // add composite forms with page name which some plugin builds use
                            const pageName = 'noteleks-texture';
                            const compositeSuffixes = ["!" + pageName, "!" + pageName + "-page0", "!page0"];
                            const extraCandidates = [];
                            atlasCandidates.forEach(base => compositeSuffixes.forEach(s => extraCandidates.push(base + s)));
                            const allAtlasCandidates = atlasCandidates.concat(extraCandidates);
                            for (const k of allAtlasCandidates) {
                                if (trySet(atlasCache, k, textureAtlas)) populated.atlas.push(k);
                            }
                            // Also try to mirror under a raw 'noteleks-texture' key which some lookups use
                            trySet(atlasCache, 'noteleks-texture', textureAtlas) && populated.atlas.push('noteleks-texture');
                        }
                        if (skeletonDataObj && skeletonCache) {
                            const skeletonCandidates = ['noteleks-data', 'noteleks-data-skeleton', 'noteleks-skeleton-data'];
                            // also try a few composite skeleton keys
                            const skeletonExtra = skeletonCandidates.map(k => k + '-v1').concat(skeletonCandidates.map(k => k + '_v1'));
                            const allSkel = skeletonCandidates.concat(skeletonExtra);
                            for (const k of allSkel) {
                                if (trySet(skeletonCache, k, skeletonDataObj)) populated.skeleton.push(k);
                            }
                        }
                    } catch (e) {
                        // ignore population errors
                    }

                    if ((populated.atlas.length || populated.skeleton.length)) {
                        console.warn('[Player] Populated Spine plugin caches on-demand', populated);
                        return true;
                    }
                } catch (e) {
                    // ignore
                }
                return false;
            };

            const checkReadiness = () => {
                try {
                    const sys = this.scene && this.scene.sys ? this.scene.sys : null;
                    const plugin = sys && sys.spine ? sys.spine : null;

                    // If plugin instance exists, prefer checking its internal caches.
                    // NOTE: older code accidentally concatenated dataKey+atlasKey when
                    // checking skeleton cache keys; use the dataKey here.
                    if (plugin) {
                        const atlasReady = typeof plugin.atlasCache?.exists === 'function' ? plugin.atlasCache.exists(atlasKey) : false;
                        const skeletonReady = typeof plugin.skeletonDataCache?.exists === 'function' ? plugin.skeletonDataCache.exists(dataKey) : false;
                        console.warn('[Player] plugin instance present. atlasReady=', atlasReady, 'skeletonReady=', skeletonReady);
                        if (atlasReady && skeletonReady) {
                            try { this._hideSpineLoading(); } catch (e) {}
                            return true;
                        }
                    }

                    // Fallback: check Phaser caches that plugin will read when creating.
                    const jsonCache = this.scene.cache && this.scene.cache.json ? this.scene.cache.json : null;
                    const jsonOk = jsonCache && typeof jsonCache.exists === 'function' ? jsonCache.exists(dataKey) : false;
                    const textOk = this.scene.cache && this.scene.cache.text && typeof this.scene.cache.text.exists === 'function' ? this.scene.cache.text.exists(atlasKey) : false;
                    const pageTex = this.scene.textures && typeof this.scene.textures.exists === 'function' ? this.scene.textures.exists(atlasKey + '!' + pageName) : false;
                    const binaryOk = this.scene.cache && this.scene.cache.binary && this.scene.cache.binary.exists && this.scene.cache.binary.exists(dataKey);

                    // Also consider any JSON cache key that mentions 'noteleks' as a sign the skeleton JSON is present
                    let anyNoteleksJson = jsonOk;
                    try {
                        if (!anyNoteleksJson && jsonCache && typeof jsonCache.keys === 'function') {
                            const keys = jsonCache.keys();
                            if (Array.isArray(keys)) {
                                anyNoteleksJson = keys.some(k => String(k).toLowerCase().includes('noteleks'));
                            }
                        }
                    } catch (e) {
                        // ignore probing errors
                    }

                    console.warn('[Player] phaser cache readiness: json=', jsonOk, 'anyNoteleksJson=', anyNoteleksJson, 'text=', textOk, 'pageTex=', pageTex);

                    // Accept readiness when the page texture exists and we can find any
                    // sensible skeleton JSON (either explicit dataKey, binary, or an
                    // alternate json key mentioning 'noteleks'). This is more tolerant
                    // to loader/plugin ordering differences while remaining conservative.
                    if (pageTex && (jsonOk || binaryOk || anyNoteleksJson)) return true;

                    // Preserve previous stricter path as a fallback
                    return ((jsonOk && pageTex) || (textOk && (jsonOk || binaryOk) && pageTex));
                } catch (e) {
                    console.warn('[Player] checkReadiness failed:', e && e.message);
                    return false;
                }
            };

            const attempt = () => {
                try {
                    // If scene.add.spine isn't yet present, bail to retry
                    if (!(this.scene.add && typeof this.scene.add.spine === 'function')) {
                        console.warn('[Player] scene.add.spine not yet available');
                        return false;
                    }

                    // Attempt to populate plugin caches on-demand if needed. This
                    // helper was added to bridge ordering races where the plugin
                    // registered after AssetManager populated Phaser caches.
                    try {
                        const populated = populatePluginCachesIfNeeded();
                        if (populated) console.warn('[Player] populatePluginCachesIfNeeded reported success');
                    } catch (e) {
                        // ignore helper failures — we'll continue with normal readiness checks
                        console.warn('[Player] populatePluginCachesIfNeeded threw:', e && e.message);
                    }

                    // Wait until either plugin caches or phaser caches are prepared
                    if (!checkReadiness()) {
                        console.warn('[Player] Spine assets/plugins not ready yet, will retry');
                        return false;
                    }

                    // Diagnostics: snapshot relevant caches and plugin internals
                    try {
                        const jsonEntry = this.scene.cache.json && typeof this.scene.cache.json.get === 'function' ? this.scene.cache.json.get(dataKey) : null;
                        const textEntry = this.scene.cache.text && typeof this.scene.cache.text.get === 'function' ? this.scene.cache.text.get(atlasKey) : null;
                        const pageTexExists = this.scene.textures && typeof this.scene.textures.exists === 'function' ? this.scene.textures.exists(atlasKey + '!' + pageName) : false;
                        const sys = this.scene && this.scene.sys ? this.scene.sys : null;
                        const plugin = sys && sys.spine ? sys.spine : null;
                        const pluginAtlasKeys = plugin && plugin.atlasCache && typeof plugin.atlasCache.keys === 'function' ? plugin.atlasCache.keys() : null;
                        const pluginSkelKeys = plugin && plugin.skeletonDataCache && typeof plugin.skeletonDataCache.keys === 'function' ? plugin.skeletonDataCache.keys() : null;
                        console.warn('[Player] spine create diagnostics:', { jsonEntry: !!jsonEntry, textEntry: !!textEntry, pageTexExists, pluginAtlasKeys, pluginSkelKeys });
                    } catch (diagErr) {
                        console.warn('[Player] spine diagnostics failed:', diagErr && diagErr.message);
                    }

                    // Attempt to add the spine object using the key used by AssetManager ('noteleks-data').
                    // scene.add.spine signature: (x, y, dataKey, atlasKey, boundsProvider?)
                    const created = this.scene.add.spine(this.x, this.y, dataKey, atlasKey);
                    this.spine = created || this.spine;
                    console.warn('[Player] Spine display create attempt, success=', !!this.spine);
                    if (this.spine) {
                        // Immediately attempt to set an initial animation to avoid a
                        // transient state where animState.apply runs before Player has
                        // recorded the current animation (causing 'currentAnim=undefined').
                        try {
                            // Prefer 'idle' if available; _setSpineAnimation is tolerant
                            // and will fallback to a sensible animation if 'idle' is missing.
                            try { this._setSpineAnimation('idle', true); } catch (e) {}
                        } catch (e) {}
                        try { if (typeof finalizeSpineVisual === 'function') finalizeSpineVisual(); } catch (e) {}
                        try { this._hideSpineLoading(); } catch (e) {}
                        return true;
                    }
                } catch (err) {
                    // Log more diagnostic information to help root-cause plugin failures
                    try {
                        const funcInfo = this.scene && this.scene.add && this.scene.add.spine ? String(this.scene.add.spine) : 'n/a';
                        console.warn('[Player] spine create threw:', (err && err.message) || err, '\nstack:', (err && err.stack) || 'no-stack', '\nscene.add.spine:', funcInfo);
                    } catch (logErr) {
                        console.warn('[Player] spine create threw (and failed to log details)', logErr && logErr.message);
                    }
                }
                return false;
            };

            // Kick off attempts with retry loop until we either succeed or exhaust attempts
            const tryOnce = () => {
                const ok = attempt();
                if (ok) return;
                if (attemptsLeft > 0) {
                    attemptsLeft -= 1;
                    setTimeout(tryOnce, delayMs);
                }
            };

            tryOnce();
            return false;
        };

        // Drain any queued _tryCreateSpine calls that happened before the
        // real implementation was attached (see constructor stub above).
        try {
            if (this._pendingTryCreateCalls && this._pendingTryCreateCalls.length) {
                for (const args of this._pendingTryCreateCalls) {
                    try { this._tryCreateSpine.apply(this, args); } catch (e) { /* ignore per-call */ }
                }
                this._pendingTryCreateCalls = [];
            }
        } catch (e) {
            // ignore draining errors
        }

    // Spine creation is now deferred; the constructor uses createPlayerDeferred
    // to wait for AssetManager readiness before starting _tryCreateSpine.

            // If the spine was created synchronously, run diagnostics and tune it.
            if (this.spine) {
            try {
                // Diagnostics: report which animation APIs are present
                console.warn('[Player] Spine object APIs:', {
                    setAnimation: typeof this.spine.setAnimation,
                    animationState: !!this.spine.animationState,
                    animationStateSetAnimation: this.spine.animationState ? typeof this.spine.animationState.setAnimation : 'n/a',
                    state: !!this.spine.state,
                    stateSetAnimation: this.spine.state ? typeof this.spine.state.setAnimation : 'n/a',
                });
                // Force an initial animation robustly
                try {
                    this._setSpineAnimation('idle', true);
                    console.warn('[Player] Called _setSpineAnimation("idle", true)');
                } catch (err) {
                    console.warn('[Player] _setSpineAnimation threw:', err && err.message);
                }

                // Print available animation names from the skeleton (if accessible)
                try {
                    const skel = this.spine && this.spine.spine && this.spine.spine.skeleton || (this.spine && this.spine.skeleton) || null;
                    if (skel && skel.data && skel.data.animations) {
                        const names = skel.data.animations.map(a => a.name);
                        console.warn('[Player] Spine skeleton animations:', names);
                    } else if ((this.spine && this.spine.animationState && this.spine.animationState.tracks) || (this.spine && this.spine.state && this.spine.state.tracks)) {
                        console.warn('[Player] Spine state/tracks present (could be runtime plugin variation)');
                    } else {
                        console.warn('[Player] No skeleton animation data visible on display');
                    }
                } catch (e) {
                    console.warn('[Player] Failed to read skeleton animations:', e && e.message);
                }
            } catch (e) {
                console.warn('[Player] Error while forcing initial spine animation:', e && e.message);
            }
            // Slight tuning for origin/scale so it sits on the physics body
            if (typeof this.spine.setOrigin === 'function') {
                this.spine.setOrigin(0.5, 1);
            }
            // Ensure configured base scale is applied when the spine display was created synchronously
            try {
                const baseScale = this.getAppliedScale();
                if (typeof this.spine.setScale === 'function') this.spine.setScale(baseScale);
            } catch (e) {
                // ignore
            }
            // Defensive normalization (same as in finalizeSpineVisual): ensure displayWidth positive and visible
            try {
                if (!this._isAttacking) {
                    const minPixels = 48;
                    const dw = (typeof this.spine.displayWidth === 'number') ? Math.abs(this.spine.displayWidth) : null;
                        if (dw !== null && dw > 0 && dw < minPixels) {
                        const factor = minPixels / dw;
                        const applied = this.getAppliedScale() * factor;
                        if (typeof this.spine.setScale === 'function') {
                            this.spine.setScale(applied);
                        } else {
                            try { this.spine.scaleX = Math.abs(this.spine.scaleX || applied); } catch (e) {}
                            try { this.spine.scaleY = Math.abs(this.spine.scaleY || applied); } catch (e) {}
                        }
                    }
                    try {
                        if (this.sprite && this.sprite.flipX) this.spine.scaleX = -Math.abs(this.spine.scaleX || this.getAppliedScale() || 1);
                        else this.spine.scaleX = Math.abs(this.spine.scaleX || this.getAppliedScale() || 1);
                    } catch (e) {}
                }
            } catch (e) {
                // ignore
            }
            // Ensure the spine is above the physics sprite visually but behind UI
            if (this.spine.setDepth) this.spine.setDepth(500);
            // Finalize visual and schedule hiding the physics sprite in a safe next-tick
            try { if (typeof finalizeSpineVisual === 'function') finalizeSpineVisual(); } catch (e) { /* ignore */ }
        }

        // If the spine data was prepared before this Player was constructed, try to create from cache now.
        // If cache is ready but we haven't succeeded yet, trigger the retry loop
        try {
            const cached = this.scene && this.scene.cache && this.scene.cache.custom ? this.scene.cache.custom : null;
            if (!this.spine && cached && (cached['spine-skeleton-data'] || cached['spine-atlas'])) {
                // Kick off a few retries targeted at plugin init races
                this._tryCreateSpine(8, 120);
            }
        } catch (e) {
            // ignore
        }

        // Aggressive final attempt: try creating the Spine GameObject using multiple
        // candidate data/atlas key pairs directly. This mirrors the diagnostic
        // snippet and helps when plugin caches exist but earlier readiness checks
        // missed them due to shape differences or timing races.
        try {
            if (!this.spine && this.scene && this.scene.add && typeof this.scene.add.spine === 'function') {
                const atlasCandidates = ['noteleks-data', 'noteleks-atlas', 'noteleks-data-atlas', 'noteleks-atlas-text', 'noteleks-texture', 'noteleks-data!noteleks-texture', 'noteleks-data!noteleks-texture.png', 'noteleks-data!noteleks-texture.jpg', 'noteleks-texture-page0', 'noteleks-texture!page0', 'noteleks-atlas'];
                const skeletonCandidates = ['noteleks-data', 'noteleks-skeleton-data', 'noteleks-data-skeleton'];
                // prefer explicit skeleton x atlas combinations then same-key combos
                const pairs = [];
                skeletonCandidates.forEach(sk => atlasCandidates.forEach(at => pairs.push({ sk, at })));
                atlasCandidates.concat(skeletonCandidates).forEach(k => pairs.push({ sk: k, at: k }));

                // Deduplicate and try each pair once
                const seen = new Set();
                for (const p of pairs) {
                    const key = (p.sk || '') + '||' + (p.at || '');
                    if (seen.has(key)) continue;
                    seen.add(key);
                    try {
                        let created = null;
                        try { created = this.scene.add.spine(this.x, this.y, p.sk, p.at); } catch (e1) {
                            try { created = this.scene.add.spine(this.x, this.y, p.sk); } catch (e2) { created = null; }
                        }
                        if (created) {
                            this.spine = created;
                            // expose for debugging
                            try { if (typeof window !== 'undefined') window._noteleks_diag_created = created; } catch (e) {}
                            // Immediately set an initial animation to avoid transient undefined
                            try { this._setSpineAnimation('idle', true); } catch (e) {}
                            try { if (typeof finalizeSpineVisual === 'function') finalizeSpineVisual(); } catch (e) {}
                            try { this._hideSpineLoading(); } catch (e) {}
                            console.warn('[Player] Aggressive fallback created spine with', p);
                            break;
                        }
                    } catch (err) {
                        // continue trying other pairs
                    }
                }
            }
        } catch (e) {
            // ignore aggressive fallback failures
        }

        // Auto-fix spine creation using QuickFix approach
        setTimeout(() => {
            if (!this.spine && this.scene && this.scene.add && typeof this.scene.add.spine === 'function') {
                try {
                    const spine = this.scene.add.spine(this.sprite.x, this.sprite.y, 'noteleks-data', 'noteleks-data');
                    if (spine) {
                        this.spine = spine;
                        spine.setScale(0.6);
                        spine.setOrigin(0.5, 1);
                        spine.setDepth(500);
                        
                        // Use working animation API
                        if (spine.animationState && spine.animationState.setAnimation) {
                            spine.animationState.setAnimation(0, 'idle', true);
                        }
                        
                        // Hide physics sprite since we have spine now
                        if (this.sprite) this.sprite.setVisible(false);
                        
                        try { this._hideSpineLoading(); } catch (e) {}
                        console.warn('[Player] Auto-fix spine creation successful');
                    }
                } catch (e) {
                    console.warn('[Player] Auto-fix spine creation failed:', e && e.message);
                }
            }
        }, 500);

        // Note: previous versions listened for 'spine-ready' here; creation is now
        // driven by the deferred initializer (createPlayerDeferred) which awaits the
        // same event and starts retries — avoiding duplicate attempts.

        // Final fallback: if no spine created, but AssetManager prepared a canvas fallback,
        // create a Phaser Image from it so the player is visible.
        if (!this.spine) {
            try {
                const cached = this.scene && this.scene.cache && this.scene.cache.custom ? this.scene.cache.custom : null;
                const fallback = cached && cached['spine-canvas-fallback'];
                if (fallback) {
                    // Prefer an animated spritesheet fallback when available
                    try {
                        // Attempt on-demand animation creation if texture exists but anim missing
                        try {
                            if (this.scene && this.scene.textures && this.scene.textures.exists && this.scene.textures.exists('skeleton-idle') && this.scene.anims && typeof this.scene.anims.exists === 'function' && !this.scene.anims.exists('player-idle')) {
                                try {
                                    const tex = this.scene.textures.get('skeleton-idle');
                                    const frameNames = (tex && typeof tex.getFrameNames === 'function') ? tex.getFrameNames() : null;
                                    if (frameNames && frameNames.length) {
                                        const frames = frameNames.map(n => ({ key: 'skeleton-idle', frame: n }));
                                        this.scene.anims.create({ key: 'player-idle', frames, frameRate: 12, repeat: -1 });
                                        console.info('[Player] Created missing animation player-idle from skeleton-idle frames (final fallback)');
                                        try { this.scene.cache.custom = this.scene.cache.custom || {}; this.scene.cache.custom['player-idle-created-by'] = { by: 'Player', key: 'player-idle', ts: new Date().toISOString(), stage: 'final-fallback' }; } catch (e) {}
                                    }
                                } catch (ae) { /* ignore */ }
                            }
                        } catch (e) {}

                        if (this.scene && this.scene.anims && this.scene.anims.exists && this.scene.anims.exists('player-idle')) {
                            const spr = this.scene.add.sprite(this.x, this.y, 'skeleton-idle').setOrigin(0.5, 1);
                            try {
                                const baseScale = this.getAppliedScale();
                                if (spr && typeof spr.setScale === 'function') spr.setScale(baseScale);
                            } catch (e) {}
                            if (spr && spr.play) spr.play('player-idle');
                            if (spr && spr.setDepth) spr.setDepth(500);
                            this.spine = spr;
                        } else {
                            // Use the preloaded noteleks texture as a safe static fallback (no Spine runtime calls)
                            this.spine = this.scene.add.image(this.x, this.y, 'noteleks-texture').setOrigin(0.5, 1);
                            try {
                                const baseScale = this.getAppliedScale();
                                if (this.spine && typeof this.spine.setScale === 'function') this.spine.setScale(baseScale);
                            } catch (e) {}
                            if (this.spine && this.spine.setDepth) this.spine.setDepth(500);
                        }
                        try { this._hideSpineLoading(); } catch (e) {}
                        // Finalize visual and schedule hiding the physics sprite in a safe next-tick
                        try { if (typeof finalizeSpineVisual === 'function') finalizeSpineVisual(); } catch (e) { /* ignore */ }
                        console.warn('[Player] Spine canvas fallback created as final fallback (animated if available)');
                    } catch (e) {
                        // If animated fallback creation fails, fall back to static image
                        try {
                            this.spine = this.scene.add.image(this.x, this.y, 'noteleks-texture').setOrigin(0.5, 1);
                            if (this.spine && this.spine.setDepth) this.spine.setDepth(500);
                            try { this._hideSpineLoading(); } catch (e) {}
                            try { if (typeof finalizeSpineVisual === 'function') finalizeSpineVisual(); } catch (e) { /* ignore */ }
                            console.warn('[Player] Spine canvas fallback image created as final fallback (static)');
                        } catch (e2) { /* ignore */ }
                    }
                }
            } catch (e) {
                // ignore
            }
        }

        // Safety: ensure the loading overlay doesn't remain indefinitely in case
        // none of the creation paths remove it (guard against stuck probes). This
        // will quietly hide the overlay after a reasonable timeout.
        try {
            setTimeout(() => { try { this._hideSpineLoading(); } catch (e) { /* ignore */ } }, 8000);
        } catch (e) {
            // ignore
        }

        // Note: test-only forced persistent fallback removed. Persistent fallback is created
        // dynamically by the probe/fallback logic above when the Spine visual is detected as blank.

    // Small bob animation state for static fallback to make character feel alive
    this._fallbackBob = { t: 0 };
    // Jump progress tracking (position-based)
    this._jumpStartY = null; // y at jump start
    this._jumpTravelAccum = 0; // accumulated vertical travel in px
    this._jumpTravelTarget = null; // estimated total vertical travel (px)

        // Expose a debug handle for easier inspection from the browser console
        try {
            if (typeof window !== 'undefined') {
                window.noteleksPlayer = this;
                console.warn('[Player] Debug handle available: window.noteleksPlayer');
                console.warn('[Player] You can inspect and manually call: window.noteleksPlayer.spine && window.noteleksPlayer.spine.setAnimation(0, "idle", true)');
            }
        } catch (e) {
            // ignore
        }

        // Start a small debug UI overlay that appears when skeleton animation data is available.
        // It will list animation names and let you click buttons to play them.
        try {
            this._debugOverlayStarted = false;
            this._startDebugOverlayPolling = () => {
                if (this._debugOverlayStarted) return;
                this._debugOverlayStarted = true;
                let attempts = 0;
                const maxAttempts = 12; // ~6 seconds
                const iv = setInterval(() => {
                    attempts += 1;
                    const names = this._gatherAnimationNames();
                    if (names && names.length) {
                        clearInterval(iv);
                        this._buildDebugOverlay(names);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(iv);
                        console.warn('[Player] Debug overlay: no skeleton animation data found, stopping poll');
                    }
                }, 500);
            };

            this._gatherAnimationNames = () => {
                try {
                    const spineObj = this.spine;
                    const skel = (spineObj && spineObj.spine && spineObj.spine.skeleton) || (spineObj && spineObj.skeleton) || null;
                    if (skel && skel.data && Array.isArray(skel.data.animations)) {
                        return skel.data.animations.map(a => a.name);
                    }
                    // Fallback: check for prepared runtime skeleton data in scene.cache.custom
                    try {
                        const cached = this.scene && this.scene.cache && this.scene.cache.custom ? this.scene.cache.custom : null;
                        if (cached && cached['spine-skeleton-data'] && cached['spine-skeleton-data'].animations) {
                            return cached['spine-skeleton-data'].animations.map(a => a.name);
                        }
                    } catch (e) {
                        // ignore
                    }
                    // Fallback: parse raw skeleton JSON loaded into cache.json
                    try {
                        const raw = this.scene && this.scene.cache && this.scene.cache.json ? this.scene.cache.json.get('noteleks-skeleton-data') : null;
                        if (raw && raw.animations && Array.isArray(raw.animations)) {
                            return raw.animations.map(a => a.name);
                        }
                        // Some skeleton JSON formats store animations under 'animations' object map
                        if (raw && raw.animations && typeof raw.animations === 'object') {
                            return Object.keys(raw.animations || {});
                        }
                    } catch (e) {
                        // ignore
                    }
                } catch (e) {
                    // ignore
                }
                return null;
            };

            this._buildDebugOverlay = (names) => {
                try {
                    // Remove existing overlay if present
                    const existing = document.getElementById('noteleks-debug-overlay');
                    if (existing) existing.remove();

                    const container = document.createElement('div');
                    container.id = 'noteleks-debug-overlay';
                    container.style.position = 'fixed';
                    container.style.right = '12px';
                    container.style.bottom = '12px';
                    container.style.background = 'rgba(0,0,0,0.65)';
                    container.style.color = '#fff';
                    container.style.padding = '8px';
                    container.style.borderRadius = '6px';
                    container.style.fontSize = '12px';
                    container.style.fontFamily = 'Arial, sans-serif';
                    container.style.zIndex = 999999;
                    container.style.maxWidth = '320px';
                    container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.6)';

                    const title = document.createElement('div');
                    title.textContent = 'Noteleks Debug';
                    title.style.fontWeight = '700';
                    title.style.marginBottom = '6px';
                    container.appendChild(title);

                    const info = document.createElement('div');
                    info.textContent = 'Animations:';
                    info.style.marginBottom = '6px';
                    container.appendChild(info);

                    const list = document.createElement('div');
                    list.style.display = 'flex';
                    list.style.flexWrap = 'wrap';
                    list.style.gap = '6px';
                    list.style.maxHeight = '160px';
                    list.style.overflow = 'auto';

                    names.forEach((n) => {
                        const btn = document.createElement('button');
                        btn.textContent = n;
                        btn.style.background = '#222';
                        btn.style.color = '#fff';
                        btn.style.border = '1px solid rgba(255,255,255,0.08)';
                        btn.style.padding = '4px 8px';
                        btn.style.borderRadius = '4px';
                        btn.style.cursor = 'pointer';
                        btn.onclick = (ev) => {
                            ev.preventDefault();
                            try {
                                if (this._setSpineAnimation) this._setSpineAnimation(n, true);
                                else if (this.spine && typeof this.spine.setAnimation === 'function') {
                                    this.spine.setAnimation(0, n, true);
                                } else if (this.spine && this.spine.animationState && typeof this.spine.animationState.setAnimation === 'function') {
                                    this.spine.animationState.setAnimation(0, n, true);
                                } else if (this.spine && this.spine.state && typeof this.spine.state.setAnimation === 'function') {
                                    this.spine.state.setAnimation(0, n, true);
                                }
                                console.warn('[Player] Debug: triggered animation', n);
                            } catch (e) {
                                console.warn('[Player] Debug: failed to trigger animation', n, e && e.message);
                            }
                        };
                        list.appendChild(btn);
                    });
                    container.appendChild(list);

                    const controls = document.createElement('div');
                    controls.style.display = 'flex';
                    controls.style.justifyContent = 'space-between';
                    controls.style.marginTop = '8px';

                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = 'Close';
                    closeBtn.style.background = 'transparent';
                    closeBtn.style.color = '#fff';
                    closeBtn.style.border = '1px solid rgba(255,255,255,0.12)';
                    closeBtn.style.padding = '4px 8px';
                    closeBtn.style.borderRadius = '4px';
                    closeBtn.style.cursor = 'pointer';
                    closeBtn.onclick = () => container.remove();

                    controls.appendChild(closeBtn);
                    container.appendChild(controls);

                    document.body.appendChild(container);
                    console.warn('[Player] Debug overlay built with animations:', names);
                } catch (e) {
                    console.warn('[Player] Failed to build debug overlay:', e && e.message);
                }
            };

            // Kick off polling for animation names (overlay will appear only when enabled)
            try {
                const overlayEnabled = (GameConfig && GameConfig.debug && GameConfig.debug.enablePlayerDebugOverlay) || (typeof window !== 'undefined' && !!window.noteleksDebug);
                if (overlayEnabled && typeof window !== 'undefined') {
                    // Start soon but allow the scene to finish loading
                    setTimeout(() => this._startDebugOverlayPolling(), 300);
                }
            } catch (e) {
                // ignore
            }
        } catch (e) {
            // ignore overlay failures
        }
    }

    // Return the effective scale to apply to visuals. If a per-player
    // override (_overrideScale) has been set via setDisplayHeight, use that.
    getAppliedScale() {
        try {
            if (typeof this._overrideScale === 'number' && !Number.isNaN(this._overrideScale) && isFinite(this._overrideScale)) return Math.abs(this._overrideScale);
            const cfg = (GameConfig && GameConfig.player && typeof GameConfig.player.scale === 'number') ? GameConfig.player.scale : 1;
            return Math.abs(cfg || 1);
        } catch (e) {
            return 1;
        }
    }

    /**
     * Set the displayed on-screen height (in pixels) for the player visual.
     * This computes a uniform scale from the available source image/frame
     * height and applies it to both Spine and Phaser fallback visuals.
     * If a source frame cannot be determined, the call is a no-op.
     * @param {number} targetPx - desired on-screen height in pixels
     */
    setDisplayHeight(targetPx) {
        try {
            if (!targetPx || typeof targetPx !== 'number' || targetPx <= 0) return false;
            // Helper to derive source image/frame height from a Phaser texture key
            const deriveFromTextureKey = (key) => {
                try {
                    if (!this.scene || !this.scene.textures || !this.scene.textures.exists) return null;
                    if (!this.scene.textures.exists(key)) return null;
                    const tex = this.scene.textures.get(key);
                    if (!tex) return null;
                    // If texture has explicit frames, prefer first frame's height
                    try {
                        const frameNames = typeof tex.getFrameNames === 'function' ? tex.getFrameNames() : null;
                        if (frameNames && frameNames.length) {
                            const fn = frameNames[0];
                            const frame = tex.get(fn) || tex.frames && tex.frames[fn] || null;
                            if (frame && typeof frame.height === 'number' && frame.height > 0) return frame.height;
                        }
                    } catch (e) {}
                    // Fallback: try to get underlying source image dimensions
                    try {
                        const src = tex.getSourceImage ? tex.getSourceImage() : (tex && tex.source && tex.source[0] && tex.source[0].image) || null;
                        if (src && typeof src.height === 'number' && src.height > 0) return src.height;
                    } catch (e) {}
                } catch (e) {}
                return null;
            };

            // Candidate sources: persistent fallback sprite, persistent image, spine display, physics sprite texture
            let sourceH = null;
            try {
                if (this._persistentFallbackSprite && this._persistentFallbackSprite.texture) {
                    sourceH = deriveFromTextureKey(this._persistentFallbackSprite.texture.key) || sourceH;
                }
                if (!sourceH && this._persistentFallbackImage && this._persistentFallbackImage.texture) {
                    sourceH = deriveFromTextureKey(this._persistentFallbackImage.texture.key) || sourceH;
                }
                if (!sourceH && this.spine) {
                    // Try to infer source height from spine.displayHeight and current scale
                    try {
                        const disp = (typeof this.spine.displayHeight === 'number') ? Math.abs(this.spine.displayHeight) : null;
                        const curScale = (typeof this.spine.scaleY === 'number') ? Math.abs(this.spine.scaleY) : (typeof this.spine.scale === 'number' ? Math.abs(this.spine.scale) : null);
                        if (disp && curScale) sourceH = Math.max(2, Math.round(disp / curScale));
                    } catch (e) {}
                }
                if (!sourceH && this.sprite && this.sprite.texture) {
                    sourceH = deriveFromTextureKey(this.sprite.texture.key) || sourceH;
                }
            } catch (e) {}

            if (!sourceH || sourceH <= 0) return false;

            const finalScale = targetPx / sourceH;
            // Persist override so other logic can pick it up
            this._overrideScale = finalScale;

            // Apply to spine if present
            try {
                if (this.spine) {
                    if (typeof this.spine.setScale === 'function') {
                        const sign = (this.sprite && this.sprite.flipX) ? -1 : 1;
                        this.spine.setScale(sign * finalScale, finalScale);
                    } else {
                        try { this.spine.scaleX = (this.sprite && this.sprite.flipX) ? -Math.abs(finalScale) : Math.abs(finalScale); } catch (e) {}
                        try { this.spine.scaleY = Math.abs(finalScale); } catch (e) {}
                    }
                }
            } catch (e) {}

            // Apply to persistent Phaser fallbacks
            try {
                if (this._persistentFallbackSprite && typeof this._persistentFallbackSprite.setScale === 'function') {
                    this._persistentFallbackSprite.setScale(finalScale);
                }
                if (this._persistentFallbackImage && typeof this._persistentFallbackImage.setScale === 'function') {
                    this._persistentFallbackImage.setScale(finalScale);
                }
            } catch (e) {}

            // Also apply to the physics sprite visual so transitions look correct
            try {
                if (this.sprite && typeof this.sprite.setScale === 'function') this.sprite.setScale(finalScale);
            } catch (e) {}

            return true;
        } catch (e) {
            return false;
        }
    }

    setupComponents() {
        const config = GameConfig.player;

        // Add physics component
        this.addComponent(
            'physics',
            new PhysicsComponent({
                bounce: 0.2,
                collideWorldBounds: true,
                bodyWidth: 32,
                bodyHeight: 48,
            }),
        );

        // Add movement component
        this.addComponent('movement', new MovementComponent(config.speed, config.jumpPower));

        // Add health component
        this.addComponent('health', new HealthComponent(config.health, config.maxHealth));

        // Add input component
        this.addComponent('input', new InputComponent());

        // Add attack component
        this.addComponent('attack', new AttackComponent());

        // Setup component callbacks
        this.setupComponentCallbacks();
    }

    setupComponentCallbacks() {
        // Health component callbacks
        const healthComponent = this.getComponent('health');
        healthComponent.onDeath(() => {
            // Player death logic
            this.scene.gameOver();
        });

        // Attack component callbacks
        const attackComponent = this.getComponent('attack');
        attackComponent.onAttack((target, facing, _damage) => {
            // Temporarily disable projectile firing here; we want to work on
            // the attack animation first and avoid spawning daggers.
            // The Player.attack() method still plays the attack animation
            // (via this._setSpineAnimation('attack', false)) and sets
            // this._isAttacking so animation state is respected.
            // If we re-enable projectiles later, reintroduce createWeapon
            // call here or implement melee hit detection instead.
            // Example placeholder if needed for debugging:
            // console.info('[Player] attack triggered — projectiles disabled for now', target, facing, _damage);
        });
    }

    update(cursors, wasd, spaceKey) {
        if (this.scene.gameState !== 'playing') return;

        // Check if this is being called from SystemManager with deltaTime only
        if (typeof cursors === 'number' && wasd === undefined && spaceKey === undefined) {
            // This is a deltaTime call from SystemManager - just update base components
            super.update(cursors);
            return;
        }

        // Defensive check for input objects
        if (!cursors || !wasd || !spaceKey) {
            return;
        }

        // Update all components first
        super.update(16); // 16ms for 60fps

        // Handle input
        const inputComponent = this.getComponent('input');
        const movementComponent = this.getComponent('movement');

        if (inputComponent && movementComponent) {
            // Create input state object
            const inputState = {
                left: cursors.left?.isDown || false || wasd.A?.isDown || false,
                right: cursors.right?.isDown || false || wasd.D?.isDown || false,
                up: cursors.up?.isDown || false || wasd.W?.isDown || false,
                attack: false, // Mouse input handled separately
            };

            this.processInputState(inputState, inputComponent, movementComponent);
        }

        // Sync spine position/flip if available
        // Sync visual each frame (separate method to allow mobile path to call it)
        this._syncSpineVisual();
    }

    updateWithInputState(inputState) {
        if (this.scene.gameState !== 'playing') return;

        // Update all components first
        super.update(16); // 16ms for 60fps

        // Handle input
        const inputComponent = this.getComponent('input');
        const movementComponent = this.getComponent('movement');

        if (inputComponent && movementComponent && inputState) {
            this.processInputState(inputState, inputComponent, movementComponent);
        }
        // Also sync the visual to ensure spine animations advance on mobile
        this._syncSpineVisual();
    }

    _syncSpineVisual() {
        // Proceed if we have either a spine visual or a persistent Phaser fallback
        if (!this.spine && !this._persistentFallbackSprite && !this._persistentFallbackImage) return;
        try {
            // Spine display may be a Phaser Spine Game Object with x/y properties
            // Handle Image fallback bob animation
            if (this.spine.texture && this.spine.texture.key === 'noteleks-texture') {
                this._fallbackBob.t += 0.1;
                const bobOffset = Math.sin(this._fallbackBob.t) * 2;
                this.spine.x = this.sprite.x;
                this.spine.y = this.sprite.y + (this.sprite.displayHeight / 2) - 4 + bobOffset;
            } else {
                this.spine.x = this.sprite.x;
                this.spine.y = this.sprite.y + (this.sprite.displayHeight / 2) - 4; // tuck into the sprite
            }
            // Flip spine horizontally to match sprite
            if (this.sprite.flipX) {
                try {
                    const base = this.getAppliedScale();
                    this.spine.scaleX = -Math.abs(base);
                } catch (e) {
                    this.spine.scaleX = -1;
                }
            } else {
                try {
                    const base = this.getAppliedScale();
                    this.spine.scaleX = Math.abs(base);
                } catch (e) {
                    this.spine.scaleX = 1;
                }
            }
            // Manual spine AnimationState advance (guarded). Some plugin builds
            // may not auto-update the AnimationState in our environment; this
            // ensures animation time progresses.
            try {
                // Prefer animationState when present (some plugin variants expose it as animationState)
                const animState = (this.spine && (this.spine.animationState || this.spine.state)) || null;
                if (!this._spineManualAdvanceLogged && animState && typeof animState.update === 'function') {
                    console.warn('[Player] Manual spine animation advancement is enabled');
                    this._spineManualAdvanceLogged = true;
                }
                if (animState && typeof animState.update === 'function' && this.scene && this.scene.game && this.scene.game.loop) {
                    const dt = (this.scene.game.loop.delta || 16) / 1000;
                    // Ensure an initial animation is selected before advancing/applying
                    // the AnimationState. This avoids a race where animState.apply
                    // runs on the first frame before Player._currentSpineAnim is set
                    // (which caused transient 'currentAnim= undefined' logs).
                    if (!this._currentSpineAnim) {
                        try {
                            // Prefer 'idle' but fall back to the first available animation
                            try { this._setSpineAnimation('idle', true); } catch (e) {
                                try {
                                    const sk = (this.spine && this.spine.spine && this.spine.spine.skeleton) || this.spine.skeleton || null;
                                    if (sk && sk.data && Array.isArray(sk.data.animations) && sk.data.animations.length) {
                                        const names = sk.data.animations.map(a => a.name);
                                        if (names && names.length) this._setSpineAnimation(names[0], true);
                                    } else {
                                        const raw = this.scene && this.scene.cache && this.scene.cache.json ? this.scene.cache.json.get('noteleks-skeleton-data') : null;
                                        if (raw) {
                                            const names2 = raw.animations && Array.isArray(raw.animations) ? raw.animations.map(a => a.name) : (raw.animations && typeof raw.animations === 'object' ? Object.keys(raw.animations) : []);
                                            if (names2 && names2.length) this._setSpineAnimation(names2[0], true);
                                        }
                                    }
                                } catch (e2) { /* ignore fallback failures */ }
                            }
                        } catch (e) { /* ignore initial animation set failures */ }
                    }

                    animState.update(dt);
                        // If we have jump timing info, attempt to set spine track time
                        try {
                            if (this._isJumping && this._jumpStartTime && this._jumpAirtime && animState) {
                                const now = (this.scene && this.scene.time && typeof this.scene.time.now === 'number') ? this.scene.time.now : Date.now();
                                let p = (now - this._jumpStartTime) / (this._jumpAirtime || 1);
                                p = Math.max(0, Math.min(1, p));
                                try {
                                    // Some Spine runtimes expose tracks array on animationState
                                    const entry = (animState.tracks && animState.tracks[0]) || null;
                                    if (entry && entry.animation && typeof entry.trackTime === 'number') {
                                        // animation.duration may exist; otherwise use entry.animation.duration
                                        const dur = (entry.animation && (typeof entry.animation.duration === 'number' ? entry.animation.duration : (entry.animation.duration || 1))) || 1;
                                        entry.trackTime = p * dur;
                                    }
                                } catch (e) {}
                            }
                        } catch (e) {}
                    // Some plugin variants expose the runtime skeleton in different places.
                    // Try the common locations and apply the animation state to whichever exists.
                    const skeletonRef = (this.spine && this.spine.spine && this.spine.spine.skeleton) || this.spine.skeleton || null;
                    try {
                                if (skeletonRef && typeof animState.apply === 'function') {
                                        animState.apply(skeletonRef);
                                        try {
                                            // Avoid noisy per-frame logs unless explicit debug flag is set.
                                            if (typeof window !== 'undefined' && window.__NOTELEKS_DEBUG__) {
                                                console.warn('[Player] animState.apply executed (debug mode), currentAnim=', this._currentSpineAnim, 'skeletonRef=', !!skeletonRef);
                                            } else if (!this._spineApplyLogged) {
                                                // Log only once in normal operation to confirm the apply ran.
                                                console.warn('[Player] animState.apply executed (first frame), currentAnim=', this._currentSpineAnim);
                                                this._spineApplyLogged = true;
                                            }
                                        } catch(e) {}
                                    }
                    } catch (applyErr) {
                        // Best-effort: if apply fails for this skeleton, attempt the other common ref
                        try {
                            const altRef = (this.spine && this.spine.skeleton) || (this.spine && this.spine.spine && this.spine.spine.skeleton) || null;
                                if (altRef && typeof animState.apply === 'function') {
                                    animState.apply(altRef);
                                    try {
                                        if (typeof window !== 'undefined' && window.__NOTELEKS_DEBUG__) {
                                            console.warn('[Player] animState.apply executed on altRef (debug mode), currentAnim=', this._currentSpineAnim, 'altRef=', !!altRef);
                                        } else if (!this._spineApplyLogged) {
                                            console.warn('[Player] animState.apply executed on altRef (first frame), currentAnim=', this._currentSpineAnim);
                                            this._spineApplyLogged = true;
                                        }
                                    } catch(e) {}
                                }
                        } catch (applyErr2) {
                            // ignore failed applies
                        }
                    }
                    // Updating world transform can fail in some runtime builds; swallow those errors
                    try {
                        const sk = skeletonRef || ((this.spine && this.spine.skeleton) || null);
                        if (sk && typeof sk.updateWorldTransform === 'function') sk.updateWorldTransform();
                    } catch (uwtErr) {
                        // ignore update errors (some runtimes attach extra extensions that may be undefined)
                    }
                }
            } catch (e) {
                // Ignore manual update errors
            }

            // Per-frame defensive enforcement: ensure the spine visual has a
            // non-vanishing, positive display size so it remains visible across
            // renderer/runtime variations. If displayWidth is present and smaller
            // than a minimum pixel width, boost the scale proportionally. This
            // corrects transient cases where displayWidth briefly reports very
            // small values or where previous normalization didn't run.
            try {
                if (!this._isAttacking) {
                    const minPixels = (GameConfig && GameConfig.player && GameConfig.player.minVisibleWidth) || 40;
                    const dw = (typeof this.spine.displayWidth === 'number') ? Math.abs(this.spine.displayWidth) : null;
                    if (dw !== null && dw > 0 && dw < minPixels) {
                        const factor = minPixels / dw;
                        // Determine current absolute scale (fallback to configured base)
                        const baseScale = this.getAppliedScale() || Math.abs(this.spine.scaleX || 1);
                        const newScale = baseScale * factor;
                        if (typeof this.spine.setScale === 'function') {
                            // preserve horizontal flip sign
                            this.spine.setScale(this.sprite && this.sprite.flipX ? -newScale : newScale, newScale);
                        } else {
                            try { this.spine.scaleX = this.sprite && this.sprite.flipX ? -Math.abs(newScale) : Math.abs(newScale); } catch (e) {}
                            try { this.spine.scaleY = Math.abs(newScale); } catch (e) {}
                        }
                    }
                }
            } catch (e) {
                // ignore enforcement errors
            }
        } catch (e) {
            // ignore sync errors
        }

        // Ensure any persistent Phaser animated/static fallback follows the
        // physics sprite (position, flip, depth). MovementComponent updates
        // the physics sprite; keep the visible fallback matched so controls
        // appear to work.
        try {
            const phys = this.sprite;
            if (phys) {
                // Animated sprites created as persistent fallback
                if (this._persistentFallbackSprite) {
                    try {
                        const fb = this._persistentFallbackSprite;
                        // Match position and origin (sprite uses origin 0.5,1)
                        if (typeof fb.setPosition === 'function') fb.setPosition(phys.x, phys.y);
                        // Sync flip — Phaser Sprite uses setFlipX
                        if (typeof fb.setFlipX === 'function') fb.setFlipX(!!phys.flipX);
                        // Ensure animation is playing. Avoid repeatedly calling play()
                        // every frame which restarts the animation and freezes it on
                        // the first frame. Use a transient flag on the sprite so we
                        // only call play() once when necessary.
                        try {
                            if (typeof fb.play === 'function') {
                                const isPlaying = fb.anims && !!fb.anims.isPlaying;
                                if (!isPlaying && fb._noteleks_animStarted !== true) {
                                    try { fb.play('player-idle'); } catch (e) {}
                                    try { fb._noteleks_animStarted = true; } catch (e) {}
                                }
                            }
                        } catch (e) {}
                        // If we're mid-jump, progress the non-looping jump animation
                        try {
                            if (this._isJumping && this._jumpStartTime && this._jumpAirtime && fb && fb.anims && fb._noteleks_currentAnimKey && fb._noteleks_currentAnimKey.indexOf('jump') !== -1) {
                                const now = (this.scene && this.scene.time && typeof this.scene.time.now === 'number') ? this.scene.time.now : Date.now();
                                let p = (now - this._jumpStartTime) / (this._jumpAirtime || 1);
                                p = Math.max(0, Math.min(1, p));
                                try {
                                    if (typeof fb.anims.setProgress === 'function') {
                                        fb.anims.setProgress(p);
                                    } else {
                                        const anim = fb.anims.currentAnim;
                                        if (anim && Array.isArray(anim.frames) && anim.frames.length) {
                                            const idx = Math.min(anim.frames.length - 1, Math.floor(p * anim.frames.length));
                                            const frame = anim.frames[idx];
                                            if (frame && fb.anims.setCurrentFrame) fb.anims.setCurrentFrame(frame);
                                        }
                                    }
                                } catch (e) {}
                            }
                        } catch (e) {}
                        // Match depth so it renders above physics sprite
                        if (typeof fb.setDepth === 'function') fb.setDepth(501);
                        // Match visible state: show fallback when spine is hidden
                        try { if (this.spine) fb.setVisible(false); else fb.setVisible(true); } catch (e) {}
                    } catch (e) {
                        // ignore per-frame fallback sync errors
                    }
                }

                // Static image fallback
                if (this._persistentFallbackImage) {
                    try {
                        const im = this._persistentFallbackImage;
                        if (typeof im.setPosition === 'function') im.setPosition(phys.x, phys.y);
                        if (typeof im.setFlipX === 'function') im.setFlipX(!!phys.flipX);
                        if (typeof im.setDepth === 'function') im.setDepth(501);
                        try { if (this.spine) im.setVisible(false); else im.setVisible(true); } catch (e) {}
                    } catch (e) {
                        // ignore
                    }
                }
            }
        } catch (e) {
            // ignore fallback sync failures
        }
    }

    processInputState(inputState, inputComponent, movementComponent) {
        // Process movement input
        inputComponent.processInput(inputState);

        // Check if jumping
        const isJumping = !movementComponent.isOnGround();
        
        // Handle jump input
        if (inputState.up && movementComponent.isOnGround()) {
            try {
                const jumped = movementComponent.jump();
                if (jumped) {
                    this._setSpineAnimation('jump', false);
                    this._isJumping = true;
                    // Estimate airtime from jumpPower and world gravity (t = 2*v0/g)
                    try {
                        const v0 = (movementComponent && typeof movementComponent.jumpPower === 'number') ? movementComponent.jumpPower : (GameConfig.player && GameConfig.player.jumpPower) || 300;
                        const gravity = (this.scene && this.scene.physics && this.scene.physics.world && this.scene.physics.world.gravity && typeof this.scene.physics.world.gravity.y === 'number') ? Math.abs(this.scene.physics.world.gravity.y) : (this.sprite && this.sprite.body && this.sprite.body.gravity && typeof this.sprite.body.gravity.y === 'number' ? Math.abs(this.sprite.body.gravity.y) : 600);
                        const airtimeSec = (v0 / gravity) * 2;
                        const airtimeMs = Math.max(100, Math.round(airtimeSec * 1000));
                        this._jumpStartTime = (this.scene && this.scene.time && typeof this.scene.time.now === 'number') ? this.scene.time.now : Date.now();
                        this._jumpAirtime = airtimeMs;
                    } catch (e) {
                        this._jumpStartTime = (this.scene && this.scene.time && typeof this.scene.time.now === 'number') ? this.scene.time.now : Date.now();
                        this._jumpAirtime = 600;
                    }

                    // Clear jump state after estimated airtime (defensive fallback)
                    try {
                        const clearMs = (this._jumpAirtime && typeof this._jumpAirtime === 'number') ? (this._jumpAirtime + 80) : 700;
                        setTimeout(() => {
                            this._isJumping = false;
                            this._jumpStartTime = null;
                            this._jumpAirtime = null;
                        }, clearMs);
                    } catch (e) {}
                }
            } catch (e) {}
        }
        
        // Only change movement animations if not jumping or attacking
        if (!this._isJumping && !isJumping && !this._isAttacking) {
            if (inputState.left) {
                movementComponent.moveLeft();
                this._setSpineAnimation('run', true);
            } else if (inputState.right) {
                movementComponent.moveRight();
                this._setSpineAnimation('run', true);
            } else {
                movementComponent.stopHorizontal();
                this._setSpineAnimation('idle', true);
            }
        } else if (!this._isJumping && !this._isAttacking) {
            // Still allow horizontal movement while in air
            if (inputState.left) {
                movementComponent.moveLeft();
            } else if (inputState.right) {
                movementComponent.moveRight();
            } else {
                movementComponent.stopHorizontal();
            }
        }

        // Process attack input
        if (inputState.attack && !this._isAttacking) {
            this.attack();
        }
    }

    _setSpineAnimation(name, loop = true) {
        // Determine a stable base scale to apply to both Spine and fallback
        // visuals so animations with differing frame sizes don't cause the
        // character to visually shrink or grow when switching animations.
    const baseScale = this.getAppliedScale();
        // If no Spine visual is present, attempt to play equivalent Phaser
        // fallback animations on the persistent fallback sprite/image. This
        // ensures movement and attack animations still play when Spine is
        // unavailable.
        if (!this.spine) {
            try {
                const fb = this._persistentFallbackSprite || this._persistentFallbackImage || null;
                if (fb && this.scene && this.scene.anims) {
                    // Map generic spine animation names to our Phaser fallback keys
                    const mapAnim = (n) => {
                        if (!n) return null;
                        const lower = String(n).toLowerCase();
                        if (lower === 'idle') return 'player-idle';
                        if (lower === 'run') return this.scene.anims.exists('player-run') ? 'player-run' : 'player-walk';
                        if (lower === 'walk') return this.scene.anims.exists('player-walk') ? 'player-walk' : 'player-run';
                        // Prefer exact player-attack; do not fall back to player-jump-attack here
                        if (lower === 'attack' || lower === 'jump-attack' || lower === 'jumpattack') return this.scene.anims.exists('player-attack') ? 'player-attack' : null;
                        if (lower === 'jump') {
                            // prefer an explicit player-jump animation, otherwise fall back to jump-attack or generic attack
                            if (this.scene.anims.exists('player-jump')) return 'player-jump';
                            if (this.scene.anims.exists('player-jump-attack')) return 'player-jump-attack';
                            if (this.scene.anims.exists('player-attack')) return 'player-attack';
                            return null;
                        }
                        // generic fallback prefix
                        const candidate = 'player-' + lower;
                        return this.scene.anims.exists(candidate) ? candidate : null;
                    };

                    const animKey = mapAnim(name);
                    if (animKey && this.scene.anims.exists(animKey) && typeof fb.play === 'function') {
                        try {
                            // Ensure fallback sprite uses the configured base scale
                            try { if (typeof fb.setScale === 'function') fb.setScale(baseScale); } catch (e) {}
                            // If the fallback sprite is already playing this animation
                            // (and we've recorded that), avoid re-calling play which
                            // would restart it. Otherwise, start the requested anim
                            // and record it so subsequent frames don't restart it.
                            const currentKey = fb._noteleks_currentAnimKey || null;
                            const alreadyPlayingRecorded = (currentKey === animKey && fb._noteleks_animStarted === true);
                            if (alreadyPlayingRecorded) {
                                this._currentSpineAnim = name;
                                return;
                            }

                            // Start the animation on the fallback sprite
                            fb.play(animKey);
                            fb._noteleks_currentAnimKey = animKey;
                            fb._noteleks_animStarted = true;
                            this._currentSpineAnim = name;

                            // If this animation is non-looping, revert to idle when complete
                            if (!loop) {
                                const onComplete = (anim, frame) => {
                                        try {
                                            // cleanup listener
                                            if (typeof fb.off === 'function') fb.off('animationcomplete', onComplete);
                                        } catch (e) {}
                                        try { this._isAttacking = false; } catch (e) {}
                                        try { if (this._attackTimeout) { clearTimeout(this._attackTimeout); this._attackTimeout = null; } } catch (e) {}
                                        try {
                                            if (this.scene && this.scene.anims && this.scene.anims.exists('player-idle') && typeof fb.play === 'function') {
                                                fb.play('player-idle');
                                                fb._noteleks_currentAnimKey = 'player-idle';
                                                fb._noteleks_animStarted = true;
                                            }
                                        } catch (e) {}
                                    };
                                try {
                                    if (typeof fb.once === 'function') fb.once('animationcomplete', onComplete);
                                    else if (typeof fb.on === 'function') fb.on('animationcomplete', onComplete);
                                } catch (e) {
                                    // ignore listener hookup errors
                                }
                            }
                        } catch (e) {
                            // fall through to attempt spine APIs (below) if playing fails
                        }
                        return;
                    }
                }
            } catch (e) {
                // ignore fallback play errors and continue to try spine APIs below
            }
            // No spine and no playable fallback animation — nothing to do
            return;
        }

        try {
            if (this._currentSpineAnim === name) return;

            // Try different API patterns for setting animations
            let success = false;
            
            // Method 1: Direct setAnimation
            if (!success && typeof this.spine.setAnimation === 'function') {
                try {
                    this.spine.setAnimation(0, name, loop);
                    success = true;
                } catch (e) {}
            }
            
            // Method 2: animationState.setAnimation
            if (!success && this.spine.animationState && typeof this.spine.animationState.setAnimation === 'function') {
                try {
                    this.spine.animationState.setAnimation(0, name, loop);
                    success = true;
                } catch (e) {}
            }
            
            // Method 3: state.setAnimation
            if (!success && this.spine.state && typeof this.spine.state.setAnimation === 'function') {
                try {
                    this.spine.state.setAnimation(0, name, loop);
                    success = true;
                } catch (e) {}
            }
            
            // Method 4: Try animationState.setAnimation (this works with your plugin)
            if (!success && this.spine.animationState && typeof this.spine.animationState.setAnimation === 'function') {
                try {
                    this.spine.animationState.setAnimation(0, name, loop);
                    success = true;
                } catch (e) {}
            }
            
            // Method 5: Try play method (some versions use this)
            if (!success && typeof this.spine.play === 'function') {
                try {
                    this.spine.play(name, loop);
                    success = true;
                } catch (e) {}
            }
            // If we still failed, try some common alternate animation names
            if (!success && name) {
                try {
                    const lower = String(name).toLowerCase();
                    // Try common alternate names but avoid selecting jump-attack
                    const alternates = [lower + '-attack', lower + 'attack', 'attack'];
                    for (const a of alternates) {
                        if (success) break;
                        try {
                            // Try the same API patterns for the alternate name
                            if (typeof this.spine.setAnimation === 'function') {
                                try { this.spine.setAnimation(0, a, loop); success = true; this._currentSpineAnim = a; break; } catch (e) {}
                            }
                            if (this.spine.animationState && typeof this.spine.animationState.setAnimation === 'function') {
                                try { this.spine.animationState.setAnimation(0, a, loop); success = true; this._currentSpineAnim = a; break; } catch (e) {}
                            }
                            if (this.spine.state && typeof this.spine.state.setAnimation === 'function') {
                                try { this.spine.state.setAnimation(0, a, loop); success = true; this._currentSpineAnim = a; break; } catch (e) {}
                            }
                            if (typeof this.spine.play === 'function') {
                                try { this.spine.play(a, loop); success = true; this._currentSpineAnim = a; break; } catch (e) {}
                            }
                        } catch (e) {}
                    }
                } catch (e) {}
            }

            if (success && !this._currentSpineAnim) this._currentSpineAnim = name;
            // Enforce base scale on Spine visuals as well so animation-specific
            // display changes don't cause the character to shrink.
            try {
                if (this.spine && typeof this.spine.setScale === 'function') {
                    // preserve horizontal flip sign
                    const sign = (this.sprite && this.sprite.flipX) ? -1 : 1;
                    try { this.spine.setScale(sign * baseScale, baseScale); } catch (e) { this.spine.setScale(baseScale); }
                } else if (this.spine) {
                    // best-effort for runtimes that expose scaleX/scaleY
                    try { this.spine.scaleX = (this.sprite && this.sprite.flipX) ? -Math.abs(this.spine.scaleX || baseScale) : Math.abs(this.spine.scaleX || baseScale); } catch (e) {}
                    try { this.spine.scaleY = Math.abs(this.spine.scaleY || baseScale); } catch (e) {}
                }
            } catch (e) {}
        } catch (e) {
            // ignore animation errors
        }
    }

    /**
     * Try to play the first available animation from a preference list.
     * This checks both Spine skeleton animations and Phaser fallback animations
     * before calling _setSpineAnimation so we avoid choosing a jump-attack
     * when a preferred 'attack1' exists.
     * @param {string[]} names - candidate animation names in order of preference
     * @param {boolean} loop
     * @returns {boolean} true if an animation was played
     */
    _playPreferredAnimation(names = [], loop = true) {
        try {
            if (!Array.isArray(names) || !names.length) return false;

            // Helper to gather spine animation names if available
            const getSpineNames = () => {
                try {
                    const spineObj = this.spine;
                    const sk = (spineObj && spineObj.spine && spineObj.spine.skeleton) || (spineObj && spineObj.skeleton) || null;
                    if (sk && sk.data && Array.isArray(sk.data.animations)) {
                        return sk.data.animations.map(a => a.name);
                    }
                } catch (e) {}
                return null;
            };

            const spineNames = getSpineNames();
            const fb = this._persistentFallbackSprite || this._persistentFallbackImage || null;

            // Build a helper that expands a candidate name into common variants
            const expand = (base) => {
                const list = new Set();
                try {
                    const raw = String(base || '');
                    list.add(raw);
                    const lower = raw.toLowerCase();
                    list.add(lower);
                    // common separators and numbering
                    list.add(raw + '1');
                    list.add(lower + '1');
                    list.add(raw + '_1');
                    list.add(raw + '-1');
                    list.add(lower + '_1');
                    list.add(lower + '-1');
                    // underscore/hyphen variants
                    list.add(raw.replace(/\s+/g, ''));
                    list.add(lower.replace(/\s+/g, ''));
                    list.add(raw.replace(/\s+/g, '_'));
                    list.add(raw.replace(/\s+/g, '-'));
                    // Capitalized form
                    list.add(raw.charAt(0).toUpperCase() + raw.slice(1));
                    // attack-variants common forms
                    if (lower.indexOf('attack') !== -1) {
                        list.add('attack1');
                        list.add('attack_1');
                        list.add('attack-1');
                    }
                } catch (e) {}
                return Array.from(list).filter(Boolean);
            };

            for (const n of names) {
                try {
                    const variants = expand(n);
                    // Check fallback animations (Phaser) for any variant
                    if (fb && this.scene && this.scene.anims) {
                        for (const v of variants) {
                            const lowerV = String(v).toLowerCase();
                            let candidate = null;
                            if (lowerV === 'idle') candidate = 'player-idle';
                            else if (lowerV === 'run') candidate = this.scene.anims.exists('player-run') ? 'player-run' : 'player-walk';
                            else if (lowerV.indexOf('attack') !== -1) {
                                // prefer exact 'player-attack' and do not fall back to jump-attack
                                candidate = this.scene.anims.exists('player-attack') ? 'player-attack' : null;
                            }
                            else {
                                const cand = 'player-' + lowerV.replace(/[^a-z0-9_-]/g, '');
                                candidate = this.scene.anims.exists(cand) ? cand : null;
                            }
                            if (candidate && this.scene.anims.exists(candidate)) {
                                this._setSpineAnimation(v, loop);
                                return v;
                            }
                        }
                    }

                    // Check spine animations list for any variant
                    if (spineNames && Array.isArray(spineNames)) {
                        for (const v of variants) {
                            try {
                                const lowerV = String(v).toLowerCase();
                                // skip any jump-related variants explicitly
                                if (lowerV.indexOf('jump') !== -1) continue;
                                if (spineNames.indexOf(v) !== -1 || spineNames.indexOf(lowerV) !== -1) {
                                    this._setSpineAnimation(v, loop);
                                    return v;
                                }
                            } catch (e) { /* ignore per-variant errors */ }
                        }
                    }
                } catch (e) {
                    // ignore per-candidate errors
                }
            }
        } catch (e) {
            // ignore
        }
        return false;
    }

    // Try to determine animation duration (ms) for either Spine or Phaser fallback
    _getAnimationDurationMs(animName, fallbackAnimKey = null) {
        try {
            // Spine: look up skeleton animation duration (seconds -> ms)
            const spineObj = this.spine;
            const sk = (spineObj && spineObj.spine && spineObj.spine.skeleton) || (spineObj && spineObj.skeleton) || null;
            if (sk && sk.data && Array.isArray(sk.data.animations) && animName) {
                for (const a of sk.data.animations) {
                    try {
                        if (!a || !a.name) continue;
                        const lower = String(a.name).toLowerCase();
                        if (lower === String(animName).toLowerCase() || a.name === animName) {
                            // animation.duration is in seconds in many runtimes
                            const durSec = (typeof a.duration === 'number') ? a.duration : (typeof a.end === 'number' && typeof a.start === 'number' ? (a.end - a.start) : null);
                            if (durSec && typeof durSec === 'number') return Math.max(120, Math.round(durSec * 1000));
                        }
                    } catch (e) {}
                }
            }

            // Phaser fallback: try to use the anim key (frames/frameRate)
            const fb = this._persistentFallbackSprite || this._persistentFallbackImage || null;
            const scene = this.scene;
            if (scene && scene.anims) {
                const key = fallbackAnimKey || ('player-' + String(animName).toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                try {
                    const anim = scene.anims.get(key);
                    if (anim && Array.isArray(anim.frames) && anim.frameRate) {
                        const frameCount = anim.frames.length || 1;
                        const fps = anim.frameRate || 12;
                        const durMs = Math.round((frameCount / fps) * 1000);
                        return Math.max(120, durMs);
                    }
                } catch (e) {}
            }
        } catch (e) {}
        return null;
    }

    attack(pointer) {
        const attackComponent = this.getComponent('attack');
        if (attackComponent && attackComponent.canAttack()) {
            const target = pointer ? { x: pointer.x, y: pointer.y } : null;
            attackComponent.attack(target);
            
            // Play attack animation when firing. Prefer to clear the attack
            // state when the animation finishes. Different Spine runtimes
            // expose different event APIs; attempt a few common patterns and
            // fall back to a timeout to ensure we always clear the attacking
            // state.
            // Prefer a dedicated 'attack' animation if present. Do not fall
            // back to 'jump-attack'. _playPreferredAnimation will call
            // _setSpineAnimation for the first available candidate.
            // Clear any previous attack timeout/listener
            try { if (this._attackTimeout) { clearTimeout(this._attackTimeout); this._attackTimeout = null; } } catch (e) {}

            const played = this._playPreferredAnimation(['attack'], false);
            if (!played) this._setSpineAnimation('attack', false);
            this._isAttacking = true;

            // Try to attach to Spine animation complete events where available
            try {
                const state = (this.spine && (this.spine.state || this.spine.animationState)) || null;
                if (state) {
                    // Common Spine API: state.addListener({ complete: fn })
                    if (typeof state.addListener === 'function') {
                        const listener = {
                            complete: () => {
                                try {
                                    if (typeof state.removeListener === 'function') state.removeListener(listener);
                                } catch (e) {}
                                try { this._isAttacking = false; } catch (e) {}
                                try { if (this._attackTimeout) { clearTimeout(this._attackTimeout); this._attackTimeout = null; } } catch (e) {}
                                try { this._setSpineAnimation('idle', true); } catch (e) {}
                            },
                        };
                        try { state.addListener(listener); } catch (e) {}
                    } else if (typeof state.on === 'function' && typeof state.off === 'function') {
                        // EventEmitter-style
                        const cb = () => {
                            try { state.off('complete', cb); } catch (e) {}
                            try { this._isAttacking = false; } catch (e) {}
                            try { if (this._attackTimeout) { clearTimeout(this._attackTimeout); this._attackTimeout = null; } } catch (e) {}
                            try { this._setSpineAnimation('idle', true); } catch (e) {}
                        };
                        try { state.on('complete', cb); } catch (e) {}
                    }
                }
            } catch (e) {
                // Ignore listener hookup failures and fall back to timeout below
            }

            // Safety fallback: set a timeout based on animation duration (if available)
            try {
                const animName = played || 'attack';
                // fallback key for Phaser animations
                const fallbackKey = 'player-' + String(animName).toLowerCase().replace(/[^a-z0-9_-]/g, '');
                let durMs = this._getAnimationDurationMs(animName, fallbackKey);
                // If we couldn't determine duration, use a conservative default
                if (!durMs) durMs = 900;
                // Add a small buffer to ensure completion
                const safeMs = Math.max(120, Math.round(durMs + 100));
                try { this._attackTimeout = setTimeout(() => { try { this._isAttacking = false; } catch (e) {} ; try { this._attackTimeout = null; } catch (e) {} }, safeMs); } catch (e) {}
            } catch (e) {
                // fallback strict timeout
                try { this._attackTimeout = setTimeout(() => { try { this._isAttacking = false; } catch (e) {} ; try { this._attackTimeout = null; } catch (e) {} }, 900); } catch (e) {}
            }
        }
            // Create a short-lived melee hitbox in front of the player to
            // damage nearby enemies while the attack animation plays. This
            // replaces the ranged dagger behavior temporarily.
            try {
                const movementComp = this.getComponent && this.getComponent('movement');
                const facing = movementComp && typeof movementComp.getFacing === 'function' ? movementComp.getFacing() : 'right';
                const offsetX = facing === 'right' ? 28 : -28;
                const hbWidth = 40;
                const hbHeight = 28;

                const hx = (this.sprite && typeof this.sprite.x === 'number') ? this.sprite.x + offsetX : (this.x + offsetX || offsetX);
                const hy = (this.sprite && typeof this.sprite.y === 'number') ? this.sprite.y - ((this.sprite.displayHeight || 32) / 2) : (this.y || 0);

                // Create a physics-enabled zone as the hitbox
                const zone = this.scene.add.zone(hx, hy, hbWidth, hbHeight);
                try { if (zone.setOrigin) zone.setOrigin(0.5, 0.5); } catch (e) {}
                try { this.scene.physics.world.enable(zone); } catch (e) {}
                try { if (zone.body) { zone.body.setAllowGravity && zone.body.setAllowGravity(false); zone.body.setImmovable && zone.body.setImmovable(true); } } catch (e) {}

                // Track enemies we've already damaged this attack so we don't
                // damage the same enemy multiple times during the short window.
                zone._noteleks_damaged = new Set();

                const enemyGroup = this.scene && this.scene.enemyManager && this.scene.enemyManager.enemies ? this.scene.enemyManager.enemies : null;
                if (enemyGroup) {
                    const hitCallback = (z, enemySprite) => {
                        try {
                            if (!enemySprite || !enemySprite.enemyRef) return;
                            // Use the sprite reference as a unique key
                            if (z._noteleks_damaged.has(enemySprite)) return;
                            z._noteleks_damaged.add(enemySprite);

                            const enemy = enemySprite.enemyRef;
                            const dmg = (attackComponent && typeof attackComponent.getDamage === 'function') ? attackComponent.getDamage() : 1;
                            const score = enemy.takeDamage(dmg);
                            // Award score immediately if enemy died
                            try { if (score && typeof this.scene.addScore === 'function') this.scene.addScore(score); } catch (e) {}
                            // Optional: create a small hit effect at enemy position
                            try {
                                const fx = this.scene.add.graphics();
                                fx.fillStyle(0xffcc00, 1);
                                fx.fillCircle(enemySprite.x, enemySprite.y - 8, 6);
                                this.scene.tweens.add({ targets: fx, alpha: 0, duration: 220, onComplete: () => { try { fx.destroy(); } catch (e) {} } });
                            } catch (e) {}
                        } catch (e) {
                            // swallow per-hit errors
                        }
                    };

                    // Add overlap collider and keep a handle for cleanup
                    let overlapCollider = null;
                    try {
                        overlapCollider = this.scene.physics.add.overlap(zone, enemyGroup, hitCallback, null, this.scene);
                    } catch (e) {
                        // Some builds return the collider, others don't — ignore
                    }

                    // Clean up the hitbox shortly after the attack begins
                    setTimeout(() => {
                        try {
                            if (overlapCollider && this.scene && this.scene.physics && this.scene.physics.world && typeof this.scene.physics.world.removeCollider === 'function') {
                                try { this.scene.physics.world.removeCollider(overlapCollider); } catch (e) {}
                            }
                        } catch (e) {}
                        try { if (zone && typeof zone.destroy === 'function') zone.destroy(); } catch (e) {}
                    }, 220);
                } else {
                    // No enemy group available — destroy the zone immediately
                    try { if (zone && typeof zone.destroy === 'function') zone.destroy(); } catch (e) {}
                }
            } catch (e) {
                // swallow hitbox setup errors so attacks still play animations
            }
    }

    takeDamage(amount) {
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            return healthComponent.takeDamage(amount);
        }
        return { died: false, currentHealth: 0 };
    }

    heal(amount) {
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            healthComponent.heal(amount);
        }
    }

    getHealth() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.getHealth() : 0;
    }

    getMaxHealth() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.getMaxHealth() : 0;
    }

    isAlive() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.isAlive() : false;
    }

    reset(x, y) {
        // Reset position
        this.setPosition(x, y);

        // Reset health properly using the reset method instead of heal
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            healthComponent.reset(); // This resets isDead to false and restores full health
        }

        // Reset movement
        const movementComponent = this.getComponent('movement');
        if (movementComponent) {
            movementComponent.stopHorizontal();
        }

        // Reset sprite
        if (this.sprite) {
            this.sprite.setPosition(x, y);
            this.sprite.setVelocity(0, 0);
        }
    }
}

export default Player;
