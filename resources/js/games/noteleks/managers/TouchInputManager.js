/**
 * TouchInputManager - Manages touch controls for mobile devices
 * Creates virtual joystick and action buttons
 */
class TouchInputManager {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = this.detectMobile();
        
        // Touch input states
        this.touchState = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            attack: false
        };
        
        // Touch control elements
        this.joystickContainer = null;
        this.joystickBase = null;
        this.joystickThumb = null;
        this.jumpButton = null;
        this.attackButton = null;
        
        // Joystick tracking
        this.joystickPointer = null;
        this.joystickOrigin = { x: 0, y: 0 };
        
        // Button tracking
        this.jumpPointer = null;
        this.attackPointer = null;
        
        // Control visibility
        this.controlsVisible = false;
        
        if (this.isMobile) {
            this.createTouchControls();
        }
    }
    
    /**
     * Detect if device is mobile
     */
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return (
            /android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
                userAgent,
            ) ||
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0
        );
    }
    
    /**
     * Create touch control UI elements
     */
    createTouchControls() {
        // Create controls container
        const controlsContainer = this.scene.add.container(0, 0);
        controlsContainer.setScrollFactor(0);
        controlsContainer.setDepth(2000);
        
        // Get screen dimensions
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        
        // Create virtual joystick on the left side
        this.createJoystick(controlsContainer, 100, height - 100);
        
        // Create action buttons on the right side
        this.createActionButtons(controlsContainer, width - 120, height - 120);
        
        this.controlsContainer = controlsContainer;
        this.showTouchControls(true);
    }
    
    /**
     * Create virtual joystick
     */
    createJoystick(container, x, y) {
        // Joystick base (outer circle)
        this.joystickBase = this.scene.add.circle(x, y, 60, 0x333333, 0.5);
        this.joystickBase.setStrokeStyle(3, 0x666666, 0.8);
        container.add(this.joystickBase);
        
        // Joystick thumb (inner circle)
        this.joystickThumb = this.scene.add.circle(x, y, 30, 0x4ade80, 0.8);
        this.joystickThumb.setStrokeStyle(2, 0xffffff, 1);
        container.add(this.joystickThumb);
        
        this.joystickOrigin = { x, y };
        
        // Make joystick base interactive
        this.joystickBase.setInteractive();
        
        // Touch start
        this.joystickBase.on('pointerdown', (pointer) => {
            this.joystickPointer = pointer;
            this.updateJoystick(pointer.x, pointer.y);
        });
        
        // Also allow touch anywhere in the left half of the screen
        const leftZone = this.scene.add.zone(0, 0, this.scene.scale.width / 2, this.scene.scale.height)
            .setOrigin(0, 0)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(1999);
        
        leftZone.on('pointerdown', (pointer) => {
            if (pointer.x < this.scene.scale.width / 2) {
                this.joystickPointer = pointer;
                this.updateJoystick(pointer.x, pointer.y);
            }
        });
        
        container.add(leftZone);
        leftZone.setPosition(0, 0);
        
        // Touch move
        this.scene.input.on('pointermove', (pointer) => {
            if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
                this.updateJoystick(pointer.x, pointer.y);
            }
        });
        
        // Touch end
        this.scene.input.on('pointerup', (pointer) => {
            if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
                this.resetJoystick();
                this.joystickPointer = null;
            }
        });
    }
    
    /**
     * Update joystick position and calculate input
     */
    updateJoystick(pointerX, pointerY) {
        const dx = pointerX - this.joystickOrigin.x;
        const dy = pointerY - this.joystickOrigin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 60;
        
        // Clamp thumb position to base radius
        let thumbX = this.joystickOrigin.x;
        let thumbY = this.joystickOrigin.y;
        
        if (distance > 0) {
            const angle = Math.atan2(dy, dx);
            const clampedDistance = Math.min(distance, maxDistance);
            thumbX = this.joystickOrigin.x + Math.cos(angle) * clampedDistance;
            thumbY = this.joystickOrigin.y + Math.sin(angle) * clampedDistance;
        }
        
        this.joystickThumb.setPosition(thumbX, thumbY);
        
        // Update touch state based on direction (with deadzone)
        const deadzone = 15;
        this.touchState.left = dx < -deadzone;
        this.touchState.right = dx > deadzone;
        this.touchState.up = dy < -deadzone;
        this.touchState.down = dy > deadzone;
    }
    
    /**
     * Reset joystick to center
     */
    resetJoystick() {
        if (this.joystickThumb) {
            this.joystickThumb.setPosition(this.joystickOrigin.x, this.joystickOrigin.y);
        }
        this.touchState.left = false;
        this.touchState.right = false;
        this.touchState.up = false;
        this.touchState.down = false;
    }
    
    /**
     * Create action buttons (jump and attack)
     */
    createActionButtons(container, x, y) {
        // Jump button (top button)
        const jumpY = y - 70;
        this.jumpButton = this.scene.add.container(x, jumpY);
        
        const jumpCircle = this.scene.add.circle(0, 0, 40, 0x3b82f6, 0.8);
        jumpCircle.setStrokeStyle(3, 0xffffff, 1);
        this.jumpButton.add(jumpCircle);
        
        const jumpText = this.scene.add.text(0, 0, '↑', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial Bold'
        });
        jumpText.setOrigin(0.5);
        this.jumpButton.add(jumpText);
        
        // Make jump button interactive
        jumpCircle.setInteractive(new Phaser.Geom.Circle(0, 0, 40), Phaser.Geom.Circle.Contains);
        
        jumpCircle.on('pointerdown', (pointer) => {
            this.jumpPointer = pointer;
            this.touchState.jump = true;
            jumpCircle.setFillStyle(0x2563eb, 1);
        });
        
        jumpCircle.on('pointerup', () => {
            this.touchState.jump = false;
            this.jumpPointer = null;
            jumpCircle.setFillStyle(0x3b82f6, 0.8);
        });
        
        jumpCircle.on('pointerout', () => {
            this.touchState.jump = false;
            this.jumpPointer = null;
            jumpCircle.setFillStyle(0x3b82f6, 0.8);
        });
        
        container.add(this.jumpButton);
        
        // Attack button (bottom button)
        const attackY = y + 10;
        this.attackButton = this.scene.add.container(x, attackY);
        
        const attackCircle = this.scene.add.circle(0, 0, 40, 0xef4444, 0.8);
        attackCircle.setStrokeStyle(3, 0xffffff, 1);
        this.attackButton.add(attackCircle);
        
        const attackText = this.scene.add.text(0, 0, '⚔', {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'Arial Bold'
        });
        attackText.setOrigin(0.5);
        this.attackButton.add(attackText);
        
        // Make attack button interactive
        attackCircle.setInteractive(new Phaser.Geom.Circle(0, 0, 40), Phaser.Geom.Circle.Contains);
        
        attackCircle.on('pointerdown', (pointer) => {
            this.attackPointer = pointer;
            this.touchState.attack = true;
            attackCircle.setFillStyle(0xdc2626, 1);
        });
        
        attackCircle.on('pointerup', () => {
            this.touchState.attack = false;
            this.attackPointer = null;
            attackCircle.setFillStyle(0xef4444, 0.8);
        });
        
        attackCircle.on('pointerout', () => {
            this.touchState.attack = false;
            this.attackPointer = null;
            attackCircle.setFillStyle(0xef4444, 0.8);
        });
        
        container.add(this.attackButton);
    }
    
    /**
     * Get current touch input state
     */
    getTouchState() {
        return { ...this.touchState };
    }
    
    /**
     * Check if device is mobile
     */
    isMobileDevice() {
        return this.isMobile;
    }
    
    /**
     * Show or hide touch controls
     */
    showTouchControls(visible) {
        if (!this.isMobile || !this.controlsContainer) return;
        
        this.controlsVisible = visible;
        this.controlsContainer.setVisible(visible);
    }
    
    /**
     * Update touch controls (called each frame)
     */
    update() {
        // Handle continuous jump button press
        // The jump state will be read by InputHandler
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.controlsContainer) {
            this.controlsContainer.destroy();
        }
        this.joystickPointer = null;
        this.jumpPointer = null;
        this.attackPointer = null;
    }
}

export default TouchInputManager;
