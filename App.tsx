<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Radical Tube Surfer 3D</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Open+Sans:wght@600&display=swap');

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            user-select: none;
        }

        body, html {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000;
            font-family: 'Open Sans', sans-serif;
        }

        #game-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        /* UI Overlays */
        #ui-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .screen {
            display: none;
            flex-direction: column;
            align-items: center;
            background: rgba(0, 20, 40, 0.85);
            padding: 40px;
            border-radius: 20px;
            border: 4px solid #00ffff;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
            pointer-events: auto;
            text-align: center;
        }

        .screen.active {
            display: flex;
        }

        h1 {
            font-family: 'Bangers', cursive;
            font-size: 80px;
            color: #ff00ff;
            text-shadow: 4px 4px 0 #00ffff, 8px 8px 0 #000;
            margin-bottom: 20px;
            letter-spacing: 4px;
        }

        h2 {
            font-family: 'Bangers', cursive;
            font-size: 50px;
            color: #fff;
            margin-bottom: 20px;
        }

        .menu-btn {
            background: linear-gradient(135deg, #ff00ff, #00ffff);
            border: none;
            padding: 15px 40px;
            font-size: 24px;
            font-family: 'Bangers', cursive;
            color: #fff;
            border-radius: 10px;
            margin: 10px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
            text-shadow: 2px 2px 0 #000;
            text-transform: uppercase;
        }

        .menu-btn:hover, .menu-btn.selected {
            transform: scale(1.1);
            box-shadow: 0 0 20px #fff;
            filter: brightness(1.2);
            outline: 3px solid #fff;
        }

        .menu-btn.premium {
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            color: #000;
            text-shadow: none;
        }

        #hud {
            position: absolute;
            top: 20px;
            left: 20px;
            width: calc(100% - 40px);
            display: none;
            justify-content: space-between;
            pointer-events: none;
            z-index: 5;
        }

        .hud-stat {
            font-family: 'Bangers', cursive;
            font-size: 40px;
            color: #fff;
            text-shadow: 3px 3px 0 #000, 0 0 10px #00ffff;
        }

        #controls-hint {
            margin-top: 20px;
            color: #aaa;
            font-size: 14px;
            max-width: 400px;
            line-height: 1.5;
        }

        /* Loading Spinner */
        #loading-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 100;
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            color: #fff;
            font-family: 'Bangers', cursive;
            font-size: 30px;
        }
        
        .spinner {
            width: 60px; height: 60px;
            border: 6px solid #333;
            border-top-color: #00ffff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Crosshair */
        #crosshair {
            position: absolute;
            top: 50%; left: 50%;
            width: 10px; height: 10px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 4;
            display: none;
            pointer-events: none;
        }
    </style>
