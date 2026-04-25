(function config(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};

  const CONFIG = {
    CANVAS_LAYOUTS: {
      desktop: {
        width: 1200,
        height: 540,
        pathWidth: 58,
        towerRadius: 18,
        placementPadding: 8,
        enemyRadiusScale: 1,
        towerHitSlop: 5,
        mapHintFontSize: 14
      },
      mobile: {
        width: 480,
        height: 800,
        pathWidth: 64,
        towerRadius: 24,
        placementPadding: 12,
        enemyRadiusScale: 1.38,
        towerHitSlop: 18,
        mapHintFontSize: 18
      }
    },
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 540,
    CURRENT_LAYOUT: 'desktop',
    INITIAL_LIVES: 20,
    INITIAL_MONEY: 150,
    INITIAL_SCORE: 0,
    PATH_WIDTH: 58,
    TOWER_RADIUS: 18,
    ENEMY_BASE_RADIUS: 13,
    ENEMY_RADIUS_SCALE: 1,
    TOWER_HIT_SLOP: 5,
    PROJECTILE_RADIUS: 4,
    PLACEMENT_PADDING: 8,
    MAP_HINT_FONT_SIZE: 14,
    WAVE_HEALTH_GROWTH: 1.12,
    STORAGE_KEYS: {
      BEST_SCORE: 'tower-defender.bestScore',
      BEST_WAVE: 'tower-defender.bestWave'
    },
    PATH_POINTS: [
      { x: -45, y: 292 },
      { x: 150, y: 292 },
      { x: 150, y: 116 },
      { x: 410, y: 116 },
      { x: 410, y: 412 },
      { x: 685, y: 412 },
      { x: 685, y: 184 },
      { x: 950, y: 184 },
      { x: 950, y: 330 },
      { x: 1245, y: 330 }
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
