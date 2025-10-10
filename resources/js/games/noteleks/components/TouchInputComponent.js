import Component from '../core/Component.js';

/**
 * TouchInputComponent - handles touch and mobile input
 * Provides virtual controls for mobile devices
 */
class TouchInputComponent extends Component {
    constructor(scene) {
        super();
        this.scene = scene;
        this.isMobile = this.detectMobile();
        this.isEnabled = false;
        
        // Touch input state
        this.touchState = {
            left: false,
            right: false,
            up: false,
            attack: false
        };
        
        // Virtual controls
        this.virtualControls = {
            joystick: null,
            jumpButton: null,
            attackButton: null
        };
        
        // Touch tracking
        this.activeTouches = new Map();
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickRadius = 60;
        this.joystickDeadZone = 15;
    }

    /**
     * Detect if the device is mobile
     */
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUA = /android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent);
        const isMobileDev = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4));
        
        return isMobileUA || isMobileDev || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    /**
     * Initialize touch input system
     */
    initialize() {
        console.log('TouchInputComponent: Mobile device detected:', this.isMobile);
        
        if (!this.isMobile) {
            return false; // Not a mobile device, skip touch controls
        }

        this.createVirtualControls();
        this.setupTouchEvents();
        this.isEnabled = true;
        console.log('TouchInputComponent: Touch controls initialized');
        return true;
    }

    /**
     * Create virtual control UI elements
     */
    createVirtualControls() {
        // Create HTML-based controls in the mobile controls area instead of in the game scene
        const mobileControlsArea = document.getElementById('mobile-controls-area');
        if (!mobileControlsArea) {
            console.warn('TouchInputComponent: mobile-controls-area not found, falling back to Phaser controls');
            this.createPhaserControls();
            return;
        }

        // Clear any existing controls
        mobileControlsArea.innerHTML = '';
        
        // Create HTML-based controls
        this.createHTMLJoystick(mobileControlsArea);
        this.createHTMLButtons(mobileControlsArea);
    }

    /**
     * Fallback to Phaser-based controls (old method)
     */
    createPhaserControls() {
        // Check if we're on mobile and adjust positioning
        this.calculateMobileLayout();
        
        // Virtual joystick for movement
        this.createVirtualJoystick();
        
        // Jump button
        this.createJumpButton();
        
        // Attack button
        this.createAttackButton();
    }

    /**
     * Calculate mobile layout positions
     */
    calculateMobileLayout() {
        // Detect mobile viewport and adjust control positions
        const isMobileViewport = window.innerWidth <= 768;
        
        if (isMobileViewport) {
            // On mobile, position controls in the lower area
            this.controlsAreaTop = this.scene.scale.height * 0.65;
            this.joystickY = this.controlsAreaTop + 80;
            this.jumpButtonY = this.controlsAreaTop + 60;
            this.attackButtonY = this.controlsAreaTop + 120;
        } else {
            // Desktop positioning (unchanged)
            this.controlsAreaTop = this.scene.scale.height * 0.7;
            this.joystickY = this.scene.scale.height - 100;
            this.jumpButtonY = this.scene.scale.height - 120;
            this.attackButtonY = this.scene.scale.height - 60;
        }
        
        console.log('TouchInput: Mobile layout calculated', {
            isMobileViewport,
            screenHeight: this.scene.scale.height,
            controlsAreaTop: this.controlsAreaTop
        });
    }

    /**
     * Create HTML-based joystick in the mobile controls area
     */
    createHTMLJoystick(container) {
        // Create joystick container
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'virtual-joystick';
        joystickContainer.style.cssText = `
            position: absolute;
            left: 30px;
            top: 50%;
            transform: translateY(-50%);
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, rgba(51,51,51,0.8) 0%, rgba(26,26,26,0.8) 100%);
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            cursor: pointer;
            user-select: none;
            z-index: 10;
        `;

        // Create joystick knob
        const joystickKnob = document.createElement('div');
        joystickKnob.id = 'virtual-joystick-knob';
        joystickKnob.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            background: radial-gradient(circle, #4ade80 0%, #22c55e 100%);
            border: 2px solid rgba(255,255,255,0.8);
            border-radius: 50%;
            transition: all 0.1s ease;
        `;

        joystickContainer.appendChild(joystickKnob);
        container.appendChild(joystickContainer);

        // Store references
        this.virtualControls.joystick = joystickContainer;
        this.virtualControls.joystickKnob = joystickKnob;

        // Setup joystick interaction
        this.setupJoystickEvents(joystickContainer, joystickKnob);
    }

    /**
     * Create HTML-based action buttons
     */
    createHTMLButtons(container) {
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            position: absolute;
            right: 30px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 20px;
            z-index: 10;
        `;

        // Jump button
        const jumpButton = document.createElement('button');
        jumpButton.id = 'virtual-jump-btn';
        jumpButton.textContent = 'JUMP';
        jumpButton.style.cssText = `
            width: 80px;
            height: 80px;
            background: linear-gradient(145deg, #ef4444, #dc2626);
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            color: white;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            user-select: none;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            transition: all 0.1s ease;
        `;

        // Attack button
        const attackButton = document.createElement('button');
        attackButton.id = 'virtual-attack-btn';
        attackButton.textContent = 'ATTACK';
        attackButton.style.cssText = `
            width: 80px;
            height: 80px;
            background: linear-gradient(145deg, #3b82f6, #2563eb);
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            color: white;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            user-select: none;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            transition: all 0.1s ease;
        `;

        buttonsContainer.appendChild(jumpButton);
        buttonsContainer.appendChild(attackButton);
        container.appendChild(buttonsContainer);

        // Store references
        this.virtualControls.jumpButton = jumpButton;
        this.virtualControls.attackButton = attackButton;

        // Setup button events
        this.setupButtonEvents(jumpButton, attackButton);
    }

    /**
     * Create virtual joystick (legacy Phaser method)
     */
    createVirtualJoystick() {
        // Position joystick in the mobile controls area (below game screen)
        const joystickX = 100;
        const joystickY = this.joystickY || this.scene.scale.height * 0.75;
        
        // Joystick base
        this.virtualControls.joystickBase = this.scene.add.graphics();
        this.virtualControls.joystickBase.fillStyle(0x333333, 0.5);
        this.virtualControls.joystickBase.fillCircle(joystickX, joystickY, this.joystickRadius);
        this.virtualControls.joystickBase.lineStyle(3, 0xffffff, 0.8);
        this.virtualControls.joystickBase.strokeCircle(joystickX, joystickY, this.joystickRadius);
        this.virtualControls.joystickBase.setScrollFactor(0);
        this.virtualControls.joystickBase.setDepth(2000);
        
        // Joystick knob
        this.virtualControls.joystickKnob = this.scene.add.graphics();
        this.virtualControls.joystickKnob.fillStyle(0x4ade80, 0.8);
        this.virtualControls.joystickKnob.fillCircle(joystickX, joystickY, 25);
        this.virtualControls.joystickKnob.lineStyle(2, 0xffffff, 1);
        this.virtualControls.joystickKnob.strokeCircle(joystickX, joystickY, 25);
        this.virtualControls.joystickKnob.setScrollFactor(0);
        this.virtualControls.joystickKnob.setDepth(2001);
        
        this.joystickCenter = { x: joystickX, y: joystickY };
        this.virtualControls.joystickKnobPos = { x: joystickX, y: joystickY };
    }

    /**
     * Create jump button
     */
    createJumpButton() {
        const buttonX = this.scene.scale.width - 120;
        const buttonY = this.jumpButtonY || this.scene.scale.height * 0.70;
        
        this.virtualControls.jumpButton = this.scene.add.graphics();
        this.virtualControls.jumpButton.fillStyle(0x4ade80, 0.7);
        this.virtualControls.jumpButton.fillRoundedRect(buttonX - 40, buttonY - 20, 80, 40, 20);
        this.virtualControls.jumpButton.lineStyle(2, 0xffffff, 1);
        this.virtualControls.jumpButton.strokeRoundedRect(buttonX - 40, buttonY - 20, 80, 40, 20);
        this.virtualControls.jumpButton.setScrollFactor(0);
        this.virtualControls.jumpButton.setDepth(2000);
        
        // Jump button text
        this.virtualControls.jumpText = this.scene.add.text(buttonX, buttonY, 'JUMP', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial Bold',
            align: 'center'
        });
        this.virtualControls.jumpText.setOrigin(0.5);
        this.virtualControls.jumpText.setScrollFactor(0);
        this.virtualControls.jumpText.setDepth(2001);
        
        this.virtualControls.jumpButtonBounds = {
            x: buttonX - 40,
            y: buttonY - 20,
            width: 80,
            height: 40
        };
    }

    /**
     * Create attack button
     */
    createAttackButton() {
        const buttonX = this.scene.scale.width - 120;
        const buttonY = this.attackButtonY || this.scene.scale.height * 0.80;
        
        this.virtualControls.attackButton = this.scene.add.graphics();
        this.virtualControls.attackButton.fillStyle(0xff4444, 0.7);
        this.virtualControls.attackButton.fillRoundedRect(buttonX - 40, buttonY - 20, 80, 40, 20);
        this.virtualControls.attackButton.lineStyle(2, 0xffffff, 1);
        this.virtualControls.attackButton.strokeRoundedRect(buttonX - 40, buttonY - 20, 80, 40, 20);
        this.virtualControls.attackButton.setScrollFactor(0);
        this.virtualControls.attackButton.setDepth(2000);
        
        // Attack button text
        this.virtualControls.attackText = this.scene.add.text(buttonX, buttonY, 'ATTACK', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial Bold',
            align: 'center'
        });
        this.virtualControls.attackText.setOrigin(0.5);
        this.virtualControls.attackText.setScrollFactor(0);
        this.virtualControls.attackText.setDepth(2001);
        
        this.virtualControls.attackButtonBounds = {
            x: buttonX - 40,
            y: buttonY - 20,
            width: 80,
            height: 40
        };
    }

    /**
     * Setup joystick events for HTML element
     */
    setupJoystickEvents(joystickContainer, joystickKnob) {
        let isDragging = false;
        let centerX = 60; // Half of container width
        let centerY = 60; // Half of container height
        const maxDistance = 35; // Maximum distance from center

        const handleStart = (e) => {
            e.preventDefault();
            isDragging = true;
            joystickContainer.style.opacity = '1';
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const rect = joystickContainer.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            let deltaX = clientX - rect.left - centerX;
            let deltaY = clientY - rect.top - centerY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }
            
            joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            // Update touch state
            const normalizedX = deltaX / maxDistance;
            const normalizedY = deltaY / maxDistance;
            
            this.touchState.left = normalizedX < -0.3;
            this.touchState.right = normalizedX > 0.3;
            this.touchState.up = normalizedY < -0.3;
            this.touchState.down = normalizedY > 0.3;
        };

        const handleEnd = (e) => {
            e.preventDefault();
            isDragging = false;
            joystickKnob.style.transform = 'translate(0px, 0px)';
            joystickContainer.style.opacity = '0.8';
            
            // Reset movement state
            this.touchState.left = false;
            this.touchState.right = false;
            this.touchState.up = false;
            this.touchState.down = false;
        };

        // Touch events
        joystickContainer.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd, { passive: false });
        
        // Mouse events for testing
        joystickContainer.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }

    /**
     * Setup button events for HTML elements
     */
    setupButtonEvents(jumpButton, attackButton) {
        // Jump button events
        const handleJumpStart = (e) => {
            e.preventDefault();
            this.touchState.up = true;
            jumpButton.style.transform = 'scale(0.95)';
            jumpButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
        };

        const handleJumpEnd = (e) => {
            e.preventDefault();
            this.touchState.up = false;
            jumpButton.style.transform = 'scale(1)';
            jumpButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        };

        jumpButton.addEventListener('touchstart', handleJumpStart, { passive: false });
        jumpButton.addEventListener('touchend', handleJumpEnd, { passive: false });
        jumpButton.addEventListener('mousedown', handleJumpStart);
        jumpButton.addEventListener('mouseup', handleJumpEnd);

        // Attack button events
        const handleAttackStart = (e) => {
            e.preventDefault();
            this.touchState.attack = true;
            attackButton.style.transform = 'scale(0.95)';
            attackButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
        };

        const handleAttackEnd = (e) => {
            e.preventDefault();
            this.touchState.attack = false;
            attackButton.style.transform = 'scale(1)';
            attackButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        };

        attackButton.addEventListener('touchstart', handleAttackStart, { passive: false });
        attackButton.addEventListener('touchend', handleAttackEnd, { passive: false });
        attackButton.addEventListener('mousedown', handleAttackStart);
        attackButton.addEventListener('mouseup', handleAttackEnd);
    }

    /**
     * Setup touch event handlers (legacy Phaser method)
     */
    setupTouchEvents() {
        this.scene.input.on('pointerdown', this.handleTouchStart.bind(this));
        this.scene.input.on('pointermove', this.handleTouchMove.bind(this));
        this.scene.input.on('pointerup', this.handleTouchEnd.bind(this));
    }

    /**
     * Handle touch start
     */
    handleTouchStart(pointer) {
        if (!this.isEnabled) return;

        const touchX = pointer.x;
        const touchY = pointer.y;
        
        // Check joystick area
        const joystickDistance = Phaser.Math.Distance.Between(
            touchX, touchY, 
            this.joystickCenter.x, this.joystickCenter.y
        );
        
        if (joystickDistance <= this.joystickRadius) {
            this.activeTouches.set(pointer.id, { type: 'joystick', pointer });
            this.updateJoystick(pointer);
            return;
        }
        
        // Check jump button
        if (this.isPointInBounds(touchX, touchY, this.virtualControls.jumpButtonBounds)) {
            this.activeTouches.set(pointer.id, { type: 'jump', pointer });
            this.touchState.up = true;
            this.highlightButton(this.virtualControls.jumpButton, 0x6ade80);
            console.log('TouchInput: JUMP button pressed');
            return;
        }
        
        // Check attack button
        if (this.isPointInBounds(touchX, touchY, this.virtualControls.attackButtonBounds)) {
            this.activeTouches.set(pointer.id, { type: 'attack', pointer });
            this.touchState.attack = true;
            this.highlightButton(this.virtualControls.attackButton, 0xff6666);
            this.triggerAttack(pointer);
            console.log('TouchInput: ATTACK button pressed');
            return;
        }
        
        // If touch is in the right half of screen (not on controls), treat as attack
        if (touchX > this.scene.scale.width / 2 && 
            !this.isPointInBounds(touchX, touchY, this.virtualControls.jumpButtonBounds) &&
            !this.isPointInBounds(touchX, touchY, this.virtualControls.attackButtonBounds)) {
            this.activeTouches.set(pointer.id, { type: 'screen-attack', pointer });
            this.touchState.attack = true;
            this.triggerAttack(pointer);
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(pointer) {
        if (!this.isEnabled) return;

        const touch = this.activeTouches.get(pointer.id);
        if (!touch) return;
        
        if (touch.type === 'joystick') {
            this.updateJoystick(pointer);
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(pointer) {
        if (!this.isEnabled) return;

        const touch = this.activeTouches.get(pointer.id);
        if (!touch) return;
        
        switch (touch.type) {
            case 'joystick':
                this.resetJoystick();
                this.touchState.left = false;
                this.touchState.right = false;
                break;
                
            case 'jump':
                this.touchState.up = false;
                this.resetButton(this.virtualControls.jumpButton, 0x4ade80);
                break;
                
            case 'attack':
            case 'screen-attack':
                this.touchState.attack = false;
                if (touch.type === 'attack') {
                    this.resetButton(this.virtualControls.attackButton, 0xff4444);
                }
                break;
        }
        
        this.activeTouches.delete(pointer.id);
    }

    /**
     * Update joystick position and state
     */
    updateJoystick(pointer) {
        const touchX = pointer.x;
        const touchY = pointer.y;
        
        let deltaX = touchX - this.joystickCenter.x;
        let deltaY = touchY - this.joystickCenter.y;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Constrain to joystick radius
        if (distance > this.joystickRadius - 25) {
            const angle = Math.atan2(deltaY, deltaX);
            deltaX = Math.cos(angle) * (this.joystickRadius - 25);
            deltaY = Math.sin(angle) * (this.joystickRadius - 25);
        }
        
        // Update knob position
        const knobX = this.joystickCenter.x + deltaX;
        const knobY = this.joystickCenter.y + deltaY;
        
        this.virtualControls.joystickKnob.clear();
        this.virtualControls.joystickKnob.fillStyle(0x4ade80, 0.8);
        this.virtualControls.joystickKnob.fillCircle(knobX, knobY, 25);
        this.virtualControls.joystickKnob.lineStyle(2, 0xffffff, 1);
        this.virtualControls.joystickKnob.strokeCircle(knobX, knobY, 25);
        
        // Update movement state
        if (Math.abs(deltaX) > this.joystickDeadZone) {
            this.touchState.left = deltaX < 0;
            this.touchState.right = deltaX > 0;
            console.log('TouchInput: Movement -', this.touchState.left ? 'LEFT' : 'RIGHT');
        } else {
            this.touchState.left = false;
            this.touchState.right = false;
        }
    }

    /**
     * Reset joystick to center
     */
    resetJoystick() {
        this.virtualControls.joystickKnob.clear();
        this.virtualControls.joystickKnob.fillStyle(0x4ade80, 0.8);
        this.virtualControls.joystickKnob.fillCircle(this.joystickCenter.x, this.joystickCenter.y, 25);
        this.virtualControls.joystickKnob.lineStyle(2, 0xffffff, 1);
        this.virtualControls.joystickKnob.strokeCircle(this.joystickCenter.x, this.joystickCenter.y, 25);
    }

    /**
     * Trigger attack through scene's input system
     */
    triggerAttack(pointer) {
        // Manually trigger the attack event through the scene's input system
        // This simulates a pointer event that the InputManager can handle
        if (this.scene && this.scene.inputManager) {
            const attackHandler = this.scene.inputManager.inputHandlers.get('attack');
            if (attackHandler) {
                attackHandler(pointer);
            }
        }
    }

    /**
     * Check if point is within bounds
     */
    isPointInBounds(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.width &&
               y >= bounds.y && y <= bounds.y + bounds.height;
    }

    /**
     * Highlight button on press
     */
    highlightButton(button, color) {
        // This would be enhanced with proper button highlighting
        // For now, just a simple approach
    }

    /**
     * Reset button appearance
     */
    resetButton(button, color) {
        // Reset button to normal appearance
    }

    /**
     * Get current touch input state
     */
    getTouchState() {
        return { ...this.touchState };
    }

    /**
     * Check if mobile device
     */
    isMobileDevice() {
        return this.isMobile;
    }

    /**
     * Show/hide virtual controls
     */
    setVisible(visible) {
        if (!this.isEnabled) return;

        const alpha = visible ? 1 : 0;
        
        Object.values(this.virtualControls).forEach(control => {
            if (control && control.setAlpha) {
                control.setAlpha(alpha);
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.activeTouches.clear();
        
        // Remove touch event listeners
        if (this.scene.input) {
            this.scene.input.off('pointerdown', this.handleTouchStart);
            this.scene.input.off('pointermove', this.handleTouchMove);
            this.scene.input.off('pointerup', this.handleTouchEnd);
        }
        
        // Destroy virtual controls
        Object.values(this.virtualControls).forEach(control => {
            if (control && control.destroy) {
                control.destroy();
            }
        });
        
        this.isEnabled = false;
    }
}

export default TouchInputComponent;