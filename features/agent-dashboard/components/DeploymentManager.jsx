// Deployment Manager - Production deployment and DevOps management
// Comprehensive deployment pipeline with environment management and monitoring

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, Globe, Rocket, Shield, Activity, AlertTriangle, CheckCircle,
  Clock, Play, Pause, RotateCcw, Settings, Download, Upload, Eye,
  GitBranch, Package, Database, Monitor, Terminal, Code, FileText,
  TrendingUp, BarChart3, Zap, Heart, Target, Flag, Users, Lock,
  Cloud, Cpu, HardDrive, Network, Layers, Grid, Circle, Square
} from 'lucide-react';

const DeploymentManager = ({ eventBus, activeProject }) => {
  const [environments, setEnvironments] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [deploymentHistory, setDeploymentHistory] = useState([]);
  const [monitoringData, setMonitoringData] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [selectedEnvironment, setSelectedEnvironment] = useState('production');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState([]);
  const [infrastructureStatus, setInfrastructureStatus] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  // Initialize deployment management
  useEffect(() => {
    if (activeProject) {
      loadDeploymentEnvironments();
      loadDeploymentHistory();
      loadMonitoringData();
      startRealTimeMonitoring();
    }
  }, [activeProject]);

  const loadDeploymentEnvironments = async () => {
    try {
      // Load deployment environments and their status
      const environmentData = await loadEnvironmentData();
      setEnvironments(environmentData.environments);
      setPipelines(environmentData.pipelines);
      setInfrastructureStatus(environmentData.infrastructure);
      setSystemHealth(environmentData.health);
      
    } catch (error) {
      console.error('Failed to load deployment environments:', error);
    }
  };

  const loadEnvironmentData = async () => {
    // Simulate loading environment data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      environments: generateEnvironments(),
      pipelines: generatePipelines(),
      infrastructure: generateInfrastructureStatus(),
      health: generateSystemHealth()
    };
  };

  const generateEnvironments = () => {
    return [
      {
        id: 'development',
        name: 'Development',
        type: 'development',
        status: 'healthy',
        url: 'https://dev.rainstorm-arpg.com',
        branch: 'develop',
        lastDeployment: Date.now() - 3600000,
        uptime: 99.2,
        version: 'v1.5.3-dev.42',
        instances: 1,
        resources: {
          cpu: 2,
          memory: '4GB',
          storage: '50GB'
        },
        features: {
          debugMode: true,
          logLevel: 'debug',
          hotReload: true,
          monitoring: 'basic'
        },
        deployments: 156,
        avgDeployTime: '2m 34s'
      },
      {
        id: 'staging',
        name: 'Staging',
        type: 'staging',
        status: 'healthy',
        url: 'https://staging.rainstorm-arpg.com',
        branch: 'release/v1.5',
        lastDeployment: Date.now() - 7200000,
        uptime: 99.8,
        version: 'v1.5.2-rc.3',
        instances: 2,
        resources: {
          cpu: 4,
          memory: '8GB',
          storage: '100GB'
        },
        features: {
          debugMode: false,
          logLevel: 'info',
          hotReload: false,
          monitoring: 'full'
        },
        deployments: 43,
        avgDeployTime: '4m 12s'
      },
      {
        id: 'production',
        name: 'Production',
        type: 'production',
        status: 'healthy',
        url: 'https://rainstorm-arpg.com',
        branch: 'main',
        lastDeployment: Date.now() - 86400000,
        uptime: 99.95,
        version: 'v1.5.1',
        instances: 5,
        resources: {
          cpu: 16,
          memory: '32GB',
          storage: '500GB'
        },
        features: {
          debugMode: false,
          logLevel: 'error',
          hotReload: false,
          monitoring: 'enterprise'
        },
        deployments: 28,
        avgDeployTime: '8m 45s'
      }
    ];
  };

  const generatePipelines = () => {
    return [
      {
        id: 'pipeline-main',
        name: 'Main Release Pipeline',
        environment: 'production',
        status: 'idle',
        lastRun: Date.now() - 86400000,
        stages: [
          { name: 'Build', status: 'completed', duration: 120 },
          { name: 'Test', status: 'completed', duration: 180 },
          { name: 'Security Scan', status: 'completed', duration: 45 },
          { name: 'Deploy', status: 'completed', duration: 300 },
          { name: 'Health Check', status: 'completed', duration: 60 },
          { name: 'Smoke Tests', status: 'completed', duration: 90 }
        ],
        successRate: 96.8,
        avgDuration: 795
      },
      {
        id: 'pipeline-staging',
        name: 'Staging Pipeline',
        environment: 'staging',
        status: 'running',
        lastRun: Date.now() - 1800000,
        stages: [
          { name: 'Build', status: 'completed', duration: 85 },
          { name: 'Test', status: 'completed', duration: 120 },
          { name: 'Security Scan', status: 'running', duration: 0 },
          { name: 'Deploy', status: 'pending', duration: 0 },
          { name: 'Health Check', status: 'pending', duration: 0 }
        ],
        successRate: 98.2,
        avgDuration: 450
      },
      {
        id: 'pipeline-dev',
        name: 'Development Pipeline',
        environment: 'development',
        status: 'completed',
        lastRun: Date.now() - 900000,
        stages: [
          { name: 'Build', status: 'completed', duration: 65 },
          { name: 'Unit Tests', status: 'completed', duration: 90 },
          { name: 'Deploy', status: 'completed', duration: 120 }
        ],
        successRate: 99.1,
        avgDuration: 275
      }
    ];
  };

  const generateInfrastructureStatus = () => {
    return {
      servers: {
        total: 12,
        online: 11,
        offline: 1,
        maintenance: 0
      },
      services: {
        webServer: 'healthy',
        database: 'healthy',
        redis: 'healthy',
        loadBalancer: 'healthy',
        cdn: 'healthy',
        monitoring: 'warning'
      },
      resources: {
        cpu: {
          usage: 45.2,
          capacity: 128,
          alerts: 0
        },
        memory: {
          usage: 67.8,
          capacity: 256,
          alerts: 1
        },
        storage: {
          usage: 82.3,
          capacity: 2048,
          alerts: 2
        },
        network: {
          bandwidth: 156.7,
          capacity: 1000,
          alerts: 0
        }
      }
    };
  };

  const generateSystemHealth = () => {
    return {
      overall: 'healthy',
      score: 94.2,
      components: {
        application: { status: 'healthy', score: 96.1 },
        database: { status: 'healthy', score: 93.8 },
        infrastructure: { status: 'healthy', score: 92.5 },
        security: { status: 'warning', score: 87.3 },
        performance: { status: 'healthy', score: 95.7 }
      },
      alerts: [
        {
          id: 'alert-1',
          type: 'warning',
          title: 'High Memory Usage',
          description: 'Staging environment memory usage above 85%',
          timestamp: Date.now() - 1800000,
          environment: 'staging'
        },
        {
          id: 'alert-2',
          type: 'info',
          title: 'Deployment Completed',
          description: 'Development environment updated to v1.5.3-dev.42',
          timestamp: Date.now() - 3600000,
          environment: 'development'
        }
      ]
    };
  };

  const loadDeploymentHistory = async () => {
    // Generate deployment history
    const history = Array.from({ length: 20 }, (_, i) => ({
      id: `deploy-${Date.now() - i * 3600000}`,
      environment: ['production', 'staging', 'development'][Math.floor(Math.random() * 3)],
      version: `v1.5.${Math.floor(Math.random() * 10)}`,
      branch: ['main', 'release/v1.5', 'develop'][Math.floor(Math.random() * 3)],
      status: ['success', 'success', 'success', 'failed', 'rollback'][Math.floor(Math.random() * 5)],
      timestamp: Date.now() - i * 3600000 * Math.random() * 24,
      duration: Math.floor(Math.random() * 600) + 120,
      deployedBy: ['Claude', 'Developer', 'Auto-Deploy'][Math.floor(Math.random() * 3)],
      changes: Math.floor(Math.random() * 20) + 5,
      rollback: Math.random() > 0.9
    }));
    
    setDeploymentHistory(history);
  };

  const loadMonitoringData = async () => {
    // Generate monitoring metrics
    const metrics = {
      responseTime: {
        current: 156.7,
        avg24h: 142.3,
        p95: 287.5,
        p99: 456.2
      },
      throughput: {
        current: 2847,
        avg24h: 2634,
        peak24h: 3892
      },
      errorRate: {
        current: 0.12,
        avg24h: 0.08,
        peak24h: 0.34
      },
      availability: {
        current: 99.95,
        monthly: 99.92,
        sla: 99.9
      }
    };
    
    setPerformanceMetrics(metrics);
  };

  const startRealTimeMonitoring = () => {
    const interval = setInterval(() => {
      // Update real-time metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        responseTime: {
          ...prev.responseTime,
          current: Math.max(50, Math.min(500, prev.responseTime.current + (Math.random() - 0.5) * 20))
        },
        throughput: {
          ...prev.throughput,
          current: Math.max(1000, Math.min(5000, prev.throughput.current + (Math.random() - 0.5) * 200))
        },
        errorRate: {
          ...prev.errorRate,
          current: Math.max(0, Math.min(2, prev.errorRate.current + (Math.random() - 0.5) * 0.1))
        }
      }));
      
      // Update infrastructure resources
      setInfrastructureStatus(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          cpu: {
            ...prev.resources.cpu,
            usage: Math.max(20, Math.min(80, prev.resources.cpu.usage + (Math.random() - 0.5) * 5))
          },
          memory: {
            ...prev.resources.memory,
            usage: Math.max(40, Math.min(90, prev.resources.memory.usage + (Math.random() - 0.5) * 3))
          }
        }
      }));
      
    }, 3000);
    
    return () => clearInterval(interval);
  };

  const deployToEnvironment = async (environmentId, version) => {
    try {
      setIsDeploying(true);
      
      const environment = environments.find(env => env.id === environmentId);
      if (!environment) return;
      
      // Create deployment logs
      const logs = [
        `[${new Date().toISOString()}] Starting deployment to ${environment.name}`,
        `[${new Date().toISOString()}] Building application version ${version}`,
        `[${new Date().toISOString()}] Running tests...`,
        `[${new Date().toISOString()}] Tests passed successfully`,
        `[${new Date().toISOString()}] Deploying to ${environment.instances} instance(s)`,
        `[${new Date().toISOString()}] Updating load balancer configuration`,
        `[${new Date().toISOString()}] Running health checks...`,
        `[${new Date().toISOString()}] Deployment completed successfully`
      ];
      
      // Simulate deployment progress
      for (let i = 0; i < logs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDeploymentLogs(prev => [...prev, logs[i]]);
      }
      
      // Update environment with new deployment
      setEnvironments(prev => prev.map(env => 
        env.id === environmentId 
          ? { 
              ...env, 
              version, 
              lastDeployment: Date.now(),
              deployments: env.deployments + 1
            }
          : env
      ));
      
      // Add to deployment history
      const newDeployment = {
        id: `deploy-${Date.now()}`,
        environment: environmentId,
        version,
        branch: environment.branch,
        status: 'success',
        timestamp: Date.now(),
        duration: 480,
        deployedBy: 'Claude',
        changes: 12,
        rollback: false
      };
      
      setDeploymentHistory(prev => [newDeployment, ...prev]);
      
      if (eventBus) {
        eventBus.emit('deployment:completed', { environment: environmentId, version });
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Deployment Successful',
          message: `Successfully deployed ${version} to ${environment.name}`
        });
      }
      
    } catch (error) {
      console.error('Deployment failed:', error);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'error',
          title: 'Deployment Failed',
          message: error.message
        });
      }
    } finally {
      setIsDeploying(false);
      setDeploymentLogs([]);
    }
  };

  const rollbackDeployment = async (environmentId) => {
    try {
      setIsDeploying(true);
      
      const environment = environments.find(env => env.id === environmentId);
      if (!environment) return;
      
      // Simulate rollback
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'warning',
          title: 'Rollback Initiated',
          message: `Rolling back ${environment.name} to previous version`
        });
      }
      
    } catch (error) {
      console.error('Rollback failed:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const getEnvironmentColor = (type) => {
    switch (type) {
      case 'production': return 'text-red-400';
      case 'staging': return 'text-yellow-400';
      case 'development': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-blue-400';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      case 'running': return <Clock className="w-4 h-4 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    return 'Just now';
  };

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Deployment Manager</p>
          <p className="text-gray-500 text-sm">Select a project to manage deployments</p>
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
              <Server className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Deployment Manager</h2>
              {isDeploying && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-blue-600/20 rounded">
                  <Rocket className="w-3 h-3 text-blue-400 animate-pulse" />
                  <span className="text-xs text-blue-400">Deploying...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            >
              {environments.map((env) => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => deployToEnvironment(selectedEnvironment, 'v1.5.4')}
              disabled={isDeploying}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
            >
              <Rocket className="w-4 h-4" />
              <span>Deploy</span>
            </button>
            
            <button
              onClick={() => rollbackDeployment(selectedEnvironment)}
              disabled={isDeploying}
              className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rollback</span>
            </button>
          </div>
        </div>
        
        {/* Environment Cards */}
        <div className="grid grid-cols-3 gap-4">
          {environments.map((env) => (
            <div key={env.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={getEnvironmentColor(env.type)}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{env.name}</h3>
                    <p className="text-xs text-gray-400">{env.version}</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1 ${getStatusColor(env.status)}`}>
                  {getStatusIcon(env.status)}
                  <span className="text-sm capitalize">{env.status}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-white">{env.uptime}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Instances</span>
                  <span className="text-white">{env.instances}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Deploy</span>
                  <span className="text-white">{formatTimeAgo(env.lastDeployment)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* System Health */}
          <div className="border-b border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Overall Score</span>
                <span className={`text-lg font-bold ${getStatusColor(systemHealth.overall)}`}>
                  {systemHealth.score}%
                </span>
              </div>
              
              {Object.entries(systemHealth.components || {}).map(([key, component]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 capitalize">{key}</span>
                  <div className={`flex items-center space-x-1 ${getStatusColor(component.status)}`}>
                    {getStatusIcon(component.status)}
                    <span className="text-xs">{component.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="border-b border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Response Time</span>
                <span className="text-xs text-white">{performanceMetrics.responseTime?.current?.toFixed(1)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Throughput</span>
                <span className="text-xs text-white">{performanceMetrics.throughput?.current?.toLocaleString()}/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Error Rate</span>
                <span className="text-xs text-white">{performanceMetrics.errorRate?.current?.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Availability</span>
                <span className="text-xs text-white">{performanceMetrics.availability?.current}%</span>
              </div>
            </div>
          </div>
          
          {/* Resource Usage */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Resources</h3>
            <div className="space-y-4">
              {Object.entries(infrastructureStatus.resources || {}).map(([key, resource]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 capitalize">{key}</span>
                    <span className="text-white">{resource.usage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        resource.usage > 80 ? 'bg-red-500' :
                        resource.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${resource.usage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Active Deployments */}
            {deploymentLogs.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Active Deployment</h3>
                <div className="bg-black rounded p-3 font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
                  {deploymentLogs.map((log, index) => (
                    <div key={index} className="text-green-400">{log}</div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Deployment Pipelines */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Deployment Pipelines</h3>
              <div className="space-y-4">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-white">{pipeline.name}</h4>
                        <p className="text-sm text-gray-400">{pipeline.environment}</p>
                      </div>
                      <div className={`flex items-center space-x-1 ${getStatusColor(pipeline.status)}`}>
                        {getStatusIcon(pipeline.status)}
                        <span className="text-sm capitalize">{pipeline.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      {pipeline.stages.map((stage, index) => (
                        <div key={stage.name} className="flex items-center space-x-2">
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                            stage.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            stage.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                            stage.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {getStatusIcon(stage.status)}
                            <span>{stage.name}</span>
                          </div>
                          {index < pipeline.stages.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Success Rate: {pipeline.successRate}%</span>
                      <span>Avg Duration: {formatDuration(pipeline.avgDuration)}</span>
                      <span>Last Run: {formatTimeAgo(pipeline.lastRun)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Deployment History */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Deployment History</h3>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Version</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Environment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Deployed By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {deploymentHistory.slice(0, 10).map((deployment) => (
                        <tr key={deployment.id} className="hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-sm text-white font-mono">{deployment.version}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`capitalize ${getEnvironmentColor(deployment.environment)}`}>
                              {deployment.environment}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className={`flex items-center space-x-1 ${getStatusColor(deployment.status)}`}>
                              {getStatusIcon(deployment.status)}
                              <span className="capitalize">{deployment.status}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">{formatDuration(deployment.duration)}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{deployment.deployedBy}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{formatTimeAgo(deployment.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentManager;