// Path of Exile style inventory management - Type Definitions
// Auto-generated TypeScript types for conflict-free parallel development

// === CORE INTERFACES ===

export interface InventorySystemConfig {
  enabled?: boolean;
  maxRetries?: number;
  timeout?: number;
  debug?: boolean;
  gridWidth?: number;
  gridHeight?: number;
  autoSort?: boolean;
  stackableItems?: boolean;
  [key: string]: any;
}

export interface InventorySystemState {
  isInitialized: boolean;
  lastUpdated: number;
  errorCount: number;
  isHealthy: boolean;
}

export interface InventorySystemMetrics {
  operationsCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastOperationTime: number;
}

// === INVENTORY TYPES ===

export interface ItemData {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'ring' | 'amulet' | 'belt' | 'flask' | 'gem' | 'currency' | 'map' | 'misc';
  rarity: 'normal' | 'magic' | 'rare' | 'unique';
  level?: number;
  width: number;
  height: number;
  stackSize?: number;
  currentStack?: number;
  sockets?: SocketData[];
  affixes?: AffixData[];
  requirements?: RequirementData[];
  flavorText?: string;
  iconPath?: string;
  metadata?: Record<string, any>;
}

export interface SocketData {
  id: string;
  color: 'red' | 'green' | 'blue' | 'white';
  linked: boolean;
  linkedTo?: string[];
  gem?: GemData;
}

export interface GemData {
  id: string;
  name: string;
  color: 'red' | 'green' | 'blue' | 'white';
  level: number;
  experience: number;
  quality: number;
  tags: string[];
}

export interface AffixData {
  id: string;
  type: 'prefix' | 'suffix';
  tier: number;
  text: string;
  values: number[];
  ranges: [number, number][];
}

export interface RequirementData {
  type: 'level' | 'strength' | 'dexterity' | 'intelligence';
  value: number;
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface InventorySlot {
  position: GridPosition;
  item: ItemData | null;
  occupied: boolean;
}

export interface InventoryState {
  grid: InventorySlot[];
  equippedItems: Record<EquipmentSlotType, ItemData>;
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
}

// === EQUIPMENT TYPES ===

export type EquipmentSlotType = 
  | 'mainHand' 
  | 'offHand' 
  | 'helmet' 
  | 'chest' 
  | 'gloves' 
  | 'boots' 
  | 'belt' 
  | 'amulet' 
  | 'ring1' 
  | 'ring2'
  | 'flask1'
  | 'flask2'
  | 'flask3'
  | 'flask4'
  | 'flask5';

export interface EquipmentSlots {
  mainHand?: ItemData;
  offHand?: ItemData;
  helmet?: ItemData;
  chest?: ItemData;
  gloves?: ItemData;
  boots?: ItemData;
  belt?: ItemData;
  amulet?: ItemData;
  ring1?: ItemData;
  ring2?: ItemData;
  flask1?: ItemData;
  flask2?: ItemData;
  flask3?: ItemData;
  flask4?: ItemData;
  flask5?: ItemData;
}

// === EVENT DATA TYPES ===

export interface InventoryItemAddedData {
  timestamp: number;
  source: string;
  item: ItemData;
  position: GridPosition;
}

export interface InventoryItemRemovedData {
  timestamp: number;
  source: string;
  itemId: string;
}

export interface InventoryItemMovedData {
  timestamp: number;
  source: string;
  item: ItemData;
  oldPosition: GridPosition;
  newPosition: GridPosition;
}

export interface InventoryItemEquippedData {
  timestamp: number;
  source: string;
  item: ItemData;
  slot: EquipmentSlotType;
}

export interface InventoryItemUnequippedData {
  timestamp: number;
  source: string;
  item: ItemData;
  slot: EquipmentSlotType;
}

export interface InventoryFullData {
  timestamp: number;
  source: string;
}

export interface CharacterLevelUpData {
  timestamp: number;
  source: string;
  newLevel: number;
  oldLevel: number;
  character: any;
}

export interface ItemFactoryCreatedData {
  timestamp: number;
  source: string;
  item: ItemData;
}

// === API TYPES ===

export interface AddItemRequest {
  item: ItemData;
  position?: GridPosition;
}

export interface AddItemResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface RemoveItemRequest {
  itemId: string;
}

export interface RemoveItemResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface GetInventoryStateRequest {
}

export interface GetInventoryStateResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface EquipItemRequest {
  itemId: string;
  slot: EquipmentSlotType;
}

export interface EquipItemResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface UnequipItemRequest {
  slot: EquipmentSlotType;
}

export interface UnequipItemResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface MoveItemRequest {
  itemId: string;
  newPosition: GridPosition;
}

export interface MoveItemResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

// === UTILITY TYPES ===

export type InventorySystemStatus = 'initializing' | 'ready' | 'busy' | 'error' | 'shutting-down';

export type InventorySystemLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type InventorySystemOperation = 'addItem' | 'removeItem' | 'getInventoryState' | 'equipItem' | 'unequipItem' | 'moveItem';

// === ERROR TYPES ===

export class InventorySystemError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly code: string = 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = 'InventorySystemError';
  }
}

// === HELPER FUNCTIONS ===

export function isInventorySystemError(error: any): error is InventorySystemError {
  return error instanceof InventorySystemError;
}

export function createInventorySystemConfig(overrides: Partial<InventorySystemConfig> = {}): InventorySystemConfig {
  return {
    enabled: true,
    maxRetries: 3,
    timeout: 30000,
    debug: false,
    gridWidth: 12,
    gridHeight: 5,
    autoSort: false,
    stackableItems: true,
    ...overrides
  };
}

export function createEmptyItem(type: ItemData['type'] = 'misc'): ItemData {
  return {
    id: '',
    name: 'Empty Item',
    type,
    rarity: 'normal',
    width: 1,
    height: 1,
    sockets: [],
    affixes: [],
    requirements: []
  };
}

export function createGridPosition(x: number = 0, y: number = 0): GridPosition {
  return { x, y };
}

export function isValidGridPosition(position: GridPosition, gridWidth: number = 12, gridHeight: number = 5): boolean {
  return position.x >= 0 && position.x < gridWidth && position.y >= 0 && position.y < gridHeight;
}

export function calculateItemArea(item: ItemData): number {
  return (item.width || 1) * (item.height || 1);
}

export function canItemsStack(item1: ItemData, item2: ItemData): boolean {
  return item1.name === item2.name && 
         item1.type === item2.type && 
         item1.rarity === item2.rarity &&
         !!item1.stackSize &&
         !!item2.stackSize;
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    InventorySystemError,
    isInventorySystemError,
    createInventorySystemConfig,
    createEmptyItem,
    createGridPosition,
    isValidGridPosition,
    calculateItemArea,
    canItemsStack
  };
}