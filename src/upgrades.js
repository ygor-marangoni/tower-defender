(function upgradesModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG, TOWER_TYPES } = TD;

  function createUpgradeModifiers(overrides = {}) {
    return {
      globalDamageMultiplier: 1,
      globalRangeMultiplier: 1,
      globalCooldownMultiplier: 1,
      rewardMultiplier: 1,
      towerCostMultiplier: 1,
      sellRefundRatioBonus: 0,
      sellRefundRatio: null,
      basicDamageMultiplier: 1,
      rapidCooldownMultiplier: 1,
      heavyDamageMultiplier: 1,
      lowLifeDamageMultiplier: 1,
      baseRepairEveryThreeWaves: 0,
      perfectWaveBonus: 0,
      rangeClarityBonus: 0,
      ...overrides
    };
  }

  function createUpgradeState(overrides = {}) {
    return {
      modifiers: createUpgradeModifiers(overrides.modifiers || {}),
      chosenCards: Array.isArray(overrides.chosenCards) ? [...overrides.chosenCards] : []
    };
  }

  function ensureUpgradeState(state) {
    if (!state.upgrades) {
      state.upgrades = createUpgradeState();
      return state.upgrades;
    }

    state.upgrades = createUpgradeState(state.upgrades);
    return state.upgrades;
  }

  function getModifiers(upgrades) {
    return createUpgradeModifiers(upgrades?.modifiers || {});
  }

  function applyOneEffect(state, effect, changes) {
    const upgrades = ensureUpgradeState(state);
    const modifiers = upgrades.modifiers;

    if (!effect || typeof effect !== 'object') {
      return;
    }

    if (effect.type === 'multiplyModifier') {
      if (effect.key === 'placedTowerDamageMultiplier') {
        (state.towers || []).forEach((tower) => {
          tower.cardDamageMultiplier = (tower.cardDamageMultiplier || 1) * effect.value;
        });
      } else {
        modifiers[effect.key] = (Number.isFinite(modifiers[effect.key]) ? modifiers[effect.key] : 1) * effect.value;
      }

      changes.push({ type: effect.type, key: effect.key, value: effect.value });
      return;
    }

    if (effect.type === 'addModifier') {
      modifiers[effect.key] = (Number.isFinite(modifiers[effect.key]) ? modifiers[effect.key] : 0) + effect.value;
      changes.push({ type: effect.type, key: effect.key, value: effect.value });
      return;
    }

    if (effect.type === 'setSellRatio') {
      modifiers.sellRefundRatio = Math.max(modifiers.sellRefundRatio || 0, effect.value);
      changes.push({ type: effect.type, key: 'sellRefundRatio', value: modifiers.sellRefundRatio });
      return;
    }

    if (effect.type === 'addMoney') {
      if (state.economy && typeof state.economy.addMoney === 'function') {
        state.economy.addMoney(effect.value);
      } else {
        state.money = (Number.isFinite(state.money) ? state.money : 0) + effect.value;
      }

      changes.push({ type: effect.type, value: effect.value });
      return;
    }

    if (effect.type === 'addLife') {
      state.lives = (Number.isFinite(state.lives) ? state.lives : 0) + effect.value;
      changes.push({ type: effect.type, value: effect.value });
    }
  }

  function applyCardUpgrade(state, cardId) {
    const card = TD.getCardById ? TD.getCardById(cardId) : null;

    if (!card || !state || typeof state !== 'object') {
      return {
        applied: false,
        cardId,
        changes: []
      };
    }

    const upgrades = ensureUpgradeState(state);
    const changes = [];
    const effects = Array.isArray(card.effect) ? card.effect : [card.effect];

    effects.forEach((effect) => applyOneEffect(state, effect, changes));
    upgrades.chosenCards.push(card.id);

    return {
      applied: true,
      cardId: card.id,
      changes
    };
  }

  function getEffectiveTowerDamage(tower, upgrades, context = {}) {
    const modifiers = getModifiers(upgrades);
    let damage = Number.isFinite(tower?.damage) ? tower.damage : 0;

    damage *= modifiers.globalDamageMultiplier;

    if (tower?.type === 'basic') {
      damage *= modifiers.basicDamageMultiplier;
    }

    if (tower?.type === 'heavy') {
      damage *= modifiers.heavyDamageMultiplier;
    }

    if ((context.lives ?? Number.POSITIVE_INFINITY) <= 5) {
      damage *= modifiers.lowLifeDamageMultiplier;
    }

    damage *= Number.isFinite(tower?.cardDamageMultiplier) ? tower.cardDamageMultiplier : 1;

    return Math.max(1, Math.round(damage));
  }

  function getEffectiveTowerRange(tower, upgrades) {
    const modifiers = getModifiers(upgrades);
    const range = Number.isFinite(tower?.range) ? tower.range : 0;

    return Math.max(1, Math.round(range * modifiers.globalRangeMultiplier));
  }

  function getEffectiveTowerCooldown(tower, upgrades) {
    const modifiers = getModifiers(upgrades);
    let cooldown = Number.isFinite(tower?.cooldown) ? tower.cooldown : 0;

    cooldown *= modifiers.globalCooldownMultiplier;

    if (tower?.type === 'rapid') {
      cooldown *= modifiers.rapidCooldownMultiplier;
    }

    return Math.max(100, Math.round(cooldown));
  }

  function getEffectiveEnemyReward(enemy, upgrades) {
    const modifiers = getModifiers(upgrades);
    const reward = Number.isFinite(enemy?.reward) ? enemy.reward : 0;

    return Math.max(0, Math.floor(reward * modifiers.rewardMultiplier));
  }

  function getEffectiveTowerCost(type, upgrades) {
    const towerType = TOWER_TYPES[type];

    if (!towerType) {
      return 0;
    }

    const modifiers = getModifiers(upgrades);
    return Math.max(1, Math.floor(towerType.cost * modifiers.towerCostMultiplier));
  }

  function getEffectiveSellRatio(upgrades) {
    const modifiers = getModifiers(upgrades);
    const baseRatio = CONFIG.TOWER_SELL_RATIO || 0.7;
    const ratio = Number.isFinite(modifiers.sellRefundRatio)
      ? modifiers.sellRefundRatio
      : baseRatio + (modifiers.sellRefundRatioBonus || 0);

    return Math.max(0, Math.min(0.95, ratio));
  }

  function getEffectiveTowerSellValue(tower, upgrades) {
    const totalInvested = Number.isFinite(tower?.totalInvested) ? tower.totalInvested : (tower?.cost || 0);

    return Math.max(0, Math.floor(totalInvested * getEffectiveSellRatio(upgrades)));
  }

  TD.createUpgradeState = createUpgradeState;
  TD.createUpgradeModifiers = createUpgradeModifiers;
  TD.applyCardUpgrade = applyCardUpgrade;
  TD.getEffectiveTowerDamage = getEffectiveTowerDamage;
  TD.getEffectiveTowerRange = getEffectiveTowerRange;
  TD.getEffectiveTowerCooldown = getEffectiveTowerCooldown;
  TD.getEffectiveEnemyReward = getEffectiveEnemyReward;
  TD.getEffectiveTowerCost = getEffectiveTowerCost;
  TD.getEffectiveSellRatio = getEffectiveSellRatio;
  TD.getEffectiveTowerSellValue = getEffectiveTowerSellValue;
})(globalThis);
