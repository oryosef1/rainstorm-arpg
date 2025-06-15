// game-renderer.ts - Canvas rendering system for the game world
import { IWorld, IEntity } from '../ecs/ecs-core';

export interface Camera {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IGameRenderer {
  render(world: IWorld): void;
  getCanvas(): HTMLCanvasElement;
  setCamera(position: Camera): void;
  getCamera(): Camera;
  moveCamera(deltaX: number, deltaY: number): void;
  followEntity(entity: IEntity): void;
  stopFollowing(): void;
  getFollowTarget(): IEntity | null;
  setDebugMode(enabled: boolean): void;
  isDebugMode(): boolean;
  getViewport(): Viewport;
  isInViewport(x: number, y: number): boolean;
}

export class GameRenderer implements IGameRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null;
  private camera: Camera;
  private followTarget: IEntity | null = null;
  private debugMode: boolean = false;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.camera = { x: 0, y: 0 };
  }

  render(world: IWorld): void {
    if (!this.context) {
      return; // Can't render without context
    }

    try {
      // Clear canvas
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Update camera if following an entity
      this.updateCameraFollow();
      
      // Apply camera transform
      this.context.save();
      this.context.translate(-this.camera.x, -this.camera.y);
      
      // Render all entities
      this.renderEntities(world);
      
      // Restore transform
      this.context.restore();
      
      // Render UI elements (not affected by camera)
      this.renderUI(world);
      
      // Render debug information if enabled
      if (this.debugMode) {
        this.renderDebugInfo(world);
      }
      
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  private updateCameraFollow(): void {
    if (this.followTarget) {
      // Check if entity has a position component
      const positionComponent = this.followTarget.getComponent('Position');
      if (positionComponent && 'x' in positionComponent && 'y' in positionComponent) {
        // Center camera on entity
        const entityPos = positionComponent as any;
        this.camera.x = entityPos.x - this.canvas.width / 2;
        this.camera.y = entityPos.y - this.canvas.height / 2;
      }
    }
  }

  private renderEntities(world: IWorld): void {
    if (!this.context) return;

    // Get viewport bounds for culling
    const viewport = this.getViewport();
    
    for (const entity of world.entities) {
      if (!entity.active) continue;
      
      // Get position component
      const positionComponent = entity.getComponent('Position');
      if (!positionComponent || !('x' in positionComponent) || !('y' in positionComponent)) {
        continue; // Skip entities without position
      }
      
      const position = positionComponent as any;
      
      // Cull entities outside viewport (with margin for larger sprites)
      const margin = 100;
      if (position.x < viewport.x - margin || 
          position.x > viewport.x + viewport.width + margin ||
          position.y < viewport.y - margin || 
          position.y > viewport.y + viewport.height + margin) {
        continue;
      }
      
      // Render entity based on its components
      this.renderEntity(entity);
    }
  }

  private renderEntity(entity: IEntity): void {
    if (!this.context) return;

    const positionComponent = entity.getComponent('Position') as any;
    const renderComponent = entity.getComponent('Render') as any;
    
    if (!positionComponent || !renderComponent) {
      return;
    }
    
    this.context.save();
    
    // Apply entity transform
    this.context.translate(positionComponent.x, positionComponent.y);
    
    if (renderComponent.rotation) {
      this.context.rotate(renderComponent.rotation);
    }
    
    if (renderComponent.scale) {
      this.context.scale(renderComponent.scale, renderComponent.scale);
    }
    
    // Render based on render type
    if (renderComponent.type === 'rectangle') {
      this.renderRectangle(renderComponent);
    } else if (renderComponent.type === 'circle') {
      this.renderCircle(renderComponent);
    } else if (renderComponent.type === 'sprite') {
      this.renderSprite(renderComponent);
    } else {
      // Default rendering - simple colored square
      this.renderDefault(renderComponent);
    }
    
    this.context.restore();
  }

  private renderRectangle(renderComponent: any): void {
    if (!this.context) return;
    
    this.context.fillStyle = renderComponent.color || '#ffffff';
    this.context.fillRect(
      -renderComponent.width / 2,
      -renderComponent.height / 2,
      renderComponent.width,
      renderComponent.height
    );
    
    if (renderComponent.strokeColor) {
      this.context.strokeStyle = renderComponent.strokeColor;
      this.context.lineWidth = renderComponent.strokeWidth || 1;
      this.context.strokeRect(
        -renderComponent.width / 2,
        -renderComponent.height / 2,
        renderComponent.width,
        renderComponent.height
      );
    }
  }

  private renderCircle(renderComponent: any): void {
    if (!this.context) return;
    
    this.context.beginPath();
    this.context.arc(0, 0, renderComponent.radius || 10, 0, Math.PI * 2);
    
    this.context.fillStyle = renderComponent.color || '#ffffff';
    this.context.fill();
    
    if (renderComponent.strokeColor) {
      this.context.strokeStyle = renderComponent.strokeColor;
      this.context.lineWidth = renderComponent.strokeWidth || 1;
      this.context.stroke();
    }
  }

  private renderSprite(renderComponent: any): void {
    if (!this.context || !renderComponent.image) return;
    
    const width = renderComponent.width || renderComponent.image.width;
    const height = renderComponent.height || renderComponent.image.height;
    
    this.context.drawImage(
      renderComponent.image,
      -width / 2,
      -height / 2,
      width,
      height
    );
  }

  private renderDefault(renderComponent: any): void {
    if (!this.context) return;
    
    this.context.fillStyle = renderComponent.color || '#ff0000';
    this.context.fillRect(-10, -10, 20, 20);
  }

  private renderUI(world: IWorld): void {
    // UI elements that don't move with camera
    // This will be expanded with actual UI components
  }

  private renderDebugInfo(world: IWorld): void {
    if (!this.context) return;
    
    this.context.save();
    this.context.fillStyle = '#ffffff';
    this.context.font = '16px monospace';
    this.context.textAlign = 'left';
    this.context.textBaseline = 'top';
    
    const debugInfo = [
      `Entities: ${world.entities.size}`,
      `Systems: ${world.systems.size}`,
      `Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`,
      `Debug: ON`
    ];
    
    debugInfo.forEach((info, index) => {
      this.context!.fillText(info, 10, 10 + (index * 20));
    });
    
    this.context.restore();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  setCamera(position: Camera): void {
    this.camera = { ...position };
  }

  getCamera(): Camera {
    return { ...this.camera };
  }

  moveCamera(deltaX: number, deltaY: number): void {
    this.camera.x += deltaX;
    this.camera.y += deltaY;
  }

  followEntity(entity: IEntity): void {
    this.followTarget = entity;
  }

  stopFollowing(): void {
    this.followTarget = null;
  }

  getFollowTarget(): IEntity | null {
    return this.followTarget;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  isDebugMode(): boolean {
    return this.debugMode;
  }

  getViewport(): Viewport {
    return {
      x: this.camera.x,
      y: this.camera.y,
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  isInViewport(x: number, y: number): boolean {
    const viewport = this.getViewport();
    return x >= viewport.x && 
           x <= viewport.x + viewport.width &&
           y >= viewport.y && 
           y <= viewport.y + viewport.height;
  }
}