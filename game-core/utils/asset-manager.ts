// RainStorm ARPG - Smart Asset Management & Optimization
// Intelligent asset loading, caching, and optimization system

export interface AssetMetadata {
  id: string;
  url: string;
  type: 'image' | 'audio' | 'json' | 'text' | 'binary';
  size: number;
  lastModified: number;
  version: string;
  dependencies: string[];
  tags: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  loadTime?: number;
  useCount: number;
  lastUsed: number;
}

export interface AssetLoadOptions {
  priority?: 'critical' | 'high' | 'medium' | 'low';
  timeout?: number;
  retries?: number;
  cache?: boolean;
  preload?: boolean;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export interface CacheEntry {
  asset: any;
  metadata: AssetMetadata;
  cachedAt: number;
  size: number;
  references: number;
}

export interface AssetManagerConfig {
  maxCacheSize: number; // MB
  maxCacheAge: number; // milliseconds
  enableCompression: boolean;
  enableWebWorkers: boolean;
  preloadStrategy: 'aggressive' | 'conservative' | 'lazy';
  compressionQuality: number; // 0-1
  enableServiceWorker: boolean;
  cdnBaseUrl?: string;
}

export class SmartAssetManager {
  private config: AssetManagerConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private assetRegistry: Map<string, AssetMetadata> = new Map();
  private loadQueue: PriorityQueue<AssetLoadRequest> = new PriorityQueue();
  private workers: Worker[] = [];
  private currentCacheSize = 0;
  private loadStats = {
    totalLoaded: 0,
    totalSize: 0,
    averageLoadTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor(config?: Partial<AssetManagerConfig>) {
    this.config = {
      maxCacheSize: 100, // 100MB
      maxCacheAge: 30 * 60 * 1000, // 30 minutes
      enableCompression: true,
      enableWebWorkers: true,
      preloadStrategy: 'conservative',
      compressionQuality: 0.8,
      enableServiceWorker: true,
      ...config
    };

    this.initializeWorkers();
    this.setupServiceWorker();
    this.startCacheCleanup();
    
    console.log('🚀 Smart Asset Manager initialized with intelligent caching');
  }

  private initializeWorkers(): void {
    if (this.config.enableWebWorkers && typeof Worker !== 'undefined') {
      try {
        const workerCode = this.generateWorkerCode();
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        // Create 2 workers for parallel loading
        for (let i = 0; i < 2; i++) {
          const worker = new Worker(workerUrl);
          worker.onmessage = this.handleWorkerMessage.bind(this);
          worker.onerror = (error) => console.warn('Asset worker error:', error);
          this.workers.push(worker);
        }

        URL.revokeObjectURL(workerUrl);
        console.log(`✅ Initialized ${this.workers.length} asset loading workers`);
      } catch (error) {
        console.warn('Failed to initialize web workers:', error);
      }
    }
  }

  private generateWorkerCode(): string {
    return `
      self.onmessage = function(e) {
        const { id, url, type, options } = e.data;
        
        const startTime = performance.now();
        
        fetch(url, {
          ...options,
          cache: 'default'
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
          }
          
          switch (type) {
            case 'json':
              return response.json();
            case 'text':
              return response.text();
            case 'binary':
              return response.arrayBuffer();
            case 'image':
              return response.blob();
            case 'audio':
              return response.blob();
            default:
              return response.blob();
          }
        })
        .then(data => {
          const loadTime = performance.now() - startTime;
          self.postMessage({
            id,
            success: true,
            data,
            loadTime,
            size: data.size || data.byteLength || JSON.stringify(data).length
          });
        })
        .catch(error => {
          self.postMessage({
            id,
            success: false,
            error: error.message,
            loadTime: performance.now() - startTime
          });
        });
      };
    `;
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { id, success, data, error, loadTime, size } = event.data;
    const promise = this.loadingPromises.get(id);
    
    if (promise) {
      if (success) {
        this.processLoadedAsset(id, data, loadTime, size);
      } else {
        console.error(`Asset loading failed: ${id}`, error);
        (promise as any).reject(new Error(error));
      }
      this.loadingPromises.delete(id);
    }
  }

  private setupServiceWorker(): void {
    if (this.config.enableServiceWorker && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/asset-cache-sw.js')
        .then(() => console.log('✅ Asset cache service worker registered'))
        .catch(error => console.warn('Service worker registration failed:', error));
    }
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  public async loadAsset<T = any>(
    id: string, 
    url?: string, 
    options?: AssetLoadOptions
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(id);
    if (cached) {
      cached.references++;
      cached.metadata.useCount++;
      cached.metadata.lastUsed = Date.now();
      this.loadStats.cacheHits++;
      console.log(`📦 Cache hit: ${id}`);
      return cached.asset as T;
    }

    this.loadStats.cacheMisses++;

    // Check if already loading
    const existingPromise = this.loadingPromises.get(id);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }

    // Get asset metadata
    const metadata = this.assetRegistry.get(id);
    const assetUrl = url || metadata?.url;
    
    if (!assetUrl) {
      throw new Error(`Asset URL not found for: ${id}`);
    }

    // Create loading promise
    const loadPromise = this.createLoadPromise<T>(id, assetUrl, metadata, options);
    this.loadingPromises.set(id, loadPromise);

    return loadPromise;
  }

  private async createLoadPromise<T>(
    id: string,
    url: string,
    metadata?: AssetMetadata,
    options?: AssetLoadOptions
  ): Promise<T> {
    const priority = options?.priority || metadata?.priority || 'medium';
    const timeout = options?.timeout || 30000;
    const retries = options?.retries || 3;

    console.log(`📥 Loading asset: ${id} (${priority} priority)`);

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const asset = await this.loadWithTimeout<T>(id, url, metadata, options, timeout);
        
        // Cache the asset if caching is enabled
        if (options?.cache !== false) {
          this.cacheAsset(id, asset, metadata, url);
        }

        console.log(`✅ Successfully loaded: ${id}`);
        return asset;
      } catch (error) {
        console.warn(`⚠️ Load attempt ${attempt + 1}/${retries} failed for ${id}:`, error);
        
        if (attempt === retries - 1) {
          if (options?.onError) {
            options.onError(error as Error);
          }
          throw error;
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error(`Failed to load asset after ${retries} attempts: ${id}`);
  }

  private async loadWithTimeout<T>(
    id: string,
    url: string,
    metadata?: AssetMetadata,
    options?: AssetLoadOptions,
    timeout: number = 30000
  ): Promise<T> {
    const startTime = performance.now();

    // Use worker if available and not critical priority
    if (this.workers.length > 0 && options?.priority !== 'critical') {
      return this.loadWithWorker<T>(id, url, timeout, metadata);
    }

    // Fallback to main thread loading
    return this.loadOnMainThread<T>(id, url, timeout, metadata, options);
  }

  private async loadWithWorker<T>(
    id: string,
    url: string,
    timeout: number,
    metadata?: AssetMetadata
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = this.workers[0]; // Simple round-robin could be improved
      if (!worker) {
        reject(new Error('No worker available'));
        return;
      }
      
      const timeoutId = setTimeout(() => {
        reject(new Error(`Worker load timeout: ${id}`));
      }, timeout);

      const originalOnMessage = worker.onmessage;
      worker.onmessage = (event) => {
        if (event.data.id === id) {
          clearTimeout(timeoutId);
          worker.onmessage = originalOnMessage;
          
          if (event.data.success) {
            resolve(this.processWorkerData<T>(event.data.data, metadata));
          } else {
            reject(new Error(event.data.error));
          }
        } else if (originalOnMessage) {
          originalOnMessage.call(worker, event);
        }
      };

      worker.postMessage({
        id,
        url,
        type: metadata?.type || 'binary',
        options: {}
      });
    });
  }

