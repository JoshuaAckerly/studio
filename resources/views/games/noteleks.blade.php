<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Noteleks Heroes Beyond Light - {{ config('app.name') }}</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    @vite(['resources/css/games/noteleks.css', 'resources/js/games/noteleks/game.js'])
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
            <button id="back-btn" onclick="window.location.href='{{ route('welcome') }}'">Back to Studio</button>
        </div>
    </div>

    <div id="game-info" class="mt-8 max-w-4xl mx-auto p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">About Noteleks Heroes Beyond Light</h2>
        <p class="text-gray-700 dark:text-gray-300">
            A recreation of my original mobile game, now playable in your browser. 
            Control the skeleton hero as you battle through graveyard enemies with an arsenal of weapons.
        </p>
    </div>
</body>
</html>