// Realtime Monitor Component - Live dashboard monitoring and system metrics
// Provides real-time visibility into Claude operations, workflows, and system health

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, Cpu, HardDrive, Network, Clock, Users, 
  Zap, Brain, AlertTriangle, CheckCircle, Info,
  TrendingUp, TrendingDown, Minus, Eye, EyeOff,
  RefreshCw, Pause, Play, Download, Filter
} from 'lucide-react';

const RealtimeMonitor = ({ 
  connections = 0, 
  events = [], 
  metrics = {}, 
  activeSessions = [], 
  activeWorkflows = [],
  systemAlerts = []
}) => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [visiblePanels, setVisiblePanels] = useState({
    metrics: true,
    sessions: true,
    workflows: true,
    events: true,
    alerts: true
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  
  const metricsRef = useRef(null);
  const eventsRef = useRef(null);
  const updateInterval = useRef(null);
  
  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    
    return () => stopMonitoring();
  }, [isMonitoring]);
  
  useEffect(() => {
    // Update metrics history
    if (Object.keys(metrics).length > 0) {
      setMetricsHistory(prev => {
        const newEntry = {
          timestamp: Date.now(),
          ...metrics
        };
        
        // Keep last 100 entries (5 minutes at 3-second intervals)
        const updated = [...prev, newEntry].slice(-100);
        return updated;
      });
    }
  }, [metrics]);
  
  useEffect(() => {
    // Filter events based on selected filter
    const filtered = events.filter(event => {
      if (eventFilter === 'all') return true;
      if (eventFilter === 'claude' && event.type?.includes('claude')) return true;
      if (eventFilter === 'workflow' && event.type?.includes('workflow')) return true;
      if (eventFilter === 'system' && event.type?.includes('system')) return true;
      if (eventFilter === 'error' && event.level === 'error') return true;
      return false;
    });
    
    setFilteredEvents(filtered);
  }, [events, eventFilter]);
  
  const startMonitoring = () => {
    console.log('🎯 Starting real-time monitoring...');
    
    updateInterval.current = setInterval(() => {
      // In a real implementation, this would collect actual system metrics
      generateMockMetrics();
    }, 3000);
  };
  
  const stopMonitoring = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
  };
  
  const generateMockMetrics = () => {
    // Simulate realistic system metrics
    const baseMetrics = {
      cpu: 30 + Math.random() * 40,
      memory: 40 + Math.random() * 30,
      network: 10 + Math.random() * 50,
      disk: 60 + Math.random() * 20,
      activeConnections: connections + Math.floor(Math.random() * 5),
      responseTime: 100 + Math.random() * 200,
      throughput: 50 + Math.random() * 100
    };
    
    // Trigger metrics update (in real implementation, this would come from the realtime system)
    // For demo purposes, we update internal state
    setMetricsHistory(prev => {
      const newEntry = {
        timestamp: Date.now(),
        ...baseMetrics
      };
      return [...prev, newEntry].slice(-100);
    });
  };
  
  const togglePanel = (panelName) => {
    setVisiblePanels(prev => ({
      ...prev,
      [panelName]: !prev[panelName]
    }));
  };
  
  const getMetricTrend = (metricName) => {
    if (metricsHistory.length < 2) return 'stable';
    
    const current = metricsHistory[metricsHistory.length - 1][metricName] || 0;
    const previous = metricsHistory[metricsHistory.length - 2][metricName] || 0;
    const change = current - previous;
    
    if (Math.abs(change) < 1) return 'stable';
    return change > 0 ? 'up' : 'down';
  };
  
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getMetricColor = (value, type) => {
    if (type === 'cpu' || type === 'memory') {
      if (value > 80) return 'text-red-400';
      if (value > 60) return 'text-yellow-400';
      return 'text-green-400';
    }
    return 'text-blue-400';
  };
  
  const formatMetricValue = (value, type) => {
    if (type === 'cpu' || type === 'memory' || type === 'disk') {
      return `${Math.round(value)}%`;
    }
    if (type === 'network') {
      return `${Math.round(value)} Mbps`;
    }
    if (type === 'responseTime') {
      return `${Math.round(value)}ms`;
    }
    if (type === 'throughput') {
      return `${Math.round(value)} req/s`;
    }
    return Math.round(value);
  };
  
  const getEventIcon = (event) => {
    if (event.type?.includes('claude')) return <Brain className="w-4 h-4 text-blue-400" />;
    if (event.type?.includes('workflow')) return <Zap className="w-4 h-4 text-purple-400" />;
    if (event.level === 'error') return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (event.level === 'success') return <CheckCircle className="w-4 h-4 text-green-400" />;
    return <Info className="w-4 h-4 text-gray-400" />;
  };
  
  const getSessionStatusColor = (session) => {
    if (session.status === 'active') return 'bg-green-500';
    if (session.status === 'executing') return 'bg-blue-500';
    if (session.status === 'error') return 'bg-red-500';
    return 'bg-gray-500';
  };
  
  const getWorkflowStatusColor = (workflow) => {
    if (workflow.status === 'running') return 'bg-purple-500';
    if (workflow.status === 'completed') return 'bg-green-500';
    if (workflow.status === 'failed') return 'bg-red-500';
    return 'bg-gray-500';
  };
  
  const exportData = () => {
    const exportData = {
      timestamp: Date.now(),
      metricsHistory,
      events: filteredEvents,
      activeSessions,
      activeWorkflows,
      systemAlerts
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };
  
  const currentMetrics = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1] : {};
  
  return (
    <div className="h-full bg-gray-900 p-6 overflow-auto">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">Real-time Monitor</h2>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isMonitoring ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium">{isMonitoring ? 'Live' : 'Paused'}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-white"
          >
            <option value="all">All Events</option>
            <option value="claude">Claude Events</option>
            <option value="workflow">Workflow Events</option>
            <option value="system">System Events</option>
            <option value="error">Errors Only</option>
          </select>
          
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-2 rounded transition-colors ${
              autoScroll ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}
            title="Auto-scroll events"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            onClick={exportData}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            title="Export data"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
              isMonitoring 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isMonitoring ? 'Pause' : 'Resume'}</span>
          </button>
        </div>
      </div>
      
      {/* Metrics Grid */}
      {visiblePanels.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* System Metrics */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <h3 className="font-medium text-white">CPU Usage</h3>
              </div>
              {getTrendIcon(getMetricTrend('cpu'))}
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(currentMetrics.cpu, 'cpu')}`}>
              {formatMetricValue(currentMetrics.cpu || 0, 'cpu')}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-green-400" />
                <h3 className="font-medium text-white">Memory</h3>
              </div>
              {getTrendIcon(getMetricTrend('memory'))}
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(currentMetrics.memory, 'memory')}`}>
              {formatMetricValue(currentMetrics.memory || 0, 'memory')}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Network className="w-5 h-5 text-purple-400" />
                <h3 className="font-medium text-white">Network</h3>
              </div>
              {getTrendIcon(getMetricTrend('network'))}
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {formatMetricValue(currentMetrics.network || 0, 'network')}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <h3 className="font-medium text-white">Response Time</h3>
              </div>
              {getTrendIcon(getMetricTrend('responseTime'))}
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {formatMetricValue(currentMetrics.responseTime || 0, 'responseTime')}
            </div>
          </div>
        </div>
      )}
      
      {/* Sessions and Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Active Sessions */}
        {visiblePanels.sessions && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white flex items-center space-x-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <span>Active Claude Sessions ({activeSessions.length})</span>
              </h3>
              <button
                onClick={() => togglePanel('sessions')}
                className="text-gray-400 hover:text-white"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeSessions.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active Claude sessions</p>
                </div>
              ) : (
                activeSessions.map((session, index) => (
                  <div key={session.id || index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getSessionStatusColor(session)}`} />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {session.specialist || 'Claude Session'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {session.profile || 'Default Profile'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {session.operationCount || 0} ops
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Active Workflows */}
        {visiblePanels.workflows && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span>Active Workflows ({activeWorkflows.length})</span>
              </h3>
              <button
                onClick={() => togglePanel('workflows')}
                className="text-gray-400 hover:text-white"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeWorkflows.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active workflows</p>
                </div>
              ) : (
                activeWorkflows.map((workflow, index) => (
                  <div key={workflow.id || index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getWorkflowStatusColor(workflow)}`} />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {workflow.name || 'Workflow'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {workflow.steps?.length || 0} steps
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {workflow.progress || 0}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Events and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        {visiblePanels.events && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-400" />
                <span>Recent Events ({filteredEvents.length})</span>
              </h3>
              <button
                onClick={() => togglePanel('events')}
                className="text-gray-400 hover:text-white"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
            
            <div ref={eventsRef} className="space-y-2 max-h-80 overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No events to display</p>
                </div>
              ) : (
                filteredEvents.slice(-20).reverse().map((event, index) => (
                  <div key={event.id || index} className="flex items-start space-x-3 p-2 hover:bg-gray-700 rounded">
                    {getEventIcon(event)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">{event.title || event.type}</div>
                      <div className="text-xs text-gray-400">{event.message}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* System Alerts */}
        {visiblePanels.alerts && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span>System Alerts ({systemAlerts.length})</span>
              </h3>
              <button
                onClick={() => togglePanel('alerts')}
                className="text-gray-400 hover:text-white"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {systemAlerts.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No system alerts</p>
                </div>
              ) : (
                systemAlerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded border-l-4 ${
                    alert.level === 'error' ? 'bg-red-900/20 border-red-500' :
                    alert.level === 'warning' ? 'bg-yellow-900/20 border-yellow-500' :
                    alert.level === 'success' ? 'bg-green-900/20 border-green-500' :
                    'bg-blue-900/20 border-blue-500'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {getEventIcon(alert)}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{alert.title}</div>
                        <div className="text-xs text-gray-400">{alert.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeMonitor;