// Claude Interface Component - Main Claude interaction interface
// Provides chat-like interface for Claude operations with real-time feedback

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Settings, Play, Square, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const ClaudeInterface = ({ onExecute, activeSessions = [], isConnected = false }) => {
  const [message, setMessage] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState('feature-builder');
  const [selectedProfile, setSelectedProfile] = useState('trusted-developer');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [permissions, setPermissions] = useState(['read-codebase', 'write-code']);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const specialists = {
    'feature-builder': {
      name: 'Feature Builder',
      icon: '🏗️',
      description: 'Build complete features from requirements',
      defaultPrompt: 'Build this feature: '
    },
    'code-reviewer': {
      name: 'Code Reviewer',
      icon: '🔍',
      description: 'Review code for quality and best practices',
      defaultPrompt: 'Please review this code: '
    },
    'bug-hunter': {
      name: 'Bug Hunter',
      icon: '🐛',
      description: 'Find and fix bugs systematically',
      defaultPrompt: 'Debug this issue: '
    },
    'optimizer': {
      name: 'Optimizer',
      icon: '⚡',
      description: 'Optimize code for performance',
      defaultPrompt: 'Optimize this: '
    },
    'documenter': {
      name: 'Documenter',
      icon: '📚',
      description: 'Create comprehensive documentation',
      defaultPrompt: 'Document this: '
    },
    'tester': {
      name: 'Tester',
      icon: '🧪',
      description: 'Write comprehensive tests',
      defaultPrompt: 'Write tests for: '
    }
  };
  
  const profiles = {
    'trusted-developer': { name: 'Trusted Developer', color: 'bg-green-500' },
    'code-reviewer': { name: 'Code Reviewer', color: 'bg-blue-500' },
    'feature-builder': { name: 'Feature Builder', color: 'bg-purple-500' },
    'bug-hunter': { name: 'Bug Hunter', color: 'bg-red-500' },
    'emergency-fixer': { name: 'Emergency Fixer', color: 'bg-orange-500' },
    'read-only': { name: 'Read Only', color: 'bg-gray-500' }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [executionHistory]);
  
  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isExecuting) return;
    
    const execution = {
      id: `exec_${Date.now()}`,
      timestamp: Date.now(),
      specialist: selectedSpecialist,
      profile: selectedProfile,
      message: message.trim(),
      status: 'executing',
      permissions: [...permissions]
    };
    
    setExecutionHistory(prev => [...prev, execution]);
    setMessage('');
    setIsExecuting(true);
    
    try {
      const config = showAdvanced && customPrompt ? {
        systemPrompt: customPrompt,
        userPrompt: message,
        permissions,
        context: { type: 'custom' }
      } : {
        specialist: selectedSpecialist,
        input: message,
        permissions,
        profile: selectedProfile
      };
      
      // Call parent execution handler
      const result = await onExecute(config);
      
      // Update execution with result
      setExecutionHistory(prev => 
        prev.map(exec => 
          exec.id === execution.id 
            ? { ...exec, status: 'completed', result, duration: Date.now() - exec.timestamp }
            : exec
        )
      );
      
    } catch (error) {
      // Update execution with error
      setExecutionHistory(prev => 
        prev.map(exec => 
          exec.id === execution.id 
            ? { ...exec, status: 'error', error: error.message, duration: Date.now() - exec.timestamp }
            : exec
        )
      );
    } finally {
      setIsExecuting(false);
    }
  }, [message, selectedSpecialist, selectedProfile, permissions, showAdvanced, customPrompt, onExecute, isExecuting]);
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const addPermission = (permission) => {
    if (!permissions.includes(permission)) {
      setPermissions([...permissions, permission]);
    }
  };
  
  const removePermission = (permission) => {
    setPermissions(permissions.filter(p => p !== permission));
  };
  
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'executing': return <Clock className="w-4 h-4 animate-spin text-blue-400" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'executing': return 'border-blue-500 bg-blue-500/10';
      case 'completed': return 'border-green-500 bg-green-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🤖</div>
          <div>
            <h3 className="text-lg font-semibold text-white">Claude Interface</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              <span>•</span>
              <span>{activeSessions.length} active sessions</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Advanced Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
      
      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="p-4 border-b border-gray-700 bg-gray-800/50 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom System Prompt
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter custom system prompt..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Permissions
            </label>
            <div className="flex flex-wrap gap-2">
              {permissions.map(permission => (
                <span
                  key={permission}
                  className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded-full"
                >
                  {permission}
                  <button
                    onClick={() => removePermission(permission)}
                    className="ml-1 text-blue-200 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {['read-all', 'write-code', 'run-tests', 'create-files', 'analyze-logs'].map(perm => (
                !permissions.includes(perm) && (
                  <button
                    key={perm}
                    onClick={() => addPermission(perm)}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-white border border-gray-600 rounded"
                  >
                    + {perm}
                  </button>
                )
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Specialist & Profile Selection */}
      {!showAdvanced && (
        <div className="p-4 border-b border-gray-700 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Claude Specialist
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(specialists).map(([key, specialist]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSpecialist(key)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedSpecialist === key
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{specialist.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{specialist.name}</div>
                      <div className="text-xs text-gray-400">{specialist.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Permission Profile
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(profiles).map(([key, profile]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProfile(key)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    selectedProfile === key
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${profile.color}`} />
                    <span>{profile.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Execution History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {executionHistory.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-4">🤖</div>
            <h4 className="text-lg font-medium mb-2">Ready to assist!</h4>
            <p className="text-sm">Select a specialist and describe what you'd like me to do.</p>
          </div>
        ) : (
          executionHistory.map((execution) => (
            <div key={execution.id} className={`border rounded-lg p-4 ${getStatusColor(execution.status)}`}>
              {/* Request */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{specialists[execution.specialist]?.icon}</span>
                    <span className="font-medium text-white">{specialists[execution.specialist]?.name}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">{profiles[execution.profile]?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    {getStatusIcon(execution.status)}
                    <span>{new Date(execution.timestamp).toLocaleTimeString()}</span>
                    {execution.duration && <span>• {formatDuration(execution.duration)}</span>}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded p-3 text-sm text-gray-300">
                  {execution.message}
                </div>
              </div>
              
              {/* Response */}
              {execution.result && (
                <div className="border-t border-gray-600 pt-3">
                  <div className="text-sm">
                    <div className="font-medium text-green-400 mb-2">✅ Response:</div>
                    <div className="bg-gray-800/30 rounded p-3 text-gray-300 whitespace-pre-wrap">
                      {typeof execution.result === 'object' ? 
                        execution.result.response || JSON.stringify(execution.result, null, 2) :
                        execution.result
                      }
                    </div>
                    {execution.result.toolsUsed && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {execution.result.toolsUsed.map(tool => (
                          <span key={tool} className="inline-block px-2 py-1 bg-blue-600/30 text-blue-300 text-xs rounded">
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Error */}
              {execution.error && (
                <div className="border-t border-gray-600 pt-3">
                  <div className="text-sm">
                    <div className="font-medium text-red-400 mb-2">❌ Error:</div>
                    <div className="bg-red-900/20 border border-red-700/50 rounded p-3 text-red-300">
                      {execution.error}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                showAdvanced 
                  ? "Enter your request..."
                  : `${specialists[selectedSpecialist]?.defaultPrompt}your request...`
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              disabled={isExecuting}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || isExecuting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isExecuting ? (
              <>
                <Square className="w-4 h-4" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute</span>
              </>
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          Press Enter to execute, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
};

export default ClaudeInterface;