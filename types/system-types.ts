// RainStorm ARPG - System Type Definitions
// Type definitions for all game systems

import { ISystem, IEntity, SystemMetrics, ECSEvent } from './ecs-types';
import { ComponentTypeRegistry } from './component-types';
import { LogContext } from './game-types';

// =============================================================================
// BASE SYSTEM TYPES
// =============================================================================

export interface BaseSystem extends ISystem {
  readonly name: string;
  readonly requiredComponents: readonly string[];
  readonly entities: Set<IEntity>;
  readonly priority: number;
  enabled: boolean;
  
  initialize?(): void;
  cleanup(): void;
  onEntityAdded?(entity: IEntity): void;
  onEntityRemoved?(entity: IEntity): void;
  onEvent?(event: ECSEvent): void;
}

export interface UpdateSystem extends BaseSystem {
  update(deltaTime: number): void;
}

export interface RenderSystem extends BaseSystem {
  render(context: RenderContext): void;
}

export interface FixedUpdateSystem extends BaseSystem {
  fixedUpdate(fixedDeltaTime: number): void;
}

export interface EventSystem extends BaseSystem {
  processEvents(events: ECSEvent[]): void;
}

// =============================================================================
// CORE GAME SYSTEMS
// =============================================================================

export interface MovementSystemType extends UpdateSystem {
  name: 'MovementSystem';
  requiredComponents: readonly ['Position', 'Velocity'];
  
  updateMovement(entity: IEntity, deltaTime: number): void;
  applyVelocity(entity: IEntity, deltaTime: number): void;
  checkBounds(entity: IEntity): void;
}

export interface RenderSystemType extends RenderSystem {
  name: 'RenderSystem';
  requiredComponents: readonly ['Position', 'Sprite'];
  
  renderEntity(entity: IEntity, context: RenderContext): void;
  sortEntitiesByLayer(entities: IEntity[]): IEntity[];
  culling: boolean;
  viewport: Viewport;
}

export interface CombatSystemType extends UpdateSystem {
  name: 'CombatSystem';
  requiredComponents: readonly ['Position', 'Combat', 'Health'];
  
  processCombat(deltaTime: number): void;
  handleAttack(attacker: IEntity, target: IEntity): void;
  checkRange(attacker: IEntity, target: IEntity): boolean;
  calculateDamage(attacker: IEntity, target: IEntity): number;
  applyDamage(target: IEntity, damage: number): boolean;
}

export interface AISystemType extends UpdateSystem {
  name: 'AISystem';
  requiredComponents: readonly ['Position', 'AI', 'Velocity'];
  
  updateAI(entity: IEntity, deltaTime: number): void;
  processStateMachine(entity: IEntity): void;
  findTargets(entity: IEntity): IEntity[];
  calculatePath(from: IEntity, to: IEntity): PathNode[];
}

export interface PhysicsSystemType extends FixedUpdateSystem {
  name: 'PhysicsSystem';
  requiredComponents: readonly ['Position', 'Velocity', 'Collider'];
  
  fixedUpdate(fixedDeltaTime: number): void;
  detectCollisions(): CollisionPair[];
  resolveCollisions(collisions: CollisionPair[]): void;
  applyPhysics(entity: IEntity, deltaTime: number): void;
  gravity: number;
  friction: number;
}

export interface AudioSystemType extends UpdateSystem {
  name: 'AudioSystem';
  requiredComponents: readonly ['Audio'];
  
  updateAudio(deltaTime: number): void;
  playSound(soundId: string, position?: Vector2): void;
  stopSound(soundId: string): void;
  updateSpatialAudio(): void;
  masterVolume: number;
  listener: AudioListener;
}

export interface UISystemType extends UpdateSystem, RenderSystem {
  name: 'UISystem';
  requiredComponents: readonly ['UI'];
  
  update(deltaTime: number): void;
  render(context: RenderContext): void;
  handleInput(input: InputEvent): boolean;
  processUIEvents(): void;
  focusedElement: string | null;
}

// =============================================================================
// CHARACTER SYSTEMS
// =============================================================================

export interface LevelingSystemType extends EventSystem {
  name: 'LevelingSystem';
  requiredComponents: readonly ['Level', 'SkillTree'];
  
  processEvents(events: ECSEvent[]): void;
  handleExperienceGain(entity: IEntity, amount: number): void;
  levelUp(entity: IEntity): void;
  awardSkillPoints(entity: IEntity, points: number): void;
  calculateExperienceRequired(level: number): number;
}

export interface InventorySystemType extends EventSystem {
  name: 'InventorySystem';
  requiredComponents: readonly ['Inventory'];
  
