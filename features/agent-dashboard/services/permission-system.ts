// Permission System - Granular security and safety controls for AI operations
// Manages permissions, validates operations, and ensures safe AI execution

interface PermissionConfig {
  strictMode?: boolean;
  auditLogging?: boolean;
  sessionTimeout?: number;
  maxConcurrentSessions?: number;
  [key: string]: any;
}

interface PermissionProfile {
  name: string;
  description: string;
  permissions: string[];
  restrictions: string[];
  autoApprove: boolean;
  requiresConfirmation: string[];
  timeLimit: number;
  maxOperations: number;
}

interface PermissionSession {
  id: string;
  profile: string;
  permissions: string[];
  restrictions: string[];
  context: any;
  createdAt: number;
  expiresAt: number;
  operationCount: number;
  maxOperations: number;
  autoApprove: boolean;
  requiresConfirmation: string[];
  status: 'active' | 'expired' | 'closed';
  lastActivity?: number;
  closedAt?: number;
  expiredAt?: number;
}

interface OperationData {
  type: string;
  target?: string;
  scope?: string;
  impact?: string;
  data?: {
    command?: string;
    environment?: string;
    linesChanged?: number;
    filesAffected?: number;
    [key: string]: any;
  };
}

interface ValidationResult {
  authorized: boolean;
  sessionId?: string;
  requiresConfirmation?: boolean;
  remainingOperations?: number;
  session?: PermissionSession;
  denied?: string[];
  profile?: string;
  reason?: string;
  permissions?: string[];
  restrictions?: string[];
  autoApprove?: boolean;
}

interface PermissionRequest {
  operation: OperationData;
  sessionId?: string;
  profile?: string;
  permissions?: string[];
  context?: any;
}

interface AuditLogEntry {
  id: string;
  action: string;
  data: any;
  timestamp: number;
}

interface AuditFilters {
  action?: string;
  sessionId?: string;
  since?: number;
  limit?: number;
}

interface SessionStats {
  total: number;
  byProfile: Record<string, number>;
  oldestSession: number;
  averageOperations: number;
}

interface SessionConfig {
  profileName: string;
  context?: any;
  permissions?: string[];
  timeLimit?: number;
}

interface OperationPermissionResult {
  allowed: boolean;
  reason?: string;
}

export class PermissionManager {
  private config: PermissionConfig;
  private profiles: Map<string, PermissionProfile> = new Map();
  private activeSessions: Map<string, PermissionSession> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private permissionCache: Map<string, any> = new Map();

  constructor(config: PermissionConfig = {}) {
    this.config = {
      strictMode: config.strictMode !== false,
      auditLogging: config.auditLogging !== false,
      sessionTimeout: config.sessionTimeout || 3600000, // 1 hour
      maxConcurrentSessions: config.maxConcurrentSessions || 10,
      ...config
    };
    
    this.initializeDefaultProfiles();
    this.startSessionCleanup();
  }
  
