// Real-time System - WebSocket communication and live updates
// Handles real-time communication between dashboard and clients

import * as http from 'http';

interface RealtimeConfig {
  port?: number;
  heartbeatInterval?: number;
  maxConnections?: number;
  enableCORS?: boolean;
  [key: string]: any;
}

interface ClientInfo {
  id: string;
  socket: any;
  connectedAt: number;
  lastActivity: number;
  subscriptions: Set<string>;
  metadata: any;
  callback?: Function;
}

interface Room {
  name: string;
  clients: Set<string>;
  createdAt: number;
  metadata: any;
}

interface Message {
  channel: string;
  data: any;
  timestamp: number;
  id: string;
  room?: string;
  direct?: boolean;
}

interface Notification {
  type?: string;
  title: string;
  message: string;
}

interface Alert {
  level?: string;
  title: string;
  message: string;
  urgent?: boolean;
}

interface EventBus {
  emit(eventName: string, data: any): void;
  addEventListener(eventName: string, handler: Function): void;
}

declare global {
  interface Window {
    EventBus?: EventBus;
  }
  
  var EventBus: EventBus | undefined;
}

export class RealtimeSystem {
  private config: RealtimeConfig;
  private clients: Map<string, ClientInfo> = new Map();
  private rooms: Map<string, Room> = new Map();
  private messageQueue: Message[] = [];
  private server: http.Server | null = null;
  private io: any = null;
  private startTime: number = 0;

  constructor(config: RealtimeConfig = {}) {
    this.config = {
      port: config.port || 8003,
      heartbeatInterval: config.heartbeatInterval || 30000,
      maxConnections: config.maxConnections || 100,
      enableCORS: config.enableCORS !== false,
      ...config
    };
    
    this.initializeServer();
  }
  
