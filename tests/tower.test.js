(function towerTests(global) {
  const TD = global.TowerDefender;

  describe('Tower', () => {
    test('torre deve iniciar com dano, alcance e custo corretos', () => {
      const tower = new TD.Tower({ type: 'basic', x: 120, y: 120 });

      expect(tower.damage).toBe(20);
      expect(tower.range).toBe(110);
      expect(tower.cost).toBe(50);
      expect(tower.totalInvested).toBe(50);
    });

    test('torre basica deve calcular valor de venda como 35', () => {
      const tower = new TD.Tower({ type: 'basic', x: 120, y: 120 });

      expect(tower.getSellValue()).toBe(35);
    });

    test('torre rapida deve calcular valor de venda como 52', () => {
      const tower = new TD.Tower({ type: 'rapid', x: 120, y: 120 });

      expect(tower.getSellValue()).toBe(52);
    });

    test('torre pesada deve calcular valor de venda como 84', () => {
      const tower = new TD.Tower({ type: 'heavy', x: 120, y: 120 });

      expect(tower.getSellValue()).toBe(84);
    });

    test('torre deve respeitar totalInvested customizado ao vender', () => {
      const tower = new TD.Tower({ type: 'basic', x: 120, y: 120 });
      tower.totalInvested = 100;

      expect(tower.getSellValue()).toBe(70);
    });

    test('torre deve arredondar valor de venda para baixo', () => {
      const tower = new TD.Tower({ type: 'basic', x: 120, y: 120 });
      tower.totalInvested = 125;

      expect(tower.getSellValue()).toBe(87);
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

    test('torre nao deve mirar em inimigo morto e deve escolher outro alvo valido', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const deadEnemy = new TD.Enemy({ type: 'common' });
      const liveEnemy = new TD.Enemy({ type: 'fast' });

      deadEnemy.x = 140;
      deadEnemy.y = 100;
      deadEnemy.distanceTravelled = 200;
      deadEnemy.takeDamage(999);

      liveEnemy.x = 150;
      liveEnemy.y = 100;
      liveEnemy.distanceTravelled = 120;

      expect(tower.findTarget([deadEnemy, liveEnemy])).toBe(liveEnemy);
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

    test('torre nao deve criar projetil para alvo morto', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const enemy = new TD.Enemy({ type: 'common' });
      enemy.x = 150;
      enemy.y = 100;
      enemy.takeDamage(999);

      expect(tower.shoot(enemy, 0)).toBe(null);
    });

    test('upgrade bem-sucedido deve aumentar totalInvested e valor de venda', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const upgradeCost = tower.getUpgradeCost();

      tower.upgrade(upgradeCost);

      expect(tower.totalInvested).toBe(50 + upgradeCost);
      expect(tower.getSellValue()).toBe(Math.floor((50 + upgradeCost) * 0.7));
    });
  });
})(globalThis);