  private initializeDefaultProfiles(): void {
    // Load built-in permission profiles
    this.profiles.set('trusted-developer', {
      name: 'Trusted Developer',
      description: 'Full development permissions with safety guards',
      permissions: [
        'read-all',
        'write-code',
        'create-files',
        'modify-files',
        'run-tests',
        'commit-changes',
        'read-logs',
        'analyze-performance'
      ],
      restrictions: [
        'no-delete-critical-files',
        'no-external-api-calls',
        'no-system-commands',
        'no-env-modifications'
      ],
      autoApprove: true,
      requiresConfirmation: [
        'major-architectural-changes',
        'database-migrations',
        'production-deployments'
      ],
      timeLimit: 3600000, // 1 hour
      maxOperations: 100
    });
    
    this.profiles.set('code-reviewer', {
      name: 'Code Reviewer',
      description: 'Read-only access with suggestion capabilities',
      permissions: [
        'read-all',
        'analyze-code',
        'suggest-improvements',
        'create-comments',
        'read-tests',
        'read-docs'
      ],
      restrictions: [
        'no-direct-changes',
        'no-file-modifications',
        'no-deletions'
      ],
      autoApprove: true,
      requiresConfirmation: [],
      timeLimit: 7200000, // 2 hours
      maxOperations: 50
    });
    
    this.profiles.set('feature-builder', {
      name: 'Feature Builder',
      description: 'Feature development with controlled scope',
      permissions: [
        'read-codebase',
        'write-new-files',
        'modify-existing-files',
        'create-directories',
        'run-tests',
        'write-tests',
        'read-docs',
        'write-docs'
      ],
      restrictions: [
        'no-delete-existing-files',
        'no-config-changes',
        'no-dependency-changes',
        'no-database-changes'
      ],
      autoApprove: true,
      requiresConfirmation: [
        'major-architectural-changes',
        'breaking-api-changes'
      ],
      timeLimit: 1800000, // 30 minutes
      maxOperations: 75
    });
    
    this.profiles.set('bug-hunter', {
      name: 'Bug Hunter',
      description: 'Debugging with minimal change permissions',
      permissions: [
        'read-all',
        'analyze-logs',
        'trace-execution',
        'suggest-fixes',
        'write-minimal-fixes',
        'run-tests',
        'create-debug-files'
      ],
      restrictions: [
        'no-major-changes',
        'no-new-features',
        'no-architecture-changes'
      ],
      autoApprove: true,
      requiresConfirmation: [
        'data-structure-changes',
        'algorithm-modifications'
      ],
      timeLimit: 1800000, // 30 minutes
      maxOperations: 50
    });
    
    this.profiles.set('optimizer', {
      name: 'Performance Optimizer',
      description: 'Performance optimization focused permissions',
      permissions: [
        'read-all',
        'analyze-performance',
        'modify-algorithms',
        'optimize-code',
        'run-benchmarks',
        'write-performance-tests'
      ],
      restrictions: [
        'no-functionality-changes',
        'no-api-changes',
        'no-new-features'
      ],
      autoApprove: true,
      requiresConfirmation: [
        'major-algorithm-changes',
        'data-structure-optimizations'
      ],
      timeLimit: 2700000, // 45 minutes
      maxOperations: 60
    });
    
    this.profiles.set('documenter', {
      name: 'Documentation Specialist',
      description: 'Documentation creation and maintenance',
      permissions: [
        'read-all',
        'analyze-code',
        'write-docs',
        'create-examples',
        'modify-readme',
        'create-tutorials'
      ],
      restrictions: [
        'no-code-changes',
        'no-config-changes',
        'no-deletions'
      ],
      autoApprove: true,
      requiresConfirmation: [],
      timeLimit: 3600000, // 1 hour
      maxOperations: 40
    });
    
    this.profiles.set('tester', {
      name: 'Test Engineer',
      description: 'Testing focused permissions',
      permissions: [
        'read-codebase',
        'write-tests',
        'run-tests',
        'analyze-coverage',
        'create-test-data',
        'modify-test-config'
      ],
      restrictions: [
        'no-production-code-changes',
        'no-config-changes',
        'no-dependency-changes'
      ],
      autoApprove: true,
      requiresConfirmation: [
        'integration-test-changes',
        'test-infrastructure-changes'
      ],
      timeLimit: 2700000, // 45 minutes
      maxOperations: 80
    });
    
    this.profiles.set('emergency-fixer', {
      name: 'Emergency Fixer',
      description: 'Emergency response with elevated permissions',
      permissions: [
        'read-all',
        'write-all',
        'delete-files',
        'rollback-changes',
        'deploy-fixes',
        'modify-config',
        'restart-services'
      ],
      restrictions: [],
      autoApprove: false,
      requiresConfirmation: [
        'all-operations'
      ],
      timeLimit: 900000, // 15 minutes
      maxOperations: 20
    });
    
    this.profiles.set('read-only', {
      name: 'Read Only Observer',
      description: 'Complete read access, no modifications',
      permissions: [
        'read-all',
        'analyze-all',
        'view-logs',
        'view-metrics'
      ],
      restrictions: [
        'no-modifications',
        'no-suggestions',
        'no-writes'
      ],
      autoApprove: true,
      requiresConfirmation: [],
      timeLimit: 7200000, // 2 hours
      maxOperations: 1000
    });
    
    console.log(`🔒 ${this.profiles.size} permission profiles initialized`);
  }
  
  // === PERMISSION VALIDATION ===
  
