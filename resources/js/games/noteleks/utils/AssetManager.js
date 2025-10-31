/**
 * Asset Management Utilities
 */
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

    static async loadSpineAssets(scene, config) {
        const { atlas, json, png } = config.assets.spine;

        try {
            // Always queue raw assets as a reliable fallback. This guarantees that
            // AssetManager.setupSpineData can access atlas text and skeleton JSON
            // from the scene cache even if the Spine plugin/loader isn't available
            // at preload time (race conditions, plugin init delays, etc.).
            try {
                console.info('[AssetManager] Queuing raw spine assets (fallback safe):', { png, atlas, json });
                scene.load.image('noteleks-texture', png);
                scene.load.text('noteleks-atlas-text', atlas);
                scene.load.json('noteleks-skeleton-data', json);
            } catch (e) {
                console.warn('[AssetManager] Failed to queue raw spine assets:', e && e.message);
            }

            // If the official Spine loader is available, also use it (this may
            // provide optimized loading and cache entries the plugin expects).
            if (scene.load && typeof scene.load.spine === 'function') {
                try {
                    console.info('[AssetManager] Spine loader detected, also loading via plugin loader: noteleks-data', { json, atlas });
                    scene.load.spine('noteleks-data', json, atlas);
                } catch (e) {
                    console.warn('[AssetManager] scene.load.spine threw while queuing plugin load:', e && e.message);
                }
            } else {
                console.info('[AssetManager] Spine loader not detected at preload; relying on raw assets fallback');
            }
        } catch {
            // Silently handle error
            console.warn('[AssetManager] Failed to queue spine assets for loading', { json, atlas, png });
        }
    }

    static setupSpineData(scene) {
        try {
            // Diagnostic: list current cache keys and textures so we can debug
            try {
                const textKeys = scene.cache && scene.cache.text ? scene.cache.text.keys ? Object.keys(scene.cache.text.keys) : [] : [];
                const jsonKeys = scene.cache && scene.cache.json ? scene.cache.json.keys ? Object.keys(scene.cache.json.keys) : [] : [];
                const textureKeys = scene.textures ? Object.keys(scene.textures.list || {}) : [];
                console.info('[AssetManager] setupSpineData diagnostics: textKeys=', textKeys, 'jsonKeys=', jsonKeys, 'textureKeys=', textureKeys);
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
                console.info('[AssetManager] NOTELEKS_DIAG prepared', window.NOTELEKS_DIAG);
            } catch (e) {
                // ignore diag failures
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
                
                // Notify the scene that spine data is ready so game objects can create displays
                try {
                    if (scene && scene.events && typeof scene.events.emit === 'function') {
                        scene.events.emit('spine-ready');
                    }
                } catch (e) {
                    // ignore
                }

                console.info('[AssetManager] Spine data prepared and cached under scene.cache.custom', Object.keys(scene.cache.custom));

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