  private async loadOnMainThread<T>(
    id: string,
    url: string,
    timeout: number,
    metadata?: AssetMetadata,
    options?: AssetLoadOptions
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'default'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const assetType = metadata?.type || this.detectAssetType(url);
      let asset: any;

      switch (assetType) {
        case 'image':
          asset = await this.loadImage(response);
          break;
        case 'audio':
          asset = await this.loadAudio(response);
          break;
        case 'json':
          asset = await response.json();
          break;
        case 'text':
          asset = await response.text();
          break;
        case 'binary':
        default:
          asset = await response.arrayBuffer();
          break;
      }

      clearTimeout(timeoutId);
      return asset as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private processWorkerData<T>(data: any, metadata?: AssetMetadata): T {
    const assetType = metadata?.type || 'binary';
    
    switch (assetType) {
      case 'image':
        return URL.createObjectURL(data) as any;
      case 'audio':
        return URL.createObjectURL(data) as any;
      default:
        return data as T;
    }
  }

  private async loadImage(response: Response): Promise<HTMLImageElement> {
    const blob = await response.blob();
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  }

  private async loadAudio(response: Response): Promise<HTMLAudioElement> {
    const blob = await response.blob();
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      audio.oncanplaythrough = () => {
        URL.revokeObjectURL(url);
        resolve(audio);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio'));
      };
      audio.src = url;
    });
  }

