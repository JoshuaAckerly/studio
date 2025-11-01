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
    <script src="https://unpkg.com/@esotericsoftware/spine-phaser-v3@4.2.32/dist/iife/spine-phaser-v3.js"></script>
    

    <!-- Enable Noteleks in-page debug hooks when present so we can see
         the on-page logger and diagnostic overlays during troubleshooting. -->
    <script>
        // Set before the Vite entry so main-modular picks this up and
        // installs the in-page logger / debug overlays.

    </script>

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

            #game-container {
                padding: 5px;
                background: #2a2a2a;
                height: 100vh; /* Fit exactly in viewport */
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                overflow: hidden;
            }

            #phaser-game {
                width: 100%;
                height: 100vh; /* Full screen now */
                border: none;
                border-radius: 0;
                background: #000;
                margin: 0;
            }

            #phaser-game canvas {
                border-radius: 8px;
            }






        }

        @media (max-width: 768px) and (orientation: landscape) {
            #game-container {
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

        <div id="phaser-game"></div>

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