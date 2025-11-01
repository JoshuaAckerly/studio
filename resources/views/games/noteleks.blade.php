<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Noteleks Heroes Beyond Light - {{ config('app.name') }}</title>
    
    <script>
        // Silence console output when app.debug is false (production).
        // This prevents console logging from appearing during normal play.
        (function(){
            var debug = {{ config('app.debug') ? 'true' : 'false' }};
            if (!debug && typeof console !== 'undefined') {
                ['log','info','warn','error','debug'].forEach(function(m){
                    try { console[m] = function(){}; } catch(e) { /* ignore */ }
                });
            }
        })();
    </script>
    <!-- Google Analytics -->
    @if(config('services.google_analytics.tracking_id'))
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ config('services.google_analytics.tracking_id') }}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        
        var trackingId = '{{ config('services.google_analytics.tracking_id') }}';
        gtag('config', trackingId);
        
        // Track game access
        gtag('event', 'game_access', {
            'event_category': 'games',
            'event_label': 'noteleks',
            'custom_parameter_subdomain': window.location.hostname
                
        });

        // Track visitor for email notifications
        async function trackGameVisit() {
            try {
                const visitData = {
                    referrer: window.location.href,
                    subdomain: window.location.hostname,
                    page_title: document.title,
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                };

                console.log('🎮 Tracking game visit:', visitData);

                const response = await fetch('/api/track-visit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(visitData)
                });

                const result = await response.json();
                console.log('✅ Game visit tracked:', result.status);
            } catch (error) {
                console.error('❌ Game tracking failed:', error);
            }
        }

        // Track the visit when page loads
        trackGameVisit();
    </script>
    @endif
    
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>

    <!-- Enable Noteleks in-page debug hooks when present so we can see
         the on-page logger and diagnostic overlays during troubleshooting. -->
    <script>
        // Set before the Vite entry so main-modular picks this up and
        // installs the in-page logger / debug overlays.

    </script>

    <!-- Local development shim for Spine plugin (safe no-op). Replace with
        the official Spine Phaser plugin IIFE for full runtime support. -->
    <script src="/libs/spine/spine-plugin-iife.js"></script>
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
            /* Mobile optimizations */
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        
        #game-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* Minimal game UI container used by TouchInputComponent */
        #game-ui {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            z-index: 100;
            display: flex;
            justify-content: space-between;
            padding: 10px 20px;
            background: rgba(0,0,0,0.6);
            border-radius: 8px;
        }
        

        
        #phaser-game {
            width: 100vw;
            height: 100vh;
            display: block;
        }

        /* Mobile Game Boy Style Layout */
        @media (max-width: 768px) and (orientation: portrait) {
            body {
                height: 100vh; /* Keep within viewport */
                overflow: hidden; /* Prevent scrolling */
                position: fixed;
                width: 100%;
            }

            /* Stack like a Game Boy: screen on top, controls below */
            #game-container {
                padding: 8px;
                background: #2a2a2a;
                height: 100vh; /* Fit exactly in viewport */
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                overflow: hidden;
                gap: 8px;
            }

            /* Make the game area smaller so controls have room underneath */
            #phaser-game {
                width: 100%;
                height: 48vh; /* Reserve roughly half the screen for the game */
                max-height: 420px;
                border: 3px solid #1a1a1a;
                border-radius: 12px;
                background: #000;
                margin: 0;
                flex-shrink: 0; /* prevent shrinking when controls expand */
                box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.35);
            }

            #phaser-game canvas {
                border-radius: 8px;
            }






        }

        @media (max-width: 768px) and (orientation: landscape) {
            #game-container {
                /* Landscape layout */
                flex-direction: row;
                padding: 5px;
                background: #2a2a2a;
            }

            #phaser-game {
                width: 100%;
                height: 100vh;
                border: none;
                border-radius: 0;
                margin: 0;
            }






        }
        
        #phaser-game canvas {
            display: block;
            width: 100% !important;
            height: 100% !important;
            /* Prevent mobile scrolling and selection */
            touch-action: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
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
        
        /* Mobile Game Boy Styling */
        @media (max-width: 768px) {
            body {
                background: #2a2a2a;
            }


            


            #mobile-controls-area {
                display: flex;
                width: 100%;
                gap: 12px;
                align-items: flex-end; /* push controls down inside the area */
                justify-content: space-between;
                padding: 12px 14px 20px 14px;
                box-sizing: border-box;
                min-height: 28vh; /* reserve space under the screen for controls */
            }

            /* Columns inside mobile controls area */
            #mobile-controls-area .left-column,
            #mobile-controls-area .right-column {
                flex: 1 1 0;
                display: flex;
                align-items: flex-end; /* align controls to bottom */
                justify-content: center;
                padding-bottom: 8px;
            }

            #mobile-controls-area .center-column {
                flex: 0 0 auto;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                padding-bottom: 8px;
            }

            #mobile-controls-area #game-controls {
                display: flex !important;
                align-items: center;
                gap: 8px;
                /* Ensure the injected controls flow inside the mobile area (not absolutely positioned) */
                position: static !important;
                top: auto !important;
                left: auto !important;
                transform: none !important;
            }

            #game-controls button:active {
                transform: translateY(1px);
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }

            /* Game Boy Screen Effect */
            #phaser-game::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0,0,0,0.03) 2px,
                        rgba(0,0,0,0.03) 4px
                    );
                pointer-events: none;
                border-radius: 8px;
            }
        }
    </style>
</head>
<body>
        <div id="game-container">

            <div id="game-ui">
                <div id="score">Score: <span id="score-value">0</span></div>
            </div>

            <div id="phaser-game"></div>

            <div id="mobile-controls-area">
                <!-- Game-Boy style columns: left = joystick, center = small control bar, right = action buttons -->
                <div class="left-column" id="mobile-left"></div>
                <div class="center-column" id="mobile-center">
                    <div id="game-controls" style="display: none;">
                        <button id="pause-btn">Pause</button>
                        <button id="restart-btn">Restart</button>
                        <button id="back-btn">Back to Studio</button>
                    </div>
                </div>
                <div class="right-column" id="mobile-right"></div>
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
        // Import tracking functions (if needed)
        function trackGameEvent(action, label) {
            if (typeof gtag !== 'undefined') {
                gtag('event', action, {
                    'event_category': 'game_interaction',
                    'event_label': label,
                    'custom_parameter_game': 'noteleks',
                    'custom_parameter_subdomain': window.location.hostname
                });
                console.log('🎮 Game event:', action, label);
            }
        }

        // Handle button clicks (only if buttons exist)
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                trackGameEvent('game_exit', 'back_to_studio');
                window.location.href = '{{ route("welcome") }}';
            });
        }

        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', function() {
                if (window.noteleksGame) {
                    const scene = window.noteleksGame.getScene('GameScene');
                    if (scene) {
                        if (scene.gameState === 'playing') {
                            scene.pauseGame();
                            this.textContent = 'Resume';
                            trackGameEvent('game_pause', 'pause');
                        } else if (scene.gameState === 'paused') {
                            scene.resumeGame();
                            this.textContent = 'Pause';
                            trackGameEvent('game_resume', 'resume');
                        }
                    }
                }
            });
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', function() {
                if (window.noteleksGame) {
                    const scene = window.noteleksGame.getScene('GameScene');
                    if (scene) {
                        scene.restartGame();
                        // Reset pause button text
                        const pauseBtn = document.getElementById('pause-btn');
                        if (pauseBtn) pauseBtn.textContent = 'Pause';
                        trackGameEvent('game_restart', 'restart');
                    }
                }
            });
        }
    </script>
</body>
</html>