  processEvents(events: ECSEvent[]): void;
  handleItemPickup(entity: IEntity, item: Item): boolean;
  handleItemDrop(entity: IEntity, item: Item): boolean;
  handleItemUse(entity: IEntity, item: Item): boolean;
  findSpaceForItem(entity: IEntity, item: Item): ItemPosition | null;
}

export interface EquipmentSystemType extends EventSystem {
  name: 'EquipmentSystem';
  requiredComponents: readonly ['Equipment', 'Attributes'];
  
  processEvents(events: ECSEvent[]): void;
  equipItem(entity: IEntity, item: Item, slot: EquipmentSlot): boolean;
  unequipItem(entity: IEntity, slot: EquipmentSlot): Item | null;
  calculateEquipmentBonuses(entity: IEntity): EquipmentBonuses;
  updateDerivedStats(entity: IEntity): void;
}

export interface SkillSystemType extends EventSystem {
  name: 'SkillSystem';
  requiredComponents: readonly ['SkillTree', 'Level'];
  
  processEvents(events: ECSEvent[]): void;
  allocateSkillPoint(entity: IEntity, nodeId: string): boolean;
  deallocateSkillPoint(entity: IEntity, nodeId: string): boolean;
  validateSkillTree(entity: IEntity): boolean;
  calculatePassiveEffects(entity: IEntity): SkillEffect[];
}

// =============================================================================
// CAMPAIGN SYSTEMS
// =============================================================================

export interface CampaignSystemType extends EventSystem {
  name: 'CampaignSystem';
  requiredComponents: readonly ['CampaignProgress', 'Level'];
  
  processEvents(events: ECSEvent[]): void;
  checkActProgress(entity: IEntity): void;
  completeAct(entity: IEntity, actId: number): void;
  unlockArea(entity: IEntity, areaId: string): void;
  canAccessAct(entity: IEntity, actId: number): boolean;
  getCurrentObjectives(entity: IEntity): QuestObjective[];
}

export interface QuestSystemType extends EventSystem {
  name: 'QuestSystem';
  requiredComponents: readonly ['CampaignProgress'];
  
  processEvents(events: ECSEvent[]): void;
  startQuest(entity: IEntity, questId: string): boolean;
  completeQuest(entity: IEntity, questId: string): void;
  updateObjective(entity: IEntity, questId: string, objectiveId: string, progress: number): void;
  checkQuestCompletion(entity: IEntity, questId: string): boolean;
  grantRewards(entity: IEntity, rewards: Reward[]): void;
}

export interface DialogSystemType extends EventSystem {
  name: 'DialogSystem';
  requiredComponents: readonly ['Position'];
  
  processEvents(events: ECSEvent[]): void;
  startDialog(npcEntity: IEntity, playerEntity: IEntity, dialogId: string): void;
  processDialogChoice(choiceId: string): void;
  endDialog(): void;
  currentDialog: Dialog | null;
}

// =============================================================================
// SPECIALIZED SYSTEMS
// =============================================================================

export interface SaveSystemType extends BaseSystem {
  name: 'SaveSystem';
  requiredComponents: readonly [];
  
  saveGame(slotId: string): Promise<boolean>;
  loadGame(slotId: string): Promise<boolean>;
  autoSave(): Promise<boolean>;
  deleteSave(slotId: string): Promise<boolean>;
  getSaveInfo(slotId: string): SaveInfo | null;
  autoSaveInterval: number;
  lastAutoSave: number;
}

export interface NetworkSystemType extends UpdateSystem {
  name: 'NetworkSystem';
  requiredComponents: readonly ['Network'];
  
  update(deltaTime: number): void;
  sendUpdate(entity: IEntity): void;
  receiveUpdate(data: NetworkData): void;
  handlePlayerJoin(playerId: string): void;
  handlePlayerLeave(playerId: string): void;
  synchronizeEntity(entity: IEntity): void;
}

export interface ParticleSystemType extends UpdateSystem, RenderSystem {
  name: 'ParticleSystem';
  requiredComponents: readonly ['Position'];
  
  update(deltaTime: number): void;
  render(context: RenderContext): void;
  createEffect(type: EffectType, position: Vector2, config: EffectConfig): void;
  updateParticles(deltaTime: number): void;
  maxParticles: number;
  particles: Particle[];
}

export interface AnalyticsSystemType extends EventSystem {
  name: 'AnalyticsSystem';
  requiredComponents: readonly [];
  
