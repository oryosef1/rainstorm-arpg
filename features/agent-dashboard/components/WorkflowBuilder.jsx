// Workflow Builder Component - Visual drag-and-drop workflow creation
// Allows users to create complex automation workflows with a visual interface

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Play, Save, Upload, Download, Plus, Settings, Trash2, 
  GitBranch, Clock, Command, FileText, Link, Zap 
} from 'lucide-react';

const WorkflowBuilder = ({ onExecute, onSave, templates = [] }) => {
  const [workflow, setWorkflow] = useState({
    name: 'New Workflow',
    description: '',
    steps: [],
    metadata: {
      created: Date.now(),
      version: '1.0.0'
    }
  });
  
  const [selectedStep, setSelectedStep] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedStep, setDraggedStep] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState({});
  
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const stepTypes = {
    'claude-task': {
      name: 'Claude Task',
      icon: <Zap className="w-4 h-4" />,
      color: 'bg-blue-500',
      description: 'Execute Claude with specific prompts',
      defaultConfig: {
        specialist: 'feature-builder',
        task: 'Enter task description',
        permissions: ['read-codebase', 'write-code']
      }
    },
    'shell-command': {
      name: 'Shell Command',
      icon: <Command className="w-4 h-4" />,
      color: 'bg-green-500',
      description: 'Run terminal commands',
      defaultConfig: {
        command: 'echo "Hello World"',
        workingDirectory: './',
        timeout: 30000
      }
    },
    'file-operation': {
      name: 'File Operation',
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-purple-500',
      description: 'Read, write, or modify files',
      defaultConfig: {
        operation: 'read',
        path: './file.txt',
        content: ''
      }
    },
    'conditional': {
      name: 'Conditional',
      icon: <GitBranch className="w-4 h-4" />,
      color: 'bg-yellow-500',
      description: 'Branch execution based on conditions',
      defaultConfig: {
        condition: 'true',
        thenSteps: [],
        elseSteps: []
      }
    },
    'delay': {
      name: 'Delay',
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-gray-500',
      description: 'Wait for specified time',
      defaultConfig: {
        duration: 1000
      }
    },
    'parallel': {
      name: 'Parallel',
      icon: <Link className="w-4 h-4" />,
      color: 'bg-indigo-500',
      description: 'Execute multiple steps simultaneously',
      defaultConfig: {
        steps: []
      }
    }
  };
  
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);
  
  const addStep = useCallback((stepType, position = null) => {
    const newStep = {
      id: `step-${Date.now()}`,
      type: stepType,
      name: stepTypes[stepType].name,
      position: position || { 
        x: Math.random() * (canvasSize.width - 200), 
        y: Math.random() * (canvasSize.height - 100) 
      },
      config: { ...stepTypes[stepType].defaultConfig },
      dependsOn: [],
      status: 'pending'
    };
    
    setWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  }, [canvasSize]);
  
  const updateStep = useCallback((stepId, updates) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  }, []);
  
  const deleteStep = useCallback((stepId) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
        .map(step => ({
          ...step,
          dependsOn: step.dependsOn.filter(dep => dep !== stepId)
        }))
    }));
    setSelectedStep(null);
  }, []);
  
  const addDependency = useCallback((fromStepId, toStepId) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === toStepId 
          ? { 
              ...step, 
              dependsOn: [...new Set([...step.dependsOn, fromStepId])]
            }
          : step
      )
    }));
  }, []);
  
  const removeDependency = useCallback((fromStepId, toStepId) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === toStepId 
          ? { 
              ...step, 
              dependsOn: step.dependsOn.filter(dep => dep !== fromStepId)
            }
          : step
      )
    }));
  }, []);
  
  const handleStepDrag = useCallback((stepId, position) => {
    updateStep(stepId, { position });
  }, [updateStep]);
  
  const executeWorkflow = useCallback(async () => {
    setIsExecuting(true);
    setExecutionProgress({});
    
    try {
      const result = await onExecute({
        workflow,
        context: { source: 'workflow-builder' }
      });
      
      console.log('Workflow executed successfully:', result);
    } catch (error) {
      console.error('Workflow execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [workflow, onExecute]);
  
  const saveWorkflow = useCallback(() => {
    const workflowData = {
      ...workflow,
      metadata: {
        ...workflow.metadata,
        lastModified: Date.now()
      }
    };
    
    onSave(workflowData);
  }, [workflow, onSave]);
  
  const loadTemplate = useCallback((template) => {
    setWorkflow({
      ...template,
      metadata: {
        ...template.metadata,
        created: Date.now(),
        version: '1.0.0'
      },
      steps: template.steps.map((step, index) => ({
        ...step,
        id: `step-${Date.now()}-${index}`,
        position: {
          x: 100 + (index % 3) * 250,
          y: 100 + Math.floor(index / 3) * 150
        },
        status: 'pending'
      }))
    });
    setShowTemplates(false);
  }, []);
  
  const exportWorkflow = useCallback(() => {
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [workflow]);
  
  const importWorkflow = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedWorkflow = JSON.parse(e.target.result);
        setWorkflow(importedWorkflow);
      } catch (error) {
        console.error('Failed to import workflow:', error);
      }
    };
    reader.readAsText(file);
  }, []);
  
  const getStepConnections = useCallback(() => {
    const connections = [];
    
    workflow.steps.forEach(step => {
      step.dependsOn.forEach(depId => {
        const depStep = workflow.steps.find(s => s.id === depId);
        if (depStep) {
          connections.push({
            from: depStep,
            to: step
          });
        }
      });
    });
    
    return connections;
  }, [workflow.steps]);
  
  const StepNode = ({ step, isSelected, onSelect, onDrag }) => {
    const stepType = stepTypes[step.type];
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const handleMouseDown = (e) => {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - step.position.x,
        y: e.clientY - step.position.y
      });
      onSelect(step);
    };
    
    const handleMouseMove = useCallback((e) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        };
        onDrag(step.id, newPosition);
      }
    }, [isDragging, dragStart, step.id, onDrag]);
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove]);
    
    const getStatusColor = () => {
      switch (step.status) {
        case 'running': return 'border-blue-400 shadow-blue-400/50';
        case 'completed': return 'border-green-400 shadow-green-400/50';
        case 'failed': return 'border-red-400 shadow-red-400/50';
        default: return 'border-gray-600';
      }
    };
    
    return (
      <div
        className={`absolute bg-gray-800 border-2 rounded-lg p-3 cursor-pointer transition-all select-none min-w-[180px] ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${getStatusColor()}`}
        style={{
          left: step.position.x,
          top: step.position.y,
          zIndex: isSelected ? 10 : 1
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2 mb-2">
          <div className={`p-1 rounded ${stepType.color} text-white`}>
            {stepType.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white text-sm truncate">
              {step.name}
            </div>
            <div className="text-xs text-gray-400">
              {stepType.name}
            </div>
          </div>
        </div>
        
        {step.dependsOn.length > 0 && (
          <div className="text-xs text-gray-400 mb-1">
            Depends on: {step.dependsOn.length} step(s)
          </div>
        )}
        
        {step.status !== 'pending' && (
          <div className="text-xs">
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
              step.status === 'running' ? 'bg-blue-400' :
              step.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
            }`} />
            {step.status}
          </div>
        )}
      </div>
    );
  };
  
  const ConnectionLine = ({ from, to }) => {
    const startX = from.position.x + 90; // Half width of step node
    const startY = from.position.y + 20; // Approximate center
    const endX = to.position.x + 90;
    const endY = to.position.y + 20;
    
    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6B7280"
            />
          </marker>
        </defs>
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#6B7280"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      </svg>
    );
  };
  
  const StepPalette = () => (
    <div className="space-y-2">
      <h4 className="font-medium text-white mb-3">Step Types</h4>
      {Object.entries(stepTypes).map(([type, config]) => (
        <button
          key={type}
          onClick={() => addStep(type)}
          className="w-full p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded ${config.color} text-white`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-white text-sm">
                {config.name}
              </div>
              <div className="text-xs text-gray-400">
                {config.description}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
  
  const StepConfigPanel = () => {
    if (!selectedStep) {
      return (
        <div className="text-center text-gray-400 py-8">
          <Settings className="w-8 h-8 mx-auto mb-2" />
          <p>Select a step to configure</p>
        </div>
      );
    }
    
    const stepType = stepTypes[selectedStep.type];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">Step Configuration</h4>
          <button
            onClick={() => deleteStep(selectedStep.id)}
            className="p-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Step Name
          </label>
          <input
            type="text"
            value={selectedStep.name}
            onChange={(e) => updateStep(selectedStep.id, { name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
        
        {selectedStep.type === 'claude-task' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Specialist
              </label>
              <select
                value={selectedStep.config.specialist}
                onChange={(e) => updateStep(selectedStep.id, {
                  config: { ...selectedStep.config, specialist: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="feature-builder">Feature Builder</option>
                <option value="code-reviewer">Code Reviewer</option>
                <option value="bug-hunter">Bug Hunter</option>
                <option value="optimizer">Optimizer</option>
                <option value="documenter">Documenter</option>
                <option value="tester">Tester</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Task Description
              </label>
              <textarea
                value={selectedStep.config.task}
                onChange={(e) => updateStep(selectedStep.id, {
                  config: { ...selectedStep.config, task: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                rows={3}
              />
            </div>
          </>
        )}
        
        {selectedStep.type === 'shell-command' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Command
              </label>
              <input
                type="text"
                value={selectedStep.config.command}
                onChange={(e) => updateStep(selectedStep.id, {
                  config: { ...selectedStep.config, command: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Working Directory
              </label>
              <input
                type="text"
                value={selectedStep.config.workingDirectory}
                onChange={(e) => updateStep(selectedStep.id, {
                  config: { ...selectedStep.config, workingDirectory: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </>
        )}
        
        {selectedStep.type === 'file-operation' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Operation
              </label>
              <select
                value={selectedStep.config.operation}
                onChange={(e) => updateStep(selectedStep.id, {
                  config: { ...selectedStep.config, operation: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="copy">Copy</option>
                <option value="delete">Delete</option>
                <option value="mkdir">Create Directory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                File Path
              </label>
              <input
                type="text"
                value={selectedStep.config.path}
                onChange={(e) => updateStep(selectedStep.id, {
                  config: { ...selectedStep.config, path: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </>
        )}
        
        {selectedStep.type === 'delay' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Duration (ms)
            </label>
            <input
              type="number"
              value={selectedStep.config.duration}
              onChange={(e) => updateStep(selectedStep.id, {
                config: { ...selectedStep.config, duration: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="h-full flex bg-gray-900 rounded-lg border border-gray-700">
      {/* Left Sidebar - Step Palette */}
      <div className="w-64 border-r border-gray-700 p-4 overflow-y-auto">
        <StepPalette />
      </div>
      
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-semibold bg-transparent text-white border-none outline-none"
              />
              <div className="text-sm text-gray-400">
                {workflow.steps.length} steps
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
              >
                Templates
              </button>
              <input
                type="file"
                accept=".json"
                onChange={importWorkflow}
                className="hidden"
                id="import-workflow"
              />
              <button
                onClick={() => document.getElementById('import-workflow').click()}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={exportWorkflow}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={saveWorkflow}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={executeWorkflow}
                disabled={isExecuting || workflow.steps.length === 0}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>{isExecuting ? 'Running...' : 'Execute'}</span>
              </button>
            </div>
          </div>
          
          <textarea
            placeholder="Workflow description..."
            value={workflow.description}
            onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            rows={2}
          />
        </div>
        
        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-gray-950"
          style={{ backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          {/* Connection Lines */}
          {getStepConnections().map((connection, index) => (
            <ConnectionLine key={index} from={connection.from} to={connection.to} />
          ))}
          
          {/* Step Nodes */}
          {workflow.steps.map(step => (
            <StepNode
              key={step.id}
              step={step}
              isSelected={selectedStep?.id === step.id}
              onSelect={setSelectedStep}
              onDrag={handleStepDrag}
            />
          ))}
          
          {/* Empty State */}
          {workflow.steps.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Plus className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Create Your First Workflow</h3>
                <p className="text-sm">Drag step types from the left panel to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Sidebar - Step Configuration */}
      <div className="w-80 border-l border-gray-700 p-4 overflow-y-auto">
        <StepConfigPanel />
      </div>
      
      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Workflow Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => loadTemplate(template)}
                  className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
                >
                  <h4 className="font-medium text-white mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                  <div className="text-xs text-gray-500">
                    {template.steps?.length || 0} steps
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;