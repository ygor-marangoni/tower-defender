(function enemyTests(global) {
  const TD = global.TowerDefender;

  describe('Enemy', () => {
    test('inimigo deve iniciar com vida correta', () => {
      const enemy = new TD.Enemy({ type: 'common' });

      expect(enemy.maxHealth).toBe(60);
      expect(enemy.health).toBe(60);
    });

    test('inimigo deve receber dano', () => {
      const enemy = new TD.Enemy({ type: 'common' });

      enemy.takeDamage(15);

      expect(enemy.health).toBe(45);
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
  });
})(globalThis);