  processEvents(events: ECSEvent[]): void;
  trackEvent(eventType: string, data: any): void;
  trackPlayerAction(action: PlayerAction): void;
  trackPerformance(metrics: PerformanceMetrics): void;
  generateReport(): AnalyticsReport;
  sendTelemetry(): Promise<void>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface RenderContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  camera: Camera;
  viewport: Viewport;
  deltaTime: number;
  frameCount: number;
}

export interface Camera {
  position: Vector2;
  zoom: number;
  rotation: number;
  bounds?: BoundingBox;
  
  worldToScreen(worldPos: Vector2): Vector2;
  screenToWorld(screenPos: Vector2): Vector2;
  setTarget(target: IEntity): void;
  update(deltaTime: number): void;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  
  contains(point: Vector2): boolean;
  intersects(bounds: BoundingBox): boolean;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionPair {
  entityA: IEntity;
  entityB: IEntity;
  normal: Vector2;
  penetration: number;
  point: Vector2;
}

export interface PathNode {
  position: Vector2;
  cost: number;
  heuristic: number;
  parent?: PathNode;
}

export interface AudioListener {
  position: Vector2;
  orientation: number;
  volume: number;
}

export interface InputEvent {
  type: 'mouse' | 'keyboard' | 'touch' | 'gamepad';
  action: 'down' | 'up' | 'move' | 'scroll';
  data: any;
  timestamp: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  level: number;
  width: number;
  height: number;
  stackSize: number;
  value: number;
  properties: Record<string, any>;
}

export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'currency' | 'gem';
export type ItemRarity = 'normal' | 'magic' | 'rare' | 'unique' | 'legendary';
export type EquipmentSlot = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'ring' | 'amulet';

export interface ItemPosition {
  x: number;
  y: number;
}

export interface EquipmentBonuses {
  damage: number;
  health: number;
  mana: number;
  armor: number;
  resistances: Record<string, number>;
  attributes: Record<string, number>;
}

export interface SkillEffect {
  type: string;
  value: number;
  valueType: 'flat' | 'percentage' | 'multiplier';
  target?: string;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: string;
  target: string;
  current: number;
  required: number;
  completed: boolean;
}

export interface Reward {
  type: 'experience' | 'item' | 'currency' | 'skill_points';
  value: number;
  data?: any;
}

export interface Dialog {
  id: string;
  npc: string;
  text: string;
  choices: DialogChoice[];
}

export interface DialogChoice {
  id: string;
  text: string;
  action: string;
  requirements?: DialogRequirement[];
}

export interface DialogRequirement {
  type: 'level' | 'item' | 'quest';
  value: string | number;
}

export interface SaveInfo {
  slotId: string;
  characterName: string;
  level: number;
  playTime: number;
  timestamp: number;
  location: string;
}

export interface NetworkData {
  entityId: string;
  components: Record<string, any>;
  timestamp: number;
  checksum: string;
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface EffectConfig {
  count: number;
  duration: number;
  spread: number;
  speed: [number, number];
  size: [number, number];
  color: string[];
}

export type EffectType = 'explosion' | 'magic' | 'blood' | 'smoke' | 'sparks' | 'healing';

export interface PlayerAction {
  type: string;
  timestamp: number;
  entityId: string;
  data: any;
}

export interface AnalyticsReport {
  sessionTime: number;
  actionsPerformed: number;
  levelsGained: number;
  itemsFound: number;
  questsCompleted: number;
  deathCount: number;
  averageFPS: number;
  errorCount: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  entityCount: number;
  systemTimes: Record<string, number>;
}

// =============================================================================
// SYSTEM REGISTRY
// =============================================================================

export interface SystemTypeRegistry {
  MovementSystem: MovementSystemType;
  RenderSystem: RenderSystemType;
  CombatSystem: CombatSystemType;
  AISystem: AISystemType;
  PhysicsSystem: PhysicsSystemType;
  AudioSystem: AudioSystemType;
  UISystem: UISystemType;
  LevelingSystem: LevelingSystemType;
  InventorySystem: InventorySystemType;
  EquipmentSystem: EquipmentSystemType;
  SkillSystem: SkillSystemType;
  CampaignSystem: CampaignSystemType;
  QuestSystem: QuestSystemType;
  DialogSystem: DialogSystemType;
  SaveSystem: SaveSystemType;
  NetworkSystem: NetworkSystemType;
  ParticleSystem: ParticleSystemType;
  AnalyticsSystem: AnalyticsSystemType;
}

export type SystemTypeName = keyof SystemTypeRegistry;

export type GetSystemType<T extends SystemTypeName> = SystemTypeRegistry[T];