// RainStorm ARPG - Content Request System
// Advanced queue management and request processing for Claude Content Engine

import { EventEmitter } from 'events';

export interface ContentRequest {
  id: string;
  type: 'quest' | 'item' | 'dialogue' | 'lore' | 'area_content' | 'level_rewards';
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  timeout: number;
  requester: string;
  retryCount: number;
  maxRetries: number;
  onComplete?: (content: any) => void;
  onError?: (error: Error) => void;
}

export interface RequestQueue {
  critical: ContentRequest[];
  high: ContentRequest[];
  medium: ContentRequest[];
  low: ContentRequest[];
}

export interface RequestManagerConfig {
  maxConcurrentRequests: number;
  defaultTimeout: number;
  enableRetries: boolean;
  maxRetries: number;
  retryDelay: number;
  enablePrioritization: boolean;
  enableBatching: boolean;
  batchSize: number;
  batchTimeout: number;
}

export interface RequestStats {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  retriedRequests: number;
  averageCompletionTime: number;
  queueSize: number;
  activeRequests: number;
}

export class ContentRequestManager extends EventEmitter {
  private config: RequestManagerConfig;
  private requestQueue: RequestQueue;
  private activeRequests: Map<string, ContentRequest> = new Map();
  private requestHistory: Map<string, { success: boolean; completionTime: number; timestamp: number }> = new Map();
  private stats: RequestStats;
  private processingInterval: NodeJS.Timeout | null = null;
  private batchProcessor: BatchProcessor;
  private retryManager: RetryManager;

  constructor(config?: Partial<RequestManagerConfig>) {
    super();

    this.config = {
      maxConcurrentRequests: 5,
      defaultTimeout: 30000, // 30 seconds
      enableRetries: true,
      maxRetries: 3,
      retryDelay: 1000, // 1 second base delay
      enablePrioritization: true,
      enableBatching: false,
      batchSize: 5,
      batchTimeout: 2000, // 2 seconds
      ...config
    };

    this.requestQueue = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    this.stats = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      averageCompletionTime: 0,
      queueSize: 0,
      activeRequests: 0
    };

    this.batchProcessor = new BatchProcessor(this.config);
    this.retryManager = new RetryManager(this.config);

