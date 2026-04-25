(function collisionTests(global) {
  const TD = global.TowerDefender;

  describe('Collision', () => {
    test('detectar distância entre dois pontos corretamente', () => {
      const distance = TD.Collision.distanceBetweenPoints({ x: 0, y: 0 }, { x: 3, y: 4 });

      expect(distance).toBe(5);
    });

    test('detectar colisão entre projétil e inimigo', () => {
      const enemy = new TD.Enemy({ type: 'common' });
      enemy.x = 100;
      enemy.y = 100;
      const projectile = new TD.Projectile({ x: 105, y: 100, target: enemy, damage: 10 });

      expect(TD.Collision.isProjectileCollidingWithEnemy(projectile, enemy)).toBeTruthy();
    });

    test('impedir posicionamento de torre no caminho futurista', () => {
      const pathPoints = TD.getThemePath('futuristic');
      const pointOnPath = pathPoints[1];
      const result = TD.Collision.canPlaceTower({
        x: pointOnPath.x,
        y: pointOnPath.y,
        towers: [],
        pathPoints
      });

      expect(result.valid).toBeFalsy();
      expect(result.reason).toBe('path');
    });

    test('impedir posicionamento de torre no caminho medieval', () => {
      const pathPoints = TD.getThemePath('medieval');
      const pointOnPath = pathPoints[1];
      const result = TD.Collision.canPlaceTower({
        x: pointOnPath.x,
        y: pointOnPath.y,
        towers: [],
        pathPoints
      });

      expect(result.valid).toBeFalsy();
      expect(result.reason).toBe('path');
    });

    test('permitir posicionamento fora do caminho do tema atual', () => {
      const result = TD.Collision.canPlaceTower({
        x: 880,
        y: 80,
        towers: [],
        pathPoints: TD.getThemePath('medieval')
      });

      expect(result.valid).toBeTruthy();
    });

    test('impedir posicionamento sobre outra torre', () => {
      const tower = new TD.Tower({ type: 'basic', x: 220, y: 500 });
      const result = TD.Collision.canPlaceTower({
        x: 225,
        y: 500,
        towers: [tower],
        pathPoints: TD.getThemePath('medieval')
      });

      expect(result.valid).toBeFalsy();
      expect(result.reason).toBe('tower');
    });

    test('distância entre ponto e segmento deve continuar funcionando', () => {
      const distance = TD.Path.distanceToSegment(
        { x: 5, y: 5 },
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      );

      expect(distance).toBe(5);
    });
  });
})(globalThis);