  private detectAssetType(url: string): AssetMetadata['type'] {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'm4a':
        return 'audio';
      case 'json':
        return 'json';
      case 'txt':
      case 'md':
        return 'text';
      default:
        return 'binary';
    }
  }

  private cacheAsset(id: string, asset: any, metadata?: AssetMetadata, url?: string): void {
    const size = this.estimateAssetSize(asset);
    
    // Check if we need to free up space
    if (this.currentCacheSize + size > this.config.maxCacheSize * 1024 * 1024) {
      this.freeUpCacheSpace(size);
    }

    const entry: CacheEntry = {
      asset,
      metadata: metadata || this.createMetadata(id, url || '', asset),
      cachedAt: Date.now(),
      size,
      references: 1
    };

    this.cache.set(id, entry);
    this.currentCacheSize += size;

    console.log(`💾 Cached asset: ${id} (${this.formatBytes(size)})`);
  }

  private createMetadata(id: string, url: string, asset: any): AssetMetadata {
    return {
      id,
      url,
      type: this.detectAssetType(url),
      size: this.estimateAssetSize(asset),
      lastModified: Date.now(),
      version: '1.0.0',
      dependencies: [],
      tags: [],
      priority: 'medium',
      useCount: 1,
      lastUsed: Date.now()
    };
  }

  private estimateAssetSize(asset: any): number {
    if (asset instanceof ArrayBuffer) {
      return asset.byteLength;
    }
    if (asset instanceof Blob) {
      return asset.size;
    }
    if (asset instanceof HTMLImageElement) {
      return asset.width * asset.height * 4; // Estimated RGBA bytes
    }
    if (asset instanceof HTMLAudioElement) {
      return 1024 * 1024; // Estimated 1MB for audio
    }
    if (typeof asset === 'string') {
      return asset.length * 2; // UTF-16 encoding
    }
    if (typeof asset === 'object') {
      return JSON.stringify(asset).length * 2;
    }
    return 1024; // Default estimate
  }

  private freeUpCacheSpace(requiredSpace: number): void {
    console.log(`🧹 Freeing up cache space: need ${this.formatBytes(requiredSpace)}`);
    
    // Sort by last used (LRU)
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.metadata.lastUsed - b.metadata.lastUsed);

    let freedSpace = 0;
    for (const [id, entry] of sortedEntries) {
      if (entry.references === 0) { // Only remove unreferenced assets
        this.cache.delete(id);
        this.currentCacheSize -= entry.size;
        freedSpace += entry.size;
        
        console.log(`🗑️ Removed from cache: ${id} (${this.formatBytes(entry.size)})`);
        
        if (freedSpace >= requiredSpace) {
          break;
        }
      }
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = this.config.maxCacheAge;
    let cleanedSize = 0;
    let cleanedCount = 0;

    for (const [id, entry] of this.cache.entries()) {
      const age = now - entry.cachedAt;
      
      if (age > maxAge && entry.references === 0) {
        this.cache.delete(id);
        this.currentCacheSize -= entry.size;
        cleanedSize += entry.size;
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleanedCount} assets (${this.formatBytes(cleanedSize)})`);
    }
  }

  public registerAsset(metadata: AssetMetadata): void {
    this.assetRegistry.set(metadata.id, metadata);
    console.log(`📋 Registered asset: ${metadata.id}`);
  }

  public registerAssets(assets: AssetMetadata[]): void {
    for (const asset of assets) {
      this.registerAsset(asset);
    }
    console.log(`📋 Registered ${assets.length} assets`);
  }

  public async preloadAssets(ids: string[], onProgress?: (progress: number) => void): Promise<void> {
    console.log(`⏳ Preloading ${ids.length} assets...`);
    
    const totalAssets = ids.length;
    let loadedAssets = 0;

    const loadPromises = ids.map(async (id) => {
      try {
        await this.loadAsset(id);
        loadedAssets++;
        if (onProgress) {
          onProgress(loadedAssets / totalAssets);
        }
      } catch (error) {
        console.warn(`Failed to preload asset: ${id}`, error);
        loadedAssets++;
        if (onProgress) {
          onProgress(loadedAssets / totalAssets);
        }
      }
    });

    await Promise.all(loadPromises);
    console.log(`✅ Preloading complete: ${loadedAssets}/${totalAssets} assets loaded`);
  }

  public releaseAsset(id: string): void {
    const entry = this.cache.get(id);
    if (entry && entry.references > 0) {
      entry.references--;
      console.log(`📤 Released reference to asset: ${id} (${entry.references} refs remaining)`);
    }
  }

  public getAsset<T = any>(id: string): T | null {
    const entry = this.cache.get(id);
    return entry ? entry.asset as T : null;
  }

  public isAssetCached(id: string): boolean {
    return this.cache.has(id);
  }

  public getCacheStats(): any {
    return {
      ...this.loadStats,
      cacheSize: this.formatBytes(this.currentCacheSize),
      cachedAssets: this.cache.size,
      registeredAssets: this.assetRegistry.size,
      cacheHitRate: this.loadStats.cacheHits / (this.loadStats.cacheHits + this.loadStats.cacheMisses) || 0
    };
  }

  public clearCache(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
    console.log('🧹 Cache cleared completely');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private processLoadedAsset(id: string, data: any, loadTime: number, size: number): void {
    this.loadStats.totalLoaded++;
    this.loadStats.totalSize += size;
    this.loadStats.averageLoadTime = 
      (this.loadStats.averageLoadTime * (this.loadStats.totalLoaded - 1) + loadTime) / 
      this.loadStats.totalLoaded;

    // Update metadata if it exists
    const metadata = this.assetRegistry.get(id);
    if (metadata) {
      metadata.loadTime = loadTime;
      metadata.size = size;
    }
  }

  public destroy(): void {
    // Terminate workers
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];

    // Clear cache
    this.clearCache();
    
    // Clear loading promises
    this.loadingPromises.clear();
    
    console.log('💥 Asset Manager destroyed');
  }
}

// Priority Queue for asset loading
class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

interface AssetLoadRequest {
  id: string;
  url: string;
  options: AssetLoadOptions;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

// Utility function to create asset manager
export function createAssetManager(config?: Partial<AssetManagerConfig>): SmartAssetManager {
  const manager = new SmartAssetManager(config);
  
  // Store reference for debugging
  (window as any).assetManager = manager;
  
  return manager;
}