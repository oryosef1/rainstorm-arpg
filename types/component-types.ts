// RainStorm ARPG - Component Type Definitions
// Specific type definitions for all game components

import { IComponent, IEntity } from './ecs-types';
import { 
  PositionData, VelocityData, SpriteData, HealthData, CombatData, AIData,
  CharacterStats, InventoryGrid, SkillNode
} from './game-types';

// =============================================================================
// BASE COMPONENT TYPES
// =============================================================================

export interface BaseComponent extends IComponent {
  readonly type: string;
  readonly entityId: string;
  active: boolean;
}

// =============================================================================
// CORE COMPONENTS
// =============================================================================

export interface PositionComponent extends BaseComponent {
  type: 'Position';
  x: number;
  y: number;
  z: number;
  lastX: number;
  lastY: number;
  lastZ: number;
  
  setPosition(x: number, y: number, z?: number): void;
  move(deltaX: number, deltaY: number, deltaZ?: number): void;
  distanceTo(other: PositionComponent): number;
  directionTo(other: PositionComponent): [number, number, number];
}

export interface VelocityComponent extends BaseComponent {
  type: 'Velocity';
  x: number;
  y: number;
  z: number;
  maxSpeed: number;
  damping: number;
  
  setVelocity(x: number, y: number, z?: number): void;
  addVelocity(deltaX: number, deltaY: number, deltaZ?: number): void;
  getSpeed(): number;
  normalize(): void;
  limit(maxSpeed?: number): void;
}

export interface SpriteComponent extends BaseComponent {
  type: 'Sprite';
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle' | 'custom';
  visible: boolean;
  opacity: number;
  rotation: number;
  layer: number;
  texture?: string;
  
  setVisible(visible: boolean): void;
  setColor(color: string): void;
  setSize(size: number): void;
  rotate(angle: number): void;
}

// =============================================================================
// GAMEPLAY COMPONENTS
// =============================================================================

export interface HealthComponent extends BaseComponent {
  type: 'Health';
  current: number;
  maximum: number;
  regeneration: number;
  lastDamageTime: number;
  invulnerable: boolean;
  
  takeDamage(amount: number): boolean; // returns true if died
  heal(amount: number): void;
  setMaxHealth(max: number): void;
  isDead(): boolean;
  isFullHealth(): boolean;
  getHealthPercentage(): number;
}

export interface CombatComponent extends BaseComponent {
  type: 'Combat';
  damage: number;
  attackSpeed: number;
  criticalChance: number;
  criticalMultiplier: number;
  accuracy: number;
  lastAttackTime: number;
  range: number;
  weaponType: string;
  
  canAttack(currentTime: number): boolean;
  attack(currentTime: number): AttackResult;
  calculateDamage(): number;
  calculateCritical(): boolean;
  calculateHit(targetEvasion: number): boolean;
}

export interface AttackResult {
  hit: boolean;
  damage: number;
  isCritical: boolean;
  weaponType: string;
}

export interface AIComponent extends BaseComponent {
  type: 'AI';
  state: AIState;
  aggroRange: number;
  target: IEntity | null;
  lastStateChange: number;
  behaviorTree?: BehaviorTree;
  blackboard: Map<string, any>;
  
  setState(newState: AIState): void;
  setTarget(target: IEntity | null): void;
  isInRange(target: IEntity): boolean;
  canSeeTarget(target: IEntity): boolean;
}

export type AIState = 'idle' | 'pursuing' | 'attacking' | 'fleeing' | 'patrolling' | 'returning';

export interface BehaviorTree {
  root: BehaviorNode;
  execute(context: AIContext): BehaviorResult;
}

export interface BehaviorNode {
  type: BehaviorNodeType;
  children?: BehaviorNode[];
  execute(context: AIContext): BehaviorResult;
}

export type BehaviorNodeType = 'selector' | 'sequence' | 'parallel' | 'action' | 'condition';
export type BehaviorResult = 'success' | 'failure' | 'running';

export interface AIContext {
  entity: IEntity;
  deltaTime: number;
  blackboard: Map<string, any>;
}

// =============================================================================
// CHARACTER COMPONENTS
// =============================================================================

export interface CharacterClassComponent extends BaseComponent {
  type: 'CharacterClass';
  className: string;
  primaryAttribute: 'strength' | 'dexterity' | 'intelligence';
  secondaryAttribute?: 'strength' | 'dexterity' | 'intelligence';
  startingStats: CharacterStats;
  
  getAttributeBonus(attribute: string): number;
  canUseItem(item: Item): boolean;
  getClassFeatures(): string[];
}

