// RainStorm ARPG - Core Type Definitions
// Enterprise-grade type safety for the entire game system

// =============================================================================
// CORE ECS TYPES
// =============================================================================

export interface Entity {
  readonly id: string;
  readonly components: Map<string, Component>;
  active: boolean;
  
  addComponent(component: Component): void;
  removeComponent(componentType: string): boolean;
  getComponent<T extends Component>(componentType: string): T | null;
  hasComponent(componentType: string): boolean;
  destroy(): void;
}

export interface Component {
  readonly entityId: string;
  readonly type: string;
  active: boolean;
  
  validate(): boolean;
  serialize(): ComponentData;
  deserialize(data: ComponentData): void;
}

export interface System {
  readonly requiredComponents: readonly string[];
  readonly entities: ReadonlySet<Entity>;
  
  addEntity(entity: Entity): void;
  removeEntity(entity: Entity): void;
  update(deltaTime: number): void;
  cleanup(): void;
}

export interface World {
  readonly entities: ReadonlyMap<string, Entity>;
  readonly systems: ReadonlyMap<string, System>;
  
  createEntity(id?: string): Entity;
  destroyEntity(entityId: string): boolean;
  addSystem(name: string, system: System): void;
  removeSystem(name: string): boolean;
  update(deltaTime: number): void;
}

// =============================================================================
// COMPONENT TYPES
// =============================================================================

export interface ComponentData {
  readonly type: string;
  readonly [key: string]: any;
}

export interface PositionData extends ComponentData {
  x: number;
  y: number;
  z?: number;
}

export interface VelocityData extends ComponentData {
  x: number;
  y: number;
  z?: number;
  maxSpeed?: number;
}

export interface SpriteData extends ComponentData {
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle' | 'custom';
  visible: boolean;
  opacity?: number;
  rotation?: number;
}

export interface HealthData extends ComponentData {
  current: number;
  maximum: number;
  regeneration?: number;
  lastDamageTime?: number;
}

export interface CombatData extends ComponentData {
  damage: number;
  attackSpeed: number;
  criticalChance: number;
  criticalMultiplier: number;
  accuracy: number;
  lastAttackTime: number;
  range: number;
}

export interface AIData extends ComponentData {
  state: AIState;
  aggroRange: number;
  target: Entity | null;
  lastStateChange: number;
  behaviorTree?: BehaviorNode;
}

export type AIState = 'idle' | 'pursuing' | 'attacking' | 'fleeing' | 'patrolling';

// =============================================================================
// CHARACTER SYSTEM TYPES
// =============================================================================

export interface CharacterClass {
  readonly name: string;
  readonly primaryAttribute: AttributeType;
  readonly secondaryAttribute?: AttributeType;
  readonly startingStats: CharacterStats;
  readonly skillTreeStart: SkillTreePosition;
}

export type AttributeType = 'strength' | 'dexterity' | 'intelligence';

export interface CharacterStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  level: number;
  experience: number;
  experienceToNext: number;
  skillPoints: number;
  attributePoints: number;
}

export interface SkillTreePosition {
  x: number;
  y: number;
  region: string;
}

export interface SkillNode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: SkillNodeType;
  readonly position: SkillTreePosition;
  readonly connections: readonly string[];
  readonly requirements: SkillRequirement[];
  readonly maxRank: number;
  readonly effects: readonly SkillEffect[];
}

export type SkillNodeType = 'minor' | 'notable' | 'keystone' | 'mastery';

export interface SkillRequirement {
  type: 'level' | 'attribute' | 'skill' | 'quest';
  value: number | string;
  operator: '>=' | '>' | '=' | '<' | '<=';
}

export interface SkillEffect {
  type: SkillEffectType;
  value: number;
  valueType: 'flat' | 'percentage' | 'multiplier';
  target?: string;
}

export type SkillEffectType = 
  | 'damage' | 'health' | 'mana' | 'armor' | 'resistance'
  | 'speed' | 'critical' | 'accuracy' | 'experience'
  | 'special';

// =============================================================================
// INVENTORY SYSTEM TYPES
// =============================================================================

export interface InventoryGrid {
  width: number;
  height: number;
  cells: (Item | null)[][];
}

export interface Item {
  readonly id: string;
  readonly baseType: ItemType;
  readonly name: string;
  readonly description: string;
  readonly rarity: ItemRarity;
  readonly level: number;
  readonly width: number;
  readonly height: number;
  readonly stackSize: number;
  readonly affixes: readonly Affix[];
  readonly sockets: readonly Socket[];
  readonly value: number;
  readonly icon: string;
}

