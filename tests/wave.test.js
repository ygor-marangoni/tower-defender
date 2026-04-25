(function waveTests(global) {
  const TD = global.TowerDefender;

  describe('Wave', () => {
    test('onda 1 deve criar quantidade correta de inimigos', () => {
      const wave = new TD.Wave({ number: 1 });

      expect(wave.totalEnemies).toBe(6);
      expect(wave.enemyPlan.filter((type) => type === 'common').length).toBe(6);
    });

    test('ondas maiores devem aumentar dificuldade', () => {
      const waveOne = new TD.Wave({ number: 1 });
      const waveFive = new TD.Wave({ number: 5 });
      const enemyOne = waveOne.createEnemy('common');
      const enemyFive = waveFive.createEnemy('common');

      expect(waveFive.totalEnemies).toBeGreaterThan(waveOne.totalEnemies);
      expect(enemyFive.maxHealth).toBeGreaterThan(enemyOne.maxHealth);
    });

    test('onda deve terminar quando todos inimigos forem derrotados ou chegarem ao fim', () => {
      const wave = new TD.Wave({ number: 1 });
      wave.start();
      wave.spawnedCount = wave.totalEnemies;

      expect(wave.isFinished([])).toBeTruthy();
    });
  });
})(globalThis);
