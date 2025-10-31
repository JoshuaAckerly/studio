/* Utility helpers for input handling in Noteleks
 * - createControlScheme(scene): returns an object with `cursors`, `wasd` and `space` keys
 * - isMousePointer(pointer): safe detection whether a pointer should be considered mouse
 */
/* global Phaser */

const InputUtils = {
    createControlScheme(scene) {
        if (!scene || !scene.input || !scene.input.keyboard) return {};

        const cursors = scene.input.keyboard.createCursorKeys();

        // Provide a minimal WASD-style map plus some common action keys used by the game
        const keys = scene.input.keyboard.addKeys({
            W: 'W',
            A: 'A',
            S: 'S',
            D: 'D',
            P: 'P',
            R: 'R',
            ESC: 'ESC',
            Z: 'Z',
        });

        // Ensure we normalize to Phaser Key objects if strings were returned
        const normalize = k => (k && k instanceof Phaser.Input.Keyboard.Key ? k : scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[k] || Phaser.Input.Keyboard.KeyCodes[k]));

        const wasd = {
            W: normalize('W'),
            A: normalize('A'),
            S: normalize('S'),
            D: normalize('D'),
            P: normalize('P'),
            R: normalize('R'),
            ESC: normalize('ESC'),
            Z: normalize('Z'),
        };

        const space = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        return {
            cursors,
            wasd,
            space,
        };
    },

    isMousePointer(pointer) {
        if (!pointer) return false;

        try {
            // Phaser pointerType may be available
            if (pointer.pointerType) {
                const pt = String(pointer.pointerType).toLowerCase();
                return pt.indexOf('mouse') !== -1;
            }

            // Native event may be wrapped in pointer.event
            const ev = pointer.event;
            if (ev) {
                const t = (ev.pointerType || ev.type || '').toString().toLowerCase();
                if (t.indexOf('mouse') !== -1 || t.indexOf('mousedown') !== -1) return true;
            }

            // As a last resort, check for button property and absence of touch identifiers
            if (typeof pointer.buttons === 'number' && pointer.buttons >= 0 && pointer.pointerId !== undefined) {
                // pointerId for mouse is usually 1, for touch it's >=2 in some browsers — heuristic only
                return pointer.pointerType === undefined || pointer.pointerId === 1;
            }
        } catch (e) {
            // if detection fails, be conservative and return false (not mouse)
            return false;
        }

        return false;
    },
};

export default InputUtils;
