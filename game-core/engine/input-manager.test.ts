// input-manager.test.ts - TDD: Tests for input handling system
import { InputManager } from './input-manager';

describe('InputManager', () => {
  let inputManager: InputManager;
  let mockCanvas: HTMLCanvasElement;
  let mockEvent: Event;

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    
    // Mock DOM methods
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
    mockCanvas.addEventListener = jest.fn();
    mockCanvas.removeEventListener = jest.fn();
    
    inputManager = new InputManager(mockCanvas);
    
    mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should create InputManager with canvas', () => {
      expect(inputManager).toBeDefined();
      expect(inputManager.getCanvas()).toBe(mockCanvas);
    });

    test('should not be enabled initially', () => {
      expect(inputManager.isEnabled()).toBe(false);
    });

    test('should have no keys pressed initially', () => {
      expect(inputManager.isKeyPressed('KeyW')).toBe(false);
      expect(inputManager.isKeyPressed('Space')).toBe(false);
    });
  });

  describe('enable/disable system', () => {
    test('should enable input listening', () => {
      inputManager.enable();
      expect(inputManager.isEnabled()).toBe(true);
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    test('should disable input listening', () => {
      inputManager.enable();
      inputManager.disable();
      
      expect(inputManager.isEnabled()).toBe(false);
      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    test('should not add duplicate listeners when enabled multiple times', () => {
      inputManager.enable();
      inputManager.enable();
      
      // Should only add listeners once
      expect(document.addEventListener).toHaveBeenCalledTimes(8); // 4 keyboard + 4 mouse events
    });
  });

  describe('keyboard input', () => {
    beforeEach(() => {
      inputManager.enable();
    });

    test('should detect key press', () => {
      const keyEvent = new KeyboardEvent('keydown', { code: 'KeyW' });
      inputManager.handleKeyDown(keyEvent);
      
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
    });

    test('should detect key release', () => {
      const keyDownEvent = new KeyboardEvent('keydown', { code: 'KeyW' });
      const keyUpEvent = new KeyboardEvent('keyup', { code: 'KeyW' });
      
      inputManager.handleKeyDown(keyDownEvent);
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
      
      inputManager.handleKeyUp(keyUpEvent);
      expect(inputManager.isKeyPressed('KeyW')).toBe(false);
    });

    test('should track multiple keys simultaneously', () => {
      const keyW = new KeyboardEvent('keydown', { code: 'KeyW' });
      const keyA = new KeyboardEvent('keydown', { code: 'KeyA' });
      
      inputManager.handleKeyDown(keyW);
      inputManager.handleKeyDown(keyA);
      
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
      expect(inputManager.isKeyPressed('KeyA')).toBe(true);
      expect(inputManager.isKeyPressed('KeyS')).toBe(false);
    });

    test('should detect key just pressed this frame', () => {
      const keyEvent = new KeyboardEvent('keydown', { code: 'Space' });
      inputManager.handleKeyDown(keyEvent);
      
      expect(inputManager.isKeyJustPressed('Space')).toBe(true);
      
      // After update, should no longer be "just pressed"
      inputManager.update(16.67);
      expect(inputManager.isKeyJustPressed('Space')).toBe(false);
      expect(inputManager.isKeyPressed('Space')).toBe(true);
    });

    test('should detect key just released this frame', () => {
      const keyDownEvent = new KeyboardEvent('keydown', { code: 'Space' });
      const keyUpEvent = new KeyboardEvent('keyup', { code: 'Space' });
      
      inputManager.handleKeyDown(keyDownEvent);
      inputManager.update(16.67); // Clear just pressed
      inputManager.handleKeyUp(keyUpEvent);
      
      expect(inputManager.isKeyJustReleased('Space')).toBe(true);
      
      // After update, should no longer be "just released"
      inputManager.update(16.67);
      expect(inputManager.isKeyJustReleased('Space')).toBe(false);
    });
  });

  describe('mouse input', () => {
    beforeEach(() => {
      inputManager.enable();
    });

    test('should track mouse position', () => {
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 150
      });
      
      // Mock getBoundingClientRect
      mockCanvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      });
      
      inputManager.handleMouseMove(mouseEvent);
      
      const mousePos = inputManager.getMousePosition();
      expect(mousePos.x).toBe(200);
      expect(mousePos.y).toBe(150);
    });

    test('should detect mouse button press', () => {
      const mouseEvent = new MouseEvent('mousedown', { button: 0 });
      inputManager.handleMouseDown(mouseEvent);
      
      expect(inputManager.isMouseButtonPressed(0)).toBe(true);
    });

    test('should detect mouse button release', () => {
      const mouseDownEvent = new MouseEvent('mousedown', { button: 0 });
      const mouseUpEvent = new MouseEvent('mouseup', { button: 0 });
      
      inputManager.handleMouseDown(mouseDownEvent);
      expect(inputManager.isMouseButtonPressed(0)).toBe(true);
      
      inputManager.handleMouseUp(mouseUpEvent);
      expect(inputManager.isMouseButtonPressed(0)).toBe(false);
    });

    test('should convert canvas coordinates correctly', () => {
      // Mock canvas position
      mockCanvas.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 50,
        width: 800,
        height: 600
      });
      
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 300, // 300 - 100 = 200 canvas x
        clientY: 200  // 200 - 50 = 150 canvas y
      });
      
      inputManager.handleMouseMove(mouseEvent);
      
      const mousePos = inputManager.getMousePosition();
      expect(mousePos.x).toBe(200);
      expect(mousePos.y).toBe(150);
    });
  });

  describe('input mapping', () => {
    beforeEach(() => {
      inputManager.enable();
    });

    test('should check WASD movement keys', () => {
      const keyW = new KeyboardEvent('keydown', { code: 'KeyW' });
      const keyA = new KeyboardEvent('keydown', { code: 'KeyA' });
      const keyS = new KeyboardEvent('keydown', { code: 'KeyS' });
      const keyD = new KeyboardEvent('keydown', { code: 'KeyD' });
      
      inputManager.handleKeyDown(keyW);
      inputManager.handleKeyDown(keyA);
      
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
      expect(inputManager.isKeyPressed('KeyA')).toBe(true);
      expect(inputManager.isKeyPressed('KeyS')).toBe(false);
      expect(inputManager.isKeyPressed('KeyD')).toBe(false);
    });

    test('should check number keys for skills', () => {
      const key1 = new KeyboardEvent('keydown', { code: 'Digit1' });
      const key2 = new KeyboardEvent('keydown', { code: 'Digit2' });
      
      inputManager.handleKeyDown(key1);
      expect(inputManager.isKeyPressed('Digit1')).toBe(true);
      expect(inputManager.isKeyPressed('Digit2')).toBe(false);
    });
  });

  describe('input state management', () => {
    test('should clear just pressed/released states on update', () => {
      inputManager.enable();
      
      const keyEvent = new KeyboardEvent('keydown', { code: 'Space' });
      inputManager.handleKeyDown(keyEvent);
      
      expect(inputManager.isKeyJustPressed('Space')).toBe(true);
      
      inputManager.update(16.67);
      expect(inputManager.isKeyJustPressed('Space')).toBe(false);
    });

    test('should maintain pressed state across updates', () => {
      inputManager.enable();
      
      const keyEvent = new KeyboardEvent('keydown', { code: 'KeyW' });
      inputManager.handleKeyDown(keyEvent);
      
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
      
      inputManager.update(16.67);
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should handle invalid key codes gracefully', () => {
      inputManager.enable();
      
      expect(inputManager.isKeyPressed('')).toBe(false);
      expect(inputManager.isKeyPressed('InvalidKey')).toBe(false);
    });

    test('should handle mouse events without canvas bounds', () => {
      mockCanvas.getBoundingClientRect = jest.fn().mockReturnValue(null as any);
      
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 150
      });
      
      expect(() => inputManager.handleMouseMove(mouseEvent)).not.toThrow();
    });
  });
});