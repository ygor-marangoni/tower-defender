(function projectileTests(global) {
  const TD = global.TowerDefender;

  describe('Projectile', () => {
    test('projétil deve mover em direção ao alvo', () => {
      const enemy = new TD.Enemy({ type: 'common' });
      enemy.x = 200;
      enemy.y = 100;
      const projectile = new TD.Projectile({ x: 100, y: 100, target: enemy, damage: 10, speed: 4 });

      projectile.update(16);

      expect(projectile.x).toBeGreaterThan(100);
      expect(projectile.y).toBe(100);
    });

    test('projétil deve causar dano ao colidir', () => {
      const enemy = new TD.Enemy({ type: 'common' });
      enemy.x = 105;
      enemy.y = 100;
      const projectile = new TD.Projectile({ x: 100, y: 100, target: enemy, damage: 20, speed: 8 });

      projectile.update(16);

      expect(enemy.health).toBe(40);
    });

    test('projétil deve ser removido após impacto', () => {
      const enemy = new TD.Enemy({ type: 'common' });
      enemy.x = 105;
      enemy.y = 100;
      const projectile = new TD.Projectile({ x: 100, y: 100, target: enemy, damage: 20, speed: 8 });

      projectile.update(16);

      expect(projectile.active).toBeFalsy();
      expect(projectile.hasHit).toBeTruthy();
    });
  });
})(globalThis);