export type ItemType = 
  | 'weapon' | 'armor' | 'accessory' | 'consumable' 
  | 'currency' | 'gem' | 'quest' | 'misc';

export type ItemRarity = 'normal' | 'magic' | 'rare' | 'unique' | 'legendary';

export interface Affix {
  readonly id: string;
  readonly name: string;
  readonly type: AffixType;
  readonly tier: number;
  readonly values: readonly number[];
  readonly description: string;
}

export type AffixType = 'prefix' | 'suffix' | 'implicit' | 'corrupted';

export interface Socket {
  readonly color: SocketColor;
  readonly linked: readonly number[];
  gem: Gem | null;
}

export type SocketColor = 'red' | 'green' | 'blue' | 'white';

export interface Gem {
  readonly id: string;
  readonly name: string;
  readonly type: GemType;
  readonly level: number;
  readonly experience: number;
  readonly quality: number;
  readonly requirements: GemRequirement[];
}

export type GemType = 'active' | 'support' | 'aura' | 'curse';

export interface GemRequirement {
  attribute: AttributeType;
  value: number;
}

// =============================================================================
// CRAFTING SYSTEM TYPES
// =============================================================================

export interface CraftingRecipe {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly ingredients: readonly CraftingIngredient[];
  readonly result: CraftingResult;
  readonly requirements: readonly CraftingRequirement[];
}

export interface CraftingIngredient {
  itemType: string;
  quantity: number;
  quality?: number;
  rarity?: ItemRarity;
}

export interface CraftingResult {
  itemType: string;
  quantity: number;
  qualityRange: [number, number];
  rarityChances: Record<ItemRarity, number>;
}

export interface CraftingRequirement {
  type: 'level' | 'skill' | 'tool' | 'location';
  value: string | number;
}

export interface CurrencyItem extends Item {
  readonly stackSize: number;
  readonly effect: CurrencyEffect;
}

export interface CurrencyEffect {
  type: CurrencyEffectType;
  target: ItemType[];
  probability: number;
  modifications: CurrencyModification[];
}

export type CurrencyEffectType = 
  | 'reroll' | 'upgrade' | 'add_affix' | 'remove_affix'
  | 'corrupt' | 'divine' | 'chaos' | 'fusing';

export interface CurrencyModification {
  property: string;
  operation: 'set' | 'add' | 'multiply' | 'reroll';
  value?: number;
  range?: [number, number];
}

// =============================================================================
// CAMPAIGN SYSTEM TYPES
// =============================================================================

export interface Campaign {
  readonly acts: ReadonlyMap<number, Act>;
  readonly totalActs: number;
  currentAct: number;
  completedActs: ReadonlySet<number>;
}

export interface Act {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly requiredLevel: number;
  readonly maxLevel: number;
  readonly areas: ReadonlyMap<string, Area>;
  readonly quests: readonly Quest[];
  readonly rewards: readonly Reward[];
}

export interface Area {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: AreaType;
  readonly level: number;
  readonly connections: readonly string[];
  readonly waypoint: boolean;
  readonly monsters: readonly MonsterSpawn[];
  readonly treasures: readonly TreasureSpawn[];
}

export type AreaType = 'town' | 'dungeon' | 'outdoor' | 'boss' | 'unique';

export interface MonsterSpawn {
  monsterId: string;
  quantity: [number, number];
  probability: number;
  level: [number, number];
}

export interface TreasureSpawn {
  type: 'chest' | 'currency' | 'item';
  probability: number;
  contents: TreasureContents;
}

export interface TreasureContents {
  items?: ItemDrop[];
  currency?: CurrencyDrop[];
  experience?: number;
}

export interface ItemDrop {
  itemType: string;
  quantity: [number, number];
  rarity: ItemRarity;
  level: [number, number];
  probability: number;
}

export interface CurrencyDrop {
  currencyType: string;
  quantity: [number, number];
  probability: number;
}

// =============================================================================
// QUEST SYSTEM TYPES
// =============================================================================

export interface Quest {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: QuestType;
  readonly act: number;
  readonly requirements: readonly QuestRequirement[];
  readonly objectives: readonly QuestObjective[];
  readonly rewards: readonly Reward[];
  readonly optional: boolean;
  readonly repeatable: boolean;
}

export type QuestType = 'main' | 'side' | 'bounty' | 'daily' | 'challenge';

export interface QuestRequirement {
  type: 'level' | 'quest' | 'item' | 'area' | 'class';
  value: string | number;
}

