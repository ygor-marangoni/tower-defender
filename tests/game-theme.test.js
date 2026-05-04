(function gameThemeTests(global) {
  const TD = global.TowerDefender;

  describe('Game theme state', () => {
    test('estado inicial futurista deve usar tema futurista', () => {
      const state = TD.createInitialGameState('futuristic');

      expect(state.currentTheme.id).toBe('futuristic');
      expect(state.pathPoints).toEqual(TD.getThemePath('futuristic'));
    });

    test('estado inicial medieval deve usar tema medieval', () => {
      const state = TD.createInitialGameState('medieval');

      expect(state.currentTheme.id).toBe('medieval');
      expect(state.pathPoints).toEqual(TD.getThemePath('medieval'));
    });

    test('estado inicial mobile deve usar caminho vertical responsivo', () => {
      const state = TD.createInitialGameState('futuristic', 'mobile');
      const start = state.pathPoints[0];
      const end = state.pathPoints[state.pathPoints.length - 1];

      expect(state.pathPoints).toEqual(TD.getThemePath('futuristic', 'mobile'));
      expect(start.y).toBeLessThan(0);
      expect(end.y).toBeGreaterThan(TD.CONFIG.CANVAS_LAYOUTS.mobile.height);
    });

    test('estado inicial desktop deve continuar usando caminho horizontal padrao', () => {
      const state = TD.createInitialGameState('futuristic', 'desktop');
      const start = state.pathPoints[0];
      const end = state.pathPoints[state.pathPoints.length - 1];

      expect(state.pathPoints).toEqual(TD.getThemePath('futuristic'));
      expect(start.x).toBeLessThan(0);
      expect(end.x).toBeGreaterThan(TD.CONFIG.CANVAS_LAYOUTS.desktop.width);
    });

    test('trocar tema deve resetar recursos principais', () => {
      const state = TD.createInitialGameState('medieval');

      expect(state.lives).toBe(TD.CONFIG.INITIAL_LIVES);
      expect(state.money).toBe(TD.CONFIG.INITIAL_MONEY);
      expect(state.waveNumber).toBe(1);
      expect(state.score).toBe(0);
      expect(state.towers.length).toBe(0);
      expect(state.enemies.length).toBe(0);
      expect(state.projectiles.length).toBe(0);
    });

    test('labels do HUD devem vir do tema atual', () => {
      const state = TD.createInitialGameState('medieval');

      expect(state.labels.money).toBe('Ouro');
      expect(state.labels.wave).toBe('Cerco');
    });

    test('selecao visual de torres deve preservar tipos internos', () => {
      const state = TD.createInitialGameState('medieval');

      expect(Object.keys(state.towerInfo).join(',')).toBe('basic,rapid,heavy');
      expect(state.towerInfo.basic.name).toBe('Torre de Arqueiro');
    });

    test('estado inicial deve iniciar sem selecao de construcao ou de torre posicionada', () => {
      const state = TD.createInitialGameState('futuristic');

      expect(state.selectedTowerType).toBe(null);
      expect(state.selectedPlacedTower).toBe(null);
    });
  });
})(globalThis);
