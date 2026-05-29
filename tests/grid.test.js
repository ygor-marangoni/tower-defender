(function gridTests(global) {
  const TD = global.TowerDefender;
  const GRID_SIZE = 48;

  function createPlacementState(overrides = {}) {
    return {
      towers: [],
      pathPoints: TD.getThemePath('futuristic'),
      canvasWidth: TD.CONFIG.CANVAS_WIDTH,
      canvasHeight: TD.CONFIG.CANVAS_HEIGHT,
      economy: {
        money: 150,
        canAfford(cost) {
          return this.money >= cost;
        }
      },
      ...overrides
    };
  }

  describe('Grid placement helpers', () => {
    test('getGridCellFromPoint deve retornar a celula correta', () => {
      expect(TD.Grid.getGridCellFromPoint(10, 10, GRID_SIZE)).toEqual({ col: 0, row: 0 });
      expect(TD.Grid.getGridCellFromPoint(50, 10, GRID_SIZE)).toEqual({ col: 1, row: 0 });
      expect(TD.Grid.getGridCellFromPoint(100, 100, GRID_SIZE)).toEqual({ col: 2, row: 2 });
    });

    test('getGridCellCenter deve retornar o centro correto', () => {
      expect(TD.Grid.getGridCellCenter({ col: 0, row: 0 }, GRID_SIZE)).toEqual({ x: 24, y: 24 });
      expect(TD.Grid.getGridCellCenter({ col: 1, row: 0 }, GRID_SIZE)).toEqual({ x: 72, y: 24 });
      expect(TD.Grid.getGridCellCenter({ col: 2, row: 2 }, GRID_SIZE)).toEqual({ x: 120, y: 120 });
    });

    test('snapPointToGrid deve alinhar o ponto ao centro da celula', () => {
      expect(TD.Grid.snapPointToGrid(10, 10, GRID_SIZE)).toEqual({ x: 24, y: 24 });
      expect(TD.Grid.snapPointToGrid(50, 10, GRID_SIZE)).toEqual({ x: 72, y: 24 });
    });

    test('isSameCell deve comparar corretamente duas celulas', () => {
      expect(TD.Grid.isSameCell({ col: 2, row: 3 }, { col: 2, row: 3 })).toBeTruthy();
      expect(TD.Grid.isSameCell({ col: 2, row: 3 }, { col: 3, row: 2 })).toBeFalsy();
      expect(TD.Grid.isSameCell(null, { col: 2, row: 3 })).toBeFalsy();
    });

    test('getCellKey deve gerar chave estavel', () => {
      expect(TD.Grid.getCellKey({ col: 2, row: 3 })).toBe('2:3');
    });

    test('isCellInsideCanvas deve retornar false para celula fora do Canvas', () => {
      expect(TD.Grid.isCellInsideCanvas({ col: 0, row: 0 }, 1200, 540, GRID_SIZE)).toBeTruthy();
      expect(TD.Grid.isCellInsideCanvas({ col: -1, row: 0 }, 1200, 540, GRID_SIZE)).toBeFalsy();
      expect(TD.Grid.isCellInsideCanvas({ col: 25, row: 0 }, 1200, 540, GRID_SIZE)).toBeFalsy();
      expect(TD.Grid.isCellInsideCanvas({ col: 0, row: 11 }, 1200, 540, GRID_SIZE)).toBeFalsy();
    });

    test('isCellOccupied deve retornar true se ja houver torre naquela celula', () => {
      const towers = [
        new TD.Tower({ type: 'basic', x: 72, y: 24 })
      ];

      expect(TD.Grid.isCellOccupied({ col: 1, row: 0 }, towers, GRID_SIZE)).toBeTruthy();
    });

    test('isCellOccupied deve retornar false para celula livre', () => {
      const towers = [
        new TD.Tower({ type: 'basic', x: 72, y: 24 })
      ];

      expect(TD.Grid.isCellOccupied({ col: 2, row: 0 }, towers, GRID_SIZE)).toBeFalsy();
    });

    test('posicionamento deve usar centro da celula, nao a posicao do mouse', () => {
      const placement = TD.Grid.getGridPlacementState(createPlacementState(), 50, 10, 'basic');

      expect(placement.position).toEqual({ x: 72, y: 24 });
      expect(placement.cell).toEqual({ col: 1, row: 0 });
    });

    test('canPlaceTowerAtSnappedPosition deve impedir posicao sobre o caminho', () => {
      const pathPoints = TD.getThemePath('futuristic');
      const placement = TD.Grid.getGridPlacementState(createPlacementState({ pathPoints }), pathPoints[1].x, pathPoints[1].y, 'basic');

      expect(placement.canPlace).toBeFalsy();
      expect(placement.reason).toBe('PATH_BLOCKED');
    });

    test('canPlaceTowerAtSnappedPosition deve impedir posicao sobre outra torre', () => {
      const state = createPlacementState({
        towers: [new TD.Tower({ type: 'basic', x: 72, y: 24 })]
      });
      const placement = TD.Grid.getGridPlacementState(state, 50, 10, 'basic');

      expect(placement.canPlace).toBeFalsy();
      expect(placement.reason).toBe('TOWER_OCCUPIED');
    });

    test('canPlaceTowerAtSnappedPosition deve permitir posicao valida fora do caminho', () => {
      const placement = TD.Grid.getGridPlacementState(createPlacementState(), 880, 80, 'basic');

      expect(placement.canPlace).toBeTruthy();
      expect(placement.reason).toBe(null);
    });

    test('sem dinheiro suficiente deve retornar NOT_ENOUGH_MONEY', () => {
      const placement = TD.Grid.getGridPlacementState(createPlacementState({
        economy: {
          money: 0,
          canAfford() {
            return false;
          }
        }
      }), 880, 80, 'heavy');

      expect(placement.canPlace).toBeFalsy();
      expect(placement.reason).toBe('NOT_ENOUGH_MONEY');
    });

    test('sem torre selecionada deve retornar NO_TOWER_SELECTED', () => {
      const placement = TD.Grid.getGridPlacementState(createPlacementState(), 880, 80, null);

      expect(placement.canPlace).toBeFalsy();
      expect(placement.reason).toBe('NO_TOWER_SELECTED');
    });

    test('grid deve funcionar com path do tema medieval', () => {
      const pathPoints = TD.getThemePath('medieval');
      const blocked = TD.Grid.getGridPlacementState(createPlacementState({ pathPoints }), pathPoints[1].x, pathPoints[1].y, 'basic');
      const valid = TD.Grid.getGridPlacementState(createPlacementState({ pathPoints }), 880, 80, 'basic');

      expect(blocked.canPlace).toBeFalsy();
      expect(blocked.reason).toBe('PATH_BLOCKED');
      expect(valid.canPlace).toBeTruthy();
    });

    test('grid deve funcionar com path do tema futurista', () => {
      const pathPoints = TD.getThemePath('futuristic');
      const blocked = TD.Grid.getGridPlacementState(createPlacementState({ pathPoints }), pathPoints[1].x, pathPoints[1].y, 'basic');
      const valid = TD.Grid.getGridPlacementState(createPlacementState({ pathPoints }), 880, 80, 'basic');

      expect(blocked.canPlace).toBeFalsy();
      expect(blocked.reason).toBe('PATH_BLOCKED');
      expect(valid.canPlace).toBeTruthy();
    });

    test('paths devem ficar alinhados as linhas do grid', () => {
      ['futuristic', 'medieval'].forEach((themeId) => {
        ['desktop', 'mobile'].forEach((layout) => {
          TD.getThemePath(themeId, layout).forEach((point) => {
            const offsetX = (point.x % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
            const offsetY = (point.y % GRID_SIZE + GRID_SIZE) % GRID_SIZE;

            expect(offsetX).toBe(0);
            expect(offsetY).toBe(0);
          });
        });
      });
    });

    test('largura principal da estrada deve ficar entre uma e duas celulas do grid', () => {
      expect(TD.CONFIG.PATH_WIDTH).toBe(72);
      expect(TD.CONFIG.PATH_WIDTH).toBeGreaterThan(TD.CONFIG.GRID.size);
      expect(TD.CONFIG.PATH_WIDTH).toBeLessThan(TD.CONFIG.GRID.size * 2);
      expect(TD.CONFIG.CANVAS_LAYOUTS.desktop.pathWidth).toBe(TD.CONFIG.PATH_WIDTH);
      expect(TD.CONFIG.CANVAS_LAYOUTS.mobile.pathWidth).toBe(TD.CONFIG.PATH_WIDTH);
    });

    test('celula vizinha a borda da estrada deve aceitar defesa', () => {
      const placement = TD.Grid.getGridPlacementState(createPlacementState(), 220, 220, 'basic');

      expect(placement.position).toEqual({ x: 216, y: 216 });
      expect(placement.canPlace).toBeTruthy();
    });
  });
})(globalThis);
