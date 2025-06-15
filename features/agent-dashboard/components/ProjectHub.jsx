// Project Hub - Unified project management interface with context-aware Claude integration
// Revolutionary project-centric development control center

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, FolderOpen, Star, Clock, Settings, MoreVertical,
  Plus, Search, Filter, BarChart3, GitBranch, TestTube,
  CheckCircle, AlertTriangle, Play, Pause, Refresh,
  FileText, Code, Database, Terminal, Archive, Target
} from 'lucide-react';

const ProjectHub = ({ eventBus, onProjectSelect, activeProject }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAddProject, setShowAddProject] = useState(false);
  const [projectStats, setProjectStats] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Project detection and loading
  useEffect(() => {
    loadProjects();
    setupEventListeners();
  }, []);

  // Filter projects based on search and filters
  useEffect(() => {
    let filtered = projects;
    
    if (searchQuery) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.technologies.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(project => {
        switch (selectedFilter) {
          case 'active': return project.status === 'active';
          case 'recent': return Date.now() - project.lastActivity < 7 * 24 * 60 * 60 * 1000; // 7 days
          case 'starred': return project.starred;
          case 'arpg': return project.type === 'arpg';
          case 'web-app': return project.type === 'web-app';
          default: return true;
        }
      });
    }
    
    setFilteredProjects(filtered);
  }, [projects, searchQuery, selectedFilter]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      // Detect projects in the current workspace
      const detectedProjects = await detectProjects();
      
      // Load project contexts and health metrics
      const projectsWithContext = await Promise.all(
        detectedProjects.map(async (project) => {
          const context = await loadProjectContext(project);
          const health = await assessProjectHealth(project);
          const metrics = await loadProjectMetrics(project);
          
          return {
            ...project,
            ...context,
            health,
            metrics,
            starred: false, // Load from user preferences
            lastActivity: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 // Mock recent activity
          };
        })
      );
      
      setProjects(projectsWithContext);
      
      // Calculate aggregate stats
      const stats = calculateProjectStats(projectsWithContext);
      setProjectStats(stats);
      
    } catch (error) {
      console.error('Failed to load projects:', error);
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'error',
          title: 'Project Loading Failed',
          message: error.message
        });
      }
    } finally {
      setLoadingProjects(false);
    }
  };

  const detectProjects = async () => {
    // In a real implementation, this would scan the filesystem
    // For now, we'll return the current RainStorm ARPG project and mock others
    return [
      {
        id: 'rainstorm-arpg',
        name: 'RainStorm ARPG',
        path: '/mnt/c/Users/talth/Downloads/Archive',
        type: 'arpg',
        status: 'active',
        description: 'Revolutionary conflict-free ARPG with Claude integration',
        technologies: ['TypeScript', 'Node.js', 'MCP', 'Feature Pods', 'Claude Code'],
        repository: {
          url: 'https://github.com/user/rainstorm-arpg',
          branch: 'main',
          hasUncommittedChanges: true
        }
      },
      {
        id: 'web-portfolio',
        name: 'Personal Portfolio',
        path: '/projects/portfolio',
        type: 'web-app',
        status: 'paused',
        description: 'Modern React portfolio with animations',
        technologies: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion'],
        repository: {
          url: 'https://github.com/user/portfolio',
          branch: 'main',
          hasUncommittedChanges: false
        }
      },
      {
        id: 'api-service',
        name: 'Microservice API',
        path: '/projects/api-service',
        type: 'api',
        status: 'completed',
        description: 'RESTful API with GraphQL integration',
        technologies: ['Node.js', 'Express', 'GraphQL', 'PostgreSQL'],
        repository: {
          url: 'https://github.com/user/api-service',
          branch: 'main',
          hasUncommittedChanges: false
        }
      }
    ];
  };

  const loadProjectContext = async (project) => {
    try {
      // In a real implementation, this would read CLAUDE.md, memory.md, etc.
      const mockContext = {
        claudeContext: {
          architecture: project.type === 'arpg' ? 'Feature Pod System' : 'Standard MVC',
          codeStyle: 'TypeScript with ESLint',
          testingStrategy: 'Jest with TDD approach',
          buildSystem: 'npm scripts',
          documentation: ['README.md', 'ARCHITECTURE.md', 'API.md'],
          recentChanges: [
            { file: 'src/components/Dashboard.tsx', timestamp: Date.now() - 3600000 },
            { file: 'package.json', timestamp: Date.now() - 7200000 }
          ]
        },
        todoCount: Math.floor(Math.random() * 15) + 1,
        activeFeatures: project.type === 'arpg' ? 
          ['inventory-system', 'skill-trees', 'agent-dashboard'] : 
          ['authentication', 'user-profiles']
      };
      
      return mockContext;
    } catch (error) {
      console.warn(`Failed to load context for project ${project.name}:`, error);
      return {
        claudeContext: {},
        todoCount: 0,
        activeFeatures: []
      };
    }
  };

  const assessProjectHealth = async (project) => {
    // Mock health assessment based on project type and status
    const healthFactors = {
      testCoverage: Math.floor(Math.random() * 40) + 60, // 60-100%
      codeQuality: Math.floor(Math.random() * 30) + 70,  // 70-100
      buildStatus: Math.random() > 0.2 ? 'passing' : 'failing',
      dependencies: Math.random() > 0.3 ? 'up-to-date' : 'outdated',
      documentation: Math.random() > 0.4 ? 'complete' : 'incomplete'
    };
    
    const overallScore = (
      healthFactors.testCoverage * 0.3 +
      healthFactors.codeQuality * 0.3 +
      (healthFactors.buildStatus === 'passing' ? 100 : 0) * 0.2 +
      (healthFactors.dependencies === 'up-to-date' ? 100 : 0) * 0.1 +
      (healthFactors.documentation === 'complete' ? 100 : 0) * 0.1
    );
    
    return {
      score: Math.round(overallScore),
      status: overallScore >= 80 ? 'healthy' : overallScore >= 60 ? 'warning' : 'critical',
      factors: healthFactors
    };
  };

  const loadProjectMetrics = async (project) => {
    // Mock metrics
    return {
      linesOfCode: Math.floor(Math.random() * 50000) + 10000,
      filesCount: Math.floor(Math.random() * 200) + 50,
      contributors: Math.floor(Math.random() * 5) + 1,
      commits: Math.floor(Math.random() * 500) + 100,
      issues: {
        open: Math.floor(Math.random() * 10),
        closed: Math.floor(Math.random() * 50) + 20
      },
      performance: {
        buildTime: Math.floor(Math.random() * 60) + 30, // seconds
        testTime: Math.floor(Math.random() * 30) + 10
      }
    };
  };

  const calculateProjectStats = (projects) => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      healthy: projects.filter(p => p.health?.status === 'healthy').length,
      withIssues: projects.filter(p => p.health?.status !== 'healthy').length,
      totalTodos: projects.reduce((sum, p) => sum + (p.todoCount || 0), 0),
      avgHealthScore: Math.round(
        projects.reduce((sum, p) => sum + (p.health?.score || 0), 0) / projects.length
      )
    };
  };

  const setupEventListeners = () => {
    if (!eventBus) return;
    
    eventBus.on('project:context:updated', (data) => {
      setProjects(prev => prev.map(project => 
        project.id === data.projectId 
          ? { ...project, ...data.context }
          : project
      ));
    });
    
    eventBus.on('project:health:changed', (data) => {
      setProjects(prev => prev.map(project => 
        project.id === data.projectId 
          ? { ...project, health: data.health }
          : project
      ));
    });
  };

  const handleProjectSelect = (project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
    }
    
    if (eventBus) {
      eventBus.emit('project:selected', {
        project,
        timestamp: Date.now()
      });
    }
  };

  const handleToggleStarred = (projectId, starred) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, starred }
        : project
    ));
    
    // In a real implementation, this would save to user preferences
  };

  const handleRefreshProject = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    try {
      const context = await loadProjectContext(project);
      const health = await assessProjectHealth(project);
      const metrics = await loadProjectMetrics(project);
      
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, ...context, health, metrics, lastActivity: Date.now() }
          : p
      ));
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Project Refreshed',
          message: `${project.name} has been updated`
        });
      }
    } catch (error) {
      console.error('Failed to refresh project:', error);
    }
  };

  const getProjectTypeIcon = (type) => {
    switch (type) {
      case 'arpg': return <Target className="w-5 h-5 text-purple-400" />;
      case 'web-app': return <Code className="w-5 h-5 text-blue-400" />;
      case 'api': return <Database className="w-5 h-5 text-green-400" />;
      case 'library': return <Archive className="w-5 h-5 text-orange-400" />;
      default: return <Folder className="w-5 h-5 text-gray-400" />;
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loadingProjects) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Detecting projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Project Hub</h2>
            <p className="text-gray-400">Manage your development projects with Claude integration</p>
          </div>
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Folder className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{projectStats.total}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <p className="text-2xl font-bold text-white">{projectStats.active}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Healthy</span>
            </div>
            <p className="text-2xl font-bold text-white">{projectStats.healthy}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Issues</span>
            </div>
            <p className="text-2xl font-bold text-white">{projectStats.withIssues}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">TODOs</span>
            </div>
            <p className="text-2xl font-bold text-white">{projectStats.totalTodos}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-gray-400">Avg Health</span>
            </div>
            <p className="text-2xl font-bold text-white">{projectStats.avgHealthScore}%</p>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="recent">Recent</option>
            <option value="starred">Starred</option>
            <option value="arpg">ARPG Games</option>
            <option value="web-app">Web Apps</option>
          </select>
          <button
            onClick={loadProjects}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Refresh className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`bg-gray-900 rounded-lg border-2 transition-all cursor-pointer hover:border-blue-500 ${
                activeProject?.id === project.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800'
              }`}
              onClick={() => handleProjectSelect(project)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getProjectTypeIcon(project.type)}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                      <p className="text-sm text-gray-400">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStarred(project.id, !project.starred);
                      }}
                      className={`p-1 rounded ${project.starred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                    >
                      <Star className={`w-4 h-4 ${project.starred ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshProject(project.id);
                      }}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Refresh className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Status and Health */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                    <span className="text-sm text-gray-400 capitalize">{project.status}</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${getHealthColor(project.health?.status)}`}>
                    {project.health?.status === 'healthy' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{project.health?.score}%</span>
                  </div>
                </div>
                
                {/* Technologies */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{project.todoCount}</p>
                    <p className="text-xs text-gray-400">TODOs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{project.activeFeatures.length}</p>
                    <p className="text-xs text-gray-400">Features</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{Math.round(project.metrics.linesOfCode / 1000)}k</p>
                    <p className="text-xs text-gray-400">Lines</p>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(project.lastActivity)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <GitBranch className="w-3 h-3" />
                    <span>{project.repository?.branch || 'main'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No projects found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      
      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Path</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="/path/to/project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Type</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500">
                  <option value="web-app">Web Application</option>
                  <option value="arpg">ARPG Game</option>
                  <option value="api">API Service</option>
                  <option value="library">Library</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddProject(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddProject(false);
                  // In a real implementation, this would create the project
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHub;