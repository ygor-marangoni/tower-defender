(function enemyTests(global) {
  const TD = global.TowerDefender;

  describe('Enemy', () => {
    test('inimigo deve iniciar com vida correta', () => {
      const enemy = new TD.Enemy({ type: 'common' });

      expect(enemy.maxHealth).toBe(60);
      expect(enemy.health).toBe(60);
    });

    test('inimigo deve iniciar com estado visual de animacao', () => {
      const enemy = new TD.Enemy({ type: 'common' });

      expect(typeof enemy.animationOffset).toBe('number');
      expect(enemy.animationOffset).toBeGreaterThan(-1);
      expect(enemy.animationOffset).toBeLessThan(Math.PI * 2 + 0.001);
      expect(enemy.hitTimer).toBe(0);
    });

    test('inimigo deve receber dano', () => {
      const enemy = new TD.Enemy({ type: 'common' });

      enemy.takeDamage(15);

      expect(enemy.health).toBe(45);
    });

    test('inimigo deve ativar flash de dano ao receber impacto', () => {
      const enemy = new TD.Enemy({ type: 'common' });

      enemy.takeDamage(15);

      expect(enemy.hitTimer).toBeGreaterThan(0);
    });

    test('flash de dano deve diminuir durante o update', () => {
      const enemy = new TD.Enemy({ type: 'common' });

      enemy.takeDamage(15);
      const initialHitTimer = enemy.hitTimer;

      enemy.update(60);

      expect(enemy.hitTimer).toBeLessThan(initialHitTimer);

      enemy.update(initialHitTimer + 80);

      expect(enemy.hitTimer).toBe(0);
    });

    test('barra de vida deve seguir escala verde amarela e vermelha', () => {
      expect(TD.EnemyRenderer.getEnemyHealthColor(1)).toBe('#22C55E');
      expect(TD.EnemyRenderer.getEnemyHealthColor(0.81)).toBe('#22C55E');
      expect(TD.EnemyRenderer.getEnemyHealthColor(0.8)).toBe('#FACC15');
      expect(TD.EnemyRenderer.getEnemyHealthColor(0.41)).toBe('#FACC15');
      expect(TD.EnemyRenderer.getEnemyHealthColor(0.4)).toBe('#EF4444');
    });

    test('inimigo deve morrer quando vida <= 0', () => {
      const enemy = new TD.Enemy({ type: 'fast' });

      enemy.takeDamage(999);

      expect(enemy.isDead()).toBeTruthy();
      expect(enemy.health).toBe(0);
    });

    test('inimigo deve avançar no caminho', () => {
      const enemy = new TD.Enemy({ type: 'common' });
      const initialX = enemy.x;

      enemy.update(1000);

      expect(enemy.x).toBeGreaterThan(initialX);
      expect(enemy.distanceTravelled).toBeGreaterThan(0);
    });

    test('inimigo deve indicar quando chegou ao final', () => {
      const enemy = new TD.Enemy({ type: 'fast' });

      enemy.distanceTravelled = TD.Path.getTotalLength();
      enemy.update(16);

      expect(enemy.hasReachedEnd()).toBeTruthy();
    });

    test('inimigo deve considerar recuo do castelo como fim logico do caminho', () => {
      const pathPoints = TD.getThemePath('medieval');
      const endPadding = TD.getThemeBaseHitInset('medieval', 'desktop');
      const enemy = new TD.Enemy({
        type: 'common',
        pathPoints,
        endPadding
      });

      enemy.distanceTravelled = TD.Path.getTotalLength(pathPoints) - endPadding;
      enemy.update(16);

      expect(enemy.hasReachedEnd()).toBeTruthy();
    });
  });
})(globalThis);
