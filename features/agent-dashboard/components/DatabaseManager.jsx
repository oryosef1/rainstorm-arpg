// Database Manager - Visual database management interface for player data
// Comprehensive database control with real-time monitoring and MCP integration

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, Table, Search, Plus, Edit, Trash2, Download, Upload,
  Play, Pause, RotateCcw, Settings, BarChart3, Users, Package,
  Eye, Filter, Sort, ChevronDown, ChevronRight, Activity,
  Server, Cpu, HardDrive, Zap, AlertTriangle, CheckCircle,
  FileText, Code, Terminal, Clock, Layers, Grid, TrendingUp
} from 'lucide-react';

const DatabaseManager = ({ eventBus, activeProject }) => {
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [selectedDatabase, setSelectedDatabase] = useState('rainstorm_game');
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [tableSchema, setTableSchema] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [tables, setTables] = useState([]);
  const [queryHistory, setQueryHistory] = useState([]);
  const [activeQuery, setActiveQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    activeConnections: 0,
    queryTime: 0,
    throughput: 0,
    cacheHitRatio: 0
  });
  const [playerAnalytics, setPlayerAnalytics] = useState({
    totalPlayers: 0,
    activeToday: 0,
    newSignups: 0,
    avgSessionTime: 0
  });
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: null,
    nextBackup: null,
    isRunning: false
  });

  // Initialize database connection
  useEffect(() => {
    if (activeProject?.type === 'arpg') {
      initializeDatabaseConnection();
      loadDatabases();
      startPerformanceMonitoring();
    }
  }, [activeProject]);

  const initializeDatabaseConnection = async () => {
    try {
      console.log('🔌 Connecting to database...');
      
      // In a real implementation, this would use MCP PostgreSQL server
      // For now, we'll simulate the connection
      setConnectionStatus('connecting');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnectionStatus('connected');
      
      console.log('✅ Database connected successfully');
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Database Connected',
          message: 'Successfully connected to RainStorm ARPG database'
        });
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      setConnectionStatus('error');
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'error',
          title: 'Database Connection Failed',
          message: error.message
        });
      }
    }
  };

  const loadDatabases = async () => {
    try {
      // Mock database structure for RainStorm ARPG
      const mockDatabases = [
        {
          name: 'rainstorm_game',
          size: '245 MB',
          tables: 12,
          connections: 3,
          status: 'active'
        },
        {
          name: 'rainstorm_analytics',
          size: '89 MB',
          tables: 8,
          connections: 1,
          status: 'active'
        },
        {
          name: 'rainstorm_cache',
          size: '156 MB',
          tables: 4,
          connections: 2,
          status: 'active'
        }
      ];
      
      setDatabases(mockDatabases);
      
      // Load tables for default database
      await loadTables('rainstorm_game');
      
    } catch (error) {
      console.error('Failed to load databases:', error);
    }
  };

  const loadTables = async (databaseName) => {
    try {
      setSelectedDatabase(databaseName);
      
      // Mock table structure
      const mockTables = {
        'rainstorm_game': [
          {
            name: 'players',
            rows: 15420,
            size: '45 MB',
            type: 'base',
            description: 'Player account information',
            columns: ['id', 'username', 'email', 'created_at', 'last_login', 'level', 'experience']
          },
          {
            name: 'characters',
            rows: 23150,
            size: '78 MB',
            type: 'base',
            description: 'Player characters and builds',
            columns: ['id', 'player_id', 'name', 'class', 'level', 'created_at', 'last_played']
          },
          {
            name: 'inventories',
            rows: 45780,
            size: '89 MB',
            type: 'base',
            description: 'Character inventory items',
            columns: ['id', 'character_id', 'item_id', 'quantity', 'slot', 'properties']
          },
          {
            name: 'items',
            rows: 8950,
            size: '23 MB',
            type: 'reference',
            description: 'Item definitions and stats',
            columns: ['id', 'name', 'type', 'rarity', 'level', 'stats', 'description']
          },
          {
            name: 'quests',
            rows: 1250,
            size: '12 MB',
            type: 'reference',
            description: 'Quest definitions and rewards',
            columns: ['id', 'name', 'description', 'requirements', 'rewards', 'type']
          },
          {
            name: 'player_quests',
            rows: 89450,
            size: '34 MB',
            type: 'base',
            description: 'Player quest progress',
            columns: ['id', 'player_id', 'quest_id', 'status', 'progress', 'completed_at']
          },
          {
            name: 'game_sessions',
            rows: 125670,
            size: '67 MB',
            type: 'analytics',
            description: 'Player session data',
            columns: ['id', 'player_id', 'start_time', 'end_time', 'duration', 'actions']
          },
          {
            name: 'economy_transactions',
            rows: 234560,
            size: '89 MB',
            type: 'analytics',
            description: 'In-game economy transactions',
            columns: ['id', 'player_id', 'type', 'amount', 'item_id', 'timestamp']
          }
        ]
      };
      
      setTables(mockTables[databaseName] || []);
      
      // Load player analytics
      loadPlayerAnalytics();
      
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const loadTableData = async (tableName) => {
    try {
      setSelectedTable(tableName);
      
      // Generate mock data based on table
      const mockData = generateMockTableData(tableName);
      setTableData(mockData.rows);
      setTableSchema(mockData.schema);
      
    } catch (error) {
      console.error('Failed to load table data:', error);
    }
  };

  const generateMockTableData = (tableName) => {
    switch (tableName) {
      case 'players':
        return {
          schema: [
            { name: 'id', type: 'INTEGER', nullable: false, primary: true },
            { name: 'username', type: 'VARCHAR(50)', nullable: false, unique: true },
            { name: 'email', type: 'VARCHAR(100)', nullable: false, unique: true },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            { name: 'last_login', type: 'TIMESTAMP', nullable: true },
            { name: 'level', type: 'INTEGER', nullable: false, default: 1 },
            { name: 'experience', type: 'BIGINT', nullable: false, default: 0 }
          ],
          rows: Array.from({ length: 50 }, (_, i) => ({
            id: 1000 + i,
            username: `Player${1000 + i}`,
            email: `player${1000 + i}@example.com`,
            created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            last_login: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            level: Math.floor(Math.random() * 100) + 1,
            experience: Math.floor(Math.random() * 1000000)
          }))
        };
      
      case 'characters':
        return {
          schema: [
            { name: 'id', type: 'INTEGER', nullable: false, primary: true },
            { name: 'player_id', type: 'INTEGER', nullable: false, foreign: 'players.id' },
            { name: 'name', type: 'VARCHAR(50)', nullable: false },
            { name: 'class', type: 'VARCHAR(30)', nullable: false },
            { name: 'level', type: 'INTEGER', nullable: false, default: 1 },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            { name: 'last_played', type: 'TIMESTAMP', nullable: true }
          ],
          rows: Array.from({ length: 50 }, (_, i) => ({
            id: 2000 + i,
            player_id: 1000 + Math.floor(i / 2),
            name: ['Warrior', 'Mage', 'Rogue', 'Archer', 'Paladin'][Math.floor(Math.random() * 5)] + `${i}`,
            class: ['Warrior', 'Mage', 'Rogue', 'Archer', 'Paladin'][Math.floor(Math.random() * 5)],
            level: Math.floor(Math.random() * 80) + 1,
            created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
            last_played: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
          }))
        };
      
      default:
        return {
          schema: [
            { name: 'id', type: 'INTEGER', nullable: false, primary: true },
            { name: 'data', type: 'TEXT', nullable: true }
          ],
          rows: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            data: `Sample data ${i + 1}`
          }))
        };
    }
  };

  const loadPlayerAnalytics = () => {
    // Mock player analytics
    setPlayerAnalytics({
      totalPlayers: 15420,
      activeToday: 2847,
      newSignups: 234,
      avgSessionTime: 45.6
    });
  };

  const startPerformanceMonitoring = () => {
    const updateMetrics = () => {
      setPerformanceMetrics({
        activeConnections: Math.floor(Math.random() * 10) + 5,
        queryTime: Math.round((Math.random() * 50 + 10) * 100) / 100,
        throughput: Math.floor(Math.random() * 1000) + 500,
        cacheHitRatio: Math.round((Math.random() * 20 + 80) * 100) / 100
      });
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    
    return () => clearInterval(interval);
  };

  const executeQuery = async (query) => {
    try {
      setIsExecutingQuery(true);
      setActiveQuery(query);
      
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Mock query results
      const mockResults = {
        query,
        duration: Math.round((Math.random() * 500 + 100) * 100) / 100,
        rowsAffected: Math.floor(Math.random() * 100) + 1,
        timestamp: new Date().toISOString(),
        data: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          result: `Query result ${i + 1}`,
          value: Math.floor(Math.random() * 1000)
        }))
      };
      
      setQueryResults(mockResults);
      setQueryHistory(prev => [mockResults, ...prev.slice(0, 19)]);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Query Executed',
          message: `Query completed in ${mockResults.duration}ms`
        });
      }
      
    } catch (error) {
      console.error('Query execution failed:', error);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'error',
          title: 'Query Failed',
          message: error.message
        });
      }
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const createBackup = async () => {
    try {
      setBackupStatus(prev => ({ ...prev, isRunning: true }));
      
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setBackupStatus({
        lastBackup: new Date().toISOString(),
        nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isRunning: false
      });
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'Backup Complete',
          message: 'Database backup created successfully'
        });
      }
      
    } catch (error) {
      setBackupStatus(prev => ({ ...prev, isRunning: false }));
      console.error('Backup failed:', error);
    }
  };

  const getConnectionStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <Clock className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!activeProject || activeProject.type !== 'arpg') {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Database Manager</p>
          <p className="text-gray-500 text-sm">
            {!activeProject ? 'Select an ARPG project to manage databases' : 'Database management is only available for ARPG projects'}
          </p>
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
              <Database className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Database Manager</h2>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${getConnectionStatusColor(connectionStatus)}`}>
                {getConnectionStatusIcon(connectionStatus)}
                <span className="text-sm font-medium capitalize">{connectionStatus}</span>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={createBackup}
              disabled={backupStatus.isRunning}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded"
            >
              {backupStatus.isRunning ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Backup</span>
            </button>
            
            <button
              onClick={() => setShowQueryBuilder(!showQueryBuilder)}
              className={`flex items-center space-x-1 px-3 py-2 rounded ${
                showQueryBuilder ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Query</span>
            </button>
            
            <button
              onClick={() => loadTables(selectedDatabase)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Players</span>
            </div>
            <p className="text-lg font-bold text-white">{playerAnalytics.totalPlayers.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <p className="text-lg font-bold text-white">{playerAnalytics.activeToday.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">New</span>
            </div>
            <p className="text-lg font-bold text-white">{playerAnalytics.newSignups}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Connections</span>
            </div>
            <p className="text-lg font-bold text-white">{performanceMetrics.activeConnections}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">Query Time</span>
            </div>
            <p className="text-lg font-bold text-white">{performanceMetrics.queryTime}ms</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-400">Cache Hit</span>
            </div>
            <p className="text-lg font-bold text-white">{performanceMetrics.cacheHitRatio}%</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Database List */}
          <div className="border-b border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Databases</h3>
            <div className="space-y-2">
              {databases.map((db) => (
                <div
                  key={db.name}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedDatabase === db.name 
                      ? 'bg-blue-600/20 border border-blue-500' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => loadTables(db.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Server className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">{db.name}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      db.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <div>{db.tables} tables • {db.size}</div>
                    <div>{db.connections} connections</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Table List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Tables</h3>
            <div className="space-y-1">
              {tables.map((table) => (
                <div
                  key={table.name}
                  className={`p-2 rounded cursor-pointer transition-all ${
                    selectedTable === table.name 
                      ? 'bg-blue-600/20 border-l-2 border-blue-500' 
                      : 'hover:bg-gray-800'
                  }`}
                  onClick={() => loadTableData(table.name)}
                >
                  <div className="flex items-center space-x-2">
                    <Table className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">{table.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {table.rows.toLocaleString()} rows • {table.size}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Panel */}
        <div className="flex-1 flex flex-col">
          {showQueryBuilder && (
            <div className="border-b border-gray-800 p-4 bg-gray-900">
              <div className="flex items-center space-x-2 mb-3">
                <Terminal className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-medium text-white">SQL Query</h3>
              </div>
              <div className="flex space-x-2">
                <textarea
                  value={activeQuery}
                  onChange={(e) => setActiveQuery(e.target.value)}
                  placeholder="SELECT * FROM players WHERE level > 50;"
                  className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  rows="3"
                />
                <button
                  onClick={() => executeQuery(activeQuery)}
                  disabled={!activeQuery.trim() || isExecutingQuery}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded"
                >
                  {isExecutingQuery ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Data Display */}
          <div className="flex-1 overflow-auto p-4">
            {selectedTable && tableData.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{selectedTable}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      {tableData.length} rows displayed
                    </span>
                    <button className="p-1 text-gray-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Table */}
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800">
                        <tr>
                          {tableSchema?.map((column) => (
                            <th key={column.name} className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              <div className="flex items-center space-x-1">
                                <span>{column.name}</span>
                                {column.primary && <span className="text-yellow-400">🔑</span>}
                                {column.foreign && <span className="text-blue-400">🔗</span>}
                              </div>
                              <div className="text-xs text-gray-500 font-normal capitalize">
                                {column.type}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {tableData.slice(0, 20).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-800/50">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-3 text-sm text-gray-300">
                                {typeof value === 'string' && value.includes('T') && value.includes('Z') 
                                  ? formatTimestamp(value)
                                  : String(value)
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : queryResults ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Query Results</h3>
                  <div className="text-sm text-gray-400">
                    {queryResults.rowsAffected} rows • {queryResults.duration}ms
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-300 font-mono mb-4">
                    {queryResults.query}
                  </pre>
                  
                  {queryResults.data && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-800">
                          <tr>
                            {Object.keys(queryResults.data[0] || {}).map((key) => (
                              <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {queryResults.data.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-800/50">
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 text-sm text-gray-300">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Table className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Database Manager</p>
                  <p className="text-gray-500 text-sm">Select a table to view data or execute a query</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManager;