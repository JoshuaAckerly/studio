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

        try {
            if (this.scene.add && typeof this.scene.add.spine === 'function') {
                // Attempt to add the spine object using the key used by AssetManager ('noteleks-data')
                // If the skeleton isn't loaded yet this may throw — catch and fallback silently.
                this.spine = this.scene.add.spine(this.x, this.y, 'noteleks-data', 'idle', true);
                console.info('[Player] Spine display created via scene.add.spine', { spine: !!this.spine });
                try {
                    // Diagnostics: report which animation APIs are present
                    console.info('[Player] Spine object APIs:', {
                        setAnimation: typeof this.spine.setAnimation,
                        state: !!this.spine.state,
                        stateSetAnimation: this.spine.state ? typeof this.spine.state.setAnimation : 'n/a',
                    });
                    // Force an initial animation robustly
                    try {
                        if (typeof this.spine.setAnimation === 'function') {
                            this.spine.setAnimation(0, 'idle', true);
                            console.info('[Player] Called spine.setAnimation(0, "idle", true)');
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
                        } else if (this.spine && this.spine.state && this.spine.state.tracks) {
                            console.info('[Player] Spine state tracks present (could be runtime plugin variation)');
                        } else {
                            console.info('[Player] No skeleton animation data visible on display');
                        }
                    } catch (e) {
                        console.warn('[Player] Failed to read skeleton animations:', e && e.message);
                    }
                } catch (e) {
                    console.warn('[Player] Error while forcing initial spine animation:', e);
                }
                // Slight tuning for origin/scale so it sits on the physics body
                if (typeof this.spine.setOrigin === 'function') {
                    this.spine.setOrigin(0.5, 1);
                }
                // Ensure the spine is above the physics sprite visually
                if (this.spine.setDepth) this.spine.setDepth(10);
            }
        } catch (e) {
            // Silent fallback: leave this.spine as null
            this.spine = null;
            console.info('[Player] Spine display not created, falling back to sprite visual');
        }

        // If the spine data was prepared before this Player was constructed, try to create from cache now.
        try {
            const cached = this.scene && this.scene.cache && this.scene.cache.custom ? this.scene.cache.custom : null;
            if (!this.spine && cached && (cached['spine-skeleton-data'] || cached['spine-atlas'])) {
                if (this.scene.add && typeof this.scene.add.spine === 'function') {
                    try {
                        this.spine = this.scene.add.spine(this.x, this.y, 'noteleks-data', 'idle', true);
                        if (this.spine && typeof this.spine.setOrigin === 'function') this.spine.setOrigin(0.5, 1);
                        if (this.spine && this.spine.setDepth) this.spine.setDepth(10);
                        console.info('[Player] Spine display created from cache during construction', { spine: !!this.spine });
                    } catch (err) {
                        console.warn('[Player] Failed to create spine display from cache during construction:', err);
                    }
                }
            }
        } catch (e) {
            // ignore
        }

        // If spine still wasn't ready yet, listen for the spine-ready event and try again once
        if (!this.spine && this.scene && this.scene.events && typeof this.scene.events.once === 'function') {
            this.scene.events.once('spine-ready', () => {
                try {
                    if (this.scene.add && typeof this.scene.add.spine === 'function') {
                        this.spine = this.scene.add.spine(this.x, this.y, 'noteleks-data', 'idle', true);
                        if (this.spine && typeof this.spine.setOrigin === 'function') this.spine.setOrigin(0.5, 1);
                        if (this.spine && this.spine.setDepth) this.spine.setDepth(10);
                        console.info('[Player] Spine display created on spine-ready event', { spine: !!this.spine });
                    }
                } catch (e) {
                    console.warn('[Player] Failed to create spine display on spine-ready:', e);
                }
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
                    if (this.spine && this.spine.setDepth) this.spine.setDepth(10);
                    console.info('[Player] Spine canvas fallback image created as final fallback');
                }
            } catch (e) {
                // ignore
            }
        }

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
                                else if (this.spine && this.spine.state && typeof this.spine.state.setAnimation === 'function') {
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

            // Kick off polling for animation names (overlay will appear automatically)
            if (typeof window !== 'undefined') {
                // Start soon but allow the scene to finish loading
                setTimeout(() => this._startDebugOverlayPolling(), 300);
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
                if (this.spine.scaleX && this.spine.scaleX > 0) this.spine.scaleX = -Math.abs(this.spine.scaleX || 1);
                else this.spine.scaleX = -1;
            } else {
                if (this.spine.scaleX && this.spine.scaleX < 0) this.spine.scaleX = Math.abs(this.spine.scaleX || 1);
                else this.spine.scaleX = 1;
            }
            // Manual spine AnimationState advance (guarded). Some plugin builds
            // may not auto-update the AnimationState in our environment; this
            // ensures animation time progresses.
            try {
                if (!this._spineManualAdvanceLogged && this.spine.state && typeof this.spine.state.update === 'function') {
                    console.info('[Player] Manual spine animation advancement is enabled');
                    this._spineManualAdvanceLogged = true;
                }
                if (this.spine.state && typeof this.spine.state.update === 'function' && this.scene && this.scene.game && this.scene.game.loop) {
                    const dt = (this.scene.game.loop.delta || 16) / 1000;
                    this.spine.state.update(dt);
                    this.spine.state.apply(this.spine.skeleton);
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
