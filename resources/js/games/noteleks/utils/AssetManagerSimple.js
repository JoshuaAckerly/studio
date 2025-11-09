/*
 * Simplified AssetManager
 *
 * Single supported flow: manifest-driven per-frame WebP sequences.
 * - Loads images listed in manifest.frameSequences
 * - Creates Phaser animations keyed by a normalized name derived from the manifest key
 * - Creates a simple alias map so existing code referencing legacy keys still works
 *
 * This file intentionally omits legacy sidecar/spritesheet/spine self-heal logic.
 */
import GameConfig from '../config/GameConfig.js';

export class AssetManager {
    /**
     * Create simple placeholder textures declared in GameConfig.assets.textures (optional)
     */
    static createPlaceholderTextures(scene, config) {
        try {
            const textures = (config && config.assets && config.assets.textures) || {};
            Object.entries(textures).forEach(([key, textureConfig]) => {
                try {
                    if (textureConfig && typeof textureConfig.color !== 'undefined') {
                        if (scene.textures.exists(key)) return;
                        const graphics = scene.add.graphics();
                        graphics.fillStyle(textureConfig.color);
                        graphics.fillRect(0, 0, textureConfig.width, textureConfig.height);
                        graphics.generateTexture(key, textureConfig.width, textureConfig.height);
                        graphics.destroy();
                    }
                } catch (e) {
                    // ignore per-texture failures
                }
            });
        } catch (e) {
            // ignore
        }
    }

    /**
     * Queue assets declared in a build-time manifest into the Scene loader.
     * Expected manifest format:
     * {
     *   frameSequences: {
     *     "/games/noteleks/sprites/Skeleton-Idle_": [ "Skeleton-Idle_0.webp", "Skeleton-Idle_01.webp", ... ],
     *     ...
     *   },
     *   sheets: { ... }
     * }
     */
    static queueAssetsFromManifest(scene, manifest) {
        try {
            if (!scene || !manifest) return;
            const seqs = manifest.frameSequences || {};
            const sequences = {};

            const makeAnimKey = (baseUrlRaw) => {
                try {
                    return String(baseUrlRaw)
                        .replace(/\/$/, '')
                        .split('/')
                        .pop()
                        .replace(/_$/, '')
                        .replace(/[^a-zA-Z0-9]+/g, '-')
                        .toLowerCase();
                } catch (e) {
                    return null;
                }
            };

            for (const baseUrlRaw of Object.keys(seqs || {})) {
                try {
                    const files = Array.isArray(seqs[baseUrlRaw]) ? seqs[baseUrlRaw] : [];
                    const animKey = makeAnimKey(baseUrlRaw) || 'animation-unknown';
                    sequences[animKey] = files.length || 0;

                    // baseDir: directory portion of the manifest key
                    const baseDir = String(baseUrlRaw).replace(/[^\\\/]*$/, '');

                    for (let i = 0; i < files.length; i++) {
                        try {
                            const fname = files[i];
                            let fullUrl = '';
                            if (typeof fname === 'string' && fname.startsWith('/')) {
                                fullUrl = fname;
                            } else {
                                // default to baseDir + fname which matches how sprites are served
                                fullUrl = baseDir + fname;
                            }
                            const key = `${animKey}-${i}`;
                            scene.load.image(key, fullUrl);
                        } catch (e) {
                            // ignore per-file enqueue failures
                        }
                    }
                } catch (e) {
                    // ignore per-sequence failures
                }
            }

            // Create animations when loader finishes
            try {
                scene.load.once('complete', () => {
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

                        for (const animKey of Object.keys(sequences || {})) {
                            try {
                                const count = sequences[animKey] || 0;
                                if (count <= 0) continue;

                                if (!scene.anims.exists(animKey)) {
                                    const frames = [];
                                    for (let i = 0; i < count; i++) frames.push({ key: `${animKey}-${i}` });
                                    scene.anims.create({ key: animKey, frames, frameRate: 12, repeat: -1 });
                                }

                                // Duplicate first frame into base texture so legacy code
                                // that expects a single texture key (e.g. 'skeleton-idle')
                                // finds something usable for sizing.
                                try {
                                    const firstKey = `${animKey}-0`;
                                    if (scene.textures.exists(firstKey) && !scene.textures.exists(animKey)) {
                                        const srcImg = scene.textures.get(firstKey).getSourceImage();
                                        if (srcImg) scene.textures.addImage(animKey, srcImg);
                                    }
                                } catch (e) { }

                                // Create alias if mapped
                                const alias = aliasMap[animKey];
                                if (alias && !scene.anims.exists(alias)) {
                                    try {
                                        const baseAnim = scene.anims.get(animKey);
                                        if (baseAnim && baseAnim.frames && baseAnim.frames.length) {
                                            const framesCopy = baseAnim.frames.map(f => ({ key: f.textureKey, frame: f.frame ? f.frame.name : f.frame }));
                                            scene.anims.create({ key: alias, frames: framesCopy, frameRate: 12, repeat: -1 });
                                        }
                                    } catch (e) { }
                                }
                            } catch (e) { }
                        }
                    } catch (e) { }
                });
            } catch (e) { }
        } catch (e) {
            // ignore top-level failures
        }
    }

    /**
     * Simple helper to enqueue a numeric frame sequence when needed.
     * Kept for compatibility but not used by default if manifest is present.
     */
    static loadFrameSequence(scene, animKey, baseUrl, frameCount, frameRate = 12, repeat = -1) {
        if (!scene || !scene.load) return;
        const frameKeys = [];
        for (let i = 0; i < frameCount; i++) {
            const key = `${animKey}-${i}`;
            frameKeys.push(key);
            try { scene.load.image(key, `${baseUrl}${i}.webp`); } catch (e) { }
        }
        try {
            scene.load.once('complete', () => {
                try {
                    if (!scene.anims.exists(animKey)) {
                        const frames = frameKeys.map(k => ({ key: k }));
                        scene.anims.create({ key: animKey, frames, frameRate, repeat });
                    }
                } catch (e) { }
            });
        } catch (e) { }
    }

    /**
     * Spine setup is intentionally a no-op in the simplified manager. If you
     * enable Spine via `GameConfig.useSpine = true` this function can be
     * expanded to perform plugin-specific cache population. For the simplified
     * flow we return false.
     */
    static setupSpineData(scene) {
        try {
            if (GameConfig && GameConfig.useSpine === false) return false;
            return false;
        } catch (e) {
            return false;
        }
    }
}

// Developer convenience
try { if (typeof window !== 'undefined') window.AssetManager = AssetManager; } catch (e) { }

export default AssetManager;
