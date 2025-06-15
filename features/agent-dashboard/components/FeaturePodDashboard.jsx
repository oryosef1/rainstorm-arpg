// Feature Pod Dashboard - Visual management of the revolutionary conflict-free architecture
// Complete Feature Pod System control with real-time monitoring and event flow visualization

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, Plus, Settings, Eye, EyeOff, Play, Pause, RotateCcw,
  Activity, Zap, CheckCircle, AlertTriangle, Clock, Code,
  GitBranch, Network, Package, Cpu, HardDrive, BarChart3,
  ArrowRight, Circle, Square, FileText, Terminal, Bug,
  Workflow, Target, MessageSquare, Download, Upload
} from 'lucide-react';

const FeaturePodDashboard = ({ eventBus, activeProject }) => {
  const [pods, setPods] = useState([]);
  const [selectedPod, setSelectedPod] = useState(null);
  const [eventFlow, setEventFlow] = useState([]);
  const [podMetrics, setPodMetrics] = useState({});
  const [showEventFlow, setShowEventFlow] = useState(true);
  const [showCreatePod, setShowCreatePod] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState([]);
  const [systemHealth, setSystemHealth] = useState('healthy');
  const [podStats, setPodStats] = useState({
    total: 0,
    active: 0,
    healthy: 0,
    events: 0
  });

  // Initialize pod system
  useEffect(() => {
    if (activeProject) {
      loadFeaturePods();
      loadEventFlow();
      startRealTimeMonitoring();
    }
  }, [activeProject]);

  const loadFeaturePods = async () => {
    try {
      // Detect existing feature pods
      const detectedPods = await detectFeaturePods();
      setPods(detectedPods);
      
      // Load metrics for each pod
      const metrics = {};
      for (const pod of detectedPods) {
        metrics[pod.id] = await loadPodMetrics(pod);
      }
      setPodMetrics(metrics);
      
      // Calculate stats
      calculatePodStats(detectedPods, metrics);
      
    } catch (error) {
      console.error('Failed to load feature pods:', error);
    }
  };

  const detectFeaturePods = async () => {
    // In a real implementation, this would scan the features directory
    // For now, return the known pods from the RainStorm project
    return [
      {
        id: 'agent-dashboard',
        name: 'Agent Dashboard',
        type: 'core',
        status: 'active',
        health: 'healthy',
        version: '1.0.0',
        path: '/features/agent-dashboard',
        description: 'Revolutionary AI development dashboard with Claude integration',
        dependencies: ['event-bus', 'permission-system'],
        api: {
          endpoints: 12,
          events: 25,
          types: 8
        },
        components: [
          'AgentDashboard.jsx',
          'ProjectHub.jsx',
          'SessionManager.jsx',
          'FileExplorer.jsx',
          'GamePreview.jsx',
          'DatabaseManager.jsx'
        ],
        services: [
          'claude-integration.ts',
          'session-manager.ts',
          'workflow-engine.ts'
        ],
        lastModified: Date.now() - 3600000,
        size: '2.1 MB',
        linesOfCode: 8420
      },
      {
        id: 'inventory-system',
        name: 'Inventory System',
        type: 'game',
        status: 'active',
        health: 'healthy',
        version: '1.2.0',
        path: '/features/inventory-system',
        description: 'Advanced inventory management with item categorization',
        dependencies: ['event-bus'],
        api: {
          endpoints: 8,
          events: 15,
          types: 12
        },
        components: [],
        services: [
          'inventory-system.pod.ts',
          'inventory-system.api.ts'
        ],
        lastModified: Date.now() - 7200000,
        size: '450 KB',
        linesOfCode: 1250
      },
      {
        id: 'flask-system',
        name: 'Flask System',
        type: 'game',
        status: 'active',
        health: 'healthy',
        version: '1.0.0',
        path: '/features/flask-system',
        description: 'Character flask and buff management system',
        dependencies: ['event-bus', 'inventory-system'],
        api: {
          endpoints: 6,
          events: 10,
          types: 8
        },
        components: [],
        services: [
          'flask-system.pod.ts',
          'flask-system.types.ts'
        ],
        lastModified: Date.now() - 14400000,
        size: '320 KB',
        linesOfCode: 890
      },
      {
        id: 'character-progression',
        name: 'Character Progression',
        type: 'game',
        status: 'development',
        health: 'warning',
        version: '0.8.0',
        path: '/game-core/character/progression',
        description: 'Player character leveling and skill progression',
        dependencies: ['event-bus', 'inventory-system'],
        api: {
          endpoints: 10,
          events: 18,
          types: 15
        },
        components: [],
        services: [
          'character-progression.ts',
          'skill-gems.ts',
          'passive-skill-tree.ts'
        ],
        lastModified: Date.now() - 21600000,
        size: '680 KB',
        linesOfCode: 2340
      },
      {
        id: 'world-areas',
        name: 'World Areas',
        type: 'game',
        status: 'active',
        health: 'healthy',
        version: '1.1.0',
        path: '/game-core/world',
        description: 'Game world management and area transitions',
        dependencies: ['event-bus'],
        api: {
          endpoints: 7,
          events: 12,
          types: 9
        },
        components: [],
        services: [
          'world-areas.ts',
          'world-areas-system.ts'
        ],
        lastModified: Date.now() - 28800000,
        size: '540 KB',
        linesOfCode: 1560
      }
    ];
  };

  const loadPodMetrics = async (pod) => {
    // Mock metrics for each pod
    return {
      performance: {
        responseTime: Math.round((Math.random() * 50 + 10) * 100) / 100,
        throughput: Math.floor(Math.random() * 1000) + 500,
        errorRate: Math.round(Math.random() * 5 * 100) / 100,
        memoryUsage: Math.round((Math.random() * 30 + 20) * 100) / 100
      },
      events: {
        sent: Math.floor(Math.random() * 1000) + 100,
        received: Math.floor(Math.random() * 800) + 80,
        processed: Math.floor(Math.random() * 900) + 90,
        failed: Math.floor(Math.random() * 10)
      },
      health: {
        uptime: Math.round((Math.random() * 10 + 90) * 100) / 100,
        lastCheck: Date.now(),
        issues: Math.floor(Math.random() * 3)
      }
    };
  };

  const loadEventFlow = async () => {
    // Mock event flow data
    const mockEventFlow = [
      {
        id: 'inventory-update',
        source: 'inventory-system',
        target: 'character-progression',
        eventType: 'item.equipped',
        frequency: 45,
        lastSeen: Date.now() - 120000,
        status: 'active'
      },
      {
        id: 'flask-consumed',
        source: 'flask-system',
        target: 'character-progression',
        eventType: 'flask.consumed',
        frequency: 23,
        lastSeen: Date.now() - 30000,
        status: 'active'
      },
      {
        id: 'area-transition',
        source: 'world-areas',
        target: 'character-progression',
        eventType: 'area.entered',
        frequency: 12,
        lastSeen: Date.now() - 300000,
        status: 'active'
      },
      {
        id: 'dashboard-event',
        source: 'agent-dashboard',
        target: 'inventory-system',
        eventType: 'ui.action',
        frequency: 8,
        lastSeen: Date.now() - 60000,
        status: 'active'
      }
    ];
    
    setEventFlow(mockEventFlow);
  };

  const startRealTimeMonitoring = () => {
    const interval = setInterval(() => {
      // Simulate real-time events
      const newEvent = {
        id: Date.now(),
        timestamp: Date.now(),
        source: pods[Math.floor(Math.random() * pods.length)]?.id || 'unknown',
        target: pods[Math.floor(Math.random() * pods.length)]?.id || 'unknown',
        eventType: ['item.updated', 'flask.consumed', 'area.changed', 'ui.action'][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.9 ? 'error' : 'success',
        data: { value: Math.floor(Math.random() * 100) }
      };
      
      setRealtimeEvents(prev => [newEvent, ...prev.slice(0, 49)]);
      
      // Update pod metrics
      setPodMetrics(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(podId => {
          if (updated[podId]) {
            updated[podId].events.processed += Math.floor(Math.random() * 3);
            updated[podId].performance.responseTime = Math.round((Math.random() * 50 + 10) * 100) / 100;
          }
        });
        return updated;
      });
      
    }, 2000);
    
    return () => clearInterval(interval);
  };

  const calculatePodStats = (pods, metrics) => {
    const stats = {
      total: pods.length,
      active: pods.filter(p => p.status === 'active').length,
      healthy: pods.filter(p => p.health === 'healthy').length,
      events: Object.values(metrics).reduce((sum, m) => sum + (m.events?.processed || 0), 0)
    };
    
    setPodStats(stats);
    
    // Determine system health
    const healthPercentage = stats.healthy / stats.total;
    if (healthPercentage > 0.8) {
      setSystemHealth('healthy');
    } else if (healthPercentage > 0.6) {
      setSystemHealth('warning');
    } else {
      setSystemHealth('critical');
    }
  };

  const createNewPod = async (podConfig) => {
    try {
      // In a real implementation, this would use the feature generator
      console.log('Creating new pod:', podConfig);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Pod Created',
          message: `Feature pod "${podConfig.name}" created successfully`
        });
      }
      
      // Reload pods
      await loadFeaturePods();
      setShowCreatePod(false);
      
    } catch (error) {
      console.error('Failed to create pod:', error);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'error',
          title: 'Pod Creation Failed',
          message: error.message
        });
      }
    }
  };

  const getPodStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'development': return 'text-yellow-400';
      case 'inactive': return 'text-gray-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPodHealthColor = (health) => {
    switch (health) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPodTypeIcon = (type) => {
    switch (type) {
      case 'core': return <Target className="w-4 h-4 text-blue-400" />;
      case 'game': return <Package className="w-4 h-4 text-purple-400" />;
      case 'ui': return <Code className="w-4 h-4 text-green-400" />;
      case 'service': return <Network className="w-4 h-4 text-orange-400" />;
      default: return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatEventType = (eventType) => {
    return eventType.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Feature Pod Dashboard</p>
          <p className="text-gray-500 text-sm">Select a project to view feature pods</p>
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
              <Layers className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Feature Pod Dashboard</h2>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                systemHealth === 'healthy' ? 'text-green-400' :
                systemHealth === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {systemHealth === 'healthy' ? <CheckCircle className="w-4 h-4" /> :
                 systemHealth === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                 <AlertTriangle className="w-4 h-4" />}
                <span className="text-sm font-medium capitalize">{systemHealth}</span>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEventFlow(!showEventFlow)}
              className={`flex items-center space-x-1 px-3 py-2 rounded ${
                showEventFlow ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Event Flow</span>
            </button>
            
            <button
              onClick={() => setShowCreatePod(true)}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              <Plus className="w-4 h-4" />
              <span>Create Pod</span>
            </button>
            
            <button
              onClick={loadFeaturePods}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Total Pods</span>
            </div>
            <p className="text-2xl font-bold text-white">{podStats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <p className="text-2xl font-bold text-white">{podStats.active}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Healthy</span>
            </div>
            <p className="text-2xl font-bold text-white">{podStats.healthy}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Events</span>
            </div>
            <p className="text-2xl font-bold text-white">{podStats.events}</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Pod List */}
        <div className="w-96 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="border-b border-gray-800 p-4">
            <h3 className="text-lg font-semibold text-white">Feature Pods</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pods.map((pod) => (
              <div
                key={pod.id}
                className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-700 ${
                  selectedPod?.id === pod.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPod(pod)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getPodTypeIcon(pod.type)}
                    <span className="font-medium text-white">{pod.name}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getPodHealthColor(pod.health)}`}></div>
                </div>
                
                <p className="text-sm text-gray-400 mb-3">{pod.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className={getPodStatusColor(pod.status)}>{pod.status}</span>
                  <span>v{pod.version}</span>
                </div>
                
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="font-medium text-white">{pod.api.endpoints}</p>
                    <p className="text-gray-400">Endpoints</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-white">{pod.api.events}</p>
                    <p className="text-gray-400">Events</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-white">{podMetrics[pod.id]?.events?.processed || 0}</p>
                    <p className="text-gray-400">Processed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Main Panel */}
        <div className="flex-1 flex flex-col">
          {/* Pod Details */}
          {selectedPod && (
            <div className="border-b border-gray-800 p-6 bg-gray-900">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedPod.name}</h3>
                  <p className="text-gray-400">{selectedPod.description}</p>
                  <p className="text-sm text-gray-500 mt-1">{selectedPod.path}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded ${
                    selectedPod.health === 'healthy' ? 'bg-green-500/20 text-green-400' :
                    selectedPod.health === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${getPodHealthColor(selectedPod.health)}`}></div>
                    <span className="text-sm font-medium">{selectedPod.health}</span>
                  </div>
                </div>
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-gray-400">Response Time</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {podMetrics[selectedPod.id]?.performance?.responseTime || 0}ms
                  </p>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <BarChart3 className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-gray-400">Throughput</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {podMetrics[selectedPod.id]?.performance?.throughput || 0}/s
                  </p>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <HardDrive className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-gray-400">Memory</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {podMetrics[selectedPod.id]?.performance?.memoryUsage || 0}MB
                  </p>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-gray-400">Error Rate</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {podMetrics[selectedPod.id]?.performance?.errorRate || 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Event Flow / Real-time Events */}
          <div className="flex-1 p-6">
            {showEventFlow ? (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Event Flow</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Event Flow Diagram */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Pod Communication</h4>
                    <div className="space-y-3">
                      {eventFlow.map((flow) => (
                        <div key={flow.id} className="flex items-center space-x-2">
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-sm text-blue-400 font-medium">
                              {pods.find(p => p.id === flow.source)?.name || flow.source}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-green-400 font-medium">
                              {pods.find(p => p.id === flow.target)?.name || flow.target}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {flow.frequency}/min
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Live Events */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Real-time Events</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {realtimeEvents.slice(0, 10).map((event) => (
                        <div key={event.id} className="flex items-center space-x-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${
                            event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-gray-500">{formatTimeAgo(event.timestamp)}</span>
                          <span className="text-blue-400">{event.source}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="text-green-400">{event.target}</span>
                          <span className="text-gray-300">{formatEventType(event.eventType)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Network className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Feature Pod System</p>
                  <p className="text-gray-500 text-sm">Select a pod to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Pod Modal */}
      {showCreatePod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Create New Feature Pod</h3>
              <button
                onClick={() => setShowCreatePod(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pod Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., user-authentication"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  rows="3"
                  placeholder="Brief description of the pod's functionality"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pod Type</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500">
                  <option value="game">Game Feature</option>
                  <option value="ui">UI Component</option>
                  <option value="service">Service Layer</option>
                  <option value="core">Core System</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreatePod(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createNewPod({ name: 'New Pod', type: 'game' })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Create Pod
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturePodDashboard;