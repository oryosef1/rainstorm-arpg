// Jest test setup for RainStorm ARPG
// Configure global test environment

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEntity(): R;
      toHaveComponent(componentType: string | Function): R;
      toBeInSkillRange(min: number, max: number): R;
    }
  }
  
  interface Window {
    testUtils: {
      createMockCanvas: () => MockCanvas;
      createTestEntity: (world: any, components?: any[]) => any;
      simulateGameTime: (systems: any[], deltaTime?: number) => void;
    };
  }
  
  var testUtils: {
    createMockCanvas: () => MockCanvas;
    createTestEntity: (world: any, components?: any[]) => any;
    simulateGameTime: (systems: any[], deltaTime?: number) => void;
  };
  
  var crypto: {
    randomUUID: () => string;
  };
  
  var localStorage: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
  };
  
  var document: {
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
    dispatchEvent: jest.Mock;
  };
}

interface MockCanvas {
  width: number;
  height: number;
  getContext: () => MockCanvasContext;
}

interface MockCanvasContext {
  fillRect: jest.Mock;
  clearRect: jest.Mock;
  getImageData: jest.Mock;
  putImageData: jest.Mock;
  createImageData: jest.Mock;
  setTransform: jest.Mock;
  drawImage: jest.Mock;
  save: jest.Mock;
  restore: jest.Mock;
  beginPath: jest.Mock;
  moveTo: jest.Mock;
  lineTo: jest.Mock;
  closePath: jest.Mock;
  stroke: jest.Mock;
  fill: jest.Mock;
  arc: jest.Mock;
  fillStyle: string;
  strokeStyle: string;
}

// Mock Canvas API for testing
if (typeof global !== 'undefined') {
  // @ts-ignore
  global.HTMLCanvasElement = global.HTMLCanvasElement || class HTMLCanvasElement {};
  
  // @ts-ignore
  global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: [] })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: [] })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    fillStyle: '',
    strokeStyle: ''
  }));
}

// Mock crypto.randomUUID for Entity IDs
if (typeof global !== 'undefined') {
  global.crypto = {
    randomUUID: jest.fn(() => 'test-uuid-' + Math.random())
  };
}

// Mock localStorage
if (typeof global !== 'undefined') {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.localStorage = localStorageMock;
}

// Mock document events
if (typeof global !== 'undefined') {
  global.document = {
    ...global.document,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  };
}

// Custom matchers for game testing
if (typeof expect !== 'undefined') {
  expect.extend({
    toBeValidEntity(received: any) {
      const pass = received && 
                   typeof received.id === 'string' && 
                   received.components instanceof Map &&
                   typeof received.active === 'boolean';
      
      if (pass) {
        return {
          message: () => `expected ${received} not to be a valid entity`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be a valid entity`,
          pass: false,
        };
      }
    },

    toHaveComponent(received: any, componentType: string | Function) {
      const componentName = typeof componentType === 'string' ? componentType : componentType.name;
      const pass = received.hasComponent(componentName);
      
      if (pass) {
        return {
          message: () => `expected entity not to have component ${componentName}`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected entity to have component ${componentName}`,
          pass: false,
        };
      }
    },

    toBeInSkillRange(received: number, min: number, max: number) {
      const pass = received >= min && received <= max;
      
      if (pass) {
        return {
          message: () => `expected ${received} not to be in skill range ${min}-${max}`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be in skill range ${min}-${max}`,
          pass: false,
        };
      }
    }
  });
}

// Test utilities
if (typeof global !== 'undefined') {
  global.testUtils = {
    createMockCanvas: (): MockCanvas => ({
      width: 1400,
      height: 900,
      getContext: () => {
        // @ts-ignore
        return global.HTMLCanvasElement.prototype.getContext();
      }
    }),

    createTestEntity: (world: any, components: any[] = []) => {
      const entity = world.createEntity();
      components.forEach(component => entity.addComponent(component));
      return entity;
    },

    simulateGameTime: (systems: any[], deltaTime: number = 16) => {
      systems.forEach(system => {
        if (system.update) system.update(deltaTime);
      });
    }
  };
}

export {};