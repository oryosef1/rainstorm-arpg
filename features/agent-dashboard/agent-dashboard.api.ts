// Agent Dashboard API - External Interface
// Public API for other features to interact with the Agent Dashboard

interface ClaudeConfig {
  systemPrompt: string;
  userPrompt: string;
  permissions: string[];
  context: Record<string, any>;
}

interface WorkflowStep {
  type: 'claude-task' | 'shell-command';
  specialist?: string;
  task?: string;
  input?: string;
  command?: string;
  dependsOn?: string[];
  onFailure?: string;
}

interface WorkflowConfig {
  workflow: {
    name: string;
    steps: WorkflowStep[];
  };
  context: Record<string, any>;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  errors: string[];
}

interface AgentDashboardPod {
  executeClaude(config: ClaudeConfig): Promise<any>;
  executeWorkflow(config: WorkflowConfig): Promise<any>;
  getAPI(): {
    getActiveSessions(): any[];
    getRunningWorkflows(): any[];
    getSystemMetrics(): SystemMetrics;
    getSystemHealth(): SystemHealth;
    subscribe(clientId: string, callback: Function): void;
    unsubscribe(clientId: string): void;
  };
}

interface FeatureRegistry {
  getFeature(name: string): AgentDashboardPod;
}

declare global {
  interface Window {
    FeatureRegistry?: FeatureRegistry;
  }
  
  var FeatureRegistry: FeatureRegistry | undefined;
}

export const AgentDashboardAPI = {
  // API version for compatibility
  version: '1.0.0',
  
  // === CLAUDE CODE OPERATIONS ===
  
  // Execute Claude with custom configuration
  async executeClaude(config: ClaudeConfig): Promise<any> {
    return await this._getPod().executeClaude(config);
  },
  
  // Get active Claude sessions
  getActiveSessions(): any[] {
    return this._getPod().getAPI().getActiveSessions();
  },
  
  // === WORKFLOW OPERATIONS ===
  
  // Execute a workflow
  async executeWorkflow(workflowConfig: WorkflowConfig): Promise<any> {
    return await this._getPod().executeWorkflow(workflowConfig);
  },
  
  // Get running workflows
  getRunningWorkflows(): any[] {
    return this._getPod().getAPI().getRunningWorkflows();
  },
  
  // === MONITORING & METRICS ===
  
  // Get current system metrics
  getSystemMetrics(): SystemMetrics {
    return this._getPod().getAPI().getSystemMetrics();
  },
  
  // Get system health status
  getSystemHealth(): SystemHealth {
    return this._getPod().getAPI().getSystemHealth();
  },
  
  // === REAL-TIME UPDATES ===
  
  // Subscribe to real-time updates
  subscribe(clientId: string, callback: Function): void {
    return this._getPod().getAPI().subscribe(clientId, callback);
  },
  
  // Unsubscribe from updates
  unsubscribe(clientId: string): void {
    return this._getPod().getAPI().unsubscribe(clientId);
  },
  
  // === QUICK ACTIONS ===
  
  // Pre-configured Claude specialists
  specialists: {
    async codeReviewer(code: string, options: { language?: string } = {}): Promise<any> {
      return await this.executeClaude({
        systemPrompt: `You are a senior code reviewer with expertise in ${options.language || 'JavaScript'}. 
                      Provide constructive feedback focusing on code quality, best practices, and potential issues.`,
        userPrompt: `Please review this code:\n\n${code}`,
        permissions: ['read-files', 'suggest-improvements'],
        context: { type: 'code-review', language: options.language }
      });
    },
    
    async featureBuilder(requirements: string, options: Record<string, any> = {}): Promise<any> {
      return await this.executeClaude({
        systemPrompt: `You are a senior full-stack developer. Build complete features following best practices.
                      Use the existing codebase patterns and architecture.`,
        userPrompt: `Build this feature: ${requirements}`,
        permissions: ['read-codebase', 'write-code', 'create-files', 'run-tests'],
        context: { type: 'feature-development', requirements }
      });
    },
    
    async bugHunter(description: string, options: Record<string, any> = {}): Promise<any> {
      return await this.executeClaude({
        systemPrompt: `You are an expert debugger. Find and fix bugs systematically.
                      Analyze code, identify root causes, and provide comprehensive solutions.`,
        userPrompt: `Debug this issue: ${description}`,
        permissions: ['read-all', 'analyze-logs', 'suggest-fixes'],
        context: { type: 'bug-hunting', issue: description }
      });
    },
    
    async optimizer(target: string, options: Record<string, any> = {}): Promise<any> {
      return await this.executeClaude({
        systemPrompt: `You are a performance optimization expert. Improve code efficiency and performance.
                      Focus on measurable improvements and best practices.`,
        userPrompt: `Optimize: ${target}`,
        permissions: ['read-code', 'write-optimizations', 'run-benchmarks'],
        context: { type: 'optimization', target }
      });
    },
    
    async documenter(codeOrFeature: string, options: Record<string, any> = {}): Promise<any> {
      return await this.executeClaude({
        systemPrompt: `You are a technical writer. Create clear, comprehensive documentation.
                      Include examples, API references, and usage guides.`,
        userPrompt: `Document: ${codeOrFeature}`,
        permissions: ['read-code', 'write-docs', 'create-examples'],
        context: { type: 'documentation', subject: codeOrFeature }
      });
    },
    
    async tester(codeOrFeature: string, options: Record<string, any> = {}): Promise<any> {
      return await this.executeClaude({
        systemPrompt: `You are a QA engineer and test automation expert. Write comprehensive tests.
                      Cover unit tests, integration tests, and edge cases.`,
        userPrompt: `Write tests for: ${codeOrFeature}`,
        permissions: ['read-code', 'write-tests', 'run-tests'],
        context: { type: 'testing', subject: codeOrFeature }
      });
    }
  },
  
  // === PRE-BUILT WORKFLOWS ===
  
  workflows: {
    async completeFeature(requirements: string): Promise<any> {
      return await this.executeWorkflow({
        workflow: {
          name: 'Complete Feature Development',
          steps: [
            {
              type: 'claude-task',
              specialist: 'featureBuilder',
              task: 'Analyze requirements and create implementation plan',
              input: requirements
            },
            {
              type: 'claude-task',
              specialist: 'codeReviewer', 
              task: 'Review implementation plan',
              dependsOn: ['step-1']
            },
            {
              type: 'claude-task',
              specialist: 'featureBuilder',
              task: 'Implement the feature',
              dependsOn: ['step-2']
            },
            {
              type: 'claude-task',
              specialist: 'tester',
              task: 'Write comprehensive tests',
              dependsOn: ['step-3']
            },
            {
              type: 'shell-command',
              command: 'npm test',
              onFailure: 'retry-with-fixes'
            },
            {
              type: 'claude-task',
              specialist: 'documenter',
              task: 'Generate documentation',
              dependsOn: ['step-4', 'step-5']
            }
          ]
        },
        context: { requirements }
      });
    },
    
    async huntAndFixBug(bugDescription: string): Promise<any> {
      return await this.executeWorkflow({
        workflow: {
          name: 'Bug Hunt and Fix',
          steps: [
            {
              type: 'claude-task',
              specialist: 'bugHunter',
              task: 'Analyze bug report and locate issue',
              input: bugDescription
            },
            {
              type: 'claude-task',
              specialist: 'bugHunter',
              task: 'Implement fix',
              dependsOn: ['step-1']
            },
            {
              type: 'claude-task',
              specialist: 'tester',
              task: 'Write regression tests',
              dependsOn: ['step-2']
            },
            {
              type: 'shell-command',
              command: 'npm test',
              dependsOn: ['step-3']
            },
            {
              type: 'claude-task',
              specialist: 'codeReviewer',
              task: 'Review fix for quality and side effects',
              dependsOn: ['step-4']
            }
          ]
        },
        context: { bugDescription }
      });
    },
    
    async optimizePerformance(target: string): Promise<any> {
      return await this.executeWorkflow({
        workflow: {
          name: 'Performance Optimization',
          steps: [
            {
              type: 'shell-command',
              command: 'npm run profile',
              task: 'Generate performance baseline'
            },
            {
              type: 'claude-task',
              specialist: 'optimizer',
              task: 'Analyze performance bottlenecks',
              input: target
            },
            {
              type: 'claude-task',
              specialist: 'optimizer',
              task: 'Implement optimizations',
              dependsOn: ['step-2']
            },
            {
              type: 'shell-command',
              command: 'npm run profile',
              task: 'Generate performance report',
              dependsOn: ['step-3']
            },
            {
              type: 'claude-task',
              specialist: 'tester',
              task: 'Add performance tests',
              dependsOn: ['step-4']
            }
          ]
        },
        context: { target }
      });
    }
  },
  
  // === EVENTS THIS FEATURE EMITS ===
  
  events: {
    DASHBOARD_INITIALIZED: 'dashboard.initialized',
    CLAUDE_EXECUTION_STARTED: 'dashboard.claude.started',
    CLAUDE_EXECUTION_COMPLETED: 'dashboard.claude.completed',
    CLAUDE_EXECUTION_ERROR: 'dashboard.claude.error',
    WORKFLOW_STARTED: 'dashboard.workflow.started',
    WORKFLOW_PROGRESS: 'dashboard.workflow.progress',
    WORKFLOW_COMPLETED: 'dashboard.workflow.completed',
    WORKFLOW_ERROR: 'dashboard.workflow.error',
    SYSTEM_METRICS_UPDATED: 'dashboard.metrics.updated',
    DASHBOARD_ERROR: 'dashboard.error'
  },
  
  // === EVENTS THIS FEATURE LISTENS TO ===
  
  listensTo: [
    'game.status.changed',
    'test.completed',
    'build.completed',
    'deploy.completed',
    'file.changed',
    'performance.metrics.updated'
  ],
  
  // === INTERNAL METHODS ===
  
  _getPod(): AgentDashboardPod {
    // Get the pod instance from the global registry
    if (typeof window !== 'undefined' && window.FeatureRegistry) {
      return window.FeatureRegistry.getFeature('agent-dashboard');
    } else if (typeof global !== 'undefined' && global.FeatureRegistry) {
      return global.FeatureRegistry.getFeature('agent-dashboard');
    }
    throw new Error('Agent Dashboard pod not found in registry');
  }
};

// Default export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AgentDashboardAPI };
}