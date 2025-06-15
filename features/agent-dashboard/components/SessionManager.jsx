// Session Manager Component - UI for persistent Claude Code session management
// Advanced session management with project context and conversation history

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Brain, Clock, Pin, Tag, Search, Filter,
  Plus, Play, Pause, X, Settings, History, FileText,
  Target, Zap, Bug, TestTube, BookOpen, Code, Star,
  MoreVertical, Edit2, Copy, Archive, Trash2, Eye
} from 'lucide-react';

const SessionManager = ({ eventBus, activeProject, onSessionSelect, activeSessionId }) => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [sessionTemplates, setSessionTemplates] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(null);
  const [sortBy, setSortBy] = useState('lastActivity');
  const [sessionStats, setSessionStats] = useState({});
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Initialize and load sessions
  useEffect(() => {
    loadSessions();
    loadSessionTemplates();
    setupEventListeners();
  }, []);

  // Filter sessions based on search and filters
  useEffect(() => {
    let filtered = sessions;
    
    if (searchQuery) {
      filtered = filtered.filter(session => 
        session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.specialist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (session.projectContext?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(session => {
        switch (selectedFilter) {
          case 'active': return session.isActive;
          case 'pinned': return session.isPinned;
          case 'project': return session.projectId === activeProject?.id;
          case 'recent': return Date.now() - session.lastActivity < 24 * 60 * 60 * 1000; // 24 hours
          case 'feature-builder': return session.specialist === 'feature-builder';
          case 'bug-hunter': return session.specialist === 'bug-hunter';
          case 'code-reviewer': return session.specialist === 'code-reviewer';
          case 'tester': return session.specialist === 'tester';
          default: return true;
        }
      });
    }
    
    // Sort sessions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'created': return b.createdAt - a.createdAt;
        case 'lastActivity': return b.lastActivity - a.lastActivity;
        case 'messages': return b.metadata.totalMessages - a.metadata.totalMessages;
        default: return b.lastActivity - a.lastActivity;
      }
    });
    
    setFilteredSessions(filtered);
  }, [sessions, searchQuery, selectedFilter, sortBy, activeProject]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      // In a real implementation, this would load from the SessionManager
      const mockSessions = generateMockSessions();
      setSessions(mockSessions);
      
      const stats = calculateSessionStats(mockSessions);
      setSessionStats(stats);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'error',
          title: 'Session Loading Failed',
          message: error.message
        });
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionTemplates = async () => {
    // Load session templates from the SessionManager
    const templates = [
      {
        id: 'feature-builder',
        name: 'Feature Builder',
        description: 'End-to-end feature development with full toolkit access',
        specialist: 'feature-builder',
        icon: <Target className="w-5 h-5" />,
        color: 'blue'
      },
      {
        id: 'bug-hunter',
        name: 'Bug Hunter',
        description: 'Systematic bug investigation and resolution',
        specialist: 'bug-hunter',
        icon: <Bug className="w-5 h-5" />,
        color: 'red'
      },
      {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: 'Comprehensive code quality analysis',
        specialist: 'code-reviewer',
        icon: <Eye className="w-5 h-5" />,
        color: 'green'
      },
      {
        id: 'tester',
        name: 'Test Engineer',
        description: 'Comprehensive testing strategy and implementation',
        specialist: 'tester',
        icon: <TestTube className="w-5 h-5" />,
        color: 'purple'
      },
      {
        id: 'game-developer',
        name: 'Game Developer',
        description: 'ARPG-specific development with game mechanics focus',
        specialist: 'game-developer',
        icon: <Zap className="w-5 h-5" />,
        color: 'orange'
      },
      {
        id: 'documenter',
        name: 'Documentation Writer',
        description: 'Comprehensive project documentation and guides',
        specialist: 'documenter',
        icon: <BookOpen className="w-5 h-5" />,
        color: 'indigo'
      }
    ];
    setSessionTemplates(templates);
  };

  const generateMockSessions = () => {
    return [
      {
        id: 'session_1',
        name: 'Feature Builder - Project Hub',
        projectId: 'rainstorm-arpg',
        projectContext: { name: 'RainStorm ARPG', type: 'arpg' },
        specialist: 'feature-builder',
        profile: 'trusted-developer',
        conversationHistory: [
          { role: 'user', content: 'Implement Project Hub interface', timestamp: Date.now() - 3600000 },
          { role: 'assistant', content: 'I\'ll implement the Project Hub interface with project detection and context loading...', timestamp: Date.now() - 3500000 }
        ],
        metadata: {
          totalMessages: 8,
          totalTokens: 15420,
          averageResponseTime: 2500,
          toolUsageStats: { 'Read': 5, 'Write': 3, 'Edit': 4 },
          successfulOperations: 7
        },
        createdAt: Date.now() - 7200000,
        lastActivity: Date.now() - 300000,
        isActive: true,
        isPinned: true,
        tags: ['feature-development', 'ui', 'project-management']
      },
      {
        id: 'session_2',
        name: 'Bug Hunter - Memory Leak',
        projectId: 'rainstorm-arpg',
        projectContext: { name: 'RainStorm ARPG', type: 'arpg' },
        specialist: 'bug-hunter',
        profile: 'debugger',
        conversationHistory: [
          { role: 'user', content: 'Investigate memory leak in game loop', timestamp: Date.now() - 5400000 },
          { role: 'assistant', content: 'I\'ll analyze the game loop for potential memory leaks...', timestamp: Date.now() - 5300000 }
        ],
        metadata: {
          totalMessages: 12,
          totalTokens: 23150,
          averageResponseTime: 3200,
          toolUsageStats: { 'Read': 8, 'Grep': 6, 'Bash': 3 },
          successfulOperations: 11
        },
        createdAt: Date.now() - 86400000,
        lastActivity: Date.now() - 1800000,
        isActive: false,
        isPinned: false,
        tags: ['bug-fixing', 'performance', 'memory']
      },
      {
        id: 'session_3',
        name: 'Code Reviewer - Security Audit',
        projectId: 'rainstorm-arpg',
        projectContext: { name: 'RainStorm ARPG', type: 'arpg' },
        specialist: 'code-reviewer',
        profile: 'reviewer',
        conversationHistory: [
          { role: 'user', content: 'Review authentication system for security issues', timestamp: Date.now() - 10800000 },
          { role: 'assistant', content: 'I\'ll perform a comprehensive security review of the authentication system...', timestamp: Date.now() - 10700000 }
        ],
        metadata: {
          totalMessages: 6,
          totalTokens: 18940,
          averageResponseTime: 4100,
          toolUsageStats: { 'Read': 12, 'Grep': 8 },
          successfulOperations: 6
        },
        createdAt: Date.now() - 172800000,
        lastActivity: Date.now() - 3600000,
        isActive: false,
        isPinned: true,
        tags: ['security', 'authentication', 'review']
      }
    ];
  };

  const calculateSessionStats = (sessions) => {
    return {
      total: sessions.length,
      active: sessions.filter(s => s.isActive).length,
      pinned: sessions.filter(s => s.isPinned).length,
      totalMessages: sessions.reduce((sum, s) => sum + s.metadata.totalMessages, 0),
      avgResponseTime: Math.round(
        sessions.reduce((sum, s) => sum + s.metadata.averageResponseTime, 0) / sessions.length
      ),
      mostUsedTools: getMostUsedTools(sessions)
    };
  };

  const getMostUsedTools = (sessions) => {
    const toolStats = {};
    sessions.forEach(session => {
      Object.entries(session.metadata.toolUsageStats).forEach(([tool, count]) => {
        toolStats[tool] = (toolStats[tool] || 0) + count;
      });
    });
    
    return Object.entries(toolStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tool, count]) => ({ tool, count }));
  };

  const setupEventListeners = () => {
    if (!eventBus) return;
    
    eventBus.on('session:created', (data) => {
      setSessions(prev => [data.session, ...prev]);
    });
    
    eventBus.on('session:updated', (data) => {
      setSessions(prev => prev.map(session => 
        session.id === data.session.id ? data.session : session
      ));
    });
    
    eventBus.on('session:deleted', (data) => {
      setSessions(prev => prev.filter(session => session.id !== data.sessionId));
    });
  };

  const handleCreateSession = async (templateId, config = {}) => {
    try {
      // In a real implementation, this would call the SessionManager
      const template = sessionTemplates.find(t => t.id === templateId);
      if (!template) return;

      const newSession = {
        id: `session_${Date.now()}`,
        name: config.name || `${template.name} - ${new Date().toLocaleTimeString()}`,
        projectId: activeProject?.id,
        projectContext: activeProject,
        specialist: template.specialist,
        profile: 'trusted-developer',
        conversationHistory: [],
        metadata: {
          totalMessages: 0,
          totalTokens: 0,
          averageResponseTime: 0,
          toolUsageStats: {},
          successfulOperations: 0
        },
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true,
        isPinned: false,
        tags: [template.specialist]
      };

      setSessions(prev => [newSession, ...prev]);
      setShowCreateModal(false);

      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Session Created',
          message: `Created new ${template.name} session`
        });
      }

      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleSessionAction = async (sessionId, action) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    switch (action) {
      case 'resume':
        session.isActive = true;
        session.lastActivity = Date.now();
        if (onSessionSelect) onSessionSelect(session);
        break;
      case 'pause':
        session.isActive = false;
        session.lastActivity = Date.now();
        break;
      case 'pin':
        session.isPinned = !session.isPinned;
        break;
      case 'delete':
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        break;
      case 'details':
        setShowSessionDetails(session);
        break;
    }

    setSessions(prev => prev.map(s => s.id === sessionId ? session : s));
  };

  const getSpecialistIcon = (specialist) => {
    switch (specialist) {
      case 'feature-builder': return <Target className="w-4 h-4 text-blue-400" />;
      case 'bug-hunter': return <Bug className="w-4 h-4 text-red-400" />;
      case 'code-reviewer': return <Eye className="w-4 h-4 text-green-400" />;
      case 'tester': return <TestTube className="w-4 h-4 text-purple-400" />;
      case 'game-developer': return <Zap className="w-4 h-4 text-orange-400" />;
      case 'documenter': return <BookOpen className="w-4 h-4 text-indigo-400" />;
      default: return <Brain className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSpecialistColor = (specialist) => {
    switch (specialist) {
      case 'feature-builder': return 'border-blue-500 bg-blue-500/10';
      case 'bug-hunter': return 'border-red-500 bg-red-500/10';
      case 'code-reviewer': return 'border-green-500 bg-green-500/10';
      case 'tester': return 'border-purple-500 bg-purple-500/10';
      case 'game-developer': return 'border-orange-500 bg-orange-500/10';
      case 'documenter': return 'border-indigo-500 bg-indigo-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loadingSessions) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading sessions...</p>
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
            <h2 className="text-2xl font-bold text-white">Session Manager</h2>
            <p className="text-gray-400">Manage persistent Claude Code sessions with project context</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{sessionStats.total}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <p className="text-2xl font-bold text-white">{sessionStats.active}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Pin className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Pinned</span>
            </div>
            <p className="text-2xl font-bold text-white">{sessionStats.pinned}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Messages</span>
            </div>
            <p className="text-2xl font-bold text-white">{sessionStats.totalMessages}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-gray-400">Avg Response</span>
            </div>
            <p className="text-2xl font-bold text-white">{sessionStats.avgResponseTime}ms</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-indigo-400" />
              <span className="text-sm text-gray-400">Top Tool</span>
            </div>
            <p className="text-lg font-bold text-white">
              {sessionStats.mostUsedTools?.[0]?.tool || 'None'}
            </p>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
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
            <option value="all">All Sessions</option>
            <option value="active">Active</option>
            <option value="pinned">Pinned</option>
            <option value="project">Current Project</option>
            <option value="recent">Recent</option>
            <option value="feature-builder">Feature Builder</option>
            <option value="bug-hunter">Bug Hunter</option>
            <option value="code-reviewer">Code Reviewer</option>
            <option value="tester">Tester</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="lastActivity">Last Activity</option>
            <option value="created">Created Date</option>
            <option value="name">Name</option>
            <option value="messages">Message Count</option>
          </select>
        </div>
      </div>
      
      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`bg-gray-900 rounded-lg border-2 transition-all cursor-pointer hover:border-blue-500/50 ${
                activeSessionId === session.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800'
              } ${session.isActive ? 'ring-1 ring-green-500/30' : ''}`}
              onClick={() => onSessionSelect && onSessionSelect(session)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getSpecialistIcon(session.specialist)}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{session.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>{session.specialist.replace('-', ' ')}</span>
                        {session.projectContext && (
                          <>
                            <span>•</span>
                            <span>{session.projectContext.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.isPinned && (
                      <Pin className="w-4 h-4 text-yellow-400 fill-current" />
                    )}
                    {session.isActive && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionAction(session.id, 'details');
                      }}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {session.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {session.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded">
                      +{session.tags.length - 3}
                    </span>
                  )}
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{session.metadata.totalMessages}</p>
                    <p className="text-xs text-gray-400">Messages</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{Math.round(session.metadata.totalTokens / 1000)}k</p>
                    <p className="text-xs text-gray-400">Tokens</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{session.metadata.averageResponseTime}ms</p>
                    <p className="text-xs text-gray-400">Avg Response</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{Object.keys(session.metadata.toolUsageStats).length}</p>
                    <p className="text-xs text-gray-400">Tools Used</p>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(session.lastActivity)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionAction(session.id, session.isActive ? 'pause' : 'resume');
                      }}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      {session.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionAction(session.id, 'pin');
                      }}
                      className={`p-1 ${session.isPinned ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                    >
                      <Pin className={`w-3 h-3 ${session.isPinned ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No sessions found</p>
            <p className="text-gray-500 text-sm">Create a new session to get started</p>
          </div>
        )}
      </div>
      
      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Create New Session</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {sessionTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border-2 border-gray-700 rounded-lg cursor-pointer transition-all hover:border-${template.color}-500`}
                  onClick={() => handleCreateSession(template.id)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 bg-${template.color}-500/20 rounded-lg`}>
                      {template.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{template.name}</h4>
                      <p className="text-sm text-gray-400">{template.specialist}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Session Details Modal */}
      {showSessionDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Session Details</h3>
              <button
                onClick={() => setShowSessionDetails(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Session Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Session Information</h4>
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="text-white">{showSessionDetails.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Specialist</p>
                      <p className="text-white">{showSessionDetails.specialist}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">{new Date(showSessionDetails.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Last Activity</p>
                      <p className="text-white">{formatTimeAgo(showSessionDetails.lastActivity)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Conversation Preview */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Conversation</h4>
                <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {showSessionDetails.conversationHistory.slice(-5).map((message, index) => (
                    <div key={index} className="mb-3 last:mb-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-sm font-medium ${
                          message.role === 'user' ? 'text-blue-400' : 'text-green-400'
                        }`}>
                          {message.role === 'user' ? 'User' : 'Claude'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 truncate">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    handleSessionAction(showSessionDetails.id, 'pin');
                    setShowSessionDetails(null);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  {showSessionDetails.isPinned ? 'Unpin' : 'Pin'} Session
                </button>
                <button
                  onClick={() => {
                    handleSessionAction(showSessionDetails.id, showSessionDetails.isActive ? 'pause' : 'resume');
                    setShowSessionDetails(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  {showSessionDetails.isActive ? 'Pause' : 'Resume'} Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager;