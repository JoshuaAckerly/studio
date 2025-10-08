// Noteleks Heroes Beyond Light - Phaser Game
class NoteleksGame {
    constructor() {
        this.config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-game',
            backgroundColor: '#1a1a2e',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 300 },
                    debug: false
                }
            },
            scene: {
                preload: this.preload,
                create: this.create,
                update: this.update
            }
        };

        this.game = new Phaser.Game(this.config);
        this.score = 0;
        this.health = 100;
        this.gameState = 'playing'; // playing, paused, gameOver
    }

    preload() {
        // Loading screen
        this.add.text(400, 250, 'Loading Noteleks Heroes...', {
            fontSize: '24px',
            fill: '#4ade80',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Create colored rectangles as placeholders for sprites
        // Skeleton Hero (player)
        this.add.graphics()
            .fillStyle(0xffffff)
            .fillRect(0, 0, 32, 48)
            .generateTexture('skeleton', 32, 48);

        // Dagger/Weapon
        this.add.graphics()
            .fillStyle(0xc0c0c0)
            .fillRect(0, 0, 16, 4)
            .generateTexture('dagger', 16, 4);

        // Enemy (zombie/ghoul)
        this.add.graphics()
            .fillStyle(0x008000)
            .fillRect(0, 0, 32, 40)
            .generateTexture('enemy', 32, 40);

        // Ground/Platform
        this.add.graphics()
            .fillStyle(0x4a4a4a)
            .fillRect(0, 0, 64, 32)
            .generateTexture('ground', 64, 32);

        // Background elements
        this.add.graphics()
            .fillStyle(0x2d2d2d)
            .fillRect(0, 0, 800, 600)
            .generateTexture('background', 800, 600);
    }

    create() {
        // Background
        this.add.image(400, 300, 'background');

        // Create platforms/ground
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(12.5, 1).refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        // Create player (skeleton)
        this.player = this.physics.add.sprite(100, 450, 'skeleton');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);

        // Player animations (placeholder - you'll replace with actual sprites)
        this.player.setTint(0xffffff);

        // Create weapons group
        this.weapons = this.physics.add.group();

        // Create enemies group
        this.enemies = this.physics.add.group();
        this.spawnEnemy();

        // Collisions
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.overlap(this.weapons, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Mouse/touch controls for throwing
        this.input.on('pointerdown', this.throwWeapon, this);

        // UI Updates
        this.updateUI();

        // Enemy spawn timer
        this.enemyTimer = this.time.addEvent({
            delay: 3000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Player movement
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }

        // Jumping
        if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }

        // Throw weapon with spacebar
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.throwWeapon();
        }

        // Clean up weapons that are off-screen
        this.weapons.children.entries.forEach(weapon => {
            if (weapon.x > 850 || weapon.x < -50) {
                weapon.destroy();
            }
        });

        // Enemy AI - simple movement toward player
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.body.touching.down) {
                if (enemy.x < this.player.x) {
                    enemy.setVelocityX(50);
                } else {
                    enemy.setVelocityX(-50);
                }
            }
        });
    }

    throwWeapon(pointer) {
        const weapon = this.weapons.create(this.player.x, this.player.y - 10, 'dagger');
        
        if (pointer) {
            // Throw toward mouse/touch position
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
            this.physics.velocityFromAngle(angle * 180 / Math.PI, 300, weapon.body.velocity);
        } else {
            // Throw to the right (spacebar)
            weapon.setVelocityX(300);
        }
        
        weapon.setVelocityY(-50);
    }

    spawnEnemy() {
        if (this.gameState !== 'playing') return;

        const x = Phaser.Math.Between(600, 750);
        const enemy = this.enemies.create(x, 0, 'enemy');
        enemy.setBounce(0.2);
        enemy.setCollideWorldBounds(true);
        enemy.setTint(0x00ff00);

        // Give enemy some health
        enemy.health = 2;
    }

    hitEnemy(weapon, enemy) {
        weapon.destroy();
        enemy.health--;
        
        if (enemy.health <= 0) {
            enemy.destroy();
            this.score += 10;
            this.updateUI();
        } else {
            // Flash enemy when hit
            enemy.setTint(0xff0000);
            this.time.delayedCall(100, () => {
                enemy.setTint(0x00ff00);
            });
        }
    }

    hitPlayer(player, enemy) {
        enemy.destroy();
        this.health -= 20;
        this.updateUI();

        // Flash player when hit
        player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            player.setTint(0xffffff);
        });

        if (this.health <= 0) {
            this.gameOver();
        }
    }

    updateUI() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('health-value').textContent = this.health;
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.physics.pause();
        
        this.add.text(400, 300, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 350, `Final Score: ${this.score}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 400, 'Click RESTART to play again', {
            fontSize: '18px',
            fill: '#4ade80',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    restart() {
        this.score = 0;
        this.health = 100;
        this.gameState = 'playing';
        this.scene.restart();
    }

    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.physics.pause();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.physics.resume();
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new NoteleksGame();

    // Button event listeners
    document.getElementById('pause-btn').addEventListener('click', () => {
        game.pause();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        game.restart();
    });
});

// Export for potential use in other modules
window.NoteleksGame = NoteleksGame;