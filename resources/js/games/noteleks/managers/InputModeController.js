export default class InputModeController {
    constructor(scene, touchInput) {
        this.scene = scene;
        this.touchInput = touchInput;
        this.isMobile = !!(touchInput && touchInput.isMobileDevice && touchInput.isMobileDevice());

        this._onFirstTouch = this._onFirstTouch.bind(this);
        this._onFirstPointer = this._onFirstPointer.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
    }

    initialize() {
        try {
            if (this.isMobile && this.touchInput) {
                // Ensure mobile area visibility
                if (this.touchInput.setMobileAreaVisible) {
                    this.touchInput.setMobileAreaVisible(true);
                }
            } else {
                if (this.touchInput && this.touchInput.setMobileAreaVisible) {
                    this.touchInput.setMobileAreaVisible(false);
                }
            }

            // Listen for first interactions
            try {
                window.addEventListener('touchstart', this._onFirstTouch, { once: true, passive: true });
            } catch (e) {}

            try {
                window.addEventListener('mousedown', this._onFirstPointer, { once: true });
            } catch (e) {}

            if (this.scene && this.scene.input && this.scene.input.keyboard) {
                this.scene.input.keyboard.on('keydown', this._onKeyDown);
            }

            return true;
        } catch (e) {
            console.error('InputModeController.initialize failed', e);
            return false;
        }
    }

    _onFirstTouch() {
        this.isMobile = true;
        if (this.touchInput && !this.touchInput.isEnabled && this.touchInput.initialize) {
            this.touchInput.initialize();
        }
        if (this.touchInput && this.touchInput.setMobileAreaVisible) {
            this.touchInput.setMobileAreaVisible(true);
        }
    }

    _onFirstPointer() {
        this.isMobile = false;
        if (this.touchInput && this.touchInput.setMobileAreaVisible) {
            this.touchInput.setMobileAreaVisible(false);
        }
    }

    _onKeyDown(event) {
        // Expose keyboard events if needed by higher-level managers
    }

    shutdown() {
        try {
            window.removeEventListener('touchstart', this._onFirstTouch, { passive: true });
        } catch (e) {}
        try {
            window.removeEventListener('mousedown', this._onFirstPointer);
        } catch (e) {}
        try {
            if (this.scene && this.scene.input && this.scene.input.keyboard) {
                this.scene.input.keyboard.off('keydown', this._onKeyDown);
            }
        } catch (e) {}
    }

    isMobileDevice() {
        return this.isMobile;
    }
}
