(function themeTests(global) {
  const TD = global.TowerDefender;

  describe('Theme', () => {
    test('deve existir tema futurista e medieval', () => {
      expect(Boolean(TD.THEMES.futuristic)).toBeTruthy();
      expect(Boolean(TD.THEMES.medieval)).toBeTruthy();
    });

    test('cada tema deve possuir estrutura visual e de gameplay', () => {
      Object.keys(TD.THEMES).forEach((themeId) => {
        const theme = TD.THEMES[themeId];

        expect(Boolean(theme.id)).toBeTruthy();
        expect(Boolean(theme.name)).toBeTruthy();
        expect(Boolean(theme.subtitle)).toBeTruthy();
        expect(Boolean(theme.palette)).toBeTruthy();
        expect(Boolean(theme.labels)).toBeTruthy();
        expect(Boolean(theme.towers)).toBeTruthy();
        expect(Boolean(theme.enemies)).toBeTruthy();
        expect(Array.isArray(theme.path)).toBeTruthy();
        expect(theme.path.length).toBeGreaterThan(2);
      });
    });

    test('o caminho futurista deve ser retornado corretamente', () => {
      expect(TD.getThemePath('futuristic')).toEqual(TD.THEMES.futuristic.path);
    });

    test('caminhos responsivos devem descer do topo ate a base no mobile', () => {
      Object.keys(TD.THEMES).forEach((themeId) => {
        const mobilePath = TD.getThemePath(themeId, 'mobile');
        const desktopPath = TD.getThemePath(themeId);
        const mobileLayout = TD.CONFIG.CANVAS_LAYOUTS.mobile;
        const start = mobilePath[0];
        const end = mobilePath[mobilePath.length - 1];

        expect(JSON.stringify(mobilePath) === JSON.stringify(desktopPath)).toBeFalsy();
        expect(start.y).toBeLessThan(0);
        expect(end.y).toBeGreaterThan(mobileLayout.height);
        expect(end.y).toBeGreaterThan(start.y);
        expect(end.x).toBe(mobileLayout.width / 2);
        mobilePath.slice(1, -1).forEach((point) => {
          expect(point.x).toBeGreaterThan(0);
          expect(point.x).toBeLessThan(mobileLayout.width);
        });
      });
    });

    test('perfil mobile deve aumentar area visual e de toque do tabuleiro', () => {
      const desktop = TD.CONFIG.CANVAS_LAYOUTS.desktop;
      const mobile = TD.CONFIG.CANVAS_LAYOUTS.mobile;

      expect(mobile.width / mobile.height).toBe(0.6);
      expect(mobile.towerRadius).toBeGreaterThan(desktop.towerRadius);
      expect(mobile.enemyRadiusScale).toBeGreaterThan(desktop.enemyRadiusScale);
      expect(mobile.towerHitSlop).toBeGreaterThan(desktop.towerHitSlop);
    });

    test('o caminho medieval deve ser diferente do futurista', () => {
      expect(TD.getThemePath('medieval')).toEqual(TD.THEMES.medieval.path);
      expect(JSON.stringify(TD.getThemePath('medieval')) === JSON.stringify(TD.getThemePath('futuristic'))).toBeFalsy();
    });

    test('getThemeById deve retornar temas conhecidos e fallback futurista', () => {
      expect(TD.getThemeById('futuristic').id).toBe('futuristic');
      expect(TD.getThemeById('medieval').id).toBe('medieval');
      expect(TD.getThemeById('invalid-theme').id).toBe(TD.DEFAULT_THEME_ID);
    });

    test('labels medievais devem diferir dos futuristas nos conceitos principais', () => {
      const futuristic = TD.getThemeLabels('futuristic');
      const medieval = TD.getThemeLabels('medieval');

      expect(medieval.money === futuristic.money).toBeFalsy();
      expect(medieval.base === futuristic.base).toBeFalsy();
      expect(medieval.wave === futuristic.wave).toBeFalsy();
    });

    test('labels futuristas devem manter coerência tecnológica', () => {
      const labels = TD.getThemeLabels('futuristic');

      expect(labels.base).toBe('Núcleo');
      expect(labels.money).toBe('Créditos');
      expect(labels.wave).toBe('Onda');
    });

    test('informacoes visuais de torres e inimigos devem usar tipos internos estaveis', () => {
      expect(TD.getThemeTowerInfo('futuristic', 'basic').name).toBe('Canhão de Pulso');
      expect(TD.getThemeTowerInfo('medieval', 'basic').name).toBe('Torre de Arqueiros');
      expect(TD.getThemeEnemyInfo('futuristic', 'common').name).toBe('Drone');
      expect(TD.getThemeEnemyInfo('medieval', 'common').name).toBe('Goblin');
    });
  });
})(globalThis);
