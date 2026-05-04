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
        expect(end.x).toBeGreaterThan(0);
        expect(end.x).toBeLessThan(mobileLayout.width);
        mobilePath.slice(1, -1).forEach((point) => {
          expect(point.x).toBeGreaterThan(0);
          expect(point.x).toBeLessThan(mobileLayout.width);
        });
      });
    });

    test('perfil mobile deve aumentar area visual e de toque do tabuleiro', () => {
      const desktop = TD.CONFIG.CANVAS_LAYOUTS.desktop;
      const mobile = TD.CONFIG.CANVAS_LAYOUTS.mobile;

      expect(mobile.width / mobile.height).toBeGreaterThan(0.8);
      expect(mobile.width / mobile.height).toBeLessThan(0.9);
      expect(mobile.towerRadius).toBeGreaterThan(desktop.towerRadius);
      expect(mobile.enemyRadiusScale).toBeGreaterThan(desktop.enemyRadiusScale);
      expect(mobile.towerHitSlop).toBeGreaterThan(desktop.towerHitSlop);
    });

    test('o caminho medieval deve ser diferente do futurista', () => {
      expect(TD.getThemePath('medieval')).toEqual(TD.THEMES.medieval.path);
      expect(JSON.stringify(TD.getThemePath('medieval')) === JSON.stringify(TD.getThemePath('futuristic'))).toBeFalsy();
    });

    test('temas devem expor zona de impacto da base por layout quando necessario', () => {
      expect(TD.getThemeBaseHitInset('futuristic', 'desktop')).toBeGreaterThan(0);
      expect(TD.getThemeBaseHitInset('futuristic', 'mobile')).toBeGreaterThan(0);
      expect(TD.getThemeBaseHitInset('medieval', 'desktop')).toBeGreaterThan(0);
      expect(TD.getThemeBaseHitInset('medieval', 'mobile')).toBeGreaterThan(0);
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

    test('tema futurista deve expor labels de venda', () => {
      const labels = TD.getThemeLabels('futuristic');

      expect(labels.selectedPlacedTower).toBe('Torre selecionada');
      expect(labels.sellAction).toBe('Vender torre');
      expect(labels.sellValue).toBe('Venda');
      expect(labels.refundCurrency).toBe('creditos');
    });

    test('tema medieval deve expor labels de venda', () => {
      const labels = TD.getThemeLabels('medieval');

      expect(labels.selectedPlacedTower).toBe('Defesa selecionada');
      expect(labels.sellAction).toBe('Vender defesa');
      expect(labels.sellValue).toBe('Venda');
      expect(labels.refundCurrency).toBe('ouro');
    });

    test('informacoes visuais de torres e inimigos devem usar tipos internos estaveis', () => {
      expect(TD.getThemeTowerInfo('futuristic', 'basic').name).toBe('Canhão de Pulso');
      expect(TD.getThemeTowerInfo('medieval', 'basic').name).toBe('Torre de Arqueiro');
      expect(TD.getThemeEnemyInfo('futuristic', 'common').name).toBe('Drone Vigia');
      expect(TD.getThemeEnemyInfo('medieval', 'common').name).toBe('Goblin Saqueador');
    });

    test('tema futurista deve expor mobs visuais completos por tipo interno', () => {
      const enemies = TD.getThemeById('futuristic').enemies;

      expect(enemies.common.name).toBe('Drone Vigia');
      expect(enemies.common.renderer).toBe('droneVigia');
      expect(enemies.common.accent).toBe('#F97316');
      expect(enemies.common.glow).toBe('#FACC15');
      expect(enemies.common.deathEffect).toBe('energyBurst');
      expect(enemies.fast.name).toBe('Sonda Cortante');
      expect(enemies.fast.renderer).toBe('sondaCortante');
      expect(enemies.fast.accent).toBe('#EF4444');
      expect(enemies.fast.glow).toBe('#FB923C');
      expect(enemies.fast.deathEffect).toBe('disintegrate');
      expect(enemies.tank.name).toBe('Colosso Blindado');
      expect(enemies.tank.renderer).toBe('colossoBlindado');
      expect(enemies.tank.accent).toBe('#F59E0B');
      expect(enemies.tank.glow).toBe('#EF4444');
      expect(enemies.tank.deathEffect).toBe('heavyExplosion');
    });

    test('tema medieval deve expor mobs visuais completos por tipo interno', () => {
      const enemies = TD.getThemeById('medieval').enemies;

      expect(enemies.common.name).toBe('Goblin Saqueador');
      expect(enemies.common.renderer).toBe('goblinSaqueador');
      expect(enemies.common.deathEffect).toBe('dustPop');
      expect(enemies.fast.name).toBe('Lobo Sombrio');
      expect(enemies.fast.renderer).toBe('loboSombrio');
      expect(enemies.fast.deathEffect).toBe('rollDust');
      expect(enemies.tank.name).toBe('Ogro de Cerco');
      expect(enemies.tank.renderer).toBe('ogroDeCerco');
      expect(enemies.tank.deathEffect).toBe('heavyDust');
    });
  });
})(globalThis);
