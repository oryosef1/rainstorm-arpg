// Agent Dashboard - Main container component integrating all dashboard systems
// Revolutionary AI development dashboard providing Claude Code orchestration and automation

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, Settings, Users, Play, Pause, RotateCcw, 
  AlertTriangle, CheckCircle, Clock, Zap, Brain, 
  Code, Bug, FileText, TestTube, Target, BarChart3, MessageSquare, Monitor, Database, Layers, GitBranch, Server
} from 'lucide-react';

import ClaudeInterface from './ClaudeInterface.jsx';
import WorkflowBuilder from './WorkflowBuilder.jsx';
import RealtimeMonitor from './RealtimeMonitor.jsx';
import ProjectHub from './ProjectHub.jsx';
import SessionManager from './SessionManager.jsx';
import FileExplorer from './FileExplorer.jsx';
import GamePreview from './GamePreview.jsx';
import DatabaseManager from './DatabaseManager.jsx';
import FeaturePodDashboard from './FeaturePodDashboard.jsx';
import TodoIntegration from './TodoIntegration.jsx';
import ProjectHealthMonitor from './ProjectHealthMonitor.jsx';
import GitIntegration from './GitIntegration.jsx';
import ContentGenerationDashboard from './ContentGenerationDashboard.jsx';
import WorkflowOrchestrator from './WorkflowOrchestrator.jsx';
import DeploymentManager from './DeploymentManager.jsx';

