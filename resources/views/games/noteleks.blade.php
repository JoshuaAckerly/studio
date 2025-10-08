<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Noteleks Heroes Beyond Light - {{ config('app.name') }}</title>
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
        #game-info {
            margin-top: 2rem;
            max-width: 800px;
            padding: 1.5rem;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <h1>Noteleks Heroes Beyond Light</h1>
        <div id="game-ui">
            <div id="score">Score: <span id="score-value">0</span></div>
            <div id="health">Health: <span id="health-value">100</span></div>
        </div>
        <div id="phaser-game"></div>
        <div id="game-controls">
            <button id="pause-btn">Pause</button>
            <button id="restart-btn">Restart</button>
            <button onclick="window.location.href='{{ route('welcome') }}'">Back to Studio</button>
        </div>
    </div>

    <div id="game-info">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">About Noteleks Heroes Beyond Light</h2>
        <p style="margin-bottom: 1rem;">
            A recreation of my original mobile game, now playable in your browser with advanced Spine 2D animations.
            Control Noteleks as you battle through graveyard enemies with an arsenal of weapons.
        </p>
        <p><strong>Controls:</strong> WASD/Arrows to move, Space/Click to attack, Up/W to jump</p>
    </div>

    <script>
        console.log('Starting Noteleks game...');

        class GameScene extends Phaser.Scene {
            constructor() {
                super({ key: 'GameScene' });
                this.score = 0;
                this.health = 100;
                this.gameState = 'playing';
                this.playerFacing = 'right';
                this.useSpineAnimations = true; // Enable Spine animations by default
            }

            preload() {
                // Load Spine animations
                if (this.useSpineAnimations) {
                    this.load.spineAtlas('noteleks-atlas', '/games/noteleks/spine/characters/Noteleks.atlas');
                    this.load.spineJson('noteleks-data', '/games/noteleks/spine/characters/Noteleks.json');
                }
            }

            create() {
                // Create basic game textures
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

                // Add game title
                this.add.text(400, 50, 'Noteleks Heroes Beyond Light', {
                    fontSize: '24px',
                    fill: '#4ade80',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);

                this.add.text(400, 80, 'Use WASD/Arrows to move, Space/Click to attack!', {
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

                // Create player with Spine animations
                this.createPlayer();
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

                this.updateUI();
            }

            createPlayer() {
                if (this.useSpineAnimations && this.add.spine) {
                    try {
                        this.player = this.add.spine(100, 450, 'noteleks-data', 'noteleks-atlas');
                        this.physics.add.existing(this.player);
                        this.player.body.setBounce(0.2);
                        this.player.body.setCollideWorldBounds(true);
                        this.player.setScale(0.05);
                        
                        // Store available animations
                        if (this.player.skeleton && this.player.skeleton.data && this.player.skeleton.data.animations) {
                            this.availableAnimations = this.player.skeleton.data.animations.map(a => a.name);
                            
                            // Set default animation
                            if (this.availableAnimations.length > 0) {
                                const defaultAnim = this.availableAnimations[0];
                                this.player.animationState.setAnimation(0, defaultAnim, true);
                                this.currentAnimation = defaultAnim;
                            }
                        }
                    } catch (error) {
                        console.error('Failed to create Spine player, falling back to placeholder:', error);
                        this.useSpineAnimations = false;
                        this.createPlaceholderPlayer();
                    }
                } else {
                    this.createPlaceholderPlayer();
                }
            }

            createPlaceholderPlayer() {
                this.player = this.physics.add.sprite(100, 450, 'skeleton');
                this.player.setBounce(0.2);
                this.player.setCollideWorldBounds(true);
            }

            update() {
                if (this.gameState !== 'playing') return;

                // Player movement (only if not attacking)
                if (this.cursors.left.isDown || this.wasd.A.isDown) {
                    this.player.body.setVelocityX(-160);
                    this.playerFacing = 'left';
                    if (this.useSpineAnimations) {
                        this.player.setScale(-0.05, 0.05);
                        if (!this.isAttacking) {
                            this.playPlayerAnimation('run');
                        }
                    } else {
                        this.player.setFlipX(true);
                    }
                } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
                    this.player.body.setVelocityX(160);
                    this.playerFacing = 'right';
                    if (this.useSpineAnimations) {
                        this.player.setScale(0.05, 0.05);
                        if (!this.isAttacking) {
                            this.playPlayerAnimation('run');
                        }
                    } else {
                        this.player.setFlipX(false);
                    }
                } else {
                    this.player.body.setVelocityX(0);
                    if (!this.isAttacking) {
                        this.playPlayerAnimation('idle');
                    }
                }

                // Jumping
                if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.touching.down && !this.isAttacking) {
                    this.player.body.setVelocityY(-330);
                    this.playPlayerAnimation('jump', false);
                }

                // Jump animation handling
                if (!this.player.body.touching.down && this.player.body.velocity.y !== 0 && !this.isAttacking) {
                    if (this.currentAnimation !== 'jump' && this.currentAnimation !== 'Jump') {
                        this.playPlayerAnimation('jump', false);
                    }
                } else if (this.player.body.touching.down && (this.currentAnimation === 'jump' || this.currentAnimation === 'Jump') && !this.isAttacking) {
                    if (Math.abs(this.player.body.velocity.x) > 0) {
                        this.playPlayerAnimation('run');
                    } else {
                        this.playPlayerAnimation('idle');
                    }
                }

                // Attack
                if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isAttacking) {
                    this.isAttacking = true;
                    this.playPlayerAnimation('attack', false);
                    this.throwWeapon();
                    
                    // Get attack animation duration
                    const attackAnim = this.findAnimation(['attack', 'Attack', 'ATTACK']);
                    let attackDuration = 800;
                    
                    if (this.player.skeleton && this.player.skeleton.data) {
                        const animData = this.player.skeleton.data.animations.find(a => a.name === attackAnim);
                        if (animData) {
                            attackDuration = Math.max(animData.duration * 1000, 600);
                        }
                    }
                    
                    this.time.delayedCall(attackDuration, () => {
                        this.isAttacking = false;
                        if (Math.abs(this.player.body.velocity.x) > 0) {
                            this.playPlayerAnimation('run');
                        } else {
                            this.playPlayerAnimation('idle');
                        }
                    });
                }

                // Clean up weapons
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

            playPlayerAnimation(animationName, loop = true) {
                if (this.useSpineAnimations && this.player) {
                    const animationMap = {
                        'idle': this.findAnimation(['idle', 'Idle', 'IDLE', 'stand', 'Stand']),
                        'run': this.findAnimation(['run', 'Run', 'RUN', 'walk', 'Walk']),
                        'jump': this.findAnimation(['jump', 'Jump', 'JUMP']),
                        'attack': this.findAnimation(['attack', 'Attack', 'ATTACK'])
                    };
                    
                    const actualAnimationName = animationMap[animationName] || animationName;
                    
                    if (!actualAnimationName) return;
                    
                    if (this.currentAnimation !== actualAnimationName) {
                        this.currentAnimation = actualAnimationName;
                        
                        try {
                            if (this.player.animationState) {
                                this.player.animationState.setAnimation(0, actualAnimationName, loop);
                            }
                        } catch (error) {
                            console.error('Animation error:', error);
                        }
                    }
                }
            }
            
            findAnimation(nameVariations) {
                if (!this.availableAnimations) return null;
                
                for (const variation of nameVariations) {
                    if (this.availableAnimations.includes(variation)) {
                        return variation;
                    }
                }
                return null;
            }

            createEnemy(x, y) {
                const enemy = this.enemies.create(x, y, 'enemy');
                enemy.setBounce(0.2);
                enemy.setCollideWorldBounds(true);
                enemy.setTint(0x00ff00);
                enemy.health = 2;
                return enemy;
            }

            throwWeapon(pointer) {
                const weapon = this.weapons.create(this.player.x, this.player.y - 10, 'dagger');
                
                if (pointer) {
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
                    this.physics.velocityFromAngle(angle * 180 / Math.PI, 300, weapon.body.velocity);
                } else {
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
                this.createEnemy(x, 0);
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

                if (this.useSpineAnimations && player.skeleton) {
                    player.setAlpha(0.5);
                    this.time.delayedCall(200, () => {
                        player.setAlpha(1.0);
                    });
                } else {
                    player.setTint(0xff0000);
                    this.time.delayedCall(200, () => {
                        player.setTint(0xffffff);
                    });
                }

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
                        scene: typeof window.spine !== 'undefined' && window.spine.SpinePlugin ? [
                            { 
                                key: 'spine.SpinePlugin', 
                                plugin: window.spine.SpinePlugin, 
                                mapping: 'spine',
                                start: true
                            }
                        ] : []
                    }
                };

                this.game = new Phaser.Game(this.config);
            }
        }

        // Initialize game
        document.addEventListener('DOMContentLoaded', () => {
            try {
                const game = new NoteleksGame();
                window.gameInstance = game;

                // Wire up buttons
                document.getElementById('pause-btn').addEventListener('click', () => {
                    const scene = game.game.scene.getScene('GameScene');
                    if (scene) scene.pauseGame();
                });

                document.getElementById('restart-btn').addEventListener('click', () => {
                    const scene = game.game.scene.getScene('GameScene');
                    if (scene) scene.restartGame();
                });

            } catch (error) {
                console.error('Error creating game:', error);
            }
        });
    </script>
</body>
</html>