</head>
<body>

    <canvas id="game-canvas"></canvas>
    <div id="crosshair"></div>

    <div id="hud">
        <div class="hud-stat" id="score-display">SCORE: 0</div>
        <div class="hud-stat" id="combo-display"></div>
    </div>

    <div id="ui-layer">
        <!-- Start Screen -->
        <div id="start-screen" class="screen active">
            <h1>TUBULAR SURF 3D</h1>
            <button class="menu-btn" data-action="play">Drop In (Play)</button>
            <button class="menu-btn premium" data-action="buy-board">Unlock Golden Board ($5)</button>
            <div id="controls-hint">
                CONTROLS:<br>
                Gamepad: Left Stick (Move), A/Cross (Jump/Select), Triggers (Speed/Brake), Right Stick (Look)<br>
                Keyboard: WASD (Move), Space (Jump), Mouse (Look)
            </div>
        </div>

        <!-- Game Over Screen -->
        <div id="game-over-screen" class="screen">
            <h1>WIPEOUT!</h1>
            <h2 id="final-score">Score: 0</h2>
            <button class="menu-btn" data-action="play">Try Again</button>
            <button class="menu-btn" data-action="menu">Main Menu</button>
        </div>
    </div>

    <!-- Monetization Loading -->
    <div id="loading-overlay">
        <div class="spinner"></div>
        <div>Processing Payment...</div>
    </div>

    <!-- Import Three.js -->
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
        }
    </script>

    <script type="module">
        import * as THREE from 'three';
        import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

        // --- GLOBAL STATE ---
        let gameState = 'START'; // START, PLAYING, GAMEOVER
        let score = 0;
        let speedMultiplier = 1.0;
        let hasGoldenBoard = false;
        
        // --- UI & MENUS ---
        const uiElements = {
            start: document.getElementById('start-screen'),
            gameOver: document.getElementById('game-over-screen'),
            hud: document.getElementById('hud'),
            score: document.getElementById('score-display'),
            combo: document.getElementById('combo-display'),
            finalScore: document.getElementById('final-score'),
            loading: document.getElementById('loading-overlay'),
            crosshair: document.getElementById('crosshair')
        };

        let currentMenuButtons = [];
        let selectedMenuIndex = 0;

        function updateMenuSelection() {
            currentMenuButtons.forEach((btn, idx) => {
                if (idx === selectedMenuIndex) btn.classList.add('selected');
                else btn.classList.remove('selected');
            });
        }

        function switchState(newState) {
            gameState = newState;
            uiElements.start.classList.remove('active');
            uiElements.gameOver.classList.remove('active');
            uiElements.hud.style.display = 'none';
            uiElements.crosshair.style.display = 'none';
            document.exitPointerLock?.();

            if (newState === 'START') {
                uiElements.start.classList.add('active');
                currentMenuButtons = Array.from(uiElements.start.querySelectorAll('.menu-btn'));
                selectedMenuIndex = 0;
                updateMenuSelection();
            } else if (newState === 'PLAYING') {
                uiElements.hud.style.display = 'flex';
                uiElements.crosshair.style.display = 'block';
                resetGame();
                try { document.body.requestPointerLock(); } catch(e){}
                if (!audioCtx) initAudio();
            } else if (newState === 'GAMEOVER') {
                uiElements.gameOver.classList.add('active');
                uiElements.finalScore.innerText = `Score: ${Math.floor(score)}`;
                currentMenuButtons = Array.from(uiElements.gameOver.querySelectorAll('.menu-btn'));
                selectedMenuIndex = 0;
                updateMenuSelection();
                speakPhrase("Bummer, dude! Major wipeout.");
            }
        }

        // Setup mouse clicks for menus
        document.querySelectorAll('.menu-btn').forEach((btn) => {
            btn.addEventListener('mouseenter', (e) => {
                selectedMenuIndex = currentMenuButtons.indexOf(e.target);
                updateMenuSelection();
            });
            btn.addEventListener('click', (e) => handleMenuAction(e.target.dataset.action));
        });

        function handleMenuAction(action) {
            if (action === 'play') switchState('PLAYING');
            else if (action === 'menu') switchState('START');
            else if (action === 'buy-board') handlePurchase();
        }

        // --- MONETIZATION (Mock API as requested) ---
        // Provided API dummy setup if not exists
        if(!window.MyPipPayments) {
            window.MyPipPayments = {
                checkout: (amount, name) => new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if(Math.random() > 0.2) resolve(); else reject(new Error('User cancelled'));
                    }, 1500);
                })
            };
        }

        function handlePurchase() {
            uiElements.loading.style.display = 'flex';
            window.MyPipPayments.checkout(500, 'Golden Surfboard')
                .then(() => {
                    hasGoldenBoard = true;
                    alert("Radical! You got the Golden Board!");
                    speedMultiplier = 1.5;
                    // Update visuals in background
                    if(boardMesh) boardMesh.material.color.setHex(0xffd700);
                })
                .catch(e => console.log('Purchase cancelled'))
                .finally(() => {
                    uiElements.loading.style.display = 'none';
                });
        }

        // --- AUDIO SYSTEM ---
        let audioCtx, waveNoise, waveFilter, waveGain;
        const phrases = [
            "Radical!", "Tubular!", "Carving it up!", "Watch the lip!",
            "Smack the lip! Whaaposh!", "So pitted!", "Gnarly, dude!", "Sweet!"
        ];

        function initAudio() {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
            
            // White noise generator for wave sound
            const bufferSize = audioCtx.sampleRate * 2;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            
            waveNoise = audioCtx.createBufferSource();
            waveNoise.buffer = buffer;
            waveNoise.loop = true;

            waveFilter = audioCtx.createBiquadFilter();
            waveFilter.type = 'lowpass';
            waveFilter.frequency.value = 400; // Deep rumble

            waveGain = audioCtx.createGain();
            waveGain.gain.value = 0.5;

            waveNoise.connect(waveFilter);
            waveFilter.connect(waveGain);
            waveGain.connect(audioCtx.destination);
            waveNoise.start();
        }

        function updateAudioDynamics(speed, heightRatio) {
            if(!audioCtx) return;
            // Higher up the wave = more high frequencies
            waveFilter.frequency.setTargetAtTime(400 + (heightRatio * 1500), audioCtx.currentTime, 0.1);
            waveGain.gain.setTargetAtTime(0.3 + (speed * 0.02), audioCtx.currentTime, 0.1);
        }

        function speakPhrase(customText = null) {
            if (!window.speechSynthesis) return;
            const text = customText || phrases[Math.floor(Math.random() * phrases.length)];
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 0.8;
            utterance.rate = 1.1;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
        }

        // --- THREE.JS SETUP ---
        const canvas = document.getElementById('game-canvas');
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Sky blue
        scene.fog = new THREE.FogExp2(0x87CEEB, 0.005);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(50, 100, -50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 300;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        scene.add(dirLight);

        // --- PROCEDURAL TEXTURES ---
        function createWaterNormalMap() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(512, 512);
            const simplex = new SimplexNoise();
            for(let i=0; i<512; i++) {
                for(let j=0; j<512; j++) {
                    const val = (simplex.noise(i*0.02, j*0.02) + 1) * 127;
                    const idx = (i + j * 512) * 4;
                    imgData.data[idx] = val;     // R (X)
                    imgData.data[idx+1] = val;   // G (Y)
                    imgData.data[idx+2] = 255;   // B (Z pointing up)
                    imgData.data[idx+3] = 255;
                }
            }
            ctx.putImageData(imgData, 0, 0);
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        // --- GAME OBJECTS ---
        
        // 1. The Wave Tube (Moving surface)
        // Using a cylinder, rotated so we surf inside it.
        const waveRadius = 40;
        const waveLength = 200;
        const waveGeo = new THREE.CylinderGeometry(waveRadius, waveRadius, waveLength, 32, 64, true, 0, Math.PI * 1.2);
        // Rotate so axis is along Z
        waveGeo.rotateX(-Math.PI / 2);
        // Rotate so opening is towards negative Y
        waveGeo.rotateZ(-Math.PI / 2);

        const waterNormal = createWaterNormalMap();
        waterNormal.repeat.set(4, 10);
        
        const waveMat = new THREE.MeshPhysicalMaterial({
            color: 0x0066ff,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.6,
            thickness: 2.0,
            normalMap: waterNormal,
            normalScale: new THREE.Vector2(0.5, 0.5),
            side: THREE.DoubleSide
        });
        const waveMesh = new THREE.Mesh(waveGeo, waveMat);
        waveMesh.receiveShadow = true;
        scene.add(waveMesh);

        // 2. The Surfer
        const surferGroup = new THREE.Group();
        
        // Board
        const boardGeo = new THREE.BoxGeometry(2, 0.2, 6);
        boardGeo.translate(0, 0.1, 0);
        const boardMat = new THREE.MeshStandardMaterial({ 
            color: hasGoldenBoard ? 0xffd700 : 0xffffff,
            roughness: 0.2 
        });
        const boardMesh = new THREE.Mesh(boardGeo, boardMat);
        boardMesh.castShadow = true;
        surferGroup.add(boardMesh);

        // Dude (Simple blocks)
        const dudeMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.8);
        bodyGeo.translate(0, 1, 0);
        const body = new THREE.Mesh(bodyGeo, dudeMat);
        body.castShadow = true;
        
        const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        headGeo.translate(0, 2.2, 0);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        const head = new THREE.Mesh(headGeo, headMat);
        head.castShadow = true;

        surferGroup.add(body);
        surferGroup.add(head);
        
        scene.add(surferGroup);

        // 3. Obstacles (Rocks/Sharks)
        const obstacles = [];
        const rockGeo = new THREE.DodecahedronGeometry(2);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
        
        function spawnObstacle() {
            if(gameState !== 'PLAYING') return;
            const rock = new THREE.Mesh(rockGeo, rockMat);
            
            // Random position along the wave curve
            // Angle between Math.PI * 0.2 and Math.PI * 0.8 (inner tube)
            const angle = Math.random() * (Math.PI * 0.6) + (Math.PI * 0.2);
            
            // Convert polar to cartesian within cylinder
            rock.position.x = Math.cos(angle) * (waveRadius - 1);
            rock.position.y = Math.sin(angle) * (waveRadius - 1);
            rock.position.z = waveLength / 2; // Spawn far away
            
            rock.castShadow = true;
            scene.add(rock);
            obstacles.push({ mesh: rock, angle: angle });
        }

        // --- PLAYER PHYSICS & STATE ---
        let playerAngle = Math.PI / 2; // Start at bottom of tube
        let playerVelocity = 0;
        let baseSpeed = 40;
        let jumpVelocity = 0;
        let isGrounded = true;
        let waveOffset = 0; // Texture scrolling

        // Camera Look variables
        let camPitch = 0.2;
        let camYaw = 0;

        function resetGame() {
            score = 0;
            playerAngle = Math.PI / 2;
            jumpVelocity = 0;
            isGrounded = true;
            camPitch = 0.2;
            camYaw = 0;
            obstacles.forEach(o => scene.remove(o.mesh));
            obstacles.length = 0;
        }

        // --- INPUT HANDLING ---
        const keys = { w:false, a:false, s:false, d:false, space:false, shift:false };
        
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            if(keys.hasOwnProperty(k)) keys[k] = true;
            if(e.key === ' ' && keys.hasOwnProperty('space')) keys.space = true;
        });
        window.addEventListener('keyup', e => {
            const k = e.key.toLowerCase();
            if(keys.hasOwnProperty(k)) keys[k] = false;
            if(e.key === ' ' && keys.hasOwnProperty('space')) keys.space = false;
        });

        // Pointer Lock Camera Fallback
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body && gameState === 'PLAYING') {
                camYaw -= e.movementX * 0.002;
                camPitch -= e.movementY * 0.002;
                camPitch = Math.max(-0.5, Math.min(1.5, camPitch));
            }
        });

        // Controller logic state
        let lastButtonState = {};
        let inputCooldown = 0;

        function handleInput(dt) {
            let moveX = 0; // Strafe / carve
            let moveY = 0; // Up/down face
            let jumpPressed = keys.space;
            let lookX = 0;
            let lookY = 0;
            let triggerAccel = 0;
            let triggerBrake = 0;

            // Keyboard mapped to axes
            if (keys.a) moveX = -1;
            if (keys.d) moveX = 1;
            if (keys.w) moveY = 1;
            if (keys.s) moveY = -1;

            // GAMEPAD POLLING
            const gamepads = navigator.getGamepads();
            const gp = gamepads[0]; // Take first connected

            if (gp) {
                // Left Stick & D-Pad for Movement
                const deadzone = 0.15;
                let lx = gp.axes[0];
                let ly = -gp.axes[1]; // Invert Y so up stick = positive
                
                if (Math.abs(lx) < deadzone) lx = 0;
                if (Math.abs(ly) < deadzone) ly = 0;

                // D-Pad override
                if (gp.buttons[14]?.pressed) lx = -1; // Left
                if (gp.buttons[15]?.pressed) lx = 1;  // Right
                if (gp.buttons[12]?.pressed) ly = 1;  // Up
                if (gp.buttons[13]?.pressed) ly = -1; // Down

                moveX = lx !== 0 ? lx : moveX;
                moveY = ly !== 0 ? ly : moveY;

                // Right Stick for Look
                let rx = gp.axes[2];
                let ry = gp.axes[3];
                if (Math.abs(rx) > deadzone) lookX = rx;
                if (Math.abs(ry) > deadzone) lookY = ry;

                // Triggers
                triggerAccel = gp.buttons[7]?.value || (gp.buttons[7]?.pressed ? 1 : 0); // R2
                triggerBrake = gp.buttons[6]?.value || (gp.buttons[6]?.pressed ? 1 : 0); // L2

                // Buttons
                const btnA = gp.buttons[0]?.pressed; // A / Cross
                const btnB = gp.buttons[1]?.pressed; // B / Circle
                
                if (btnA) jumpPressed = true;

                // Menu Navigation handling
                if (gameState !== 'PLAYING') {
                    inputCooldown -= dt;
                    if (inputCooldown <= 0) {
                        if (ly > 0.5) { // Up
                            selectedMenuIndex = (selectedMenuIndex - 1 + currentMenuButtons.length) % currentMenuButtons.length;
                            updateMenuSelection();
                            inputCooldown = 0.2;
                        } else if (ly < -0.5) { // Down
                            selectedMenuIndex = (selectedMenuIndex + 1) % currentMenuButtons.length;
                            updateMenuSelection();
                            inputCooldown = 0.2;
                        }

                        // Select
                        if (btnA && !lastButtonState[0]) {
                            currentMenuButtons[selectedMenuIndex].click();
                            inputCooldown = 0.5;
                        }
                    }
                }

                // Store button state for edge detection
                for(let i=0; i<gp.buttons.length; i++){
                    lastButtonState[i] = gp.buttons[i].pressed;
                }
            } else {
                // Keyboard menu fallback
                if(gameState !== 'PLAYING') {
                    inputCooldown -= dt;
                    if(inputCooldown <= 0) {
                        if(keys.w) {
                            selectedMenuIndex = (selectedMenuIndex - 1 + currentMenuButtons.length) % currentMenuButtons.length;
                            updateMenuSelection();
                            inputCooldown = 0.2;
                        }
                        if(keys.s) {
                            selectedMenuIndex = (selectedMenuIndex + 1) % currentMenuButtons.length;
                            updateMenuSelection();
                            inputCooldown = 0.2;
                        }
                        if(keys.space) {
                            currentMenuButtons[selectedMenuIndex].click();
                            inputCooldown = 0.5;
                        }
                    }
                }
            }

            if (gameState === 'PLAYING') {
                // Apply look
                camYaw -= lookX * 2.0 * dt;
                camPitch += lookY * 2.0 * dt;
                camPitch = Math.max(-0.5, Math.min(1.5, camPitch));

                // Carving (Left/Right moves along angle)
                const carveSpeed = 2.0;
                playerAngle += moveX * carveSpeed * dt;
                // Clamp angle to keep inside tube (between ~40deg and ~140deg)
                playerAngle = Math.max(Math.PI * 0.2, Math.min(Math.PI * 0.8, playerAngle));

                // Speed calculation based on position and triggers
                let currentSpeed = baseSpeed * speedMultiplier;
                if (triggerAccel > 0 || keys.w) currentSpeed *= (1.0 + (triggerAccel || 1) * 0.5);
                if (triggerBrake > 0 || keys.s) currentSpeed *= (1.0 - (triggerBrake || 1) * 0.5);
                
                // Gravity assist: Going down the face (angle -> Pi/2) increases speed
                const faceSteepness = Math.abs(Math.cos(playerAngle));
                currentSpeed += faceSteepness * 20;

                // Jump
                if (jumpPressed && isGrounded) {
                    jumpVelocity = 15;
                    isGrounded = false;
                }

                return currentSpeed;
            }
            return 0;
        }

        // --- MAIN LOOP ---
        const clock = new THREE.Clock();
        let nextObstacleTime = 2;

        function animate() {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1);

            const speed = handleInput(dt);

            if (gameState === 'PLAYING') {
                // 1. Update Score & Environment
                score += speed * dt * 0.1;
                uiElements.score.innerText = `SCORE: ${Math.floor(score)}`;
                
                waveOffset -= speed * dt * 0.1;
                waterNormal.offset.y = waveOffset;
                waterNormal.offset.x = (Math.sin(performance.now()*0.001)*0.1); // Wiggle

                // 2. Player Physics
                // Base position on cylinder wall
                const targetX = Math.cos(playerAngle) * waveRadius;
                const targetY = Math.sin(playerAngle) * waveRadius;

                // Apply Jump/Gravity (relative to surface normal)
                if (!isGrounded) {
                    jumpVelocity -= 40 * dt; // Gravity
                    // If height offset goes below 0, grounded
                    if (jumpVelocity < 0 && surferGroup.position.distanceTo(new THREE.Vector3(targetX, targetY, 0)) < 1) {
                        isGrounded = true;
                        jumpVelocity = 0;
                        if(Math.random() > 0.7) speakPhrase("Whaaposh!");
                    }
                }

                // Normal vector pointing inwards from cylinder wall to center
                const normal = new THREE.Vector3(-targetX, -targetY, 0).normalize();
                
                // Position logic: target surface pos + normal * height
                const surfacePos = new THREE.Vector3(targetX, targetY, 0);
                // Simulate jump height by moving along normal towards center
                // Wait, if jumping we move inwards? Yes, away from wave face.
                let jumpOffset = 0;
                if(!isGrounded) {
                    // Simple integration for visual jump relative to surface
                    // actually just need a scalar value for distance from surface
                    // Let's store actual radial distance
                }

                // Simplified jump: modify radial distance
                let currentRadius = waveRadius;
                if(!isGrounded) {
                    // this is tricky with angles. Let's just offset the final pos
                }
                
                // Let's manage an explicit height value
                let heightOffBoard = isGrounded ? 0 : jumpVelocity * dt; // needs proper integration
                // Proper jump integration:
                // Let's just track a variable `altitude`
            }
            
            updateGame(dt, speed);
            renderer.render(scene, camera);
        }

        // Separate logic for clarity
        let altitude = 0;

        function updateGame(dt, speed) {
            if (gameState !== 'PLAYING') return;

            // Jump Physics
            if (!isGrounded) {
                jumpVelocity -= 30 * dt; // Gravity
                altitude += jumpVelocity * dt;
                if (altitude <= 0) {
                    altitude = 0;
                    isGrounded = true;
                    jumpVelocity = 0;
                }
            }

            // Calculate Base Surface Position
            const baseX = Math.cos(playerAngle) * waveRadius;
            const baseY = Math.sin(playerAngle) * waveRadius;
            
            // Surface Normal (pointing to center 0,0)
            const nx = -baseX / waveRadius;
            const ny = -baseY / waveRadius;

            // Apply Altitude along negative normal (towards center of tube)
            surferGroup.position.set(
                baseX + nx * altitude,
                baseY + ny * altitude,
                -20 // Fixed Z offset for player
            );

            // Rotate Board to align with surface
            // The surface normal is (nx, ny, 0).
            // We want the board's UP vector to align with the negative normal (pointing to center).
            const up = new THREE.Vector3(nx, ny, 0);
            const forward = new THREE.Vector3(0, 0, -1);
            const right = new THREE.Vector3().crossVectors(up, forward).normalize();
            
            const matrix = new THREE.Matrix4().makeBasis(right, up, forward);
            surferGroup.quaternion.setFromRotationMatrix(matrix);

            // Add carve tilt (roll)
            const carveTilt = (Math.PI / 2 - playerAngle) * 0.5; // Tilt based on position on face
            surferGroup.rotateZ(carveTilt);

            // Audio update
            updateAudioDynamics(speed, playerAngle / Math.PI);

            // Obstacles
            nextObstacleTime -= dt;
            if (nextObstacleTime <= 0) {
                spawnObstacle();
                nextObstacleTime = 0.5 + Math.random() * 1.5;
            }

            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.mesh.position.z -= speed * dt;
                
                // Rotate to stick to surface if it's a tube
                // Actually they just move in Z, keeping their XY
                
                // Collision check
                if (obs.mesh.position.z < surferGroup.position.z + 2 && obs.mesh.position.z > surferGroup.position.z - 2) {
                    const dist = surferGroup.position.distanceTo(obs.mesh.position);
                    if (dist < 2.5) {
                        // HIT!
                        switchState('GAMEOVER');
                    }
                }

                // Remove passed obstacles
                if (obs.mesh.position.z < -50) {
                    scene.remove(obs.mesh);
                    obstacles.splice(i, 1);
                }
            }

            // Camera Follow
            // Target position behind and slightly inside the player
            const camOffsetX = Math.cos(playerAngle - 0.2) * (waveRadius - 10);
            const camOffsetY = Math.sin(playerAngle - 0.2) * (waveRadius - 10);
            
            const idealCamPos = new THREE.Vector3(camOffsetX, camOffsetY, surferGroup.position.z + 15);
            camera.position.lerp(idealCamPos, 0.1);

            // Apply manual camera look (yaw/pitch) around the player
            const targetPos = surferGroup.position.clone();
            targetPos.z -= 10; // Look ahead
            
            // Convert yaw/pitch to offset relative to target
            const lookOffset = new THREE.Vector3(
                Math.sin(camYaw) * Math.cos(camPitch),
                Math.sin(camPitch),
                -Math.cos(camYaw) * Math.cos(camPitch)
            ).multiplyScalar(20);

            camera.lookAt(targetPos.clone().add(lookOffset));
        }

        // Resize handler
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Start loop
        switchState('START');
        animate();

    </script>
</body>
</html>