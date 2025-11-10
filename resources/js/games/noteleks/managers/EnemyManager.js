import GameConfig from '../config/GameConfig.js';
// import { MathUtils } from '../utils/GameUtils.js';

/**
 * Enemy Manager
 * Handles enemy spawning, lifecycle, and behavior coordination
 */
export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.config = GameConfig.enemies;
        this.enemies = null;
        this.spawnTimer = null;
        this.spawnCount = 0;
    }

    initialize() {
        // Create enemies physics group
        this.enemies = this.scene.physics.add.group();

        // Start spawning enemies
        this.startSpawning();
    }

    startSpawning() {
        this.spawnTimer = this.scene.time.addEvent({
            delay: this.config.spawnInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true,
        });

        // Spawn first enemy immediately
        this.spawnEnemy();
    }

    stopSpawning() {
        if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
        }
    }

    spawnEnemy() {
        if (this.scene.gameState !== 'playing') return;

        const spawnPosition = this.calculateSpawnPosition();
        const enemyType = this.selectEnemyType();

        // Create enemy using EntityFactory
        const enemy = this.scene.entityFactory.createEnemy(spawnPosition.x, spawnPosition.y, enemyType);

        // Add to system manager and physics group
        this.scene.systemManager.addGameObject(enemy);
        this.enemies.add(enemy.getSprite());

        this.spawnCount++;
    }

    calculateSpawnPosition() {
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        const { minFromEdge, maxFromEdge } = this.config.spawnDistance;

        // Spawn on either left or right side of screen
        const spawnSide = Math.random() < 0.5 ? 'left' : 'right';

        const x =
            spawnSide === 'left'
                ? Phaser.Math.Between(minFromEdge, screenWidth * 0.3)
                : Phaser.Math.Between(screenWidth * 0.6, screenWidth - minFromEdge);

        // Spawn near ground level
        const y = screenHeight - maxFromEdge;

        return { x, y };
    }

    selectEnemyType() {
        const score = this.scene.gameUI ? this.scene.gameUI.getScore() : 0;

        // Boss spawn chance at high scores
        if (score > 500 && Math.random() < 0.1) {
            return 'boss';
        }

        // Progressive enemy types based on score
        if (score > 300) {
            const types = ['zombie', 'skeleton', 'ghost'];
            return Phaser.Utils.Array.GetRandom(types);
        } else if (score > 100) {
            const types = ['zombie', 'skeleton'];
            return Phaser.Utils.Array.GetRandom(types);
        }

        return 'zombie';
    }

    update(player) {
        // Update all enemies
        this.enemies.children.entries.forEach((enemySprite) => {
            const enemy = enemySprite.enemyRef;
            if (enemy && enemy.update) {
                enemy.update(player);
            }
        });
    }

    setupCollisions(player, weaponManager) {
        // Player vs enemies collision
        if (player && player.getSprite()) {
            this.scene.physics.add.overlap(player.getSprite(), this.enemies, this.handlePlayerEnemyCollision.bind(this), null, this.scene);
        }

        // Weapons vs enemies collision
        if (weaponManager) {
            weaponManager.setupEnemyCollisions(this.enemies);
        }
    }

    handlePlayerEnemyCollision(playerSprite, enemySprite) {
        const enemy = enemySprite.enemyRef;
        const player = playerSprite.playerRef;

        if (!enemy || !player) return;

        // Player takes damage
        const damageResult = player.takeDamage(enemy.getDamageAmount());

        // Update UI with current health
        if (this.scene.gameUI) {
            this.scene.gameUI.updateHealth(player.getHealth());
        }

        // Remove enemy
        this.removeEnemy(enemy);

        // Check for game over
        if (damageResult.died) {
            this.scene.gameOver();
        }
    }

    removeEnemy(enemy) {
        // Remove from system manager
        this.scene.systemManager.removeGameObject(enemy);

        // Remove from physics group
        if (enemy.getSprite()) {
            this.enemies.remove(enemy.getSprite());
        }

        // Destroy the enemy
        enemy.destroy();
    }

    clearAllEnemies() {
        this.enemies.children.entries.forEach((enemySprite) => {
            const enemy = enemySprite.enemyRef;
            if (enemy) {
                this.removeEnemy(enemy);
            }
        });

        this.enemies.clear(true, true);
    }

    getEnemyCount() {
        return this.enemies.children.entries.length;
    }

    getTotalSpawned() {
        return this.spawnCount;
    }

    reset() {
        this.stopSpawning();
        this.clearAllEnemies();
        this.spawnCount = 0;
        this.startSpawning();
    }

    shutdown() {
        this.stopSpawning();
        this.clearAllEnemies();
    }
}

export default EnemyManager;