export interface QuestObjective {
  readonly id: string;
  readonly description: string;
  readonly type: ObjectiveType;
  readonly target: string;
  readonly quantity: number;
  completed: boolean;
  progress: number;
}

export type ObjectiveType = 
  | 'kill' | 'collect' | 'talk' | 'reach' | 'use' | 'craft' | 'survive';

export interface Reward {
  type: RewardType;
  value: string | number;
  quantity?: number;
}

export type RewardType = 
  | 'experience' | 'skill_points' | 'currency' | 'item' 
  | 'access' | 'passive' | 'gem';

// =============================================================================
// PERFORMANCE & LOGGING TYPES
// =============================================================================

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  entityCount: number;
  systemMetrics: Record<string, SystemMetrics>;
}

export interface SystemMetrics {
  executionTime: number;
  entityCount: number;
  lastUpdate: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
}

export interface LogEntry {
  readonly timestamp: number;
  readonly level: LogLevel;
  readonly message: string;
  readonly context: LogContext;
  readonly id: string;
  readonly sessionTime: number;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogContext {
  readonly [key: string]: any;
  system?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  error?: Error;
}

export interface SystemHealth {
  status: HealthStatus;
  fps: number;
  memory: number;
  errorRate: number;
  uptime: number;
  criticalErrors: number;
}

export type HealthStatus = 'healthy' | 'warning' | 'critical';

// =============================================================================
// EVENT SYSTEM TYPES
// =============================================================================

export interface GameEvent<T = any> {
  readonly type: string;
  readonly timestamp: number;
  readonly source: string;
  readonly data: T;
  readonly id: string;
}

export interface EventHandler<T = any> {
  (event: GameEvent<T>): void | Promise<void>;
}

export interface EventBus {
  subscribe<T>(eventType: string, handler: EventHandler<T>): void;
  unsubscribe<T>(eventType: string, handler: EventHandler<T>): void;
  emit<T>(eventType: string, data: T, source?: string): void;
  clear(): void;
}

// =============================================================================
// BEHAVIOR TREE TYPES (for AI)
// =============================================================================

export interface BehaviorNode {
  readonly type: BehaviorNodeType;
  readonly children?: readonly BehaviorNode[];
  execute(context: AIContext): BehaviorResult;
}

export type BehaviorNodeType = 
  | 'selector' | 'sequence' | 'parallel' | 'decorator'
  | 'condition' | 'action' | 'wait' | 'repeat';

export type BehaviorResult = 'success' | 'failure' | 'running';

export interface AIContext {
  entity: Entity;
  world: World;
  deltaTime: number;
  blackboard: Map<string, any>;
}

// =============================================================================
// SAVE SYSTEM TYPES
// =============================================================================

export interface SaveData {
  readonly version: string;
  readonly timestamp: number;
  readonly playTime: number;
  readonly character: CharacterSaveData;
  readonly inventory: InventorySaveData;
  readonly campaign: CampaignSaveData;
  readonly settings: GameSettings;
}

export interface CharacterSaveData {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  stats: CharacterStats;
  skillTree: SkillTreeSaveData;
  position: PositionData;
}

export interface SkillTreeSaveData {
  allocatedNodes: Record<string, number>;
  availablePoints: number;
}

export interface InventorySaveData {
  grid: (string | null)[][];
  items: Record<string, Item>;
  currency: Record<string, number>;
}

export interface CampaignSaveData {
  currentAct: number;
  completedActs: number[];
  completedQuests: string[];
  activeQuests: string[];
  unlockedAreas: string[];
  currentArea: string;
}

export interface GameSettings {
  graphics: GraphicsSettings;
  audio: AudioSettings;
  controls: ControlSettings;
  gameplay: GameplaySettings;
}

export interface GraphicsSettings {
  resolution: [number, number];
  fullscreen: boolean;
  vsync: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  effects: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export interface ControlSettings {
  keyBindings: Record<string, string>;
  mouseSensitivity: number;
  invertMouse: boolean;
}

export interface GameplaySettings {
  showDamageNumbers: boolean;
  showTutorials: boolean;
  autoPickupCurrency: boolean;
  chatFilter: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface Validator<T> {
  validate(value: T): ValidationResult;
}

// =============================================================================
// NETWORK TYPES (for future multiplayer)
// =============================================================================

export interface NetworkMessage {
  type: string;
  timestamp: number;
  playerId: string;
  data: any;
}

export interface PlayerSession {
  id: string;
  playerId: string;
  connected: boolean;
  lastSeen: number;
  latency: number;
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

// Note: Removed wildcard exports to prevent naming conflicts
// Import specific types from other modules as needed