export interface LevelComponent extends BaseComponent {
  type: 'Level';
  current: number;
  experience: number;
  experienceToNext: number;
  totalExperience: number;
  
  addExperience(amount: number): boolean; // returns true if leveled up
  setLevel(level: number): void;
  getExperiencePercentage(): number;
  calculateExperienceToNext(): number;
}

export interface AttributesComponent extends BaseComponent {
  type: 'Attributes';
  strength: number;
  dexterity: number;
  intelligence: number;
  availablePoints: number;
  
  allocatePoint(attribute: 'strength' | 'dexterity' | 'intelligence'): boolean;
  getTotalPoints(): number;
  getAttributeValue(attribute: string): number;
  calculateDerivedStats(): DerivedStats;
}

export interface DerivedStats {
  health: number;
  mana: number;
  damage: number;
  accuracy: number;
  evasion: number;
  criticalChance: number;
  moveSpeed: number;
}

export interface SkillTreeComponent extends BaseComponent {
  type: 'SkillTree';
  allocatedNodes: Map<string, number>;
  availablePoints: number;
  
  allocateNode(nodeId: string): boolean;
  deallocateNode(nodeId: string): boolean;
  isNodeAllocated(nodeId: string): boolean;
  getNodeRank(nodeId: string): number;
  canAllocateNode(nodeId: string): boolean;
  calculateTotalEffects(): SkillEffect[];
}

export interface SkillEffect {
  type: string;
  value: number;
  valueType: 'flat' | 'percentage' | 'multiplier';
  target?: string;
}

// =============================================================================
// INVENTORY COMPONENTS
// =============================================================================

export interface InventoryComponent extends BaseComponent {
  type: 'Inventory';
  width: number;
  height: number;
  items: Map<string, Item>;
  grid: (string | null)[][];
  
  canPlaceItem(item: Item, x: number, y: number): boolean;
  placeItem(item: Item, x: number, y: number): boolean;
  removeItem(itemId: string): Item | null;
  moveItem(itemId: string, newX: number, newY: number): boolean;
  findItem(itemId: string): { x: number; y: number } | null;
  getItemAt(x: number, y: number): Item | null;
  getAvailableSpace(): number;
  isFull(): boolean;
}

export interface EquipmentComponent extends BaseComponent {
  type: 'Equipment';
  slots: Map<EquipmentSlot, Item | null>;
  
  equip(item: Item, slot: EquipmentSlot): Item | null; // returns unequipped item
  unequip(slot: EquipmentSlot): Item | null;
  getEquipped(slot: EquipmentSlot): Item | null;
  isSlotEmpty(slot: EquipmentSlot): boolean;
  getAllEquipped(): Item[];
  calculateBonuses(): EquipmentBonuses;
}

export type EquipmentSlot = 
  | 'weapon_main' | 'weapon_offhand' | 'helmet' | 'armor' 
  | 'gloves' | 'boots' | 'ring_1' | 'ring_2' | 'amulet' | 'belt';

export interface EquipmentBonuses {
  damage: number;
  health: number;
  mana: number;
  armor: number;
  resistances: Record<string, number>;
  attributes: Record<string, number>;
  skills: Record<string, number>;
}

// =============================================================================
// CAMPAIGN COMPONENTS
// =============================================================================

export interface CampaignProgressComponent extends BaseComponent {
  type: 'CampaignProgress';
  currentAct: number;
  completedActs: Set<number>;
  unlockedAreas: Set<string>;
  activeQuests: Map<string, Quest>;
  completedQuests: Set<string>;
  
  completeAct(actId: number): void;
  isActCompleted(actId: number): boolean;
  canAccessAct(actId: number): boolean;
  unlockArea(areaId: string): void;
  isAreaUnlocked(areaId: string): boolean;
  addQuest(quest: Quest): void;
  completeQuest(questId: string): void;
  isQuestCompleted(questId: string): boolean;
  getActiveQuests(): Quest[];
}

export interface AreaLocationComponent extends BaseComponent {
  type: 'AreaLocation';
  currentArea: string;
  previousArea: string | null;
  waypointUnlocked: boolean;
  
  setArea(areaId: string): void;
  unlockWaypoint(): void;
  canFastTravel(): boolean;
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

export interface UIComponent extends BaseComponent {
  type: 'UI';
  elements: Map<string, UIElement>;
  visible: boolean;
  zIndex: number;
  
  addElement(element: UIElement): void;
  removeElement(elementId: string): void;
  getElement(elementId: string): UIElement | null;
  setVisible(visible: boolean): void;
  bringToFront(): void;
}

export interface UIElement {
  id: string;
  type: UIElementType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  interactive: boolean;
  style: UIStyle;
  
