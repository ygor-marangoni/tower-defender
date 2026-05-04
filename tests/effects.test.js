(function effectsTests(global) {
  const TD = global.TowerDefender;

  describe('Enemy death effects', () => {
    test('deve criar efeito de morte futurista comum como energyBurst', () => {
      const enemy = new TD.Enemy({ type: 'common' });
      enemy.x = 120;
      enemy.y = 80;

      const effect = TD.Effects.createEnemyDeathEffect(enemy, TD.getThemeById('futuristic'));

      expect(effect.type).toBe('enemyDeath');
      expect(effect.themeId).toBe('futuristic');
      expect(effect.enemyType).toBe('common');
      expect(effect.deathEffect).toBe('energyBurst');
      expect(effect.x).toBe(120);
      expect(effect.y).toBe(80);
      expect(effect.particles.length).toBeGreaterThan(5);
    });

    test('deve criar efeito de morte medieval comum como dustPop', () => {
      const enemy = new TD.Enemy({ type: 'common' });

      const effect = TD.Effects.createEnemyDeathEffect(enemy, TD.getThemeById('medieval'));

      expect(effect.themeId).toBe('medieval');
      expect(effect.enemyType).toBe('common');
      expect(effect.deathEffect).toBe('dustPop');
    });

    test('efeito ativo deve ser mantido ao atualizar por pouco tempo', () => {
      const enemy = new TD.Enemy({ type: 'fast' });
      const effect = TD.Effects.createEnemyDeathEffect(enemy, TD.getThemeById('futuristic'));

      const activeEffects = TD.Effects.updateEffects([effect], 120);

      expect(activeEffects.length).toBe(1);
      expect(activeEffects[0].age).toBe(120);
      expect(TD.Effects.isEffectExpired(activeEffects[0])).toBeFalsy();
    });

    test('efeito expirado deve ser removido', () => {
      const enemy = new TD.Enemy({ type: 'tank' });
      const effect = TD.Effects.createEnemyDeathEffect(enemy, TD.getThemeById('medieval'));

      const activeEffects = TD.Effects.updateEffects([effect], effect.duration + 1);

      expect(activeEffects.length).toBe(0);
    });

    test('impacto medieval deve usar estilo de poeira tematico', () => {
      const effect = TD.Effects.createImpactEffect(100, 120, '#E8D7A8', 24, false, {
        themeId: 'medieval'
      });

      expect(effect.type).toBe('impact');
      expect(effect.themeId).toBe('medieval');
      expect(effect.impactStyle).toBe('medievalDust');
      expect(effect.particles.length).toBe(8);
    });

    test('venda de torre futurista deve criar efeito tematico com refund', () => {
      const tower = new TD.Tower({ type: 'basic', x: 120, y: 180 });
      const effect = TD.Effects.createTowerSellEffect(tower, TD.getThemeById('futuristic'), 35);

      expect(effect.type).toBe('towerSell');
      expect(effect.themeId).toBe('futuristic');
      expect(effect.sellStyle).toBe('digital');
      expect(effect.refund).toBe(35);
      expect(effect.label).toBe('+35');
    });

    test('venda de torre medieval deve criar efeito tematico com refund', () => {
      const tower = new TD.Tower({ type: 'basic', x: 120, y: 180 });
      const effect = TD.Effects.createTowerSellEffect(tower, TD.getThemeById('medieval'), 35);

      expect(effect.type).toBe('towerSell');
      expect(effect.themeId).toBe('medieval');
      expect(effect.sellStyle).toBe('dust');
      expect(effect.refund).toBe(35);
      expect(effect.label).toBe('+35');
    });
  });
})(globalThis);
