// Path of Exile style flask system - Type Definitions
// Auto-generated TypeScript types for conflict-free parallel development

// === CORE INTERFACES ===

export interface FlaskSystemConfig {
  enabled?: boolean;
  maxRetries?: number;
  timeout?: number;
  debug?: boolean;
  autoUse?: boolean;
  lowHealthThreshold?: number;
  lowManaThreshold?: number;
  [key: string]: any;
}

export interface FlaskSystemState {
  isInitialized: boolean;
  lastUpdated: number;
  errorCount: number;
  isHealthy: boolean;
}

export interface FlaskSystemMetrics {
  operationsCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastOperationTime: number;
}

// === FLASK TYPES ===

export interface FlaskData {
  id: string;
  name: string;
  type: 'life' | 'mana' | 'hybrid' | 'utility';
  tier: number;
  rarity: 'normal' | 'magic' | 'rare' | 'unique';
  
  // Recovery properties (for life/mana/hybrid flasks)
  recoveryAmount?: number;
  recoveryRate?: number;
  instantRecovery?: number;
  
  // Utility properties (for utility flasks)
  utilityType?: UtilityFlaskType;
  effectMagnitude?: number;
  
  // Charge system
  charges: {
    current: number;
    maximum: number;
    chargesUsedPerUse: number;
    chargeGainOnKill: number;
    chargeGainOnCrit: number;
    chargeRecovery: number; // Charges per second
  };
  
  // Duration and effects
  duration: number;
  effectDuration?: number;
  
  // Modifiers
  affixes?: FlaskAffix[];
  quality?: number;
  
  // Requirements
  level?: number;
  
  // Visual
  iconPath?: string;
  description?: string;
}

export type UtilityFlaskType = 
  | 'ruby' | 'sapphire' | 'topaz' | 'amethyst' | 'bismuth'  // Resistance flasks
  | 'granite' | 'jade' | 'aquamarine'                       // Defensive flasks
  | 'quicksilver' | 'silver' | 'quartz'                     // Movement flasks
  | 'diamond' | 'sulphur'                                   // Damage flasks
  | 'stibnite' | 'corundum' | 'cinderswallow';              // Special flasks

export interface FlaskAffix {
  id: string;
  type: 'prefix' | 'suffix';
  tier: number;
  text: string;
  values: number[];
  ranges: [number, number][];
}

export interface FlaskSlot {
  slotNumber: number;
  flask: FlaskData | null;
  keybind?: string;
}

export interface FlaskSlotState {
  slotNumber: number;
  flask: FlaskData | null;
  currentCharges: number;
  isActive: boolean;
  effectTimeRemaining: number;
  keybind?: string;
}

export interface ActiveFlaskEffect {
  flaskId: string;
  flaskName: string;
  effectType: 'recovery' | 'utility';
  startTime: number;
  duration: number;
  timeRemaining: number;
  magnitude?: number;
  recoveryPerSecond?: number;
  utilityEffect?: UtilityEffect;
}

export interface UtilityEffect {
  type: UtilityFlaskType;
  magnitude: number;
  description: string;
  stats: EffectStat[];
}

export interface EffectStat {
  name: string;
  value: number;
  type: 'percentage' | 'flat' | 'more' | 'increased';
}

// === FLASK TIERS ===

export interface FlaskTier {
  tier: number;
  level: number;
  name: string;
  baseRecovery?: number;
  baseDuration: number;
  baseCharges: number;
  chargesPerUse: number;
}

// === EVENT DATA TYPES ===

export interface FlaskUsedData {
  timestamp: number;
  source: string;
  flask: FlaskData;
  slotNumber: number;
  effectStarted: boolean;
}

export interface FlaskEffectStartedData {
  timestamp: number;
  source: string;
  flask: FlaskData;
  effect: ActiveFlaskEffect;
  slotNumber: number;
}

export interface FlaskEffectEndedData {
  timestamp: number;
  source: string;
  flask: FlaskData;
  effect: ActiveFlaskEffect;
  slotNumber: number;
  reason: 'duration' | 'cancelled' | 'replaced';
}

export interface FlaskChargesGainedData {
  timestamp: number;
  source: string;
  flask: FlaskData;
  slotNumber: number;
  chargesGained: number;
  newChargeCount: number;
  gainReason: 'kill' | 'crit' | 'time' | 'manual';
}

