// input-manager.ts - Input handling system for keyboard and mouse
export interface MousePosition {
  x: number;
  y: number;
}

export interface IInputManager {
  enable(): void;
  disable(): void;
  update(deltaTime: number): void;
  isEnabled(): boolean;
  isKeyPressed(keyCode: string): boolean;
  isKeyJustPressed(keyCode: string): boolean;
  isKeyJustReleased(keyCode: string): boolean;
  getMousePosition(): MousePosition;
  isMouseButtonPressed(button: number): boolean;
  isMouseButtonJustPressed(button: number): boolean;
  isMouseButtonJustReleased(button: number): boolean;
  getCanvas(): HTMLCanvasElement;
}

export class InputManager implements IInputManager {
  private canvas: HTMLCanvasElement;
  private enabled: boolean = false;
  
  // Keyboard state
  private keysPressed: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();
  
  // Mouse state
  private mousePosition: MousePosition = { x: 0, y: 0 };
  private mouseButtonsPressed: Set<number> = new Set();
  private mouseButtonsJustPressed: Set<number> = new Set();
  private mouseButtonsJustReleased: Set<number> = new Set();
  
  // Event handlers (bound to preserve 'this' context)
  private keyDownHandler: (event: KeyboardEvent) => void;
  private keyUpHandler: (event: KeyboardEvent) => void;
  private mouseMoveHandler: (event: MouseEvent) => void;
  private mouseDownHandler: (event: MouseEvent) => void;
  private mouseUpHandler: (event: MouseEvent) => void;
  private contextMenuHandler: (event: Event) => void;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Bind event handlers
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    this.mouseDownHandler = this.handleMouseDown.bind(this);
    this.mouseUpHandler = this.handleMouseUp.bind(this);
    this.contextMenuHandler = this.handleContextMenu.bind(this);
  }

  enable(): void {
    if (this.enabled) {
      return; // Already enabled
    }
    
    this.enabled = true;
    
    // Add keyboard event listeners
    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
    
    // Add mouse event listeners
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('mousedown', this.mouseDownHandler);
    this.canvas.addEventListener('mouseup', this.mouseUpHandler);
    this.canvas.addEventListener('contextmenu', this.contextMenuHandler);
    
    // Make canvas focusable for keyboard events
    this.canvas.tabIndex = 0;
    this.canvas.focus();
  }

  disable(): void {
    if (!this.enabled) {
      return; // Already disabled
    }
    
    this.enabled = false;
    
    // Remove keyboard event listeners
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
    
    // Remove mouse event listeners
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
    this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
    this.canvas.removeEventListener('contextmenu', this.contextMenuHandler);
    
    // Clear all input states
    this.clearAllStates();
  }

  update(deltaTime: number): void {
    // Clear "just pressed" and "just released" states
    // These should only be true for one frame
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouseButtonsJustPressed.clear();
    this.mouseButtonsJustReleased.clear();
  }

  private clearAllStates(): void {
    this.keysPressed.clear();
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouseButtonsPressed.clear();
    this.mouseButtonsJustPressed.clear();
    this.mouseButtonsJustReleased.clear();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;
    
    const keyCode = event.code;
    
    // Prevent default for game keys to avoid browser shortcuts
    if (this.isGameKey(keyCode)) {
      event.preventDefault();
    }
    
    // Only register as "just pressed" if it wasn't already pressed
    if (!this.keysPressed.has(keyCode)) {
      this.keysJustPressed.add(keyCode);
    }
    
    this.keysPressed.add(keyCode);
  }

  handleKeyUp(event: KeyboardEvent): void {
    if (!this.enabled) return;
    
    const keyCode = event.code;
    
    if (this.keysPressed.has(keyCode)) {
      this.keysPressed.delete(keyCode);
      this.keysJustReleased.add(keyCode);
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (!this.enabled) return;
    
    const rect = this.canvas.getBoundingClientRect();
    if (rect) {
      this.mousePosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  }

  handleMouseDown(event: MouseEvent): void {
    if (!this.enabled) return;
    
    event.preventDefault();
    
    const button = event.button;
    
    // Only register as "just pressed" if it wasn't already pressed
    if (!this.mouseButtonsPressed.has(button)) {
      this.mouseButtonsJustPressed.add(button);
    }
    
    this.mouseButtonsPressed.add(button);
  }

  handleMouseUp(event: MouseEvent): void {
    if (!this.enabled) return;
    
    const button = event.button;
    
    if (this.mouseButtonsPressed.has(button)) {
      this.mouseButtonsPressed.delete(button);
      this.mouseButtonsJustReleased.add(button);
    }
  }

  handleContextMenu(event: Event): void {
    // Prevent right-click context menu
    event.preventDefault();
  }

  private isGameKey(keyCode: string): boolean {
    // List of keys used by the game that should have default behavior prevented
    const gameKeys = [
      // Movement
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      // Skills
      'Digit1', 'Digit2', 'Digit3', 'Digit4',
      'KeyQ', 'KeyW', 'KeyE', 'KeyR',
      // Interface
      'KeyI', 'KeyC', 'KeyM', 'KeyT',
      // Other
      'Space', 'Tab', 'Escape'
    ];
    
    return gameKeys.includes(keyCode);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isKeyPressed(keyCode: string): boolean {
    return this.keysPressed.has(keyCode);
  }

  isKeyJustPressed(keyCode: string): boolean {
    return this.keysJustPressed.has(keyCode);
  }

  isKeyJustReleased(keyCode: string): boolean {
    return this.keysJustReleased.has(keyCode);
  }

  getMousePosition(): MousePosition {
    return { ...this.mousePosition };
  }

  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtonsPressed.has(button);
  }

  isMouseButtonJustPressed(button: number): boolean {
    return this.mouseButtonsJustPressed.has(button);
  }

  isMouseButtonJustReleased(button: number): boolean {
    return this.mouseButtonsJustReleased.has(button);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  // Convenience methods for common input patterns
  isMovementKeyPressed(): { up: boolean; down: boolean; left: boolean; right: boolean } {
    return {
      up: this.isKeyPressed('KeyW'),
      down: this.isKeyPressed('KeyS'),
      left: this.isKeyPressed('KeyA'),
      right: this.isKeyPressed('KeyD')
    };
  }

  getMovementVector(): { x: number; y: number } {
    const movement = this.isMovementKeyPressed();
    let x = 0;
    let y = 0;
    
    if (movement.left) x -= 1;
    if (movement.right) x += 1;
    if (movement.up) y -= 1;
    if (movement.down) y += 1;
    
    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      x /= length;
      y /= length;
    }
    
    return { x, y };
  }

  isSkillKeyPressed(skillSlot: number): boolean {
    if (skillSlot >= 1 && skillSlot <= 4) {
      return this.isKeyPressed(`Digit${skillSlot}`);
    } else if (skillSlot === 5) {
      return this.isKeyPressed('KeyQ');
    } else if (skillSlot === 6) {
      return this.isKeyPressed('KeyW');
    } else if (skillSlot === 7) {
      return this.isKeyPressed('KeyE');
    } else if (skillSlot === 8) {
      return this.isKeyPressed('KeyR');
    }
    return false;
  }

  isSkillKeyJustPressed(skillSlot: number): boolean {
    if (skillSlot >= 1 && skillSlot <= 4) {
      return this.isKeyJustPressed(`Digit${skillSlot}`);
    } else if (skillSlot === 5) {
      return this.isKeyJustPressed('KeyQ');
    } else if (skillSlot === 6) {
      return this.isKeyJustPressed('KeyW');
    } else if (skillSlot === 7) {
      return this.isKeyJustPressed('KeyE');
    } else if (skillSlot === 8) {
      return this.isKeyJustPressed('KeyR');
    }
    return false;
  }
}