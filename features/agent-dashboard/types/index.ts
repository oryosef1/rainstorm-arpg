// Agent Dashboard TypeScript Type Definitions
// Comprehensive type system for the complete dashboard implementation

// === CORE INTERFACES ===

export interface ClaudeConfig {
  systemPrompt: string;
  userPrompt: string;
  permissions: Permission[];
  context: ProjectContext;
  specialist?: ClaudeSpecialist;
  profile?: PermissionProfile;
  sessionId?: string;
  timeout?: number;
}

export interface ClaudeResult {
  response: string;
  toolsUsed: string[];
  duration: number;
  timestamp: number;
  sessionId: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface ClaudeSession {
  id: string;
  specialist: ClaudeSpecialist;
  profile: PermissionProfile;
  permissions: Permission[];
  context: ProjectContext;
  createdAt: number;
  lastActivity: number;
  status: 'active' | 'idle' | 'executing' | 'terminated';
  operationCount: number;
  maxOperations: number;
}

// === CLAUDE SPECIALISTS ===

export type ClaudeSpecialist = 
  | 'feature-builder'
  | 'code-reviewer' 
  | 'bug-hunter'
  | 'optimizer'
  | 'documenter'
  | 'tester'
  | 'security-expert'
  | 'performance-expert'
  | 'frontend-expert'
  | 'backend-expert';

export interface ClaudeSpecialistConfig {
  name: string;
  icon: string;
  description: string;
  defaultPrompt: string;
  permissions: Permission[];
  capabilities: string[];
  expertise: string[];
}

// === PERMISSION SYSTEM ===

export type Permission = 
  | 'read-all'
  | 'read-codebase'
  | 'read-tests'
  | 'read-docs'
  | 'read-logs'
  | 'write-code'
  | 'write-tests'
  | 'write-docs'
  | 'create-files'
  | 'modify-files'
  | 'delete-files'
  | 'run-tests'
  | 'run-commands'
  | 'commit-changes'
  | 'deploy'
  | 'rollback'
  | 'analyze-code'
  | 'analyze-performance'
  | 'analyze-logs'
  | 'suggest-improvements'
  | 'create-comments'
  | 'modify-config'
  | 'restart-services';

export type PermissionProfile = 
  | 'trusted-developer'
  | 'code-reviewer'
  | 'feature-builder'
  | 'bug-hunter'
  | 'optimizer'
  | 'documenter'
  | 'tester'
  | 'emergency-fixer'
  | 'read-only';

export interface PermissionProfileConfig {
  name: string;
  description: string;
  permissions: Permission[];
  restrictions: string[];
  autoApprove: boolean;
  requiresConfirmation: string[];
  timeLimit: number;
  maxOperations: number;
}

export interface PermissionValidation {
  authorized: boolean;
  denied?: Permission[];
  profile: PermissionProfile;
  reason?: string;
  restrictions?: string[];
  autoApprove?: boolean;
}

export interface PermissionSession {
  id: string;
  profile: PermissionProfile;
  permissions: Permission[];
  restrictions: string[];
  context: Record<string, any>;
  createdAt: number;
  expiresAt: number;
  operationCount: number;
  maxOperations: number;
  autoApprove: boolean;
  requiresConfirmation: string[];
  status: 'active' | 'expired' | 'closed';
}

// === WORKFLOW SYSTEM ===

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  metadata: WorkflowMetadata;
  version: string;
  tags?: string[];
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  position: { x: number; y: number };
  config: WorkflowStepConfig;
  dependsOn: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  timeout?: number;
}

export type WorkflowStepType = 
  | 'claude-task'
  | 'shell-command'
  | 'file-operation'
  | 'conditional'
  | 'delay'
  | 'parallel'
  | 'api-call'
  | 'notification';

export interface WorkflowStepConfig {
  // Claude task config
  specialist?: ClaudeSpecialist;
  task?: string;
  permissions?: Permission[];
  
  // Shell command config
  command?: string;
  workingDirectory?: string;
  
  // File operation config
  operation?: 'read' | 'write' | 'copy' | 'delete' | 'mkdir';
  path?: string;
  content?: string;
  
  // Conditional config
  condition?: string;
  thenSteps?: string[];
  elseSteps?: string[];
  
  // Delay config
  duration?: number;
  
  // Parallel config
  steps?: string[];
  
  // API call config
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  
  // Notification config
  title?: string;
  message?: string;
  level?: 'info' | 'warning' | 'error' | 'success';
}

export interface WorkflowMetadata {
  created: number;
  lastModified?: number;
  version: string;
  author?: string;
  category?: string;
  estimatedDuration?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  currentStep?: string;
  results: Record<string, WorkflowStepResult>;
  context: WorkflowContext;
  progress: number;
  error?: string;
}

export interface WorkflowStepResult {
  stepId: string;
  status: 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  duration: number;
  timestamp: number;
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, any>;
  projectPath: string;
  environment: string;
  source: string;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  category: string;
  steps: Omit<WorkflowStep, 'id' | 'status'>[];
  metadata: Partial<WorkflowMetadata>;
  requirements?: string[];
  examples?: string[];
}

// === REAL-TIME SYSTEM ===

export interface RealtimeEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
  data?: Record<string, any>;
  source: string;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeConnections: number;
  responseTime: number;
  throughput: number;
  timestamp: number;
}

export interface RealtimeConnection {
  id: string;
  userId?: string;
  connectedAt: number;
  lastActivity: number;
  subscriptions: string[];
  metadata: Record<string, any>;
}

// === PROJECT CONTEXT ===

export interface ProjectContext {
  name: string;
  path: string;
  type: 'web' | 'mobile' | 'api' | 'desktop' | 'library';
  framework: string;
  language: string;
  version: string;
  dependencies: string[];
  scripts: Record<string, string>;
  environment: 'development' | 'staging' | 'production';
  gitBranch?: string;
  lastCommit?: string;
}

// === DASHBOARD STATE ===

export interface DashboardState {
  claude: ClaudeState;
  workflows: WorkflowState;
  realtime: RealtimeState;
  permissions: PermissionState;
  system: SystemState;
}

export interface ClaudeState {
  sessions: ClaudeSession[];
  activeSessions: number;
  isConnected: boolean;
  currentExecution: ClaudeExecution | null;
  executionHistory: ClaudeExecution[];
}

export interface ClaudeExecution {
  id: string;
  sessionId: string;
  specialist: ClaudeSpecialist;
  profile: PermissionProfile;
  message: string;
  status: 'executing' | 'completed' | 'error';
  result?: ClaudeResult;
  error?: string;
  timestamp: number;
  duration?: number;
}

export interface WorkflowState {
  activeWorkflows: WorkflowExecution[];
  templates: WorkflowTemplate[];
  executionHistory: WorkflowExecution[];
  isBuilderOpen: boolean;
  selectedWorkflow: Workflow | null;
}

export interface RealtimeState {
  connections: number;
  isConnected: boolean;
  events: RealtimeEvent[];
  metrics: SystemMetrics;
  subscriptions: string[];
}

export interface PermissionState {
  activeSessions: PermissionSession[];
  profiles: PermissionProfileConfig[];
  auditLog: AuditLogEntry[];
}

export interface SystemState {
  health: 'healthy' | 'warning' | 'critical';
  alerts: SystemAlert[];
  performance: PerformanceMetrics;
  uptime: number;
}

// === AUDIT LOGGING ===

export interface AuditLogEntry {
  id: string;
  action: string;
  userId?: string;
  sessionId?: string;
  data: Record<string, any>;
  timestamp: number;
  ip?: string;
  userAgent?: string;
}

// === SYSTEM ALERTS ===

export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  source: string;
  resolved?: boolean;
  resolvedAt?: number;
}

// === PERFORMANCE METRICS ===

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    claudeExecutionsPerMinute: number;
    workflowsPerHour: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
  errors: {
    errorRate: number;
    errorCount: number;
    lastError?: string;
  };
}

// === API RESPONSES ===

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  requestId: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// === CONFIGURATION ===

export interface DashboardConfig {
  debug: boolean;
  enableRealtime: boolean;
  permissions: {
    defaultProfile: PermissionProfile;
    strictMode: boolean;
    auditLogging: boolean;
  };
  claude: {
    maxConcurrentSessions: number;
    defaultTimeout: number;
    enableSimulation: boolean;
    apiKey?: string;
    baseUrl?: string;
  };
  workflows: {
    enableVisualBuilder: boolean;
    saveToStorage: boolean;
    maxConcurrentWorkflows: number;
    defaultTimeout: number;
  };
  realtime: {
    enableMetrics: boolean;
    metricsInterval: number;
    eventRetention: number;
    maxConnections: number;
  };
  database?: {
    url: string;
    maxConnections: number;
    ssl: boolean;
  };
  security: {
    encryptionKey?: string;
    jwtSecret?: string;
    sessionTimeout: number;
  };
}

// === EVENT BUS ===

export interface EventBus {
  on(event: string, handler: (data: any) => void | Promise<void>): void;
  off(event: string, handler: (data: any) => void | Promise<void>): void;
  emit(event: string, data: any): Promise<any>;
  removeAllListeners(): void;
}

// === COMPONENT PROPS ===

export interface AgentDashboardProps {
  eventBus?: EventBus;
  config?: Partial<DashboardConfig>;
}

export interface ClaudeInterfaceProps {
  onExecute: (config: ClaudeConfig) => Promise<ClaudeResult>;
  activeSessions?: ClaudeSession[];
  isConnected?: boolean;
}

export interface WorkflowBuilderProps {
  onExecute: (workflow: { workflow: Workflow; context: WorkflowContext }) => Promise<any>;
  onSave: (workflow: Workflow) => Promise<void>;
  templates?: WorkflowTemplate[];
}

export interface RealtimeMonitorProps {
  connections?: number;
  events?: RealtimeEvent[];
  metrics?: SystemMetrics;
  activeSessions?: ClaudeSession[];
  activeWorkflows?: WorkflowExecution[];
  systemAlerts?: SystemAlert[];
}

// === UTILITY TYPES ===

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// === ERROR TYPES ===

export class DashboardError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DashboardError';
  }
}

export class ClaudeIntegrationError extends DashboardError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CLAUDE_INTEGRATION_ERROR', details);
    this.name = 'ClaudeIntegrationError';
  }
}

export class WorkflowExecutionError extends DashboardError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'WORKFLOW_EXECUTION_ERROR', details);
    this.name = 'WorkflowExecutionError';
  }
}

export class PermissionError extends DashboardError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'PERMISSION_ERROR', details);
    this.name = 'PermissionError';
  }
}

// === EXPORT ALL ===

export default {
  // Core interfaces
  ClaudeConfig,
  ClaudeResult,
  ClaudeSession,
  
  // Workflow types
  Workflow,
  WorkflowStep,
  WorkflowExecution,
  WorkflowTemplate,
  
  // Permission types
  PermissionSession,
  PermissionProfileConfig,
  PermissionValidation,
  
  // State types
  DashboardState,
  ClaudeState,
  WorkflowState,
  RealtimeState,
  
  // Configuration
  DashboardConfig,
  
  // Component props
  AgentDashboardProps,
  ClaudeInterfaceProps,
  WorkflowBuilderProps,
  RealtimeMonitorProps,
  
  // Error types
  DashboardError,
  ClaudeIntegrationError,
  WorkflowExecutionError,
  PermissionError
};