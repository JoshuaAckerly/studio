/* global Phaser */
import DebugUtils from './utils/DebugUtils.js';
/**
 * GameUI class manages all user interface elements
 */
class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.health = 100;
        this.maxHealth = 100;

        this.initializeUI();
    }

    initializeUI() {
        // Score display
        this.scoreText = this.scene.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#4ade80',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2,
        });
        this.scoreText.setScrollFactor(0); // Fixed position
        this.scoreText.setDepth(1000); // Ensure UI is on top

        // Health label
        this.healthLabel = this.scene.add.text(16, 50, 'Health', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 1,
        });
        this.healthLabel.setScrollFactor(0);
        this.healthLabel.setDepth(1000);

        // Health bar background (moved down to make room for label)
        this.healthBarBg = this.scene.add.graphics();
        this.healthBarBg.fillStyle(0x333333); // Darker gray for better visibility
        this.healthBarBg.fillRect(16, 70, 204, 20); // Adjusted position and made thinner
        this.healthBarBg.lineStyle(2, 0xffffff); // White border
        this.healthBarBg.strokeRect(16, 70, 204, 20);
        this.healthBarBg.setScrollFactor(0);
        this.healthBarBg.setDepth(1000); // Ensure it's on top

        // Health bar
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setScrollFactor(0);
        this.healthBar.setDepth(1001); // Higher than background
        this.updateHealthBar(); // Update after setting scroll factor

        // Weapon indicator
        this.weaponText = this.scene.add.text(16, 100, 'Weapon: Dagger', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2,
        });
        this.weaponText.setScrollFactor(0);
        this.weaponText.setDepth(1000);

        // Game over screen (initially hidden)
    this.gameOverContainer = this.scene.add.container(400, 300);
    // Ensure Game Over UI is on top of all other UI and game objects
    // UI elements use depth ~1000; set the container higher so it always renders above.
    this.gameOverContainer.setDepth(2000);
    this.gameOverContainer.setScrollFactor(0);
    this.gameOverContainer.setVisible(false);

        this.createGameOverScreen();

        // Update DOM elements as well
        this.updateDOMElements();

        // Create mobile UI elements if needed
        this.createMobileUIElements();
    }

    createMobileUIElements() {
        // Check if we're on mobile
        const isMobile = this.detectMobile();

        if (isMobile) {
            // Create pause button for mobile
            this.mobilePauseButton = this.scene.add.graphics();
            this.mobilePauseButton.fillStyle(0x333333, 0.8);
            this.mobilePauseButton.fillRoundedRect(this.scene.scale.width - 60, 10, 50, 30, 5);
            this.mobilePauseButton.lineStyle(2, 0xffffff, 1);
            this.mobilePauseButton.strokeRoundedRect(this.scene.scale.width - 60, 10, 50, 30, 5);
            this.mobilePauseButton.setScrollFactor(0);
            this.mobilePauseButton.setDepth(1000);
            this.mobilePauseButton.setInteractive(new Phaser.Geom.Rectangle(this.scene.scale.width - 60, 10, 50, 30), Phaser.Geom.Rectangle.Contains);

            // Pause button text
            this.mobilePauseText = this.scene.add.text(this.scene.scale.width - 35, 25, '⏸', {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Arial',
            });
            this.mobilePauseText.setOrigin(0.5);
            this.mobilePauseText.setScrollFactor(0);
            this.mobilePauseText.setDepth(1001);

            // Handle pause button tap
            this.mobilePauseButton.on('pointerdown', () => {
                if (this.scene.gameState === 'playing') {
                    this.scene.pauseGame();
                } else if (this.scene.gameState === 'paused') {
                    this.scene.resumeGame();
                }
            });
        }
    }

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

    createGameOverScreen() {
        // Background
        const gameOverBg = this.scene.add.graphics();
        gameOverBg.fillStyle(0x000000, 0.8);
        gameOverBg.fillRect(-300, -200, 600, 400);
        this.gameOverContainer.add(gameOverBg);

        // Game Over text
        const gameOverText = this.scene.add.text(0, -100, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 3,
        });
        gameOverText.setOrigin(0.5);
        this.gameOverContainer.add(gameOverText);

        // Final score text
        this.finalScoreText = this.scene.add.text(0, -30, 'Final Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2,
        });
        this.finalScoreText.setOrigin(0.5);
        this.gameOverContainer.add(this.finalScoreText);

        // Instructions
        const isMobile = this.detectMobile();
        const instructionText = isMobile ? 'Tap to restart or use browser back to quit' : 'Press R to restart or ESC to quit';

        const instructionsText = this.scene.add.text(0, 30, instructionText, {
            fontSize: '18px',
            fill: '#4ade80',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center',
        });
        instructionsText.setOrigin(0.5);
        this.gameOverContainer.add(instructionsText);

        // Add mobile restart button
        if (isMobile) {
            const restartButton = this.scene.add.graphics();
            restartButton.fillStyle(0x4ade80, 0.8);
            restartButton.fillRoundedRect(-80, 60, 160, 40, 10);
            restartButton.lineStyle(2, 0xffffff, 1);
            restartButton.strokeRoundedRect(-80, 60, 160, 40, 10);
            this.gameOverContainer.add(restartButton);

            const restartText = this.scene.add.text(0, 80, 'RESTART', {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Arial Bold',
                align: 'center',
            });
            restartText.setOrigin(0.5);
            this.gameOverContainer.add(restartText);

            // Make button interactive
            restartButton.setInteractive(new Phaser.Geom.Rectangle(-80, 60, 160, 40), Phaser.Geom.Rectangle.Contains);
            restartButton.on('pointerdown', () => {
                this.scene.restartGame();
            });
        }
    }

    updateScore(newScore) {
        this.score = newScore;
        this.scoreText.setText(`Score: ${this.score}`);
        this.updateDOMElements();
    }

    addScore(points) {
        this.score += points;
        this.updateScore(this.score);
    }

    updateHealth(newHealth) {
        this.health = Math.max(0, Math.min(this.maxHealth, newHealth));
        this.updateHealthBar();
        this.updateDOMElements();

        // Flash effect on health bar when health is low
        if (this.health <= 25) {
            this.scene.tweens.add({
                targets: this.healthBar,
                alpha: 0.5,
                duration: 200,
                yoyo: true,
                repeat: -1,
            });
        } else {
            this.scene.tweens.killTweensOf(this.healthBar);
            this.healthBar.setAlpha(1);
        }
    }

    takeDamage(damage) {
        this.updateHealth(this.health - damage);
        return this.health <= 0;
    }

    updateHealthBar() {
        this.healthBar.clear();

        // Health bar fill
        const healthPercent = this.health / this.maxHealth;
        const barWidth = 200 * healthPercent;

        // Color based on health level
        let color = 0x00ff00; // Green
        if (healthPercent < 0.5) color = 0xffff00; // Yellow
        if (healthPercent < 0.25) color = 0xff0000; // Red

        // Draw the health bar fill
        this.healthBar.fillStyle(color);
        this.healthBar.fillRect(18, 72, barWidth, 16); // Adjusted to match new background position

        // Add a white border around the health bar for visibility
        this.healthBar.lineStyle(2, 0xffffff);
        this.healthBar.strokeRect(18, 72, 200, 16);
    }

    updateWeapon(weaponType) {
        this.weaponText.setText(`Weapon: ${weaponType.charAt(0).toUpperCase() + weaponType.slice(1)}`);
    }

    showGameOver() {
        this.finalScoreText.setText(`Final Score: ${this.score}`);
        this.gameOverContainer.setVisible(true);

        // Animate game over screen
        this.gameOverContainer.setScale(0);
        this.scene.tweens.add({
            targets: this.gameOverContainer,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Bounce.easeOut',
        });
    }

    hideGameOver() {
        this.gameOverContainer.setVisible(false);
    }

    showPauseScreen() {
        // Simple pause indicator
        if (!this.pauseText) {
            const isMobile = this.detectMobile();
            const pauseMessage = isMobile ? 'PAUSED\nTap pause button to resume' : 'PAUSED\nPress P to resume';

            this.pauseText = this.scene.add.text(400, 300, pauseMessage, {
                fontSize: '36px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3,
            });
            this.pauseText.setOrigin(0.5);
            this.pauseText.setScrollFactor(0);
        }
        this.pauseText.setVisible(true);

        // Hide touch controls when paused
        if (this.scene.inputManager && this.scene.inputManager.isMobileDevice()) {
            this.scene.inputManager.showTouchControls(false);
        }
    }

    hidePauseScreen() {
        if (this.pauseText) {
            this.pauseText.setVisible(false);
        }

        // Show touch controls when unpaused
        if (this.scene.inputManager && this.scene.inputManager.isMobileDevice()) {
            this.scene.inputManager.showTouchControls(true);
        }
    }

    updateDOMElements() {
        // Only perform DOM sync when explicitly enabled in config (keeps UI in-canvas by default)
        try {
            if (!DebugUtils.shouldSyncDOM()) return;
        } catch (e) {
            return;
        }

        // Update DOM elements if they exist
        const scoreElement = document.getElementById('score-value');

        if (scoreElement) scoreElement.textContent = this.score;
    }

    reset() {
        this.score = 0;
        this.health = this.maxHealth;
        this.updateScore(0);
        this.updateHealth(this.maxHealth);
        this.hideGameOver();
        this.hidePauseScreen();
    }

    getScore() {
        return this.score;
    }

    getHealth() {
        return this.health;
    }
}

export default GameUI;
