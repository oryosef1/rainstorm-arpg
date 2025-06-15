// Content Generation Dashboard - AI content generation control interface
// Complete control center for Claude-powered game content creation and management

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Brain, Wand2, FileText, Users, Package, MessageSquare, Map,
  Star, Trophy, Sword, Shield, Gem, Crown, Scroll, Book,
  Play, Pause, CheckCircle, Clock, AlertTriangle, Settings,
  Edit, Trash2, Copy, Download, Upload, RefreshCw, Plus,
  Eye, EyeOff, Filter, Search, Sort, Target, Zap, Heart,
  BarChart3, TrendingUp, Award, Flag, Layers, Network
} from 'lucide-react';

const ContentGenerationDashboard = ({ eventBus, activeProject }) => {
  const [contentRequests, setContentRequests] = useState([]);
  const [contentQueue, setContentQueue] = useState([]);
  const [generatedContent, setGeneratedContent] = useState([]);
  const [contentTemplates, setContentTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStats, setGenerationStats] = useState({});
  const [qualityMetrics, setQualityMetrics] = useState({});
  const [contentAnalytics, setContentAnalytics] = useState({});
  const [filterQuery, setFilterQuery] = useState('');

  // Initialize content generation system
  useEffect(() => {
    if (activeProject) {
      loadContentSystem();
      loadContentTemplates();
      loadGenerationStats();
    }
  }, [activeProject]);

  const loadContentSystem = async () => {
    try {
      // Load existing content requests and generated content
      const systemData = await loadContentData();
      setContentRequests(systemData.requests);
      setContentQueue(systemData.queue);
      setGeneratedContent(systemData.generated);
      setGenerationStats(systemData.stats);
      setQualityMetrics(systemData.quality);
      setContentAnalytics(systemData.analytics);
      
    } catch (error) {
      console.error('Failed to load content system:', error);
    }
  };

  const loadContentData = async () => {
    // Simulate loading content data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      requests: generateMockContentRequests(),
      queue: generateMockContentQueue(),
      generated: generateMockGeneratedContent(),
      stats: generateMockStats(),
      quality: generateMockQualityMetrics(),
      analytics: generateMockAnalytics()
    };
  };

  const generateMockContentRequests = () => {
    return [
      {
        id: 'req-1',
        type: 'quest',
        title: 'Forest Exploration Quest Chain',
        description: 'Create a series of interconnected quests in the Whispering Woods area',
        priority: 'high',
        status: 'in_progress',
        progress: 75,
        estimatedTime: 45,
        elapsedTime: 35,
        assignedClaude: 'content-specialist',
        requirements: {
          questCount: 5,
          difficulty: 'medium',
          rewardTier: 'rare',
          narrativeTheme: 'ancient-mystery'
        },
        createdAt: Date.now() - 7200000,
        updatedAt: Date.now() - 1800000
      },
      {
        id: 'req-2',
        type: 'items',
        title: 'Legendary Weapon Set',
        description: 'Generate 10 unique legendary weapons with balanced stats',
        priority: 'medium',
        status: 'queued',
        progress: 0,
        estimatedTime: 30,
        elapsedTime: 0,
        assignedClaude: 'item-designer',
        requirements: {
          itemCount: 10,
          rarity: 'legendary',
          weaponTypes: ['sword', 'bow', 'staff', 'dagger'],
          levelRange: '60-70'
        },
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000
      },
      {
        id: 'req-3',
        type: 'npcs',
        title: 'Town NPCs and Dialogue',
        description: 'Create merchants, guards, and citizens for the new town area',
        priority: 'low',
        status: 'completed',
        progress: 100,
        estimatedTime: 60,
        elapsedTime: 55,
        assignedClaude: 'character-writer',
        requirements: {
          npcCount: 15,
          dialogueLines: 200,
          personalities: 'varied',
          backgroundStories: true
        },
        createdAt: Date.now() - 14400000,
        updatedAt: Date.now() - 3600000
      }
    ];
  };

  const generateMockContentQueue = () => {
    return [
      {
        id: 'queue-1',
        type: 'dialogue',
        title: 'Boss Battle Dialogue',
        priority: 'high',
        estimatedTime: 20,
        position: 1
      },
      {
        id: 'queue-2',
        type: 'areas',
        title: 'Underground Dungeon Layout',
        priority: 'medium',
        estimatedTime: 40,
        position: 2
      },
      {
        id: 'queue-3',
        type: 'lore',
        title: 'Ancient Civilization Background',
        priority: 'low',
        estimatedTime: 35,
        position: 3
      }
    ];
  };

  const generateMockGeneratedContent = () => {
    return [
      {
        id: 'gen-1',
        type: 'quest',
        title: 'The Lost Artifact',
        quality: 92,
        approved: true,
        createdAt: Date.now() - 86400000,
        usageCount: 45,
        playerRating: 4.7,
        content: {
          name: 'The Lost Artifact',
          description: 'Investigate the mysterious disappearance of an ancient relic from the temple.',
          objectives: [
            'Speak with the temple priest',
            'Search for clues in the temple grounds',
            'Track the thief to the forest caves'
          ],
          rewards: ['500 Gold', 'Temple Blessing Buff', 'Rare Gem']
        }
      },
      {
        id: 'gen-2',
        type: 'item',
        title: 'Shadowstrike Dagger',
        quality: 88,
        approved: true,
        createdAt: Date.now() - 172800000,
        usageCount: 23,
        playerRating: 4.5,
        content: {
          name: 'Shadowstrike Dagger',
          rarity: 'Epic',
          stats: {
            damage: '45-67',
            criticalChance: '15%',
            attackSpeed: 'Fast'
          },
          specialAbility: 'Shadow Step: Teleport behind target and deal 200% damage'
        }
      },
      {
        id: 'gen-3',
        type: 'npc',
        title: 'Master Blacksmith Gareth',
        quality: 95,
        approved: true,
        createdAt: Date.now() - 259200000,
        usageCount: 67,
        playerRating: 4.9,
        content: {
          name: 'Master Blacksmith Gareth',
          personality: 'Gruff but kind-hearted',
          background: 'Former royal blacksmith seeking redemption',
          dialogues: [
            'Welcome to my forge, traveler. What can I craft for you today?',
            'These old hands have forged weapons for kings and paupers alike.',
            'Quality takes time, young one. Rush and you\'ll only make scrap.'
          ]
        }
      }
    ];
  };

  const generateMockStats = () => {
    return {
      totalGenerated: 156,
      averageQuality: 87.3,
      approvalRate: 92.1,
      averageGenerationTime: 12.5,
      contentTypes: {
        quests: 45,
        items: 62,
        npcs: 28,
        dialogue: 89,
        lore: 23,
        areas: 12
      }
    };
  };

  const generateMockQualityMetrics = () => {
    return {
      creativity: 89,
      coherence: 94,
      gameBalance: 86,
      narrativeQuality: 91,
      playerEngagement: 88
    };
  };

  const generateMockAnalytics = () => {
    return {
      mostPopularType: 'dialogue',
      highestRatedContent: 'Master Blacksmith Gareth',
      playerFeedbackScore: 4.6,
      contentUsageRate: 78.4,
      generationTrends: [
        { week: 'Week 1', generated: 23, approved: 21 },
        { week: 'Week 2', generated: 31, approved: 28 },
        { week: 'Week 3', generated: 28, approved: 26 },
        { week: 'Week 4', generated: 35, approved: 33 }
      ]
    };
  };

  const loadContentTemplates = () => {
    const templates = [
      {
        id: 'quest-exploration',
        name: 'Exploration Quest',
        type: 'quest',
        description: 'Standard exploration quest with discovery elements',
        parameters: ['area', 'difficulty', 'reward_tier'],
        estimatedTime: 15
      },
      {
        id: 'quest-delivery',
        name: 'Delivery Quest',
        type: 'quest',
        description: 'Item delivery quest with potential complications',
        parameters: ['origin', 'destination', 'item', 'obstacles'],
        estimatedTime: 10
      },
      {
        id: 'item-weapon',
        name: 'Weapon Generator',
        type: 'item',
        description: 'Balanced weapon with unique abilities',
        parameters: ['weapon_type', 'rarity', 'level', 'theme'],
        estimatedTime: 8
      },
      {
        id: 'item-armor',
        name: 'Armor Generator',
        type: 'item',
        description: 'Defensive equipment with set bonuses',
        parameters: ['armor_slot', 'rarity', 'level', 'specialization'],
        estimatedTime: 8
      },
      {
        id: 'npc-merchant',
        name: 'Merchant NPC',
        type: 'npc',
        description: 'Trading NPC with personality and stock',
        parameters: ['location', 'specialty', 'personality', 'background'],
        estimatedTime: 12
      },
      {
        id: 'npc-questgiver',
        name: 'Quest Giver NPC',
        type: 'npc',
        description: 'NPC that provides quests and story context',
        parameters: ['role', 'motivation', 'quest_type', 'reward_style'],
        estimatedTime: 18
      }
    ];
    
    setContentTemplates(templates);
  };

  const startContentGeneration = async (request) => {
    try {
      setIsGenerating(true);
      
      // Simulate content generation process
      const generationTime = request.estimatedTime * 1000;
      
      // Update request status
      setContentRequests(prev => prev.map(req => 
        req.id === request.id 
          ? { ...req, status: 'in_progress', progress: 0 }
          : req
      ));
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setContentRequests(prev => prev.map(req => 
          req.id === request.id 
            ? { 
                ...req, 
                progress: Math.min(100, req.progress + Math.random() * 20),
                elapsedTime: req.elapsedTime + 2
              }
            : req
        ));
      }, 2000);
      
      // Complete generation
      setTimeout(() => {
        clearInterval(progressInterval);
        
        const newContent = {
          id: `gen-${Date.now()}`,
          type: request.type,
          title: request.title,
          quality: Math.floor(Math.random() * 20) + 80,
          approved: false,
          createdAt: Date.now(),
          usageCount: 0,
          playerRating: 0,
          content: generateContentBasedOnType(request.type)
        };
        
        setGeneratedContent(prev => [newContent, ...prev]);
        setContentRequests(prev => prev.map(req => 
          req.id === request.id 
            ? { ...req, status: 'completed', progress: 100 }
            : req
        ));
        
        if (eventBus) {
          eventBus.emit('system:alert', {
            level: 'success',
            title: 'Content Generation Complete',
            message: `Generated: ${request.title}`
          });
        }
        
        setIsGenerating(false);
      }, generationTime);
      
    } catch (error) {
      console.error('Content generation failed:', error);
      setIsGenerating(false);
    }
  };

  const generateContentBasedOnType = (type) => {
    switch (type) {
      case 'quest':
        return {
          name: 'Generated Quest',
          description: 'A dynamically generated quest with engaging objectives.',
          objectives: ['Objective 1', 'Objective 2', 'Objective 3'],
          rewards: ['Gold', 'Experience', 'Item']
        };
      case 'item':
        return {
          name: 'Generated Item',
          rarity: 'Rare',
          stats: { damage: '30-45', bonus: '+10 Strength' },
          description: 'A powerful item with unique properties.'
        };
      case 'npc':
        return {
          name: 'Generated NPC',
          personality: 'Friendly merchant',
          background: 'A traveling trader with stories to tell.',
          dialogues: ['Hello, traveler!', 'What can I help you with?']
        };
      default:
        return { content: 'Generated content' };
    }
  };

  const approveContent = (contentId) => {
    setGeneratedContent(prev => prev.map(content => 
      content.id === contentId 
        ? { ...content, approved: true }
        : content
    ));
    
    if (eventBus) {
      eventBus.emit('system:alert', {
        level: 'success',
        title: 'Content Approved',
        message: 'Content has been approved and is ready for use'
      });
    }
  };

  const rejectContent = (contentId) => {
    setGeneratedContent(prev => prev.filter(content => content.id !== contentId));
    
    if (eventBus) {
      eventBus.emit('system:alert', {
        level: 'info',
        title: 'Content Rejected',
        message: 'Content has been removed from the system'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-blue-400';
      case 'queued': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4 animate-spin" />;
      case 'queued': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'quest': return <Target className="w-4 h-4 text-blue-400" />;
      case 'item': return <Package className="w-4 h-4 text-purple-400" />;
      case 'npc': return <Users className="w-4 h-4 text-green-400" />;
      case 'dialogue': return <MessageSquare className="w-4 h-4 text-orange-400" />;
      case 'lore': return <Book className="w-4 h-4 text-indigo-400" />;
      case 'areas': return <Map className="w-4 h-4 text-cyan-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
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
          <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Content Generation Dashboard</p>
          <p className="text-gray-500 text-sm">Select a project to manage AI content generation</p>
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
              <h2 className="text-xl font-bold text-white">Content Generation Dashboard</h2>
              {isGenerating && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-blue-600/20 rounded">
                  <Clock className="w-3 h-3 text-blue-400 animate-spin" />
                  <span className="text-xs text-blue-400">Generating...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateRequest(true)}
              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              <Plus className="w-4 h-4" />
              <span>New Request</span>
            </button>
            
            <button
              onClick={loadContentSystem}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Generated</span>
            </div>
            <p className="text-lg font-bold text-white">{generationStats.totalGenerated || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Avg Quality</span>
            </div>
            <p className="text-lg font-bold text-white">{generationStats.averageQuality || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Approved</span>
            </div>
            <p className="text-lg font-bold text-white">{generationStats.approvalRate || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Avg Time</span>
            </div>
            <p className="text-lg font-bold text-white">{generationStats.averageGenerationTime || 0}min</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">Usage Rate</span>
            </div>
            <p className="text-lg font-bold text-white">{contentAnalytics.contentUsageRate || 0}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Player Rating</span>
            </div>
            <p className="text-lg font-bold text-white">{contentAnalytics.playerFeedbackScore || 0}/5</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Category Filter */}
          <div className="border-b border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Content Categories</h3>
            <div className="space-y-2">
              {[
                { id: 'all', name: 'All Content', count: contentRequests.length },
                { id: 'quest', name: 'Quests', count: generationStats.contentTypes?.quests || 0 },
                { id: 'item', name: 'Items', count: generationStats.contentTypes?.items || 0 },
                { id: 'npc', name: 'NPCs', count: generationStats.contentTypes?.npcs || 0 },
                { id: 'dialogue', name: 'Dialogue', count: generationStats.contentTypes?.dialogue || 0 },
                { id: 'lore', name: 'Lore', count: generationStats.contentTypes?.lore || 0 }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded transition-all ${
                    selectedCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs">{category.count}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Active Requests */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Active Requests</h3>
            <div className="space-y-3">
              {contentRequests.map((request) => (
                <div key={request.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-start space-x-2 mb-2">
                    {getTypeIcon(request.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{request.title}</p>
                      <p className="text-xs text-gray-400 truncate">{request.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="text-xs capitalize">{request.status}</span>
                    </div>
                    <span className={`text-xs ${getPriorityColor(request.priority)}`}>
                      {request.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  {request.status === 'in_progress' && (
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${request.progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {request.status === 'queued' && (
                    <button
                      onClick={() => startContentGeneration(request)}
                      disabled={isGenerating}
                      className="w-full mt-2 px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-xs rounded"
                    >
                      Start Generation
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Generated Content */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Generated Content</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search content..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {generatedContent.map((content) => (
                  <div key={content.id} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(content.type)}
                        <div>
                          <h4 className="font-medium text-white">{content.title}</h4>
                          <p className="text-xs text-gray-400">{formatTimeAgo(content.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-white">{content.quality}%</span>
                        </div>
                        {content.approved ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => approveContent(content.id)}
                              className="p-1 bg-green-600 hover:bg-green-700 text-white rounded"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => rejectContent(content.id)}
                              className="p-1 bg-red-600 hover:bg-red-700 text-white rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-300 space-y-2">
                      {content.type === 'quest' && content.content && (
                        <div>
                          <p className="font-medium">{content.content.name}</p>
                          <p className="text-xs text-gray-400">{content.content.description}</p>
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">Objectives: </span>
                            <span className="text-xs">{content.content.objectives?.length || 0}</span>
                          </div>
                        </div>
                      )}
                      
                      {content.type === 'item' && content.content && (
                        <div>
                          <p className="font-medium">{content.content.name}</p>
                          <p className="text-xs text-purple-400">{content.content.rarity}</p>
                          <p className="text-xs text-gray-400">{content.content.description}</p>
                        </div>
                      )}
                      
                      {content.type === 'npc' && content.content && (
                        <div>
                          <p className="font-medium">{content.content.name}</p>
                          <p className="text-xs text-gray-400">{content.content.personality}</p>
                          <p className="text-xs text-gray-500">{content.content.background}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                      <div className="text-xs text-gray-400">
                        Used {content.usageCount} times
                        {content.playerRating > 0 && (
                          <span className="ml-2">• ★ {content.playerRating}/5</span>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-1 text-gray-400 hover:text-white">
                          <Eye className="w-3 h-3" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-white">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-white">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Request Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Create Content Request</h3>
              <button
                onClick={() => setShowCreateRequest(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500">
                  <option value="quest">Quest</option>
                  <option value="item">Item</option>
                  <option value="npc">NPC</option>
                  <option value="dialogue">Dialogue</option>
                  <option value="lore">Lore</option>
                  <option value="areas">Areas</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Content title..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  placeholder="Detailed description of what to generate..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Claude Specialist</label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500">
                    <option value="content-specialist">Content Specialist</option>
                    <option value="item-designer">Item Designer</option>
                    <option value="character-writer">Character Writer</option>
                    <option value="lore-master">Lore Master</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateRequest(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateRequest(false);
                  // Create new request logic here
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGenerationDashboard;