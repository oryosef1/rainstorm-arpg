// RainStorm ARPG - Advanced Analytics & Player Insights
// Comprehensive player behavior tracking and game metrics analysis

export interface PlayerAction {
  id: string;
  playerId: string;
  actionType: string;
  timestamp: number;
  data: Record<string, any>;
  sessionId: string;
  duration?: number | undefined;
  location?: { x: number; y: number; z: number } | undefined;
  context?: Record<string, any> | undefined;
}

export interface PlayerSession {
  id: string;
  playerId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  actions: PlayerAction[];
  metrics: SessionMetrics;
  deviceInfo: DeviceInfo;
  gameVersion: string;
}

export interface SessionMetrics {
  totalActions: number;
  uniqueActionTypes: number;
  averageActionInterval: number;
  peakActivityTime: number;
  distanceTraveled: number;
  entitiesInteracted: number;
  errorsEncountered: number;
  performanceIssues: number;
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  viewport: string;
  pixelRatio: number;
  touchSupport: boolean;
  connectionType: string;
  memory?: number | undefined;
  cores?: number | undefined;
}

export interface PlayerInsight {
  id: string;
  playerId: string;
  type: 'behavior' | 'performance' | 'engagement' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  confidence: number; // 0-1
  timestamp: number;
  data: Record<string, any>;
}

export interface AnalyticsConfig {
  enableRealTimeTracking: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableHeatmaps: boolean;
  privacyMode: boolean;
  maxSessionDuration: number; // milliseconds
  maxActionsPerSession: number;
  insightGenerationInterval: number; // milliseconds
}

export class AdvancedAnalyticsEngine {
  private config: AnalyticsConfig;
  private currentSession: PlayerSession | null = null;
  private actionBuffer: PlayerAction[] = [];
  private sessions: Map<string, PlayerSession> = new Map();
  private insights: PlayerInsight[] = [];
  private heatmapData: Map<string, { x: number; y: number; count: number; intensity: number }[]> = new Map();
  private performanceMetrics: Map<string, PerformanceMetric[]> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private insightTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = {
      enableRealTimeTracking: true,
      batchSize: 50,
      flushInterval: 10000, // 10 seconds
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableHeatmaps: true,
      privacyMode: false,
      maxSessionDuration: 4 * 60 * 60 * 1000, // 4 hours
      maxActionsPerSession: 10000,
      insightGenerationInterval: 30000, // 30 seconds
      ...config
    };

    this.setupAutoFlush();
    this.setupInsightGeneration();
    this.setupPerformanceTracking();
    
    console.log('🔍 Advanced Analytics Engine initialized with AI-powered insights');
  }

  // =============================================================================
  // SESSION MANAGEMENT
  // =============================================================================

  public startSession(playerId: string, gameVersion: string = '1.0.0'): PlayerSession {
    // End current session if exists
    if (this.currentSession) {
      this.endSession();
    }

    const sessionId = this.generateSessionId();
    const session: PlayerSession = {
      id: sessionId,
      playerId,
      startTime: Date.now(),
      actions: [],
      metrics: {
        totalActions: 0,
        uniqueActionTypes: 0,
        averageActionInterval: 0,
        peakActivityTime: 0,
        distanceTraveled: 0,
        entitiesInteracted: 0,
        errorsEncountered: 0,
        performanceIssues: 0
      },
      deviceInfo: this.collectDeviceInfo(),
      gameVersion
    };

    this.currentSession = session;
    this.sessions.set(sessionId, session);

    this.emit('sessionStarted', { session });
    console.log(`📊 Analytics session started: ${sessionId}`);

    return session;
  }

  public endSession(): void {
    if (!this.currentSession) return;

    const session = this.currentSession;
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Calculate final metrics
    this.calculateSessionMetrics(session);

    // Flush any remaining actions
    this.flushActions();

    // Generate session insights
    this.generateInsights();

    this.emit('sessionEnded', { session });
    console.log(`📊 Analytics session ended: ${session.id} (${this.formatDuration(session.duration)})`);

    this.currentSession = null;
  }

  // =============================================================================
  // ACTION TRACKING
  // =============================================================================

  public trackAction(
    actionType: string,
    data: Record<string, any> = {},
    location?: { x: number; y: number; z: number },
    duration?: number
  ): void {
    if (!this.currentSession) {
      console.warn('No active session - starting anonymous session');
      this.startSession('anonymous');
    }

    const action: PlayerAction = {
      id: this.generateActionId(),
      playerId: this.currentSession!.playerId,
      actionType,
      timestamp: Date.now(),
      data: this.config.privacyMode ? this.sanitizeData(data) : data,
      sessionId: this.currentSession!.id,
      duration,
      location,
      context: {
        sessionDuration: Date.now() - this.currentSession!.startTime,
        actionCount: this.currentSession!.actions.length,
        userAgent: navigator.userAgent
      }
    };

    // Add to current session
    this.currentSession!.actions.push(action);

    // Add to buffer for batching
    this.actionBuffer.push(action);

    // Update session metrics
    this.updateSessionMetrics(action);

    // Real-time tracking
    if (this.config.enableRealTimeTracking) {
      this.emit('actionTracked', { action });
    }

    // Update heatmap if location provided
    if (location && this.config.enableHeatmaps) {
      this.updateHeatmap(actionType, location);
    }

    console.log(`📝 Tracked action: ${actionType} (session: ${this.currentSession!.id})`);

    // Auto-flush if buffer is full
    if (this.actionBuffer.length >= this.config.batchSize) {
      this.flushActions();
    }
  }

  public trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    this.trackAction('event', { eventName, ...properties });
  }

  public trackError(error: Error, context: Record<string, any> = {}): void {
    this.trackAction('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    });

    if (this.currentSession) {
      this.currentSession.metrics.errorsEncountered++;
    }
  }

  public trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    if (!this.config.enablePerformanceTracking) return;

    const performanceMetric: PerformanceMetric = {
      metric,
      value,
      unit,
      timestamp: Date.now(),
      sessionId: this.currentSession?.id || 'no-session'
    };

    let metrics = this.performanceMetrics.get(metric);
    if (!metrics) {
      metrics = [];
      this.performanceMetrics.set(metric, metrics);
    }
    metrics.push(performanceMetric);

    // Keep only recent metrics (last 1000)
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }

    this.trackAction('performance', {
      metric,
      value,
      unit
    });

    if (this.currentSession && metric.includes('error')) {
      this.currentSession.metrics.performanceIssues++;
    }
  }

  // =============================================================================
  // INSIGHT GENERATION
  // =============================================================================

  public generateInsights(timeframe: 'session' | 'hour' | 'day' | 'week' = 'session'): PlayerInsight[] {
    const insights: PlayerInsight[] = [];

    if (this.currentSession) {
      insights.push(...this.generateBehaviorInsights(this.currentSession));
      insights.push(...this.generatePerformanceInsights(this.currentSession));
      insights.push(...this.generateEngagementInsights(this.currentSession));
      insights.push(...this.generateTechnicalInsights(this.currentSession));
    }

    // Add to insights collection
    this.insights.push(...insights);

    // Keep only recent insights (last 500)
    if (this.insights.length > 500) {
      this.insights.splice(0, this.insights.length - 500);
    }

    console.log(`🔍 Generated ${insights.length} new insights`);
    this.emit('insightsGenerated', { insights });

    return insights;
  }

  private generateBehaviorInsights(session: PlayerSession): PlayerInsight[] {
    const insights: PlayerInsight[] = [];
    const actions = session.actions;

    // Action frequency analysis
    const actionFrequency = this.analyzeActionFrequency(actions);
    if (actionFrequency.dominantAction && actionFrequency.dominanceRatio > 0.7) {
      insights.push({
        id: this.generateInsightId(),
        playerId: session.playerId,
        type: 'behavior',
        severity: 'medium',
        title: 'Repetitive Behavior Detected',
        description: `Player is performing '${actionFrequency.dominantAction}' ${Math.round(actionFrequency.dominanceRatio * 100)}% of the time`,
        recommendations: [
          'Consider introducing more variety in gameplay mechanics',
          'Add incentives for exploring different actions',
          'Review if this action is too rewarding compared to others'
        ],
        confidence: Math.min(actionFrequency.dominanceRatio, 0.9),
        timestamp: Date.now(),
        data: { actionFrequency }
      });
    }

    // Movement pattern analysis
    const movementActions = actions.filter(a => a.location);
    if (movementActions.length > 10) {
      const movementPattern = this.analyzeMovementPattern(movementActions);
      if (movementPattern.isStuck) {
        insights.push({
          id: this.generateInsightId(),
          playerId: session.playerId,
          type: 'behavior',
          severity: 'high',
          title: 'Player May Be Stuck',
          description: `Player has been in the same area for ${this.formatDuration(movementPattern.stuckDuration)}`,
          recommendations: [
            'Check for navigation issues in this area',
            'Provide clearer guidance or hints',
            'Review level design for potential confusion'
          ],
          confidence: 0.8,
          timestamp: Date.now(),
          data: { movementPattern }
        });
      }
    }

    // Error recovery analysis
    if (session.metrics.errorsEncountered > 0) {
      const errorRecovery = this.analyzeErrorRecovery(actions);
      insights.push({
        id: this.generateInsightId(),
        playerId: session.playerId,
        type: 'behavior',
        severity: session.metrics.errorsEncountered > 5 ? 'high' : 'medium',
        title: 'Error Impact Analysis',
        description: `Player encountered ${session.metrics.errorsEncountered} errors with ${errorRecovery.averageRecoveryTime}ms average recovery time`,
        recommendations: [
          'Implement better error handling',
          'Add user-friendly error messages',
          'Consider auto-recovery mechanisms'
        ],
        confidence: 0.7,
        timestamp: Date.now(),
        data: { errorRecovery, errorCount: session.metrics.errorsEncountered }
      });
    }

    return insights;
  }

  private generatePerformanceInsights(session: PlayerSession): PlayerInsight[] {
    const insights: PlayerInsight[] = [];

    // Performance trend analysis
    const performanceData = Array.from(this.performanceMetrics.entries());
    for (const [metric, values] of performanceData) {
      const recentValues = values.filter(v => v.sessionId === session.id);
      if (recentValues.length < 5) continue;

      const trend = this.analyzePerformanceTrend(recentValues);
      if (trend.isDegrading) {
        insights.push({
          id: this.generateInsightId(),
          playerId: session.playerId,
          type: 'performance',
          severity: trend.severity,
          title: `Performance Degradation: ${metric}`,
          description: `${metric} has increased by ${Math.round(trend.degradationPercent)}% over the session`,
          recommendations: [
            'Investigate memory leaks or resource accumulation',
            'Review recent code changes affecting this metric',
            'Consider implementing performance optimizations'
          ],
          confidence: trend.confidence,
          timestamp: Date.now(),
          data: { metric, trend, values: recentValues.slice(-10) }
        });
      }
    }

    // Device capability analysis
    if (session.deviceInfo.memory !== undefined && session.deviceInfo.memory < 4000) {
      insights.push({
        id: this.generateInsightId(),
        playerId: session.playerId,
        type: 'technical',
        severity: 'medium',
        title: 'Low Memory Device Detected',
        description: `Device has ${session.deviceInfo.memory}MB RAM, which may impact performance`,
        recommendations: [
          'Enable low-memory mode optimizations',
          'Reduce texture quality automatically',
          'Implement aggressive garbage collection'
        ],
        confidence: 0.9,
        timestamp: Date.now(),
        data: { deviceInfo: session.deviceInfo }
      });
    }

    return insights;
  }

  private generateEngagementInsights(session: PlayerSession): PlayerInsight[] {
    const insights: PlayerInsight[] = [];
    const sessionDuration = Date.now() - session.startTime;

    // Session length analysis
    if (sessionDuration < 60000) { // Less than 1 minute
      insights.push({
        id: this.generateInsightId(),
        playerId: session.playerId,
        type: 'engagement',
        severity: 'high',
        title: 'Very Short Session',
        description: `Session lasted only ${this.formatDuration(sessionDuration)}`,
        recommendations: [
          'Review onboarding experience',
          'Check for early technical issues',
          'Improve initial engagement mechanics'
        ],
        confidence: 0.8,
        timestamp: Date.now(),
        data: { sessionDuration, actionCount: session.actions.length }
      });
    } else if (sessionDuration > 2 * 60 * 60 * 1000) { // More than 2 hours
      insights.push({
        id: this.generateInsightId(),
        playerId: session.playerId,
        type: 'engagement',
        severity: 'low',
        title: 'Extended Play Session',
        description: `Player has been engaged for ${this.formatDuration(sessionDuration)}`,
        recommendations: [
          'Consider suggesting breaks for player wellness',
          'Implement fatigue-reducing features',
          'Celebrate this high engagement'
        ],
        confidence: 0.9,
        timestamp: Date.now(),
        data: { sessionDuration, actionCount: session.actions.length }
      });
    }

    // Action density analysis
    const actionDensity = session.actions.length / (sessionDuration / 60000); // actions per minute
    if (actionDensity < 1) {
      insights.push({
        id: this.generateInsightId(),
        playerId: session.playerId,
        type: 'engagement',
        severity: 'medium',
        title: 'Low Activity Level',
        description: `Player is performing only ${actionDensity.toFixed(1)} actions per minute`,
        recommendations: [
          'Introduce more interactive elements',
          'Check if player is confused or stuck',
          'Add guidance or tutorials'
        ],
        confidence: 0.7,
        timestamp: Date.now(),
        data: { actionDensity, totalActions: session.actions.length, sessionDuration }
      });
    }

    return insights;
  }

  private generateTechnicalInsights(session: PlayerSession): PlayerInsight[] {
    const insights: PlayerInsight[] = [];

    // Connection quality analysis
    if (session.deviceInfo.connectionType === 'slow-2g' || session.deviceInfo.connectionType === '2g') {
      insights.push({
        id: this.generateInsightId(),
        playerId: session.playerId,
        type: 'technical',
        severity: 'high',
        title: 'Slow Network Connection',
        description: `Player is on a ${session.deviceInfo.connectionType} connection`,
        recommendations: [
          'Enable offline mode features',
          'Implement aggressive caching',
          'Reduce network-dependent operations'
        ],
        confidence: 0.9,
        timestamp: Date.now(),
        data: { connectionType: session.deviceInfo.connectionType }
      });
    }

    // Screen resolution analysis
    const dimensions = session.deviceInfo.screenResolution.split('x').map(Number);
    const width = dimensions[0];
    const height = dimensions[1];
    if (width && height && (width < 1280 || height < 720)) {
      insights.push({
        id: this.generateInsightId(),
        playerId: session.playerId,
        type: 'technical',
        severity: 'medium',
        title: 'Small Screen Resolution',
        description: `Player is using ${session.deviceInfo.screenResolution} resolution`,
        recommendations: [
          'Optimize UI for smaller screens',
          'Implement responsive design elements',
          'Test game readability on low-resolution devices'
        ],
        confidence: 0.8,
        timestamp: Date.now(),
        data: { screenResolution: session.deviceInfo.screenResolution }
      });
    }

    return insights;
  }

  // =============================================================================
  // ANALYTICS HELPERS
  // =============================================================================

  private analyzeActionFrequency(actions: PlayerAction[]): {
    dominantAction: string | null;
    dominanceRatio: number;
    distribution: Map<string, number>;
  } {
    const distribution = new Map<string, number>();
    
    for (const action of actions) {
      distribution.set(action.actionType, (distribution.get(action.actionType) || 0) + 1);
    }

    if (distribution.size === 0) {
      return { dominantAction: null, dominanceRatio: 0, distribution };
    }

    const sortedActions = Array.from(distribution.entries())
      .sort(([,a], [,b]) => b - a);
    
    if (sortedActions.length === 0) {
      return { dominantAction: null, dominanceRatio: 0, distribution };
    }
    
    const dominantEntry = sortedActions[0];
    if (!dominantEntry) {
      return { dominantAction: null, dominanceRatio: 0, distribution };
    }
    
    const dominantAction = dominantEntry[0];
    const count = dominantEntry[1];
    const dominanceRatio = count / actions.length;

    return { dominantAction, dominanceRatio, distribution };
  }

  private analyzeMovementPattern(movementActions: PlayerAction[]): {
    isStuck: boolean;
    stuckDuration: number;
    averageDistance: number;
    totalDistance: number;
  } {
    if (movementActions.length < 2) {
      return { isStuck: false, stuckDuration: 0, averageDistance: 0, totalDistance: 0 };
    }

    let totalDistance = 0;
    let stuckStartTime = 0;
    let isStuck = false;
    const stuckThreshold = 50; // pixels
    const stuckTimeThreshold = 30000; // 30 seconds

    for (let i = 1; i < movementActions.length; i++) {
      const prevAction = movementActions[i - 1];
      const currAction = movementActions[i];
      const prevLocation = prevAction?.location;
      const currLocation = currAction?.location;
      
      if (!prevLocation || !currLocation) continue;
      
      const distance = Math.sqrt(
        Math.pow(currLocation.x - prevLocation.x, 2) + 
        Math.pow(currLocation.y - prevLocation.y, 2)
      );
      
      totalDistance += distance;

      if (distance < stuckThreshold) {
        if (stuckStartTime === 0) {
          stuckStartTime = prevAction.timestamp;
        }
      } else {
        stuckStartTime = 0;
      }

      if (stuckStartTime > 0 && 
          currAction.timestamp - stuckStartTime > stuckTimeThreshold) {
        isStuck = true;
      }
    }

    const stuckDuration = stuckStartTime > 0 ? (Date.now() - stuckStartTime) : 0;
    const averageDistance = totalDistance / (movementActions.length - 1);

    return { isStuck, stuckDuration, averageDistance, totalDistance };
  }

  private analyzeErrorRecovery(actions: PlayerAction[]): {
    averageRecoveryTime: number;
    recoverySuccess: number;
    totalErrors: number;
  } {
    const errorActions = actions.filter(a => a.actionType === 'error');
    let totalRecoveryTime = 0;
    let successfulRecoveries = 0;

    for (const errorAction of errorActions) {
      // Find the next action after the error
      const nextAction = actions.find(a => 
        a.timestamp > errorAction.timestamp && a.actionType !== 'error'
      );
      
      if (nextAction) {
        const recoveryTime = nextAction.timestamp - errorAction.timestamp;
        totalRecoveryTime += recoveryTime;
        successfulRecoveries++;
      }
    }

    return {
      averageRecoveryTime: errorActions.length > 0 ? totalRecoveryTime / successfulRecoveries : 0,
      recoverySuccess: errorActions.length > 0 ? successfulRecoveries / errorActions.length : 1,
      totalErrors: errorActions.length
    };
  }

  private analyzePerformanceTrend(values: PerformanceMetric[]): {
    isDegrading: boolean;
    degradationPercent: number;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
  } {
    if (values.length < 5) {
      return { isDegrading: false, degradationPercent: 0, severity: 'low', confidence: 0 };
    }

    const sortedValues = values.sort((a, b) => a.timestamp - b.timestamp);
    const firstHalf = sortedValues.slice(0, Math.floor(sortedValues.length / 2));
    const secondHalf = sortedValues.slice(Math.floor(sortedValues.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v.value, 0) / secondHalf.length;

    const degradationPercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    const isDegrading = degradationPercent > 20; // 20% increase

    let severity: 'low' | 'medium' | 'high' = 'low';
    if (degradationPercent > 100) severity = 'high';
    else if (degradationPercent > 50) severity = 'medium';

    const confidence = Math.min(Math.abs(degradationPercent) / 100, 0.9);

    return { isDegrading, degradationPercent, severity, confidence };
  }

  // =============================================================================
  // DATA MANAGEMENT
  // =============================================================================

  private flushActions(): void {
    if (this.actionBuffer.length === 0) return;

    const actionsToFlush = [...this.actionBuffer];
    this.actionBuffer = [];

    this.emit('actionsFlushed', { 
      actions: actionsToFlush, 
      count: actionsToFlush.length 
    });

    console.log(`📤 Flushed ${actionsToFlush.length} actions to analytics pipeline`);
  }

  private updateSessionMetrics(action: PlayerAction): void {
    if (!this.currentSession) return;

    const metrics = this.currentSession.metrics;
    metrics.totalActions++;

    // Update unique action types
    const uniqueTypes = new Set(this.currentSession.actions.map(a => a.actionType));
    metrics.uniqueActionTypes = uniqueTypes.size;

    // Update average action interval
    if (this.currentSession.actions.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < this.currentSession.actions.length; i++) {
        const currentAction = this.currentSession.actions[i];
        const previousAction = this.currentSession.actions[i - 1];
        if (currentAction && previousAction) {
          intervals.push(currentAction.timestamp - previousAction.timestamp);
        }
      }
      metrics.averageActionInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    // Update distance traveled
    if (action.location) {
      const prevAction = this.currentSession.actions
        .slice(0, -1)
        .reverse()
        .find(a => a.location);
      
      if (prevAction?.location) {
        const distance = Math.sqrt(
          Math.pow(action.location.x - prevAction.location.x, 2) +
          Math.pow(action.location.y - prevAction.location.y, 2)
        );
        metrics.distanceTraveled += distance;
      }
    }

    // Update entities interacted
    if (action.data.entityId) {
      metrics.entitiesInteracted++;
    }
  }

  private calculateSessionMetrics(session: PlayerSession): void {
    // Calculate peak activity time (1-minute window with most actions)
    const windowSize = 60000; // 1 minute
    let maxActions = 0;
    let peakTime = 0;

    const sessionDuration = session.duration || 0;
    for (let i = 0; i < sessionDuration; i += windowSize) {
      const windowStart = session.startTime + i;
      const windowEnd = windowStart + windowSize;
      
      const actionsInWindow = session.actions.filter(
        a => a.timestamp >= windowStart && a.timestamp < windowEnd
      ).length;

      if (actionsInWindow > maxActions) {
        maxActions = actionsInWindow;
        peakTime = windowStart;
      }
    }

    session.metrics.peakActivityTime = peakTime;
  }

  private updateHeatmap(actionType: string, location: { x: number; y: number; z: number }): void {
    let heatmap = this.heatmapData.get(actionType);
    if (!heatmap) {
      heatmap = [];
      this.heatmapData.set(actionType, heatmap);
    }

    // Find existing point within radius or create new one
    const radius = 25;
    let point = heatmap.find(p => 
      Math.sqrt(Math.pow(p.x - location.x, 2) + Math.pow(p.y - location.y, 2)) < radius
    );

    if (point) {
      point.count++;
      point.intensity = Math.min(point.intensity + 0.1, 1.0);
    } else {
      heatmap.push({
        x: location.x,
        y: location.y,
        count: 1,
        intensity: 0.1
      });
    }

    // Limit heatmap points to prevent memory issues
    if (heatmap.length > 1000) {
      heatmap.sort((a, b) => b.count - a.count);
      heatmap.splice(500); // Keep top 500 points
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private setupAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushActions();
    }, this.config.flushInterval);
  }

  private setupInsightGeneration(): void {
    this.insightTimer = setInterval(() => {
      this.generateInsights();
    }, this.config.insightGenerationInterval);
  }

  private setupPerformanceTracking(): void {
    if (!this.config.enablePerformanceTracking) return;

    // Track frame rate
    let frameCount = 0;
    let lastFrameTime = performance.now();

    const trackFrameRate = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastFrameTime >= 1000) {
        this.trackPerformance('fps', frameCount, 'fps');
        frameCount = 0;
        lastFrameTime = now;
      }
      
      requestAnimationFrame(trackFrameRate);
    };
    
    requestAnimationFrame(trackFrameRate);

    // Track memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.trackPerformance('heapUsed', memory.usedJSHeapSize / 1024 / 1024, 'MB');
        this.trackPerformance('heapTotal', memory.totalJSHeapSize / 1024 / 1024, 'MB');
      }, 5000);
    }
  }

  private collectDeviceInfo(): DeviceInfo {
    const navigator = window.navigator;
    const screen = window.screen;
    
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      memory: (navigator as any).deviceMemory ? (navigator as any).deviceMemory * 1024 : undefined,
      cores: navigator.hardwareConcurrency
    };
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    // Remove potentially sensitive information in privacy mode
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    const sanitized = { ...data };
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // =============================================================================
  // EVENT SYSTEM
  // =============================================================================

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in analytics event listener for ${event}:`, error);
        }
      }
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  public getSession(sessionId?: string): PlayerSession | null {
    if (sessionId) {
      return this.sessions.get(sessionId) || null;
    }
    return this.currentSession;
  }

  public getAllSessions(): PlayerSession[] {
    return Array.from(this.sessions.values());
  }

  public getInsights(filter?: {
    type?: string;
    severity?: string;
    limit?: number;
  }): PlayerInsight[] {
    let filteredInsights = [...this.insights];

    if (filter?.type) {
      filteredInsights = filteredInsights.filter(i => i.type === filter.type);
    }

    if (filter?.severity) {
      filteredInsights = filteredInsights.filter(i => i.severity === filter.severity);
    }

    filteredInsights.sort((a, b) => b.timestamp - a.timestamp);

    if (filter?.limit) {
      filteredInsights = filteredInsights.slice(0, filter.limit);
    }

    return filteredInsights;
  }

  public getHeatmapData(actionType?: string): Map<string, any[]> | any[] {
    if (actionType) {
      return this.heatmapData.get(actionType) || [];
    }
    return this.heatmapData;
  }

  public getPerformanceMetrics(metric?: string): Map<string, PerformanceMetric[]> | PerformanceMetric[] {
    if (metric) {
      return this.performanceMetrics.get(metric) || [];
    }
    return this.performanceMetrics;
  }

  public exportData(): {
    sessions: PlayerSession[];
    insights: PlayerInsight[];
    heatmaps: Record<string, any[]>;
    performance: Record<string, PerformanceMetric[]>;
  } {
    return {
      sessions: this.getAllSessions(),
      insights: this.getInsights(),
      heatmaps: Object.fromEntries(this.heatmapData),
      performance: Object.fromEntries(this.performanceMetrics)
    };
  }

  public clearData(): void {
    this.sessions.clear();
    this.insights.splice(0);
    this.heatmapData.clear();
    this.performanceMetrics.clear();
    this.actionBuffer.splice(0);
    console.log('🧹 Analytics data cleared');
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.insightTimer) {
      clearInterval(this.insightTimer);
    }

    this.flushActions();
    this.endSession();
    this.eventListeners.clear();
    
    console.log('💥 Analytics Engine destroyed');
  }
}

// =============================================================================
// PERFORMANCE METRIC INTERFACE
// =============================================================================

interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  timestamp: number;
  sessionId: string;
}

// =============================================================================
// UTILITY FUNCTION
// =============================================================================

export function createAnalyticsEngine(config?: Partial<AnalyticsConfig>): AdvancedAnalyticsEngine {
  const engine = new AdvancedAnalyticsEngine(config);
  
  // Store reference for debugging and dashboard access
  (window as any).analyticsEngine = engine;
  
  return engine;
}

// Export additional types
export type { PerformanceMetric };