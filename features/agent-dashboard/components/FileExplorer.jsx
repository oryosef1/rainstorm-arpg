// File Explorer - Integrated file browser with Monaco Editor
// Advanced file management with AI-powered navigation and context awareness

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Folder, FolderOpen, File, FileText, Code, Image, Database,
  Search, Plus, MoreVertical, Edit, Trash2, Copy, Download,
  Terminal, GitBranch, Star, Clock, Eye, EyeOff, Settings,
  Maximize2, Minimize2, RotateCcw, Save, X, Play, ArrowLeft
} from 'lucide-react';

const FileExplorer = ({ eventBus, activeProject, activeSession, onFileSelect, height = '100%' }) => {
  const [fileTree, setFileTree] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFileTab, setActiveFileTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [bookmarkedFiles, setBookmarkedFiles] = useState([]);
  const [fileContents, setFileContents] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tree'); // tree, search, recent, bookmarks
  const [editorSettings, setEditorSettings] = useState({
    theme: 'vs-dark',
    fontSize: 14,
    wordWrap: 'on',
    minimap: { enabled: true },
    lineNumbers: 'on'
  });

  const monacoRef = useRef(null);
  const editorRef = useRef(null);

  // Initialize file explorer
  useEffect(() => {
    if (activeProject) {
      loadProjectFiles();
      loadRecentFiles();
      loadBookmarks();
    }
  }, [activeProject]);

  // Setup Monaco Editor
  useEffect(() => {
    initializeMonacoEditor();
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  const initializeMonacoEditor = async () => {
    try {
      // In a real implementation, this would load Monaco Editor from CDN or npm
      // For this mock, we'll simulate the Monaco Editor interface
      console.log('🎨 Initializing Monaco Editor...');
      
      // Mock Monaco Editor setup
      const mockMonaco = {
        editor: {
          create: (container, options) => ({
            setValue: (value) => console.log('Setting editor value:', value.substring(0, 100) + '...'),
            getValue: () => fileContents[activeFileTab] || '',
            getModel: () => ({ getLanguageId: () => 'typescript' }),
            updateOptions: (opts) => console.log('Updating editor options:', opts),
            layout: () => console.log('Laying out editor'),
            focus: () => console.log('Focusing editor'),
            dispose: () => console.log('Disposing editor'),
            onDidChangeModelContent: (callback) => {
              // Simulate content changes
              setTimeout(() => callback({ changes: [] }), 100);
            }
          }),
          defineTheme: (name, theme) => console.log('Defining theme:', name),
          setTheme: (theme) => console.log('Setting theme:', theme)
        },
        languages: {
          typescript: { typescriptDefaults: { setCompilerOptions: () => {} } },
          registerLanguage: () => {},
          setLanguageConfiguration: () => {},
          setMonarchTokensProvider: () => {}
        }
      };

      monacoRef.current = mockMonaco;
      console.log('✅ Monaco Editor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Monaco Editor:', error);
    }
  };

  const loadProjectFiles = async () => {
    if (!activeProject) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would scan the filesystem
      const mockFileTree = generateMockFileTree(activeProject);
      setFileTree(mockFileTree);
      
      // Expand root folder by default
      setExpandedFolders(new Set(['root']));
      
    } catch (error) {
      console.error('Failed to load project files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockFileTree = (project) => {
    // Generate a realistic file tree based on project type
    if (project.type === 'arpg') {
      return {
        id: 'root',
        name: project.name,
        type: 'folder',
        path: project.path,
        children: [
          {
            id: 'features',
            name: 'features',
            type: 'folder',
            path: `${project.path}/features`,
            children: [
              {
                id: 'agent-dashboard',
                name: 'agent-dashboard',
                type: 'folder',
                path: `${project.path}/features/agent-dashboard`,
                children: [
                  { id: 'dashboard-pod', name: 'agent-dashboard.pod.ts', type: 'file', path: `${project.path}/features/agent-dashboard/agent-dashboard.pod.ts`, language: 'typescript', size: 15420 },
                  { id: 'dashboard-api', name: 'agent-dashboard.api.ts', type: 'file', path: `${project.path}/features/agent-dashboard/agent-dashboard.api.ts`, language: 'typescript', size: 8950 },
                  {
                    id: 'components',
                    name: 'components',
                    type: 'folder',
                    path: `${project.path}/features/agent-dashboard/components`,
                    children: [
                      { id: 'dashboard-jsx', name: 'AgentDashboard.jsx', type: 'file', path: `${project.path}/features/agent-dashboard/components/AgentDashboard.jsx`, language: 'javascript', size: 12750 },
                      { id: 'claude-jsx', name: 'ClaudeInterface.jsx', type: 'file', path: `${project.path}/features/agent-dashboard/components/ClaudeInterface.jsx`, language: 'javascript', size: 9850 },
                      { id: 'project-hub-jsx', name: 'ProjectHub.jsx', type: 'file', path: `${project.path}/features/agent-dashboard/components/ProjectHub.jsx`, language: 'javascript', size: 18750 },
                      { id: 'session-manager-jsx', name: 'SessionManager.jsx', type: 'file', path: `${project.path}/features/agent-dashboard/components/SessionManager.jsx`, language: 'javascript', size: 16200 }
                    ]
                  },
                  {
                    id: 'services',
                    name: 'services',
                    type: 'folder',
                    path: `${project.path}/features/agent-dashboard/services`,
                    children: [
                      { id: 'claude-integration', name: 'claude-integration.ts', type: 'file', path: `${project.path}/features/agent-dashboard/services/claude-integration.ts`, language: 'typescript', size: 14200 },
                      { id: 'session-manager', name: 'session-manager.ts', type: 'file', path: `${project.path}/features/agent-dashboard/services/session-manager.ts`, language: 'typescript', size: 22100 },
                      { id: 'workflow-engine', name: 'workflow-engine.ts', type: 'file', path: `${project.path}/features/agent-dashboard/services/workflow-engine.ts`, language: 'typescript', size: 11500 }
                    ]
                  }
                ]
              },
              {
                id: 'inventory-system',
                name: 'inventory-system',
                type: 'folder',
                path: `${project.path}/features/inventory-system`,
                children: [
                  { id: 'inventory-pod', name: 'inventory-system.pod.ts', type: 'file', path: `${project.path}/features/inventory-system/inventory-system.pod.ts`, language: 'typescript', size: 9500 },
                  { id: 'inventory-api', name: 'inventory-system.api.ts', type: 'file', path: `${project.path}/features/inventory-system/inventory-system.api.ts`, language: 'typescript', size: 6750 }
                ]
              }
            ]
          },
          {
            id: 'game-core',
            name: 'game-core',
            type: 'folder',
            path: `${project.path}/game-core`,
            children: [
              { id: 'index-ts', name: 'index.ts', type: 'file', path: `${project.path}/game-core/index.ts`, language: 'typescript', size: 2100 },
              {
                id: 'character',
                name: 'character',
                type: 'folder',
                path: `${project.path}/game-core/character`,
                children: [
                  { id: 'character-progression', name: 'character-progression.ts', type: 'file', path: `${project.path}/game-core/character/progression/character-progression.ts`, language: 'typescript', size: 8400 },
                  { id: 'skill-gems', name: 'skill-gems.ts', type: 'file', path: `${project.path}/game-core/character/skills/skill-gems.ts`, language: 'typescript', size: 12300 }
                ]
              }
            ]
          },
          { id: 'package-json', name: 'package.json', type: 'file', path: `${project.path}/package.json`, language: 'json', size: 3200 },
          { id: 'tsconfig', name: 'tsconfig.json', type: 'file', path: `${project.path}/tsconfig.json`, language: 'json', size: 850 },
          { id: 'readme', name: 'README.md', type: 'file', path: `${project.path}/README.md`, language: 'markdown', size: 4750 },
          { id: 'claude-md', name: 'CLAUDE.md', type: 'file', path: `${project.path}/CLAUDE.md`, language: 'markdown', size: 15200 }
        ]
      };
    }
    
    // Default structure for other project types
    return {
      id: 'root',
      name: project.name,
      type: 'folder',
      path: project.path,
      children: [
        { id: 'src', name: 'src', type: 'folder', path: `${project.path}/src`, children: [] },
        { id: 'package-json', name: 'package.json', type: 'file', path: `${project.path}/package.json`, language: 'json', size: 2100 },
        { id: 'readme', name: 'README.md', type: 'file', path: `${project.path}/README.md`, language: 'markdown', size: 1500 }
      ]
    };
  };

  const loadRecentFiles = () => {
    // Load recent files from localStorage or session storage
    const recent = [
      { id: 'dashboard-jsx', name: 'AgentDashboard.jsx', path: '/features/agent-dashboard/components/AgentDashboard.jsx', lastOpened: Date.now() - 300000 },
      { id: 'project-hub-jsx', name: 'ProjectHub.jsx', path: '/features/agent-dashboard/components/ProjectHub.jsx', lastOpened: Date.now() - 600000 },
      { id: 'claude-md', name: 'CLAUDE.md', path: '/CLAUDE.md', lastOpened: Date.now() - 900000 }
    ];
    setRecentFiles(recent);
  };

  const loadBookmarks = () => {
    // Load bookmarked files from localStorage
    const bookmarks = [
      { id: 'claude-md', name: 'CLAUDE.md', path: '/CLAUDE.md' },
      { id: 'dashboard-pod', name: 'agent-dashboard.pod.ts', path: '/features/agent-dashboard/agent-dashboard.pod.ts' }
    ];
    setBookmarkedFiles(bookmarks);
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFileSelect = async (file) => {
    if (file.type === 'folder') {
      toggleFolder(file.id);
      return;
    }

    setSelectedFile(file);
    
    // Add to recent files
    setRecentFiles(prev => [
      { ...file, lastOpened: Date.now() },
      ...prev.filter(f => f.id !== file.id).slice(0, 9)
    ]);

    // Open file in editor
    await openFileInEditor(file);
    
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const openFileInEditor = async (file) => {
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles(prev => [...prev, file]);
    }
    
    setActiveFileTab(file.id);
    
    // Load file content
    if (!fileContents[file.id]) {
      const content = await loadFileContent(file);
      setFileContents(prev => ({ ...prev, [file.id]: content }));
    }
    
    // Update Monaco Editor
    if (editorRef.current && fileContents[file.id]) {
      editorRef.current.setValue(fileContents[file.id]);
    }
  };

  const loadFileContent = async (file) => {
    // In a real implementation, this would read the actual file
    // For now, return mock content based on file type
    switch (file.language) {
      case 'typescript':
        return `// ${file.name}\n// TypeScript file in ${file.path}\n\nexport interface ${file.name.split('.')[0]}Interface {\n  id: string;\n  name: string;\n}\n\nexport class ${file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '')} {\n  constructor(private config: any) {\n    console.log('Initialized ${file.name}');\n  }\n\n  public initialize(): void {\n    // Implementation here\n  }\n}`;
      
      case 'javascript':
        return `// ${file.name}\n// React component in ${file.path}\n\nimport React, { useState, useEffect } from 'react';\n\nconst ${file.name.split('.')[0]} = ({ props }) => {\n  const [state, setState] = useState(null);\n\n  useEffect(() => {\n    // Component initialization\n  }, []);\n\n  return (\n    <div className="component">\n      <h1>${file.name.split('.')[0]}</h1>\n    </div>\n  );\n};\n\nexport default ${file.name.split('.')[0]};`;
      
      case 'json':
        return `{\n  "name": "${activeProject?.name || 'project'}",\n  "version": "1.0.0",\n  "description": "Project configuration",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js",\n    "test": "jest",\n    "build": "webpack"\n  }\n}`;
      
      case 'markdown':
        return `# ${file.name.replace('.md', '')}\n\n## Overview\n\nThis document describes the ${file.name.replace('.md', '').toLowerCase()} for the project.\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Usage\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n\n## Contributing\n\nPlease read CONTRIBUTING.md for details on our code of conduct.`;
      
      default:
        return `// ${file.name}\n// File content for ${file.path}\n\n// This is a ${file.language} file\nconsole.log('Hello from ${file.name}');`;
    }
  };

  const closeFileTab = (fileId) => {
    setOpenFiles(prev => prev.filter(f => f.id !== fileId));
    
    if (activeFileTab === fileId) {
      const remainingFiles = openFiles.filter(f => f.id !== fileId);
      setActiveFileTab(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1].id : null);
    }
    
    // Remove from file contents cache
    setFileContents(prev => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const saveFile = async (fileId) => {
    if (!editorRef.current || !fileContents[fileId]) return;
    
    const content = editorRef.current.getValue();
    setFileContents(prev => ({ ...prev, [fileId]: content }));
    
    // In a real implementation, this would save to the filesystem
    console.log(`💾 Saving file ${fileId}`);
    
    if (eventBus) {
      eventBus.emit('system:alert', {
        level: 'success',
        title: 'File Saved',
        message: `${openFiles.find(f => f.id === fileId)?.name} has been saved`
      });
    }
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Mock search implementation
    const results = await searchFiles(query);
    setSearchResults(results);
  };

  const searchFiles = async (query) => {
    // In a real implementation, this would use ripgrep or similar
    const mockResults = [
      {
        file: { id: 'dashboard-jsx', name: 'AgentDashboard.jsx', path: '/features/agent-dashboard/components/AgentDashboard.jsx' },
        matches: [
          { line: 15, content: `  const [activeTab, setActiveTab] = useState('${query}');`, lineNumber: 15 },
          { line: 42, content: `    console.log('${query} initialized');`, lineNumber: 42 }
        ]
      },
      {
        file: { id: 'claude-md', name: 'CLAUDE.md', path: '/CLAUDE.md' },
        matches: [
          { line: 156, content: `## ${query.toUpperCase()} Development`, lineNumber: 156 }
        ]
      }
    ];
    
    return mockResults.filter(result => 
      result.file.name.toLowerCase().includes(query.toLowerCase()) ||
      result.matches.some(match => match.content.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const getFileIcon = (file) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ? 
        <FolderOpen className="w-4 h-4 text-blue-400" /> : 
        <Folder className="w-4 h-4 text-blue-400" />;
    }
    
    switch (file.language) {
      case 'typescript':
      case 'javascript':
        return <Code className="w-4 h-4 text-yellow-400" />;
      case 'json':
        return <Database className="w-4 h-4 text-green-400" />;
      case 'markdown':
        return <FileText className="w-4 h-4 text-gray-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderFileTree = (node, depth = 0) => {
    if (!node) return null;
    
    return (
      <div key={node.id}>
        <div
          className={`flex items-center space-x-2 py-1 px-2 cursor-pointer hover:bg-gray-800 ${
            selectedFile?.id === node.id ? 'bg-blue-600/20 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileSelect(node)}
        >
          {getFileIcon(node)}
          <span className="text-sm text-gray-300 truncate">{node.name}</span>
          {node.type === 'file' && (
            <span className="text-xs text-gray-500 ml-auto">
              {Math.round(node.size / 1024)}KB
            </span>
          )}
        </div>
        
        {node.type === 'folder' && expandedFolders.has(node.id) && node.children && (
          <div>
            {node.children.map(child => renderFileTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderSearchResults = () => (
    <div className="space-y-2">
      {searchResults.map((result, index) => (
        <div key={index} className="bg-gray-800 rounded p-3">
          <div
            className="flex items-center space-x-2 mb-2 cursor-pointer hover:text-blue-400"
            onClick={() => handleFileSelect(result.file)}
          >
            {getFileIcon(result.file)}
            <span className="text-sm font-medium text-gray-300">{result.file.name}</span>
            <span className="text-xs text-gray-500">{result.file.path}</span>
          </div>
          {result.matches.map((match, matchIndex) => (
            <div key={matchIndex} className="text-xs text-gray-400 font-mono pl-6">
              <span className="text-gray-600">L{match.lineNumber}:</span> {match.content}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderRecentFiles = () => (
    <div className="space-y-1">
      {recentFiles.map((file) => (
        <div
          key={file.id}
          className="flex items-center space-x-2 py-2 px-2 cursor-pointer hover:bg-gray-800 rounded"
          onClick={() => handleFileSelect(file)}
        >
          {getFileIcon(file)}
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-300 truncate block">{file.name}</span>
            <span className="text-xs text-gray-500 truncate block">{file.path}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{Math.round((Date.now() - file.lastOpened) / 60000)}m ago</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBookmarks = () => (
    <div className="space-y-1">
      {bookmarkedFiles.map((file) => (
        <div
          key={file.id}
          className="flex items-center space-x-2 py-2 px-2 cursor-pointer hover:bg-gray-800 rounded"
          onClick={() => handleFileSelect(file)}
        >
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-300 truncate block">{file.name}</span>
            <span className="text-xs text-gray-500 truncate block">{file.path}</span>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-950" style={{ height }}>
      {/* File Explorer Sidebar */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Explorer</h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-1 rounded ${showSearch ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Search className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-white">
                <Plus className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-white">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  performSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          
          {/* View Mode Tabs */}
          <div className="flex space-x-1 mt-3">
            {[
              { id: 'tree', label: 'Files', icon: <Folder className="w-3 h-3" /> },
              { id: 'search', label: 'Search', icon: <Search className="w-3 h-3" /> },
              { id: 'recent', label: 'Recent', icon: <Clock className="w-3 h-3" /> },
              { id: 'bookmarks', label: 'Starred', icon: <Star className="w-3 h-3" /> }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center space-x-1 px-2 py-1 text-xs rounded ${
                  viewMode === mode.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {viewMode === 'tree' && fileTree && renderFileTree(fileTree)}
          {viewMode === 'search' && searchQuery && renderSearchResults()}
          {viewMode === 'recent' && renderRecentFiles()}
          {viewMode === 'bookmarks' && renderBookmarks()}
          
          {viewMode === 'search' && !searchQuery && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2" />
              <p>Enter a search query to find files</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* File Tabs */}
        {openFiles.length > 0 && (
          <div className="flex bg-gray-900 border-b border-gray-800 overflow-x-auto">
            {openFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center space-x-2 px-4 py-2 border-r border-gray-800 cursor-pointer min-w-0 ${
                  activeFileTab === file.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                onClick={() => setActiveFileTab(file.id)}
              >
                {getFileIcon(file)}
                <span className="text-sm truncate">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(file.id);
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Editor */}
        {activeFileTab ? (
          <div className="flex-1 relative">
            {/* Monaco Editor would be rendered here */}
            <div className="absolute inset-0 bg-gray-950 text-gray-300 p-4 font-mono text-sm overflow-auto">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">
                    {openFiles.find(f => f.id === activeFileTab)?.path}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => saveFile(activeFileTab)}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap">
                {fileContents[activeFileTab] || 'Loading...'}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-950">
            <div className="text-center">
              <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No file selected</p>
              <p className="text-gray-500 text-sm">Open a file from the explorer to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;