    this.startProcessing();
    console.log('📋 Content Request Manager initialized with advanced queue management');
  }

  // =============================================================================
  // REQUEST SUBMISSION
  // =============================================================================

  public submitRequest(
    type: string,
    parameters: Record<string, any>,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      timeout?: number;
      requester?: string;
      onComplete?: (content: any) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const request: ContentRequest = {
        id: this.generateRequestId(),
        type: type as any,
        parameters,
        priority: options.priority || 'medium',
        timestamp: Date.now(),
        timeout: options.timeout || this.config.defaultTimeout,
        requester: options.requester || 'unknown',
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        onComplete: (content) => {
          if (options.onComplete) options.onComplete(content);
          resolve(content);
        },
        onError: (error) => {
          if (options.onError) options.onError(error);
          reject(error);
        }
      };

      this.addToQueue(request);
      this.updateStats();

      console.log(`📝 Request submitted: ${request.type} (${request.priority}) - Queue: ${this.getTotalQueueSize()}`);
      this.emit('requestSubmitted', request);
    });
  }

  public submitBatchRequest(requests: Array<{
    type: string;
    parameters: Record<string, any>;
    priority?: string;
  }>): Promise<any[]> {
    if (!this.config.enableBatching) {
      // Process individually if batching disabled
      return Promise.all(requests.map(req => 
        this.submitRequest(req.type, req.parameters, { priority: req.priority as any })
      ));
    }

    return this.batchProcessor.processBatch(requests);
  }

  // =============================================================================
  // QUEUE MANAGEMENT
  // =============================================================================

  private addToQueue(request: ContentRequest): void {
    if (this.config.enablePrioritization) {
      this.requestQueue[request.priority].push(request);
    } else {
      // Add to medium priority if prioritization disabled
      this.requestQueue.medium.push(request);
    }

    this.stats.totalRequests++;
    this.sortQueueByTimestamp(request.priority);
  }

  private getNextRequest(): ContentRequest | null {
    // Process in priority order: critical -> high -> medium -> low
    const priorities: (keyof RequestQueue)[] = ['critical', 'high', 'medium', 'low'];
    
    for (const priority of priorities) {
      const queue = this.requestQueue[priority];
      if (queue.length > 0) {
        return queue.shift()!;
      }
    }

    return null;
  }

  private sortQueueByTimestamp(priority: keyof RequestQueue): void {
    this.requestQueue[priority].sort((a, b) => a.timestamp - b.timestamp);
  }

  public getQueueStatus(): { priority: string; count: number }[] {
    return [
      { priority: 'critical', count: this.requestQueue.critical.length },
      { priority: 'high', count: this.requestQueue.high.length },
      { priority: 'medium', count: this.requestQueue.medium.length },
      { priority: 'low', count: this.requestQueue.low.length }
    ];
  }

  public getTotalQueueSize(): number {
    return Object.values(this.requestQueue).reduce((total, queue) => total + queue.length, 0);
  }

  // =============================================================================
  // REQUEST PROCESSING
  // =============================================================================

  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Process every 100ms
  }

  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processQueue(): Promise<void> {
    // Check if we have capacity for more requests
    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      return;
    }

    // Get next request from queue
    const request = this.getNextRequest();
    if (!request) {
      return;
    }

    // Move to active processing
    this.activeRequests.set(request.id, request);
    this.updateStats();

    try {
      await this.processRequest(request);
    } catch (error) {
      await this.handleRequestError(request, error as Error);
    }
  }

  private async processRequest(request: ContentRequest): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Set timeout for request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), request.timeout);
      });

      // Process the actual request (this would call Claude Content Engine)
      const contentPromise = this.executeContentGeneration(request);

      // Race between content generation and timeout
      const content = await Promise.race([contentPromise, timeoutPromise]);

      // Request completed successfully
      const completionTime = performance.now() - startTime;
      this.handleRequestSuccess(request, content, completionTime);

    } catch (error) {
      const completionTime = performance.now() - startTime;
      await this.handleRequestError(request, error as Error, completionTime);
    } finally {
      // Remove from active requests
      this.activeRequests.delete(request.id);
      this.updateStats();
    }
  }

  private async executeContentGeneration(request: ContentRequest): Promise<any> {
    // This is where the actual content generation happens
    // In the full implementation, this would call the Claude Content Engine
    
    // Simulate content generation with appropriate timing
    const generationTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise(resolve => setTimeout(resolve, generationTime));

    // Generate mock content based on request type
    return this.generateMockContent(request);
  }

  private generateMockContent(request: ContentRequest): any {
    const baseContent = {
      id: `generated_${request.type}_${Date.now()}`,
      type: request.type,
      generatedAt: Date.now(),
      requestId: request.id,
      parameters: request.parameters
    };

    switch (request.type) {
      case 'quest':
        return {
          ...baseContent,
          title: `Generated Quest for ${request.parameters.region || 'Unknown Region'}`,
          description: 'A dynamically generated quest tailored to your adventure.',
          objectives: [{ id: 'obj1', description: 'Complete the challenge', target: 'unknown' }],
          rewards: { experience: (request.parameters.playerLevel || 1) * 1000 }
        };
        
      case 'item':
        return {
          ...baseContent,
          name: `Generated ${request.parameters.itemType || 'Item'}`,
          stats: { damage: '10-20', level: request.parameters.playerLevel || 1 },
          rarity: request.parameters.rarity || 'normal'
        };
        
      case 'dialogue':
        return {
          ...baseContent,
          greeting: { text: 'Greetings, traveler!', mood: 'friendly' },
          topics: [{ id: 'general', text: 'How can I help you?' }]
        };
        
      default:
        return {
          ...baseContent,
          content: `Generated ${request.type} content`
        };
    }
  }

  // =============================================================================
  // SUCCESS/ERROR HANDLING
  // =============================================================================

  private handleRequestSuccess(request: ContentRequest, content: any, completionTime: number): void {
    // Update statistics
    this.stats.completedRequests++;
    this.updateAverageCompletionTime(completionTime);

    // Store in history
    this.requestHistory.set(request.id, {
      success: true,
      completionTime,
      timestamp: Date.now()
    });

    // Call completion callback
    if (request.onComplete) {
      request.onComplete(content);
    }

    console.log(`✅ Request completed: ${request.type} (${completionTime.toFixed(2)}ms)`);
    this.emit('requestCompleted', { request, content, completionTime });
  }

  private async handleRequestError(request: ContentRequest, error: Error, completionTime?: number): Promise<void> {
    console.error(`❌ Request failed: ${request.type} - ${error.message}`);

    // Check if we should retry
    if (this.config.enableRetries && request.retryCount < request.maxRetries) {
      await this.retryRequest(request, error);
      return;
    }

    // Request finally failed
    this.stats.failedRequests++;
    
    // Store in history
    this.requestHistory.set(request.id, {
      success: false,
      completionTime: completionTime || 0,
      timestamp: Date.now()
    });

    // Call error callback
    if (request.onError) {
      request.onError(error);
    }

    this.emit('requestFailed', { request, error });
  }

  private async retryRequest(request: ContentRequest, lastError: Error): Promise<void> {
    request.retryCount++;
    this.stats.retriedRequests++;

    // Calculate exponential backoff delay
    const delay = this.retryManager.calculateRetryDelay(request.retryCount);
    
    console.warn(`🔄 Retrying request ${request.id} (attempt ${request.retryCount}/${request.maxRetries}) in ${delay}ms`);
    
    // Add back to queue after delay
    setTimeout(() => {
      this.addToQueue(request);
    }, delay);

    this.emit('requestRetried', { request, attempt: request.retryCount, delay, lastError });
  }

  // =============================================================================
  // STATISTICS AND MONITORING
  // =============================================================================

  private updateStats(): void {
    this.stats.queueSize = this.getTotalQueueSize();
    this.stats.activeRequests = this.activeRequests.size;
  }

  private updateAverageCompletionTime(completionTime: number): void {
    const totalTime = this.stats.averageCompletionTime * (this.stats.completedRequests - 1) + completionTime;
    this.stats.averageCompletionTime = totalTime / this.stats.completedRequests;
  }

  public getStats(): RequestStats {
    this.updateStats();
    return { ...this.stats };
  }

  public getDetailedStats(): any {
    return {
      ...this.getStats(),
      queueStatus: this.getQueueStatus(),
      activeRequestIds: Array.from(this.activeRequests.keys()),
      successRate: this.stats.totalRequests > 0 ? this.stats.completedRequests / this.stats.totalRequests : 0,
      retryRate: this.stats.totalRequests > 0 ? this.stats.retriedRequests / this.stats.totalRequests : 0
    };
  }

  // =============================================================================
  // QUEUE MANAGEMENT OPERATIONS
  // =============================================================================

  public clearQueue(priority?: keyof RequestQueue): void {
    if (priority) {
      this.requestQueue[priority] = [];
      console.log(`🧹 Cleared ${priority} priority queue`);
    } else {
      this.requestQueue = { critical: [], high: [], medium: [], low: [] };
      console.log('🧹 Cleared all request queues');
    }
    this.updateStats();
  }

  public cancelRequest(requestId: string): boolean {
    // Check active requests first
    if (this.activeRequests.has(requestId)) {
      const request = this.activeRequests.get(requestId)!;
      this.activeRequests.delete(requestId);
      
      if (request.onError) {
        request.onError(new Error('Request cancelled'));
      }
      
      console.log(`❌ Cancelled active request: ${requestId}`);
      this.emit('requestCancelled', request);
      return true;
    }

    // Check queues
    for (const [priority, queue] of Object.entries(this.requestQueue)) {
      const index = queue.findIndex(req => req.id === requestId);
      if (index !== -1) {
        const request = queue.splice(index, 1)[0];
        
        if (request.onError) {
          request.onError(new Error('Request cancelled'));
        }
        
        console.log(`❌ Cancelled queued request: ${requestId} (${priority})`);
        this.emit('requestCancelled', request);
        return true;
      }
    }

    return false;
  }

  public pauseProcessing(): void {
    this.stopProcessing();
    console.log('⏸️ Request processing paused');
    this.emit('processingPaused');
  }

  public resumeProcessing(): void {
    this.startProcessing();
    console.log('▶️ Request processing resumed');
    this.emit('processingResumed');
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    this.stopProcessing();
    this.clearQueue();
    this.activeRequests.clear();
    this.requestHistory.clear();
    this.removeAllListeners();
    console.log('💥 Content Request Manager destroyed');
  }
}

// =============================================================================
// SUPPORTING CLASSES
// =============================================================================

class BatchProcessor {
  constructor(private config: RequestManagerConfig) {}

  async processBatch(requests: Array<{ type: string; parameters: Record<string, any>; priority?: string }>): Promise<any[]> {
    // Group requests by type for more efficient processing
    const grouped = this.groupRequestsByType(requests);
    const results: any[] = [];

    for (const [type, typeRequests] of grouped) {
      const batchResults = await this.processBatchOfType(type, typeRequests);
      results.push(...batchResults);
    }

    return results;
  }

  private groupRequestsByType(requests: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    
    for (const request of requests) {
      if (!grouped.has(request.type)) {
        grouped.set(request.type, []);
      }
      grouped.get(request.type)!.push(request);
    }

    return grouped;
  }

  private async processBatchOfType(type: string, requests: any[]): Promise<any[]> {
    // Process requests of the same type together for efficiency
    const promises = requests.map(async (req) => {
      // Simulate batch processing optimization
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));
      return { type, content: `Batch generated ${type}`, original: req };
    });

    return Promise.all(promises);
  }
}

class RetryManager {
  constructor(private config: RequestManagerConfig) {}

  calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: base delay * 2^(retryCount-1)
    return this.config.retryDelay * Math.pow(2, retryCount - 1);
  }

  shouldRetry(request: ContentRequest, error: Error): boolean {
    // Don't retry certain types of errors
    if (error.message.includes('timeout') && request.retryCount >= 1) {
      return false;
    }

    if (error.message.includes('invalid parameters')) {
      return false;
    }

    return request.retryCount < request.maxRetries;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function createContentRequestManager(config?: Partial<RequestManagerConfig>): ContentRequestManager {
  return new ContentRequestManager(config);
}