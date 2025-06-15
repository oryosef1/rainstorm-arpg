// RainStorm ARPG - Development Dashboard Integration
// Connects the TypeScript game engine to the real-time dashboard

import { IWorld, IEntity, ISystem } from '../ecs/ecs-core';
import { SystemMetrics, PerformanceReport } from '../../types/ecs-types';

export interface DashboardData {
  entityCount: number;
  systemCount: number;
  activeSystemsCount: number;
  totalUpdateTime: number;
  memoryUsage: number;
  systemMetrics: Record<string, SystemMetrics>;
  entityDetails: EntitySnapshot[];
  performanceReport: PerformanceReport | null;
  errors: string[];
  warnings: string[];
}

export interface EntitySnapshot {
  id: string;
  active: boolean;
  componentTypes: string[];
  componentCount: number;
  position?: { x: number; y: number; z: number };
  health?: { current: number; maximum: number };
}

export interface DashboardConnection {
  send(data: DashboardData): void;
  isConnected(): boolean;
  disconnect(): void;
}

export class WindowDashboardConnection implements DashboardConnection {
  private dashboardWindow: Window | null = null;
  private connected = false;

  constructor() {
    this.attemptConnection();
  }

  private attemptConnection(): void {
    try {
      // Try to open dashboard window
      this.dashboardWindow = window.open(
        'monitoring/dev-dashboard.html',
        'rainstorm-dashboard',
        'width=1400,height=900,resizable=yes,scrollbars=yes'
      );

      if (this.dashboardWindow) {
        this.connected = true;
        
        // Wait for dashboard to load
        this.dashboardWindow.addEventListener('load', () => {
          this.setupBidirectionalCommunication();
        });

        // Handle window close
        this.dashboardWindow.addEventListener('beforeunload', () => {
          this.connected = false;
          this.dashboardWindow = null;
        });
      }
    } catch (error) {
      console.warn('Could not open dashboard window:', error);
    }
  }

  private setupBidirectionalCommunication(): void {
    if (!this.dashboardWindow) return;

    // Expose game world to dashboard
    (this.dashboardWindow as any).gameWorld = (window as any).gameWorld;
    
    // Set up message passing
    window.addEventListener('message', (event) => {
      if (event.source === this.dashboardWindow) {
        this.handleDashboardMessage(event.data);
      }
    });
  }

  private handleDashboardMessage(message: any): void {
    switch (message.type) {
      case 'REQUEST_ENTITY_DETAILS':
        this.sendEntityDetails(message.entityId);
        break;
      case 'REQUEST_SYSTEM_CONTROL':
        this.handleSystemControl(message.systemName, message.action);
        break;
      case 'REQUEST_PERFORMANCE_REPORT':
        this.sendPerformanceReport();
        break;
    }
  }

  private sendEntityDetails(entityId: string): void {
    // Implementation would get entity details from world
    // This is a simplified version
  }

  private handleSystemControl(systemName: string, action: string): void {
    // Allow dashboard to enable/disable systems
    const world = (window as any).gameWorld as IWorld;
    if (world) {
      const system = world.getSystem(systemName);
      if (system) {
        switch (action) {
          case 'enable':
            system.enabled = true;
            break;
          case 'disable':
            system.enabled = false;
            break;
          case 'restart':
            system.enabled = false;
            setTimeout(() => { system.enabled = true; }, 100);
            break;
        }
      }
    }
  }

  private sendPerformanceReport(): void {
    const world = (window as any).gameWorld as IWorld;
    if (world && 'getProfiler' in world && typeof (world as any).getProfiler === 'function') {
      try {
        const profiler = (world as any).getProfiler();
        if (profiler && typeof profiler.generateReport === 'function') {
          const report = profiler.generateReport();
          this.send({ performanceReport: report } as any);
        }
      } catch (error) {
        // Profiler not available, ignore
      }
    }
  }

  send(data: DashboardData): void {
    if (this.connected && this.dashboardWindow) {
      try {
        this.dashboardWindow.postMessage({
          type: 'GAME_DATA_UPDATE',
          data: data
        }, '*');
      } catch (error) {
        console.warn('Failed to send data to dashboard:', error);
        this.connected = false;
      }
    }
  }

  isConnected(): boolean {
    return this.connected && this.dashboardWindow !== null && !this.dashboardWindow.closed;
  }

  disconnect(): void {
    if (this.dashboardWindow) {
      this.dashboardWindow.close();
      this.dashboardWindow = null;
    }
    this.connected = false;
  }
}