  private async initializeServer(): Promise<void> {
    try {
      // Initialize HTTP server
      this.server = http.createServer();
      
      // Initialize Socket.io
      const { Server } = await import('socket.io');
      this.io = new Server(this.server, {
        cors: this.config.enableCORS ? {
          origin: "*",
          methods: ["GET", "POST"]
        } : false,
        transports: ['websocket', 'polling']
      });
      
      this.setupSocketHandlers();
      this.startHeartbeat();
      
      // Start server
      this.server.listen(this.config.port, () => {
        console.log(`📡 Real-time system listening on port ${this.config.port}`);
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize real-time system:', error);
    }
  }
  
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: any) => {
      this.handleClientConnection(socket);
    });
  }
  
  private handleClientConnection(socket: any): void {
    const clientId = socket.id;
    const clientInfo: ClientInfo = {
      id: clientId,
      socket,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      subscriptions: new Set(),
      metadata: {}
    };
    
    this.clients.set(clientId, clientInfo);
    console.log(`🔌 Client connected: ${clientId} (${this.clients.size} total)`);
    
    // Send welcome message
    socket.emit('dashboard.connected', {
      clientId,
      timestamp: Date.now(),
      server: 'agent-dashboard-realtime'
    });
    
    // Handle client events
    this.setupClientEventHandlers(socket, clientInfo);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleClientDisconnection(clientId);
    });
    
    // Update activity on any message
    socket.onAny(() => {
      clientInfo.lastActivity = Date.now();
    });
  }
  
  private setupClientEventHandlers(socket: any, clientInfo: ClientInfo): void {
    // Subscription management
    socket.on('subscribe', (data: any) => {
      this.handleSubscription(clientInfo, data);
    });
    
    socket.on('unsubscribe', (data: any) => {
      this.handleUnsubscription(clientInfo, data);
    });
    
    // Room management
    socket.on('join-room', (data: any) => {
      this.handleJoinRoom(clientInfo, data.room);
    });
    
    socket.on('leave-room', (data: any) => {
      this.handleLeaveRoom(clientInfo, data.room);
    });
    
    // Dashboard specific events
    socket.on('dashboard.request-metrics', () => {
      this.sendCurrentMetrics(clientInfo);
    });
    
    socket.on('dashboard.request-status', () => {
      this.sendSystemStatus(clientInfo);
    });
    
    // Claude execution events
    socket.on('claude.execute', (data: any) => {
      this.handleClaudeExecutionRequest(clientInfo, data);
    });
    
    // Workflow events
    socket.on('workflow.execute', (data: any) => {
      this.handleWorkflowExecutionRequest(clientInfo, data);
    });
    
    // Chat/messaging
    socket.on('message', (data: any) => {
      this.handleMessage(clientInfo, data);
    });
    
    // Heartbeat
    socket.on('heartbeat', () => {
      socket.emit('heartbeat-response', { timestamp: Date.now() });
    });
  }
  
  private handleClientDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from all rooms
      for (const [roomName, room] of this.rooms) {
        room.clients.delete(clientId);
        if (room.clients.size === 0) {
          this.rooms.delete(roomName);
        }
      }
      
      this.clients.delete(clientId);
      console.log(`🔌 Client disconnected: ${clientId} (${this.clients.size} remaining)`);
    }
  }
  
  // === SUBSCRIPTION MANAGEMENT ===
  
  private handleSubscription(clientInfo: ClientInfo, data: any): void {
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      for (const channel of channels) {
        clientInfo.subscriptions.add(channel);
      }
    } else if (typeof channels === 'string') {
      clientInfo.subscriptions.add(channels);
    }
    
    clientInfo.socket.emit('subscription.confirmed', {
      channels: Array.from(clientInfo.subscriptions),
      timestamp: Date.now()
    });
    
    console.log(`📢 Client ${clientInfo.id} subscribed to: ${Array.from(clientInfo.subscriptions).join(', ')}`);
  }
  
  private handleUnsubscription(clientInfo: ClientInfo, data: any): void {
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      for (const channel of channels) {
        clientInfo.subscriptions.delete(channel);
      }
    } else if (typeof channels === 'string') {
      clientInfo.subscriptions.delete(channels);
    }
    
    clientInfo.socket.emit('unsubscription.confirmed', {
      channels: Array.from(clientInfo.subscriptions),
      timestamp: Date.now()
    });
  }
  
  // === ROOM MANAGEMENT ===
  
  private handleJoinRoom(clientInfo: ClientInfo, roomName: string): void {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, {
        name: roomName,
        clients: new Set(),
        createdAt: Date.now(),
        metadata: {}
      });
    }
    
    const room = this.rooms.get(roomName)!;
    room.clients.add(clientInfo.id);
    clientInfo.socket.join(roomName);
    
    // Notify room about new member
    this.io.to(roomName).emit('room.member-joined', {
      room: roomName,
      clientId: clientInfo.id,
      memberCount: room.clients.size,
      timestamp: Date.now()
    });
    
    console.log(`🏠 Client ${clientInfo.id} joined room: ${roomName}`);
  }
  
  private handleLeaveRoom(clientInfo: ClientInfo, roomName: string): void {
    const room = this.rooms.get(roomName);
    if (room) {
      room.clients.delete(clientInfo.id);
      clientInfo.socket.leave(roomName);
      
      // Notify room about member leaving
      this.io.to(roomName).emit('room.member-left', {
        room: roomName,
        clientId: clientInfo.id,
        memberCount: room.clients.size,
        timestamp: Date.now()
      });
      
      // Delete room if empty
      if (room.clients.size === 0) {
        this.rooms.delete(roomName);
      }
    }
  }
  
  // === BROADCASTING ===
  
  broadcast(channel: string, data: any): void {
    const message: Message = {
      channel,
      data,
      timestamp: Date.now(),
      id: this.generateMessageId()
    };
    
    // Send to all subscribed clients
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions.has(channel) || client.subscriptions.has('*')) {
        client.socket.emit('broadcast', message);
      }
    }
    
    // Store in message queue for replay
    this.messageQueue.push(message);
    this.cleanupMessageQueue();
    
    console.log(`📡 Broadcasted to channel '${channel}': ${this.getSubscriberCount(channel)} clients`);
  }
  
  broadcastToRoom(roomName: string, channel: string, data: any): void {
    const message: Message = {
      channel,
      data,
      timestamp: Date.now(),
      id: this.generateMessageId(),
      room: roomName
    };
    
    this.io.to(roomName).emit('broadcast', message);
    
    console.log(`📡 Broadcasted to room '${roomName}' on channel '${channel}'`);
  }
  
  sendToClient(clientId: string, channel: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client) {
      const message: Message = {
        channel,
        data,
        timestamp: Date.now(),
        id: this.generateMessageId(),
        direct: true
      };
      
      client.socket.emit('direct-message', message);
    }
  }
  
  // === DASHBOARD SPECIFIC HANDLERS ===
  
  private handleClaudeExecutionRequest(clientInfo: ClientInfo, data: any): void {
    // Emit event for the dashboard to handle
    this.emitSystemEvent('claude.execution.requested', {
      clientId: clientInfo.id,
      request: data,
      timestamp: Date.now()
    });
  }
  
  private handleWorkflowExecutionRequest(clientInfo: ClientInfo, data: any): void {
    // Emit event for the dashboard to handle
    this.emitSystemEvent('workflow.execution.requested', {
      clientId: clientInfo.id,
      request: data,
      timestamp: Date.now()
    });
  }
  
  private handleMessage(clientInfo: ClientInfo, data: any): void {
    const message = {
      id: this.generateMessageId(),
      clientId: clientInfo.id,
      content: data.content,
      type: data.type || 'chat',
      timestamp: Date.now(),
      room: data.room
    };
    
    if (data.room) {
      // Send to room
      this.broadcastToRoom(data.room, 'chat.message', message);
    } else {
      // Send to all clients
      this.broadcast('chat.message', message);
    }
  }
  
  private sendCurrentMetrics(clientInfo: ClientInfo): void {
    // This would get metrics from the dashboard
    const metrics = this.getCurrentSystemMetrics();
    this.sendToClient(clientInfo.id, 'metrics.current', metrics);
  }
  
  private sendSystemStatus(clientInfo: ClientInfo): void {
    const status = {
      realtime: {
        connectedClients: this.clients.size,
        activeRooms: this.rooms.size,
        messageQueueSize: this.messageQueue.length,
        uptime: Date.now() - this.startTime
      },
      timestamp: Date.now()
    };
    
    this.sendToClient(clientInfo.id, 'system.status', status);
  }
  
  // === SYSTEM EVENTS ===
  
  private emitSystemEvent(eventName: string, data: any): void {
    // Emit to Node.js EventEmitter or global event system
    if (typeof window !== 'undefined' && window.EventBus) {
      window.EventBus.emit(eventName, data);
    } else if (typeof global !== 'undefined' && global.EventBus) {
      global.EventBus.emit(eventName, data);
    }
  }
  
  // === HEARTBEAT SYSTEM ===
  
  private startHeartbeat(): void {
    this.startTime = Date.now();
    
    setInterval(() => {
      const now = Date.now();
      const staleClients: string[] = [];
      
      // Check for stale clients
      for (const [clientId, client] of this.clients) {
        const inactiveTime = now - client.lastActivity;
        
        if (inactiveTime > this.config.heartbeatInterval! * 2) {
          staleClients.push(clientId);
        } else {
          // Send heartbeat
          client.socket.emit('heartbeat', { timestamp: now });
        }
      }
      
      // Disconnect stale clients
      for (const clientId of staleClients) {
        const client = this.clients.get(clientId);
        if (client) {
          console.log(`💔 Disconnecting stale client: ${clientId}`);
          client.socket.disconnect();
        }
      }
      
      // Broadcast system health
      this.broadcast('system.heartbeat', {
        timestamp: now,
        connectedClients: this.clients.size,
        uptime: now - this.startTime
      });
      
    }, this.config.heartbeatInterval);
  }
  
  // === UTILITIES ===
  
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getSubscriberCount(channel: string): number {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(channel) || client.subscriptions.has('*')) {
        count++;
      }
    }
    return count;
  }
  
  private cleanupMessageQueue(): void {
    // Keep only last 1000 messages
    if (this.messageQueue.length > 1000) {
      this.messageQueue = this.messageQueue.slice(-1000);
    }
  }
  
  private getCurrentSystemMetrics(): any {
    // This would interface with the main dashboard pod
    return {
      realtime: {
        connectedClients: this.clients.size,
        activeRooms: this.rooms.size,
        messagesSent: this.messageQueue.length,
        uptime: Date.now() - this.startTime
      },
      timestamp: Date.now()
    };
  }
  
  // === PUBLIC API ===
  
  // Subscribe a callback to a channel
  subscribe(clientId: string, callback: Function): boolean {
    const client = this.clients.get(clientId);
    if (client) {
      client.callback = callback;
      return true;
    }
    return false;
  }
  
  // Unsubscribe a client
  unsubscribe(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (client) {
      delete client.callback;
      return true;
    }
    return false;
  }
  
  // Get connected clients
  getClients(): any[] {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      connectedAt: client.connectedAt,
      lastActivity: client.lastActivity,
      subscriptions: Array.from(client.subscriptions)
    }));
  }
  
  // Get active rooms
  getRooms(): any[] {
    return Array.from(this.rooms.values()).map(room => ({
      name: room.name,
      memberCount: room.clients.size,
      createdAt: room.createdAt
    }));
  }
  
  // Send notification to all clients
  sendNotification(notification: Notification): void {
    this.broadcast('notification', {
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      timestamp: Date.now(),
      id: this.generateMessageId()
    });
  }
  
  // Send system alert
  sendAlert(alert: Alert): void {
    this.broadcast('alert', {
      level: alert.level || 'warning',
      title: alert.title,
      message: alert.message,
      timestamp: Date.now(),
      id: this.generateMessageId(),
      urgent: alert.urgent || false
    });
  }
  
  // === DASHBOARD INTEGRATION ===
  
  // Connect to dashboard events
  connectToDashboard(dashboardPod: any): void {
    // Listen for dashboard events and broadcast them
    this.setupDashboardEventListeners(dashboardPod);
  }
  
  private setupDashboardEventListeners(dashboardPod: any): void {
    // Claude execution events
    dashboardPod.addEventListener('dashboard.claude.started', (data: any) => {
      this.broadcast('claude.execution.started', data);
    });
    
    dashboardPod.addEventListener('dashboard.claude.completed', (data: any) => {
      this.broadcast('claude.execution.completed', data);
    });
    
    dashboardPod.addEventListener('dashboard.claude.error', (data: any) => {
      this.broadcast('claude.execution.error', data);
    });
    
    // Workflow events
    dashboardPod.addEventListener('dashboard.workflow.started', (data: any) => {
      this.broadcast('workflow.started', data);
    });
    
    dashboardPod.addEventListener('dashboard.workflow.progress', (data: any) => {
      this.broadcast('workflow.progress', data);
    });
    
    dashboardPod.addEventListener('dashboard.workflow.completed', (data: any) => {
      this.broadcast('workflow.completed', data);
    });
    
    dashboardPod.addEventListener('dashboard.workflow.error', (data: any) => {
      this.broadcast('workflow.error', data);
    });
    
    // System events
    dashboardPod.addEventListener('dashboard.metrics.updated', (data: any) => {
      this.broadcast('metrics.updated', data);
    });
    
    dashboardPod.addEventListener('dashboard.file.changed', (data: any) => {
      this.broadcast('file.changed', data);
    });
  }
  
  // === CLEANUP ===
  
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down real-time system...');
    
    // Notify all clients about shutdown
    this.broadcast('system.shutdown', {
      message: 'Server is shutting down',
      timestamp: Date.now()
    });
    
    // Wait a bit for messages to be sent
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Disconnect all clients
    for (const client of this.clients.values()) {
      client.socket.disconnect();
    }
    
    // Close server
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ Real-time system shutdown complete');
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RealtimeSystem };
}