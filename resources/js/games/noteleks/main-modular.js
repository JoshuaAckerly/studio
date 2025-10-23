/**
 * Noteleks Game - Modular Entry Point
 *
 * This is the main entry point for the refactored, modular version of the game.
 *
 * Key improvements:
 * - Configuration-driven design
 * - Modular manager system
 * - Separated concerns
 * - Better maintainability
 * - Cleaner architecture
 */

import NoteleksGame from './NoteleksGameModular.js';

// Small on-page log overlay to surface messages when DevTools are closed or unavailable.
function installPageLogger() {
    try {
        if (typeof window === 'undefined' || document == null) return;
        if (document.getElementById('noteleks-page-log')) return;

        const container = document.createElement('div');
        container.id = 'noteleks-page-log';
        container.style.position = 'fixed';
        container.style.left = '12px';
        container.style.top = '12px';
        container.style.zIndex = 1000000;
        container.style.maxWidth = '40vw';
        container.style.maxHeight = '40vh';
        container.style.overflow = 'auto';
        container.style.background = 'rgba(0,0,0,0.7)';
        container.style.color = '#fff';
        container.style.fontSize = '12px';
        container.style.padding = '8px';
        container.style.borderRadius = '6px';
        container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        container.style.fontFamily = 'monospace';

        const title = document.createElement('div');
        title.textContent = 'Noteleks Logs';
        title.style.fontWeight = '700';
        title.style.marginBottom = '6px';
        container.appendChild(title);

        const list = document.createElement('div');
        list.id = 'noteleks-page-log-list';
        container.appendChild(list);

        // Expose logs for easy copying or debugging via console
        window._noteleksPageLogs = window._noteleksPageLogs || [];

        const controlsTop = document.createElement('div');
        controlsTop.style.display = 'flex';
        controlsTop.style.gap = '6px';
        controlsTop.style.marginBottom = '6px';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.style.padding = '2px 6px';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.onclick = async () => {
            try {
                const text = window._noteleksPageLogs.join('\n');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    append('info', 'Logs copied to clipboard');
                } else {
                    // Fallback: create temporary textarea
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                    append('info', 'Logs copied to clipboard (fallback)');
                }
            } catch (e) {
                append('warn', 'Copy failed: ' + (e && e.message));
            }
        };

        const dlBtn = document.createElement('button');
        dlBtn.textContent = 'Download';
        dlBtn.style.padding = '2px 6px';
        dlBtn.style.borderRadius = '4px';
        dlBtn.style.cursor = 'pointer';
        dlBtn.onclick = () => {
            try {
                const blob = new Blob([window._noteleksPageLogs.join('\n')], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'noteleks-logs.txt';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                append('info', 'Logs downloaded');
            } catch (e) {
                append('warn', 'Download failed: ' + (e && e.message));
            }
        };

        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.style.padding = '2px 6px';
        clearBtn.style.borderRadius = '4px';
        clearBtn.style.cursor = 'pointer';
        clearBtn.onclick = () => {
            window._noteleksPageLogs.length = 0;
            list.innerHTML = '';
            append('info', 'Logs cleared');
        };

        controlsTop.appendChild(copyBtn);
        controlsTop.appendChild(dlBtn);
        controlsTop.appendChild(clearBtn);
        container.appendChild(controlsTop);

        const close = document.createElement('button');
        close.textContent = '×';
        close.title = 'Close logs';
        close.style.position = 'absolute';
        close.style.right = '6px';
        close.style.top = '6px';
        close.style.background = 'transparent';
        close.style.color = '#fff';
        close.style.border = 'none';
        close.style.fontSize = '16px';
        close.style.cursor = 'pointer';
        close.onclick = () => container.remove();
        container.appendChild(close);

        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(container);
        });

        // If DOM already loaded, attach immediately
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            if (!document.body.contains(container)) document.body.appendChild(container);
        }

        const append = (level, text) => {
            try {
                const entry = document.createElement('div');
                entry.style.marginBottom = '6px';
                entry.style.whiteSpace = 'pre-wrap';
                entry.textContent = `[${level}] ${text}`;
                list.appendChild(entry);
                try { window._noteleksPageLogs = window._noteleksPageLogs || []; window._noteleksPageLogs.push(`[${level}] ${text}`); } catch (e) {}
                // Keep max lines
                while (list.childNodes.length > 80) list.removeChild(list.firstChild);
            } catch (e) {
                // ignore
            }
        };

        // Wrap console methods
        ['log', 'info', 'warn', 'error', 'debug'].forEach((m) => {
            const orig = console[m] && console[m].bind(console);
            console[m] = function (...args) {
                try { append(m, args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')); } catch (e) {}
                if (orig) orig(...args);
            };
        });
    } catch (e) {
        // ignore
    }
}

installPageLogger();

// Initialize the game but wait briefly for the Spine runtime to be available so
// the plugin constructor can be detected. We poll for `window.spine` for a
// short timeout (2000ms) after `load` to reduce race conditions between the
// external Spine IIFE and our Vite bundle. If `window.spine` never appears, we
// still bootstrap with the adapter/fallback behavior implemented in NoteleksGame.
async function bootstrap() {
    // NoteleksGame.create is async and returns the created game instance (or null on failure)
    const game = await NoteleksGame.create('phaser-game');

    if (game && typeof window !== 'undefined') {
        window.noteleksGame = game;
    }

    return game;
}

if (typeof window !== 'undefined') {
    const startWhenReady = () => {
        const maxWait = 2000; // ms
        const interval = 100; // ms
        let waited = 0;

        return new Promise((resolve) => {
            if (window.spine) return resolve(true);
            const timer = setInterval(() => {
                if (window.spine) {
                    clearInterval(timer);
                    console.info('[NoteleksMain] Spine runtime appeared, bootstrapping');
                    return resolve(true);
                }
                waited += interval;
                if (waited >= maxWait) {
                    clearInterval(timer);
                    console.info('[NoteleksMain] Spine runtime not detected after wait, bootstrapping with adapter/fallback');
                    return resolve(false);
                }
            }, interval);
        });
    };

    const runBootstrapWhenReady = async () => {
        console.info('[NoteleksMain] entry script executing, document.readyState=', document.readyState);
        await startWhenReady();
        try {
            await bootstrap();
        } catch (e) {
            console.error('[NoteleksMain] bootstrap failed:', e && e.message ? e.message : e);
        }
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // If the document is already loaded or interactive, run immediately
        runBootstrapWhenReady();
    } else {
        window.addEventListener('load', runBootstrapWhenReady, { once: true });
    }
}

export default null;
