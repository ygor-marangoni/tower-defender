(function storageTests(global) {
  const TD = global.TowerDefender;

  function clearStorage() {
    try {
      global.localStorage.clear();
    } catch (error) {
      // Browser storage may be unavailable in restricted contexts.
    }
  }

  describe('Storage por tema', () => {
    test('deve salvar e carregar recorde separado por tema', () => {
      clearStorage();

      TD.Storage.saveRecords({ themeId: 'futuristic', score: 120, wave: 3 });
      TD.Storage.saveRecords({ themeId: 'medieval', score: 240, wave: 5 });

      expect(TD.Storage.getBestScore('futuristic')).toBe(120);
      expect(TD.Storage.getBestScore('medieval')).toBe(240);
      expect(TD.Storage.getRecords('futuristic').bestScore).toBe(120);
      expect(TD.Storage.getRecords('medieval').bestScore).toBe(240);
    });

    test('recorde medieval não deve sobrescrever futurista e vice-versa', () => {
      clearStorage();

      TD.Storage.saveRecords({ themeId: 'futuristic', score: 300, wave: 4 });
      TD.Storage.saveRecords({ themeId: 'medieval', score: 90, wave: 2 });
      TD.Storage.saveRecords({ themeId: 'futuristic', score: 220, wave: 3 });

      expect(TD.Storage.getBestScore('futuristic')).toBe(300);
      expect(TD.Storage.getBestScore('medieval')).toBe(90);
    });

    test('deve salvar e carregar maior onda separada por tema', () => {
      clearStorage();

      TD.Storage.setBestWave('futuristic', 7);
      TD.Storage.setBestWave('medieval', 4);

      expect(TD.Storage.getBestWave('futuristic')).toBe(7);
      expect(TD.Storage.getBestWave('medieval')).toBe(4);
    });

    test('deve salvar e carregar último tema selecionado', () => {
      clearStorage();

      TD.Storage.setLastTheme('medieval');
      expect(TD.Storage.getLastTheme()).toBe('medieval');
    });

    test('último tema deve usar futurista como padrão e fallback', () => {
      clearStorage();

      expect(TD.Storage.getLastTheme()).toBe('futuristic');
      TD.Storage.setLastTheme('unknown');
      expect(TD.Storage.getLastTheme()).toBe('futuristic');
    });

    test('deve salvar e carregar partida ativa', () => {
      clearStorage();

      const saved = TD.Storage.saveActiveGame({
        appMode: 'playing',
        themeId: 'medieval',
        lives: 12,
        waveNumber: 4,
        towers: [{ type: 'basic', x: 120, y: 160 }]
      });
      const snapshot = TD.Storage.getActiveGame();

      expect(saved).toBeTruthy();
      expect(snapshot.themeId).toBe('medieval');
      expect(snapshot.lives).toBe(12);
      expect(snapshot.waveNumber).toBe(4);
      expect(snapshot.towers.length).toBe(1);
    });

    test('deve limpar partida ativa', () => {
      clearStorage();

      TD.Storage.saveActiveGame({
        appMode: 'playing',
        themeId: 'futuristic'
      });
      TD.Storage.clearActiveGame();

      expect(TD.Storage.getActiveGame()).toBe(null);
    });
  });
})(globalThis);