export class WebSocketDashboardConnection implements DashboardConnection {
  private socket: WebSocket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string = 'ws://localhost:8080/dashboard') {
    this.connect();
  }

  private connect(): void {
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        console.log('Dashboard WebSocket connected');
      };

      this.socket.onclose = () => {
        this.connected = false;
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.warn('Dashboard WebSocket error:', error);
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

    } catch (error) {
      console.warn('Failed to create WebSocket connection:', error);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect to dashboard (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    }
  }

  private handleMessage(message: any): void {
    // Handle commands from dashboard
    switch (message.type) {
      case 'PING':
        this.send({ type: 'PONG' } as any);
        break;
      // Add more message handlers as needed
    }
  }

  send(data: DashboardData): void {
    if (this.connected && this.socket) {
      try {
        this.socket.send(JSON.stringify({
          type: 'GAME_DATA',
          timestamp: Date.now(),
          data: data
        }));
      } catch (error) {
        console.warn('Failed to send data via WebSocket:', error);
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
  }
}

export class DashboardIntegration {
  private connections: DashboardConnection[] = [];
  private updateInterval: number = 0;
  private lastUpdateTime = 0;
  private errorLog: string[] = [];
  private warningLog: string[] = [];

  constructor(private world: IWorld, updateFrequency: number = 1000) {
    this.setupConnections();
    this.startUpdating(updateFrequency);
    this.setupErrorCapture();
  }

  private setupConnections(): void {
    // Try to establish multiple connection types
    this.connections.push(new WindowDashboardConnection());
    // Uncomment if WebSocket server is available
    // this.connections.push(new WebSocketDashboardConnection());
  }

  private startUpdating(frequency: number): void {
    this.updateInterval = setInterval(() => {
      this.sendUpdate();
    }, frequency) as any;
  }

  private setupErrorCapture(): void {
    // Capture console errors and warnings
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      this.errorLog.push(args.join(' '));
      if (this.errorLog.length > 50) this.errorLog.shift();
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.warningLog.push(args.join(' '));
      if (this.warningLog.length > 50) this.warningLog.shift();
      originalWarn.apply(console, args);
    };

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.errorLog.push(`${event.filename}:${event.lineno} - ${event.message}`);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.errorLog.push(`Unhandled Promise Rejection: ${event.reason}`);
    });
  }

  private sendUpdate(): void {
    const data = this.gatherDashboardData();
    
    this.connections.forEach(connection => {
      if (connection.isConnected()) {
        connection.send(data);
      }
    });
  }

  private gatherDashboardData(): DashboardData {
    const systemMetrics: Record<string, SystemMetrics> = {};
    let totalUpdateTime = 0;
    let activeSystemsCount = 0;

    // Gather system metrics
    for (const [name, system] of this.world.systems) {
      if ('getMetrics' in system && typeof system.getMetrics === 'function') {
        const metrics = (system as any).getMetrics() as SystemMetrics;
        systemMetrics[name] = metrics;
        totalUpdateTime += metrics.executionTime;
      }
      
      if (system.enabled) {
        activeSystemsCount++;
      }
    }

    // Gather entity snapshots
    const entityDetails: EntitySnapshot[] = [];
    for (const [id, entity] of this.world.entities) {
      if (entityDetails.length < 100) { // Limit for performance
        entityDetails.push(this.createEntitySnapshot(entity));
      }
    }

    // Get performance report
    let performanceReport: PerformanceReport | null = null;
    if ('getProfiler' in this.world && typeof (this.world as any).getProfiler === 'function') {
      try {
        const profiler = (this.world as any).getProfiler();
        if (profiler && typeof profiler.generateReport === 'function') {
          performanceReport = profiler.generateReport();
        }
      } catch (error) {
        // Profiler not available, ignore
      }
    }

    // Estimate memory usage
    const memoryUsage = this.estimateMemoryUsage();

    return {
      entityCount: this.world.entities.size,
      systemCount: this.world.systems.size,
      activeSystemsCount,
      totalUpdateTime,
      memoryUsage,
      systemMetrics,
      entityDetails,
      performanceReport,
      errors: [...this.errorLog],
      warnings: [...this.warningLog]
    };
  }

  private createEntitySnapshot(entity: IEntity): EntitySnapshot {
    const componentTypes = Array.from(entity.components.keys());
    
    // Extract common component data
    const position = entity.getComponent('Position') as any;
    const health = entity.getComponent('Health') as any;

    const snapshot: EntitySnapshot = {
      id: entity.id,
      active: entity.active,
      componentTypes,
      componentCount: entity.components.size
    };
    
    if (position) {
      snapshot.position = { x: position.x, y: position.y, z: position.z };
    }
    
    if (health) {
      snapshot.health = { current: health.current, maximum: health.maximum };
    }
    
    return snapshot;
  }

  private estimateMemoryUsage(): number {
    // Simple memory estimation
    let totalSize = 0;

    // Estimate entity memory
    totalSize += this.world.entities.size * 1000; // ~1KB per entity

    // Estimate system memory
    totalSize += this.world.systems.size * 500; // ~500B per system

    return totalSize;
  }

  public addCustomMetric(name: string, value: number): void {
    // Allow external code to add custom metrics
    // These could be sent to the dashboard
  }

  public logEvent(type: string, data: any): void {
    // Log custom events that the dashboard can display
    const connections = this.connections.filter(c => c.isConnected());
    connections.forEach(connection => {
      connection.send({
        type: 'CUSTOM_EVENT',
        eventType: type,
        eventData: data,
        timestamp: Date.now()
      } as any);
    });
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.connections.forEach(connection => {
      connection.disconnect();
    });

    this.connections = [];
  }
}

// Utility function to easily add dashboard integration to any world
export function addDashboardIntegration(world: IWorld, options?: {
  updateFrequency?: number;
  autoOpen?: boolean;
}): DashboardIntegration {
  const integration = new DashboardIntegration(world, options?.updateFrequency);
  
  // Store reference in window for debugging
  (window as any).dashboardIntegration = integration;
  
  return integration;
}