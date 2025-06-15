// Git Integration - Visual Git operations and history management
// Comprehensive version control interface with visual diff and branch management

import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitBranch, GitCommit, GitMerge, GitPullRequest, Plus, RefreshCw,
  Eye, Download, Upload, Settings, Clock, User, Calendar,
  FileText, Code, Diff, History, Tag, Shield, Zap,
  ArrowUp, ArrowDown, ArrowRight, Circle, Square,
  Trash2, Edit, Copy, CheckCircle, AlertTriangle,
  Search, Filter, Sort, ChevronDown, ChevronRight,
  Terminal, Play, Pause, RotateCcw, Target
} from 'lucide-react';

const GitIntegration = ({ eventBus, activeProject }) => {
  const [gitStatus, setGitStatus] = useState(null);
  const [branches, setBranches] = useState([]);
  const [commits, setCommits] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [uncommittedChanges, setUncommittedChanges] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [diffView, setDiffView] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedView, setSelectedView] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [remoteInfo, setRemoteInfo] = useState(null);

  // Initialize Git integration
  useEffect(() => {
    if (activeProject) {
      loadGitRepository();
      startGitMonitoring();
    }
  }, [activeProject]);

  const loadGitRepository = async () => {
    try {
      setIsLoading(true);
      
      // Load Git repository information
      const repoData = await loadRepositoryData();
      setGitStatus(repoData.status);
      setBranches(repoData.branches);
      setCommits(repoData.commits);
      setCurrentBranch(repoData.currentBranch);
      setUncommittedChanges(repoData.changes);
      setRemoteInfo(repoData.remote);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Git Repository Loaded',
          message: `Loaded ${repoData.branches.length} branches and ${repoData.commits.length} commits`
        });
      }
      
    } catch (error) {
      console.error('Failed to load Git repository:', error);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'error',
          title: 'Git Load Failed',
          message: error.message
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadRepositoryData = async () => {
    // Simulate Git operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: {
        ahead: Math.floor(Math.random() * 5),
        behind: Math.floor(Math.random() * 3),
        staged: Math.floor(Math.random() * 8),
        unstaged: Math.floor(Math.random() * 12),
        untracked: Math.floor(Math.random() * 6)
      },
      currentBranch: 'main',
      branches: generateMockBranches(),
      commits: generateMockCommits(),
      changes: generateMockChanges(),
      remote: {
        url: 'https://github.com/user/rainstorm-arpg.git',
        name: 'origin',
        lastFetch: Date.now() - 3600000,
        lastPush: Date.now() - 7200000
      }
    };
  };

  const generateMockBranches = () => {
    return [
      {
        name: 'main',
        current: true,
        upstream: 'origin/main',
        ahead: 2,
        behind: 0,
        lastCommit: Date.now() - 3600000,
        author: 'Developer'
      },
      {
        name: 'feature/inventory-improvements',
        current: false,
        upstream: 'origin/feature/inventory-improvements',
        ahead: 5,
        behind: 1,
        lastCommit: Date.now() - 7200000,
        author: 'Claude'
      },
      {
        name: 'feature/new-areas',
        current: false,
        upstream: null,
        ahead: 0,
        behind: 0,
        lastCommit: Date.now() - 14400000,
        author: 'Developer'
      },
      {
        name: 'bugfix/flask-system-crash',
        current: false,
        upstream: 'origin/bugfix/flask-system-crash',
        ahead: 3,
        behind: 0,
        lastCommit: Date.now() - 21600000,
        author: 'Claude'
      },
      {
        name: 'hotfix/database-connection',
        current: false,
        upstream: 'origin/hotfix/database-connection',
        ahead: 1,
        behind: 2,
        lastCommit: Date.now() - 28800000,
        author: 'Developer'
      }
    ];
  };

  const generateMockCommits = () => {
    const authors = ['Developer', 'Claude', 'AI Assistant'];
    const messages = [
      'Add inventory slot validation and error handling',
      'Implement flask system cooldown mechanics',
      'Fix character progression calculation bug',
      'Update database schema for new quest system',
      'Optimize asset loading performance',
      'Add comprehensive tests for feature pods',
      'Refactor world area transition logic',
      'Implement AI-generated quest content',
      'Fix memory leak in entity management',
      'Add localization support for UI elements'
    ];
    
    return Array.from({ length: 50 }, (_, i) => ({
      hash: Math.random().toString(36).substring(2, 10),
      shortHash: Math.random().toString(36).substring(2, 8),
      message: messages[Math.floor(Math.random() * messages.length)],
      author: authors[Math.floor(Math.random() * authors.length)],
      email: 'user@example.com',
      date: new Date(Date.now() - i * 3600000 * Math.random() * 24).toISOString(),
      branch: i < 5 ? 'main' : ['feature/inventory-improvements', 'bugfix/flask-system-crash'][Math.floor(Math.random() * 2)],
      files: Math.floor(Math.random() * 10) + 1,
      additions: Math.floor(Math.random() * 200) + 10,
      deletions: Math.floor(Math.random() * 50) + 5
    }));
  };

  const generateMockChanges = () => {
    const files = [
      'features/inventory-system/inventory-system.pod.ts',
      'features/flask-system/flask-system.api.ts',
      'game-core/character/progression.ts',
      'features/agent-dashboard/components/GamePreview.jsx',
      'database/schema/quests.sql',
      'assets/ui/inventory-icons.png',
      'tests/unit/inventory-system.test.ts',
      'docs/api/inventory-api.md'
    ];
    
    const statuses = ['modified', 'added', 'deleted', 'renamed'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      file: files[Math.floor(Math.random() * files.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      staged: Math.random() > 0.5,
      additions: Math.floor(Math.random() * 50) + 1,
      deletions: Math.floor(Math.random() * 20) + 1,
      oldFile: Math.random() > 0.8 ? files[Math.floor(Math.random() * files.length)] : null
    }));
  };

  const startGitMonitoring = () => {
    const interval = setInterval(() => {
      // Simulate file changes
      setUncommittedChanges(prev => {
        if (Math.random() > 0.8) {
          return generateMockChanges();
        }
        return prev;
      });
    }, 10000);
    
    return () => clearInterval(interval);
  };

  const handleBranchSwitch = async (branchName) => {
    try {
      setIsLoading(true);
      
      // Simulate branch switching
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentBranch(branchName);
      setBranches(prev => prev.map(b => ({
        ...b,
        current: b.name === branchName
      })));
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Branch Switched',
          message: `Switched to branch: ${branchName}`
        });
      }
      
    } catch (error) {
      console.error('Branch switch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    try {
      if (!commitMessage.trim()) {
        if (eventBus) {
          eventBus.emit('system:alert', {
            level: 'warning',
            title: 'Commit Failed',
            message: 'Please enter a commit message'
          });
        }
        return;
      }
      
      setIsLoading(true);
      
      // Simulate commit
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newCommit = {
        hash: Math.random().toString(36).substring(2, 10),
        shortHash: Math.random().toString(36).substring(2, 8),
        message: commitMessage,
        author: 'Developer',
        email: 'user@example.com',
        date: new Date().toISOString(),
        branch: currentBranch,
        files: uncommittedChanges.length,
        additions: uncommittedChanges.reduce((sum, c) => sum + c.additions, 0),
        deletions: uncommittedChanges.reduce((sum, c) => sum + c.deletions, 0)
      };
      
      setCommits(prev => [newCommit, ...prev]);
      setUncommittedChanges([]);
      setCommitMessage('');
      setShowCommitModal(false);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Commit Created',
          message: `Successfully committed ${newCommit.files} files`
        });
      }
      
    } catch (error) {
      console.error('Commit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    try {
      setIsLoading(true);
      
      // Simulate push
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Push Complete',
          message: 'Successfully pushed changes to remote repository'
        });
      }
      
    } catch (error) {
      console.error('Push failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    try {
      setIsLoading(true);
      
      // Simulate pull
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Pull Complete',
          message: 'Successfully pulled latest changes from remote'
        });
      }
      
    } catch (error) {
      console.error('Pull failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'modified': return 'text-yellow-400';
      case 'added': return 'text-green-400';
      case 'deleted': return 'text-red-400';
      case 'renamed': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'modified': return <Edit className="w-3 h-3" />;
      case 'added': return <Plus className="w-3 h-3" />;
      case 'deleted': return <Trash2 className="w-3 h-3" />;
      case 'renamed': return <ArrowRight className="w-3 h-3" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
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
          <GitBranch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Git Integration</p>
          <p className="text-gray-500 text-sm">Select a project to manage version control</p>
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
              <GitBranch className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Git Integration</h2>
              {currentBranch && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-800 rounded">
                  <GitBranch className="w-3 h-3 text-green-400" />
                  <span className="text-sm text-white font-medium">{currentBranch}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePull}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
            >
              <Download className="w-4 h-4" />
              <span>Pull</span>
            </button>
            
            <button
              onClick={handlePush}
              disabled={isLoading || !gitStatus?.ahead}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded"
            >
              <Upload className="w-4 h-4" />
              <span>Push</span>
            </button>
            
            <button
              onClick={() => setShowCommitModal(true)}
              disabled={isLoading || uncommittedChanges.length === 0}
              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded"
            >
              <GitCommit className="w-4 h-4" />
              <span>Commit</span>
            </button>
            
            <button
              onClick={loadGitRepository}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Status Bar */}
        {gitStatus && (
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <ArrowUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Ahead</span>
              </div>
              <p className="text-lg font-bold text-white">{gitStatus.ahead}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <ArrowDown className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Behind</span>
              </div>
              <p className="text-lg font-bold text-white">{gitStatus.behind}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Staged</span>
              </div>
              <p className="text-lg font-bold text-white">{gitStatus.staged}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Edit className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Modified</span>
              </div>
              <p className="text-lg font-bold text-white">{gitStatus.unstaged}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-400">Untracked</span>
              </div>
              <p className="text-lg font-bold text-white">{gitStatus.untracked}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Navigation */}
          <div className="border-b border-gray-800 p-4">
            <div className="space-y-2">
              {[
                { id: 'overview', name: 'Overview', icon: <Eye className="w-4 h-4" /> },
                { id: 'changes', name: 'Changes', icon: <Diff className="w-4 h-4" /> },
                { id: 'branches', name: 'Branches', icon: <GitBranch className="w-4 h-4" /> },
                { id: 'history', name: 'History', icon: <History className="w-4 h-4" /> }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded transition-all ${
                    selectedView === view.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {view.icon}
                  <span>{view.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Content based on selected view */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedView === 'branches' && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Branches</h3>
                {branches.map((branch) => (
                  <div
                    key={branch.name}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      branch.current 
                        ? 'bg-green-600/20 border border-green-500' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    onClick={() => !branch.current && handleBranchSwitch(branch.name)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{branch.name}</span>
                      {branch.current && <CheckCircle className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="text-xs text-gray-400">
                      <div>by {branch.author} • {formatTimeAgo(branch.lastCommit)}</div>
                      {branch.upstream && (
                        <div className="flex items-center space-x-2 mt-1">
                          {branch.ahead > 0 && <span className="text-green-400">↑{branch.ahead}</span>}
                          {branch.behind > 0 && <span className="text-blue-400">↓{branch.behind}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedView === 'changes' && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Working Directory</h3>
                {uncommittedChanges.length > 0 ? (
                  uncommittedChanges.map((change, index) => (
                    <div key={index} className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className={getStatusColor(change.status)}>
                          {getStatusIcon(change.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">
                            {change.file.split('/').pop()}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {change.file}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            +{change.additions} -{change.deletions}
                          </div>
                        </div>
                        {change.staged && (
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-400">No changes</p>
                    <p className="text-gray-500 text-sm">Working directory is clean</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Main Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedView === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Repository Overview</h3>
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-white mb-3">Repository Info</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Remote URL</span>
                          <span className="text-white font-mono text-xs">{remoteInfo?.url}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Branch</span>
                          <span className="text-white">{currentBranch}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Branches</span>
                          <span className="text-white">{branches.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Commits</span>
                          <span className="text-white">{commits.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-white mb-3">Quick Actions</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowCommitModal(true)}
                          disabled={uncommittedChanges.length === 0}
                          className="w-full flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm"
                        >
                          <GitCommit className="w-4 h-4" />
                          <span>Commit Changes</span>
                        </button>
                        <button
                          onClick={() => setShowBranchModal(true)}
                          className="w-full flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                          <GitBranch className="w-4 h-4" />
                          <span>Create Branch</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedView === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Commit History</h3>
              <div className="space-y-3">
                {commits.slice(0, 20).map((commit) => (
                  <div
                    key={commit.hash}
                    className="bg-gray-900 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => setSelectedCommit(commit)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">{commit.message}</p>
                          <span className="text-xs text-gray-400 font-mono">{commit.shortHash}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>{commit.author}</span>
                          <span>{formatTimeAgo(commit.date)}</span>
                          <span>{commit.files} files</span>
                          <span className="text-green-400">+{commit.additions}</span>
                          <span className="text-red-400">-{commit.deletions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Commit Modal */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Create Commit</h3>
              <button
                onClick={() => setShowCommitModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Commit Message</label>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Enter commit message..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Changes to commit ({uncommittedChanges.length} files)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uncommittedChanges.map((change, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className={getStatusColor(change.status)}>
                        {getStatusIcon(change.status)}
                      </div>
                      <span className="text-gray-300">{change.file}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCommitModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
              >
                {isLoading ? 'Committing...' : 'Commit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitIntegration;