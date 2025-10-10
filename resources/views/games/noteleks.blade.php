<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Noteleks Heroes Beyond Light - {{ config('app.name') }}</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <script src="https://unpkg.com/@esotericsoftware/spine-phaser-v3@4.2.*/dist/iife/spine-phaser-v3.js"></script>
    

    
    @vite('resources/js/games/noteleks/main-modular.js')
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            font-family: Arial, sans-serif;
            color: #fff;
        }
        
        #game-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        #game-ui {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            z-index: 100;
            display: flex;
            justify-content: space-between;
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            backdrop-filter: blur(5px);
        }
        
        #phaser-game {
            width: 100vw;
            height: 100vh;
            display: block;
        }
        
        #phaser-game canvas {
            display: block;
            width: 100% !important;
            height: 100% !important;
        }
        
        #game-controls {
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            display: flex;
            gap: 15px;
        }
        
        #game-controls button {
            padding: 10px 20px;
            background: rgba(74, 222, 128, 0.9);
            border: none;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            backdrop-filter: blur(5px);
            transition: background-color 0.2s;
        }
        
        #game-controls button:hover {
            background: rgba(74, 222, 128, 1);
        }
        
        #game-info {
            display: none; /* Hide info panel in fullscreen mode */
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            #game-ui {
                font-size: 14px;
                padding: 8px 15px;
            }
            
            #game-controls button {
                padding: 8px 16px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div id="game-container">
        <div id="game-ui">
            <div id="score">Score: <span id="score-value">0</span></div>
            <div id="health">Health: <span id="health-value">100</span></div>
        </div>
        <div id="phaser-game"></div>
        <div id="game-controls">
            <button id="pause-btn">Pause</button>
            <button id="restart-btn">Restart</button>
            <button id="back-btn">Back to Studio</button>
        </div>
    </div>

    <div id="game-info">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">About Noteleks Heroes Beyond Light</h2>
        <p style="margin-bottom: 1rem;">
            A recreation of my original mobile game, now playable in your browser with advanced Spine 2D animations.
            Control Noteleks as you battle through graveyard enemies with an arsenal of weapons.
        </p>
        <p><strong>Controls:</strong> WASD/Arrows to move, Space/Click to attack, Up/W to jump, P to pause, R to restart</p>
        <p><strong>New Features:</strong> Modular codebase with separate classes for Player, Enemies, Weapons, and UI management!</p>
    </div>

    <script>
        // Handle button clicks
        document.getElementById('back-btn').addEventListener('click', function() {
            window.location.href = '{{ route("welcome") }}';
        });

        document.getElementById('pause-btn').addEventListener('click', function() {
            if (window.noteleksGame) {
                const scene = window.noteleksGame.getScene('GameScene');
                if (scene) {
                    if (scene.gameState === 'playing') {
                        scene.pauseGame();
                        this.textContent = 'Resume';
                    } else if (scene.gameState === 'paused') {
                        scene.resumeGame();
                        this.textContent = 'Pause';
                    }
                }
            }
        });

        document.getElementById('restart-btn').addEventListener('click', function() {
            if (window.noteleksGame) {
                const scene = window.noteleksGame.getScene('GameScene');
                if (scene) {
                    scene.restartGame();
                    // Reset pause button text
                    document.getElementById('pause-btn').textContent = 'Pause';
                }
            }
        });
    </script>
</body>
</html>