  async validatePermissions(requestedPermissions: string[], profileName: string = 'trusted-developer'): Promise<ValidationResult> {
    try {
      const profile = this.profiles.get(profileName);
      if (!profile) {
        throw new Error(`Permission profile '${profileName}' not found`);
      }
      
      // Check if all requested permissions are allowed
      const denied: string[] = [];
      for (const permission of requestedPermissions) {
        if (!this.hasPermission(profile, permission)) {
          denied.push(permission);
        }
      }
      
      if (denied.length > 0) {
        this.logAudit('permission-denied', {
          profile: profileName,
          requested: requestedPermissions,
          denied,
          timestamp: Date.now()
        });
        
        return {
          authorized: false,
          denied,
          profile: profileName,
          reason: `Permissions denied: ${denied.join(', ')}`
        };
      }
      
      this.logAudit('permission-granted', {
        profile: profileName,
        permissions: requestedPermissions,
        timestamp: Date.now()
      });
      
      return {
        authorized: true,
        profile: profileName,
        permissions: requestedPermissions,
        restrictions: profile.restrictions,
        autoApprove: profile.autoApprove
      };
      
    } catch (error) {
      this.logAudit('permission-error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        profile: profileName,
        requested: requestedPermissions,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  private hasPermission(profile: PermissionProfile, permission: string): boolean {
    // Check if permission is explicitly granted
    if (profile.permissions.includes(permission)) {
      return true;
    }
    
    // Check for wildcard permissions
    if (profile.permissions.includes('*') || profile.permissions.includes('all')) {
      return true;
    }
    
    // Check for category permissions (e.g., 'read-*' allows 'read-files')
    for (const granted of profile.permissions) {
      if (granted.endsWith('*')) {
        const prefix = granted.slice(0, -1);
        if (permission.startsWith(prefix)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  // === SESSION MANAGEMENT ===
  
  async createPermissionSession(config: SessionConfig): Promise<PermissionSession> {
    const sessionId = this.generateSessionId();
    const { profileName, context, permissions, timeLimit } = config;
    
    // Validate profile exists
    const profile = this.profiles.get(profileName);
    if (!profile) {
      throw new Error(`Permission profile '${profileName}' not found`);
    }
    
    // Check concurrent session limit
    if (this.activeSessions.size >= this.config.maxConcurrentSessions!) {
      throw new Error('Maximum concurrent sessions reached');
    }
    
    // Validate permissions
    const validation = await this.validatePermissions(permissions || [], profileName);
    if (!validation.authorized) {
      throw new Error(`Permission validation failed: ${validation.reason}`);
    }
    
    const session: PermissionSession = {
      id: sessionId,
      profile: profileName,
      permissions: permissions || profile.permissions,
      restrictions: profile.restrictions,
      context: context || {},
      createdAt: Date.now(),
      expiresAt: Date.now() + (timeLimit || profile.timeLimit),
      operationCount: 0,
      maxOperations: profile.maxOperations,
      autoApprove: profile.autoApprove,
      requiresConfirmation: profile.requiresConfirmation,
      status: 'active'
    };
    
    this.activeSessions.set(sessionId, session);
    
    this.logAudit('session-created', {
      sessionId,
      profile: profileName,
      permissions: session.permissions,
      timestamp: Date.now()
    });
    
    console.log(`🔐 Permission session created: ${sessionId} (${profileName})`);
    
    return session;
  }
  
  async validateOperation(sessionId: string, operation: OperationData): Promise<ValidationResult> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Permission session '${sessionId}' not found`);
    }
    
    // Check session expiry
    if (Date.now() > session.expiresAt) {
      this.expireSession(sessionId);
      throw new Error('Permission session has expired');
    }
    
    // Check operation count limit
    if (session.operationCount >= session.maxOperations) {
      throw new Error('Session operation limit exceeded');
    }
    
    // Check if operation is permitted
    const permitted = this.isOperationPermitted(session, operation);
    if (!permitted.allowed) {
      this.logAudit('operation-denied', {
        sessionId,
        operation: operation.type,
        reason: permitted.reason,
        timestamp: Date.now()
      });
      
      throw new Error(`Operation denied: ${permitted.reason}`);
    }
    
    // Check if operation requires confirmation
    const needsConfirmation = this.operationNeedsConfirmation(session, operation);
    
    // Update session
    session.operationCount++;
    session.lastActivity = Date.now();
    
    this.logAudit('operation-validated', {
      sessionId,
      operation: operation.type,
      requiresConfirmation: needsConfirmation,
      timestamp: Date.now()
    });
    
    return {
      authorized: true,
      sessionId,
      requiresConfirmation: needsConfirmation,
      remainingOperations: session.maxOperations - session.operationCount,
      session
    };
  }
  
  private isOperationPermitted(session: PermissionSession, operation: OperationData): OperationPermissionResult {
    const { type } = operation;
    
    // Check basic permission
    if (!session.permissions.includes(type) && !session.permissions.includes('*')) {
      return {
        allowed: false,
        reason: `Permission '${type}' not granted`
      };
    }
    
    // Check restrictions
    for (const restriction of session.restrictions) {
      if (this.violatesRestriction(restriction, operation)) {
        return {
          allowed: false,
          reason: `Operation violates restriction: ${restriction}`
        };
      }
    }
    
    // Check operation-specific rules
    const specificCheck = this.checkOperationSpecificRules(session, operation);
    if (!specificCheck.allowed) {
      return specificCheck;
    }
    
    return { allowed: true };
  }
  
  private violatesRestriction(restriction: string, operation: OperationData): boolean {
    const { type, target, data } = operation;
    
    switch (restriction) {
      case 'no-delete-critical-files':
        return type === 'delete-file' && target ? this.isCriticalFile(target) : false;
      
      case 'no-external-api-calls':
        return type === 'api-call' && target ? this.isExternalAPI(target) : false;
      
      case 'no-system-commands':
        return type === 'shell-command' && data?.command ? this.isSystemCommand(data.command) : false;
      
      case 'no-env-modifications':
        return type === 'modify-env' || (type === 'write-file' && target?.includes('.env'));
      
      case 'no-direct-changes':
        return ['write-file', 'delete-file', 'modify-file'].includes(type);
      
      case 'no-config-changes':
        return type.includes('config') || (target ? this.isConfigFile(target) : false);
      
      case 'no-major-changes':
        return this.isMajorChange(operation);
      
      default:
        return false;
    }
  }
  
  private operationNeedsConfirmation(session: PermissionSession, operation: OperationData): boolean {
    if (!session.autoApprove) {
      return true;
    }
    
    for (const confirmationType of session.requiresConfirmation) {
      if (this.matchesConfirmationType(confirmationType, operation)) {
        return true;
      }
    }
    
    return false;
  }
  
  private matchesConfirmationType(confirmationType: string, operation: OperationData): boolean {
    const { type, scope, impact, data } = operation;
    
    switch (confirmationType) {
      case 'all-operations':
        return true;
      
      case 'major-architectural-changes':
        return impact === 'major' || scope === 'architecture';
      
      case 'database-migrations':
        return type.includes('database') || type.includes('migration');
      
      case 'production-deployments':
        return type === 'deploy' && data?.environment === 'production';
      
      case 'breaking-api-changes':
        return type.includes('api') && impact === 'breaking';
      
      case 'data-structure-changes':
        return type.includes('schema') || type.includes('structure');
      
      default:
        return false;
    }
  }
  
  private checkOperationSpecificRules(session: PermissionSession, operation: OperationData): OperationPermissionResult {
    // Additional operation-specific validation logic can be added here
    return { allowed: true };
  }
  
  // === OPERATION CLASSIFICATION ===
  
  private isCriticalFile(filePath: string): boolean {
    const criticalPatterns = [
      /package\.json$/,
      /tsconfig\.json$/,
      /\.env/,
      /docker/i,
      /kubernetes/i,
      /\.config\./,
      /index\.(js|ts|html)$/,
      /main\.(js|ts)$/
    ];
    
    return criticalPatterns.some(pattern => pattern.test(filePath));
  }
  
  private isExternalAPI(url: string): boolean {
    const internalPatterns = [
      /^localhost/,
      /^127\.0\.0\.1/,
      /^192\.168\./,
      /^10\./,
      /\.local$/
    ];
    
    return !internalPatterns.some(pattern => pattern.test(url));
  }
  
  private isSystemCommand(command: string): boolean {
    const systemCommands = [
      'rm', 'del', 'format', 'fdisk', 'mkfs',
      'shutdown', 'reboot', 'halt',
      'chmod', 'chown', 'sudo', 'su',
      'systemctl', 'service',
      'killall', 'pkill'
    ];
    
    const firstWord = command.split(' ')[0];
    return systemCommands.includes(firstWord);
  }
  
  private isConfigFile(filePath: string): boolean {
    return /\.(config|conf|cfg|ini|toml|yaml|yml)$/i.test(filePath) ||
           filePath.includes('config') ||
           filePath.includes('settings');
  }
  
  private isMajorChange(operation: OperationData): boolean {
    const { type, data, scope } = operation;
    
    // Check for major change indicators
    if (scope === 'major' || scope === 'breaking') return true;
    if (data && data.linesChanged && data.linesChanged > 100) return true;
    if (data && data.filesAffected && data.filesAffected > 10) return true;
    
    const majorTypes = [
      'delete-multiple-files',
      'restructure-directory',
      'major-refactor',
      'architecture-change'
    ];
    
    return majorTypes.includes(type);
  }
  
  // === SESSION LIFECYCLE ===
  
  private expireSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'expired';
      session.expiredAt = Date.now();
      this.activeSessions.delete(sessionId);
      
      this.logAudit('session-expired', {
        sessionId,
        operationCount: session.operationCount,
        timestamp: Date.now()
      });
      
      console.log(`⏰ Permission session expired: ${sessionId}`);
    }
  }
  
  async closeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'closed';
      session.closedAt = Date.now();
      this.activeSessions.delete(sessionId);
      
      this.logAudit('session-closed', {
        sessionId,
        operationCount: session.operationCount,
        duration: session.closedAt - session.createdAt,
        timestamp: Date.now()
      });
      
      console.log(`🔒 Permission session closed: ${sessionId}`);
    }
  }
  
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredSessions: string[] = [];
      
      for (const [sessionId, session] of this.activeSessions) {
        if (now > session.expiresAt) {
          expiredSessions.push(sessionId);
        }
      }
      
      for (const sessionId of expiredSessions) {
        this.expireSession(sessionId);
      }
      
    }, 60000); // Check every minute
  }
  
  // === PERMISSION REQUESTS ===
  
  async handleRequest(request: PermissionRequest): Promise<any> {
    const {
      operation,
      sessionId,
      profile,
      permissions,
      context
    } = request;
    
    try {
      let session: PermissionSession;
      
      if (sessionId) {
        // Use existing session
        const existingSession = this.activeSessions.get(sessionId);
        if (!existingSession) {
          throw new Error('Session not found or expired');
        }
        session = existingSession;
      } else {
        // Create new session
        session = await this.createPermissionSession({
          profileName: profile || 'trusted-developer',
          permissions,
          context
        });
      }
      
      // Validate operation
      const validation = await this.validateOperation(session.id, operation);
      
      return {
        success: true,
        sessionId: session.id,
        authorized: validation.authorized,
        requiresConfirmation: validation.requiresConfirmation,
        remainingOperations: validation.remainingOperations
      };
      
    } catch (error) {
      this.logAudit('request-failed', {
        operation: operation.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }
  
  // === AUDIT LOGGING ===
  
  private logAudit(action: string, data: any): void {
    if (!this.config.auditLogging) return;
    
    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      action,
      data,
      timestamp: Date.now()
    };
    
    this.auditLog.push(logEntry);
    
    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
    
    // In production, this would also write to persistent storage
    console.log(`📋 Audit: ${action}`, data);
  }
  
  getAuditLog(filters: AuditFilters = {}): AuditLogEntry[] {
    let log = this.auditLog;
    
    if (filters.action) {
      log = log.filter(entry => entry.action === filters.action);
    }
    
    if (filters.sessionId) {
      log = log.filter(entry => entry.data.sessionId === filters.sessionId);
    }
    
    if (filters.since) {
      log = log.filter(entry => entry.timestamp >= filters.since);
    }
    
    if (filters.limit) {
      log = log.slice(-filters.limit);
    }
    
    return log;
  }
  
  // === UTILITIES ===
  
  private generateSessionId(): string {
    return `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  
  // === PUBLIC API ===
  
  getProfile(name: string): PermissionProfile | undefined {
    return this.profiles.get(name);
  }
  
  getAllProfiles(): Array<PermissionProfile & { name: string }> {
    return Array.from(this.profiles.entries()).map(([name, profile]) => ({
      name,
      ...profile
    }));
  }
  
  getActiveSessionsStats(): SessionStats {
    return {
      total: this.activeSessions.size,
      byProfile: this.getSessionsByProfile(),
      oldestSession: this.getOldestSessionAge(),
      averageOperations: this.getAverageOperations()
    };
  }
  
  private getSessionsByProfile(): Record<string, number> {
    const byProfile: Record<string, number> = {};
    for (const session of this.activeSessions.values()) {
      byProfile[session.profile] = (byProfile[session.profile] || 0) + 1;
    }
    return byProfile;
  }
  
  private getOldestSessionAge(): number {
    if (this.activeSessions.size === 0) return 0;
    
    const oldest = Math.min(
      ...Array.from(this.activeSessions.values()).map(s => s.createdAt)
    );
    
    return Date.now() - oldest;
  }
  
  private getAverageOperations(): number {
    if (this.activeSessions.size === 0) return 0;
    
    const total = Array.from(this.activeSessions.values())
      .reduce((sum, session) => sum + session.operationCount, 0);
    
    return Math.round(total / this.activeSessions.size);
  }
  
  // === CLEANUP ===
  
  async cleanup(): Promise<void> {
    // Close all active sessions
    for (const sessionId of this.activeSessions.keys()) {
      await this.closeSession(sessionId);
    }
    
    // Clear cache
    this.permissionCache.clear();
    
    console.log('🧹 Permission Manager cleanup completed');
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PermissionManager };
}