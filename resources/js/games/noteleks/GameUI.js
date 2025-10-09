/* global Phaser */

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
            strokeThickness: 2
        });
        this.scoreText.setScrollFactor(0); // Fixed position
        
        // Health display
        this.healthText = this.scene.add.text(16, 50, 'Health: 100', {
            fontSize: '24px',
            fill: '#ff4444',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.healthText.setScrollFactor(0);
        
        // Health bar background
        this.healthBarBg = this.scene.add.graphics();
        this.healthBarBg.fillStyle(0x000000);
        this.healthBarBg.fillRect(16, 80, 204, 24);
        this.healthBarBg.setScrollFactor(0);
        
        // Health bar
        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar();
        this.healthBar.setScrollFactor(0);
        
        // Weapon indicator
        this.weaponText = this.scene.add.text(16, 120, 'Weapon: Dagger', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.weaponText.setScrollFactor(0);
        
        // Game over screen (initially hidden)
        this.gameOverContainer = this.scene.add.container(400, 300);
        this.gameOverContainer.setScrollFactor(0);
        this.gameOverContainer.setVisible(false);
        
        this.createGameOverScreen();
        
        // Update DOM elements as well
        this.updateDOMElements();
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
            strokeThickness: 3
        });
        gameOverText.setOrigin(0.5);
        this.gameOverContainer.add(gameOverText);
        
        // Final score text
        this.finalScoreText = this.scene.add.text(0, -30, 'Final Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.finalScoreText.setOrigin(0.5);
        this.gameOverContainer.add(this.finalScoreText);
        
        // Instructions
        const instructionsText = this.scene.add.text(0, 30, 'Press R to restart or ESC to quit', {
            fontSize: '18px',
            fill: '#4ade80',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        instructionsText.setOrigin(0.5);
        this.gameOverContainer.add(instructionsText);
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
        this.healthText.setText(`Health: ${this.health}`);
        this.updateHealthBar();
        this.updateDOMElements();
        
        // Flash effect when health is low
        if (this.health <= 25) {
            this.healthText.setFill('#ff0000');
            this.scene.tweens.add({
                targets: this.healthText,
                alpha: 0.5,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        } else {
            this.healthText.setFill('#ff4444');
            this.scene.tweens.killTweensOf(this.healthText);
            this.healthText.setAlpha(1);
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
        
        this.healthBar.fillStyle(color);
        this.healthBar.fillRect(18, 82, barWidth, 20);
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
            ease: 'Bounce.easeOut'
        });
    }

    hideGameOver() {
        this.gameOverContainer.setVisible(false);
    }

    showPauseScreen() {
        // Simple pause indicator
        if (!this.pauseText) {
            this.pauseText = this.scene.add.text(400, 300, 'PAUSED\nPress P to resume', {
                fontSize: '36px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            });
            this.pauseText.setOrigin(0.5);
            this.pauseText.setScrollFactor(0);
        }
        this.pauseText.setVisible(true);
    }

    hidePauseScreen() {
        if (this.pauseText) {
            this.pauseText.setVisible(false);
        }
    }

    updateDOMElements() {
        // Update DOM elements if they exist
        const scoreElement = document.getElementById('score-value');
        const healthElement = document.getElementById('health-value');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (healthElement) healthElement.textContent = this.health;
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