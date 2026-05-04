(function sellTowerTests(global) {
  const TD = global.TowerDefender;

  function createSellState(overrides = {}) {
    const towers = overrides.towers || [];

    return {
      towers,
      money: overrides.money ?? 0,
      economy: overrides.economy ?? null,
      selectedTowerType: overrides.selectedTowerType ?? null,
      selectedPlacedTower: overrides.selectedPlacedTower ?? null,
      hoveredTower: overrides.hoveredTower ?? null,
      currentThemeId: overrides.currentThemeId ?? TD.DEFAULT_THEME_ID,
      gameOver: overrides.gameOver ?? false
    };
  }

  describe('Tower selling', () => {
    test('clique dentro do raio deve retornar a torre clicada', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });

      const selected = TD.getTowerAtPosition([tower], 112, 104);

      expect(selected).toBe(tower);
    });

    test('clique fora do raio deve retornar null', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });

      const selected = TD.getTowerAtPosition([tower], 180, 180);

      expect(selected).toBe(null);
    });

    test('com duas torres proximas deve retornar a mais proxima do clique', () => {
      const firstTower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const secondTower = new TD.Tower({ type: 'rapid', x: 116, y: 100 });

      const selected = TD.getTowerAtPosition([firstTower, secondTower], 115, 100);

      expect(selected).toBe(secondTower);
    });

    test('venda remove torre da lista', () => {
      const firstTower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const secondTower = new TD.Tower({ type: 'rapid', x: 200, y: 100 });
      const state = createSellState({
        towers: [firstTower, secondTower],
        selectedPlacedTower: firstTower
      });

      TD.sellSelectedTower(state);

      expect(state.towers.length).toBe(1);
      expect(state.towers[0]).toBe(secondTower);
    });

    test('venda adiciona dinheiro ao estado simples', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const state = createSellState({
        towers: [tower],
        money: 100,
        selectedPlacedTower: tower
      });

      const result = TD.sellSelectedTower(state);

      expect(result.sold).toBeTruthy();
      expect(result.refund).toBe(35);
      expect(state.money).toBe(135);
    });

    test('venda sem torre selecionada nao altera dinheiro nem torres', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const state = createSellState({
        towers: [tower],
        money: 100,
        selectedPlacedTower: null
      });

      const result = TD.sellSelectedTower(state);

      expect(result.sold).toBeFalsy();
      expect(result.reason).toBe('NO_TOWER_SELECTED');
      expect(state.money).toBe(100);
      expect(state.towers.length).toBe(1);
    });

    test('venda de torre inexistente nao adiciona dinheiro e limpa selecao', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const missingTower = new TD.Tower({ type: 'rapid', x: 200, y: 100 });
      const state = createSellState({
        towers: [tower],
        money: 100,
        selectedPlacedTower: missingTower
      });

      const result = TD.sellSelectedTower(state);

      expect(result.sold).toBeFalsy();
      expect(result.reason).toBe('TOWER_NOT_FOUND');
      expect(state.money).toBe(100);
      expect(state.selectedPlacedTower).toBe(null);
    });

    test('venda limpa selecao de torre posicionada e selecao de construcao', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const state = createSellState({
        towers: [tower],
        money: 0,
        selectedPlacedTower: tower,
        selectedTowerType: 'heavy',
        hoveredTower: tower
      });

      TD.sellSelectedTower(state);

      expect(state.selectedPlacedTower).toBe(null);
      expect(state.selectedTowerType).toBe(null);
      expect(state.hoveredTower).toBe(null);
    });

    test('venda nao pode ocorrer duas vezes', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const state = createSellState({
        towers: [tower],
        money: 100,
        selectedPlacedTower: tower
      });

      const firstSale = TD.sellSelectedTower(state);
      const secondSale = TD.sellSelectedTower(state);

      expect(firstSale.sold).toBeTruthy();
      expect(secondSale.sold).toBeFalsy();
      expect(secondSale.reason).toBe('NO_TOWER_SELECTED');
      expect(state.money).toBe(135);
      expect(state.towers.length).toBe(0);
    });

    test('venda funciona no tema futurista', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const state = createSellState({
        towers: [tower],
        money: 0,
        selectedPlacedTower: tower,
        currentThemeId: 'futuristic'
      });

      const result = TD.sellSelectedTower(state);

      expect(result.sold).toBeTruthy();
      expect(result.towerType).toBe('basic');
      expect(state.money).toBe(35);
    });

    test('venda funciona no tema medieval', () => {
      const tower = new TD.Tower({ type: 'basic', x: 100, y: 100 });
      const state = createSellState({
        towers: [tower],
        money: 0,
        selectedPlacedTower: tower,
        currentThemeId: 'medieval'
      });

      const result = TD.sellSelectedTower(state);

      expect(result.sold).toBeTruthy();
      expect(result.towerType).toBe('basic');
      expect(state.money).toBe(35);
    });
  });
})(globalThis);
