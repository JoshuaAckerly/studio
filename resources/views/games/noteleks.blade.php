<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Noteleks Heroes Beyond Light - {{ config('app.name') }}</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <script src="https://unpkg.com/@esotericsoftware/spine-phaser-v3@4.2.*/dist/iife/spine-phaser-v3.js"></script>
    @vite('resources/js/games/noteleks/main.js')
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
        <p><strong>Controls:</strong> WASD/Arrows to move, Space/Click to attack, Up/W to jump, P to pause, R to restart</p>
        <p><strong>New Features:</strong> Modular codebase with separate classes for Player, Enemies, Weapons, and UI management!</p>
    </div>
</body>
</html>