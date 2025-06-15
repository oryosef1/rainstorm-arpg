// ecs-components.ts - ECS Component Definitions
import { Component } from '../ecs/ecs-core';

export class Position extends Component {
  readonly name = 'Position';
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    super();
    this.x = x;
    this.y = y;
  }
}

export class Velocity extends Component {
  readonly name = 'Velocity';
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    super();
    this.x = x;
    this.y = y;
  }
}

export class Health extends Component {
  readonly name = 'Health';
  current: number;
  maximum: number;

  constructor(current: number, maximum: number) {
    super();
    this.current = current;
    this.maximum = maximum;
  }
}

export class Mana extends Component {
  readonly name = 'Mana';
  current: number;
  maximum: number;

  constructor(current: number, maximum: number) {
    super();
    this.current = current;
    this.maximum = maximum;
  }
}

export class Attributes extends Component {
  readonly name = 'Attributes';
  strength: number;
  dexterity: number;
  intelligence: number;

  constructor(strength: number, dexterity: number, intelligence: number) {
    super();
    this.strength = strength;
    this.dexterity = dexterity;
    this.intelligence = intelligence;
  }
}

export class Level extends Component {
  readonly name = 'Level';
  current: number;

  constructor(current: number = 1) {
    super();
    this.current = current;
  }
}

export class Experience extends Component {
  readonly name = 'Experience';
  current: number;
  total: number;

  constructor(current: number = 0, total: number = 0) {
    super();
    this.current = current;
    this.total = total;
  }
}

export class CharacterClass extends Component {
  readonly name = 'CharacterClass';
  className: string;
  primaryAttribute: string;
  secondaryAttribute: string | null;

  constructor(className: string, primaryAttribute: string, secondaryAttribute: string | null = null) {
    super();
    this.className = className;
    this.primaryAttribute = primaryAttribute;
    this.secondaryAttribute = secondaryAttribute;
  }
}

export class SkillTree extends Component {
  readonly name = 'SkillTree';
  allocatedNodes: Set<string>;
  availablePoints: number;
  questRewardsReceived: Set<string>;

  constructor() {
    super();
    this.allocatedNodes = new Set();
    this.availablePoints = 0;
    this.questRewardsReceived = new Set();
  }
}

export class Inventory extends Component {
  readonly name = 'Inventory';
  width: number;
  height: number;
  slots: (string | null)[][];
  items: Record<string, any>;

  constructor(width: number = 12, height: number = 5) {
    super();
    this.width = width;
    this.height = height;
    this.slots = Array(height).fill(null).map(() => Array(width).fill(null));
    this.items = {};
  }
}

export class Equipment extends Component {
  readonly name = 'Equipment';
  slots: Record<string, any>;

  constructor() {
    super();
    this.slots = {
      mainHand: null,
      offHand: null,
      helmet: null,
      bodyArmor: null,
      gloves: null,
      boots: null,
      belt: null,
      amulet: null,
      ringLeft: null,
      ringRight: null
    };
  }
}

export class Combat extends Component {
  readonly name = 'Combat';
  attackDamage: number;
  defense: number;
  criticalChance: number;
  attackSpeed: number;

  constructor() {
    super();
    this.attackDamage = 10;
    this.defense = 5;
    this.criticalChance = 0.05;
    this.attackSpeed = 1.0;
  }
}

export class Sprite extends Component {
  readonly name = 'Sprite';
  color: string;
  size: number;
  shape: string;

  constructor(color: string = '#ffffff', size: number = 10, shape: string = 'circle') {
    super();
    this.color = color;
    this.size = size;
    this.shape = shape;
  }
}

export default {
  Position, Velocity, Health, Mana, Attributes, Level, Experience,
  CharacterClass, SkillTree, Inventory, Equipment, Combat, Sprite
};