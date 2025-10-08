<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
        class GameScene extends Phaser.Scene {
            constructor() {
                super({ key: 'GameScene' });
                this.score = 0;
                this.health = 100;
                this.gameState = 'playing';
                this.playerFacing = 'right'; // Track which direction player is facing
                this.useSpineAnimations = false; // Toggle for Spine vs placeholder sprites
            }a name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Noteleks Heroes Beyond Light - Debug</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <script src="https://unpkg.com/@esotericsoftware/spine-phaser-v3@4.2.*/dist/iife/spine-phaser-v3.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            font-family: Arial, sans-serif;
            color: #fff;
        }
        #game-container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        #game-ui {
            display: flex;
            justify-content: space-between;
            width: 100%;
            max-width: 800px;
            margin-bottom: 10px;
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
        }
        #phaser-game {
            border: 2px solid #4ade80;
            border-radius: 10px;
            background: #000;
        }
        #game-controls {
            display: flex;
            gap: 15px;
            margin-top: 15px;
        }
        #game-controls button {
            padding: 10px 20px;
            background: #4ade80;
            border: none;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <h1>Noteleks Heroes Beyond Light - Debug Version</h1>
        <div id="game-ui">
            <div id="score">Score: <span id="score-value">0</span></div>
            <div id="health">Health: <span id="health-value">100</span></div>
        </div>
        <div id="phaser-game"></div>
        <div id="game-controls">
            <button id="pause-btn">Pause</button>
            <button id="restart-btn">Restart</button>
            <button id="spine-toggle-btn">Enable Spine Animations</button>
            <button onclick="window.location.href='{{ route('welcome') }}';">Back to Studio</button>
        </div>
    </div>

    <script>
        console.log('Starting Noteleks game...');
        console.log('Phaser version:', Phaser.VERSION);

        class GameScene extends Phaser.Scene {
            constructor() {
                super({ key: 'GameScene' });
                this.score = 0;
                this.health = 100;
                this.gameState = 'playing';
                this.playerFacing = 'right'; // Track which way player is facing
            }

            preload() {
                console.log('Preloading assets...');
                
                // Load Spine animations if available
                if (this.useSpineAnimations) {
                    // Load player character animations
                    this.load.spine('skeleton', 
                        'games/noteleks/spine/characters/skeleton.json', 
                        'games/noteleks/spine/characters/skeleton.atlas'
                    );
                    
                    // Load enemy animations
                    this.load.spine('zombie', 
                        'games/noteleks/spine/enemies/zombie.json', 
                        'games/noteleks/spine/enemies/zombie.atlas'
                    );
                    
                    this.load.spine('ghoul', 
                        'games/noteleks/spine/enemies/ghoul.json', 
                        'games/noteleks/spine/enemies/ghoul.atlas'
                    );
                    
                    console.log('Loading Spine animations...');
                }
                
                console.log('Preload complete - ready to create game objects');
            }

            create() {
                console.log('Creating game objects...');
                console.log('Spine plugin available:', !!this.add.spine);
                console.log('Spine window object:', !!window.spine);
                console.log('useSpineAnimations:', this.useSpineAnimations);

                // First, create the textures we need
                this.add.graphics()
                    .fillStyle(0xffffff)
                    .fillRect(0, 0, 32, 48)
                    .generateTexture('skeleton', 32, 48);

                this.add.graphics()
                    .fillStyle(0xc0c0c0)
                    .fillRect(0, 0, 16, 4)
                    .generateTexture('dagger', 16, 4);

                this.add.graphics()
                    .fillStyle(0x008000)
                    .fillRect(0, 0, 32, 40)
                    .generateTexture('enemy', 32, 40);

                this.add.graphics()
                    .fillStyle(0x4a4a4a)
                    .fillRect(0, 0, 64, 32)
                    .generateTexture('ground', 64, 32);

                // Add loading/welcome text
                this.add.text(400, 50, 'Noteleks Heroes Beyond Light', {
                    fontSize: '24px',
                    fill: '#4ade80',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);

                this.add.text(400, 80, 'Use WASD/Arrows to move, Space/Click to throw!', {
                    fontSize: '16px',
                    fill: '#ffffff',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);

                // Create platforms
                this.platforms = this.physics.add.staticGroup();
                this.platforms.create(400, 568, 'ground').setScale(12.5, 1).refreshBody();
                this.platforms.create(600, 400, 'ground');
                this.platforms.create(50, 250, 'ground');
                this.platforms.create(750, 220, 'ground');

                // Create player
                if (this.useSpineAnimations && this.add.spine) {
                    try {
                        // Create Spine skeleton for player
                        this.player = this.add.spine(100, 450, 'skeleton', 'idle', true);
                        this.physics.add.existing(this.player);
                        this.player.body.setBounce(0.2);
                        this.player.body.setCollideWorldBounds(true);
                        
                        // Set up Spine animations
                        this.player.setAnimation(0, 'idle', true);
                        console.log('Spine player created successfully');
                    } catch (error) {
                        console.error('Failed to create Spine player:', error);
                        // Fallback to placeholder sprite
                        this.useSpineAnimations = false;
                        this.player = this.physics.add.sprite(100, 450, 'skeleton');
                        this.player.setBounce(0.2);
                        this.player.setCollideWorldBounds(true);
                    }
                } else {
                    // Create placeholder sprite for player
                    this.player = this.physics.add.sprite(100, 450, 'skeleton');
                    this.player.setBounce(0.2);
                    this.player.setCollideWorldBounds(true);
                }
                this.physics.add.collider(this.player, this.platforms);

                // Create groups
                this.weapons = this.physics.add.group();
                this.enemies = this.physics.add.group();

                // Collisions
                this.physics.add.collider(this.enemies, this.platforms);
                this.physics.add.overlap(this.weapons, this.enemies, this.hitEnemy, null, this);
                this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);

                // Controls
                this.cursors = this.input.keyboard.createCursorKeys();
                this.wasd = this.input.keyboard.addKeys('W,S,A,D');
                this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
                this.input.on('pointerdown', this.throwWeapon, this);

                // Spawn first enemy
                this.spawnEnemy();

                // Enemy spawn timer
                this.enemyTimer = this.time.addEvent({
                    delay: 3000,
                    callback: this.spawnEnemy,
                    callbackScope: this,
                    loop: true
                });

                console.log('Game created successfully!');
                this.updateUI();
            }

            update() {
                if (this.gameState !== 'playing') return;

                // Player movement and facing direction
                if (this.cursors.left.isDown || this.wasd.A.isDown) {
                    this.player.setVelocityX(-160);
                    this.playerFacing = 'left';
                    if (this.useSpineAnimations) {
                        this.player.setScaleX(-1); // Flip Spine skeleton
                        this.playPlayerAnimation('run');
                    } else {
                        this.player.setFlipX(true); // Flip sprite
                    }
                } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
                    this.player.setVelocityX(160);
                    this.playerFacing = 'right';
                    if (this.useSpineAnimations) {
                        this.player.setScaleX(1); // Normal Spine skeleton
                        this.playPlayerAnimation('run');
                    } else {
                        this.player.setFlipX(false); // Normal sprite
                    }
                } else {
                    this.player.setVelocityX(0);
                    this.playPlayerAnimation('idle');
                }

                // Jumping
                if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.touching.down) {
                    this.player.setVelocityY(-330);
                }

                // Throw weapon
                if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                    this.throwWeapon();
                }

                // Clean up off-screen weapons
                this.weapons.children.entries.forEach(weapon => {
                    if (weapon.x > 850 || weapon.x < -50) {
                        weapon.destroy();
                    }
                });

                // Enemy AI
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

            // Helper method to play player animations
            playPlayerAnimation(animationName, loop = true) {
                if (this.useSpineAnimations && this.player.setAnimation) {
                    this.player.setAnimation(0, animationName, loop);
                }
                // For placeholder sprites, you could add sprite sheet animations here later
            }

            // Helper method to create enemies with Spine support
            createEnemy(x, y) {
                let enemy;
                if (this.useSpineAnimations && this.add.spine) {
                    try {
                        enemy = this.add.spine(x, y, 'enemy', 'walk', true);
                        this.physics.add.existing(enemy);
                        enemy.body.setBounce(0.2);
                        enemy.body.setCollideWorldBounds(true);
                        enemy.setAnimation(0, 'walk', true);
                    } catch (error) {
                        console.error('Failed to create Spine enemy:', error);
                        // Fallback to placeholder sprite
                        enemy = this.enemies.create(x, y, 'enemy');
                        enemy.setBounce(0.2);
                        enemy.setCollideWorldBounds(true);
                        enemy.setTint(0x00ff00);
                    }
                } else {
                    enemy = this.enemies.create(x, y, 'enemy');
                    enemy.setBounce(0.2);
                    enemy.setCollideWorldBounds(true);
                    enemy.setTint(0x00ff00);
                }
                enemy.health = 2;
                return enemy;
            }

            throwWeapon(pointer) {
                const weapon = this.weapons.create(this.player.x, this.player.y - 10, 'dagger');
                
                if (pointer) {
                    // Mouse/touch throwing - throw toward cursor position
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
                    this.physics.velocityFromAngle(angle * 180 / Math.PI, 300, weapon.body.velocity);
                } else {
                    // Keyboard throwing - throw in the direction player is facing
                    if (this.playerFacing === 'left') {
                        weapon.setVelocityX(-300);
                    } else {
                        weapon.setVelocityX(300);
                    }
                    weapon.setVelocityY(-50);
                }
            }

            spawnEnemy() {
                if (this.gameState !== 'playing') return;

                const x = Phaser.Math.Between(600, 750);
                const enemy = this.createEnemy(x, 0);
                
                // Add enemy to physics group for collision detection
                if (!this.useSpineAnimations) {
                    // For placeholder sprites, it's already added to the group
                } else {
                    // For Spine objects, we need to add them to the enemies group manually
                    this.enemies.add(enemy);
                }
            }

            hitEnemy(weapon, enemy) {
                weapon.destroy();
                enemy.health--;
                
                if (enemy.health <= 0) {
                    enemy.destroy();
                    this.score += 10;
                    this.updateUI();
                } else {
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
            }

            // Add button functionality
            pauseGame() {
                if (this.gameState === 'playing') {
                    this.gameState = 'paused';
                    this.physics.pause();
                } else if (this.gameState === 'paused') {
                    this.gameState = 'playing';
                    this.physics.resume();
                }
            }

            restartGame() {
                this.score = 0;
                this.health = 100;
                this.gameState = 'playing';
                this.scene.restart();
            }
        }

        class NoteleksGame {
            constructor() {
                console.log('Initializing game...');
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
                    scene: GameScene,
                    plugins: {
                        scene: typeof window.spine !== 'undefined' ? [
                            { key: 'spine.SpinePlugin', plugin: window.spine.SpinePlugin, mapping: 'spine' }
                        ] : []
                    }
                };

                this.game = new Phaser.Game(this.config);
            }
        }

        // Initialize game when page loads
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, starting game...');
            try {
                const game = new NoteleksGame();
                window.gameInstance = game;
                console.log('Game instance created:', game);

                // Wire up buttons
                document.getElementById('pause-btn').addEventListener('click', () => {
                    const scene = game.game.scene.getScene('GameScene');
                    if (scene) scene.pauseGame();
                });

                document.getElementById('restart-btn').addEventListener('click', () => {
                    const scene = game.game.scene.getScene('GameScene');
                    if (scene) scene.restartGame();
                });

                document.getElementById('spine-toggle-btn').addEventListener('click', () => {
                    const scene = game.game.scene.getScene('GameScene');
                    if (scene) {
                        // Check if Spine plugin is available
                        if (!scene.add.spine || !window.spine) {
                            alert('Spine plugin not available. Please ensure the Spine plugin loaded correctly.');
                            return;
                        }
                        
                        scene.useSpineAnimations = !scene.useSpineAnimations;
                        const btn = document.getElementById('spine-toggle-btn');
                        btn.textContent = scene.useSpineAnimations ? 'Disable Spine Animations' : 'Enable Spine Animations';
                        
                        // Restart game to apply changes
                        scene.restartGame();
                    }
                });

                document.getElementById('spine-toggle-btn').addEventListener('click', () => {
                    const scene = game.game.scene.getScene('GameScene');
                    if (scene) {
                        scene.useSpineAnimations = !scene.useSpineAnimations;
                        const btn = document.getElementById('spine-toggle-btn');
                        btn.textContent = scene.useSpineAnimations ? 'Disable Spine Animations' : 'Enable Spine Animations';
                        
                        // Restart game to apply changes
                        scene.restartGame();
                    }
                });

            } catch (error) {
                console.error('Error creating game:', error);
            }
        });
    </script>
</body>
</html>