export interface FlaskEmptyData {
  timestamp: number;
  source: string;
  flask: FlaskData;
  slotNumber: number;
}

export interface CombatEnemyKilledData {
  timestamp: number;
  source: string;
  enemy: any;
  killType: 'normal' | 'critical';
}

export interface CombatCriticalHitData {
  timestamp: number;
  source: string;
  damage: number;
  target: any;
}

export interface CharacterHealthChangedData {
  timestamp: number;
  source: string;
  oldHealth: number;
  newHealth: number;
  maxHealth: number;
  changeReason: 'damage' | 'recovery' | 'regeneration';
}

export interface CharacterManaChangedData {
  timestamp: number;
  source: string;
  oldMana: number;
  newMana: number;
  maxMana: number;
  changeReason: 'skill' | 'recovery' | 'regeneration';
}

// === API TYPES ===

export interface UseFlaskRequest {
  slotNumber: number;
}

export interface UseFlaskResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface GetFlaskStateRequest {
}

export interface GetFlaskStateResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface AddChargesRequest {
  slotNumber: number;
  charges: number;
}

export interface AddChargesResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface SetFlaskInSlotRequest {
  slotNumber: number;
  flask: FlaskData;
}

export interface SetFlaskInSlotResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface RemoveFlaskFromSlotRequest {
  slotNumber: number;
}

export interface RemoveFlaskFromSlotResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface GetActiveEffectsRequest {
}

export interface GetActiveEffectsResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface UpdateFlaskChargesRequest {
  event: string;
  amount?: number;
}

export interface UpdateFlaskChargesResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

// === UTILITY TYPES ===

export type FlaskSystemStatus = 'initializing' | 'ready' | 'busy' | 'error' | 'shutting-down';

export type FlaskSystemLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type FlaskSystemOperation = 'useFlask' | 'getFlaskState' | 'addCharges' | 'setFlaskInSlot' | 'removeFlaskFromSlot' | 'getActiveEffects' | 'updateFlaskCharges';

// === ERROR TYPES ===

export class FlaskSystemError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly code: string = 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = 'FlaskSystemError';
  }
}

// === HELPER FUNCTIONS ===

export function isFlaskSystemError(error: any): error is FlaskSystemError {
  return error instanceof FlaskSystemError;
}

export function createFlaskSystemConfig(overrides: Partial<FlaskSystemConfig> = {}): FlaskSystemConfig {
  return {
    enabled: true,
    maxRetries: 3,
    timeout: 30000,
    debug: false,
    autoUse: false,
    lowHealthThreshold: 0.3,
    lowManaThreshold: 0.2,
    ...overrides
  };
}

export function createEmptyFlask(type: FlaskData['type'] = 'life'): FlaskData {
  return {
    id: '',
    name: `Empty ${type} flask`,
    type,
    tier: 1,
    rarity: 'normal',
    charges: {
      current: 0,
      maximum: 20,
      chargesUsedPerUse: 10,
      chargeGainOnKill: 1,
      chargeGainOnCrit: 1,
      chargeRecovery: 1
    },
    duration: 5000, // 5 seconds
    level: 1
  };
}

export function isFlaskUsable(flask: FlaskData): boolean {
  return flask.charges.current >= flask.charges.chargesUsedPerUse;
}

export function calculateRecoveryPerSecond(flask: FlaskData): number {
  if (!flask.recoveryAmount || !flask.duration) return 0;
  return flask.recoveryAmount / (flask.duration / 1000);
}

export function getFlaskEfficiency(flask: FlaskData): number {
  if (!flask.recoveryAmount) return 0;
  return flask.recoveryAmount / flask.charges.chargesUsedPerUse;
}

export function isFlaskOnCooldown(lastUseTime: number, cooldown: number): boolean {
  return Date.now() - lastUseTime < cooldown;
}

export function calculateChargeGainOnKill(flask: FlaskData, killType: 'normal' | 'critical'): number {
  let baseGain = flask.charges.chargeGainOnKill;
  if (killType === 'critical') {
    baseGain += flask.charges.chargeGainOnCrit;
  }
  return Math.min(baseGain, flask.charges.maximum - flask.charges.current);
}

// === FLASK TEMPLATES ===

export const LIFE_FLASK_TIERS: FlaskTier[] = [
  { tier: 1, level: 1, name: 'Small Life Flask', baseRecovery: 70, baseDuration: 5000, baseCharges: 35, chargesPerUse: 7 },
  { tier: 2, level: 3, name: 'Medium Life Flask', baseRecovery: 150, baseDuration: 6000, baseCharges: 42, chargesPerUse: 7 },
  { tier: 3, level: 6, name: 'Large Life Flask', baseRecovery: 250, baseDuration: 7000, baseCharges: 42, chargesPerUse: 6 },
  { tier: 4, level: 12, name: 'Greater Life Flask', baseRecovery: 360, baseDuration: 7000, baseCharges: 42, chargesPerUse: 6 },
  { tier: 5, level: 18, name: 'Grand Life Flask', baseRecovery: 640, baseDuration: 8000, baseCharges: 48, chargesPerUse: 8 },
  { tier: 6, level: 24, name: 'Giant Life Flask', baseRecovery: 830, baseDuration: 8000, baseCharges: 48, chargesPerUse: 8 },
  { tier: 7, level: 30, name: 'Colossal Life Flask', baseRecovery: 1200, baseDuration: 8500, baseCharges: 51, chargesPerUse: 8.5 }
];

export const MANA_FLASK_TIERS: FlaskTier[] = [
  { tier: 1, level: 1, name: 'Small Mana Flask', baseRecovery: 50, baseDuration: 5000, baseCharges: 35, chargesPerUse: 7 },
  { tier: 2, level: 3, name: 'Medium Mana Flask', baseRecovery: 100, baseDuration: 6000, baseCharges: 42, chargesPerUse: 7 },
  { tier: 3, level: 6, name: 'Large Mana Flask', baseRecovery: 170, baseDuration: 7000, baseCharges: 42, chargesPerUse: 6 },
  { tier: 4, level: 12, name: 'Greater Mana Flask', baseRecovery: 250, baseDuration: 7000, baseCharges: 42, chargesPerUse: 6 },
  { tier: 5, level: 18, name: 'Grand Mana Flask', baseRecovery: 350, baseDuration: 8000, baseCharges: 48, chargesPerUse: 8 },
  { tier: 6, level: 24, name: 'Giant Mana Flask', baseRecovery: 480, baseDuration: 8000, baseCharges: 48, chargesPerUse: 8 },
  { tier: 7, level: 30, name: 'Colossal Mana Flask', baseRecovery: 700, baseDuration: 8500, baseCharges: 51, chargesPerUse: 8.5 }
];

export const HYBRID_FLASK_TIERS: FlaskTier[] = [
  { tier: 1, level: 10, name: 'Small Hybrid Flask', baseRecovery: 140, baseDuration: 5000, baseCharges: 20, chargesPerUse: 10 },
  { tier: 2, level: 20, name: 'Medium Hybrid Flask', baseRecovery: 280, baseDuration: 6000, baseCharges: 20, chargesPerUse: 10 },
  { tier: 3, level: 30, name: 'Large Hybrid Flask', baseRecovery: 480, baseDuration: 7000, baseCharges: 20, chargesPerUse: 10 },
  { tier: 4, level: 40, name: 'Greater Hybrid Flask', baseRecovery: 720, baseDuration: 7000, baseCharges: 20, chargesPerUse: 10 },
  { tier: 5, level: 50, name: 'Grand Hybrid Flask', baseRecovery: 1000, baseDuration: 8000, baseCharges: 20, chargesPerUse: 10 },
  { tier: 6, level: 60, name: 'Giant Hybrid Flask', baseRecovery: 1320, baseDuration: 8000, baseCharges: 20, chargesPerUse: 10 },
  { tier: 7, level: 68, name: 'Colossal Hybrid Flask', baseRecovery: 1740, baseDuration: 8500, baseCharges: 20, chargesPerUse: 10 }
];

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FlaskSystemError,
    isFlaskSystemError,
    createFlaskSystemConfig,
    createEmptyFlask,
    isFlaskUsable,
    calculateRecoveryPerSecond,
    getFlaskEfficiency,
    isFlaskOnCooldown,
    calculateChargeGainOnKill,
    LIFE_FLASK_TIERS,
    MANA_FLASK_TIERS,
    HYBRID_FLASK_TIERS
  };
}