// Game Preview - Live game preview with embedded window and hot reload
// Revolutionary game development interface with real-time testing and debugging

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Maximize2, Minimize2, Settings,
  Monitor, Smartphone, Tablet, BarChart3, Bug, Zap,
  Clock, Cpu, HardDrive, Activity, Volume2, VolumeX,
  Camera, Download, Share, Eye, EyeOff, Grid, MousePointer
} from 'lucide-react';

const GamePreview = ({ eventBus, activeProject, onPerformanceChange }) => {
  const [gameState, setGameState] = useState('stopped'); // stopped, loading, running, paused, error
  const [gameUrl, setGameUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('1920x1080');
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    entityCount: 0,
    renderTime: 0,
    drawCalls: 0,
    textureMemory: 0
  });
  const [gameSettings, setGameSettings] = useState({
    quality: 'high',
    vsync: true,
    showFPS: true,
    showDebug: false,
    volume: 0.8,
    autoReload: true
  });
  const [debugInfo, setDebugInfo] = useState({
    position: { x: 0, y: 0 },
    currentScene: 'MainMenu',
    playerLevel: 1,
    inventoryItems: 12,
    activeQuests: 3
  });
  const [hotReloadEnabled, setHotReloadEnabled] = useState(true);
  const [lastReload, setLastReload] = useState(null);
  const [gameConsole, setGameConsole] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const [buildStatus, setBuildStatus] = useState('idle'); // idle, building, success, error

  const gameFrameRef = useRef(null);
  const performanceTimer = useRef(null);
  const websocketRef = useRef(null);

  // Predefined resolutions
  const resolutions = [
    { id: '1920x1080', label: '1920×1080 (Full HD)', width: 1920, height: 1080 },
    { id: '1366x768', label: '1366×768 (HD)', width: 1366, height: 768 },
    { id: '1280x720', label: '1280×720 (HD)', width: 1280, height: 720 },
    { id: '1024x768', label: '1024×768 (4:3)', width: 1024, height: 768 },
    { id: '800x600', label: '800×600 (SVGA)', width: 800, height: 600 },
    { id: '480x320', label: '480×320 (Mobile)', width: 480, height: 320 },
    { id: '414x896', label: '414×896 (iPhone)', width: 414, height: 896 },
    { id: '360x640', label: '360×640 (Android)', width: 360, height: 640 }
  ];

  // Initialize game preview
  useEffect(() => {
    if (activeProject && activeProject.type === 'arpg') {
      initializeGamePreview();
      setupHotReload();
      startPerformanceMonitoring();
    }
    
    return () => {
      cleanup();
    };
  }, [activeProject]);

  // Setup event listeners
  useEffect(() => {
    setupEventListeners();
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const initializeGamePreview = async () => {
    try {
      console.log('🎮 Initializing game preview...');
      
      // In a real implementation, this would start the game server
      const gameServerUrl = await startGameServer();
      setGameUrl(gameServerUrl);
      
      // Setup game iframe
      if (gameFrameRef.current) {
        gameFrameRef.current.src = gameServerUrl;
      }
      
      console.log('✅ Game preview initialized');
    } catch (error) {
      console.error('❌ Failed to initialize game preview:', error);
      setGameState('error');
      addConsoleMessage('error', `Failed to initialize game: ${error.message}`);
    }
  };

  const startGameServer = async () => {
    // Mock game server startup
    setBuildStatus('building');
    setGameState('loading');
    
    // Simulate build process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if the game HTML file exists
    const gameHtmlPath = `${activeProject.path}/index.html`;
    
    // For RainStorm ARPG, use the actual game file if it exists
    if (activeProject.name === 'RainStorm ARPG') {
      setBuildStatus('success');
      setGameState('running');
      addConsoleMessage('info', 'Game server started on localhost:8000');
      return 'http://localhost:8000/rainstorm_game.html';
    }
    
    // Fallback to mock game URL
    setBuildStatus('success');
    setGameState('running');
    addConsoleMessage('info', 'Mock game server started');
    return generateMockGameUrl();
  };

  const generateMockGameUrl = () => {
    // Generate a data URL with a mock game interface
    const mockGameHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeProject.name} - Game Preview</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(45deg, #1a1a2e, #16213e, #0f3460);
            color: white; 
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
          }
          .game-container {
            text-align: center;
            position: relative;
            width: 90%;
            height: 90%;
            border: 2px solid #3b82f6;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .game-title {
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 0 0 20px #3b82f6;
            animation: pulse 2s infinite;
          }
          .game-stats {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
          }
          .player-ui {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
          }
          .ui-element {
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #3b82f6;
            min-width: 80px;
            text-align: center;
          }
          .character {
            width: 60px;
            height: 60px;
            background: #3b82f6;
            border-radius: 50%;
            margin: 20px auto;
            animation: float 3s ease-in-out infinite;
            position: relative;
          }
          .character::before {
            content: '⚔️';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
          }
          .environment {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
          }
          .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: #3b82f6;
            animation: fall linear infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes fall {
            to { transform: translateY(100vh); }
          }
          .controls {
            position: absolute;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .control-btn {
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid #3b82f6;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
          }
          .control-btn:hover {
            background: rgba(59, 130, 246, 0.4);
          }
        </style>
      </head>
      <body>
        <div class="game-container">
          <div class="environment" id="environment"></div>
          
          <div class="game-stats">
            <div>FPS: <span id="fps">60</span></div>
            <div>Level: <span id="level">1</span></div>
            <div>HP: <span id="hp">100/100</span></div>
            <div>XP: <span id="xp">350/1000</span></div>
          </div>
          
          <h1 class="game-title">${activeProject.name}</h1>
          <div class="character" id="character"></div>
          
          <div class="player-ui">
            <div class="ui-element">
              <div>Health</div>
              <div style="color: #ef4444;">100/100</div>
            </div>
            <div class="ui-element">
              <div>Mana</div>
              <div style="color: #3b82f6;">80/100</div>
            </div>
            <div class="ui-element">
              <div>Gold</div>
              <div style="color: #fbbf24;">1,250</div>
            </div>
            <div class="ui-element">
              <div>Items</div>
              <div>12/40</div>
            </div>
          </div>
          
          <div class="controls">
            <button class="control-btn" onclick="moveCharacter()">Move</button>
            <button class="control-btn" onclick="castSpell()">Cast</button>
            <button class="control-btn" onclick="useItem()">Item</button>
            <button class="control-btn" onclick="openInventory()">Inventory</button>
          </div>
        </div>
        
        <script>
          // Mock game logic
          let gameRunning = true;
          let fps = 60;
          let level = 1;
          let hp = 100;
          let xp = 350;
          
          function createParticle() {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            document.getElementById('environment').appendChild(particle);
            
            setTimeout(() => {
              particle.remove();
            }, 5000);
          }
          
          function updateStats() {
            if (!gameRunning) return;
            
            fps = 58 + Math.random() * 4;
            document.getElementById('fps').textContent = Math.round(fps);
            
            // Simulate XP gain
            if (Math.random() < 0.1) {
              xp += Math.floor(Math.random() * 10) + 1;
              if (xp >= 1000) {
                level++;
                xp = 0;
                hp = 100;
              }
            }
            
            document.getElementById('level').textContent = level;
            document.getElementById('xp').textContent = xp + '/1000';
            document.getElementById('hp').textContent = hp + '/100';
          }
          
          function moveCharacter() {
            const character = document.getElementById('character');
            character.style.transform = 'translateX(' + (Math.random() * 40 - 20) + 'px)';
            setTimeout(() => {
              character.style.transform = 'translateX(0)';
            }, 500);
          }
          
          function castSpell() {
            for (let i = 0; i < 10; i++) {
              setTimeout(() => createParticle(), i * 100);
            }
          }
          
          function useItem() {
            hp = Math.min(100, hp + 10);
            document.getElementById('hp').textContent = hp + '/100';
          }
          
          function openInventory() {
            alert('Inventory system would open here in the full game!');
          }
          
          // Start particle system
          setInterval(createParticle, 500);
          setInterval(updateStats, 100);
          
          // Communicate with parent window (dashboard)
          window.parent.postMessage({
            type: 'game:performance',
            data: {
              fps: fps,
              memoryUsage: Math.random() * 50 + 20,
              entityCount: Math.floor(Math.random() * 50) + 100,
              renderTime: Math.random() * 5 + 2
            }
          }, '*');
          
          setInterval(() => {
            window.parent.postMessage({
              type: 'game:performance',
              data: {
                fps: fps,
                memoryUsage: Math.random() * 50 + 20,
                entityCount: Math.floor(Math.random() * 50) + 100,
                renderTime: Math.random() * 5 + 2
              }
            }, '*');
          }, 1000);
        </script>
      </body>
      </html>
    `;
    
    return 'data:text/html;charset=utf-8,' + encodeURIComponent(mockGameHTML);
  };

  const setupHotReload = () => {
    if (!hotReloadEnabled) return;
    
    // Setup WebSocket connection for hot reload
    try {
      websocketRef.current = new WebSocket('ws://localhost:8080');
      
      websocketRef.current.onopen = () => {
        console.log('🔄 Hot reload connected');
        addConsoleMessage('info', 'Hot reload connected');
      };
      
      websocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleHotReloadMessage(data);
      };
      
      websocketRef.current.onerror = () => {
        console.log('⚠️ Hot reload connection failed (normal in development)');
      };
    } catch (error) {
      console.log('⚠️ Hot reload not available:', error.message);
    }
  };

  const handleHotReloadMessage = (data) => {
    switch (data.type) {
      case 'file-changed':
        if (gameSettings.autoReload) {
          reloadGame();
        }
        addConsoleMessage('info', `File changed: ${data.file}`);
        break;
      case 'build-complete':
        addConsoleMessage('success', 'Build completed, reloading game...');
        reloadGame();
        break;
      case 'build-error':
        addConsoleMessage('error', `Build error: ${data.error}`);
        setBuildStatus('error');
        break;
    }
  };

  const startPerformanceMonitoring = () => {
    performanceTimer.current = setInterval(() => {
      if (gameState === 'running') {
        updatePerformanceMetrics();
      }
    }, 1000);
  };

  const updatePerformanceMetrics = () => {
    // Mock performance metrics - in a real implementation,
    // this would get actual game performance data
    const metrics = {
      fps: Math.round(58 + Math.random() * 4),
      memoryUsage: Math.round(Math.random() * 50 + 20), // MB
      entityCount: Math.floor(Math.random() * 50) + 100,
      renderTime: Math.round((Math.random() * 5 + 2) * 100) / 100, // ms
      drawCalls: Math.floor(Math.random() * 200) + 300,
      textureMemory: Math.round(Math.random() * 100 + 50) // MB
    };
    
    setPerformanceMetrics(metrics);
    
    if (onPerformanceChange) {
      onPerformanceChange(metrics);
    }
    
    // Emit performance event
    if (eventBus) {
      eventBus.emit('game:performance:updated', { metrics });
    }
  };

  const setupEventListeners = () => {
    // Listen for messages from the game iframe
    const handleMessage = (event) => {
      if (event.data.type === 'game:performance') {
        setPerformanceMetrics(event.data.data);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  };

  const addConsoleMessage = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setGameConsole(prev => [
      { id: Date.now(), type, message, timestamp },
      ...prev.slice(0, 99) // Keep last 100 messages
    ]);
  };

  const startGame = async () => {
    try {
      setGameState('loading');
      addConsoleMessage('info', 'Starting game...');
      
      // Start the game server if not running
      if (!gameUrl) {
        const url = await startGameServer();
        setGameUrl(url);
      }
      
      // Reload the game frame
      if (gameFrameRef.current) {
        gameFrameRef.current.src = gameUrl;
      }
      
      setGameState('running');
      addConsoleMessage('success', 'Game started successfully');
    } catch (error) {
      setGameState('error');
      addConsoleMessage('error', `Failed to start game: ${error.message}`);
    }
  };

  const pauseGame = () => {
    setGameState('paused');
    addConsoleMessage('info', 'Game paused');
  };

  const reloadGame = () => {
    if (gameFrameRef.current && gameUrl) {
      gameFrameRef.current.src = gameUrl + '?reload=' + Date.now();
      setLastReload(Date.now());
      addConsoleMessage('info', 'Game reloaded');
    }
  };

  const stopGame = () => {
    setGameState('stopped');
    if (gameFrameRef.current) {
      gameFrameRef.current.src = 'about:blank';
    }
    addConsoleMessage('info', 'Game stopped');
  };

  const takeScreenshot = () => {
    // In a real implementation, this would capture the game canvas
    addConsoleMessage('info', 'Screenshot captured (mock)');
    
    if (eventBus) {
      eventBus.emit('system:alert', {
        level: 'success',
        title: 'Screenshot Captured',
        message: 'Game screenshot saved to screenshots folder'
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getCurrentResolution = () => {
    return resolutions.find(r => r.id === selectedResolution) || resolutions[0];
  };

  const cleanup = () => {
    if (performanceTimer.current) {
      clearInterval(performanceTimer.current);
    }
    if (websocketRef.current) {
      websocketRef.current.close();
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'running': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'loading': return 'text-blue-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'loading': return <Clock className="w-4 h-4 animate-spin" />;
      case 'error': return <Bug className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (!activeProject || activeProject.type !== 'arpg') {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Monitor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Game Preview</p>
          <p className="text-gray-500 text-sm">
            {!activeProject ? 'Select an ARPG project to preview the game' : 'Game preview is only available for ARPG projects'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-gray-950 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Game Preview</h2>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${getStateColor(gameState)}`}>
                {getStateIcon(gameState)}
                <span className="text-sm font-medium capitalize">{gameState}</span>
              </div>
            </div>
            
            {lastReload && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <RotateCcw className="w-3 h-3" />
                <span>Reloaded {Math.round((Date.now() - lastReload) / 1000)}s ago</span>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            {gameState === 'stopped' && (
              <button
                onClick={startGame}
                className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
            )}
            
            {gameState === 'running' && (
              <button
                onClick={pauseGame}
                className="flex items-center space-x-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}
            
            {(gameState === 'running' || gameState === 'paused') && (
              <>
                <button
                  onClick={reloadGame}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reload</span>
                </button>
                <button
                  onClick={stopGame}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                  <span>Stop</span>
                </button>
              </>
            )}
            
            <button
              onClick={takeScreenshot}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Take Screenshot"
            >
              <Camera className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Settings Bar */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            {/* Resolution */}
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-gray-400" />
              <select
                value={selectedResolution}
                onChange={(e) => setSelectedResolution(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {resolutions.map((res) => (
                  <option key={res.id} value={res.id}>{res.label}</option>
                ))}
              </select>
            </div>
            
            {/* Hot Reload */}
            <label className="flex items-center space-x-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={hotReloadEnabled}
                onChange={(e) => setHotReloadEnabled(e.target.checked)}
                className="text-blue-500"
              />
              <span>Hot Reload</span>
            </label>
            
            {/* Auto Reload */}
            <label className="flex items-center space-x-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={gameSettings.autoReload}
                onChange={(e) => setGameSettings(prev => ({ ...prev, autoReload: e.target.checked }))}
                className="text-blue-500"
              />
              <span>Auto Reload</span>
            </label>
            
            {/* Show Console */}
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                showConsole ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Console</span>
            </button>
          </div>
          
          {/* Performance Metrics */}
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>{performanceMetrics.fps} FPS</span>
            </div>
            <div className="flex items-center space-x-1">
              <HardDrive className="w-3 h-3" />
              <span>{performanceMetrics.memoryUsage}MB</span>
            </div>
            <div className="flex items-center space-x-1">
              <Grid className="w-3 h-3" />
              <span>{performanceMetrics.entityCount} entities</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Game Frame */}
        <div className="flex-1 bg-black relative">
          {gameUrl && gameState !== 'stopped' ? (
            <iframe
              ref={gameFrameRef}
              src={gameUrl}
              className="w-full h-full border-0"
              title="Game Preview"
              style={{
                width: isFullscreen ? '100%' : `${getCurrentResolution().width}px`,
                height: isFullscreen ? '100%' : `${getCurrentResolution().height}px`,
                maxWidth: '100%',
                maxHeight: '100%',
                margin: '0 auto',
                display: 'block'
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Monitor className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Game Preview</p>
                <p className="text-gray-500 text-sm mb-4">Start the game to see live preview</p>
                {gameState === 'stopped' && (
                  <button
                    onClick={startGame}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded mx-auto"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Game</span>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Performance Overlay */}
          {gameSettings.showFPS && gameState === 'running' && (
            <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-sm font-mono">
              <div>FPS: {performanceMetrics.fps}</div>
              <div>Render: {performanceMetrics.renderTime}ms</div>
              <div>Entities: {performanceMetrics.entityCount}</div>
            </div>
          )}
        </div>
        
        {/* Console Panel */}
        {showConsole && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="border-b border-gray-800 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Game Console</h3>
                <button
                  onClick={() => setGameConsole([])}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {gameConsole.map((log) => (
                <div key={log.id} className="text-xs font-mono">
                  <span className="text-gray-500">[{log.timestamp}]</span>
                  <span className={`ml-2 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePreview;