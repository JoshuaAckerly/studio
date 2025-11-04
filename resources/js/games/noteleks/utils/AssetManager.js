/**
 * Asset Management Utilities
 */
// Honor runtime configuration for Spine usage
import GameConfig from '../config/GameConfig.js';
export class AssetManager {
    static createPlaceholderTextures(scene, config) {
        const textures = config.assets.textures;

        Object.entries(textures).forEach(([key, textureConfig]) => {
            if (textureConfig.color !== undefined) {
                // Check if texture already exists
                if (scene.textures.exists(key)) {
                    return;
                }

                // Create graphics object
                const graphics = scene.add.graphics();
                graphics.fillStyle(textureConfig.color);
                graphics.fillRect(0, 0, textureConfig.width, textureConfig.height);

                // Generate texture and destroy graphics object
                graphics.generateTexture(key, textureConfig.width, textureConfig.height);
                graphics.destroy();
            }
        });
    }

    static loadPlayerSpriteSheets(scene, config) {
        const basePath = '/games/noteleks/sprites/';
        
            try {
            console.warn('[AssetManager] loadPlayerSpriteSheets called');
        } catch (e) {}

        // Prefer to consult a build-time manifest which lists exact per-frame
        // image filenames to avoid probing missing candidate names at runtime.
        // If a manifest exists at `/games/noteleks/sprites/manifest.json` we
        // enqueue only the files it declares and skip legacy spritesheet
        // candidates that the manifest explicitly disables (image/json both null).
        try {
            const manifestCacheKey = 'noteleks-sprites-manifest';
            const manifestUrl = '/games/noteleks/sprites/manifest.json';
            let manifestProcessed = false;

            const deriveAnimKeyFromBase = (baseUrl) => {
                try {
                    const seg = String(baseUrl).replace(/\/$/, '').split('/').pop();
                    const name = seg.replace(/_$/,'');
                    return String(name).replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
                } catch (e) { return null; }
            };

            const processManifest = (mf) => {
                try {
                    if (!mf) return;
                    manifestProcessed = true;
                    const seqs = mf.frameSequences || {};
                    const sheets = mf.sheets || {};

                    // Enqueue exact per-frame files declared in the manifest.
                    for (const baseUrlRaw of Object.keys(seqs || {})) {
                        try {
                            const files = Array.isArray(seqs[baseUrlRaw]) ? seqs[baseUrlRaw] : [];
                            const animKey = deriveAnimKeyFromBase(baseUrlRaw) || 'skeleton-unknown';
                            const frameKeys = [];
                            // Compute a safe full URL for each filename. Manifests may
                            // include a base-like key (e.g. "/games/.../Skeleton-Walk_")
                            // while also listing filenames that already include the
                            // prefix ("Skeleton-Walk_05.webp"). To avoid accidental
                            // duplication (".../Skeleton-Walk_Skeleton-Walk_05.webp")
                            // prefer joining the manifest's directory with the listed
                            // filename when the filename already contains the prefix.
                            const baseDir = String(baseUrlRaw).replace(/[^\/]*$/, '');
                            for (let i = 0; i < files.length; i++) {
                                const fname = files[i];
                                const key = `${animKey}-${i}`;
                                frameKeys.push(key);
                                try {
                                    let fullUrl = '';
                                    if (typeof fname === 'string' && fname.startsWith('/')) {
                                        fullUrl = fname; // absolute path already
                                    } else if (typeof fname === 'string' && String(fname).indexOf(String(baseDir).split('/').pop()) === 0) {
                                        // filename already begins with a base fragment; join with directory
                                        fullUrl = baseDir + fname;
                                    } else {
                                        fullUrl = baseUrlRaw + fname;
                                    }
                                    scene.load.image(key, fullUrl);
                                } catch (e) {}
                            }

                            // Create animation on loader complete
                            try {
                                scene.load.once('complete', () => {
                                    try {
                                        if (!scene.anims.exists(animKey)) {
                                            const frames = frameKeys.map(k => ({ key: k }));
                                            scene.anims.create({ key: animKey, frames, frameRate: 12, repeat: -1 });
                                            console.info('[AssetManager] Created animation from manifest frames', animKey, 'frames=', frames.length);
                                        }
                                    } catch (e) {}
                                });
                            } catch (e) {}
                        } catch (e) { /* ignore per-sequence failures */ }
                    }

                    // Legacy spritesheet candidates — by default skip these legacy
                    // `_512` PNG/JSON spritesheets because we prefer the per-frame
                    // WebP sequences. Set `skipLegacyCandidates` to `false` if you
                    // intentionally want to allow them.
                    try {
                        const skipLegacyCandidates = true; // set to false to allow legacy 512px spritesheets
                        if (skipLegacyCandidates) {
                            console.info('[AssetManager] Skipping legacy 512px spritesheet candidates by configuration');
                        } else {
                        const spritesBase = '/games/noteleks/sprites/';
                        const candidates = [
                            { texKey: 'skeleton-idle', png: spritesBase + 'skeleton_idle_512.png', json: spritesBase + 'skeleton_idle_512.json', frameWidth: 512, frameHeight: 512 },
                            { texKey: 'skeleton-walk', png: spritesBase + 'skeleton_walk_512.png', json: spritesBase + 'skeleton_walk_512.json', frameWidth: 512, frameHeight: 512 },
                            { texKey: 'skeleton-run', png: spritesBase + 'skeleton_run_512.png', json: spritesBase + 'skeleton_run_512.json', frameWidth: 512, frameHeight: 512 },
                            { texKey: 'skeleton-jumpattack', png: spritesBase + 'skeleton_jumpattack_512.png', json: spritesBase + 'skeleton_jumpattack_512.json', frameWidth: 512, frameHeight: 512 }
                        ];

                        for (const c of candidates) {
                            try {
                                const sheetInfo = (sheets && sheets[c.texKey]) ? sheets[c.texKey] : null;
                                const explicitlyDisabled = sheetInfo && (sheetInfo.image === null && sheetInfo.json === null);
                                if (explicitlyDisabled) {
                                    console.info('[AssetManager] Skipping legacy sheet for', c.texKey, 'because manifest disables it');
                                    continue;
                                }

                                // Queue image + sidecar JSON for the spritesheet candidate.
                                try { scene.load.image(c.texKey, c.png); } catch (e) {}
                                try { scene.load.json(c.texKey + '-sidecar', c.json); } catch (e) {}
                                console.warn('[AssetManager] Queued legacy spritesheet candidate (manifest allowed):', c.texKey, c.png, c.json);
                            } catch (e) { /* ignore per-candidate */ }
                        }
                        }
                    } catch (e) { /* ignore candidate block failures */ }
                } catch (e) { /* ignore manifest processing errors */ }
            };

            // If the manifest is already available in the JSON cache, process it
            let mf = null;
            try { mf = (scene.cache && scene.cache.json && typeof scene.cache.json.get === 'function') ? scene.cache.json.get(manifestCacheKey) : null; } catch (e) { mf = null; }
            if (mf) {
                processManifest(mf);
            } else {
                // Queue the manifest for preload and process when loaded.
                try { scene.load.json(manifestCacheKey, manifestUrl); } catch (e) {}
                try {
                    scene.load.once('filecomplete-json-' + manifestCacheKey, () => {
                        try { const m = (scene.cache && scene.cache.json && typeof scene.cache.json.get === 'function') ? scene.cache.json.get(manifestCacheKey) : null; processManifest(m); } catch (e) {}
                    });
                } catch (e) {}

                // If the manifest never arrives (missing file), fall back to a
                // conservative default after a short delay so the preload doesn't
                // stall forever. This fallback merely queues the minimal known
                // frame sequences (legacy spine/characters path) if manifest is absent.
                setTimeout(() => {
                    try {
                        if (!manifestProcessed) {
                            console.warn('[AssetManager] Manifest not processed in time; falling back to legacy per-frame probes (this may cause 404s)');
                            try { AssetManager.loadFrameSequence(scene, 'skeleton-idle', '/games/noteleks/spine/characters/Skeleton-Idle_', 9, 12, -1); } catch (e) {}
                            try { AssetManager.loadFrameSequence(scene, 'skeleton-run', '/games/noteleks/spine/characters/Skeleton-Run_', 9, 12, -1); } catch (e) {}
                            try { AssetManager.loadFrameSequence(scene, 'skeleton-walk', '/games/noteleks/spine/characters/Skeleton-Walk_', 9, 12, -1); } catch (e) {}
                            try { AssetManager.loadFrameSequence(scene, 'skeleton-jumpattack', '/games/noteleks/spine/characters/Skeleton-JumpAttack_', 8, 12, 0); } catch (e) {}
                        }
                    } catch (e) {}
                }, 800);
            }
        } catch (e) {
            console.warn('[AssetManager] Failed to queue spine character frame sequences (manifest path):', e && e.message);
        }

        try {
            // The legacy per-animation spritesheet files in /sprites/ are
            // placeholders in this repo (they contain no image data). To
            // avoid loader errors during development, prefer our generated
            // packed spritesheet produced from the Spine frames. Load that
            // once and create both a 'skeleton-idle' animation and a
            // convenience alias 'player-idle' so the rest of the codebase
            // can use the expected animation key.

            // If we've generated a packed spritesheet for the Spine idle frames,
            // load it (produced by tools/make_spritesheet.js). These frames are
            // large by default; you may want to repack with a target size for
            // production. For now we load it with the detected frame size.
                try {
                // Prefer an atlas (.json) sidecar when present. If not present,
                // fall back to loading the PNG as a uniform spritesheet.
                const spritesBase = '/games/noteleks/sprites/';
                const candidates = [
                    { texKey: 'skeleton-idle', png: spritesBase + 'skeleton_idle_512.png', json: spritesBase + 'skeleton_idle_512.json', frameWidth: 512, frameHeight: 512 },
                    { texKey: 'skeleton-walk', png: spritesBase + 'skeleton_walk_512.png', json: spritesBase + 'skeleton_walk_512.json', frameWidth: 512, frameHeight: 512 },
                    { texKey: 'skeleton-run', png: spritesBase + 'skeleton_run_512.png', json: spritesBase + 'skeleton_run_512.json', frameWidth: 512, frameHeight: 512 },
                    { texKey: 'skeleton-jumpattack', png: spritesBase + 'skeleton_jumpattack_512.png', json: spritesBase + 'skeleton_jumpattack_512.json', frameWidth: 512, frameHeight: 512 }
                ];

                // Ensure we register the loader-complete handler once (so animations
                // are created after whichever files we queued finish).
                if (!AssetManager._hasRegisteredPlayerSpritesheetComplete) {
                    AssetManager._hasRegisteredPlayerSpritesheetComplete = true;
                    scene.load.once('complete', () => {
                        try {
                            console.warn('[AssetManager] loader.complete fired for player spritesheets; texture existence:', {
                                'skeleton-idle': !!(scene.textures && scene.textures.exists && scene.textures.exists('skeleton-idle')),
                                'skeleton-walk': !!(scene.textures && scene.textures.exists && scene.textures.exists('skeleton-walk')),
                                'skeleton-run': !!(scene.textures && scene.textures.exists && scene.textures.exists('skeleton-run')),
                                'skeleton-jumpattack': !!(scene.textures && scene.textures.exists && scene.textures.exists('skeleton-jumpattack'))
                            });
                        } catch (e) { /* ignore */ }
                    });
                }

                const tryLoadAtlasOrSpritesheet = (c) => {
                    try {
                        // Helper: when we queue assets asynchronously (via fetch.then)
                        // the Scene's automatic preload may already have finished.
                        // If that happens we must explicitly start the loader so the
                        // newly queued files are actually fetched. This is a
                        // best-effort, non-invasive call that avoids having async
                        // probes silently enqueue assets that are never loaded.
                        const startLoaderIfIdle = () => {
                            try {
                                if (scene && scene.load && !scene.load.isLoading) {
                                    try { scene.load.start(); } catch (e) {}
                                    try { console.warn('[AssetManager] Started loader for async queued assets'); } catch (e) {}
                                }
                            } catch (e) { /* ignore */ }
                        };
                        // Prefer a converted Phaser-style atlas if it exists: our
                        // converter writes a sibling file with the suffix `.phaser.json`.
                        const phaserJson = String(c.json).replace(/\.json$/i, '.phaser.json');
                        // Deterministic loading: avoid async HEAD probes which can
                        // enqueue loads after preload finishes and cause races.
                        // Instead, prefer the converted `.phaser.json` sibling and
                        // queue it directly; let Phaser's loader handle existence
                        // (404) at load time. If queuing the atlas synchronously
                        // fails, fall back to trying the original JSON, then the
                        // numeric spritesheet fallback.
                        try {
                            try {
                                scene.load.atlas(c.texKey, c.png, phaserJson);
                                startLoaderIfIdle();
                                console.warn('[AssetManager] Queued atlas (phaser-json) for', c.texKey, '->', phaserJson);
                            } catch (e) {
                                // Try original JSON sidecar
                                try {
                                    scene.load.atlas(c.texKey, c.png, c.json);
                                    startLoaderIfIdle();
                                    console.warn('[AssetManager] Queued atlas for', c.texKey, '->', c.json);
                                } catch (e2) {
                                    // Fallback to numeric spritesheet
                                    try {
                                        scene.load.spritesheet(c.texKey, c.png, { frameWidth: c.frameWidth, frameHeight: c.frameHeight });
                                        startLoaderIfIdle();
                                        console.warn('[AssetManager] Queued spritesheet load for', c.texKey, '->', c.png);
                                    } catch (e3) {
                                        console.warn('[AssetManager] Failed to queue spritesheet for', c.texKey, e3 && e3.message);
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn('[AssetManager] Failed to queue load for', c.texKey, e && e.message);
                        }
                    } catch (e) {
                        // swallow per-candidate errors
                    }
                };

                // Queue each candidate deterministically: load the PNG image and
                // its packer sidecar JSON into Phaser's cache. Later, on
                // loader.complete we will synthesize per-frame textures from
                // the sidecar. This avoids async HEAD probes and keeps all
                // assets inside the same Scene preload run.
                for (const c of candidates) {
                    try {
                        // Load the full image under the texKey so subsequent
                        // code can reference scene.textures.get(texKey).
                        try { scene.load.image(c.texKey, c.png); } catch (e) {}
                        // Load the original packer JSON sidecar under a stable key
                        // so we can create individual frames from it after the
                        // loader completes.
                        try { scene.load.json(c.texKey + '-sidecar', c.json); } catch (e) {}
                        console.warn('[AssetManager] Queued image and sidecar JSON for', c.texKey, c.png, c.json);
                    } catch (e) { /* ignore per-candidate */ }
                }

                // Create animations after loader completes so frames exist
                scene.load.once('complete', () => {
                    try {
                        console.warn('[AssetManager] loader.complete fired for player spritesheets; texture existence:', {
                            'skeleton-idle': !!(scene.textures && scene.textures.exists && scene.textures.exists('skeleton-idle')),
                            'skeleton-walk': !!(scene.textures && scene.textures.exists && scene.textures.exists('skeleton-walk')),
                            'skeleton-run': !!(scene.textures && scene.textures.exists && scene.textures.exists('skeleton-run')),
                            'skeleton-jumpattack': !!(scene.textures && scene.textures.exists && scene.textures.exists('skeleton-jumpattack'))
                        });

                        // If skeleton-idle texture exists, attempt to log its frame info
                        try {
                            if (scene.textures && scene.textures.exists && scene.textures.exists('skeleton-idle')) {
                                const tex = scene.textures.get('skeleton-idle');
                                let frameNames = null;
                                try { frameNames = (tex && typeof tex.getFrameNames === 'function') ? tex.getFrameNames() : null; } catch (e) { frameNames = null; }
                                console.info('[AssetManager] skeleton-idle texture frames sample:', Array.isArray(frameNames) ? frameNames.slice(0,8) : '(no frame names)');

                                // If the atlas loader produced no named frames (or only a
                                // single '__BASE' frame), attempt to read a JSON sidecar
                                // we shipped with our packer (which we've loaded into
                                // Phaser's json cache earlier) and generate separate
                                // texture entries for each frame. This avoids relying on
                                // Phaser's atlas parser which may choke on our custom
                                // JSON format.
                                try {
                                    const needsSidecar = !Array.isArray(frameNames) || frameNames.length <= 1;
                                    if (needsSidecar) {
                                        const createFromSidecarCached = (sidecarCacheKey, texKey, playerAnimKey, createdPrefix, cacheMarkerKey) => {
                                            try {
                                                const json = (scene.cache && scene.cache.json && typeof scene.cache.json.get === 'function') ? scene.cache.json.get(sidecarCacheKey) : null;
                                                if (!json) return;
                                                const mainTex = scene.textures.get(texKey);
                                                const srcImg = mainTex && mainTex.getSourceImage ? mainTex.getSourceImage() : (mainTex && mainTex.source && mainTex.source[0] ? mainTex.source[0].image : null);
                                                if (!srcImg) return;
                                                const createdKeys = [];
                                                for (const f of (json.frames || [])) {
                                                    try {
                                                        const nm = String(f.name);
                                                        const r = f.frame || f.rect || null;
                                                        if (!r) continue;
                                                        const cvs = document.createElement('canvas');
                                                        cvs.width = Math.max(1, r.w);
                                                        cvs.height = Math.max(1, r.h);
                                                        const ctx = cvs.getContext && cvs.getContext('2d');
                                                        if (!ctx) continue;
                                                        ctx.drawImage(srcImg, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
                                                        const keyName = createdPrefix + nm;
                                                        if (!scene.textures.exists(keyName)) {
                                                            scene.textures.addImage(keyName, cvs);
                                                            createdKeys.push(keyName);
                                                        }
                                                    } catch (e) { /* ignore per-frame */ }
                                                }

                                                // If we created per-frame textures, create an animation
                                                if (createdKeys.length) {
                                                    try {
                                                        const frames = createdKeys.map(k => ({ key: k }));
                                                        if (!scene.anims.exists(playerAnimKey)) {
                                                            scene.anims.create({ key: playerAnimKey, frames, frameRate: 12, repeat: (playerAnimKey === 'player-jump-attack' ? 0 : -1) });
                                                            try { scene.cache.custom = scene.cache.custom || {}; scene.cache.custom[cacheMarkerKey] = { by: 'AssetManager', key: playerAnimKey, ts: new Date().toISOString() }; } catch (e) {}
                                                            console.info('[AssetManager] Created', playerAnimKey, 'from cached JSON sidecar frames (separate textures):', createdKeys.length);
                                                        }
                                                    } catch (e) { /* ignore */ }
                                                }
                                            } catch (e) { /* ignore */ }
                                        };

                                        // idle
                                        createFromSidecarCached('skeleton-idle-sidecar', 'skeleton-idle', 'player-idle', 'skeleton-idle-frame-', 'player-idle-created-by');
                                        // walk
                                        createFromSidecarCached('skeleton-walk-sidecar', 'skeleton-walk', 'player-walk', 'skeleton-walk-frame-', 'player-walk-created-by');
                                        // run
                                        createFromSidecarCached('skeleton-run-sidecar', 'skeleton-run', 'player-run', 'skeleton-run-frame-', 'player-run-created-by');
                                        // jumpattack
                                        createFromSidecarCached('skeleton-jumpattack-sidecar', 'skeleton-jumpattack', 'player-jump-attack', 'skeleton-jumpattack-frame-', 'player-jump-attack-created-by');
                                    }
                                } catch (e) { /* ignore sidecar generation failures */ }
                            }
                        } catch (e) { console.warn('[AssetManager] Failed to inspect skeleton-idle texture frames:', e && e.message); }

                        // skeleton-idle + alias
                        try {
                            const createFromTextureOrGrid = (texKey, animKey, frameCount, opts = {}) => {
                                try {
                                    if (!scene.textures.exists(texKey)) return false;
                                    if (scene.anims.exists(animKey)) return true;
                                    const tex = scene.textures.get(texKey);
                                    // Prefer named frames (atlas)
                                    const frameNames = (tex && typeof tex.getFrameNames === 'function') ? tex.getFrameNames() : null;
                                    if (frameNames && frameNames.length) {
                                        const frames = frameNames.map(n => ({ key: texKey, frame: n }));
                                        scene.anims.create({ key: animKey, frames, frameRate: opts.frameRate || 12, repeat: (typeof opts.repeat !== 'undefined') ? opts.repeat : -1 });
                                        console.info('[AssetManager] Created', animKey, 'from frames of', texKey);
                                        return true;
                                    }

                                    // Fall back to numeric spritesheet grid.
                                    // But avoid calling generateFrameNumbers when we
                                    // have a sidecar JSON (we'll create per-frame
                                    // textures from it) or when per-frame textures
                                    // already exist. generateFrameNumbers logs
                                    // noisy "Frame X not found" messages when used
                                    // against a plain image.
                                    const sidecarKey = (texKey + '-sidecar');
                                    const hasSidecar = !!(scene.cache && scene.cache.json && typeof scene.cache.json.get === 'function' && scene.cache.json.get(sidecarKey));
                                    const hasPerFrameTextures = Object.keys(scene.textures.list || {}).some(k => k.indexOf(texKey + '-frame-') === 0);
                                    if (!hasSidecar && !hasPerFrameTextures && typeof scene.anims.generateFrameNumbers === 'function' && frameCount) {
                                        try {
                                            const genFrames = scene.anims.generateFrameNumbers(texKey, { start: 0, end: Math.max(0, frameCount - 1) });
                                            scene.anims.create({ key: animKey, frames: genFrames, frameRate: opts.frameRate || 12, repeat: (typeof opts.repeat !== 'undefined') ? opts.repeat : -1 });
                                            console.info('[AssetManager] Created', animKey, 'from spritesheet grid', texKey);
                                            return true;
                                        } catch (e) {
                                            console.warn('[AssetManager] generateFrameNumbers failed for', texKey, e && e.message);
                                            return false;
                                        }
                                    }
                                } catch (e) { /* ignore */ }
                                return false;
                            };

                            // idle
                            if (!scene.anims.exists('skeleton-idle')) {
                                createFromTextureOrGrid('skeleton-idle', 'skeleton-idle', 9, { frameRate: 12, repeat: -1 });
                            }
                            if (!scene.anims.exists('player-idle')) {
                                // Try to alias from skeleton-idle frames if available
                                if (scene.anims.exists('skeleton-idle')) {
                                    try {
                                        const anim = scene.anims.get('skeleton-idle');
                                        const frames = anim.frames.map(f => ({ key: f.textureKey, frame: f.frame.name }));
                                        scene.anims.create({ key: 'player-idle', frames, frameRate: 12, repeat: -1 });
                                        console.info('[AssetManager] Created player-idle animation alias from skeleton-idle');
                                    } catch (e) {
                                        // as a last resort, attempt generateFrameNumbers (may fail)
                                        try { scene.anims.create({ key: 'player-idle', frames: scene.anims.generateFrameNumbers('skeleton-idle', { start: 0, end: 8 }), frameRate: 12, repeat: -1 }); } catch (e2) { /* ignore */ }
                                    }
                                }
                            }

                            // walk
                            if (scene.textures.exists('skeleton-walk') && !scene.anims.exists('skeleton-walk')) {
                                createFromTextureOrGrid('skeleton-walk', 'skeleton-walk', 9, { frameRate: 12, repeat: -1 });
                            }
                            if (!scene.anims.exists('player-walk') && scene.anims.exists('skeleton-walk')) {
                                try {
                                    const anim = scene.anims.get('skeleton-walk');
                                    const frames = anim.frames.map(f => ({ key: f.textureKey, frame: f.frame.name }));
                                    scene.anims.create({ key: 'player-walk', frames, frameRate: 12, repeat: -1 });
                                    console.info('[AssetManager] Created player-walk animation alias from skeleton-walk');
                                } catch (e) { /* ignore */ }
                            }

                            // run
                            if (scene.textures.exists('skeleton-run') && !scene.anims.exists('skeleton-run')) {
                                createFromTextureOrGrid('skeleton-run', 'skeleton-run', 9, { frameRate: 12, repeat: -1 });
                            }
                            if (!scene.anims.exists('player-run') && scene.anims.exists('skeleton-run')) {
                                try {
                                    const anim = scene.anims.get('skeleton-run');
                                    const frames = anim.frames.map(f => ({ key: f.textureKey, frame: f.frame.name }));
                                    scene.anims.create({ key: 'player-run', frames, frameRate: 12, repeat: -1 });
                                    console.info('[AssetManager] Created player-run animation alias from skeleton-run');
                                } catch (e) { /* ignore */ }
                            }

                            // jumpattack
                            if (scene.textures.exists('skeleton-jumpattack') && !scene.anims.exists('skeleton-jumpattack')) {
                                createFromTextureOrGrid('skeleton-jumpattack', 'skeleton-jumpattack', 8, { frameRate: 12, repeat: 0 });
                            }
                            if (!scene.anims.exists('player-jump-attack') && scene.anims.exists('skeleton-jumpattack')) {
                                try {
                                    const anim = scene.anims.get('skeleton-jumpattack');
                                    const frames = anim.frames.map(f => ({ key: f.textureKey, frame: f.frame.name }));
                                    scene.anims.create({ key: 'player-jump-attack', frames, frameRate: 12, repeat: 0 });
                                    console.info('[AssetManager] Created player-jump-attack animation alias from skeleton-jumpattack');
                                } catch (e) { /* ignore */ }
                            }
                        } catch (e) {
                            console.warn('[AssetManager] Failed to create animations on loader complete (safe path):', e && e.message);
                        }

                    } catch (e) {
                        console.warn('[AssetManager] Failed to create animations on loader complete:', e && e.message);
                    }
                });
            } catch (e) {
                // Non-fatal: keep going if spritesheet isn't present
            }
            
            console.warn('[AssetManager] Loading player sprite sheets from:', basePath);
        } catch (e) {
            console.warn('[AssetManager] Failed to load player sprite sheets:', e && e.message);
        }
    }

    /**
     * Load a frame-by-frame sequence of WebP files and create a Phaser animation.
     *
     * This helper is useful when your animation frames are separate image files
     * (for example: "idle_0.webp", "idle_1.webp", ...). It queues each frame
     * as an image load during preload, and when the loader finishes it creates
     * a Phaser animation that references the loaded texture keys.
     *
     * Note: Packing frames into a spritesheet or atlas is still recommended for
     * production (fewer requests, better GPU upload behavior). Use this helper
     * as a convenient development/runtime fallback.
     *
     * @param {Phaser.Scene} scene
     * @param {string} animKey - animation key to create (also used as prefix for texture keys)
     * @param {string} baseUrl - base URL including trailing separator, e.g. '/games/noteleks/spine/characters/idle_'
     * @param {number} frameCount - number of frames (0-based frames will be loaded: baseUrl + '0.webp' ..)
     * @param {number} frameRate
     * @param {number} repeat
     */
    static loadFrameSequence(scene, animKey, baseUrl, frameCount, frameRate = 12, repeat = -1) {
        if (!scene || !scene.load) return;

        const frameKeys = [];
        for (let i = 0; i < frameCount; i++) {
            const key = `${animKey}-${i}`;
            frameKeys.push(key);
            try {
                scene.load.image(key, `${baseUrl}${i}.webp`);
            } catch (e) {
                console.warn('[AssetManager] Failed to queue frame load', key, e && e.message);
            }
        }

        // When the loader completes, create the Phaser animation referencing
        // the loaded frame texture keys. Using separate texture keys for each
        // frame is less efficient than a packed spritesheet, but it's simple
        // and works without additional build steps.
        try {
            scene.load.once('complete', () => {
                try {
                    const frames = frameKeys.map(k => ({ key: k }));
                    if (!scene.anims.exists(animKey)) {
                        scene.anims.create({ key: animKey, frames, frameRate, repeat });
                        console.info('[AssetManager] Created animation from frame sequence', animKey, 'frames=', frames.length);
                        // Create common player-level aliases for these skeleton animations
                        try {
                            const aliasMap = {
                                'skeleton-idle': 'player-idle',
                                'skeleton-run': 'player-run',
                                'skeleton-walk': 'player-walk',
                                'skeleton-jumpattack': 'player-jump-attack',
                                'skeleton-attack1': 'player-attack',
                                'skeleton-attack2': 'player-attack',
                                'skeleton-jump': 'player-jump'
                            };
                            const aliasKey = aliasMap[animKey];
                            if (aliasKey && !scene.anims.exists(aliasKey)) {
                                scene.anims.create({ key: aliasKey, frames: frames.slice(), frameRate, repeat });
                                console.info('[AssetManager] Created alias animation', aliasKey, 'from', animKey);
                            }
                        } catch (e) { /* ignore aliasing failures */ }
                    }
                } catch (e) {
                    console.warn('[AssetManager] Failed to create animation from frames', animKey, e && e.message);
                }
            });
        } catch (e) {
            console.warn('[AssetManager] Failed to register loader completion listener for frame sequence', animKey, e && e.message);
        }
    }

    /**
     * Queue assets declared in a build-time manifest into the Scene loader.
     * This is a synchronous enqueue: it merely calls scene.load.* for each
     * manifest entry so the caller can control loader start/stop behavior.
     *
     * @param {Phaser.Scene} scene
     * @param {Object} manifest
     */
    static queueAssetsFromManifest(scene, manifest) {
        try {
            if (!scene || !manifest) return;
            const seqs = manifest.frameSequences || {};
            for (const baseUrlRaw of Object.keys(seqs || {})) {
                try {
                    const files = Array.isArray(seqs[baseUrlRaw]) ? seqs[baseUrlRaw] : [];
                    const baseDir = String(baseUrlRaw).replace(/[^\/]*$/, '');
                    const animKey = String(baseUrlRaw).replace(/\/$/, '').split('/').pop().replace(/_$/,'').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
                    for (let i = 0; i < files.length; i++) {
                        try {
                            const fname = files[i];
                            let fullUrl = '';
                            if (typeof fname === 'string' && fname.startsWith('/')) {
                                fullUrl = fname;
                            } else if (typeof fname === 'string' && String(fname).indexOf(String(baseDir).split('/').pop()) === 0) {
                                fullUrl = baseDir + fname;
                            } else {
                                fullUrl = baseUrlRaw + fname;
                            }
                            const key = `${animKey}-${i}`;
                            try { scene.load.image(key, fullUrl); } catch (e) {}
                        } catch (e) { /* per-file */ }
                    }
                } catch (e) { /* per-sequence */ }
            }
        } catch (e) { /* ignore */ }
    }

    static setupSpineData(scene) {
        try {
            // If the game configuration disables Spine, skip all Spine setup.
            try {
                if (GameConfig && GameConfig.useSpine === false) {
                    try { console.info('[AssetManager] GameConfig.useSpine=false; skipping setupSpineData'); } catch (e) {}
                    return false;
                }
            } catch (e) { /* ignore config read errors */ }
            // Diagnostic: list current cache keys and textures so we can debug
            try {
                const textKeys = scene.cache && scene.cache.text ? scene.cache.text.keys ? Object.keys(scene.cache.text.keys) : [] : [];
                const jsonKeys = scene.cache && scene.cache.json ? scene.cache.json.keys ? Object.keys(scene.cache.json.keys) : [] : [];
                const textureKeys = scene.textures ? Object.keys(scene.textures.list || {}) : [];
                console.warn('[AssetManager] setupSpineData diagnostics: textKeys=', textKeys, 'jsonKeys=', jsonKeys, 'textureKeys=', textureKeys);
            } catch (diagErr) {
                console.warn('[AssetManager] diagnostics failed:', diagErr && diagErr.message);
            }

            // Retrieve atlas text, skeleton JSON and the image texture that were queued
            // earlier. Be defensive: Phaser's cache.text.get(...) can return either the
            // raw string or an object with a `data` property depending on loader path.
            let atlasTextEntry = null;
            try {
                atlasTextEntry = scene.cache && scene.cache.text && typeof scene.cache.text.get === 'function' ? scene.cache.text.get('noteleks-atlas-text') : null;
            } catch (e) {
                atlasTextEntry = null;
            }

            // Normalize to a string when possible
            let atlasText = atlasTextEntry && atlasTextEntry.data ? atlasTextEntry.data : atlasTextEntry;
            // Fallback: check conventional key if the above failed
            if (!atlasText || typeof atlasText !== 'string') {
                try {
                    const alt = scene.cache && scene.cache.text && typeof scene.cache.text.get === 'function' ? scene.cache.text.get('noteleks-data') : null;
                    atlasText = alt && alt.data ? alt.data : (alt || atlasText);
                } catch (e) {
                    // ignore
                }
            }

            // Normalize and pre-compute a modified atlas text where known page
            // filenames are normalized to our runtime texture key. This must be
            // available before we attempt unconditional cache population below.
            const modifiedAtlasText = (typeof atlasText === 'string') ? String(atlasText).replace(/Noteleks\.png/gi, 'noteleks-texture') : String(atlasText);

            const skeletonData = scene.cache && scene.cache.json && typeof scene.cache.json.get === 'function' ? scene.cache.json.get('noteleks-skeleton-data') : null;
            const texture = scene.textures ? scene.textures.get('noteleks-texture') : null;

            console.info('[AssetManager] setupSpineData: atlasText=', !!atlasText, 'skeletonData=', !!skeletonData, 'texture=', !!texture);

            if (!atlasText || !skeletonData || !texture) {
                return false;
            }

            // Parse Spine atlas text to extract region rectangles so we can create
            // Phaser texture frames for each named region. Some loader/plugin
            // races result in the atlas image being present but no Phaser frame
            // entries being created for the individual regions; creating them
            // from the atlas text prevents missing-frame rendering.
            try {
                const parseAtlasRegions = (text) => {
                    const lines = String(text).split(/\r?\n/).map(l => l.replace(/\t/g, ''));
                    const regions = [];
                    let page = null;
                    let i = 0;

                    const isPageHeader = (ln) => {
                        // Page header is a non-indented line that is a filename (e.g., Noteleks.png)
                        return ln && ln.length && ln.indexOf(':') === -1 && !ln.startsWith(' ') && !ln.startsWith('\t');
                    };

                    while (i < lines.length) {
                        let line = lines[i].trim();
                        if (!line) { i++; continue; }

                        // If this looks like a page header and we don't yet have a page, set it
                        if (isPageHeader(lines[i])) {
                            if (!page) {
                                page = line;
                                i++;
                                continue;
                            }
                            // If page already set, this may actually be a region name
                        }

                        // Treat the current non-empty trimmed line as a region name
                        const regionName = line;
                        // Read following key: value pairs until blank line or next non-indented token
                        let x = null, y = null, w = null, h = null;
                        i++;
                        while (i < lines.length && lines[i].trim()) {
                            const raw = lines[i].trim();
                            // Support different atlas formats: 'xy: x,y' & 'size: w,h' or 'bounds: x,y,w,h'
                            const kv = raw.split(':');
                            const key = kv[0] ? kv[0].trim() : '';
                            const rest = kv.length > 1 ? kv.slice(1).join(':').trim() : '';

                            if (key === 'xy' && rest) {
                                const parts = rest.split(',').map(s => parseInt(s.trim(), 10));
                                if (parts.length >= 2) { x = parts[0]; y = parts[1]; }
                            } else if (key === 'size' && rest) {
                                const parts = rest.split(',').map(s => parseInt(s.trim(), 10));
                                if (parts.length >= 2) { w = parts[0]; h = parts[1]; }
                            } else if (key === 'bounds' && rest) {
                                // bounds: x,y,w,h
                                const parts = rest.split(',').map(s => parseInt(s.trim(), 10));
                                if (parts.length >= 4) { x = parts[0]; y = parts[1]; w = parts[2]; h = parts[3]; }
                            } else if (key === 'rotate' || key === 'offsets' || key === 'format' || key === 'filter' || key === 'pma') {
                                // ignore these entries for region rect parsing
                            } else {
                                // Some atlas variants write 'offsets' or other keys without colon on the same line;
                                // ignore unknown keys safely.
                            }
                            i++;
                        }

                        if (regionName && x !== null && y !== null && w !== null && h !== null) {
                            regions.push({ name: regionName, page: page || 'page', x, y, width: w, height: h });
                        } else if (regionName) {
                            // If we could not parse a rect, still include the region name so
                            // callers can at least create a full-image fallback frame.
                            regions.push({ name: regionName, page: page || 'page', x: 0, y: 0, width: 0, height: 0, fallback: true });
                        }
                        // continue (i already at next blank or next entry)
                    }
                    return regions;
                };

                const regions = parseAtlasRegions(modifiedAtlasText || '');
                if (regions && regions.length && texture && texture.source && texture.source[0] && texture.source[0].image) {
                    const srcImg = texture.source[0].image;
                    for (const r of regions) {
                        try {
                            // Only create frame if it doesn't already exist
                            if (!scene.textures.exists(r.name)) {
                                // Create an offscreen canvas for the sub-image
                                const cvs = document.createElement('canvas');
                                cvs.width = Math.max(1, r.width);
                                cvs.height = Math.max(1, r.height);
                                const ctx = cvs.getContext && cvs.getContext('2d');
                                if (!ctx) continue;
                                ctx.drawImage(srcImg, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
                                scene.textures.addImage(r.name, cvs);
                                console.info('[AssetManager] Created texture frame for atlas region', r.name, 'size=', r.width + 'x' + r.height);
                            }
                        } catch (e) {
                            // ignore individual region failures
                        }
                    }
                }
            } catch (e) {
                console.warn('[AssetManager] Failed to parse/create atlas region frames:', e && e.message);
            }

            // Unconditionally populate conventional Phaser cache keys and
            // duplicate texture entries so Player or the SpinePlugin can find
            // them even if the official loader/plugin registered late. This
            // reduces races by ensuring the boolean cache checks used by the
            // Player return true as soon as raw assets are available.
            try {
                // Add atlas text under both 'noteleks-atlas-text' and the
                // conventional plugin key 'noteleks-data' (text form) so
                // callers checking either name succeed. If Phaser's text cache
                // isn't available in this runtime, provide a minimal fallback
                // implementation so existence checks return truthy values.
                try {
                    if (!scene.cache) scene.cache = {};
                    if (!scene.cache.text) {
                        // Minimal shim of Phaser's text cache API used by checks
                        scene.cache.text = {
                            _map: {},
                            exists: function (k) { return Object.prototype.hasOwnProperty.call(this._map, k); },
                            add: function (k, v) { this._map[k] = v; },
                            get: function (k) { return this._map[k]; },
                        };
                        console.info('[AssetManager] Created fallback scene.cache.text shim');
                    }
                    if (!scene.cache.text.exists('noteleks-atlas-text')) {
                        scene.cache.text.add('noteleks-atlas-text', { data: modifiedAtlasText });
                        console.info('[AssetManager] Populated cache.text: noteleks-atlas-text');
                    }
                    if (!scene.cache.text.exists('noteleks-data')) {
                        scene.cache.text.add('noteleks-data', { data: modifiedAtlasText });
                        console.info('[AssetManager] Populated cache.text: noteleks-data');
                    }
                } catch (e) { /* ignore per-key failures */ }

                // Add skeleton JSON under both 'noteleks-skeleton-data' and
                // the conventional key 'noteleks-data' (json form).
                try {
                    if (scene.cache && scene.cache.json) {
                        if (!scene.cache.json.exists('noteleks-skeleton-data')) {
                            scene.cache.json.add('noteleks-skeleton-data', skeletonData);
                            console.info('[AssetManager] Populated cache.json: noteleks-skeleton-data');
                        }
                        if (!scene.cache.json.exists('noteleks-data')) {
                            scene.cache.json.add('noteleks-data', skeletonData);
                            console.info('[AssetManager] Populated cache.json: noteleks-data');
                        }
                    }
                } catch (e) { /* ignore per-key failures */ }

                // Duplicate the main texture under several plugin-expected keys
                // so both the plugin and any direct cache checks find a usable
                // Phaser texture object.
                try {
                    const textureCandidates = [
                        'noteleks-data!noteleks-texture',
                        'noteleks-data!noteleks-texture.png',
                        'noteleks-data!noteleks-texture.jpg',
                        'noteleks-texture'
                    ];
                    const created = [];
                    for (const k of textureCandidates) {
                        if (!scene.textures.exists(k) && scene.textures.exists('noteleks-texture')) {
                            try {
                                scene.textures.addImage(k, scene.textures.get('noteleks-texture').getSourceImage());
                                created.push(k);
                                console.info('[AssetManager] Duplicated texture under', k);
                            } catch (e) {
                                console.warn('[AssetManager] Failed to duplicate texture', k, e && e.message);
                            }
                        }
                    }

                    // Force a GL upload for one of the created textures so
                    // plugin checks that rely on glTexture presence succeed.
                    if (created.length > 0) {
                        try {
                            const first = created[0];
                            if (scene.add && scene.sys && scene.sys.events && typeof scene.sys.events.once === 'function') {
                                const tmp = scene.add.image(-10000, -10000, first).setVisible(false);
                                scene.sys.events.once('postrender', () => { try { if (tmp && tmp.destroy) tmp.destroy(); } catch (e) {} });
                                console.info('[AssetManager] Forced GL upload for duplicated texture', first);
                            }
                        } catch (e) { /* ignore forced upload failures */ }
                    }
                } catch (e) { /* ignore duplication errors */ }

                // If cache.custom is used by other code, ensure a placeholder key
                // exists so the Player's cache checks find something truthy.
                try {
                    scene.cache.custom = scene.cache.custom || {};
                    if (!scene.cache.custom['spine-skeleton-data']) {
                        scene.cache.custom['spine-skeleton-data'] = skeletonData;
                        console.info('[AssetManager] Populated scene.cache.custom[spine-skeleton-data] with raw skeleton data');
                    }
                } catch (e) { /* ignore */ }

                // Emit spine-ready so listeners (GameScene) can proceed immediately.
                try {
                    if (scene && scene.events && typeof scene.events.emit === 'function') {
                        scene.events.emit('spine-ready');
                        console.info('[AssetManager] Emitted spine-ready after unconditional cache population');
                    }
                } catch (e) { /* ignore */ }
            } catch (e) {
                // non-fatal — continue to attempt plugin-based setup below
                console.warn('[AssetManager] Unconditional cache population failed:', e && e.message);
            }

            // Report whether replacement actually changed content
            try {
                if (modifiedAtlasText === String(atlasText)) {
                    console.info('[AssetManager] Atlas text replacement did not change content. (no Noteleks.png token found)');
                }
            } catch (e) { /* ignore */ }

            // Small, serializable diagnostics for external probes and device runs.
            try {
                const diag = (typeof window !== 'undefined' && window.NOTELEKS_DIAG) ? window.NOTELEKS_DIAG : {};
                diag.ts = new Date().toISOString();
                diag.atlasSnippet = (typeof atlasText === 'string') ? atlasText.slice(0, 512) : null;
                diag.atlasReplaced = (modifiedAtlasText !== String(atlasText));

                // skeletonData may be raw JSON or an object; try to pull common fields
                try {
                    const sd = skeletonData && (skeletonData.skeleton ? skeletonData.skeleton : skeletonData);
                    diag.skeleton = {
                        hash: sd && sd.hash ? sd.hash : null,
                        spine: sd && sd.spine ? sd.spine : null,
                        width: sd && sd.width ? sd.width : null,
                        height: sd && sd.height ? sd.height : null
                    };
                } catch (e) {
                    diag.skeleton = { error: e && e.message };
                }

                // texture dimensions / presence
                try {
                    if (texture) {
                        const src = texture.source && texture.source[0] ? texture.source[0] : null;
                        const img = (src && src.image) ? src.image : (texture.getSourceImage ? texture.getSourceImage() : null);
                        diag.texture = {
                            exists: true,
                            width: img && img.width ? img.width : (src && src.width ? src.width : null),
                            height: img && img.height ? img.height : (src && src.height ? src.height : null)
                        };
                    } else {
                        diag.texture = { exists: false };
                    }
                } catch (e) {
                    diag.texture = { error: e && e.message };
                }

                if (typeof window !== 'undefined') window.NOTELEKS_DIAG = diag;
                console.warn('[AssetManager] NOTELEKS_DIAG prepared', window.NOTELEKS_DIAG);
            } catch (e) {
                // ignore diag failures
            }

            // Populate a persistent, concise runtime probe for interactive debugging.
            // This snapshot is intentionally small and serializable so you can inspect
            // `window._NOTELEKS_ASSET_PROBE` in the browser console at any time.
            try {
                if (typeof window !== 'undefined') {
                    const probe = { ts: new Date().toISOString() };
                    try {
                        probe.textures = Object.keys(scene.textures && scene.textures.list ? scene.textures.list : {});
                    } catch (e) { probe.textures = null; }
                    try {
                        probe.anims = [];
                        if (scene.anims && scene.anims.anims && typeof scene.anims.anims.keys === 'function') {
                            probe.anims = Array.from(scene.anims.anims.keys());
                        } else if (scene.anims && typeof scene.anims.get === 'function') {
                            // Best-effort fallback when internals differ across Phaser builds
                            try { probe.anims = Object.keys(scene.anims); } catch (e) { /* ignore */ }
                        }
                    } catch (e) { probe.anims = null; }
                    try {
                        probe.cacheCustomKeys = Object.keys(scene.cache && scene.cache.custom ? scene.cache.custom : {});
                    } catch (e) { probe.cacheCustomKeys = null; }
                    try {
                        const plugin = scene.sys && scene.sys.spine ? scene.sys.spine : null;
                        if (plugin) {
                            const atlasCache = plugin.atlasCache || plugin.atlasCacheMap || null;
                            const skeletonCache = plugin.skeletonDataCache || plugin.skeletonCache || null;
                            probe.pluginAtlasKeys = atlasCache && typeof atlasCache.keys === 'function' ? atlasCache.keys() : (atlasCache ? Object.keys(atlasCache) : null);
                            probe.pluginSkeletonKeys = skeletonCache && typeof skeletonCache.keys === 'function' ? skeletonCache.keys() : (skeletonCache ? Object.keys(skeletonCache) : null);
                        } else {
                            probe.pluginAtlasKeys = null; probe.pluginSkeletonKeys = null;
                        }
                    } catch (e) { probe.pluginAtlasKeys = probe.pluginSkeletonKeys = null; }

                    try { window._NOTELEKS_ASSET_PROBE = probe; } catch (e) { /* ignore */ }
                    console.warn('[AssetManager] _NOTELEKS_ASSET_PROBE populated', probe);
                }
            } catch (e) {
                // ignore probe failures
            }

            if (window.spine) {
                const textureAtlas = new window.spine.TextureAtlas(modifiedAtlasText, (_path) => {
                    return texture.getSourceImage();
                });

                const attachmentLoader = new window.spine.AtlasAttachmentLoader(textureAtlas);
                const json = new window.spine.SkeletonJson(attachmentLoader);
                const skeletonDataObj = json.readSkeletonData(skeletonData);

                scene.cache.custom = scene.cache.custom || {};
                // store the runtime TextureAtlas for direct inspection
                scene.cache.custom['spine-atlas'] = textureAtlas;

                // Provide a minimal `get` accessor on the custom cache to mirror
                // Phaser's Cache API so callers that use `scene.cache.custom.get(key)`
                // (or dev consoles) will find the entry regardless of how the
                // custom cache is represented in this environment.
                try {
                    if (typeof scene.cache.custom.get !== 'function') {
                        scene.cache.custom.get = function (k) { return this[k]; };
                    }
                } catch (e) {
                    // ignore if we can't patch
                }

                // Log atlas pages for easier debugging in environments where
                // `scene.cache.custom.get` previously returned undefined.
                try {
                    const pages = (textureAtlas && textureAtlas.pages) ? textureAtlas.pages.map(p => p.name) : null;
                    console.info('[AssetManager] spine-atlas pages=', pages);
                } catch (e) {
                    // ignore
                }
                scene.cache.custom['spine-skeleton-data'] = skeletonDataObj;

                // Also populate Phaser's standard caches with keys the SpinePlugin
                // expects when using scene.load.spine(...). This prevents the
                // plugin from throwing when it's invoked before the official
                // loader was used (we already loaded raw assets as a fallback).
                try {
                    // Use the conventional key the loader would use when calling
                    // scene.load.spine('noteleks-data', json, atlas)
                    const conventionalKey = 'noteleks-data';

                    // Add atlas text to game cache.text under the conventional key
                    if (scene.cache && scene.cache.text && !scene.cache.text.exists(conventionalKey)) {
                        scene.cache.text.add(conventionalKey, { data: modifiedAtlasText });
                        console.info('[AssetManager] Added atlas text to game cache.text as', conventionalKey);
                    }

                    // Add skeleton JSON to game cache.json under the conventional key
                    if (scene.cache && scene.cache.json && !scene.cache.json.exists(conventionalKey)) {
                        // skeletonData may be an object already; ensure we add raw JSON
                        scene.cache.json.add(conventionalKey, skeletonData);
                        console.info('[AssetManager] Added skeleton json to game cache.json as', conventionalKey);
                    }

                    // Duplicate the already-loaded image texture under the plugin-expected
                    // composite key: `${conventionalKey}!${pageName}` so the plugin can
                    // find page textures via `this.game.textures.get(t+"!"+n.name)`.
                    try {
                        const atlasPages = textureAtlas.pages || [];
                        for (const page of atlasPages) {
                            const pageName = page.name || 'noteleks-texture';
                            // Build several candidate names so we cover common variations:
                            // - with extension (as found in atlas)
                            // - without extension
                            // - lowercased
                            // - plugin-expected composite keys
                            const basename = String(pageName).replace(/\.(png|jpg|jpeg)$/i, '');
                            const candidates = new Set();
                            candidates.add(pageName);
                            candidates.add(basename);
                            candidates.add(pageName.toLowerCase());
                            candidates.add(basename.toLowerCase());

                            const createdCandidates = [];
                            for (const candidate of candidates) {
                                const expectedTexKey = `${conventionalKey}!${candidate}`;
                                // If the expected key doesn't exist but our loaded texture does,
                                // duplicate under the expected key. Also add a candidate without
                                // the conventional prefix in case some runtimes reference only
                                // the bare page name.
                                const tryKeys = [expectedTexKey, candidate, `${conventionalKey}!${candidate}.png`, `${conventionalKey}!${candidate}.jpg`];
                                for (const k of tryKeys) {
                                    if (!scene.textures.exists(k) && scene.textures.exists('noteleks-texture')) {
                                        try {
                                            scene.textures.addImage(k, scene.textures.get('noteleks-texture').getSourceImage());
                                            console.info('[AssetManager] Added duplicate texture for spine plugin candidate:', k);
                                            createdCandidates.push(k);
                                        } catch (e) {
                                            console.warn('[AssetManager] Failed to add duplicate texture candidate', k, e && e.message);
                                        }
                                    }
                                }
                            }

                            // Report diagnostics for created candidates and schedule a later check
                            try {
                                for (const k of createdCandidates) {
                                    try {
                                        const addedTex = scene.textures.get(k);
                                        const hasSource = !!(addedTex && addedTex.source && addedTex.source[0]);
                                        const hasGL = !!(hasSource && addedTex.source[0].glTexture);
                                        console.info('[AssetManager] Duplicate texture check:', { key: k, exists: scene.textures.exists(k), hasSource, hasGL });
                                    } catch (checkErr) {
                                        console.warn('[AssetManager] Failed immediate duplicate-texture check for', k, checkErr && checkErr.message);
                                    }
                                }
                            } catch (e) { /* ignore */ }

                            if (createdCandidates.length > 0) {
                                setTimeout(() => {
                                    try {
                                        for (const k of createdCandidates) {
                                            try {
                                                const laterTex = scene.textures.get(k);
                                                const laterHasSource = !!(laterTex && laterTex.source && laterTex.source[0]);
                                                const laterHasGL = !!(laterHasSource && laterTex.source[0].glTexture);
                                                console.info('[AssetManager] Later duplicate texture check:', { key: k, exists: scene.textures.exists(k), laterHasSource, laterHasGL });
                                            } catch (laterErr) {
                                                console.warn('[AssetManager] Failed later duplicate-texture check for', k, laterErr && laterErr.message);
                                            }
                                        }
                                    } catch (e) { /* ignore */ }
                                }, 350);

                                // Force GL upload for the first created candidate
                                try {
                                    const firstKey = createdCandidates[0];
                                    if (scene.add && scene.sys && scene.sys.events && typeof scene.sys.events.once === 'function') {
                                        const tmpUploadImage = scene.add.image(-10000, -10000, firstKey).setVisible(false);
                                        scene.sys.events.once('postrender', () => {
                                            try { if (tmpUploadImage && tmpUploadImage.destroy) tmpUploadImage.destroy(); } catch (e) { /* ignore */ }
                                        });
                                        console.info('[AssetManager] Forced GL upload: temporary image created for', firstKey);
                                    }
                                } catch (uploadErr) {
                                    console.warn('[AssetManager] Forced GL upload failed for candidates', createdCandidates, uploadErr && uploadErr.message);
                                }
                            }
                        }
                    } catch (dupErr) {
                        console.warn('[AssetManager] Failed to duplicate spine page textures for plugin:', dupErr && dupErr.message);
                    }
                } catch (cacheErr) {
                    console.warn('[AssetManager] Failed to populate plugin-friendly caches:', cacheErr && cacheErr.message);
                }

                // Additionally, if the Spine plugin instance is already available on
                // the scene (registered as scene.sys.spine by the plugin mapping),
                // populate the plugin's internal caches directly. This avoids races
                // where the plugin tries to read from its own atlas/skeleton caches
                // before the Phaser cache.tex/json entries are visible to it.
                try {
                    const pluginInstance = scene.sys && scene.sys.spine ? scene.sys.spine : null;
                    if (pluginInstance) {
                        try {
                            const atlasCache = pluginInstance.atlasCache || pluginInstance.atlasCacheMap || null;
                            const skeletonCache = pluginInstance.skeletonDataCache || pluginInstance.skeletonCache || null;

                            // Helper: attempt to set a key/value into a plugin cache
                            // supporting multiple shapes: Map-like (.set), object-like
                            // (assignment), nested containers (cache.entries, cache.entries.entries)
                            const setDeepCache = (cacheRoot, key, value, seen = new WeakSet(), depth = 0) => {
                                try {
                                    if (!cacheRoot || depth > 4) return false;
                                    if (seen.has(cacheRoot)) return false;
                                    seen.add(cacheRoot);

                                    // Direct Map-like APIs
                                    if (typeof cacheRoot.set === 'function') { try { cacheRoot.set(key, value); return true; } catch (e) {} }
                                    if (typeof cacheRoot.add === 'function') { try { cacheRoot.add(key, value); return true; } catch (e) {} }
                                    if (typeof cacheRoot.put === 'function') { try { cacheRoot.put(key, value); return true; } catch (e) {} }

                                    // If it exposes a numeric-size / entries object, try to set there
                                    if (cacheRoot.entries && typeof cacheRoot.entries === 'object') {
                                        // entries may itself be Map-like
                                        const entries = cacheRoot.entries;
                                        if (typeof entries.set === 'function') { try { entries.set(key, value); return true; } catch (e) {} }
                                        try { entries[key] = value; return true; } catch (e) {}
                                        // if entries has nested entries (some implementations), recurse
                                        if (entries.entries && typeof entries.entries === 'object') {
                                            if (setDeepCache(entries.entries, key, value, seen, depth + 1)) return true;
                                        }
                                    }

                                    // Object-like assignment directly on cacheRoot
                                    try { cacheRoot[key] = value; return true; } catch (e) {}

                                    // If cacheRoot has nested properties that may hold maps, attempt to recurse
                                    const candidateProps = ['entries', 'map', 'store', 'data'];
                                    for (const p of candidateProps) {
                                        try {
                                            if (cacheRoot[p] && typeof cacheRoot[p] === 'object') {
                                                if (setDeepCache(cacheRoot[p], key, value, seen, depth + 1)) return true;
                                            }
                                        } catch (e) { /* ignore property-level failures */ }
                                    }
                                } catch (e) {
                                    // swallow — best-effort only
                                }
                                return false;
                            };

                            // Build a broad set of candidate keys for atlas and skeleton
                            // caches. Some Spine plugin implementations store atlas entries
                            // under composite keys like `noteleks-data!PageName.png` or
                            // lowercase variants, so generate page-based candidates
                            // from the runtime textureAtlas pages when available.
                            const atlasKeyCandidates = new Set(['noteleks-data', 'noteleks-atlas', 'noteleks-data-atlas', 'noteleks-atlas-text', 'noteleks-skeleton-data']);
                            const skeletonKeyCandidates = new Set(['noteleks-data', 'noteleks-skeleton-data', 'noteleks-data-skeleton']);

                            try {
                                const pages = (textureAtlas && textureAtlas.pages) ? textureAtlas.pages : [];
                                for (const p of pages) {
                                    try {
                                        const pageName = p && p.name ? String(p.name) : null;
                                        if (!pageName) continue;
                                        const basename = pageName.replace(/\.(png|jpg|jpeg)$/i, '');
                                        // Add several common variants
                                        atlasKeyCandidates.add(`${'noteleks-data'}!${pageName}`);
                                        atlasKeyCandidates.add(`${'noteleks-data'}!${basename}`);
                                        atlasKeyCandidates.add(`${'noteleks-data'}!${pageName.toLowerCase()}`);
                                        atlasKeyCandidates.add(`${'noteleks-data'}!${basename.toLowerCase()}`);
                                        atlasKeyCandidates.add(pageName);
                                        atlasKeyCandidates.add(basename);
                                        atlasKeyCandidates.add(pageName.toLowerCase());
                                        atlasKeyCandidates.add(basename.toLowerCase());
                                    } catch (e) { /* ignore per-page errors */ }
                                }
                            } catch (e) { /* ignore */ }

                            // Also include texture duplication candidates we used earlier
                            const fallbackTextureCandidates = ['noteleks-data!noteleks-texture', 'noteleks-data!noteleks-texture.png', 'noteleks-texture'];
                            for (const c of fallbackTextureCandidates) atlasKeyCandidates.add(c);

                            // Attempt to populate atlas cache broadly (best-effort).
                            for (const k of atlasKeyCandidates) {
                                if (setDeepCache(atlasCache, k, textureAtlas)) console.info('[AssetManager] Populated SpinePlugin atlasCache (deep) with', k);
                            }

                            // Populate skeleton cache with conventional and fallback names
                            for (const k of skeletonKeyCandidates) {
                                if (setDeepCache(skeletonCache, k, skeletonDataObj)) console.info('[AssetManager] Populated SpinePlugin skeletonCache (deep) with', k);
                            }

                            // Some Spine plugin builds expose a wrapper object with an
                            // `entries` Map-like container instead of top-level Map APIs.
                            // In those cases, explicitly mirror our candidates into that
                            // Map and provide small accessor shims so plugin code that
                            // expects `cache.get()` or `cache.keys()` will succeed.
                            try {
                                // Mirror into atlasCache.entries (Map) when present
                                if (atlasCache && atlasCache.entries && typeof atlasCache.entries.set === 'function') {
                                    for (const k of atlasKeyCandidates) {
                                        try {
                                            atlasCache.entries.set(k, textureAtlas);
                                            console.info('[AssetManager] Mirrored atlas entry into atlasCache.entries Map for', k);
                                        } catch (e) {
                                            // ignore per-key failures
                                        }
                                    }
                                    // Provide get/keys helpers if missing
                                    if (typeof atlasCache.get !== 'function' && typeof atlasCache.entries.get === 'function') {
                                        try { atlasCache.get = (kk) => atlasCache.entries.get(kk); } catch (e) { /* ignore */ }
                                    }
                                    if (typeof atlasCache.keys !== 'function' && typeof atlasCache.entries.keys === 'function') {
                                        try { atlasCache.keys = () => Array.from(atlasCache.entries.keys()); } catch (e) { /* ignore */ }
                                    }
                                }

                                // Mirror into skeletonCache.entries (Map) when present
                                if (skeletonCache && skeletonCache.entries && typeof skeletonCache.entries.set === 'function') {
                                    for (const k of skeletonKeyCandidates) {
                                        try {
                                            skeletonCache.entries.set(k, skeletonDataObj);
                                            console.info('[AssetManager] Mirrored skeleton entry into skeletonCache.entries Map for', k);
                                        } catch (e) {
                                            // ignore per-key failures
                                        }
                                    }
                                    // Provide get/keys helpers if missing
                                    if (typeof skeletonCache.get !== 'function' && typeof skeletonCache.entries.get === 'function') {
                                        try { skeletonCache.get = (kk) => skeletonCache.entries.get(kk); } catch (e) { /* ignore */ }
                                    }
                                    if (typeof skeletonCache.keys !== 'function' && typeof skeletonCache.entries.keys === 'function') {
                                        try { skeletonCache.keys = () => Array.from(skeletonCache.entries.keys()); } catch (e) { /* ignore */ }
                                    }
                                }
                            } catch (mirrorErr) {
                                console.warn('[AssetManager] Explicit plugin.entries mirroring failed:', mirrorErr && mirrorErr.message);
                            }

                        } catch (pErr) {
                            console.warn('[AssetManager] Failed to populate plugin internal caches (deep):', pErr && pErr.message);
                        }
                    }
                } catch (e) {
                    // ignore
                }

                // (cleanup) Removed tolerant plugin accessor monkey-patch — plugin
                // caches are populated directly above and we rely on deterministic
                // spine-ready events. This keeps the runtime behavior predictable
                // and avoids modifying plugin prototypes.

                // Create a lightweight canvas renderer fallback so we can still display
                // Spine animations even if the SpinePlugin can't be used directly.
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d');

                    // Prepare Spine runtime objects for rendering
                    const atlasLoader = textureAtlas;
                    const attachmentLoader = new window.spine.AtlasAttachmentLoader(atlasLoader);
                    const skeletonJson = new window.spine.SkeletonJson(attachmentLoader);
                    const runtimeSkeletonData = skeletonDataObj; // already created above

                    // Create basic Spine objects required to update/pose
                    const skeleton = new window.spine.Skeleton(runtimeSkeletonData);
                    skeleton.setToSetupPose();
                    const stateData = new window.spine.AnimationStateData(runtimeSkeletonData);
                    const state = new window.spine.AnimationState(stateData);

                    // Default animation if present
                    try { state.setAnimation(0, 'idle', true); } catch (e) { /* ignore */ }

                    // Store a small render helper object in cache.custom
                    scene.cache.custom['spine-canvas-fallback'] = {
                        canvas,
                        ctx,
                        skeleton,
                        state,
                        time: 0,
                        drawToTexture: function(phaserScene, textureKey) {
                            // advance state and render skeleton onto canvas
                            const dt = 1/60;
                            this.time += dt;
                            this.state.update(dt);
                            this.state.apply(this.skeleton);
                            this.skeleton.updateWorldTransform();

                            // Clear and render
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            // Very small, naive renderer: draw attachments as images if possible
                            for (let i = 0; i < this.skeleton.slots.length; i++) {
                                const slot = this.skeleton.slots[i];
                                const attachment = slot.getAttachment();
                                if (attachment && attachment.region) {
                                    const img = atlasLoader.getRegions && atlasLoader.getRegions()[0] ? atlasLoader.getRegions()[0].page.getTexture().image : null;
                                    if (img) {
                                        // naive draw at skeleton position
                                        ctx.drawImage(img, canvas.width/2 - img.width/2, canvas.height/2 - img.height/2);
                                    }
                                }
                            }

                            // Copy to Phaser texture
                            try {
                                if (!phaserScene.textures.exists(textureKey)) {
                                    phaserScene.textures.addImage(textureKey, canvas);
                                } else {
                                    const tex = phaserScene.textures.get(textureKey);
                                    tex.source[0].image = canvas;
                                    phaserScene.textures.refresh();
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                    };
                } catch (e) {
                    // if fallback creation fails, ignore
                    console.warn('[AssetManager] Failed to create spine canvas fallback:', e);
                }
                
                // Ensure commonly expected fallback animations are present when
                // their spritesheet textures exist but the animation wasn't
                // created due to loader ordering. Creating them here makes the
                // fallback paths in Player robust to ordering differences.
                try {
                    const ensureAnim = (texKey, animKey, opts = {}) => {
                        try {
                            if (!scene || !scene.textures || !scene.anims) return;
                            if (!scene.textures.exists(texKey)) return;
                            if (scene.anims.exists(animKey)) return;

                            const tex = scene.textures.get(texKey);

                            // Prefer atlas/packed frame names when available — this
                            // avoids generateFrameNumbers which expects numeric
                            // indexed frames and can produce noisy errors when used
                            // against an atlas.
                            try {
                                const frameNames = (tex && typeof tex.getFrameNames === 'function') ? tex.getFrameNames() : null;
                                if (frameNames && frameNames.length) {
                                    const frames = frameNames.map(n => ({ key: texKey, frame: n }));
                                    scene.anims.create({ key: animKey, frames, frameRate: opts.frameRate || 12, repeat: (typeof opts.repeat !== 'undefined') ? opts.repeat : -1 });
                                    console.info('[AssetManager] Created animation', animKey, 'from frames of', texKey);
                                    try {
                                        scene.cache.custom = scene.cache.custom || {};
                                        scene.cache.custom['player-idle-created-by'] = { by: 'AssetManager', key: animKey, ts: new Date().toISOString() };
                                    } catch (e) { /* ignore */ }
                                    return;
                                }
                            } catch (e) {
                                // fall through to spritesheet path
                            }

                            // If no atlas/frameNames found, look for per-frame textures
                            // created earlier with names like `${texKey}-frame-0`, `${texKey}_frame_0`, etc.
                            try {
                                const allKeys = Object.keys(scene.textures.list || {});
                                const perFrameCandidates = allKeys.filter(k => k.indexOf(texKey + '-frame-') === 0 || k.indexOf(texKey + '_frame_') === 0 || k.indexOf(texKey + 'frame-') === 0 || k.indexOf(texKey + 'frame_') === 0);
                                if (perFrameCandidates && perFrameCandidates.length > 1) {
                                    // Attempt to sort by numeric suffix when present
                                    const extractNumber = (s) => {
                                        const m = s.match(/(\d+)(?!.*\d)/);
                                        return m ? parseInt(m[1], 10) : null;
                                    };
                                    perFrameCandidates.sort((a, b) => {
                                        const na = extractNumber(a);
                                        const nb = extractNumber(b);
                                        if (na !== null && nb !== null) return na - nb;
                                        if (na !== null) return -1;
                                        if (nb !== null) return 1;
                                        return a.localeCompare(b);
                                    });
                                    const frames = perFrameCandidates.map(k => ({ key: k }));
                                    scene.anims.create({ key: animKey, frames, frameRate: opts.frameRate || 12, repeat: (typeof opts.repeat !== 'undefined') ? opts.repeat : -1 });
                                    console.info('[AssetManager] Created animation', animKey, 'from per-frame textures for', texKey, 'count=', frames.length);
                                    try { scene.cache.custom = scene.cache.custom || {}; scene.cache.custom[animKey + '-created-by'] = { by: 'AssetManager', key: animKey, ts: new Date().toISOString(), source: 'per-frame' }; } catch (e) {}
                                    return;
                                }
                            } catch (e) {
                                // ignore per-frame discovery failures
                            }

                            // If no named frames available, try spritesheet-style frames
                            try {
                                const frameCount = opts.frameCount || null;
                                if (typeof scene.anims.generateFrameNumbers === 'function' && frameCount) {
                                    // Only call generateFrameNumbers when we expect a uniform
                                    // numeric grid; otherwise this will generate 'Frame not found' errors.
                                    const genFrames = scene.anims.generateFrameNumbers(texKey, { start: 0, end: Math.max(0, frameCount - 1) });
                                    scene.anims.create({ key: animKey, frames: genFrames, frameRate: opts.frameRate || 12, repeat: (typeof opts.repeat !== 'undefined') ? opts.repeat : -1 });
                                    console.info('[AssetManager] Created animation', animKey, 'from spritesheet grid', texKey);
                                    try {
                                        scene.cache.custom = scene.cache.custom || {};
                                        scene.cache.custom['player-idle-created-by'] = { by: 'AssetManager', key: animKey, ts: new Date().toISOString() };
                                    } catch (e) { /* ignore */ }
                                    return;
                                }
                            } catch (e) {
                                console.warn('[AssetManager] generateFrameNumbers failed for', texKey, e && e.message);
                            }

                            // If we reach here, nothing created — no-op
                        } catch (e) { /* ignore */ }
                    };

                    try { ensureAnim('skeleton-idle', 'player-idle', { frameCount: 9, frameRate: 12, repeat: -1 }); } catch (e) {}
                    try { ensureAnim('skeleton-walk', 'player-walk', { frameCount: 9, frameRate: 12, repeat: -1 }); } catch (e) {}
                    try { ensureAnim('skeleton-run', 'player-run', { frameCount: 9, frameRate: 12, repeat: -1 }); } catch (e) {}
                    try { ensureAnim('skeleton-jumpattack', 'player-jump-attack', { frameCount: 8, frameRate: 12, repeat: 0 }); } catch (e) {}
                } catch (e) { /* ignore animation creation failures */ }

                // Ensure a generic 'skeleton' texture exists so objects that
                // create sprites immediately (Player.createPlayerDeferred) have
                // a visible image to use. Prefer duplicating the packed idle
                // source image when available so the early physics sprite is
                // not invisible while more advanced fallbacks are prepared.
                try {
                    if (scene && scene.textures && !scene.textures.exists('skeleton')) {
                        if (scene.textures.exists('skeleton-idle')) {
                            try {
                                const srcTex = scene.textures.get('skeleton-idle');
                                const srcImg = (srcTex && srcTex.source && srcTex.source[0] && srcTex.source[0].image) ? srcTex.source[0].image : (srcTex && typeof srcTex.getSourceImage === 'function' ? srcTex.getSourceImage() : null);
                                if (srcImg) {
                                    try { scene.textures.addImage('skeleton', srcImg); console.info('[AssetManager] Created fallback texture alias: skeleton (from skeleton-idle source)'); } catch (e) { /* ignore addImage failures */ }
                                }
                            } catch (e) { /* ignore per-attempt */ }
                        }
                    }
                } catch (e) { /* ignore */ }

                // If the Player instance was constructed earlier with a missing
                // texture, update it now so the physics sprite becomes visible
                // immediately. Also create a persistent animated fallback sprite
                // near the player if an animation is available.
                try {
                    if (typeof window !== 'undefined') {
                        const p = window.noteleksPlayer || null;
                        if (p && p.sprite) {
                            try {
                                // If the sprite was constructed before the 'skeleton'
                                // texture existed, force it to use the new texture
                                // now so it becomes visible without manual intervention.
                                if (scene.textures.exists('skeleton')) {
                                    try { p.sprite.setTexture('skeleton'); } catch (e) {}
                                    try { p.sprite.setVisible(true); } catch (e) {}
                                }

                                // If an animated fallback was created (player-idle),
                                // create (or reuse) a persistent animated sprite so
                                // the player shows the intended animation immediately.
                                if (scene.anims && typeof scene.anims.exists === 'function' && scene.anims.exists('player-idle')) {
                                    try {
                                        // Avoid creating duplicates
                                        if (!p._persistentFallbackSprite || !p._persistentFallbackSprite.playing) {
                                            try {
                                                const fx = (p.sprite && typeof p.sprite.x === 'number') ? p.sprite.x : (scene.cameras && scene.cameras.main && scene.cameras.main.centerX) || 0;
                                                const fy = (p.sprite && typeof p.sprite.y === 'number') ? p.sprite.y : (scene.cameras && scene.cameras.main && scene.cameras.main.centerY) || 0;

                                                // Prefer per-frame texture if it exists (we create
                                                // keys like 'skeleton-idle-frame-0'). Falling back
                                                // to 'skeleton-idle' or 'skeleton' when needed.
                                                let baseTex = null;
                                                if (scene.textures && scene.textures.exists && scene.textures.exists('skeleton-idle-frame-0')) {
                                                    baseTex = 'skeleton-idle-frame-0';
                                                } else if (scene.textures && scene.textures.exists && scene.textures.exists('skeleton-idle')) {
                                                    baseTex = 'skeleton-idle';
                                                } else if (scene.textures && scene.textures.exists && scene.textures.exists('skeleton')) {
                                                    baseTex = 'skeleton';
                                                }

                                                // Create the sprite using the selected base texture
                                                // so it's visible even before the animation advances.
                                                console.info('[AssetManager] Attempting to create persistent fallback, baseTex=', baseTex, 'player.exists=', !!p, 'player.sprite=', !!(p && p.sprite));
                                                const spr = scene.add.sprite(fx, fy, baseTex || null).setOrigin(0.5, 1);
                                                // Apply configured player visual scale if available
                                                try {
                                                    const baseScale = (GameConfig && GameConfig.player && typeof GameConfig.player.scale === 'number') ? GameConfig.player.scale : 1;
                                                    if (spr && typeof spr.setScale === 'function') spr.setScale(baseScale);
                                                } catch (e) {}
                                                // Play the named animation if available
                                                try { if (spr && spr.play) spr.play('player-idle'); } catch (e) { console.warn('[AssetManager] play threw', e && e.message); }
                                                if (spr && spr.setDepth) spr.setDepth(501);

                                                // Hide the physics sprite so the animated fallback is visible
                                                try { if (p.sprite && typeof p.sprite.setVisible === 'function') p.sprite.setVisible(false); } catch (e) { console.warn('[AssetManager] hide physics sprite failed', e && e.message); }

                                                p._persistentFallbackSprite = spr;
                                                console.info('[AssetManager] Created persistent animated fallback for player (player-idle) using', baseTex, 'spr.scene=', !!(spr && spr.scene));
                                            } catch (e) {
                                                console.warn('[AssetManager] Failed to create persistent animated fallback (caught):', e && e.message);
                                            }
                                        }
                                    } catch (e) {}
                                }
                            } catch (e) { /* ignore per-player update errors */ }
                        }
                    }
                } catch (e) { /* ignore */ }

                // Helper to create persistent animated fallback when both the
                // animation and the Player instance are available. This handles
                // races where animation or player are created at different times.
                try {
                    const createPersistentFallbackIfPossible = () => {
                        try {
                            if (!scene || !scene.anims || !scene.textures) return false;
                            if (!scene.anims.exists || !scene.anims.exists('player-idle')) return false;
                            const p = (typeof window !== 'undefined') ? window.noteleksPlayer : null;
                            if (!p || !p.sprite) return false;

                            // Avoid recreating
                            if (p._persistentFallbackSprite && p._persistentFallbackSprite.destroy && p._persistentFallbackSprite.scene) return true;

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
                            console.info('[AssetManager] Persistent animated fallback created (delayed) using', baseTex);
                            return true;
                        } catch (e) {
                            return false;
                        }
                    };

                    // Try immediately
                    try { createPersistentFallbackIfPossible(); } catch (e) { console.warn('[AssetManager] createPersistentFallbackIfPossible immediate invocation threw', e && e.message); }

                    // Poll for animation presence (if absent) then create fallback
                    try {
                        if (scene && scene.anims && !scene.anims.exists('player-idle')) {
                            let attempts = 0;
                            const ivA = setInterval(() => {
                                attempts += 1;
                                try {
                                    if (scene.anims.exists && scene.anims.exists('player-idle')) {
                                        try { createPersistentFallbackIfPossible(); } catch (e) { console.warn('[AssetManager] createPersistentFallbackIfPossible from anim poll threw', e && e.message); }
                                        clearInterval(ivA);
                                        return;
                                    }
                                } catch (e) {}
                                if (attempts >= 25) clearInterval(ivA);
                            }, 200);
                        }
                    } catch (e) {}

                    // Poll for player existence (if absent) then create fallback
                    try {
                        if (typeof window !== 'undefined' && !window.noteleksPlayer) {
                            let pattempts = 0;
                            const ivP = setInterval(() => {
                                pattempts += 1;
                                try {
                                    if (window.noteleksPlayer) {
                                        try { createPersistentFallbackIfPossible(); } catch (e) { console.warn('[AssetManager] createPersistentFallbackIfPossible from player poll threw', e && e.message); }
                                        clearInterval(ivP);
                                        return;
                                    }
                                } catch (e) {}
                                if (pattempts >= 50) clearInterval(ivP);
                            }, 200);
                        }
                    } catch (e) {}
                    // Expose manual trigger for debugging
                    try { if (typeof window !== 'undefined') window._NOTELEKS_CREATE_FALLBACK = createPersistentFallbackIfPossible; } catch (e) {}
                } catch (e) { /* ignore helper registration */ }

                // Notify the scene that spine data is ready so game objects can create displays
                try {
                    if (scene && scene.events && typeof scene.events.emit === 'function') {
                        scene.events.emit('spine-ready');
                    }
                } catch (e) {
                    // ignore
                }

                // Ensure we record who created the player-idle animation. Some
                // creation paths run asynchronously (sidecar fetch), so if an
                // animation exists but our diagnostic marker wasn't set, set it
                // now to help debugging.
                try {
                    scene.cache.custom = scene.cache.custom || {};
                    if (scene.anims && typeof scene.anims.exists === 'function' && scene.anims.exists('player-idle') && !scene.cache.custom['player-idle-created-by']) {
                        scene.cache.custom['player-idle-created-by'] = { by: 'AssetManager', key: 'player-idle', ts: new Date().toISOString() };
                        console.info('[AssetManager] Recorded player-idle creator marker (AssetManager)');
                    }
                } catch (e) { /* ignore */ }

                console.warn('[AssetManager] Spine data prepared and cached under scene.cache.custom', Object.keys(scene.cache.custom));

                // --- WebGL instrumentation (debug only) ---
                // Instrumentation can be noisy; only enable when the explicit
                // runtime debug flag is set (window.__NOTELEKS_DEBUG__ === true).
                // This prevents spurious logs in production and avoids double-patching
                // unless an operator intentionally enables the debug flag.
                try {
                    if (typeof window !== 'undefined' && window.__NOTELEKS_DEBUG__ && !window.__noteleks_spine_webgl_instrumented) {
                        window.__noteleks_spine_webgl_instrumented = true;
                        try {
                            const gl = (scene && scene.game && scene.game.renderer && scene.game.renderer.gl) || (document && document.createElement('canvas').getContext && document.createElement('canvas').getContext('webgl'));
                            if (gl) {
                                try {
                                    const createTextureOrig = WebGLRenderingContext.prototype.createTexture;
                                    const bindTextureOrig = WebGLRenderingContext.prototype.bindTexture;
                                    const createdMap = new WeakMap();
                                    let _count = 0;

                                    WebGLRenderingContext.prototype.createTexture = function () {
                                        const tex = createTextureOrig.apply(this, arguments);
                                        try {
                                            // Record stack and timestamp for later correlation
                                            createdMap.set(tex, { ts: Date.now(), stack: (new Error()).stack });
                                            _count += 1;
                                            if (_count <= 20) {
                                                console.info('[WebGL-Instrument] createTexture #'+_count, tex);
                                            }
                                        } catch (e) {
                                            // ignore instrumentation errors
                                        }
                                        return tex;
                                    };

                                    WebGLRenderingContext.prototype.bindTexture = function (target, texture) {
                                        try {
                                            const meta = texture ? createdMap.get(texture) : null;
                                            // Only log the first N binds to avoid enormous logs.
                                            if (meta && (meta.logged !== true)) {
                                                meta.logged = true;
                                                console.info('[WebGL-Instrument] bindTexture target=', target, 'texture=', texture, 'createdAt=', meta.ts, '\nstack:', meta.stack);
                                            } else if (!meta && Math.random() < 0.01) {
                                                // Occasionally log anonymous binds to sample activity
                                                console.info('[WebGL-Instrument] bindTexture (sample) target=', target, 'texture=', texture);
                                            }
                                        } catch (e) {
                                            // ignore
                                        }
                                        return bindTextureOrig.apply(this, arguments);
                                    };

                                    // Try to map known Phaser texture objects to GL textures when available
                                    try {
                                        const mapPhaserTextures = () => {
                                            try {
                                                if (!scene || !scene.textures) return;
                                                const keys = Object.keys(scene.textures.list || {});
                                                for (const k of keys) {
                                                    try {
                                                        const phTex = scene.textures.get(k);
                                                        if (phTex && phTex.source && phTex.source[0] && phTex.source[0].glTexture) {
                                                            const glTex = phTex.source[0].glTexture;
                                                            if (createdMap.has(glTex) && !createdMap.get(glTex).key) {
                                                                createdMap.get(glTex).key = k;
                                                                console.info('[WebGL-Instrument] Mapped GL texture to Phaser key=', k);
                                                            }
                                                        }
                                                    } catch (e) { /* ignore per-texture errors */ }
                                                }
                                            } catch (e) { /* ignore */ }
                                        };
                                        mapPhaserTextures();
                                        setTimeout(mapPhaserTextures, 300);
                                    } catch (e) {
                                        // ignore
                                    }
                                } catch (e) {
                                    // ignore gl patch errors
                                }
                            }
                        } catch (e) {
                            // ignore
                        }
                    }
                } catch (e) {
                    // ignore instrumentation errors
                }
                // --- end WebGL instrumentation ---
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }
}

// Expose for quick runtime debugging in the browser console (non-breaking)
try {
    if (typeof window !== 'undefined') {
        window.AssetManager = AssetManager;
    }
} catch (e) {
    // ignore; this is only a developer-facing convenience
}

export default AssetManager;

// Runtime probe helper: call from console or tests to dump Spine-related cache state
// e.g. AssetManager.probeSpineState(window.noteleksGame.getScene('GameScene'))
AssetManager.probeSpineState = function(scene) {
    try {
        const results = {};
        results.textures = {};
        const keysToCheck = ['noteleks-texture', 'noteleks-data', 'noteleks-atlas-text', 'noteleks-skeleton-data'];
        for (const k of keysToCheck) {
            try {
                results.textures[k] = !!(scene.textures && scene.textures.exists && scene.textures.exists(k));
            } catch (e) { results.textures[k] = 'error'; }
        }

        try {
            const altKeys = [];
            if (scene.cache && scene.cache.text && typeof scene.cache.text.get === 'function') {
                altKeys.push('noteleks-atlas-text', 'noteleks-data');
            }
            results.cacheTextKeys = altKeys.reduce((acc, k) => { acc[k] = !!(scene.cache.text && scene.cache.text.exists && scene.cache.text.exists(k)); return acc; }, {});
        } catch (e) { results.cacheTextKeys = 'error'; }

        try {
            results.cacheJson = {
                'noteleks-skeleton-data': !!(scene.cache && scene.cache.json && scene.cache.json.exists && scene.cache.json.exists('noteleks-skeleton-data')),
                'noteleks-data': !!(scene.cache && scene.cache.json && scene.cache.json.exists && scene.cache.json.exists('noteleks-data'))
            };
        } catch (e) { results.cacheJson = 'error'; }

        try {
            results.cacheCustomKeys = Object.keys(scene.cache && scene.cache.custom ? scene.cache.custom : {});
        } catch (e) { results.cacheCustomKeys = 'error'; }

        try {
            const plugin = scene.sys && scene.sys.spine ? scene.sys.spine : null;
            results.pluginPresent = !!plugin;
            if (plugin) {
                const atlasCache = plugin.atlasCache || plugin.atlasCacheMap || null;
                const skeletonCache = plugin.skeletonDataCache || plugin.skeletonCache || null;
                results.pluginAtlasKeys = atlasCache && typeof atlasCache.keys === 'function' ? atlasCache.keys() : (atlasCache ? Object.keys(atlasCache) : null);
                results.pluginSkeletonKeys = skeletonCache && typeof skeletonCache.keys === 'function' ? skeletonCache.keys() : (skeletonCache ? Object.keys(skeletonCache) : null);
            }
        } catch (e) { results.pluginError = e && e.message; }

        try {
            // Inspect a few texture sources for GL presence
            results.textureGL = {};
            const texList = Object.keys(scene.textures.list || {});
            for (const k of texList) {
                try {
                    const t = scene.textures.get(k);
                    const hasSource = !!(t && t.source && t.source[0]);
                    const hasGL = !!(hasSource && t.source[0].glTexture);
                    if (k.indexOf('noteleks') !== -1) results.textureGL[k] = { hasSource, hasGL };
                } catch (e) {
                    // ignore per texture
                }
            }
        } catch (e) { results.textureGL = 'error'; }

        console.info('[AssetManager.probeSpineState] probe results:', results);
        return results;
    } catch (e) {
        console.warn('[AssetManager.probeSpineState] probe failed:', e && e.message);
        return null;
    }
};
