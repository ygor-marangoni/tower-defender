(function upgradeTests(global) {
  const TD = global.TowerDefender;

  function createState(overrides = {}) {
    return {
      upgrades: TD.createUpgradeState(),
      economy: new TD.Economy(),
      lives: 20,
      ...overrides
    };
  }

  describe('Upgrades de cartas', () => {
    test('sharpenedProjectiles deve aumentar dano global', () => {
      const state = createState();

      TD.applyCardUpgrade(state, 'sharpenedProjectiles');

      expect(Math.round(state.upgrades.modifiers.globalDamageMultiplier * 100)).toBe(110);
    });

    test('expandedRange deve aumentar alcance global', () => {
      const state = createState();

      TD.applyCardUpgrade(state, 'expandedRange');

      expect(Math.round(state.upgrades.modifiers.globalRangeMultiplier * 100)).toBe(108);
    });

    test('fasterReload deve reduzir cooldown global', () => {
      const state = createState();

      TD.applyCardUpgrade(state, 'fasterReload');

      expect(Math.round(state.upgrades.modifiers.globalCooldownMultiplier * 100)).toBe(92);
    });

    test('bountyHunter deve aumentar recompensa', () => {
      const state = createState();

      TD.applyCardUpgrade(state, 'bountyHunter');

      expect(Math.round(state.upgrades.modifiers.rewardMultiplier * 100)).toBe(115);
    });

    test('emergencyFunds deve adicionar dinheiro imediato', () => {
      const state = createState();

      TD.applyCardUpgrade(state, 'emergencyFunds');

      expect(state.economy.money).toBe(230);
    });

    test('reinforcedBase deve adicionar vida', () => {
      const state = createState();

      TD.applyCardUpgrade(state, 'reinforcedBase');

      expect(state.lives).toBe(23);
    });

    test('efficientConstruction deve reduzir custo de novas torres', () => {
      const state = createState();

      TD.applyCardUpgrade(state, 'efficientConstruction');

      expect(TD.getEffectiveTowerCost('basic', state.upgrades)).toBe(45);
    });

    test('merchantContract deve aumentar reembolso de venda', () => {
      const state = createState();

      TD.applyCardUpgrade(state, 'merchantContract');

      expect(Math.round(TD.getEffectiveSellRatio(state.upgrades) * 100)).toBe(85);
    });

    test('archerTraining deve aumentar dano da torre basic', () => {
      const state = createState();
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });

      TD.applyCardUpgrade(state, 'archerTraining');

      expect(TD.getEffectiveTowerDamage(tower, state.upgrades)).toBe(23);
    });

    test('rapidMechanism deve reduzir cooldown da torre rapid', () => {
      const state = createState();
      const tower = new TD.Tower({ type: 'rapid', x: 100, y: 100 });

      TD.applyCardUpgrade(state, 'rapidMechanism');

      expect(TD.getEffectiveTowerCooldown(tower, state.upgrades)).toBe(255);
    });

    test('siegeMastery deve aumentar dano da torre heavy', () => {
      const state = createState();
      const tower = new TD.Tower({ type: 'heavy', x: 100, y: 100 });

      TD.applyCardUpgrade(state, 'siegeMastery');

      expect(TD.getEffectiveTowerDamage(tower, state.upgrades)).toBe(54);
    });

    test('perfectDefense deve registrar bonus de onda perfeita', () => {
      const state = createState();

      TD.applyCardUpgrade(state, 'perfectDefense');

      expect(state.upgrades.modifiers.perfectWaveBonus).toBe(40);
    });

    test('calculos efetivos devem considerar modificadores globais', () => {
      const state = createState();
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const enemy = new TD.Enemy({ type: 'common' });

      TD.applyCardUpgrade(state, 'sharpenedProjectiles');
      TD.applyCardUpgrade(state, 'expandedRange');
      TD.applyCardUpgrade(state, 'fasterReload');
      TD.applyCardUpgrade(state, 'bountyHunter');

      expect(TD.getEffectiveTowerDamage(tower, state.upgrades)).toBe(22);
      expect(TD.getEffectiveTowerRange(tower, state.upgrades)).toBe(119);
      expect(TD.getEffectiveTowerCooldown(tower, state.upgrades)).toBe(644);
      expect(TD.getEffectiveEnemyReward(enemy, state.upgrades)).toBe(11);
    });
  });
})(globalThis);
