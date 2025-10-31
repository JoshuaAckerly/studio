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
        this.createPlayer();
        this.setupComponents();
    }

    createPlayer() {
        // Create player sprite with physics (physics sprite used for collisions)
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'skeleton');
        // Store reference to this player class in the sprite
        this.sprite.playerRef = this;

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
                    const baseScale = (GameConfig && GameConfig.player && typeof GameConfig.player.scale === 'number') ? GameConfig.player.scale : 1;
                    if (typeof this.spine.setScale === 'function') this.spine.setScale(baseScale);
                } catch (e) {
                    // ignore scale application errors
                }
                    if (typeof this.spine.setOrigin === 'function') this.spine.setOrigin(0.5, 1);
                // Keep the player visual behind UI elements (UI uses ~1000). Use a
                // moderate depth so game objects render above the player but UI stays on top.
                if (this.spine.setDepth) this.spine.setDepth(500);

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

                        console.info('[Player] DOM debug marker created and following player on-screen position');

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
                                            if (this._spineFallbackImage.setDepth) this._spineFallbackImage.setDepth(500);
                                            // Hide the problematic spine display so it doesn't occlude
                                            try { if (this.spine && typeof this.spine.setVisible === 'function') this.spine.setVisible(false); } catch (e) {}
                                                try { this._hideSpineLoading(); } catch (e) {}
                                                console.info('[Player] Canvas fallback image created and placed at player position');
                                        } catch (e) {
                                            console.warn('[Player] Failed to draw canvas fallback to texture:', e && e.message);
                                        }
                                    } else {
                                        console.info('[Player] No canvas fallback available in cache.custom to draw');
                                    }
                                } else {
                                    console.info('[Player] Spine rendering appears healthy (visible=', spineVisible, 'alpha=', spineAlpha, 'hasSkeleton=', hasSkeleton, 'pluginTexPresent=', pluginTexPresent, ')');
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
                                        // If we've already created a persistent fallback, reuse it and update position.
                                        if (this._persistentFallbackImage && this._persistentFallbackImage.setPosition) {
                                            try {
                                                this._persistentFallbackImage.setPosition(this.sprite.x, this.sprite.y);
                                                console.info('[Player] Reused existing persistent Phaser image fallback');
                                            } catch (e) {
                                                // ignore
                                            }
                                        } else {
                                            // Create a persistent fallback image using the duplicated texture key prepared by AssetManager
                                            const fb = this.scene.add.image(this.sprite.x, this.sprite.y, 'noteleks-texture').setOrigin(0.5, 1);
                                            if (fb && fb.setDepth) fb.setDepth(501);
                                            // Store the persistent fallback so it remains visible while we continue diagnosis
                                            this._persistentFallbackImage = fb;
                                            // Hide the problematic spine display so it doesn't occlude
                                            try { if (this.spine && typeof this.spine.setVisible === 'function') this.spine.setVisible(false); } catch (e) {}
                                                try { this._hideSpineLoading(); } catch (e) {}
                                                console.info('[Player] Spine visual appears blank — created persistent Phaser image fallback for visibility');
                                        }
                                    } else {
                                        console.info('[Player] Spine visual appears blank but fallback texture not present');
                                    }
                                } catch (fbErr) {
                                    console.warn('[Player] Failed to create fallback image:', fbErr && fbErr.message);
                                }
                            } else {
                                console.info('[Player] Spine visual appears to be rendering (probe passed)');
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

            const checkReadiness = () => {
                try {
                    const sys = this.scene && this.scene.sys ? this.scene.sys : null;
                    const plugin = sys && sys.spine ? sys.spine : null;

                    // If plugin instance exists, prefer checking its internal caches
                    if (plugin) {
                        const atlasReady = typeof plugin.atlasCache?.exists === 'function' ? plugin.atlasCache.exists(atlasKey) : false;
                        const skeletonReady = typeof plugin.skeletonDataCache?.exists === 'function' ? plugin.skeletonDataCache.exists(dataKey + atlasKey) : false;
                        console.info('[Player] plugin instance present. atlasReady=', atlasReady, 'skeletonReady=', skeletonReady);
                        if (atlasReady && skeletonReady) {
                            try { this._hideSpineLoading(); } catch (e) {}
                            return true;
                        }
                    }

                    // Fallback: check Phaser caches that plugin will read when creating
                    const jsonOk = this.scene.cache && this.scene.cache.json && typeof this.scene.cache.json.exists === 'function' ? this.scene.cache.json.exists(dataKey) : false;
                    const textOk = this.scene.cache && this.scene.cache.text && typeof this.scene.cache.text.exists === 'function' ? this.scene.cache.text.exists(atlasKey) : false;
                    const pageTex = this.scene.textures && typeof this.scene.textures.exists === 'function' ? this.scene.textures.exists(atlasKey + '!' + pageName) : false;
                    console.info('[Player] phaser cache readiness: json=', jsonOk, 'text=', textOk, 'pageTex=', pageTex);
                    // Accept either (text + json + pageTex) or (json + pageTex) as readiness.
                    // Some runtime builds populate JSON and page textures but not the
                    // text cache key the loader would normally add; accept that
                    // combination to be more tolerant to loader/plugin ordering.
                    const binaryOk = this.scene.cache && this.scene.cache.binary && this.scene.cache.binary.exists && this.scene.cache.binary.exists(dataKey);
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
                        console.info('[Player] scene.add.spine not yet available');
                        return false;
                    }

                    // Wait until either plugin caches or phaser caches are prepared
                    if (!checkReadiness()) {
                        console.info('[Player] Spine assets/plugins not ready yet, will retry');
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
                        console.info('[Player] spine create diagnostics:', { jsonEntry: !!jsonEntry, textEntry: !!textEntry, pageTexExists, pluginAtlasKeys, pluginSkelKeys });
                    } catch (diagErr) {
                        console.warn('[Player] spine diagnostics failed:', diagErr && diagErr.message);
                    }

                    // Attempt to add the spine object using the key used by AssetManager ('noteleks-data').
                    // scene.add.spine signature: (x, y, dataKey, atlasKey, boundsProvider?)
                    const created = this.scene.add.spine(this.x, this.y, dataKey, atlasKey);
                    this.spine = created || this.spine;
                    console.info('[Player] Spine display create attempt, success=', !!this.spine);
                    if (this.spine) {
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

        // First immediate attempt (fast-path)
        this._tryCreateSpine();

            // If the spine was created synchronously, run diagnostics and tune it.
            if (this.spine) {
            try {
                // Diagnostics: report which animation APIs are present
                console.info('[Player] Spine object APIs:', {
                    setAnimation: typeof this.spine.setAnimation,
                    animationState: !!this.spine.animationState,
                    animationStateSetAnimation: this.spine.animationState ? typeof this.spine.animationState.setAnimation : 'n/a',
                    state: !!this.spine.state,
                    stateSetAnimation: this.spine.state ? typeof this.spine.state.setAnimation : 'n/a',
                });
                // Force an initial animation robustly (try multiple possible API shapes)
                try {
                    if (typeof this.spine.setAnimation === 'function') {
                        this.spine.setAnimation(0, 'idle', true);
                        console.info('[Player] Called spine.setAnimation(0, "idle", true)');
                    } else if (this.spine.animationState && typeof this.spine.animationState.setAnimation === 'function') {
                        this.spine.animationState.setAnimation(0, 'idle', true);
                        console.info('[Player] Called spine.animationState.setAnimation(0, "idle", true)');
                    } else if (this.spine.state && typeof this.spine.state.setAnimation === 'function') {
                        this.spine.state.setAnimation(0, 'idle', true);
                        console.info('[Player] Called spine.state.setAnimation(0, "idle", true)');
                    } else {
                        console.warn('[Player] No animation API found on spine object');
                    }
                } catch (err) {
                    console.warn('[Player] setAnimation threw:', err && err.message);
                }

                // Print available animation names from the skeleton (if accessible)
                try {
                    const skel = this.spine && this.spine.spine && this.spine.spine.skeleton || (this.spine && this.spine.skeleton) || null;
                    if (skel && skel.data && skel.data.animations) {
                        const names = skel.data.animations.map(a => a.name);
                        console.info('[Player] Spine skeleton animations:', names);
                    } else if ((this.spine && this.spine.animationState && this.spine.animationState.tracks) || (this.spine && this.spine.state && this.spine.state.tracks)) {
                        console.info('[Player] Spine state/tracks present (could be runtime plugin variation)');
                    } else {
                        console.info('[Player] No skeleton animation data visible on display');
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
                const baseScale = (GameConfig && GameConfig.player && typeof GameConfig.player.scale === 'number') ? GameConfig.player.scale : 1;
                if (typeof this.spine.setScale === 'function') this.spine.setScale(baseScale);
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

        // If spine still wasn't ready yet, listen for the spine-ready event and try again once
        // Also listen for spine-ready and re-attempt creation if the event fires
        if (!this.spine && this.scene && this.scene.events && typeof this.scene.events.once === 'function') {
            this.scene.events.once('spine-ready', () => {
                // Give plugin a short moment and then start the retry attempts
                setTimeout(() => this._tryCreateSpine(10, 100), 50);
            });
        }

        // Final fallback: if no spine created, but AssetManager prepared a canvas fallback,
        // create a Phaser Image from it so the player is visible.
        if (!this.spine) {
            try {
                const cached = this.scene && this.scene.cache && this.scene.cache.custom ? this.scene.cache.custom : null;
                const fallback = cached && cached['spine-canvas-fallback'];
                if (fallback) {
                    // Use the preloaded noteleks texture as a safe static fallback (no Spine runtime calls)
                    this.spine = this.scene.add.image(this.x, this.y, 'noteleks-texture').setOrigin(0.5, 1);
                    if (this.spine && this.spine.setDepth) this.spine.setDepth(500);
                    try { this._hideSpineLoading(); } catch (e) {}
                    // Finalize visual and schedule hiding the physics sprite in a safe next-tick
                    try { if (typeof finalizeSpineVisual === 'function') finalizeSpineVisual(); } catch (e) { /* ignore */ }
                    console.info('[Player] Spine canvas fallback image created as final fallback');
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

        // Expose a debug handle for easier inspection from the browser console
        try {
            if (typeof window !== 'undefined') {
                window.noteleksPlayer = this;
                console.info('[Player] Debug handle available: window.noteleksPlayer');
                console.info('[Player] You can inspect and manually call: window.noteleksPlayer.spine && window.noteleksPlayer.spine.setAnimation(0, "idle", true)');
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
                        console.info('[Player] Debug overlay: no skeleton animation data found, stopping poll');
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
                                console.info('[Player] Debug: triggered animation', n);
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
                    console.info('[Player] Debug overlay built with animations:', names);
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
            // Handle attack logic
            if (this.scene.weaponManager) {
                const direction = facing || this.getComponent('movement').getFacing();
                this.scene.weaponManager.createWeapon(this.sprite.x, this.sprite.y, direction, target);
            }
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
        if (!this.spine) return;
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
                    const base = (GameConfig && GameConfig.player && typeof GameConfig.player.scale === 'number') ? GameConfig.player.scale : 1;
                    this.spine.scaleX = -Math.abs(base);
                } catch (e) {
                    this.spine.scaleX = -1;
                }
            } else {
                try {
                    const base = (GameConfig && GameConfig.player && typeof GameConfig.player.scale === 'number') ? GameConfig.player.scale : 1;
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
                    console.info('[Player] Manual spine animation advancement is enabled');
                    this._spineManualAdvanceLogged = true;
                }
                if (animState && typeof animState.update === 'function' && this.scene && this.scene.game && this.scene.game.loop) {
                    const dt = (this.scene.game.loop.delta || 16) / 1000;
                    animState.update(dt);
                    animState.apply(this.spine.skeleton);
                    if (typeof this.spine.skeleton.updateWorldTransform === 'function') this.spine.skeleton.updateWorldTransform();
                }
            } catch (e) {
                // Ignore manual update errors
            }
        } catch (e) {
            // ignore sync errors
        }
    }

    processInputState(inputState, inputComponent, movementComponent) {
        // Process movement input
        inputComponent.processInput(inputState);

        // Apply movement based on input state directly
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

        if (inputState.up && movementComponent.isOnGround()) {
            movementComponent.jump();
            this._setSpineAnimation('jump', false);
        }

        // Process attack input for mobile
        if (inputState.attack) {
            this.attack();
            this._setSpineAnimation('attack', false);
        }
    }

    _setSpineAnimation(name, loop = true) {
        if (!this.spine) return;

        try {
            if (this._currentSpineAnim === name) return;
            if (typeof this.spine.setAnimation === 'function') {
                this.spine.setAnimation(0, name, loop);
            } else if (this.spine.animationState && typeof this.spine.animationState.setAnimation === 'function') {
                this.spine.animationState.setAnimation(0, name, loop);
            } else if (this.spine.state && typeof this.spine.state.setAnimation === 'function') {
                this.spine.state.setAnimation(0, name, loop);
            }
            this._currentSpineAnim = name;
        } catch (e) {
            // ignore animation errors
        }
    }

    attack(pointer) {
        const attackComponent = this.getComponent('attack');
        if (attackComponent && attackComponent.canAttack()) {
            const target = pointer ? { x: pointer.x, y: pointer.y } : null;
            attackComponent.attack(target);
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
