// TODO Integration - Automatic TODO.md parsing and synchronization system
// Seamless task management with Claude workflow integration

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Plus, Edit, Trash2, Check, Clock, AlertTriangle,
  User, Bot, Play, Pause, RotateCcw, Filter, Search, Sort,
  Target, Zap, CheckCircle, XCircle, Calendar, Flag,
  GitBranch, MessageSquare, Code, Terminal, Settings
} from 'lucide-react';

const TodoIntegration = ({ eventBus, activeProject, activeSession }) => {
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [todoStats, setTodoStats] = useState({});
  const [autoSync, setAutoSync] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [claudeWorkflows, setClaudeWorkflows] = useState([]);

  // Initialize TODO system
  useEffect(() => {
    if (activeProject) {
      loadTodosFromProject();
      loadClaudeWorkflows();
      if (autoSync) {
        startAutoSync();
      }
    }
  }, [activeProject, autoSync]);

  // Filter and sort todos
  useEffect(() => {
    let filtered = todos;
    
    if (searchQuery) {
      filtered = filtered.filter(todo => 
        todo.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(todo => {
        switch (selectedFilter) {
          case 'pending': return todo.status === 'pending';
          case 'in_progress': return todo.status === 'in_progress';
          case 'completed': return todo.status === 'completed';
          case 'high': return todo.priority === 'high';
          case 'claude': return todo.assignedTo === 'claude';
          case 'user': return todo.assignedTo === 'user';
          case 'today': return todo.dueDate && new Date(todo.dueDate).toDateString() === new Date().toDateString();
          default: return true;
        }
      });
    }
    
    // Sort todos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          const statusOrder = { pending: 3, in_progress: 2, completed: 1 };
          return statusOrder[b.status] - statusOrder[a.status];
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'updated':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        default:
          return 0;
      }
    });
    
    setFilteredTodos(filtered);
    calculateTodoStats(filtered);
  }, [todos, searchQuery, selectedFilter, sortBy]);

  const loadTodosFromProject = async () => {
    try {
      // In a real implementation, this would parse COMPLETE_TODO.md and other TODO files
      // For now, we'll simulate reading from the project's TODO system
      const mockTodos = await parseTodoFiles();
      setTodos(mockTodos);
      setLastSync(Date.now());
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'TODOs Loaded',
          message: `Loaded ${mockTodos.length} tasks from project files`
        });
      }
    } catch (error) {
      console.error('Failed to load TODOs:', error);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'error',
          title: 'TODO Loading Failed',
          message: error.message
        });
      }
    }
  };

  const parseTodoFiles = async () => {
    // Mock parsing of COMPLETE_TODO.md and other TODO files
    return [
      {
        id: 'todo-1',
        content: 'Implement unified Project Hub interface with project switcher and context loading',
        status: 'completed',
        priority: 'high',
        assignedTo: 'claude',
        tags: ['dashboard', 'ui', 'project-management'],
        source: 'COMPLETE_TODO.md',
        lineNumber: 15,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 3600000,
        completedAt: Date.now() - 3600000,
        estimatedTime: 240,
        actualTime: 180,
        claudeWorkflow: 'feature-builder',
        notes: 'Successfully implemented with project detection and context loading'
      },
      {
        id: 'todo-2',
        content: 'Create persistent Claude Code session management system',
        status: 'completed',
        priority: 'high',
        assignedTo: 'claude',
        tags: ['claude', 'sessions', 'persistence'],
        source: 'COMPLETE_TODO.md',
        lineNumber: 16,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 7200000,
        completedAt: Date.now() - 7200000,
        estimatedTime: 300,
        actualTime: 240,
        claudeWorkflow: 'feature-builder'
      },
      {
        id: 'todo-3',
        content: 'Add visual Git operations and history management',
        status: 'pending',
        priority: 'high',
        assignedTo: 'claude',
        tags: ['git', 'version-control', 'ui'],
        source: 'dashboard_improvement_plan.md',
        lineNumber: 178,
        createdAt: Date.now() - 43200000,
        updatedAt: Date.now() - 43200000,
        estimatedTime: 180,
        claudeWorkflow: 'feature-builder'
      },
      {
        id: 'todo-4',
        content: 'Implement real-time project health monitoring and metrics',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'claude',
        tags: ['monitoring', 'metrics', 'health'],
        source: 'dashboard_improvement_plan.md',
        lineNumber: 230,
        createdAt: Date.now() - 21600000,
        updatedAt: Date.now() - 1800000,
        estimatedTime: 240,
        claudeWorkflow: 'feature-builder'
      },
      {
        id: 'todo-5',
        content: 'Create AI content generation control interface',
        status: 'pending',
        priority: 'high',
        assignedTo: 'claude',
        tags: ['ai', 'content', 'generation', 'ui'],
        source: 'dashboard_improvement_plan.md',
        lineNumber: 380,
        createdAt: Date.now() - 14400000,
        updatedAt: Date.now() - 14400000,
        estimatedTime: 200,
        claudeWorkflow: 'feature-builder'
      },
      {
        id: 'todo-6',
        content: 'Build production deployment and DevOps management',
        status: 'pending',
        priority: 'medium',
        assignedTo: 'claude',
        tags: ['deployment', 'devops', 'production'],
        source: 'dashboard_improvement_plan.md',
        lineNumber: 435,
        createdAt: Date.now() - 10800000,
        updatedAt: Date.now() - 10800000,
        estimatedTime: 360,
        claudeWorkflow: 'feature-builder'
      },
      {
        id: 'todo-7',
        content: 'Optimize game performance and reduce memory usage',
        status: 'pending',
        priority: 'medium',
        assignedTo: 'user',
        tags: ['performance', 'optimization', 'game'],
        source: 'game-core/performance-notes.md',
        lineNumber: 23,
        createdAt: Date.now() - 7200000,
        updatedAt: Date.now() - 7200000,
        estimatedTime: 120
      },
      {
        id: 'todo-8',
        content: 'Write comprehensive tests for inventory system',
        status: 'pending',
        priority: 'medium',
        assignedTo: 'claude',
        tags: ['testing', 'inventory', 'quality'],
        source: 'features/inventory-system/README.md',
        lineNumber: 45,
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000,
        estimatedTime: 90,
        claudeWorkflow: 'tester'
      }
    ];
  };

  const loadClaudeWorkflows = () => {
    // Load available Claude workflow templates
    setClaudeWorkflows([
      { id: 'feature-builder', name: 'Feature Builder', description: 'End-to-end feature development' },
      { id: 'bug-hunter', name: 'Bug Hunter', description: 'Bug investigation and resolution' },
      { id: 'code-reviewer', name: 'Code Reviewer', description: 'Code quality analysis' },
      { id: 'tester', name: 'Test Engineer', description: 'Comprehensive testing' },
      { id: 'documenter', name: 'Documentation Writer', description: 'Documentation and guides' },
      { id: 'optimizer', name: 'Performance Optimizer', description: 'Performance improvements' }
    ]);
  };

  const startAutoSync = () => {
    const interval = setInterval(() => {
      syncWithFiles();
    }, 30000); // Sync every 30 seconds
    
    return () => clearInterval(interval);
  };

  const syncWithFiles = async () => {
    try {
      // In a real implementation, this would watch file changes and re-parse
      const updatedTodos = await parseTodoFiles();
      
      // Merge with existing todos, preserving local changes
      const mergedTodos = mergeTodos(todos, updatedTodos);
      setTodos(mergedTodos);
      setLastSync(Date.now());
      
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  };

  const mergeTodos = (existing, updated) => {
    // Simple merge strategy - prefer existing for modified todos
    const merged = [...updated];
    
    existing.forEach(existingTodo => {
      const updatedIndex = merged.findIndex(t => t.id === existingTodo.id);
      if (updatedIndex >= 0) {
        // If todo was modified locally more recently, keep local version
        if (existingTodo.updatedAt > merged[updatedIndex].updatedAt) {
          merged[updatedIndex] = existingTodo;
        }
      } else {
        // Todo was added locally
        merged.push(existingTodo);
      }
    });
    
    return merged;
  };

  const calculateTodoStats = (filteredTodos) => {
    const stats = {
      total: todos.length,
      filtered: filteredTodos.length,
      pending: todos.filter(t => t.status === 'pending').length,
      inProgress: todos.filter(t => t.status === 'in_progress').length,
      completed: todos.filter(t => t.status === 'completed').length,
      high: todos.filter(t => t.priority === 'high').length,
      assignedToClaude: todos.filter(t => t.assignedTo === 'claude').length,
      completionRate: Math.round((todos.filter(t => t.status === 'completed').length / todos.length) * 100) || 0
    };
    
    setTodoStats(stats);
  };

  const addTodo = async (todoData) => {
    try {
      const newTodo = {
        id: `todo-${Date.now()}`,
        content: todoData.content,
        status: 'pending',
        priority: todoData.priority || 'medium',
        assignedTo: todoData.assignedTo || 'user',
        tags: todoData.tags || [],
        source: 'dashboard',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedTime: todoData.estimatedTime,
        claudeWorkflow: todoData.claudeWorkflow
      };
      
      setTodos(prev => [newTodo, ...prev]);
      
      // In a real implementation, this would write to TODO files
      await saveTodoToFile(newTodo);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'TODO Added',
          message: 'New task has been added to the project'
        });
      }
      
    } catch (error) {
      console.error('Failed to add TODO:', error);
    }
  };

  const updateTodoStatus = async (todoId, newStatus) => {
    try {
      setTodos(prev => prev.map(todo => 
        todo.id === todoId 
          ? { 
              ...todo, 
              status: newStatus, 
              updatedAt: Date.now(),
              completedAt: newStatus === 'completed' ? Date.now() : undefined
            }
          : todo
      ));
      
      // In a real implementation, this would update the source file
      await updateTodoInFile(todoId, { status: newStatus });
      
      if (eventBus) {
        eventBus.emit('todo:status:changed', { todoId, status: newStatus });
      }
      
    } catch (error) {
      console.error('Failed to update TODO status:', error);
    }
  };

  const assignTodoToClaude = async (todoId, workflowId) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;
      
      // Update todo assignment
      setTodos(prev => prev.map(t => 
        t.id === todoId 
          ? { 
              ...t, 
              assignedTo: 'claude',
              claudeWorkflow: workflowId,
              status: 'in_progress',
              updatedAt: Date.now()
            }
          : t
      ));
      
      // Trigger Claude workflow
      if (eventBus) {
        eventBus.emit('claude:workflow:start', {
          todoId,
          workflow: workflowId,
          task: todo.content,
          project: activeProject,
          session: activeSession
        });
        
        eventBus.emit('system:alert', {
          level: 'info',
          title: 'Task Assigned to Claude',
          message: `Starting ${claudeWorkflows.find(w => w.id === workflowId)?.name} workflow`
        });
      }
      
    } catch (error) {
      console.error('Failed to assign TODO to Claude:', error);
    }
  };

  const saveTodoToFile = async (todo) => {
    // Mock file writing - in real implementation would append to COMPLETE_TODO.md
    console.log('Saving TODO to file:', todo);
  };

  const updateTodoInFile = async (todoId, updates) => {
    // Mock file updating - in real implementation would modify source file
    console.log('Updating TODO in file:', todoId, updates);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-blue-400';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'pending': return <XCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  const formatTimeEstimate = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">TODO Integration</p>
          <p className="text-gray-500 text-sm">Select a project to view and manage tasks</p>
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
              <FileText className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">TODO Integration</h2>
              {lastSync && (
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Synced {Math.round((Date.now() - lastSync) / 1000)}s ago</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddTodo(true)}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              <Plus className="w-4 h-4" />
              <span>Add TODO</span>
            </button>
            
            <button
              onClick={loadTodosFromProject}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{todoStats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Pending</span>
            </div>
            <p className="text-2xl font-bold text-white">{todoStats.pending}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-white">{todoStats.inProgress}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Completed</span>
            </div>
            <p className="text-2xl font-bold text-white">{todoStats.completed}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Claude</span>
            </div>
            <p className="text-2xl font-bold text-white">{todoStats.assignedToClaude}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Flag className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">Completion</span>
            </div>
            <p className="text-2xl font-bold text-white">{todoStats.completionRate}%</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search TODOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All TODOs</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="high">High Priority</option>
            <option value="claude">Assigned to Claude</option>
            <option value="user">Assigned to User</option>
            <option value="today">Due Today</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="created">Created Date</option>
            <option value="updated">Updated Date</option>
          </select>
        </div>
      </div>
      
      {/* TODO List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start space-x-4">
                {/* Status Icon */}
                <button
                  onClick={() => {
                    const nextStatus = 
                      todo.status === 'pending' ? 'in_progress' :
                      todo.status === 'in_progress' ? 'completed' : 'pending';
                    updateTodoStatus(todo.id, nextStatus);
                  }}
                  className={`mt-1 ${getStatusColor(todo.status)} hover:scale-110 transition-transform`}
                >
                  {getStatusIcon(todo.status)}
                </button>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className={`text-sm font-medium ${
                      todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'
                    }`}>
                      {todo.content}
                    </p>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Priority */}
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                        {todo.priority.toUpperCase()}
                      </div>
                      
                      {/* Assigned To */}
                      {todo.assignedTo === 'claude' ? (
                        <Bot className="w-4 h-4 text-purple-400" />
                      ) : (
                        <User className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {todo.tags && todo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {todo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{todo.source}:{todo.lineNumber}</span>
                    {todo.estimatedTime && (
                      <span>Est: {formatTimeEstimate(todo.estimatedTime)}</span>
                    )}
                    {todo.claudeWorkflow && (
                      <span className="text-purple-400">
                        {claudeWorkflows.find(w => w.id === todo.claudeWorkflow)?.name || todo.claudeWorkflow}
                      </span>
                    )}
                    <span>Updated {new Date(todo.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-1">
                  {todo.assignedTo !== 'claude' && todo.status === 'pending' && (
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            assignTodoToClaude(todo.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="p-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none"
                      >
                        <option value="">Assign to Claude</option>
                        {claudeWorkflows.map((workflow) => (
                          <option key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setEditingTodo(todo)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredTodos.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No TODOs found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      
      {/* Add TODO Modal */}
      {showAddTodo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Add New TODO</h3>
              <button
                onClick={() => setShowAddTodo(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addTodo({
                  content: formData.get('content'),
                  priority: formData.get('priority'),
                  assignedTo: formData.get('assignedTo'),
                  estimatedTime: parseInt(formData.get('estimatedTime')) || undefined,
                  claudeWorkflow: formData.get('claudeWorkflow') || undefined,
                  tags: formData.get('tags')?.split(',').map(t => t.trim()).filter(Boolean) || []
                });
                setShowAddTodo(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Task Description</label>
                <textarea
                  name="content"
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  rows="3"
                  placeholder="Describe the task..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select
                    name="priority"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Assigned To</label>
                  <select
                    name="assignedTo"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="claude">Claude</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Time (minutes)</label>
                  <input
                    type="number"
                    name="estimatedTime"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    placeholder="60"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Claude Workflow</label>
                  <select
                    name="claudeWorkflow"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select workflow...</option>
                    {claudeWorkflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="ui, feature, dashboard"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTodo(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Add TODO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoIntegration;