// Session Manager - Persistent Claude Code session management with project context
// Revolutionary session persistence and context management system

import { EventEmitter } from 'events';

interface ProjectContext {
  id: string;
  name: string;
  path: string;
  type: string;
  architecture: string;
  technologies: string[];
  codeStyle: string;
  testingStrategy: string;
  buildSystem: string;
  documentation: string[];
  recentChanges: FileChange[];
  activeFeatures: string[];
  todoCount: number;
}

interface FileChange {
  file: string;
  timestamp: number;
  type: 'modified' | 'created' | 'deleted';
}

interface PersistentSession {
  id: string;
  name: string;
  projectId?: string;
  projectContext?: ProjectContext;
  specialist: string;
  profile: string;
  systemPrompt: string;
  conversationHistory: ConversationMessage[];
  workingDirectory: string;
  permissions: string[];
  toolsUsed: string[];
  sessionState: SessionState;
  metadata: SessionMetadata;
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
  isPinned: boolean;
  tags: string[];
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  metadata?: any;
}

interface ToolCall {
  tool: string;
  parameters: any;
  result: any;
  duration: number;
}

interface SessionState {
  currentTask?: string;
  workflowStep?: number;
  contextFiles: string[];
  openFileEditors: string[];
  terminalState?: TerminalState;
  debuggerState?: any;
  breakpoints: string[];
}

interface TerminalState {
  workingDirectory: string;
  environmentVariables: Record<string, string>;
  commandHistory: string[];
  activeProcesses: number[];
}

interface SessionMetadata {
  totalMessages: number;
  totalTokens: number;
  averageResponseTime: number;
  toolUsageStats: Record<string, number>;
  errorCount: number;
  successfulOperations: number;
  projectContribution: string[];
}

interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  specialist: string;
  profile: string;
  systemPrompt: string;
  permissions: string[];
  defaultTools: string[];
  projectTypes: string[];
  contextRequirements: string[];
}

interface SessionFilter {
  projectId?: string;
  specialist?: string;
  isActive?: boolean;
  isPinned?: boolean;
  tags?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
}

export class SessionManager extends EventEmitter {
  private sessions: Map<string, PersistentSession> = new Map();
  private sessionTemplates: Map<string, SessionTemplate> = new Map();
  private storage: SessionStorage;
  private contextManager: ContextManager;
  private maxSessions: number = 50;
  private autoSaveInterval: number = 30000; // 30 seconds
  private cleanupInterval: number = 3600000; // 1 hour
  private autoSaveTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(storageImpl?: SessionStorage) {
    super();
    this.storage = storageImpl || new LocalSessionStorage();
    this.contextManager = new ContextManager();
    this.initializeTemplates();
    this.startAutoSave();
    this.startCleanup();
  }

  // === INITIALIZATION ===

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing Session Manager...');
      
      // Load persisted sessions
      await this.loadPersistedSessions();
      
