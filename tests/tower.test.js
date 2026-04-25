(function towerTests(global) {
  const TD = global.TowerDefender;

  describe('Tower', () => {
    test('torre deve iniciar com dano, alcance e custo corretos', () => {
      const tower = new TD.Tower({ type: 'basic', x: 120, y: 120 });

      expect(tower.damage).toBe(20);
      expect(tower.range).toBe(110);
      expect(tower.cost).toBe(50);
    });

    test('torre deve identificar inimigo dentro do alcance', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const enemy = new TD.Enemy({ type: 'common' });
      enemy.x = 150;
      enemy.y = 100;

      expect(tower.findTarget([enemy])).toBe(enemy);
    });

    test('torre não deve identificar inimigo fora do alcance', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const enemy = new TD.Enemy({ type: 'common' });
      enemy.x = 400;
      enemy.y = 100;

      expect(tower.findTarget([enemy])).toBe(null);
    });

    test('torre deve respeitar cooldown', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });

      expect(tower.canFire(0)).toBeTruthy();
      tower.lastShotAt = 0;
      expect(tower.canFire(300)).toBeFalsy();
      expect(tower.canFire(800)).toBeTruthy();
    });

    test('torre deve criar projétil ao atirar', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const enemy = new TD.Enemy({ type: 'common' });
      enemy.x = 150;
      enemy.y = 100;

      const projectile = tower.shoot(enemy, 0);

      expect(projectile instanceof TD.Projectile).toBeTruthy();
      expect(projectile.damage).toBe(20);
    });
  });
})(globalThis);