const AgentDashboard = ({ eventBus, config = {} }) => {
  const [activeTab, setActiveTab] = useState('projects');
  const [activeProject, setActiveProject] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    activeClaudes: 0,
    runningWorkflows: 0,
    completedTasks: 0,
    systemHealth: 'healthy'
  });
  const [claudeState, setClaudeState] = useState({
    sessions: [],
    isConnected: false,
    currentExecution: null
  });
  const [workflowState, setWorkflowState] = useState({
    activeWorkflows: [],
    templates: [],
    executionHistory: []
  });
  const [realtimeState, setRealtimeState] = useState({
    connections: 0,
    events: [],
    metrics: {}
  });
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  
  const dashboardRef = useRef(null);
  const statsUpdateInterval = useRef(null);
  
  // Initialize dashboard services
  useEffect(() => {
    initializeDashboard();
    setupEventListeners();
    startStatsUpdates();
    
    return () => {
      cleanup();
    };
  }, []);
  
  const initializeDashboard = async () => {
    try {
      console.log('🚀 Initializing Agent Dashboard...');
      
      // Initialize core systems through event bus
      if (eventBus) {
        await eventBus.emit('dashboard:initialize', {
          config,
          timestamp: Date.now()
        });
      }
      
      // Load dashboard state
      await loadDashboardState();
      
      // Load workflow templates
      await loadWorkflowTemplates();
      
      console.log('✅ Agent Dashboard initialized successfully');
      
    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      addSystemAlert('error', 'Dashboard initialization failed', error.message);
    }
  };
  
  const setupEventListeners = () => {
    if (!eventBus) return;
    
    // Claude execution events
    eventBus.on('claude:session-created', (data) => {
      setClaudeState(prev => ({
        ...prev,
        sessions: [...prev.sessions, data.session]
      }));
      updateStats();
    });
    
    eventBus.on('claude:execution-started', (data) => {
      setClaudeState(prev => ({
        ...prev,
        currentExecution: data.execution
      }));
    });
    
    eventBus.on('claude:execution-completed', (data) => {
      setClaudeState(prev => ({
        ...prev,
        currentExecution: null
      }));
      updateStats();
    });
    
    // Workflow events
    eventBus.on('workflow:started', (data) => {
      setWorkflowState(prev => ({
        ...prev,
        activeWorkflows: [...prev.activeWorkflows, data.workflow]
      }));
      updateStats();
    });
    
    eventBus.on('workflow:completed', (data) => {
      setWorkflowState(prev => ({
        ...prev,
        activeWorkflows: prev.activeWorkflows.filter(w => w.id !== data.workflowId),
        executionHistory: [...prev.executionHistory, data.execution]
      }));
      updateStats();
    });
    
    // Realtime system events
    eventBus.on('realtime:connection-changed', (data) => {
      setRealtimeState(prev => ({
        ...prev,
        connections: data.connections,
        isConnected: data.isConnected
      }));
    });
    
    eventBus.on('realtime:metrics-updated', (data) => {
      setRealtimeState(prev => ({
        ...prev,
        metrics: { ...prev.metrics, ...data.metrics }
      }));
    });
    
    // System health events
    eventBus.on('system:alert', (data) => {
      addSystemAlert(data.level, data.title, data.message);
    });
    
    eventBus.on('system:health-changed', (data) => {
      setDashboardStats(prev => ({
        ...prev,
        systemHealth: data.health
      }));
    });
  };
  
  const startStatsUpdates = () => {
    statsUpdateInterval.current = setInterval(updateStats, 5000);
  };
  
  const updateStats = () => {
    setDashboardStats(prev => ({
      ...prev,
      activeClaudes: claudeState.sessions.length,
      runningWorkflows: workflowState.activeWorkflows.length,
      completedTasks: workflowState.executionHistory.length,
      lastUpdated: Date.now()
    }));
  };
  
  const loadDashboardState = async () => {
    try {
      // In a real implementation, this would load from persistent storage
      const mockState = {
        claude: {
          sessions: [],
          isConnected: true
        },
        workflows: {
          activeWorkflows: [],
          executionHistory: []
        },
        realtime: {
          connections: 0,
          events: [],
          metrics: {
            cpu: 45,
            memory: 62,
            network: 23
          }
        }
      };
      
      setClaudeState(prev => ({ ...prev, ...mockState.claude }));
      setWorkflowState(prev => ({ ...prev, ...mockState.workflows }));
      setRealtimeState(prev => ({ ...prev, ...mockState.realtime }));
      
    } catch (error) {
      console.error('Failed to load dashboard state:', error);
    }
  };
  
  const loadWorkflowTemplates = async () => {
    const templates = [
      {
        name: 'Complete Feature Development',
        description: 'End-to-end feature development from requirements to testing',
        steps: [
          { type: 'claude-task', config: { specialist: 'feature-builder', task: 'Analyze requirements' } },
          { type: 'claude-task', config: { specialist: 'feature-builder', task: 'Implement core logic' } },
          { type: 'claude-task', config: { specialist: 'tester', task: 'Write comprehensive tests' } },
          { type: 'shell-command', config: { command: 'npm test' } },
          { type: 'claude-task', config: { specialist: 'code-reviewer', task: 'Review implementation' } }
        ]
      },
      {
        name: 'Bug Investigation & Fix',
        description: 'Systematic bug hunting and resolution workflow',
        steps: [
          { type: 'claude-task', config: { specialist: 'bug-hunter', task: 'Analyze bug report' } },
          { type: 'claude-task', config: { specialist: 'bug-hunter', task: 'Reproduce the issue' } },
          { type: 'claude-task', config: { specialist: 'bug-hunter', task: 'Implement fix' } },
          { type: 'shell-command', config: { command: 'npm test' } },
          { type: 'claude-task', config: { specialist: 'tester', task: 'Verify fix with tests' } }
        ]
      },
      {
        name: 'Code Quality Audit',
        description: 'Comprehensive code review and optimization',
        steps: [
          { type: 'claude-task', config: { specialist: 'code-reviewer', task: 'Analyze code quality' } },
          { type: 'claude-task', config: { specialist: 'optimizer', task: 'Identify optimization opportunities' } },
          { type: 'claude-task', config: { specialist: 'optimizer', task: 'Implement optimizations' } },
          { type: 'shell-command', config: { command: 'npm run benchmark' } }
        ]
      },
      {
        name: 'Documentation Generation',
        description: 'Generate comprehensive project documentation',
        steps: [
          { type: 'claude-task', config: { specialist: 'documenter', task: 'Analyze codebase structure' } },
          { type: 'claude-task', config: { specialist: 'documenter', task: 'Generate API documentation' } },
          { type: 'claude-task', config: { specialist: 'documenter', task: 'Create user guides' } },
          { type: 'claude-task', config: { specialist: 'documenter', task: 'Write README updates' } }
        ]
      }
    ];
    
    setWorkflowState(prev => ({ ...prev, templates }));
  };
  
  const addSystemAlert = (level, title, message) => {
    const alert = {
      id: `alert_${Date.now()}`,
      level,
      title,
      message,
      timestamp: Date.now()
    };
    
    setSystemAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    
    // Auto-remove info alerts after 5 seconds
    if (level === 'info') {
      setTimeout(() => {
        setSystemAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 5000);
    }
  };
  
  const handleClaudeExecution = async (config) => {
    try {
      addSystemAlert('info', 'Claude Execution', 'Starting Claude operation...');
      
      // Emit Claude execution event
      if (eventBus) {
        const result = await eventBus.emit('claude:execute', {
          config,
          timestamp: Date.now()
        });
        
        addSystemAlert('success', 'Claude Execution', 'Operation completed successfully');
        return result;
      }
      
      // Fallback simulation
      return simulateClaudeExecution(config);
      
    } catch (error) {
      addSystemAlert('error', 'Claude Execution Failed', error.message);
      throw error;
    }
  };
  
  const handleWorkflowExecution = async (workflow) => {
    try {
      addSystemAlert('info', 'Workflow Execution', `Starting workflow: ${workflow.workflow.name}`);
      
      // Emit workflow execution event
      if (eventBus) {
        const result = await eventBus.emit('workflow:execute', {
          workflow: workflow.workflow,
          context: workflow.context,
          timestamp: Date.now()
        });
        
        addSystemAlert('success', 'Workflow Completed', `Workflow "${workflow.workflow.name}" completed`);
        return result;
      }
      
      // Fallback simulation
      return simulateWorkflowExecution(workflow);
      
    } catch (error) {
      addSystemAlert('error', 'Workflow Failed', `Workflow "${workflow.workflow.name}" failed: ${error.message}`);
      throw error;
    }
  };
  
  const handleWorkflowSave = async (workflow) => {
    try {
      // In a real implementation, this would save to persistent storage
      addSystemAlert('success', 'Workflow Saved', `Workflow "${workflow.name}" saved successfully`);
      
      // Update local state
      setWorkflowState(prev => ({
        ...prev,
        templates: [...prev.templates, workflow]
      }));
      
    } catch (error) {
      addSystemAlert('error', 'Save Failed', `Failed to save workflow: ${error.message}`);
    }
  };
  
  const simulateClaudeExecution = async (config) => {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    return {
      response: `Simulated response for ${config.specialist || 'feature-builder'} specialist`,
      toolsUsed: ['Read', 'Edit', 'Bash'],
      duration: Math.round(2000 + Math.random() * 3000),
      timestamp: Date.now()
    };
  };
  
  const simulateWorkflowExecution = async (workflow) => {
    await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 10000));
    
    return {
      workflowId: workflow.workflow.name,
      stepsCompleted: workflow.workflow.steps.length,
      duration: Math.round(5000 + Math.random() * 10000),
      timestamp: Date.now()
    };
  };
  
  const cleanup = () => {
    if (statsUpdateInterval.current) {
      clearInterval(statsUpdateInterval.current);
    }
    
    if (eventBus) {
      eventBus.removeAllListeners();
    }
  };
  
  const tabs = [
    { id: 'projects', name: 'Project Hub', icon: <Target className="w-4 h-4" /> },
    { id: 'sessions', name: 'Session Manager', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'files', name: 'File Explorer', icon: <Code className="w-4 h-4" /> },
    { id: 'game', name: 'Game Preview', icon: <Monitor className="w-4 h-4" /> },
    { id: 'database', name: 'Database Manager', icon: <Database className="w-4 h-4" /> },
    { id: 'pods', name: 'Feature Pods', icon: <Layers className="w-4 h-4" /> },
    { id: 'todos', name: 'TODO Integration', icon: <FileText className="w-4 h-4" /> },
    { id: 'health', name: 'Project Health', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'git', name: 'Git Integration', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'content', name: 'Content Generation', icon: <Brain className="w-4 h-4" /> },
    { id: 'orchestrator', name: 'Workflow Orchestrator', icon: <Zap className="w-4 h-4" /> },
    { id: 'deployment', name: 'Deployment Manager', icon: <Server className="w-4 h-4" /> },
    { id: 'claude', name: 'Claude Interface', icon: <Brain className="w-4 h-4" /> },
    { id: 'workflows', name: 'Workflow Builder', icon: <Zap className="w-4 h-4" /> },
    { id: 'monitor', name: 'Real-time Monitor', icon: <Activity className="w-4 h-4" /> }
  ];
  
  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  const getHealthIcon = (health) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };
  
  const getAlertIcon = (level) => {
    switch (level) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };
  
  return (
    <div ref={dashboardRef} className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Agent Dashboard</h1>
                <p className="text-sm text-gray-400">Claude Code Orchestration & Automation</p>
              </div>
            </div>
            
            {/* System Health */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-800 ${getHealthColor(dashboardStats.systemHealth)}`}>
              {getHealthIcon(dashboardStats.systemHealth)}
              <span className="text-sm font-medium capitalize">{dashboardStats.systemHealth}</span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400">Active Claude:</span>
              <span className="font-medium">{dashboardStats.activeClaudes}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400">Workflows:</span>
              <span className="font-medium">{dashboardStats.runningWorkflows}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">Completed:</span>
              <span className="font-medium">{dashboardStats.completedTasks}</span>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </header>
      
      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="bg-gray-900/50 border-b border-gray-800 px-6 py-2">
          <div className="flex items-center space-x-4 overflow-x-auto">
            {systemAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center space-x-2 text-sm whitespace-nowrap">
                {getAlertIcon(alert.level)}
                <span className="text-gray-300">{alert.title}:</span>
                <span className="text-gray-400">{alert.message}</span>
              </div>
            ))}
            {systemAlerts.length > 3 && (
              <span className="text-xs text-gray-500">+{systemAlerts.length - 3} more</span>
            )}
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'projects' && (
          <ProjectHub
            eventBus={eventBus}
            onProjectSelect={setActiveProject}
            activeProject={activeProject}
          />
        )}
        
        {activeTab === 'sessions' && (
          <SessionManager
            eventBus={eventBus}
            activeProject={activeProject}
            onSessionSelect={setActiveSession}
            activeSessionId={activeSession?.id}
          />
        )}
        
        {activeTab === 'files' && (
          <FileExplorer
            eventBus={eventBus}
            activeProject={activeProject}
            activeSession={activeSession}
            onFileSelect={(file) => {
              if (eventBus) {
                eventBus.emit('file:selected', { file, activeProject, activeSession });
              }
            }}
          />
        )}
        
        {activeTab === 'game' && (
          <GamePreview
            eventBus={eventBus}
            activeProject={activeProject}
            onPerformanceChange={(metrics) => {
              // Update dashboard stats with game performance
              setDashboardStats(prev => ({
                ...prev,
                gameFPS: metrics.fps,
                gameMemory: metrics.memoryUsage
              }));
            }}
          />
        )}
        
        {activeTab === 'database' && (
          <DatabaseManager
            eventBus={eventBus}
            activeProject={activeProject}
          />
        )}
        
        {activeTab === 'pods' && (
          <FeaturePodDashboard
            eventBus={eventBus}
            activeProject={activeProject}
          />
        )}
        
        {activeTab === 'todos' && (
          <TodoIntegration
            eventBus={eventBus}
            activeProject={activeProject}
            activeSession={activeSession}
          />
        )}
        
        {activeTab === 'health' && (
          <ProjectHealthMonitor
            eventBus={eventBus}
            activeProject={activeProject}
          />
        )}
        
        {activeTab === 'git' && (
          <GitIntegration
            eventBus={eventBus}
            activeProject={activeProject}
          />
        )}
        
        {activeTab === 'content' && (
          <ContentGenerationDashboard
            eventBus={eventBus}
            activeProject={activeProject}
          />
        )}
        
        {activeTab === 'orchestrator' && (
          <WorkflowOrchestrator
            eventBus={eventBus}
            activeProject={activeProject}
            activeSession={activeSession}
          />
        )}
        
        {activeTab === 'deployment' && (
          <DeploymentManager
            eventBus={eventBus}
            activeProject={activeProject}
          />
        )}
        
        {activeTab === 'claude' && (
          <ClaudeInterface
            onExecute={handleClaudeExecution}
            activeSessions={claudeState.sessions}
            isConnected={claudeState.isConnected}
            activeProject={activeProject}
            activeSession={activeSession}
          />
        )}
        
        {activeTab === 'workflows' && (
          <WorkflowBuilder
            onExecute={handleWorkflowExecution}
            onSave={handleWorkflowSave}
            templates={workflowState.templates}
            activeProject={activeProject}
          />
        )}
        
        {activeTab === 'monitor' && (
          <RealtimeMonitor
            connections={realtimeState.connections}
            events={realtimeState.events}
            metrics={realtimeState.metrics}
            activeSessions={claudeState.sessions}
            activeWorkflows={workflowState.activeWorkflows}
            systemAlerts={systemAlerts}
            activeProject={activeProject}
          />
        )}
      </main>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Dashboard Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">System Configuration</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Auto-refresh interval</span>
                    <select className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white">
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="30">30 seconds</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Max concurrent Claudes</span>
                    <input 
                      type="number" 
                      defaultValue="10" 
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white w-20"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Enable realtime monitoring</span>
                    <input type="checkbox" defaultChecked className="text-blue-500" />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Dashboard Theme</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-3 bg-gray-900 border border-blue-500 rounded text-xs text-center">
                    Dark (Current)
                  </button>
                  <button className="p-3 bg-gray-700 border border-gray-600 rounded text-xs text-center">
                    Darker
                  </button>
                  <button className="p-3 bg-gray-700 border border-gray-600 rounded text-xs text-center">
                    High Contrast
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    addSystemAlert('success', 'Settings Saved', 'Dashboard settings updated');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;