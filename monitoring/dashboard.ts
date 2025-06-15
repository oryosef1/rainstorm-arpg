// RainStorm ARPG - Real-Time Development Dashboard
// Live monitoring and debugging interface

interface Entity {
  id: string;
  components: string[];
}

interface SystemInfo {
  name: string;
  entities: number;
  avgTime: number;
  maxTime: number;
  enabled: boolean;
}

interface SessionData {
  entityCount: number;
  lastSection: string;
  timestamp: number;
}

interface MetricsData {
  timestamp: string;
  entityCount: number;
  systemCount: number;
  fpsHistory: number[];
  memoryHistory: number[];
  systems: SystemInfo[];
}

interface GameWindow extends Window {
  gameWorld?: {
    entities: Set<any>;
    systems: Set<any>;
    getProfiler?: () => {
      getAllMetrics(): Record<string, {
        entityCount: number;
        averageTime: number;
        maxTime: number;
      }>;
    };
  };
}

class DevelopmentDashboard {
  private isConnected: boolean = false;
  private entityCount: number = 0;
  private systemCount: number = 8;
  private lastUpdateTime: number = Date.now();
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];
  private eventHistory: any[] = [];
  private currentSection: string = 'overview';
  
  // Performance tracking
  private frameCount: number = 0;
  private lastFrameTime: number = performance.now();
  private fps: number = 60;
  
  // Mock data for demonstration
  private mockEntities: Entity[] = [];
  private mockSystems: SystemInfo[] = [
    { name: 'MovementSystem', entities: 0, avgTime: 2.1, maxTime: 5.2, enabled: true },
    { name: 'RenderSystem', entities: 0, avgTime: 8.7, maxTime: 15.3, enabled: true },
    { name: 'CombatSystem', entities: 0, avgTime: 1.3, maxTime: 4.1, enabled: true },
    { name: 'AISystem', entities: 0, avgTime: 3.2, maxTime: 7.8, enabled: true },
    { name: 'LevelingSystem', entities: 0, avgTime: 0.8, maxTime: 2.1, enabled: true },
    { name: 'InventorySystem', entities: 0, avgTime: 0.5, maxTime: 1.2, enabled: true },
    { name: 'CampaignSystem', entities: 0, avgTime: 0.3, maxTime: 0.9, enabled: true },
    { name: 'QuestSystem', entities: 0, avgTime: 0.4, maxTime: 1.1, enabled: true }
  ];
  
  private gameWindow?: GameWindow;
  
  constructor() {
    this.init();
  }
  
  private init(): void {
    this.setupEventListeners();
    this.updateClock();
    this.startPerformanceMonitoring();
    this.startMemoryMonitoring();
    this.showSection('overview');
    
    // Try to connect to the game
    this.attemptGameConnection();
    
    console.log('🚀 RainStorm ARPG Development Dashboard initialized');
    this.log('Dashboard initialized successfully', 'info');
  }
  
  private setupEventListeners(): void {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const section = target.dataset.section;
        if (section) {
          this.showSection(section);
        }
      });
    });
    
    // Window events
    window.addEventListener('beforeunload', () => {
      this.saveSession();
    });
    
    // Try to connect to parent window (if embedded in game)
    try {
      if (window.parent && window.parent !== window) {
        this.connectToGame(window.parent as GameWindow);
      }
    } catch (e) {
      console.log('Running in standalone mode');
    }
  }
  
  private showSection(sectionName: string): void {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.add('hidden');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }
    
    this.currentSection = sectionName;
    
    // Load section-specific data
    this.loadSectionData(sectionName);
  }
  
  private loadSectionData(section: string): void {
    switch (section) {
      case 'entities':
        this.updateEntityList();
        break;
      case 'systems':
        this.updateSystemsList();
        break;
      case 'performance':
        this.updatePerformanceCharts();
        break;
      case 'memory':
        this.updateMemoryChart();
        break;
      case 'events':
        this.updateEventLog();
        break;
      case 'console':
        this.updateDebugConsole();
        break;
      case 'profiler':
        this.updateProfilerData();
        break;
    }
  }
  
  private updateClock(): void {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const clockElement = document.getElementById('currentTime');
    if (clockElement) {
      clockElement.textContent = timeString;
    }
    setTimeout(() => this.updateClock(), 1000);
  }
  
  private startPerformanceMonitoring(): void {
    const updateFPS = () => {
      const now = performance.now();
      this.frameCount++;
      
      if (now - this.lastFrameTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.frameCount = 0;
        this.lastFrameTime = now;
        
        // Update FPS history
        this.fpsHistory.push(this.fps);
        if (this.fpsHistory.length > 100) {
          this.fpsHistory.shift();
        }
        
        // Update UI
        const fpsElement = document.getElementById('fpsValue');
        if (fpsElement) {
          fpsElement.textContent = `${this.fps} FPS`;
        }
        this.updateFPSChart();
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    requestAnimationFrame(updateFPS);
  }
  
  private startMemoryMonitoring(): void {
    const updateMemory = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const used = Math.round(memory.usedJSHeapSize / 1048576);
        const total = Math.round(memory.totalJSHeapSize / 1048576);
        
        this.memoryHistory.push(used);
        if (this.memoryHistory.length > 100) {
          this.memoryHistory.shift();
        }
        
        const memoryUsageElement = document.getElementById('memoryUsage');
        const heapUsedElement = document.getElementById('heapUsed');
        if (memoryUsageElement) {
          memoryUsageElement.textContent = `${used}MB`;
        }
        if (heapUsedElement) {
          heapUsedElement.textContent = `${used}MB / ${total}MB`;
        }
        
        const change = this.memoryHistory.length > 1 ? 
          used - this.memoryHistory[this.memoryHistory.length - 2] : 0;
        
        const changeElement = document.getElementById('memoryChange');
        if (changeElement) {
          changeElement.textContent = change >= 0 ? `+${change}MB` : `${change}MB`;
          changeElement.className = `metric-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
      }
    };
    
    updateMemory();
    setInterval(updateMemory, 2000);
  }
  
  private updateFPSChart(): void {
    const canvas = document.getElementById('fpsChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (this.fpsHistory.length < 2) return;
    
    ctx.strokeStyle = '#00d9ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const maxFPS = 60;
    const step = canvas.width / (this.fpsHistory.length - 1);
    
    this.fpsHistory.forEach((fps, index) => {
      const x = index * step;
      const y = canvas.height - (fps / maxFPS) * canvas.height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Add grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (canvas.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
  
  private updateEntityList(): void {
    const entityList = document.getElementById('entityList');
    if (!entityList) return;
    
    entityList.innerHTML = '';
    
    this.mockEntities.forEach(entity => {
      const entityDiv = document.createElement('div');
      entityDiv.className = 'entity-item';
      entityDiv.innerHTML = `
        <div class="entity-id">${entity.id}</div>
        <div class="entity-components">${entity.components.join(', ')}</div>
      `;
      entityDiv.onclick = () => this.selectEntity(entity.id);
      entityList.appendChild(entityDiv);
    });
    
    if (this.mockEntities.length === 0) {
      entityList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No entities available. Create some to get started!</div>';
    }
  }
  
  private updateSystemsList(): void {
    const systemsList = document.getElementById('systemsList');
    if (!systemsList) return;
    
    systemsList.innerHTML = '';
    
    this.mockSystems.forEach(system => {
      const systemDiv = document.createElement('div');
      systemDiv.className = 'system-monitor';
      
      const performance = (system.avgTime / 16.67) * 100; // % of 60fps budget
      
      systemDiv.innerHTML = `
        <div class="system-name">${system.name}</div>
        <div class="system-stats">
          <div>Entities: ${system.entities}</div>
          <div>Avg Time: ${system.avgTime}ms</div>
          <div>Max Time: ${system.maxTime}ms</div>
          <div>Status: ${system.enabled ? '✅ Enabled' : '❌ Disabled'}</div>
        </div>
        <div class="performance-bar">
          <div class="performance-fill" style="width: ${Math.min(performance, 100)}%"></div>
        </div>
      `;
      systemsList.appendChild(systemDiv);
    });
  }
  
  createTestEntity(): void {
    const entityId = `entity_${Date.now()}`;
    const components = ['Position', 'Velocity', 'Sprite'];
    
    // Randomly add more components
    const possibleComponents = ['Health', 'Combat', 'AI', 'Level', 'Attributes'];
    possibleComponents.forEach(comp => {
      if (Math.random() > 0.5) {
        components.push(comp);
      }
    });
    
    this.mockEntities.push({
      id: entityId,
      components: components
    });
    
    // Update system entity counts
    this.mockSystems.forEach(system => {
      const hasRequiredComponents = this.getSystemRequiredComponents(system.name)
        .every(comp => components.includes(comp));
      if (hasRequiredComponents) {
        system.entities++;
      }
    });
    
    this.entityCount = this.mockEntities.length;
    const entityCountElement = document.getElementById('entityCount');
    const entityChangeElement = document.getElementById('entityChange');
    if (entityCountElement) {
      entityCountElement.textContent = this.entityCount.toString();
    }
    if (entityChangeElement) {
      entityChangeElement.textContent = `+${this.entityCount} this session`;
    }
    
    this.updateEntityList();
    this.log(`Created entity ${entityId} with components: ${components.join(', ')}`, 'info');
  }
  
  private getSystemRequiredComponents(systemName: string): string[] {
    const requirements: Record<string, string[]> = {
      'MovementSystem': ['Position', 'Velocity'],
      'RenderSystem': ['Position', 'Sprite'],
      'CombatSystem': ['Position', 'Combat', 'Health'],
      'AISystem': ['Position', 'AI', 'Velocity'],
      'LevelingSystem': ['Level'],
      'InventorySystem': ['Inventory'],
      'CampaignSystem': ['CampaignProgress'],
      'QuestSystem': ['CampaignProgress']
    };
    return requirements[systemName] || [];
  }
  
  clearAllEntities(): void {
    this.mockEntities = [];
    this.entityCount = 0;
    
    // Reset system entity counts
    this.mockSystems.forEach(system => {
      system.entities = 0;
    });
    
    const entityCountElement = document.getElementById('entityCount');
    const entityChangeElement = document.getElementById('entityChange');
    if (entityCountElement) {
      entityCountElement.textContent = '0';
    }
    if (entityChangeElement) {
      entityChangeElement.textContent = '0 this session';
    }
    
    this.updateEntityList();
    this.log('All entities cleared', 'warning');
  }
  
  private selectEntity(entityId: string): void {
    this.log(`Selected entity: ${entityId}`, 'info');
    // Show entity details in inspector (could be implemented)
  }
  
  private log(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `<div class="log-entry ${type}">
      <span class="timestamp">[${timestamp}]</span> ${message}
    </div>`;
    
    // Add to overview console
    const overviewConsole = document.querySelector('#overview-section .console-output');
    if (overviewConsole) {
      overviewConsole.innerHTML += logEntry;
      overviewConsole.scrollTop = overviewConsole.scrollHeight;
    }
    
    // Add to debug console
    const debugConsole = document.getElementById('debugConsole');
    if (debugConsole) {
      debugConsole.innerHTML += logEntry;
      debugConsole.scrollTop = debugConsole.scrollHeight;
    }
    
    // Add to event log
    const eventLog = document.getElementById('eventLog');
    if (eventLog) {
      eventLog.innerHTML += logEntry;
      eventLog.scrollTop = eventLog.scrollHeight;
    }
  }
  
  private attemptGameConnection(): void {
    // Try to connect to the main game window
    try {
      if (window.opener && window.opener.window) {
        this.connectToGame(window.opener as GameWindow);
        return;
      }
    } catch (e) {
      // Connection failed
    }
    
    // Try WebSocket connection (if game supports it)
    this.tryWebSocketConnection();
  }
  
  private connectToGame(gameWindow: GameWindow): void {
    try {
      if (gameWindow.gameWorld) {
        this.isConnected = true;
        this.gameWindow = gameWindow;
        
        // Set up real-time data polling
        this.startGameDataPolling();
        
        const gameStatusElement = document.getElementById('gameStatus');
        if (gameStatusElement) {
          gameStatusElement.className = 'status-dot online';
        }
        this.log('Connected to game successfully', 'info');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      this.log('Failed to connect to game: ' + errorMessage, 'error');
    }
  }
  
  private tryWebSocketConnection(): void {
    // This would connect to a WebSocket server in the game
    // For now, we'll simulate the connection
    setTimeout(() => {
      this.isConnected = true;
      const gameStatusElement = document.getElementById('gameStatus');
      if (gameStatusElement) {
        gameStatusElement.className = 'status-dot online';
      }
      this.log('Mock connection established (WebSocket simulation)', 'info');
    }, 1000);
  }
  
  private startGameDataPolling(): void {
    const pollGameData = () => {
      if (this.isConnected && this.gameWindow && this.gameWindow.gameWorld) {
        try {
          const world = this.gameWindow.gameWorld;
          
          // Update entity count
          this.entityCount = world.entities.size;
          const entityCountElement = document.getElementById('entityCount');
          if (entityCountElement) {
            entityCountElement.textContent = this.entityCount.toString();
          }
          
          // Update system count
          this.systemCount = world.systems.size;
          const systemCountElement = document.getElementById('systemCount');
          if (systemCountElement) {
            systemCountElement.textContent = this.systemCount.toString();
          }
          
          // Get performance metrics
          if (world.getProfiler) {
            const profiler = world.getProfiler();
            const metrics = profiler.getAllMetrics();
            this.updateSystemMetrics(metrics);
          }
          
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          this.log('Error polling game data: ' + errorMessage, 'error');
        }
      }
    };
    
    setInterval(pollGameData, 1000);
  }
  
  private updateSystemMetrics(metrics: Record<string, { entityCount: number; averageTime: number; maxTime: number }>): void {
    Object.keys(metrics).forEach(systemName => {
      const metric = metrics[systemName];
      const system = this.mockSystems.find(s => s.name === systemName);
      
      if (system) {
        system.entities = metric.entityCount;
        system.avgTime = metric.averageTime;
        system.maxTime = metric.maxTime;
      }
    });
    
    if (this.currentSection === 'systems') {
      this.updateSystemsList();
    }
  }
  
  private updatePerformanceCharts(): void {
    // Placeholder for performance charts implementation
    this.updateFPSChart();
  }
  
  private updateMemoryChart(): void {
    // Placeholder for memory chart implementation
  }
  
  private updateEventLog(): void {
    // Placeholder for event log implementation
  }
  
  private updateDebugConsole(): void {
    // Placeholder for debug console implementation
  }
  
  private updateProfilerData(): void {
    // Placeholder for profiler data implementation
  }
  
  refreshDashboard(): void {
    this.log('Dashboard refreshed', 'info');
    this.loadSectionData(this.currentSection);
    
    // Flash the refresh button
    const btn = (event as any)?.target;
    if (btn) {
      btn.style.background = '#00ff88';
      setTimeout(() => {
        btn.style.background = '#00d9ff';
      }, 200);
    }
  }
  
  exportMetrics(): void {
    const data: MetricsData = {
      timestamp: new Date().toISOString(),
      entityCount: this.entityCount,
      systemCount: this.systemCount,
      fpsHistory: this.fpsHistory,
      memoryHistory: this.memoryHistory,
      systems: this.mockSystems
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rainstorm-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.log('Metrics exported successfully', 'info');
  }
  
  clearLogs(): void {
    document.querySelectorAll('.console-output').forEach(console => {
      console.innerHTML = '';
    });
    this.log('Logs cleared', 'info');
  }
  
  private saveSession(): void {
    const sessionData: SessionData = {
      entityCount: this.entityCount,
      lastSection: this.currentSection,
      timestamp: Date.now()
    };
    
    localStorage.setItem('rainstorm-dashboard-session', JSON.stringify(sessionData));
  }
  
  private loadSession(): void {
    const sessionData = localStorage.getItem('rainstorm-dashboard-session');
    if (sessionData) {
      try {
        const data: SessionData = JSON.parse(sessionData);
        this.entityCount = data.entityCount || 0;
        this.showSection(data.lastSection || 'overview');
      } catch (e) {
        console.error('Failed to load session data:', e);
      }
    }
  }
}

// Global functions for UI interaction
(window as any).refreshDashboard = function() {
  if (dashboard) {
    dashboard.refreshDashboard();
  }
};

(window as any).exportMetrics = function() {
  if (dashboard) {
    dashboard.exportMetrics();
  }
};

(window as any).clearLogs = function() {
  if (dashboard) {
    dashboard.clearLogs();
  }
};

(window as any).createTestEntity = function() {
  if (dashboard) {
    dashboard.createTestEntity();
  }
};

(window as any).clearAllEntities = function() {
  if (dashboard) {
    dashboard.clearAllEntities();
  }
};

// Initialize dashboard when page loads
let dashboard: DevelopmentDashboard;
document.addEventListener('DOMContentLoaded', () => {
  dashboard = new DevelopmentDashboard();
});

export { DevelopmentDashboard };