      // Load session templates
      await this.loadSessionTemplates();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log(`✅ Session Manager initialized with ${this.sessions.size} sessions`);
    } catch (error) {
      console.error('❌ Failed to initialize Session Manager:', error);
      throw error;
    }
  }

  private async loadPersistedSessions(): Promise<void> {
    try {
      const persistedSessions = await this.storage.loadSessions();
      for (const session of persistedSessions) {
        this.sessions.set(session.id, session);
      }
      console.log(`📂 Loaded ${persistedSessions.length} persisted sessions`);
    } catch (error) {
      console.warn('⚠️ Failed to load persisted sessions:', error);
    }
  }

  private async loadSessionTemplates(): Promise<void> {
    // Load built-in session templates
    const templates = this.getBuiltInTemplates();
    for (const template of templates) {
      this.sessionTemplates.set(template.id, template);
    }
    console.log(`📋 Loaded ${templates.length} session templates`);
  }

  private initializeTemplates(): void {
    // This will be called during construction
  }

  private setupEventListeners(): void {
    this.on('session:created', this.handleSessionCreated.bind(this));
    this.on('session:updated', this.handleSessionUpdated.bind(this));
    this.on('session:closed', this.handleSessionClosed.bind(this));
    this.on('project:changed', this.handleProjectChanged.bind(this));
  }

  // === SESSION CREATION ===

  async createSession(config: {
    name?: string;
    projectId?: string;
    specialist?: string;
    profile?: string;
    templateId?: string;
    systemPrompt?: string;
    permissions?: string[];
    workingDirectory?: string;
  }): Promise<PersistentSession> {
    try {
      const sessionId = this.generateSessionId();
      const template = config.templateId ? this.sessionTemplates.get(config.templateId) : null;
      
      // Load project context if projectId provided
      const projectContext = config.projectId ? 
        await this.contextManager.loadProjectContext(config.projectId) : undefined;

      const session: PersistentSession = {
        id: sessionId,
        name: config.name || this.generateSessionName(config.specialist || template?.specialist || 'general'),
        projectId: config.projectId,
        projectContext,
        specialist: config.specialist || template?.specialist || 'feature-builder',
        profile: config.profile || template?.profile || 'trusted-developer',
        systemPrompt: config.systemPrompt || template?.systemPrompt || this.getDefaultSystemPrompt(projectContext),
        conversationHistory: [],
        workingDirectory: config.workingDirectory || projectContext?.path || process.cwd(),
        permissions: config.permissions || template?.permissions || ['read', 'write', 'execute'],
        toolsUsed: [],
        sessionState: {
          contextFiles: [],
          openFileEditors: [],
          breakpoints: []
        },
        metadata: {
          totalMessages: 0,
          totalTokens: 0,
          averageResponseTime: 0,
          toolUsageStats: {},
          errorCount: 0,
          successfulOperations: 0,
          projectContribution: []
        },
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true,
        isPinned: false,
        tags: this.generateSessionTags(config, template, projectContext)
      };

      this.sessions.set(sessionId, session);
      await this.persistSession(session);

      this.emit('session:created', { session });
      console.log(`✨ Created new session: ${session.name} (${sessionId})`);

      return session;
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      throw error;
    }
  }

  async createFromTemplate(templateId: string, projectId?: string, overrides?: any): Promise<PersistentSession> {
    const template = this.sessionTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return this.createSession({
      templateId,
      projectId,
      ...overrides
    });
  }

  // === SESSION MANAGEMENT ===

  async getSession(sessionId: string): Promise<PersistentSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async getAllSessions(filter?: SessionFilter): Promise<PersistentSession[]> {
    let sessions = Array.from(this.sessions.values());

    if (filter) {
      sessions = sessions.filter(session => {
        if (filter.projectId && session.projectId !== filter.projectId) return false;
        if (filter.specialist && session.specialist !== filter.specialist) return false;
        if (filter.isActive !== undefined && session.isActive !== filter.isActive) return false;
        if (filter.isPinned !== undefined && session.isPinned !== filter.isPinned) return false;
        if (filter.tags && !filter.tags.some(tag => session.tags.includes(tag))) return false;
        if (filter.dateRange) {
          if (session.createdAt < filter.dateRange.start || session.createdAt > filter.dateRange.end) return false;
        }
        return true;
      });
    }

    return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  async getActiveSessions(): Promise<PersistentSession[]> {
    return this.getAllSessions({ isActive: true });
  }

  async getProjectSessions(projectId: string): Promise<PersistentSession[]> {
    return this.getAllSessions({ projectId });
  }

  async resumeSession(sessionId: string): Promise<PersistentSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.isActive = true;
    session.lastActivity = Date.now();
    
    // Reload project context if available
    if (session.projectId) {
      session.projectContext = await this.contextManager.loadProjectContext(session.projectId);
    }

    await this.persistSession(session);
    this.emit('session:resumed', { session });

    console.log(`🔄 Resumed session: ${session.name} (${sessionId})`);
    return session;
  }

  async pauseSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isActive = false;
    session.lastActivity = Date.now();

    await this.persistSession(session);
    this.emit('session:paused', { session });

    console.log(`⏸️ Paused session: ${session.name} (${sessionId})`);
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isActive = false;
    session.lastActivity = Date.now();

    await this.persistSession(session);
    this.emit('session:closed', { session });

    console.log(`🔚 Closed session: ${session.name} (${sessionId})`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.sessions.delete(sessionId);
    await this.storage.deleteSession(sessionId);
    this.emit('session:deleted', { sessionId });

    console.log(`🗑️ Deleted session: ${session.name} (${sessionId})`);
  }

  // === SESSION UPDATES ===

  async updateSessionContext(sessionId: string, context: Partial<ProjectContext>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.projectContext) {
      session.projectContext = { ...session.projectContext, ...context };
    }
    session.lastActivity = Date.now();

    await this.persistSession(session);
    this.emit('session:context:updated', { sessionId, context });
  }

  async addMessage(sessionId: string, message: ConversationMessage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.conversationHistory.push(message);
    session.metadata.totalMessages++;
    session.lastActivity = Date.now();

    // Update metadata based on message
    if (message.role === 'assistant' && message.toolCalls) {
      for (const toolCall of message.toolCalls) {
        session.metadata.toolUsageStats[toolCall.tool] = 
          (session.metadata.toolUsageStats[toolCall.tool] || 0) + 1;
        
        if (!session.toolsUsed.includes(toolCall.tool)) {
          session.toolsUsed.push(toolCall.tool);
        }
      }
    }

    await this.persistSession(session);
    this.emit('session:message:added', { sessionId, message });
  }

  async updateSessionState(sessionId: string, state: Partial<SessionState>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.sessionState = { ...session.sessionState, ...state };
    session.lastActivity = Date.now();

    await this.persistSession(session);
    this.emit('session:state:updated', { sessionId, state });
  }

  async pinSession(sessionId: string, pinned: boolean = true): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isPinned = pinned;
    await this.persistSession(session);
    this.emit('session:pinned', { sessionId, pinned });
  }

  async updateSessionTags(sessionId: string, tags: string[]): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.tags = tags;
    await this.persistSession(session);
    this.emit('session:tags:updated', { sessionId, tags });
  }

  // === TEMPLATES ===

  getSessionTemplates(): SessionTemplate[] {
    return Array.from(this.sessionTemplates.values());
  }

  getTemplate(templateId: string): SessionTemplate | undefined {
    return this.sessionTemplates.get(templateId);
  }

  private getBuiltInTemplates(): SessionTemplate[] {
    return [
      {
        id: 'feature-builder',
        name: 'Feature Builder',
        description: 'End-to-end feature development with full toolkit access',
        specialist: 'feature-builder',
        profile: 'trusted-developer',
        systemPrompt: 'You are a feature builder specialist focused on implementing complete features with tests, documentation, and integration.',
        permissions: ['read', 'write', 'execute', 'git', 'npm'],
        defaultTools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob'],
        projectTypes: ['arpg', 'web-app', 'api', 'library'],
        contextRequirements: ['project-structure', 'coding-standards', 'test-framework']
      },
      {
        id: 'bug-hunter',
        name: 'Bug Hunter',
        description: 'Systematic bug investigation and resolution',
        specialist: 'bug-hunter',
        profile: 'debugger',
        systemPrompt: 'You are a bug hunting specialist focused on identifying, reproducing, and fixing bugs with comprehensive testing.',
        permissions: ['read', 'write', 'execute', 'debug'],
        defaultTools: ['Read', 'Grep', 'Bash', 'Edit'],
        projectTypes: ['arpg', 'web-app', 'api'],
        contextRequirements: ['error-logs', 'reproduction-steps', 'test-environment']
      },
      {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: 'Comprehensive code quality analysis and improvement',
        specialist: 'code-reviewer',
        profile: 'reviewer',
        systemPrompt: 'You are a code review specialist focused on code quality, best practices, security, and performance optimization.',
        permissions: ['read', 'analyze'],
        defaultTools: ['Read', 'Grep', 'Glob'],
        projectTypes: ['arpg', 'web-app', 'api', 'library'],
        contextRequirements: ['coding-standards', 'project-architecture', 'quality-metrics']
      },
      {
        id: 'tester',
        name: 'Test Engineer',
        description: 'Comprehensive testing strategy and implementation',
        specialist: 'tester',
        profile: 'test-engineer',
        systemPrompt: 'You are a testing specialist focused on creating comprehensive test suites, improving coverage, and ensuring quality.',
        permissions: ['read', 'write', 'execute', 'test'],
        defaultTools: ['Read', 'Write', 'Edit', 'Bash'],
        projectTypes: ['arpg', 'web-app', 'api', 'library'],
        contextRequirements: ['test-framework', 'coverage-requirements', 'testing-strategy']
      },
      {
        id: 'game-developer',
        name: 'Game Developer',
        description: 'ARPG-specific development with game mechanics focus',
        specialist: 'game-developer',
        profile: 'game-specialist',
        systemPrompt: 'You are a game development specialist focused on ARPG mechanics, player systems, and game balance.',
        permissions: ['read', 'write', 'execute', 'asset-management'],
        defaultTools: ['Read', 'Edit', 'Write', 'Bash'],
        projectTypes: ['arpg'],
        contextRequirements: ['game-mechanics', 'player-data', 'asset-pipeline', 'balance-data']
      },
      {
        id: 'documenter',
        name: 'Documentation Writer',
        description: 'Comprehensive project documentation and guides',
        specialist: 'documenter',
        profile: 'technical-writer',
        systemPrompt: 'You are a documentation specialist focused on creating clear, comprehensive, and maintainable documentation.',
        permissions: ['read', 'write'],
        defaultTools: ['Read', 'Write', 'Grep', 'Glob'],
        projectTypes: ['arpg', 'web-app', 'api', 'library'],
        contextRequirements: ['project-structure', 'api-definitions', 'user-workflows']
      }
    ];
  }

  // === CONTEXT MANAGEMENT ===

  async syncProjectContext(projectId: string): Promise<void> {
    const projectSessions = await this.getProjectSessions(projectId);
    const context = await this.contextManager.loadProjectContext(projectId);

    for (const session of projectSessions) {
      session.projectContext = context;
      session.lastActivity = Date.now();
      await this.persistSession(session);
    }

    this.emit('project:context:synced', { projectId, sessionCount: projectSessions.length });
  }

  // === UTILITIES ===

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionName(specialist: string): string {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${specialist.charAt(0).toUpperCase() + specialist.slice(1)} - ${timestamp}`;
  }

  private generateSessionTags(config: any, template: SessionTemplate | null, context?: ProjectContext): string[] {
    const tags: string[] = [];
    
    if (config.specialist) tags.push(`specialist:${config.specialist}`);
    if (config.projectId) tags.push(`project:${config.projectId}`);
    if (context?.type) tags.push(`type:${context.type}`);
    if (template) tags.push(`template:${template.id}`);
    
    return tags;
  }

  private getDefaultSystemPrompt(context?: ProjectContext): string {
    if (!context) {
      return 'You are Claude Code, an AI assistant helping with software development tasks.';
    }

    return `You are Claude Code working on the ${context.name} project.

Project Context:
- Type: ${context.type}
- Architecture: ${context.architecture}
- Technologies: ${context.technologies.join(', ')}
- Code Style: ${context.codeStyle}
- Testing Strategy: ${context.testingStrategy}

Focus on maintaining consistency with the project's architecture and coding standards.`;
  }

  // === PERSISTENCE ===

  private async persistSession(session: PersistentSession): Promise<void> {
    try {
      await this.storage.saveSession(session);
    } catch (error) {
      console.error(`Failed to persist session ${session.id}:`, error);
    }
  }

  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(async () => {
      await this.saveAllSessions();
    }, this.autoSaveInterval);
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanupOldSessions();
    }, this.cleanupInterval);
  }

  private async saveAllSessions(): Promise<void> {
    try {
      const sessions = Array.from(this.sessions.values());
      await this.storage.saveSessions(sessions);
      console.log(`💾 Auto-saved ${sessions.length} sessions`);
    } catch (error) {
      console.error('Failed to auto-save sessions:', error);
    }
  }

  private async cleanupOldSessions(): Promise<void> {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isPinned && !session.isActive && session.lastActivity < cutoff) {
        await this.deleteSession(sessionId);
        cleanedCount++;
      }
    }

    // Enforce max session limit
    if (this.sessions.size > this.maxSessions) {
      const sessions = Array.from(this.sessions.values())
        .filter(s => !s.isPinned && !s.isActive)
        .sort((a, b) => a.lastActivity - b.lastActivity);

      const excessCount = this.sessions.size - this.maxSessions;
      for (let i = 0; i < excessCount && i < sessions.length; i++) {
        await this.deleteSession(sessions[i].id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old sessions`);
    }
  }

  // === EVENT HANDLERS ===

  private handleSessionCreated(data: { session: PersistentSession }): void {
    // Session creation logic already handled in createSession
  }

  private handleSessionUpdated(data: { session: PersistentSession }): void {
    // Session update logic already handled in individual update methods
  }

  private handleSessionClosed(data: { session: PersistentSession }): void {
    // Session close logic already handled in closeSession
  }

  private async handleProjectChanged(data: { projectId: string, context: ProjectContext }): Promise<void> {
    await this.syncProjectContext(data.projectId);
  }

  // === CLEANUP ===

  async shutdown(): Promise<void> {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    await this.saveAllSessions();
    console.log('🛑 Session Manager shutdown complete');
  }
}

// === STORAGE INTERFACES ===

interface SessionStorage {
  loadSessions(): Promise<PersistentSession[]>;
  saveSession(session: PersistentSession): Promise<void>;
  saveSessions(sessions: PersistentSession[]): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
}

class LocalSessionStorage implements SessionStorage {
  private storageKey = 'agent-dashboard-sessions';

  async loadSessions(): Promise<PersistentSession[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
      return [];
    }
  }

  async saveSession(session: PersistentSession): Promise<void> {
    const sessions = await this.loadSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }

    await this.saveSessions(sessions);
  }

  async saveSessions(sessions: PersistentSession[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.loadSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    await this.saveSessions(filtered);
  }
}

// === CONTEXT MANAGER ===

class ContextManager {
  async loadProjectContext(projectId: string): Promise<ProjectContext> {
    // In a real implementation, this would load from CLAUDE.md, memory.md, etc.
    // For now, return mock context based on projectId
    return {
      id: projectId,
      name: projectId === 'rainstorm-arpg' ? 'RainStorm ARPG' : 'Unknown Project',
      path: projectId === 'rainstorm-arpg' ? '/mnt/c/Users/talth/Downloads/Archive' : '/unknown',
      type: projectId === 'rainstorm-arpg' ? 'arpg' : 'web-app',
      architecture: 'Feature Pod System',
      technologies: ['TypeScript', 'Node.js', 'MCP'],
      codeStyle: 'TypeScript with ESLint',
      testingStrategy: 'Jest with TDD',
      buildSystem: 'npm scripts',
      documentation: ['README.md', 'CLAUDE.md'],
      recentChanges: [],
      activeFeatures: ['agent-dashboard', 'session-management'],
      todoCount: 5
    };
  }
}

export default SessionManager;