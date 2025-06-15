// Project Health Monitor - Real-time project health monitoring and metrics
// Comprehensive project analysis with intelligent recommendations and alerts

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown,
  Shield, Zap, Target, FileText, Code, Bug, TestTube, Settings,
  BarChart3, PieChart, LineChart, Gauge, Heart, Brain, Eye,
  GitBranch, Package, Database, Server, Cpu, HardDrive,
  Users, Calendar, Award, Flag, Layers, Network, Terminal
} from 'lucide-react';

const ProjectHealthMonitor = ({ eventBus, activeProject }) => {
  const [healthData, setHealthData] = useState(null);
  const [healthScore, setHealthScore] = useState(0);
  const [healthTrends, setHealthTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');

  // Initialize health monitoring
  useEffect(() => {
    if (activeProject) {
      analyzeProjectHealth();
      startRealTimeMonitoring();
    }
  }, [activeProject, timeRange]);

  const analyzeProjectHealth = async () => {
    try {
      setIsAnalyzing(true);
      
      // Simulate comprehensive project analysis
      const analysis = await performHealthAnalysis();
      setHealthData(analysis.data);
      setHealthScore(analysis.score);
      setHealthTrends(analysis.trends);
      setAlerts(analysis.alerts);
      setRecommendations(analysis.recommendations);
      setMetrics(analysis.metrics);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: analysis.score > 80 ? 'success' : analysis.score > 60 ? 'warning' : 'error',
          title: 'Health Analysis Complete',
          message: `Project health score: ${analysis.score}/100`
        });
      }
      
    } catch (error) {
      console.error('Health analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performHealthAnalysis = async () => {
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock comprehensive health analysis
    const codeQuality = Math.floor(Math.random() * 30) + 70;
    const testCoverage = Math.floor(Math.random() * 40) + 60;
    const performance = Math.floor(Math.random() * 25) + 75;
    const security = Math.floor(Math.random() * 20) + 80;
    const documentation = Math.floor(Math.random() * 50) + 50;
    const dependencies = Math.floor(Math.random() * 30) + 70;
    
    const overallScore = Math.round((codeQuality + testCoverage + performance + security + documentation + dependencies) / 6);
    
    return {
      score: overallScore,
      data: {
        codeQuality,
        testCoverage,
        performance,
        security,
        documentation,
        dependencies,
        buildHealth: Math.floor(Math.random() * 20) + 80,
        deploymentHealth: Math.floor(Math.random() * 25) + 75
      },
      trends: generateHealthTrends(),
      alerts: generateHealthAlerts(overallScore),
      recommendations: generateRecommendations(overallScore),
      metrics: generateDetailedMetrics()
    };
  };

  const generateHealthTrends = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
      score: Math.floor(Math.random() * 30) + 70,
      codeQuality: Math.floor(Math.random() * 30) + 70,
      performance: Math.floor(Math.random() * 25) + 75,
      security: Math.floor(Math.random() * 20) + 80
    }));
  };

  const generateHealthAlerts = (score) => {
    const alerts = [];
    
    if (score < 70) {
      alerts.push({
        id: 'low-health',
        type: 'critical',
        title: 'Low Project Health Score',
        message: 'Project health has fallen below acceptable levels',
        action: 'Run comprehensive analysis and address critical issues',
        timestamp: Date.now()
      });
    }
    
    if (Math.random() > 0.7) {
      alerts.push({
        id: 'test-coverage',
        type: 'warning',
        title: 'Test Coverage Below Target',
        message: 'Test coverage is 65%, target is 80%',
        action: 'Add tests for uncovered code paths',
        timestamp: Date.now() - 1800000
      });
    }
    
    if (Math.random() > 0.8) {
      alerts.push({
        id: 'security-vuln',
        type: 'error',
        title: 'Security Vulnerabilities Detected',
        message: '3 medium severity vulnerabilities found in dependencies',
        action: 'Update vulnerable packages and review security practices',
        timestamp: Date.now() - 3600000
      });
    }
    
    if (Math.random() > 0.6) {
      alerts.push({
        id: 'performance-regression',
        type: 'warning',
        title: 'Performance Regression Detected',
        message: 'Game load time increased by 15% since last build',
        action: 'Profile and optimize performance bottlenecks',
        timestamp: Date.now() - 7200000
      });
    }
    
    return alerts;
  };

  const generateRecommendations = (score) => {
    const recommendations = [];
    
    recommendations.push({
      id: 'code-review',
      priority: 'high',
      category: 'code-quality',
      title: 'Implement Automated Code Review',
      description: 'Set up automated code review with Claude to catch issues early',
      effort: 'Medium',
      impact: 'High',
      timeEstimate: '2-3 hours'
    });
    
    if (score < 80) {
      recommendations.push({
        id: 'test-improvement',
        priority: 'high',
        category: 'testing',
        title: 'Increase Test Coverage',
        description: 'Add unit tests for core game mechanics and inventory system',
        effort: 'High',
        impact: 'High',
        timeEstimate: '4-6 hours'
      });
    }
    
    recommendations.push({
      id: 'performance-optimization',
      priority: 'medium',
      category: 'performance',
      title: 'Optimize Asset Loading',
      description: 'Implement lazy loading for game assets to improve startup time',
      effort: 'Medium',
      impact: 'Medium',
      timeEstimate: '3-4 hours'
    });
    
    recommendations.push({
      id: 'documentation-update',
      priority: 'low',
      category: 'documentation',
      title: 'Update API Documentation',
      description: 'Generate comprehensive API docs for all feature pods',
      effort: 'Low',
      impact: 'Medium',
      timeEstimate: '1-2 hours'
    });
    
    return recommendations;
  };

  const generateDetailedMetrics = () => {
    return {
      codebase: {
        linesOfCode: 15420,
        files: 234,
        functions: 1580,
        classes: 89,
        complexity: 6.7,
        duplication: 3.2
      },
      testing: {
        totalTests: 456,
        passRate: 97.8,
        coverage: 78.4,
        avgExecutionTime: 245,
        flakyTests: 3
      },
      performance: {
        buildTime: 23.5,
        bundleSize: 2.4,
        loadTime: 1.8,
        memoryUsage: 45.2,
        cpuUsage: 12.8
      },
      security: {
        vulnerabilities: 2,
        securityScore: 88,
        lastScan: Date.now() - 86400000,
        dependencies: 127,
        outdatedDeps: 8
      },
      git: {
        commits: 1247,
        branches: 12,
        contributors: 3,
        lastCommit: Date.now() - 3600000,
        pullRequests: 45
      }
    };
  };

  const startRealTimeMonitoring = () => {
    const interval = setInterval(() => {
      // Update metrics in real-time
      setMetrics(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          memoryUsage: Math.max(20, Math.min(80, prev.performance?.memoryUsage + (Math.random() - 0.5) * 5)),
          cpuUsage: Math.max(5, Math.min(50, prev.performance?.cpuUsage + (Math.random() - 0.5) * 3))
        }
      }));
      
      // Update health score slightly
      setHealthScore(prev => Math.max(60, Math.min(95, prev + (Math.random() - 0.5) * 2)));
      
    }, 5000);
    
    return () => clearInterval(interval);
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthBgColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <CheckCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Project Health Monitor</p>
          <p className="text-gray-500 text-sm">Select a project to monitor health metrics</p>
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
              <Heart className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Project Health Monitor</h2>
              {healthScore > 0 && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getHealthColor(healthScore)}`}>
                  <Gauge className="w-4 h-4" />
                  <span className="text-sm font-medium">{healthScore}/100</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <button
              onClick={analyzeProjectHealth}
              disabled={isAnalyzing}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
            >
              {isAnalyzing ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              <span>Analyze</span>
            </button>
          </div>
        </div>
        
        {/* Health Overview Cards */}
        {healthData && (
          <div className="grid grid-cols-8 gap-3">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Code className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-gray-400">Code Quality</span>
              </div>
              <p className="text-lg font-bold text-white">{healthData.codeQuality}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <TestTube className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-400">Test Coverage</span>
              </div>
              <p className="text-lg font-bold text-white">{healthData.testCoverage}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-gray-400">Performance</span>
              </div>
              <p className="text-lg font-bold text-white">{healthData.performance}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Shield className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-gray-400">Security</span>
              </div>
              <p className="text-lg font-bold text-white">{healthData.security}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-3 h-3 text-indigo-400" />
                <span className="text-xs text-gray-400">Documentation</span>
              </div>
              <p className="text-lg font-bold text-white">{healthData.documentation}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Package className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-gray-400">Dependencies</span>
              </div>
              <p className="text-lg font-bold text-white">{healthData.dependencies}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <GitBranch className="w-3 h-3 text-pink-400" />
                <span className="text-xs text-gray-400">Build Health</span>
              </div>
              <p className="text-lg font-bold text-white">{healthData.buildHealth}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Server className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-gray-400">Deployment</span>
              </div>
              <p className="text-lg font-bold text-white">{healthData.deploymentHealth}%</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
          <div className="space-y-2">
            {[
              { id: 'overview', name: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'alerts', name: 'Alerts', icon: <AlertTriangle className="w-4 h-4" /> },
              { id: 'recommendations', name: 'Recommendations', icon: <Brain className="w-4 h-4" /> },
              { id: 'metrics', name: 'Detailed Metrics', icon: <Gauge className="w-4 h-4" /> },
              { id: 'trends', name: 'Health Trends', icon: <TrendingUp className="w-4 h-4" /> }
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedCategory === 'overview' && healthData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Health Score Overview</h3>
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 rounded-full border-8 border-gray-700"></div>
                      <div
                        className={`absolute inset-0 rounded-full border-8 border-t-transparent ${getHealthBgColor(healthScore)}`}
                        style={{
                          transform: `rotate(${(healthScore / 100) * 360}deg)`,
                          transition: 'transform 1s ease-in-out'
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${getHealthColor(healthScore)}`}>
                            {healthScore}
                          </div>
                          <div className="text-sm text-gray-400">Health Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Code Quality</span>
                        <span className="text-sm font-medium text-white">{healthData.codeQuality}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${healthData.codeQuality}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Test Coverage</span>
                        <span className="text-sm font-medium text-white">{healthData.testCoverage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${healthData.testCoverage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Performance</span>
                        <span className="text-sm font-medium text-white">{healthData.performance}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${healthData.performance}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Security</span>
                        <span className="text-sm font-medium text-white">{healthData.security}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${healthData.security}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedCategory === 'alerts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Health Alerts</h3>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="bg-gray-900 rounded-lg p-4 border-l-4 border-red-500">
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">{alert.title}</h4>
                            <span className="text-xs text-gray-400">{formatTimeAgo(alert.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{alert.message}</p>
                          <p className="text-xs text-blue-400">{alert.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No active alerts</p>
                  <p className="text-gray-500 text-sm">Your project health is looking good!</p>
                </div>
              )}
            </div>
          )}
          
          {selectedCategory === 'recommendations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Health Recommendations</h3>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-white">{rec.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                            {rec.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{rec.description}</p>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded">
                        Apply
                      </button>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Effort: {rec.effort}</span>
                      <span>Impact: {rec.impact}</span>
                      <span>Time: {rec.timeEstimate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedCategory === 'metrics' && metrics.codebase && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Detailed Metrics</h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Codebase Metrics */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
                    <Code className="w-4 h-4 text-blue-400" />
                    <span>Codebase</span>
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lines of Code</span>
                      <span className="text-white font-medium">{metrics.codebase.linesOfCode.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Files</span>
                      <span className="text-white font-medium">{metrics.codebase.files}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Functions</span>
                      <span className="text-white font-medium">{metrics.codebase.functions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Complexity</span>
                      <span className="text-white font-medium">{metrics.codebase.complexity}</span>
                    </div>
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>Performance</span>
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Build Time</span>
                      <span className="text-white font-medium">{metrics.performance.buildTime}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bundle Size</span>
                      <span className="text-white font-medium">{metrics.performance.bundleSize}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Load Time</span>
                      <span className="text-white font-medium">{metrics.performance.loadTime}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Memory Usage</span>
                      <span className="text-white font-medium">{metrics.performance.memoryUsage.toFixed(1)}MB</span>
                    </div>
                  </div>
                </div>
                
                {/* Testing Metrics */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
                    <TestTube className="w-4 h-4 text-green-400" />
                    <span>Testing</span>
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Tests</span>
                      <span className="text-white font-medium">{metrics.testing.totalTests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pass Rate</span>
                      <span className="text-white font-medium">{metrics.testing.passRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coverage</span>
                      <span className="text-white font-medium">{metrics.testing.coverage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Execution</span>
                      <span className="text-white font-medium">{metrics.testing.avgExecutionTime}ms</span>
                    </div>
                  </div>
                </div>
                
                {/* Security Metrics */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>Security</span>
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vulnerabilities</span>
                      <span className="text-white font-medium">{metrics.security.vulnerabilities}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Security Score</span>
                      <span className="text-white font-medium">{metrics.security.securityScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dependencies</span>
                      <span className="text-white font-medium">{metrics.security.dependencies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Outdated</span>
                      <span className="text-white font-medium">{metrics.security.outdatedDeps}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedCategory === 'trends' && healthTrends.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Health Trends</h3>
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="h-64 flex items-end justify-between space-x-1">
                  {healthTrends.slice(-12).map((trend, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div
                        className={`w-4 ${getHealthBgColor(trend.score)} rounded-t`}
                        style={{ height: `${(trend.score / 100) * 200}px` }}
                      ></div>
                      <span className="text-xs text-gray-400 rotate-45 origin-bottom-left">
                        {new Date(trend.time).getHours()}:00
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHealthMonitor;