// Agent Dashboard Integration Example
// Demonstrates how to integrate and use the complete Agent Dashboard system

import React from 'react';
import ReactDOM from 'react-dom/client';
import AgentDashboard from './components/AgentDashboard.jsx';
import { AgentDashboardPod } from './agent-dashboard.pod.js';

// Initialize the Agent Dashboard Pod System
async function initializeAgentDashboard() {
  console.log('🚀 Initializing Agent Dashboard System...');
  
  try {
    // Create dashboard pod instance
    const dashboardPod = new AgentDashboardPod({
      debug: true,
      enableRealtime: true,
      permissions: {
        defaultProfile: 'trusted-developer',
        strictMode: false,
        auditLogging: true
      },
      claude: {
        maxConcurrentSessions: 10,
        defaultTimeout: 300000, // 5 minutes
        enableSimulation: true // For demo purposes
      },
      workflows: {
        enableVisualBuilder: true,
        saveToStorage: true,
        maxConcurrentWorkflows: 5
      }
    });
    
    // Initialize the pod
    await dashboardPod.initialize();
    console.log('✅ Agent Dashboard Pod initialized');
    
    // Setup React application
    const root = ReactDOM.createRoot(document.getElementById('dashboard-root'));
    
    // Render the dashboard with pod integration
    root.render(
      <AgentDashboard 
        eventBus={dashboardPod.eventBus}
        config={dashboardPod.config}
      />
    );
    
    console.log('✅ Dashboard UI rendered');
    
    // Demonstrate dashboard capabilities
    await demonstrateDashboardCapabilities(dashboardPod);
    
    return dashboardPod;
    
  } catch (error) {
    console.error('❌ Failed to initialize Agent Dashboard:', error);
    throw error;
  }
}

// Demonstration of dashboard capabilities
async function demonstrateDashboardCapabilities(dashboardPod) {
  console.log('🎯 Demonstrating Agent Dashboard capabilities...');
  
  try {
    // 1. Claude Integration Demo
    console.log('1️⃣ Testing Claude integration...');
    
    const claudeResult = await dashboardPod.api.executeClaude({
      specialist: 'feature-builder',
      input: 'Create a simple React component for user authentication',
      permissions: ['read-codebase', 'write-code', 'create-files'],
      profile: 'trusted-developer'
    });
    
    console.log('✅ Claude execution result:', claudeResult);
    
    // 2. Workflow Builder Demo
    console.log('2️⃣ Testing workflow execution...');
    
    const workflowResult = await dashboardPod.api.workflows.completeFeature({
      name: 'User Profile Feature',
      requirements: 'User can view and edit their profile information',
      includeTests: true,
      includeDocs: true
    });
    
    console.log('✅ Workflow execution result:', workflowResult);
    
    // 3. Real-time Monitoring Demo
    console.log('3️⃣ Testing real-time monitoring...');
    
    // Simulate some events
    await dashboardPod.eventBus.emit('system:alert', {
      level: 'info',
      title: 'Demo Event',
      message: 'Dashboard demonstration in progress'
    });
    
    await dashboardPod.eventBus.emit('claude:session-created', {
      session: {
        id: 'demo-session-1',
        specialist: 'code-reviewer',
        profile: 'trusted-developer',
        status: 'active'
      }
    });
    
    console.log('✅ Real-time events triggered');
    
    // 4. Permission System Demo
    console.log('4️⃣ Testing permission system...');
    
    const permissionResult = await dashboardPod.permissionManager.validatePermissions(
      ['read-all', 'write-code', 'run-tests'],
      'trusted-developer'
    );
    
    console.log('✅ Permission validation result:', permissionResult);
    
    console.log('🎉 Dashboard demonstration completed successfully!');
    
  } catch (error) {
    console.error('❌ Dashboard demonstration failed:', error);
  }
}

// Usage Examples for Different Scenarios

// Example 1: Basic Claude interaction
export async function exampleClaudeInteraction(dashboardPod) {
  console.log('📝 Example: Basic Claude interaction');
  
  const result = await dashboardPod.api.executeClaude({
    specialist: 'bug-hunter',
    input: 'Find and fix the memory leak in the user session management',
    permissions: ['read-all', 'analyze-logs', 'write-minimal-fixes'],
    profile: 'bug-hunter'
  });
  
  return result;
}

// Example 2: Complex workflow creation
export async function exampleComplexWorkflow(dashboardPod) {
  console.log('🔄 Example: Complex workflow creation');
  
  const workflow = {
    name: 'API Integration Workflow',
    description: 'Complete API integration with testing and documentation',
    steps: [
      {
        type: 'claude-task',
        config: {
          specialist: 'feature-builder',
          task: 'Design API integration architecture'
        }
      },
      {
        type: 'claude-task',
        config: {
          specialist: 'feature-builder',
          task: 'Implement API client with error handling'
        }
      },
      {
        type: 'claude-task',
        config: {
          specialist: 'tester',
          task: 'Create comprehensive API tests'
        }
      },
      {
        type: 'shell-command',
        config: {
          command: 'npm test -- --coverage',
          workingDirectory: './'
        }
      },
      {
        type: 'claude-task',
        config: {
          specialist: 'documenter',
          task: 'Generate API documentation'
        }
      },
      {
        type: 'claude-task',
        config: {
          specialist: 'code-reviewer',
          task: 'Review implementation for best practices'
        }
      }
    ]
  };
  
  const result = await dashboardPod.workflowEngine.executeWorkflow(workflow);
  return result;
}

// Example 3: Multi-Claude coordination
export async function exampleMultiClaudeCoordination(dashboardPod) {
  console.log('🧠 Example: Multi-Claude coordination');
  
  // Start multiple Claude operations in parallel
  const operations = [
    dashboardPod.api.specialists.codeReviewer(
      'Review frontend authentication logic',
      { focus: 'security' }
    ),
    dashboardPod.api.specialists.tester(
      'Create unit tests for user service',
      { coverage: 'minimum-80%' }
    ),
    dashboardPod.api.specialists.documenter(
      'Update API documentation for new endpoints',
      { format: 'openapi' }
    )
  ];
  
  // Wait for all operations to complete
  const results = await Promise.all(operations);
  
  console.log('✅ Multi-Claude coordination results:', results);
  return results;
}

// Example 4: Real-time monitoring setup
export async function exampleRealtimeMonitoring(dashboardPod) {
  console.log('📊 Example: Real-time monitoring setup');
  
  // Setup custom event listeners
  dashboardPod.eventBus.on('claude:execution-started', (data) => {
    console.log(`🎯 Claude execution started: ${data.execution.specialist}`);
  });
  
  dashboardPod.eventBus.on('workflow:step-completed', (data) => {
    console.log(`✅ Workflow step completed: ${data.step.name}`);
  });
  
  dashboardPod.eventBus.on('system:performance-alert', (data) => {
    console.log(`⚠️ Performance alert: ${data.metric} at ${data.value}%`);
  });
  
  // Start monitoring
  await dashboardPod.realtimeSystem.startMonitoring({
    metricsInterval: 5000,
    eventRetention: 1000,
    enablePerformanceAlerts: true
  });
  
  console.log('✅ Real-time monitoring active');
}

// Example 5: Permission-based operations
export async function examplePermissionBasedOperations(dashboardPod) {
  console.log('🔒 Example: Permission-based operations');
  
  // Create restricted session for code review
  const reviewSession = await dashboardPod.permissionManager.createPermissionSession({
    profileName: 'code-reviewer',
    permissions: ['read-all', 'analyze-code', 'suggest-improvements'],
    context: { purpose: 'security-review' },
    timeLimit: 1800000 // 30 minutes
  });
  
  // Execute Claude with restricted permissions
  const reviewResult = await dashboardPod.api.executeClaude({
    sessionId: reviewSession.id,
    specialist: 'code-reviewer',
    input: 'Review authentication middleware for security vulnerabilities'
  });
  
  // Create emergency session for critical fixes
  const emergencySession = await dashboardPod.permissionManager.createPermissionSession({
    profileName: 'emergency-fixer',
    context: { emergency: 'production-issue' },
    timeLimit: 900000 // 15 minutes
  });
  
  console.log('✅ Permission-based operations configured');
  return { reviewResult, emergencySession };
}

// HTML Template for Dashboard Integration
export const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Dashboard - Claude Code Orchestration</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #0f172a;
            color: white;
        }
        #dashboard-root {
            height: 100vh;
            width: 100vw;
        }
    </style>
</head>
<body>
    <div id="dashboard-root">
        <div class="flex items-center justify-center h-full">
            <div class="text-center">
                <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h2 class="text-xl font-semibold mb-2">Initializing Agent Dashboard...</h2>
                <p class="text-gray-400">Loading Claude Code orchestration system</p>
            </div>
        </div>
    </div>
    
    <script type="module">
        import { initializeAgentDashboard } from './example-integration.js';
        
        // Initialize the dashboard when page loads
        window.addEventListener('DOMContentLoaded', async () => {
            try {
                const dashboard = await initializeAgentDashboard();
                console.log('🎉 Agent Dashboard ready!', dashboard);
                
                // Make dashboard available globally for testing
                window.agentDashboard = dashboard;
                
            } catch (error) {
                console.error('Failed to initialize dashboard:', error);
                
                // Show error state
                document.getElementById('dashboard-root').innerHTML = \`
                    <div class="flex items-center justify-center h-full">
                        <div class="text-center">
                            <div class="text-red-500 text-6xl mb-4">⚠️</div>
                            <h2 class="text-xl font-semibold text-red-400 mb-2">Dashboard Initialization Failed</h2>
                            <p class="text-gray-400">\${error.message}</p>
                            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">
                                Retry
                            </button>
                        </div>
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>
`;

// Export the main initialization function
export default initializeAgentDashboard;

console.log('🚀 Agent Dashboard Integration Example loaded successfully');
console.log('💡 Usage: Import and call initializeAgentDashboard() to start the dashboard');
console.log('📖 See example functions for specific use cases and patterns');