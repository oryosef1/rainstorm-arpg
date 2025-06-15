// Player Analytics - Player analytics and A/B testing framework
// Comprehensive player behavior analysis and experimental testing platform

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, BarChart3, TrendingUp, Target, Eye, TestTube, Activity,
  Clock, Calendar, Award, Flag, Shield, Zap, Heart, Star,
  Play, Pause, RefreshCw, Settings, Download, Filter, Search,
  ChevronUp, ChevronDown, ArrowRight, Circle, Square, Triangle,
  Layers, Network, Cpu, HardDrive, Database, Monitor, Brain
} from 'lucide-react';

const PlayerAnalytics = ({ eventBus, activeProject }) => {
  const [playerMetrics, setPlayerMetrics] = useState({});
  const [behaviorData, setBehaviorData] = useState([]);
  const [abTests, setAbTests] = useState([]);
  const [playerSegments, setPlayerSegments] = useState([]);
  const [analyticsOverview, setAnalyticsOverview] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [liveMetrics, setLiveMetrics] = useState({});
  const [conversionFunnels, setConversionFunnels] = useState([]);
  const [retentionData, setRetentionData] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize player analytics
  useEffect(() => {
    if (activeProject) {
      loadPlayerAnalytics();
      loadABTests();
      loadPlayerSegments();
      startRealTimeAnalytics();
    }
  }, [activeProject, selectedTimeRange]);

  const loadPlayerAnalytics = async () => {
    try {
      setIsAnalyzing(true);
      
      // Load comprehensive analytics data
      const analyticsData = await loadAnalyticsData();
      setPlayerMetrics(analyticsData.metrics);
      setBehaviorData(analyticsData.behavior);
      setAnalyticsOverview(analyticsData.overview);
      setConversionFunnels(analyticsData.funnels);
      setRetentionData(analyticsData.retention);
      
    } catch (error) {
      console.error('Failed to load player analytics:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadAnalyticsData = async () => {
    // Simulate loading analytics data
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      metrics: generatePlayerMetrics(),
      behavior: generateBehaviorData(),
      overview: generateAnalyticsOverview(),
      funnels: generateConversionFunnels(),
      retention: generateRetentionData()
    };
  };

  const generatePlayerMetrics = () => {
    return {
      totalPlayers: 15420,
      activeUsers: {
        daily: 2847,
        weekly: 8934,
        monthly: 13567
      },
      newPlayers: {
        today: 234,
        week: 1789,
        month: 6234
      },
      engagement: {
        avgSessionTime: 45.6,
        sessionsPerUser: 3.4,
        bounceRate: 12.8,
        returnRate: 67.3
      },
      gameplay: {
        avgLevel: 23.7,
        completionRate: 34.5,
        questsCompleted: 89456,
        itemsCrafted: 234567
      },
      monetization: {
        conversionRate: 8.4,
        avgRevenuePerUser: 23.45,
        lifetimeValue: 156.78,
        churnRate: 5.2
      }
    };
  };

  const generateBehaviorData = () => {
    return [
      {
        id: 'behavior-1',
        event: 'character_creation',
        count: 3456,
        uniqueUsers: 2789,
        avgDuration: 8.4,
        conversionRate: 89.3,
        trend: 'up',
        change: 12.5
      },
      {
        id: 'behavior-2',
        event: 'first_quest_completed',
        count: 2456,
        uniqueUsers: 2134,
        avgDuration: 15.7,
        conversionRate: 76.5,
        trend: 'up',
        change: 8.7
      },
      {
        id: 'behavior-3',
        event: 'inventory_interaction',
        count: 45678,
        uniqueUsers: 5678,
        avgDuration: 2.3,
        conversionRate: 95.4,
        trend: 'stable',
        change: 1.2
      },
      {
        id: 'behavior-4',
        event: 'item_crafted',
        count: 8934,
        uniqueUsers: 3456,
        avgDuration: 12.8,
        conversionRate: 67.8,
        trend: 'down',
        change: -4.3
      },
      {
        id: 'behavior-5',
        event: 'combat_encounter',
        count: 234567,
        uniqueUsers: 7890,
        avgDuration: 1.8,
        conversionRate: 89.7,
        trend: 'up',
        change: 15.6
      }
    ];
  };

  const generateAnalyticsOverview = () => {
    return {
      playerGrowth: {
        rate: 18.4,
        trend: 'up',
        projection: 23456
      },
      engagement: {
        score: 87.3,
        trend: 'up',
        topFeatures: ['Combat System', 'Inventory Management', 'Quest System']
      },
      retention: {
        day1: 78.4,
        day7: 45.6,
        day30: 23.4,
        trend: 'stable'
      },
      performance: {
        crashRate: 0.3,
        loadTime: 2.4,
        fps: 58.7,
        satisfaction: 4.6
      }
    };
  };

  const generateConversionFunnels = () => {
    return [
      {
        id: 'onboarding-funnel',
        name: 'Player Onboarding',
        stages: [
          { name: 'Game Started', users: 10000, conversion: 100 },
          { name: 'Tutorial Completed', users: 8500, conversion: 85 },
          { name: 'Character Created', users: 7800, conversion: 78 },
          { name: 'First Quest Started', users: 7200, conversion: 72 },
          { name: 'First Level Up', users: 6800, conversion: 68 },
          { name: 'Second Session', users: 5400, conversion: 54 }
        ],
        conversionRate: 54,
        improvement: 8.3
      },
      {
        id: 'monetization-funnel',
        name: 'Monetization Flow',
        stages: [
          { name: 'Shop Visited', users: 5000, conversion: 100 },
          { name: 'Item Viewed', users: 3500, conversion: 70 },
          { name: 'Cart Added', users: 1500, conversion: 30 },
          { name: 'Checkout Started', users: 800, conversion: 16 },
          { name: 'Payment Completed', users: 650, conversion: 13 }
        ],
        conversionRate: 13,
        improvement: -2.1
      }
    ];
  };

  const generateRetentionData = () => {
    return {
      cohorts: [
        { cohort: 'Week 1', day0: 100, day1: 78, day7: 45, day14: 32, day30: 23 },
        { cohort: 'Week 2', day0: 100, day1: 82, day7: 48, day14: 34, day30: 25 },
        { cohort: 'Week 3', day0: 100, day1: 85, day7: 52, day14: 38, day30: 28 },
        { cohort: 'Week 4', day0: 100, day1: 88, day7: 55, day14: 42, day30: 31 }
      ],
      averageRetention: {
        day1: 83.25,
        day7: 50.0,
        day14: 36.5,
        day30: 26.75
      }
    };
  };

  const loadABTests = () => {
    const tests = [
      {
        id: 'test-1',
        name: 'Combat UI Layout',
        status: 'running',
        startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        participants: 2847,
        variants: [
          { 
            name: 'Control', 
            traffic: 50, 
            conversions: 156, 
            conversionRate: 12.4,
            confidence: 95.2
          },
          { 
            name: 'New Layout', 
            traffic: 50, 
            conversions: 189, 
            conversionRate: 15.1,
            confidence: 97.8
          }
        ],
        metric: 'Combat Engagement',
        significance: 'significant',
        winner: 'New Layout',
        improvement: 21.8
      },
      {
        id: 'test-2',
        name: 'Inventory Icon Design',
        status: 'completed',
        startDate: Date.now() - 21 * 24 * 60 * 60 * 1000,
        endDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
        participants: 4567,
        variants: [
          { 
            name: 'Original Icons', 
            traffic: 50, 
            conversions: 234, 
            conversionRate: 10.2,
            confidence: 88.4
          },
          { 
            name: 'Updated Icons', 
            traffic: 50, 
            conversions: 267, 
            conversionRate: 11.7,
            confidence: 91.6
          }
        ],
        metric: 'Inventory Usage',
        significance: 'significant',
        winner: 'Updated Icons',
        improvement: 14.7
      },
      {
        id: 'test-3',
        name: 'Quest Reward Animation',
        status: 'planning',
        startDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 17 * 24 * 60 * 60 * 1000,
        participants: 0,
        variants: [
          { 
            name: 'Current Animation', 
            traffic: 50, 
            conversions: 0, 
            conversionRate: 0,
            confidence: 0
          },
          { 
            name: 'Enhanced Animation', 
            traffic: 50, 
            conversions: 0, 
            conversionRate: 0,
            confidence: 0
          }
        ],
        metric: 'Quest Completion Rate',
        significance: 'pending',
        winner: null,
        improvement: 0
      }
    ];
    
    setAbTests(tests);
  };

  const loadPlayerSegments = () => {
    const segments = [
      {
        id: 'new-players',
        name: 'New Players',
        description: 'Players who joined in the last 7 days',
        count: 1789,
        percentage: 11.6,
        avgSessionTime: 28.4,
        retentionRate: 78.3,
        conversionRate: 6.8,
        color: 'text-green-400'
      },
      {
        id: 'casual-players',
        name: 'Casual Players',
        description: 'Players with 1-3 sessions per week',
        count: 6234,
        percentage: 40.4,
        avgSessionTime: 32.7,
        retentionRate: 45.6,
        conversionRate: 8.2,
        color: 'text-blue-400'
      },
      {
        id: 'core-players',
        name: 'Core Players',
        description: 'Players with 4-10 sessions per week',
        count: 5678,
        percentage: 36.8,
        avgSessionTime: 56.8,
        retentionRate: 78.9,
        conversionRate: 15.4,
        color: 'text-purple-400'
      },
      {
        id: 'hardcore-players',
        name: 'Hardcore Players',
        description: 'Players with 10+ sessions per week',
        count: 1719,
        percentage: 11.2,
        avgSessionTime: 89.3,
        retentionRate: 92.1,
        conversionRate: 34.7,
        color: 'text-orange-400'
      }
    ];
    
    setPlayerSegments(segments);
  };

  const startRealTimeAnalytics = () => {
    const interval = setInterval(() => {
      // Update real-time metrics
      setLiveMetrics({
        currentPlayers: Math.floor(Math.random() * 500) + 1500,
        sessionsStarted: Math.floor(Math.random() * 50) + 200,
        activeRegions: Math.floor(Math.random() * 5) + 45,
        serverLoad: Math.floor(Math.random() * 30) + 60,
        averageLatency: Math.floor(Math.random() * 50) + 100
      });
      
      // Update player metrics slightly
      setPlayerMetrics(prev => ({
        ...prev,
        activeUsers: {
          ...prev.activeUsers,
          daily: Math.max(2000, Math.min(4000, prev.activeUsers.daily + (Math.random() - 0.5) * 50))
        }
      }));
      
    }, 5000);
    
    return () => clearInterval(interval);
  };

  const createABTest = async (testConfig) => {
    try {
      // Simulate creating A/B test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTest = {
        id: `test-${Date.now()}`,
        name: testConfig.name,
        status: 'planning',
        startDate: Date.now() + 24 * 60 * 60 * 1000,
        endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        participants: 0,
        variants: testConfig.variants,
        metric: testConfig.metric,
        significance: 'pending',
        winner: null,
        improvement: 0
      };
      
      setAbTests(prev => [newTest, ...prev]);
      
      if (eventBus) {
        eventBus.emit('system:alert', {
          level: 'success',
          title: 'A/B Test Created',
          message: `Created test: ${testConfig.name}`
        });
      }
      
    } catch (error) {
      console.error('Failed to create A/B test:', error);
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      case 'stable': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <ChevronDown className="w-4 h-4" />;
      case 'stable': return <ArrowRight className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getTestStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      case 'planning': return 'text-yellow-400';
      case 'paused': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeRange = (range) => {
    switch (range) {
      case '1d': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
    }
  };

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Player Analytics</p>
          <p className="text-gray-500 text-sm">Select a project to view player analytics</p>
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
              <Users className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Player Analytics & A/B Testing</h2>
              {isAnalyzing && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-blue-600/20 rounded">
                  <BarChart3 className="w-3 h-3 text-blue-400 animate-pulse" />
                  <span className="text-xs text-blue-400">Analyzing...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <button
              onClick={() => createABTest({ 
                name: 'New Test', 
                variants: [{ name: 'Control' }, { name: 'Variant' }],
                metric: 'Conversion Rate'
              })}
              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              <TestTube className="w-4 h-4" />
              <span>New A/B Test</span>
            </button>
            
            <button
              onClick={loadPlayerAnalytics}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Live Metrics */}
        <div className="grid grid-cols-8 gap-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Daily Active</span>
            </div>
            <p className="text-lg font-bold text-white">{formatNumber(playerMetrics.activeUsers?.daily || 0)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">New Players</span>
            </div>
            <p className="text-lg font-bold text-white">{playerMetrics.newPlayers?.today || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Avg Session</span>
            </div>
            <p className="text-lg font-bold text-white">{playerMetrics.engagement?.avgSessionTime || 0}m</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Retention</span>
            </div>
            <p className="text-lg font-bold text-white">{analyticsOverview.retention?.day7 || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Conversion</span>
            </div>
            <p className="text-lg font-bold text-white">{playerMetrics.monetization?.conversionRate || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TestTube className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">A/B Tests</span>
            </div>
            <p className="text-lg font-bold text-white">{abTests.filter(t => t.status === 'running').length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-400">Live Players</span>
            </div>
            <p className="text-lg font-bold text-white">{formatNumber(liveMetrics.currentPlayers || 0)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-400">Satisfaction</span>
            </div>
            <p className="text-lg font-bold text-white">{analyticsOverview.performance?.satisfaction || 0}/5</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Player Segments */}
          <div className="border-b border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Player Segments</h3>
            <div className="space-y-3">
              {playerSegments.map((segment) => (
                <div
                  key={segment.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedSegment === segment.id 
                      ? 'bg-blue-600/20 border border-blue-500' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedSegment(segment.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${segment.color}`}>{segment.name}</span>
                    <span className="text-xs text-gray-400">{segment.percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{formatNumber(segment.count)} players</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Session:</span>
                      <span>{segment.avgSessionTime}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retention:</span>
                      <span>{segment.retentionRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Behavior Insights */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Behavior Insights</h3>
            <div className="space-y-3">
              {behaviorData.slice(0, 6).map((behavior) => (
                <div key={behavior.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white capitalize">
                      {behavior.event.replace(/_/g, ' ')}
                    </p>
                    <div className={`flex items-center space-x-1 ${getTrendColor(behavior.trend)}`}>
                      {getTrendIcon(behavior.trend)}
                      <span className="text-xs">
                        {behavior.change > 0 ? '+' : ''}{behavior.change}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>{formatNumber(behavior.count)} events</div>
                    <div>{formatNumber(behavior.uniqueUsers)} users</div>
                    <div>{behavior.conversionRate}% conversion</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* A/B Tests */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">A/B Tests</h3>
              <div className="space-y-4">
                {abTests.map((test) => (
                  <div key={test.id} className="bg-gray-900 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-white">{test.name}</h4>
                        <p className="text-sm text-gray-400">Testing: {test.metric}</p>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center space-x-1 ${getTestStatusColor(test.status)}`}>
                          <Circle className="w-3 h-3" />
                          <span className="text-sm capitalize">{test.status}</span>
                        </div>
                        {test.participants > 0 && (
                          <p className="text-xs text-gray-400">{formatNumber(test.participants)} participants</p>
                        )}
                      </div>
                    </div>
                    
                    {test.status === 'running' || test.status === 'completed' ? (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {test.variants.map((variant, index) => (
                          <div key={index} className={`p-4 rounded-lg border ${
                            test.winner === variant.name ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-800'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-white">{variant.name}</h5>
                              {test.winner === variant.name && (
                                <Award className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Traffic:</span>
                                <span className="text-white">{variant.traffic}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Conversions:</span>
                                <span className="text-white">{variant.conversions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Rate:</span>
                                <span className="text-white">{variant.conversionRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Confidence:</span>
                                <span className={`${variant.confidence > 95 ? 'text-green-400' : 'text-yellow-400'}`}>
                                  {variant.confidence}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <TestTube className="w-12 h-12 mx-auto mb-2" />
                        <p>Test scheduled to start soon</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>
                        {test.status === 'completed' ? 'Completed' : 'Started'}: {' '}
                        {new Date(test.startDate).toLocaleDateString()}
                      </span>
                      {test.improvement > 0 && (
                        <span className="text-green-400">+{test.improvement}% improvement</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Conversion Funnels */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Conversion Funnels</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {conversionFunnels.map((funnel) => (
                  <div key={funnel.id} className="bg-gray-900 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-white">{funnel.name}</h4>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{funnel.conversionRate}%</div>
                        <div className={`text-xs ${funnel.improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {funnel.improvement > 0 ? '+' : ''}{funnel.improvement}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {funnel.stages.map((stage, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-300">{stage.name}</span>
                            <span className="text-sm text-white">{stage.conversion}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${stage.conversion}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatNumber(stage.users)} users
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Retention Analysis */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Retention Analysis</h3>
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">Day 0</div>
                    <div className="text-sm text-gray-400">100%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">Day 1</div>
                    <div className="text-sm text-green-400">{retentionData.averageRetention?.day1}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">Day 7</div>
                    <div className="text-sm text-yellow-400">{retentionData.averageRetention?.day7}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">Day 14</div>
                    <div className="text-sm text-orange-400">{retentionData.averageRetention?.day14}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">Day 30</div>
                    <div className="text-sm text-red-400">{retentionData.averageRetention?.day30}%</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {retentionData.cohorts?.map((cohort, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-16 text-xs text-gray-400">{cohort.cohort}</div>
                      <div className="flex-1 flex space-x-1">
                        {[cohort.day0, cohort.day1, cohort.day7, cohort.day14, cohort.day30].map((value, i) => (
                          <div key={i} className="flex-1">
                            <div className="w-full bg-gray-700 rounded h-2">
                              <div
                                className={`h-2 rounded transition-all duration-1000 ${
                                  i === 0 ? 'bg-blue-500' :
                                  i === 1 ? 'bg-green-500' :
                                  i === 2 ? 'bg-yellow-500' :
                                  i === 3 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerAnalytics;