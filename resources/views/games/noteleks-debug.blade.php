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
                this.useSpineAnimations = false; // Toggle for Spine vs placeholder sprites
                console.log('🏗️ GameScene constructor - useSpineAnimations:', this.useSpineAnimations);
            }

            preload() {
                console.log('Preloading assets...');
                
                // Load Spine animations if available
                if (this.useSpineAnimations) {
                    console.log('🦴 Starting Spine animation loading...');
                    console.log('🔍 Available loader methods:', {
                        spine: !!this.load.spine,
                        spineAtlas: !!this.load.spineAtlas,
                        spineJson: !!this.load.spineJson,
                        spineBinary: !!this.load.spineBinary
                    });
                    
                    // Use the correct method for modern Spine plugin
                    try {
                        if (this.load.spineAtlas && this.load.spineJson) {
                            console.log('📁 Using separate spineAtlas + spineJson loading');
                            this.load.spineAtlas('noteleks-atlas', '/games/noteleks/spine/characters/Noteleks.atlas');
                            this.load.spineJson('noteleks-data', '/games/noteleks/spine/characters/Noteleks.json');
                        } else {
                            console.log('📁 Fallback: using manual JSON + text loading');
                            this.load.json('noteleks-json', '/games/noteleks/spine/characters/Noteleks.json');
                            this.load.text('noteleks-atlas', '/games/noteleks/spine/characters/Noteleks.atlas');
                            this.load.image('noteleks-texture', '/games/noteleks/spine/characters/Noteleks.png');
                        }
                    } catch (error) {
                        console.error('❌ Error setting up Spine loading:', error);
                    }
                    
                    console.log('📁 Loading Noteleks from: /games/noteleks/spine/characters/');
                    
                    // Add loading event listeners
                    this.load.on('filecomplete', function(key, type, data) {
                        console.log('✅ File loaded:', key, '(' + type + ')');
                    });
                    
                    this.load.on('loaderror', function(file) {
                        console.error('❌ File failed to load:', file.src);
                    });
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
                if (this.useSpineAnimations) {
                    console.log('🎭 Attempting to create Spine player...');
                    console.log('🔍 JSON cache keys:', Object.keys(this.cache.json.entries.entries));
                    console.log('🔍 Text cache keys:', Object.keys(this.cache.text.entries.entries));
                    console.log('🔍 Custom cache keys:', this.cache.custom);
                    console.log('🔍 Spine add methods:', !!this.add.spine);
                    
                    try {
                        if (this.add.spine) {
                            console.log('🦴 Creating spine with separate data keys');
                            
                            // Check what's actually available in the caches
                            try {
                                const spineData = this.spine ? this.spine.cache.get('noteleks-data') : 'spine not available';
                                const atlasData = this.spine ? this.spine.getAtlas('noteleks-atlas') : 'spine not available';
                                console.log('🔍 Spine data available:', !!spineData);
                                console.log('🔍 Atlas data available:', !!atlasData);
                            } catch (e) {
                                console.log('🔍 Cache inspection failed:', e.message);
                            }
                            
                            // Use the correct parameter order for separate loading
                            this.player = this.add.spine(100, 450, 'noteleks-data', 'noteleks-atlas');
                            
                            // Set scale and initial animation after creation
                            this.player.setScale(0.05);
                        } else {
                            console.log('🦴 add.spine method not available');
                            throw new Error('Spine add method not available');
                        }
                        
                        this.physics.add.existing(this.player);
                        this.player.body.setBounce(0.2);
                        this.player.body.setCollideWorldBounds(true);
                        
                        // Scale Spine character to match game size
                        this.player.setScale(0.05); // Made smaller
                        
                        // Set up initial Spine animation
                        this.playPlayerAnimation('idle', true);
                        console.log('✅ Spine player created successfully!');
                        if (this.player.skeleton && this.player.skeleton.data && this.player.skeleton.data.animations) {
                            const availableAnimations = this.player.skeleton.data.animations.map(a => a.name);
                            console.log('🎬 Available animations:', availableAnimations);
                            console.log('🔍 Animation details:', this.player.skeleton.data.animations.map(a => ({name: a.name, duration: a.duration})));
                            
                            // Store available animations for easy access
                            this.availableAnimations = availableAnimations;
                            
                            // Set a default animation from available ones
                            if (availableAnimations.length > 0) {
                                const defaultAnim = availableAnimations[0]; // Use first available animation
                                console.log(`🎯 Setting default animation: ${defaultAnim}`);
                                this.player.animationState.setAnimation(0, defaultAnim, true);
                                this.currentAnimation = defaultAnim; // Track current animation
                            }
                        }
                    } catch (error) {
                        console.error('❌ Failed to create Spine player:', error);
                        console.log('🔄 Falling back to placeholder sprite...');
                        // Fallback to placeholder sprite
                        this.useSpineAnimations = false;
                        this.player = this.physics.add.sprite(100, 450, 'skeleton');
                        this.player.setBounce(0.2);
                        this.player.setCollideWorldBounds(true);
                    }
                } else {
                    console.log('📦 Creating placeholder sprite player...');
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

                // Player movement and facing direction (only if not attacking)
                if (this.cursors.left.isDown || this.wasd.A.isDown) {
                    this.player.body.setVelocityX(-160);
                    this.playerFacing = 'left';
                    if (this.useSpineAnimations) {
                        this.player.setScale(-0.05, 0.05); // Flip Spine skeleton (negative X to flip)
                        if (!this.isAttacking) {
                            this.playPlayerAnimation('run');
                        }
                    } else {
                        this.player.setFlipX(true); // Flip sprite
                    }
                } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
                    this.player.body.setVelocityX(160);
                    this.playerFacing = 'right';
                    if (this.useSpineAnimations) {
                        this.player.setScale(0.05, 0.05); // Normal Spine skeleton
                        if (!this.isAttacking) {
                            this.playPlayerAnimation('run');
                        }
                    } else {
                        this.player.setFlipX(false); // Normal sprite
                    }
                } else {
                    this.player.body.setVelocityX(0);
                    if (!this.isAttacking) {
                        this.playPlayerAnimation('idle');
                    }
                }

                // Jumping (only if not attacking)
                if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.touching.down && !this.isAttacking) {
                    this.player.body.setVelocityY(-330);
                    this.playPlayerAnimation('jump', false); // Play jump animation once
                }

                // Check if player is in air (for jump animation)
                if (!this.player.body.touching.down && this.player.body.velocity.y !== 0 && !this.isAttacking) {
                    // Player is jumping or falling
                    if (this.currentAnimation !== 'jump' && this.currentAnimation !== 'Jump') {
                        this.playPlayerAnimation('jump', false);
                    }
                } else if (this.player.body.touching.down && (this.currentAnimation === 'jump' || this.currentAnimation === 'Jump') && !this.isAttacking) {
                    // Player just landed, return to appropriate ground animation
                    if (Math.abs(this.player.body.velocity.x) > 0) {
                        this.playPlayerAnimation('run');
                    } else {
                        this.playPlayerAnimation('idle');
                    }
                }

                // Throw weapon / Attack
                if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isAttacking) {
                    console.log('🗡️ Attack key pressed! Starting attack...');
                    
                    this.isAttacking = true; // Block other animations during attack
                    this.playPlayerAnimation('attack', false); // Play attack animation once
                    this.throwWeapon();
                    
                    // Get attack animation duration for proper timing
                    const attackAnim = this.findAnimation(['attack', 'Attack', 'ATTACK', 'throw', 'Throw']);
                    let attackDuration = 800; // Default duration
                    
                    if (this.player.skeleton && this.player.skeleton.data) {
                        const animData = this.player.skeleton.data.animations.find(a => a.name === attackAnim);
                        if (animData) {
                            attackDuration = Math.max(animData.duration * 1000, 600); // Convert to ms, minimum 600ms
                            console.log(`⏱️ Attack duration: ${attackDuration}ms`);
                        }
                    }
                    
                    // Return to appropriate animation after attack completes
                    this.time.delayedCall(attackDuration, () => {
                        this.isAttacking = false;
                        if (Math.abs(this.player.body.velocity.x) > 0) {
                            this.playPlayerAnimation('run');
                        } else {
                            this.playPlayerAnimation('idle');
                        }
                    });
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
                if (this.useSpineAnimations && this.player) {
                    // Create animation mapping for common names
                    const animationMap = {
                        'idle': this.findAnimation(['idle', 'Idle', 'IDLE', 'stand', 'Stand']),
                        'run': this.findAnimation(['run', 'Run', 'RUN', 'walk', 'Walk']),
                        'jump': this.findAnimation(['jump', 'Jump', 'JUMP']),
                        'attack': this.findAnimation(['attack', 'Attack', 'ATTACK'])
                    };
                    
                    const actualAnimationName = animationMap[animationName] || animationName;
                    
                    if (!actualAnimationName) {
                        console.log(`⚠️ Animation "${animationName}" not found, available:`, this.availableAnimations);
                        return;
                    }
                    
                    // Only set animation if it's different from current one
                    if (this.currentAnimation !== actualAnimationName) {
                        this.currentAnimation = actualAnimationName;
                        console.log(`🎬 Changing animation to: ${actualAnimationName} (from ${animationName})`);
                        
                        try {
                            if (this.player.animationState) {
                                this.player.animationState.setAnimation(0, actualAnimationName, loop);
                                console.log(`✅ Animation ${actualAnimationName} set successfully`);
                            } else {
                                console.error(`❌ animationState not found on player object`);
                            }
                        } catch (error) {
                            console.error(`❌ Failed to set animation ${actualAnimationName}:`, error);
                            console.log(`🎬 Available animations:`, this.availableAnimations);
                        }
                    }
                } else {
                    console.log(`🚫 Animation not set - useSpine: ${this.useSpineAnimations}, player exists: ${!!this.player}`);
                }
            }
            
            // Helper method to find animation by trying multiple name variations
            findAnimation(nameVariations) {
                if (!this.availableAnimations) return null;
                
                for (const variation of nameVariations) {
                    if (this.availableAnimations.includes(variation)) {
                        return variation;
                    }
                }
                return null;
            }

            // Helper method to create enemies (placeholder sprites only)
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

                // Handle tinting for both Spine and regular sprites
                if (this.useSpineAnimations && player.skeleton) {
                    // For Spine objects, we can use alpha or scale effects instead
                    player.setAlpha(0.5);
                    this.time.delayedCall(200, () => {
                        player.setAlpha(1.0);
                    });
                } else {
                    // For regular sprites
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
                console.log('🔍 Spine availability check:');
                console.log('  - window.spine:', !!window.spine);
                console.log('  - window.spine.SpinePlugin:', !!(window.spine && window.spine.SpinePlugin));
                console.log('  - Plugin will be loaded:', typeof window.spine !== 'undefined' && window.spine.SpinePlugin);
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
                        console.log('🎯 Toggle button clicked!');
                        console.log('🔍 Current useSpineAnimations:', scene.useSpineAnimations);
                        
                        // Check if Spine plugin is available
                        if (!scene.add.spine || !window.spine) {
                            alert('Spine plugin not available. Please ensure the Spine plugin loaded correctly.');
                            return;
                        }
                        
                        // Toggle the setting
                        scene.useSpineAnimations = !scene.useSpineAnimations;
                        console.log('🔄 New useSpineAnimations:', scene.useSpineAnimations);
                        
                        // Update button text
                        const btn = document.getElementById('spine-toggle-btn');
                        btn.textContent = scene.useSpineAnimations ? 'Disable Spine Animations' : 'Enable Spine Animations';
                        
                        // Restart game to apply changes
                        console.log('🔄 Restarting game...');
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