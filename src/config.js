(function config(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};

  const CONFIG = {
    CANVAS_LAYOUTS: {
      desktop: {
        width: 1200,
        height: 540,
        pathWidth: 72,
        towerRadius: 18,
        placementPadding: 5,
        enemyRadiusScale: 1,
        towerHitSlop: 5,
        mapHintFontSize: 14
      },
      mobile: {
        width: 640,
        height: 760,
        pathWidth: 72,
        towerRadius: 20,
        placementPadding: 3,
        enemyRadiusScale: 1.22,
        towerHitSlop: 16,
        mapHintFontSize: 16
      }
    },
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 540,
    CURRENT_LAYOUT: 'desktop',
    INITIAL_LIVES: 20,
    INITIAL_MONEY: 150,
    INITIAL_SCORE: 0,
    TOWER_SELL_RATIO: 0.7,
    PATH_WIDTH: 72,
    TOWER_RADIUS: 18,
    MEDIEVAL_ARCHER_VISUAL_Y_OFFSET: 12,
    ENEMY_BASE_RADIUS: 13,
    ENEMY_RADIUS_SCALE: 1,
    TOWER_HIT_SLOP: 5,
    MIN_TOWER_SELECTION_RADIUS: 18,
    PROJECTILE_RADIUS: 4,
    PLACEMENT_PADDING: 5,
    TOWER_UPGRADE: {
      earlyLevelCount: 12,
      damageGrowthEarly: 0.16,
      damageGrowthLate: 0.075,
      rangePerLevel: 5,
      maxRangeBonus: 70,
      cooldownReductionPerLevel: 0.035,
      maxCooldownReduction: 0.45,
      minCooldown: 140,
      costBaseMultiplier: 0.8,
      costLevelMultiplier: 0.45,
      costGrowthMultiplier: 0.12,
      costGrowthExponent: 1.25
    },
    GRID: {
      enabled: true,
      size: 48,
      lineColor: 'rgba(180, 180, 180, 0.38)',
      validCellColor: 'rgba(74, 222, 128, 0.18)',
      invalidCellColor: 'rgba(248, 113, 113, 0.20)',
      hoverBorderValid: 'rgba(74, 222, 128, 0.75)',
      hoverBorderInvalid: 'rgba(248, 113, 113, 0.75)'
    },
    DRAG_PLACEMENT: {
      threshold: 8,
      ghostOffset: {
        x: 0,
        y: -48
      }
    },
    MAP_HINT_FONT_SIZE: 14,
    WAVE_HEALTH_GROWTH: 1.12,
    STORAGE_KEYS: {
      BEST_SCORE: 'tower-defender.bestScore',
      BEST_WAVE: 'tower-defender.bestWave'
    },
    PATH_POINTS: [
      { x: -48, y: 288 },
      { x: 144, y: 288 },
      { x: 144, y: 96 },
      { x: 432, y: 96 },
      { x: 432, y: 432 },
      { x: 672, y: 432 },
      { x: 672, y: 192 },
      { x: 960, y: 192 },
      { x: 960, y: 336 },
      { x: 1248, y: 336 }
    ]
  };

  const TOWER_TYPES = {
    basic: {
      id: 'basic',
      name: 'Básica',
      cost: 50,
      damage: 20,
      range: 110,
      cooldown: 700,
      projectileSpeed: 8,
      color: '#38bdf8',
      accent: '#bae6fd',
      description: 'Equilibrada e confiável.'
    },
    rapid: {
      id: 'rapid',
      name: 'Rápida',
      cost: 75,
      damage: 10,
      range: 95,
      cooldown: 300,
      projectileSpeed: 10,
      color: '#34d399',
      accent: '#bbf7d0',
      description: 'Dispara muito rápido.'
    },
    heavy: {
      id: 'heavy',
      name: 'Pesada',
      cost: 120,
      damage: 45,
      range: 140,
      cooldown: 1200,
      projectileSpeed: 7,
      color: '#f59e0b',
      accent: '#fde68a',
      description: 'Alto dano e alcance.'
    }
  };

  const ENEMY_TYPES = {
    common: {
      id: 'common',
      name: 'Comum',
      health: 60,
      speed: 1.2,
      reward: 10,
      leakDamage: 1,
      radius: 13,
      color: '#f43f5e',
      accent: '#fecdd3'
    },
    fast: {
      id: 'fast',
      name: 'Rápido',
      health: 35,
      speed: 2,
      reward: 8,
      leakDamage: 1,
      radius: 11,
      color: '#a78bfa',
      accent: '#ddd6fe'
    },
    tank: {
      id: 'tank',
      name: 'Tanque',
      health: 160,
      speed: 0.7,
      reward: 25,
      leakDamage: 2,
      radius: 17,
      color: '#f97316',
      accent: '#fed7aa'
    }
  };

  TD.CONFIG = CONFIG;
  TD.TOWER_TYPES = TOWER_TYPES;
  TD.ENEMY_TYPES = ENEMY_TYPES;
})(globalThis);
