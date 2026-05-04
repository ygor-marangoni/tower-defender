(function effectsModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};

  const DEATH_EFFECTS = {
    energyBurst: { duration: 420, particles: 9, spread: 1.2, radiusScale: 2.15 },
    disintegrate: { duration: 360, particles: 10, spread: 1.65, radiusScale: 1.75 },
    heavyExplosion: { duration: 640, particles: 14, spread: 1.45, radiusScale: 2.45 },
    dustPop: { duration: 430, particles: 8, spread: 1.15, radiusScale: 1.85 },
    rollDust: { duration: 380, particles: 9, spread: 1.35, radiusScale: 1.7 },
    heavyDust: { duration: 680, particles: 13, spread: 1.55, radiusScale: 2.35 }
  };

  function getEnemyInfo(enemy, theme) {
    if (!theme || !theme.id || typeof TD.getThemeEnemyInfo !== 'function') {
      return {};
    }

    return TD.getThemeEnemyInfo(theme.id, enemy.type) || {};
  }

  function createParticle(angle, distance, size, alpha, drift = 1) {
    return {
      x: Math.cos(angle) * distance * drift,
      y: Math.sin(angle) * distance,
      size,
      alpha
    };
  }

  function createEnemyDeathEffect(enemy, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
    const enemyInfo = getEnemyInfo(enemy, theme);
    const deathEffect = enemyInfo.deathEffect || (theme.id === 'medieval' ? 'dustPop' : 'energyBurst');
    const config = DEATH_EFFECTS[deathEffect] || DEATH_EFFECTS.energyBurst;
    const radius = enemy.radius || 14;
    const baseAngle = enemy.angle || 0;
    const particles = Array.from({ length: config.particles }, (_, index) => {
      const step = (Math.PI * 2 * index) / config.particles;
      const directionalBias = deathEffect === 'disintegrate' || deathEffect === 'rollDust'
        ? baseAngle + Math.PI + TD.Utils.randomBetween(-0.42, 0.42)
        : step;
      const angle = directionalBias + TD.Utils.randomBetween(-0.22, 0.22);
      const distance = TD.Utils.randomBetween(radius * 0.55, radius * config.radiusScale);
      const size = TD.Utils.randomBetween(1.4, deathEffect.includes('heavy') ? 4.6 : 3.2);
      const alpha = TD.Utils.randomBetween(0.35, 0.9);

      return createParticle(angle, distance, size, alpha, config.spread);
    });

    return {
      type: 'enemyDeath',
      themeId: theme.id,
      enemyType: enemy.type,
      renderer: enemyInfo.renderer,
      deathEffect,
      x: enemy.x,
      y: enemy.y,
      radius,
      angle: baseAngle,
      color: enemyInfo.color || enemy.color,
      accent: enemyInfo.accent || enemy.accent,
      particles,
      age: 0,
      duration: config.duration,
      animationOffset: enemy.animationOffset || 0,
      behindActors: false
    };
  }

  function createImpactEffect(x, y, color, radius, behindActors = false, options = {}) {
    const isMedieval = options.themeId === 'medieval';
    const particleCount = isMedieval ? 8 : 10;
    const particles = Array.from({ length: particleCount }, (_, index) => {
      const angle = (Math.PI * 2 * index) / particleCount + TD.Utils.randomBetween(-0.24, 0.24);
      const distance = TD.Utils.randomBetween(
        radius * (isMedieval ? 0.35 : 0.5),
        radius * (isMedieval ? 0.95 : 1.25)
      );

      return createParticle(
        angle,
        distance,
        TD.Utils.randomBetween(isMedieval ? 1.2 : 1.5, isMedieval ? 3.2 : 3.8),
        TD.Utils.randomBetween(isMedieval ? 0.28 : 0.35, isMedieval ? 0.75 : 0.9),
        isMedieval ? TD.Utils.randomBetween(0.68, 1.08) : 1
      );
    });

    return {
      type: 'impact',
      themeId: options.themeId || TD.DEFAULT_THEME_ID,
      impactStyle: isMedieval ? 'medievalDust' : 'default',
      x,
      y,
      color,
      radius,
      particles,
      age: 0,
      duration: 520,
      behindActors
    };
  }

  function createTowerSellEffect(tower, theme = TD.getThemeById(TD.DEFAULT_THEME_ID), refund = 0) {
    const radius = tower?.radius || TD.CONFIG.TOWER_RADIUS || 18;
    const effectTheme = theme || TD.getThemeById(TD.DEFAULT_THEME_ID);
    const sellEffect = effectTheme.sellEffect || {};
    const particleCount = sellEffect.style === 'dust' ? 9 : 10;
    const particles = Array.from({ length: particleCount }, (_, index) => {
      const angle = (Math.PI * 2 * index) / particleCount + TD.Utils.randomBetween(-0.22, 0.22);
      const distance = TD.Utils.randomBetween(radius * 0.35, radius * 1.2);
      const drift = sellEffect.style === 'dust'
        ? TD.Utils.randomBetween(0.65, 1.05)
        : TD.Utils.randomBetween(0.9, 1.2);

      return createParticle(
        angle,
        distance,
        TD.Utils.randomBetween(sellEffect.style === 'dust' ? 1.8 : 1.6, sellEffect.style === 'dust' ? 4.2 : 3.6),
        TD.Utils.randomBetween(0.35, 0.9),
        drift
      );
    });

    return {
      type: 'towerSell',
      themeId: effectTheme.id,
      sellStyle: sellEffect.style || 'digital',
      x: tower?.x || 0,
      y: tower?.y || 0,
      radius,
      refund: Math.max(0, Math.floor(refund)),
      label: `+${Math.max(0, Math.floor(refund))}`,
      color: sellEffect.color || effectTheme.palette?.primary || '#38BDF8',
      accent: sellEffect.accent || effectTheme.palette?.success || '#34D399',
      textColor: sellEffect.textColor || '#E6EDF3',
      particles,
      age: 0,
      duration: sellEffect.style === 'dust' ? 620 : 520,
      behindActors: false
    };
  }

  function isEffectExpired(effect) {
    return effect.age >= effect.duration;
  }

  function updateEffects(effects, deltaMs) {
    effects.forEach((effect) => {
      effect.age += deltaMs;
    });

    return effects.filter((effect) => !isEffectExpired(effect));
  }

  TD.Effects = {
    createEnemyDeathEffect,
    createImpactEffect,
    createTowerSellEffect,
    updateEffects,
    isEffectExpired
  };
})(globalThis);
