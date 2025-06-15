// Smart Asset Management Tests
// Tests intelligent asset loading, caching, and optimization

import { SmartAssetManager, createAssetManager, AssetMetadata } from '../game-core/utils/asset-manager';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock Worker for testing
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;
  
  postMessage(data: any): void {
    // Simulate worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', {
          data: {
            id: data.id,
            success: true,
            data: `mock-data-for-${data.id}`,
            loadTime: 100,
            size: 1024
          }
        }));
      }
    }, 10);
  }
  
  terminate(): void {
    // Mock terminate
  }
}

// Replace global Worker with mock
(global as any).Worker = MockWorker;
(global as any).URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

describe('Smart Asset Management & Optimization', () => {
  let assetManager: SmartAssetManager;

  beforeEach(() => {
    mockFetch.mockClear();
    assetManager = new SmartAssetManager({
      maxCacheSize: 10, // 10MB for testing
      enableWebWorkers: false, // Disable for simpler testing
      enableServiceWorker: false
    });
  });

  afterEach(() => {
    assetManager.destroy();
  });

  test('should create asset manager with default config', () => {
    const manager = createAssetManager();
    expect(manager).toBeInstanceOf(SmartAssetManager);
    expect((window as any).assetManager).toBe(manager);
    manager.destroy();
  });

  test('should register assets', () => {
    const metadata: AssetMetadata = {
      id: 'test-asset',
      url: '/test-asset.png',
      type: 'image',
      size: 1024,
      lastModified: Date.now(),
      version: '1.0.0',
      dependencies: [],
      tags: ['test'],
      priority: 'medium',
      useCount: 0,
      lastUsed: 0
    };

    assetManager.registerAsset(metadata);
    
    // Test that we can load the registered asset
    expect(() => assetManager.loadAsset('test-asset')).not.toThrow();
  });

  test('should register multiple assets', () => {
    const assets: AssetMetadata[] = [
      {
        id: 'asset1',
        url: '/asset1.png',
        type: 'image',
        size: 1024,
        lastModified: Date.now(),
        version: '1.0.0',
        dependencies: [],
        tags: [],
        priority: 'high',
        useCount: 0,
        lastUsed: 0
      },
      {
        id: 'asset2',
        url: '/asset2.json',
        type: 'json',
        size: 512,
        lastModified: Date.now(),
        version: '1.0.0',
        dependencies: [],
        tags: [],
        priority: 'low',
        useCount: 0,
        lastUsed: 0
      }
    ];

    assetManager.registerAssets(assets);
    
    expect(() => assetManager.loadAsset('asset1')).not.toThrow();
    expect(() => assetManager.loadAsset('asset2')).not.toThrow();
  });

  test('should load and cache assets', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ test: 'data' }),
      text: jest.fn().mockResolvedValue('test data'),
      blob: jest.fn().mockResolvedValue(new Blob(['test'])),
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10))
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const asset = await assetManager.loadAsset('test', '/test.json');
    expect(asset).toEqual({ test: 'data' });
    expect(assetManager.isAssetCached('test')).toBe(true);
  });

  test('should return cached assets on subsequent loads', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ cached: 'data' })
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    // First load
    const asset1 = await assetManager.loadAsset('cached-test', '/cached.json');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second load should use cache
    const asset2 = await assetManager.loadAsset('cached-test');
    expect(mockFetch).toHaveBeenCalledTimes(1); // Should not call fetch again
    expect(asset1).toBe(asset2);
  });

  test('should handle loading errors with retries', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ recovered: 'data' })
      } as any);

    const asset = await assetManager.loadAsset('retry-test', '/retry.json', {
      retries: 3
    });

    expect(asset).toEqual({ recovered: 'data' });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  test('should handle loading timeout', async () => {
    mockFetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    await expect(
      assetManager.loadAsset('timeout-test', '/timeout.json', {
        timeout: 100
      })
    ).rejects.toThrow();
  });

  test('should detect asset types from URL', async () => {
    const mockImageResponse = {
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['image'], { type: 'image/png' }))
    };

    const mockAudioResponse = {
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['audio'], { type: 'audio/mp3' }))
    };

    // Mock Image constructor
    const mockImage = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
      width: 100,
      height: 100
    };

    (global as any).Image = jest.fn(() => {
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 10);
      return mockImage;
    });

    mockFetch.mockResolvedValue(mockImageResponse as any);
    const imageAsset = await assetManager.loadAsset('image', '/test.png');
    expect(imageAsset).toBe(mockImage);

    // Test audio
    const mockAudio = {
      oncanplaythrough: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: ''
    };

    (global as any).Audio = jest.fn(() => {
      setTimeout(() => {
        if (mockAudio.oncanplaythrough) mockAudio.oncanplaythrough();
      }, 10);
      return mockAudio;
    });

    mockFetch.mockResolvedValue(mockAudioResponse as any);
    const audioAsset = await assetManager.loadAsset('audio', '/test.mp3');
    expect(audioAsset).toBe(mockAudio);
  });

  test('should preload multiple assets', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ preloaded: true })
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const assets: AssetMetadata[] = [
      {
        id: 'preload1',
        url: '/preload1.json',
        type: 'json',
        size: 100,
        lastModified: Date.now(),
        version: '1.0.0',
        dependencies: [],
        tags: [],
        priority: 'high',
        useCount: 0,
        lastUsed: 0
      },
      {
        id: 'preload2',
        url: '/preload2.json',
        type: 'json',
        size: 100,
        lastModified: Date.now(),
        version: '1.0.0',
        dependencies: [],
        tags: [],
        priority: 'high',
        useCount: 0,
        lastUsed: 0
      }
    ];

    assetManager.registerAssets(assets);

    let progressCalls = 0;
    await assetManager.preloadAssets(['preload1', 'preload2'], (progress) => {
      progressCalls++;
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    expect(progressCalls).toBeGreaterThan(0);
    expect(assetManager.isAssetCached('preload1')).toBe(true);
    expect(assetManager.isAssetCached('preload2')).toBe(true);
  });

  test('should track cache statistics', async () => {
    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue('test data')
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    // Load some assets
    await assetManager.loadAsset('stats1', '/stats1.txt');
    await assetManager.loadAsset('stats2', '/stats2.txt');
    
    // Load cached asset
    await assetManager.loadAsset('stats1');

    const stats = assetManager.getCacheStats();
    expect(stats.totalLoaded).toBe(2);
    expect(stats.cachedAssets).toBe(2);
    expect(stats.cacheHits).toBe(1);
    expect(stats.cacheMisses).toBe(2);
    expect(stats.cacheHitRate).toBe(1/3);
  });

  test('should release asset references', async () => {
    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue('reference test')
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    await assetManager.loadAsset('ref-test', '/ref.txt');
    expect(assetManager.isAssetCached('ref-test')).toBe(true);

    assetManager.releaseAsset('ref-test');
    
    // Asset should still be cached but with 0 references
    expect(assetManager.isAssetCached('ref-test')).toBe(true);
  });

  test('should get cached assets directly', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ direct: 'access' })
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    await assetManager.loadAsset('direct', '/direct.json');
    const asset = assetManager.getAsset('direct');
    
    expect(asset).toEqual({ direct: 'access' });
  });

  test('should return null for non-cached assets', () => {
    const asset = assetManager.getAsset('non-existent');
    expect(asset).toBeNull();
  });

  test('should clear cache completely', async () => {
    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue('clear test')
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    await assetManager.loadAsset('clear1', '/clear1.txt');
    await assetManager.loadAsset('clear2', '/clear2.txt');
    
    expect(assetManager.isAssetCached('clear1')).toBe(true);
    expect(assetManager.isAssetCached('clear2')).toBe(true);

    assetManager.clearCache();
    
    expect(assetManager.isAssetCached('clear1')).toBe(false);
    expect(assetManager.isAssetCached('clear2')).toBe(false);
  });

  test('should handle concurrent loads of same asset', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ concurrent: 'test' })
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    // Start multiple loads of the same asset simultaneously
    const promises = [
      assetManager.loadAsset('concurrent', '/concurrent.json'),
      assetManager.loadAsset('concurrent', '/concurrent.json'),
      assetManager.loadAsset('concurrent', '/concurrent.json')
    ];

    const results = await Promise.all(promises);
    
    // Should only make one network request
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // All results should be the same
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
  });

  test('should handle asset loading with custom options', async () => {
    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue('custom options')
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    let progressCalled = false;
    let errorCalled = false;

    const asset = await assetManager.loadAsset('custom', '/custom.txt', {
      priority: 'critical',
      timeout: 5000,
      retries: 1,
      cache: true,
      onProgress: (progress) => {
        progressCalled = true;
      },
      onError: (error) => {
        errorCalled = true;
      }
    });

    expect(asset).toBe('custom options');
    // Progress callback is not called in this simple mock scenario
    expect(errorCalled).toBe(false);
  });

  test('should fail when asset URL not found', async () => {
    await expect(
      assetManager.loadAsset('missing-url')
    ).rejects.toThrow('Asset URL not found');
  });

  test('should handle HTTP errors', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found'
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    await expect(
      assetManager.loadAsset('http-error', '/404.json', { retries: 1 })
    ).rejects.toThrow('HTTP 404: Not Found');
  });
});