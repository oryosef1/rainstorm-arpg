// Workflow Orchestrator - Intelligent workflow orchestration with adaptive logic
// Advanced AI-powered workflow automation with dynamic adaptation and learning

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, Brain, Network, Target, Play, Pause, RotateCcw, Settings,
  CheckCircle, AlertTriangle, Clock, TrendingUp, BarChart3, Activity,
  Plus, Edit, Trash2, Copy, Download, Upload, Eye, EyeOff,
  GitBranch, Code, TestTube, FileText, Shield, Package, Users,
  ArrowRight, Circle, Square, Triangle, Star, Heart, Flag,
  Layers, Workflow, Cpu, HardDrive, Database, Server, Terminal
} from 'lucide-react';

const WorkflowOrchestrator = ({ eventBus, activeProject, activeSession }) => {
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [adaptiveRules, setAdaptiveRules] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [learningInsights, setLearningInsights] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [orchestrationStats, setOrchestrationStats] = useState({});
  const [contextAnalysis, setContextAnalysis] = useState(null);

  // Initialize workflow orchestration system
  useEffect(() => {
    if (activeProject) {
      loadWorkflowOrchestration();
      analyzeProjectContext();
      startAdaptiveLearning();
    }
  }, [activeProject]);

  const loadWorkflowOrchestration = async () => {
    try {
      // Load comprehensive workflow orchestration data
      const orchestrationData = await loadOrchestrationData();
      setWorkflows(orchestrationData.workflows);
      setActiveWorkflows(orchestrationData.active);
      setWorkflowTemplates(orchestrationData.templates);
      setAdaptiveRules(orchestrationData.rules);
      setPerformanceMetrics(orchestrationData.metrics);
      setLearningInsights(orchestrationData.insights);
      setOrchestrationStats(orchestrationData.stats);
      
    } catch (error) {
      console.error('Failed to load workflow orchestration:', error);
    }
  };

  const loadOrchestrationData = async () => {
    // Simulate loading orchestration data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      workflows: generateIntelligentWorkflows(),
      active: generateActiveWorkflows(),
      templates: generateAdaptiveTemplates(),
      rules: generateAdaptiveRules(),
      metrics: generatePerformanceMetrics(),
      insights: generateLearningInsights(),
      stats: generateOrchestrationStats()
    };
  };

  const generateIntelligentWorkflows = () => {
    return [
      {
        id: 'wf-intelligent-feature',
        name: 'Intelligent Feature Development',
        type: 'adaptive',
        description: 'End-to-end feature development with context-aware adaptation',
        status: 'active',
        progress: 78,
        intelligence: {
          contextAwareness: 95,
          adaptability: 88,
          efficiency: 92,
          learningRate: 85
        },
        steps: [
          {
            id: 'analyze-requirements',
            name: 'Analyze Requirements',
            type: 'claude-analysis',
            status: 'completed',
            adaptiveLogic: 'Context-aware requirement analysis with project history integration',
            specialist: 'feature-architect',
            duration: 12,
            confidence: 94
          },
          {
            id: 'design-architecture',
            name: 'Design Architecture',
            type: 'claude-design',
            status: 'completed',
            adaptiveLogic: 'Adaptive architecture based on project patterns and best practices',
            specialist: 'system-architect',
            duration: 18,
            confidence: 89
          },
          {
            id: 'implement-core',
            name: 'Implement Core Logic',
            type: 'claude-code',
            status: 'in_progress',
            adaptiveLogic: 'Pattern-aware implementation with code style adaptation',
            specialist: 'feature-builder',
            duration: 45,
            confidence: 91
          },
          {
            id: 'generate-tests',
            name: 'Generate Comprehensive Tests',
            type: 'claude-testing',
            status: 'pending',
            adaptiveLogic: 'Intelligent test generation based on complexity analysis',
            specialist: 'test-engineer',
            duration: 25,
            confidence: 87
          },
          {
            id: 'optimize-performance',
            name: 'Performance Optimization',
            type: 'claude-optimization',
            status: 'pending',
            adaptiveLogic: 'Performance optimization based on real-time metrics',
            specialist: 'performance-optimizer',
            duration: 15,
            confidence: 83
          }
        ],
        triggers: ['feature-request', 'requirement-change', 'code-review-feedback'],
        adaptations: [
          'Automatically adjusts complexity based on project constraints',
          'Learns from previous implementations to improve efficiency',
          'Adapts testing strategy based on feature type and risk assessment',
          'Optimizes resource allocation based on current system load'
        ],
        createdAt: Date.now() - 7200000,
        lastAdaptation: Date.now() - 1800000,
        successRate: 92.5,
        avgDuration: 85
      },
      {
        id: 'wf-smart-bugfix',
        name: 'Smart Bug Resolution',
        type: 'adaptive',
        description: 'Intelligent bug hunting and resolution with learning',
        status: 'ready',
        progress: 0,
        intelligence: {
          contextAwareness: 91,
          adaptability: 94,
          efficiency: 87,
          learningRate: 90
        },
        steps: [
          {
            id: 'bug-analysis',
            name: 'Analyze Bug Report',
            type: 'claude-analysis',
            status: 'pending',
            adaptiveLogic: 'Context-aware bug analysis with historical pattern matching',
            specialist: 'bug-hunter',
            duration: 8,
            confidence: 96
          },
          {
            id: 'reproduce-issue',
            name: 'Reproduce Issue',
            type: 'claude-testing',
            status: 'pending',
            adaptiveLogic: 'Intelligent reproduction with environment adaptation',
            specialist: 'bug-hunter',
            duration: 15,
            confidence: 88
          },
          {
            id: 'root-cause-analysis',
            name: 'Root Cause Analysis',
            type: 'claude-investigation',
            status: 'pending',
            adaptiveLogic: 'Deep analysis with codebase pattern recognition',
            specialist: 'system-analyst',
            duration: 20,
            confidence: 85
          },
          {
            id: 'implement-fix',
            name: 'Implement Fix',
            type: 'claude-code',
            status: 'pending',
            adaptiveLogic: 'Minimal-impact fix with regression prevention',
            specialist: 'bug-hunter',
            duration: 25,
            confidence: 92
          },
          {
            id: 'validate-fix',
            name: 'Validate Fix',
            type: 'claude-testing',
            status: 'pending',
            adaptiveLogic: 'Comprehensive validation with edge case testing',
            specialist: 'test-engineer',
            duration: 12,
            confidence: 94
          }
        ],
        triggers: ['bug-report', 'test-failure', 'user-feedback'],
        adaptations: [
          'Adapts investigation depth based on bug severity and complexity',
          'Learns from similar bugs to improve resolution speed',
          'Automatically adjusts testing scope based on change impact',
          'Optimizes fix strategy based on codebase architecture patterns'
        ],
        createdAt: Date.now() - 14400000,
        lastAdaptation: Date.now() - 3600000,
        successRate: 96.8,
        avgDuration: 62
      },
      {
        id: 'wf-adaptive-optimization',
        name: 'Adaptive Performance Optimization',
        type: 'learning',
        description: 'Self-improving performance optimization with real-time learning',
        status: 'scheduled',
        progress: 0,
        intelligence: {
          contextAwareness: 89,
          adaptability: 96,
          efficiency: 91,
          learningRate: 94
        },
        steps: [
          {
            id: 'performance-profiling',
            name: 'Performance Profiling',
            type: 'automated-analysis',
            status: 'pending',
            adaptiveLogic: 'Real-time profiling with intelligent bottleneck detection',
            specialist: 'performance-optimizer',
            duration: 10,
            confidence: 93
          },
          {
            id: 'optimization-planning',
            name: 'Optimization Planning',
            type: 'claude-strategy',
            status: 'pending',
            adaptiveLogic: 'Strategic optimization based on usage patterns and constraints',
            specialist: 'system-architect',
            duration: 15,
            confidence: 87
          },
          {
            id: 'implement-optimizations',
            name: 'Implement Optimizations',
            type: 'claude-code',
            status: 'pending',
            adaptiveLogic: 'Incremental optimization with continuous validation',
            specialist: 'performance-optimizer',
            duration: 35,
            confidence: 89
          },
          {
            id: 'validate-improvements',
            name: 'Validate Improvements',
            type: 'automated-testing',
            status: 'pending',
            adaptiveLogic: 'Comprehensive performance validation with regression detection',
            specialist: 'test-engineer',
            duration: 12,
            confidence: 91
          }
        ],
        triggers: ['performance-degradation', 'load-increase', 'optimization-opportunity'],
        adaptations: [
          'Adapts optimization strategy based on real-time performance metrics',
          'Learns from optimization outcomes to improve future strategies',
          'Automatically prioritizes optimizations based on impact potential',
          'Continuously refines performance thresholds based on usage patterns'
        ],
        createdAt: Date.now() - 21600000,
        lastAdaptation: Date.now() - 7200000,
        successRate: 88.3,
        avgDuration: 48
      }
    ];
  };

  const generateActiveWorkflows = () => {
    return [
      {
        id: 'active-1',
        workflowId: 'wf-intelligent-feature',
        name: 'Feature: Inventory Improvements',
        currentStep: 'implement-core',
        progress: 78,
        startedAt: Date.now() - 3600000,
        estimatedCompletion: Date.now() + 1800000,
        adaptations: 3,
        specialist: 'feature-builder'
      }
    ];
  };

  const generateAdaptiveTemplates = () => {
    return [
      {
        id: 'template-feature-dev',
        name: 'Adaptive Feature Development',
        category: 'development',
        intelligence: 'high',
        adaptabilityScore: 94,
        description: 'Self-adapting feature development with context awareness',
        baseSteps: 5,
        adaptiveSteps: 12,
        learningCapabilities: [
          'Code pattern recognition',
          'Architecture preference learning',
          'Testing strategy adaptation',
          'Performance optimization learning'
        ]
      },
      {
        id: 'template-bug-resolution',
        name: 'Smart Bug Resolution',
        category: 'maintenance',
        intelligence: 'high',
        adaptabilityScore: 96,
        description: 'Intelligent bug hunting with pattern learning',
        baseSteps: 4,
        adaptiveSteps: 8,
        learningCapabilities: [
          'Bug pattern recognition',
          'Root cause prediction',
          'Fix strategy optimization',
          'Regression prevention learning'
        ]
      },
      {
        id: 'template-performance-opt',
        name: 'Adaptive Performance Optimization',
        category: 'optimization',
        intelligence: 'high',
        adaptabilityScore: 91,
        description: 'Self-improving performance optimization',
        baseSteps: 3,
        adaptiveSteps: 7,
        learningCapabilities: [
          'Bottleneck pattern recognition',
          'Optimization strategy learning',
          'Impact prediction',
          'Resource usage optimization'
        ]
      }
    ];
  };

  const generateAdaptiveRules = () => {
    return [
      {
        id: 'rule-complexity-adaptation',
        name: 'Complexity-Based Adaptation',
        type: 'contextual',
        condition: 'feature.complexity > 0.7',
        action: 'Increase testing depth and add additional review steps',
        confidence: 92,
        activations: 45,
        successRate: 89.3
      },
      {
        id: 'rule-pattern-learning',
        name: 'Pattern-Based Learning',
        type: 'learning',
        condition: 'similar_patterns.found',
        action: 'Adapt implementation approach based on successful patterns',
        confidence: 87,
        activations: 128,
        successRate: 94.7
      },
      {
        id: 'rule-resource-optimization',
        name: 'Resource Optimization',
        type: 'performance',
        condition: 'system.load > 0.8',
        action: 'Adjust workflow parallelization and resource allocation',
        confidence: 91,
        activations: 67,
        successRate: 88.9
      }
    ];
  };

  const generatePerformanceMetrics = () => {
    return {
      efficiency: {
        overall: 91.2,
        adaptation: 87.8,
        learning: 89.5,
        optimization: 93.1
      },
      intelligence: {
        contextAwareness: 92.4,
        adaptability: 88.9,
        predictiveAccuracy: 85.7,
        learningRate: 90.3
      },
      execution: {
        averageDuration: 67.3,
        successRate: 93.8,
        adaptationRate: 76.2,
        optimizationGain: 34.5
      }
    };
  };

  const generateLearningInsights = () => {
    return [
      {
        id: 'insight-1',
        type: 'pattern',
        title: 'Feature Complexity Patterns',
        description: 'Identified optimal testing strategies for different complexity levels',
        confidence: 94,
        impact: 'high',
        appliedCount: 23,
        successImprovement: 18.5
      },
      {
        id: 'insight-2',
        type: 'optimization',
        title: 'Code Style Adaptation',
        description: 'Learned project-specific code patterns to improve consistency',
        confidence: 87,
        impact: 'medium',
        appliedCount: 45,
        successImprovement: 12.3
      },
      {
        id: 'insight-3',
        type: 'prediction',
        title: 'Bug Prevention Patterns',
        description: 'Identified common bug patterns to prevent similar issues',
        confidence: 91,
        impact: 'high',
        appliedCount: 67,
        successImprovement: 25.7
      }
    ];
  };

  const generateOrchestrationStats = () => {
    return {
      totalWorkflows: 156,
      activeWorkflows: 12,
      completedToday: 23,
      avgSuccessRate: 91.7,
      adaptationEvents: 342,
      learningInsights: 67,
      performanceGain: 28.4,
      resourceSavings: 22.1
    };
  };

  const analyzeProjectContext = async () => {
    try {
      // Analyze current project context for adaptive workflow optimization
      const analysis = await performContextAnalysis();
      setContextAnalysis(analysis);
      
    } catch (error) {
      console.error('Context analysis failed:', error);
    }
  };

  const performContextAnalysis = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      projectType: 'arpg-game',
      complexity: 'high',
      teamSize: 'single-developer',
      codebase: {
        linesOfCode: 15420,
        languages: ['TypeScript', 'JavaScript', 'HTML', 'CSS'],
        architecture: 'feature-pods',
        testCoverage: 78.4
      },
      recentActivity: {
        commitsLastWeek: 23,
        featuresInProgress: 5,
        bugsResolved: 12,
        performanceOptimizations: 3
      },
      recommendations: [
        'Increase automated testing for game logic components',
        'Implement performance monitoring for real-time gameplay',
        'Add integration tests for feature pod communication',
        'Consider adding end-to-end testing for game workflows'
      ]
    };
  };

  const startAdaptiveLearning = () => {
    const interval = setInterval(() => {
      // Simulate adaptive learning and optimization
      setPerformanceMetrics(prev => ({
        ...prev,
        efficiency: {
          ...prev.efficiency,
          overall: Math.min(95, prev.efficiency.overall + (Math.random() - 0.5) * 0.5)
        }
      }));
      
      // Update active workflows
      setActiveWorkflows(prev => prev.map(workflow => ({
        ...workflow,
        progress: Math.min(100, workflow.progress + Math.random() * 3),
        adaptations: workflow.adaptations + (Math.random() > 0.8 ? 1 : 0)
      })));
      
    }, 5000);
    
    return () => clearInterval(interval);
  };

  const executeWorkflow = async (workflowId) => {
    try {
      setIsExecuting(true);
      
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;
      
      // Create active workflow execution
      const execution = {
        id: `active-${Date.now()}`,
        workflowId: workflow.id,
        name: `Executing: ${workflow.name}`,
        currentStep: workflow.steps[0].id,
        progress: 0,
        startedAt: Date.now(),
        estimatedCompletion: Date.now() + (workflow.avgDuration * 60000),
        adaptations: 0,
        specialist: workflow.steps[0].specialist
      };
      
      setActiveWorkflows(prev => [execution, ...prev]);
      
      if (eventBus) {
        eventBus.emit('workflow:started', { workflow, execution });
        eventBus.emit('system:alert', {
          level: 'info',
          title: 'Workflow Started',
          message: `Executing intelligent workflow: ${workflow.name}`
        });
      }
      
      // Simulate workflow execution with adaptive progress
      const progressInterval = setInterval(() => {
        setActiveWorkflows(prev => prev.map(active => 
          active.id === execution.id 
            ? { 
                ...active, 
                progress: Math.min(100, active.progress + Math.random() * 8),
                adaptations: active.adaptations + (Math.random() > 0.7 ? 1 : 0)
              }
            : active
        ));
      }, 2000);
      
      // Complete workflow after estimated time
      setTimeout(() => {
        clearInterval(progressInterval);
        
        setActiveWorkflows(prev => prev.map(active => 
          active.id === execution.id 
            ? { ...active, progress: 100, completedAt: Date.now() }
            : active
        ));
        
        if (eventBus) {
          eventBus.emit('workflow:completed', { workflowId, execution });
          eventBus.emit('system:alert', {
            level: 'success',
            title: 'Workflow Completed',
            message: `Successfully completed: ${workflow.name}`
          });
        }
        
        setIsExecuting(false);
      }, Math.min(10000, workflow.avgDuration * 100));
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      setIsExecuting(false);
    }
  };

  const getIntelligenceColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      case 'in_progress': return 'text-yellow-400';
      case 'pending': return 'text-gray-400';
      case 'ready': return 'text-purple-400';
      case 'scheduled': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'ready': return <Circle className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Workflow Orchestrator</p>
          <p className="text-gray-500 text-sm">Select a project to manage intelligent workflows</p>
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
              <Brain className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Intelligent Workflow Orchestrator</h2>
              {isExecuting && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-purple-600/20 rounded">
                  <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span className="text-xs text-purple-400">Orchestrating...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateWorkflow(true)}
              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </button>
            
            <button
              onClick={loadWorkflowOrchestration}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Intelligence Metrics */}
        <div className="grid grid-cols-8 gap-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <p className="text-lg font-bold text-white">{orchestrationStats.activeWorkflows || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Success Rate</span>
            </div>
            <p className="text-lg font-bold text-white">{orchestrationStats.avgSuccessRate || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Intelligence</span>
            </div>
            <p className="text-lg font-bold text-white">{performanceMetrics.intelligence?.contextAwareness?.toFixed(1) || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Adaptations</span>
            </div>
            <p className="text-lg font-bold text-white">{orchestrationStats.adaptationEvents || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">Insights</span>
            </div>
            <p className="text-lg font-bold text-white">{orchestrationStats.learningInsights || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-400">Performance</span>
            </div>
            <p className="text-lg font-bold text-white">+{orchestrationStats.performanceGain || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-400">Completed</span>
            </div>
            <p className="text-lg font-bold text-white">{orchestrationStats.completedToday || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Efficiency</span>
            </div>
            <p className="text-lg font-bold text-white">{performanceMetrics.efficiency?.overall?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-96 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Active Workflows */}
          <div className="border-b border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Active Workflows</h3>
            <div className="space-y-3">
              {activeWorkflows.map((active) => (
                <div key={active.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white truncate">{active.name}</p>
                    <span className="text-xs text-purple-400">#{active.adaptations}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${active.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{active.specialist}</span>
                    <span>{active.progress.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Learning Insights */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Learning Insights</h3>
            <div className="space-y-3">
              {learningInsights.map((insight) => (
                <div key={insight.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-white">{insight.title}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                      insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{insight.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Applied {insight.appliedCount} times</span>
                    <span>+{insight.successImprovement}% success</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Intelligent Workflows */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Intelligent Workflows</h3>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="bg-gray-900 rounded-lg p-6 cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-white">{workflow.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            workflow.type === 'adaptive' ? 'bg-purple-500/20 text-purple-400' :
                            workflow.type === 'learning' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {workflow.type}
                          </span>
                          <div className={`flex items-center space-x-1 ${getStatusColor(workflow.status)}`}>
                            {getStatusIcon(workflow.status)}
                            <span className="text-xs capitalize">{workflow.status}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">{workflow.description}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        {workflow.status === 'ready' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              executeWorkflow(workflow.id);
                            }}
                            disabled={isExecuting}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-xs rounded"
                          >
                            Execute
                          </button>
                        )}
                        <button className="p-1 text-gray-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Intelligence Metrics */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getIntelligenceColor(workflow.intelligence.contextAwareness)}`}>
                          {workflow.intelligence.contextAwareness}%
                        </div>
                        <div className="text-xs text-gray-400">Context Aware</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getIntelligenceColor(workflow.intelligence.adaptability)}`}>
                          {workflow.intelligence.adaptability}%
                        </div>
                        <div className="text-xs text-gray-400">Adaptable</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getIntelligenceColor(workflow.intelligence.efficiency)}`}>
                          {workflow.intelligence.efficiency}%
                        </div>
                        <div className="text-xs text-gray-400">Efficient</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getIntelligenceColor(workflow.intelligence.learningRate)}`}>
                          {workflow.intelligence.learningRate}%
                        </div>
                        <div className="text-xs text-gray-400">Learning</div>
                      </div>
                    </div>
                    
                    {/* Steps Progress */}
                    {workflow.progress > 0 && (
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${workflow.progress}%` }}
                        ></div>
                      </div>
                    )}
                    
                    {/* Performance Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Success Rate: {workflow.successRate}%</span>
                      <span>Avg Duration: {workflow.avgDuration}min</span>
                      <span>{workflow.steps.length} Steps</span>
                      <span>Adaptations: {workflow.adaptations?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Adaptive Templates */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Adaptive Templates</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {workflowTemplates.map((template) => (
                  <div key={template.id} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-white">{template.name}</h4>
                        <p className="text-xs text-gray-400">{template.description}</p>
                      </div>
                      <div className={`text-lg font-bold ${getIntelligenceColor(template.adaptabilityScore)}`}>
                        {template.adaptabilityScore}%
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {template.learningCapabilities.slice(0, 3).map((capability, index) => (
                        <div key={index} className="text-xs text-gray-300 flex items-center space-x-2">
                          <Circle className="w-2 h-2 text-purple-400" />
                          <span>{capability}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{template.baseSteps} → {template.adaptiveSteps} steps</span>
                      <span className={`px-2 py-1 rounded ${
                        template.intelligence === 'high' ? 'bg-green-500/20 text-green-400' :
                        template.intelligence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {template.intelligence} AI
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowOrchestrator;