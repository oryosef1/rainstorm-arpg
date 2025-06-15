// Asset Pipeline Manager - Asset pipeline management for game development
// Complete asset management, optimization, and hot-swap system for game assets

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Image, Music, FileText, Video, Folder, FolderOpen,
  Download, Upload, Trash2, Edit, Copy, Eye, EyeOff, Search,
  Filter, Sort, Grid, List, RefreshCw, Settings, Zap, Star,
  Clock, CheckCircle, AlertTriangle, TrendingUp, BarChart3,
  Layers, Cpu, HardDrive, Network, Activity, Heart, Target,
  Play, Pause, RotateCcw, Plus, Minus, Square, Circle
} from 'lucide-react';

const AssetPipelineManager = ({ eventBus, activeProject }) => {
  const [assets, setAssets] = useState([]);
  const [assetCategories, setAssetCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [optimizationQueue, setOptimizationQueue] = useState([]);
  const [pipelineStats, setPipelineStats] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [hotSwapHistory, setHotSwapHistory] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAssetPreview, setShowAssetPreview] = useState(false);

  // Initialize asset pipeline
  useEffect(() => {
    if (activeProject) {
      loadAssetPipeline();
      loadPerformanceMetrics();
      startAssetMonitoring();
    }
  }, [activeProject]);

  const loadAssetPipeline = async () => {
    try {
      // Load comprehensive asset pipeline data
      const pipelineData = await loadPipelineData();
      setAssets(pipelineData.assets);
      setAssetCategories(pipelineData.categories);
      setOptimizationQueue(pipelineData.optimizationQueue);
      setPipelineStats(pipelineData.stats);
      setHotSwapHistory(pipelineData.hotSwapHistory);
      
    } catch (error) {
      console.error('Failed to load asset pipeline:', error);
    }
  };

  const loadPipelineData = async () => {
    // Simulate loading pipeline data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      assets: generateAssets(),
      categories: generateAssetCategories(),
      optimizationQueue: generateOptimizationQueue(),
      stats: generatePipelineStats(),
      hotSwapHistory: generateHotSwapHistory()
    };
  };

  const generateAssets = () => {
    const assetTypes = ['image', 'audio', 'model', 'texture', 'animation', 'data'];
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    
    return Array.from({ length: 120 }, (_, i) => {
      const type = assetTypes[Math.floor(Math.random() * assetTypes.length)];
      const rarity = rarities[Math.floor(Math.random() * rarities.length)];
      
      return {
        id: `asset-${i + 1}`,
        name: `${type}_${String(i + 1).padStart(3, '0')}`,
        type,
        category: getAssetCategory(type),
        rarity,
        size: Math.floor(Math.random() * 5000) + 100, // KB
        originalSize: Math.floor(Math.random() * 8000) + 500,
        compressionRatio: Math.floor(Math.random() * 70) + 10,
        format: getAssetFormat(type),
        quality: Math.floor(Math.random() * 30) + 70,
        usage: Math.floor(Math.random() * 100),
        lastModified: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        status: ['optimized', 'pending', 'processing', 'error'][Math.floor(Math.random() * 4)],
        hotSwapEnabled: Math.random() > 0.3,
        dependencies: Math.floor(Math.random() * 5),
        performanceImpact: Math.floor(Math.random() * 100),
        metadata: {
          width: type === 'image' ? Math.floor(Math.random() * 2048) + 256 : null,
          height: type === 'image' ? Math.floor(Math.random() * 2048) + 256 : null,
          duration: type === 'audio' ? Math.floor(Math.random() * 120) + 10 : null,
          bitrate: type === 'audio' ? Math.floor(Math.random() * 192) + 128 : null,
          triangles: type === 'model' ? Math.floor(Math.random() * 10000) + 1000 : null
        },
        tags: generateAssetTags(type, rarity)
      };
    });
  };

  const getAssetCategory = (type) => {
    const categoryMap = {
      image: 'textures',
      texture: 'textures',
      audio: 'sounds',
      model: 'models',
      animation: 'animations',
      data: 'data'
    };
    return categoryMap[type] || 'misc';
  };

  const getAssetFormat = (type) => {
    const formatMap = {
      image: ['PNG', 'JPG', 'WebP', 'DDS'][Math.floor(Math.random() * 4)],
      audio: ['OGG', 'MP3', 'WAV'][Math.floor(Math.random() * 3)],
      model: ['FBX', 'OBJ', 'GLTF'][Math.floor(Math.random() * 3)],
      texture: ['DDS', 'PNG', 'TGA'][Math.floor(Math.random() * 3)],
      animation: ['FBX', 'BVH'][Math.floor(Math.random() * 2)],
      data: ['JSON', 'XML', 'TXT'][Math.floor(Math.random() * 3)]
    };
    return formatMap[type] || 'UNKNOWN';
  };

  const generateAssetTags = (type, rarity) => {
    const baseTags = [type, rarity];
    const additionalTags = ['ui', 'environment', 'character', 'weapon', 'effect', 'icon'];
    const numAdditional = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numAdditional; i++) {
      const tag = additionalTags[Math.floor(Math.random() * additionalTags.length)];
      if (!baseTags.includes(tag)) {
        baseTags.push(tag);
      }
    }
    
    return baseTags;
  };

  const generateAssetCategories = () => {
    return [
      { id: 'all', name: 'All Assets', count: 120, icon: <Package className="w-4 h-4" /> },
      { id: 'textures', name: 'Textures', count: 45, icon: <Image className="w-4 h-4" /> },
      { id: 'sounds', name: 'Audio', count: 28, icon: <Music className="w-4 h-4" /> },
      { id: 'models', name: '3D Models', count: 23, icon: <Package className="w-4 h-4" /> },
      { id: 'animations', name: 'Animations', count: 15, icon: <Play className="w-4 h-4" /> },
      { id: 'data', name: 'Data Files', count: 9, icon: <FileText className="w-4 h-4" /> }
    ];
  };

  const generateOptimizationQueue = () => {
    return [
      {
        id: 'opt-1',
        assetId: 'asset-45',
        name: 'character_texture_01.png',
        type: 'texture_compression',
        priority: 'high',
        estimatedTime: 120,
        potentialSavings: 67.3,
        status: 'queued'
      },
      {
        id: 'opt-2',
        assetId: 'asset-72',
        name: 'environment_audio_forest.ogg',
        type: 'audio_compression',
        priority: 'medium',
        estimatedTime: 45,
        potentialSavings: 34.8,
        status: 'processing'
      },
      {
        id: 'opt-3',
        assetId: 'asset-13',
        name: 'weapon_model_sword.fbx',
        type: 'mesh_optimization',
        priority: 'low',
        estimatedTime: 180,
        potentialSavings: 23.1,
        status: 'queued'
      }
    ];
  };

  const generatePipelineStats = () => {
    return {
      totalAssets: 120,
      optimizedAssets: 87,
      totalSize: 245.6, // MB
      optimizedSize: 167.3, // MB
      compressionRatio: 31.9,
      hotSwapEvents: 156,
      performanceGain: 23.7,
      pipelineEfficiency: 89.4
    };
  };

  const generateHotSwapHistory = () => {
    return [
      {
        id: 'swap-1',
        assetName: 'inventory_icon_sword.png',
        timestamp: Date.now() - 1800000,
        type: 'texture',
        oldVersion: 'v1.2',
        newVersion: 'v1.3',
        status: 'success',
        duration: 234
      },
      {
        id: 'swap-2',
        assetName: 'ambient_cave_sounds.ogg',
        timestamp: Date.now() - 3600000,
        type: 'audio',
        oldVersion: 'v2.1',
        newVersion: 'v2.2',
        status: 'success',
        duration: 156
      },
      {
        id: 'swap-3',
        assetName: 'character_walk_animation.fbx',
        timestamp: Date.now() - 7200000,
        type: 'animation',
        oldVersion: 'v1.0',
        newVersion: 'v1.1',
        status: 'failed',
        duration: 0,
        error: 'File format incompatible'
      }
    ];
  };

  const loadPerformanceMetrics = () => {
    setPerformanceMetrics({
      loadTimes: {
        average: 1.34,
        p95: 2.87,
        p99: 4.23
      },
      memoryUsage: {
        textures: 145.6,
        audio: 67.8,
        models: 89.3,
        total: 302.7
      },
      compressionStats: {
        textureCompression: 78.4,
        audioCompression: 65.2,
        meshOptimization: 34.7
      },
      hotSwapPerformance: {
        successRate: 94.7,
        averageTime: 187,
        cacheHitRatio: 87.3
      }
    });
  };

  const startAssetMonitoring = () => {
    const interval = setInterval(() => {
      // Update real-time metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        loadTimes: {
          ...prev.loadTimes,
          average: Math.max(0.5, Math.min(3, prev.loadTimes.average + (Math.random() - 0.5) * 0.1))
        },
        memoryUsage: {
          ...prev.memoryUsage,
          total: Math.max(200, Math.min(500, prev.memoryUsage.total + (Math.random() - 0.5) * 10))
        }
      }));
      
      // Update optimization queue
      setOptimizationQueue(prev => prev.map(item => 
        item.status === 'processing' 
          ? { ...item, estimatedTime: Math.max(0, item.estimatedTime - 5) }
          : item
      ));
      
    }, 3000);
    
    return () => clearInterval(interval);
  };

  const optimizeAsset = async (assetId) => {
    try {
      setIsOptimizing(true);
      
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;
      
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update asset status
      setAssets(prev => prev.map(a => 
        a.id === assetId 
          ? { 
              ...a, 
              status: 'optimized',
              size: Math.floor(a.size * 0.7),
              compressionRatio: Math.floor(Math.random() * 30) + 50,
              quality: Math.min(100, a.quality + 5)
            }
          : a
      ));
      
      if (eventBus) {
        eventBus.emit('asset:optimized', { assetId, asset });
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Asset Optimized',
          message: `Successfully optimized ${asset.name}`
        });
      }
      
    } catch (error) {
      console.error('Asset optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const hotSwapAsset = async (assetId, newVersion) => {
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;
      
      // Simulate hot swap
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const swapRecord = {
        id: `swap-${Date.now()}`,
        assetName: asset.name,
        timestamp: Date.now(),
        type: asset.type,
        oldVersion: 'v1.0',
        newVersion: newVersion || 'v1.1',
        status: Math.random() > 0.1 ? 'success' : 'failed',
        duration: Math.floor(Math.random() * 300) + 100,
        error: Math.random() > 0.1 ? null : 'Hot swap failed'
      };
      
      setHotSwapHistory(prev => [swapRecord, ...prev]);
      
      if (eventBus) {
        eventBus.emit('asset:hot-swapped', { assetId, swapRecord });
        eventBus.emit('system:alert', {
          level: swapRecord.status === 'success' ? 'success' : 'error',
          title: 'Asset Hot Swap',
          message: swapRecord.status === 'success' 
            ? `Successfully hot-swapped ${asset.name}`
            : `Hot swap failed for ${asset.name}`
        });
      }
      
    } catch (error) {
      console.error('Hot swap failed:', error);
    }
  };

  const batchOptimizeAssets = async () => {
    try {
      setIsOptimizing(true);
      
      const pendingAssets = assets.filter(a => a.status === 'pending');
      
      for (const asset of pendingAssets.slice(0, 5)) {
        await optimizeAsset(asset.id);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Batch Optimization Complete',
          message: `Optimized ${Math.min(5, pendingAssets.length)} assets`
        });
      }
      
    } catch (error) {
      console.error('Batch optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getAssetTypeIcon = (type) => {
    switch (type) {
      case 'image':
      case 'texture': return <Image className="w-4 h-4 text-blue-400" />;
      case 'audio': return <Music className="w-4 h-4 text-green-400" />;
      case 'model': return <Package className="w-4 h-4 text-purple-400" />;
      case 'animation': return <Play className="w-4 h-4 text-orange-400" />;
      case 'data': return <FileText className="w-4 h-4 text-gray-400" />;
      default: return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimized': return 'text-green-400';
      case 'processing': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'optimized': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'text-orange-400';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      case 'uncommon': return 'text-green-400';
      case 'common': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const formatFileSize = (sizeKB) => {
    if (sizeKB >= 1024) {
      return `${(sizeKB / 1024).toFixed(1)} MB`;
    }
    return `${sizeKB} KB`;
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    return 'Just now';
  };

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Asset Pipeline Manager</p>
          <p className="text-gray-500 text-sm">Select a project to manage game assets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Package className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Asset Pipeline Manager</h2>
              {isOptimizing && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-purple-600/20 rounded">
                  <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span className="text-xs text-purple-400">Optimizing...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-1 bg-gray-800 rounded">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={batchOptimizeAssets}
              disabled={isOptimizing}
              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded"
            >
              <Zap className="w-4 h-4" />
              <span>Optimize</span>
            </button>
            
            <button
              onClick={loadAssetPipeline}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Pipeline Stats */}
        <div className="grid grid-cols-8 gap-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Total Assets</span>
            </div>
            <p className="text-lg font-bold text-white">{pipelineStats.totalAssets || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Optimized</span>
            </div>
            <p className="text-lg font-bold text-white">{pipelineStats.optimizedAssets || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Total Size</span>
            </div>
            <p className="text-lg font-bold text-white">{pipelineStats.totalSize || 0} MB</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Compression</span>
            </div>
            <p className="text-lg font-bold text-white">{pipelineStats.compressionRatio || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">Hot Swaps</span>
            </div>
            <p className="text-lg font-bold text-white">{pipelineStats.hotSwapEvents || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-400">Performance</span>
            </div>
            <p className="text-lg font-bold text-white">+{pipelineStats.performanceGain || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-400">Load Time</span>
            </div>
            <p className="text-lg font-bold text-white">{performanceMetrics.loadTimes?.average?.toFixed(2)}s</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Efficiency</span>
            </div>
            <p className="text-lg font-bold text-white">{pipelineStats.pipelineEfficiency || 0}%</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Asset Categories */}
          <div className="border-b border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Asset Categories</h3>
            <div className="space-y-2">
              {assetCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded transition-all ${
                    selectedCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {category.icon}
                    <span>{category.name}</span>
                  </div>
                  <span className="text-xs">{category.count}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Optimization Queue */}
          <div className="border-b border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Optimization Queue</h3>
            <div className="space-y-3">
              {optimizationQueue.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Type: {item.type}</div>
                    <div>Savings: {item.potentialSavings}%</div>
                    <div>ETA: {item.estimatedTime}s</div>
                  </div>
                  <div className={`flex items-center space-x-1 mt-2 ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="text-xs capitalize">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Hot Swap History */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Hot Swap History</h3>
            <div className="space-y-3">
              {hotSwapHistory.slice(0, 5).map((swap) => (
                <div key={swap.id} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-white truncate">{swap.assetName}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    {swap.oldVersion} → {swap.newVersion}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className={`flex items-center space-x-1 ${getStatusColor(swap.status)}`}>
                      {getStatusIcon(swap.status)}
                      <span className="text-xs capitalize">{swap.status}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatTimeAgo(swap.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Asset Grid/List */}
        <div className="flex-1 p-6 overflow-y-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-gray-900 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="flex items-center justify-between mb-3">
                    {getAssetTypeIcon(asset.type)}
                    <div className={`flex items-center space-x-1 ${getStatusColor(asset.status)}`}>
                      {getStatusIcon(asset.status)}
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-white mb-1 truncate">{asset.name}</h4>
                  <p className="text-xs text-gray-400 mb-2">{asset.format}</p>
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatFileSize(asset.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span>{asset.quality}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usage:</span>
                      <span>{asset.usage}%</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={`px-1 py-0.5 rounded text-xs ${getRarityColor(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex space-x-1 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        optimizeAsset(asset.id);
                      }}
                      disabled={asset.status === 'optimized' || isOptimizing}
                      className="p-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs"
                    >
                      <Zap className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        hotSwapAsset(asset.id);
                      }}
                      disabled={!asset.hotSwapEnabled}
                      className="p-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded text-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAssetPreview(true);
                      }}
                      className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Asset</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Quality</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredAssets.slice(0, 20).map((asset) => (
                      <tr key={asset.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {getAssetTypeIcon(asset.type)}
                            <span className="text-sm text-white">{asset.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{asset.format}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatFileSize(asset.size)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{asset.quality}%</td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center space-x-1 ${getStatusColor(asset.status)}`}>
                            {getStatusIcon(asset.status)}
                            <span className="text-sm capitalize">{asset.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => optimizeAsset(asset.id)}
                              disabled={asset.status === 'optimized' || isOptimizing}
                              className="p-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded"
                            >
                              <Zap className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => hotSwapAsset(asset.id)}
                              disabled={!asset.hotSwapEnabled}
                              className="p-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetPipelineManager;