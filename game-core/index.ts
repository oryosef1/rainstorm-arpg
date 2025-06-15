// index.ts - Main Game Core Entry Point
export { Entity, Component, System, World } from './ecs/ecs-core';
export * from './components/ecs-components';
export { InventorySystem } from './inventory/inventory-system';
export { ItemFactory } from './inventory/item-factory';
export { CharacterClassData } from './character/classes/character-classes';
export { PassiveSkillTree, SkillNode } from './character/skills/passive-skill-tree';
export { SkillGemDatabase, SkillGem } from './character/skills/skill-gems';
export { CharacterProgression, ExperienceSystem } from './character/progression/character-progression';
export { CraftingMechanics } from './crafting/crafting-mechanics';
export { CurrencySystem } from './crafting/currency-system';
export { CurrencyDropManager } from './crafting/currency-drop-manager';
export { MasterCrafting } from './crafting/master-crafting';
export { ItemCorruption } from './crafting/item-corruption';
export { CraftingUI } from './crafting/crafting-ui';

export default {
  version: '1.0.0',
  description: 'RainStorm ARPG - TypeScript Game Core'
};