  render(context: RenderingContext): void;
  handleInput(input: InputEvent): boolean;
}

export type UIElementType = 
  | 'button' | 'label' | 'panel' | 'window' | 'input' 
  | 'slider' | 'checkbox' | 'dropdown' | 'list' | 'grid';

export interface UIStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  padding?: number;
  margin?: number;
}

export interface RenderingContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  deltaTime: number;
}

export interface InputEvent {
  type: 'click' | 'hover' | 'key' | 'scroll';
  position?: { x: number; y: number };
  key?: string;
  delta?: number;
}

// =============================================================================
// AUDIO COMPONENTS
// =============================================================================

export interface AudioComponent extends BaseComponent {
  type: 'Audio';
  sounds: Map<string, AudioSource>;
  volume: number;
  muted: boolean;
  
  playSound(soundId: string, volume?: number): void;
  stopSound(soundId: string): void;
  stopAllSounds(): void;
  setVolume(volume: number): void;
  addSound(soundId: string, source: AudioSource): void;
}

export interface AudioSource {
  url: string;
  volume: number;
  loop: boolean;
  preloaded: boolean;
  category: AudioCategory;
}

export type AudioCategory = 'sfx' | 'music' | 'voice' | 'ambient';

// =============================================================================
// PHYSICS COMPONENTS
// =============================================================================

export interface ColliderComponent extends BaseComponent {
  type: 'Collider';
  shape: CollisionShape;
  solid: boolean;
  trigger: boolean;
  layer: number;
  mask: number;
  
  checkCollision(other: ColliderComponent): CollisionResult | null;
  contains(point: { x: number; y: number }): boolean;
  getBounds(): BoundingBox;
}

export interface CollisionShape {
  type: 'circle' | 'rectangle' | 'polygon';
  data: CircleShape | RectangleShape | PolygonShape;
}

export interface CircleShape {
  radius: number;
  offset: { x: number; y: number };
}

export interface RectangleShape {
  width: number;
  height: number;
  offset: { x: number; y: number };
}

export interface PolygonShape {
  vertices: { x: number; y: number }[];
  offset: { x: number; y: number };
}

export interface CollisionResult {
  other: ColliderComponent;
  point: { x: number; y: number };
  normal: { x: number; y: number };
  penetration: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// NETWORK COMPONENTS (for future multiplayer)
// =============================================================================

export interface NetworkComponent extends BaseComponent {
  type: 'Network';
  playerId: string;
  authoritative: boolean;
  synchronized: boolean;
  lastSyncTime: number;
  
  serialize(): NetworkData;
  deserialize(data: NetworkData): void;
  needsSync(): boolean;
  markForSync(): void;
}

export interface NetworkData {
  entityId: string;
  components: Record<string, any>;
  timestamp: number;
}

// =============================================================================
// COMPONENT REGISTRY
// =============================================================================

export interface ComponentTypeRegistry {
  Position: PositionComponent;
  Velocity: VelocityComponent;
  Sprite: SpriteComponent;
  Health: HealthComponent;
  Combat: CombatComponent;
  AI: AIComponent;
  CharacterClass: CharacterClassComponent;
  Level: LevelComponent;
  Attributes: AttributesComponent;
  SkillTree: SkillTreeComponent;
  Inventory: InventoryComponent;
  Equipment: EquipmentComponent;
  CampaignProgress: CampaignProgressComponent;
  AreaLocation: AreaLocationComponent;
  UI: UIComponent;
  Audio: AudioComponent;
  Collider: ColliderComponent;
  Network: NetworkComponent;
}

export type ComponentTypeName = keyof ComponentTypeRegistry;

export type GetComponentType<T extends ComponentTypeName> = ComponentTypeRegistry[T];

// =============================================================================
// ADDITIONAL TYPE EXPORTS  
// =============================================================================

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'currency' | 'gem';
  rarity: 'normal' | 'magic' | 'rare' | 'unique' | 'legendary';
  level: number;
  width: number;
  height: number;
  stackSize: number;
  value: number;
  properties: Record<string, any>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: Reward[];
  status: 'available' | 'active' | 'completed' | 'failed';
  requirements?: QuestRequirement[];
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

export interface QuestRequirement {
  type: 'level' | 'item' | 'quest';
  value: string | number;
}

// Removed duplicate EquipmentSlot - already defined above

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

export interface GameInputEvent {
  type: 'mouse' | 'keyboard' | 'touch' | 'gamepad';
  action: 'down' | 'up' | 'move' | 'scroll';
  data: any;
  timestamp: number;
}