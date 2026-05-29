(function mobilePlacementTests(global) {
  const TD = global.TowerDefender;
  const MobilePlacement = TD.MobilePlacement;

  function createRect(overrides = {}) {
    return {
      left: 100,
      top: 50,
      right: 580,
      bottom: 320,
      width: 480,
      height: 270,
      ...overrides
    };
  }

  describe('MobilePlacement geometry', () => {
    test('isPointInsideRect deve detectar ponto dentro do retangulo', () => {
      const rect = createRect();

      expect(MobilePlacement.isPointInsideRect(340, 185, rect)).toBe(true);
      expect(MobilePlacement.isPointInsideRect(99, 185, rect)).toBe(false);
      expect(MobilePlacement.isPointInsideRect(340, 321, rect)).toBe(false);
    });

    test('getCanvasPointFromClientPosition deve converter coordenadas responsivas', () => {
      const point = MobilePlacement.getCanvasPointFromClientPosition(340, 185, createRect(), {
        width: 960,
        height: 540
      });

      expect(point).toEqual({ x: 480, y: 270 });
    });

    test('shouldStartDrag deve respeitar o threshold de movimento', () => {
      const start = { x: 10, y: 10 };

      expect(MobilePlacement.shouldStartDrag(start, { x: 14, y: 14 }, 8)).toBe(false);
      expect(MobilePlacement.shouldStartDrag(start, { x: 20, y: 10 }, 8)).toBe(true);
    });
  });

  describe('MobilePlacement state', () => {
    test('drag state inicial deve comecar limpo', () => {
      expect(MobilePlacement.createInitialDragPlacementState()).toEqual({
        isPending: false,
        isDragging: false,
        pointerId: null,
        towerType: null,
        startScreenPosition: null,
        screenPosition: { x: 0, y: 0 },
        canvasPosition: null,
        isOverCanvas: false,
        snappedPosition: null,
        cell: null,
        canPlace: false,
        reason: null
      });
    });

    test('beginTowerTouch deve definir towerType e pointerId', () => {
      const state = MobilePlacement.beginTowerTouch(
        MobilePlacement.createInitialDragPlacementState(),
        7,
        'basic',
        { x: 12, y: 18 }
      );

      expect(state.isPending).toBe(true);
      expect(state.isDragging).toBe(false);
      expect(state.pointerId).toBe(7);
      expect(state.towerType).toBe('basic');
      expect(state.startScreenPosition).toEqual({ x: 12, y: 18 });
    });

    test('startDragFromTouch deve iniciar drag real', () => {
      const pending = MobilePlacement.beginTowerTouch(
        MobilePlacement.createInitialDragPlacementState(),
        2,
        'rapid',
        { x: 0, y: 0 }
      );
      const dragging = MobilePlacement.startDragFromTouch(pending);

      expect(dragging.isPending).toBe(false);
      expect(dragging.isDragging).toBe(true);
      expect(dragging.pointerId).toBe(2);
      expect(dragging.towerType).toBe('rapid');
    });

    test('pointerId diferente deve ser ignorado', () => {
      const state = MobilePlacement.beginTowerTouch(
        MobilePlacement.createInitialDragPlacementState(),
        2,
        'rapid',
        { x: 0, y: 0 }
      );

      expect(MobilePlacement.shouldIgnorePointer(state, 3)).toBe(true);
      expect(MobilePlacement.shouldIgnorePointer(state, 2)).toBe(false);
    });

    test('cancelTowerDrag deve limpar estado', () => {
      const state = MobilePlacement.resetDragPlacement();

      expect(state.isPending).toBe(false);
      expect(state.isDragging).toBe(false);
      expect(state.towerType).toBe(null);
      expect(state.pointerId).toBe(null);
    });
  });

  describe('MobilePlacement update/drop', () => {
    test('updateTowerDrag fora do canvas deve marcar isOverCanvas false', () => {
      const dragging = MobilePlacement.startDragFromTouch(
        MobilePlacement.beginTowerTouch(
          MobilePlacement.createInitialDragPlacementState(),
          1,
          'basic',
          { x: 10, y: 10 }
        )
      );
      const updated = MobilePlacement.updateDragPosition(
        dragging,
        { x: 20, y: 20 },
        createRect(),
        { width: 960, height: 540 },
        TD.Grid.getGridConfig(),
        () => ({ canPlace: true })
      );

      expect(updated.isOverCanvas).toBe(false);
      expect(updated.canvasPosition).toBe(null);
      expect(updated.snappedPosition).toBe(null);
    });

    test('updateTowerDrag dentro do canvas deve calcular canvasPosition', () => {
      const dragging = MobilePlacement.startDragFromTouch(
        MobilePlacement.beginTowerTouch(
          MobilePlacement.createInitialDragPlacementState(),
          1,
          'basic',
          { x: 10, y: 10 }
        )
      );
      const updated = MobilePlacement.updateDragPosition(
        dragging,
        { x: 340, y: 185 },
        createRect(),
        { width: 960, height: 540 },
        TD.Grid.getGridConfig(),
        () => ({ canPlace: true })
      );

      expect(updated.isOverCanvas).toBe(true);
      expect(updated.canvasPosition).toEqual({ x: 480, y: 270 });
    });

    test('updateTowerDrag dentro do canvas deve calcular cell e snappedPosition', () => {
      const dragging = MobilePlacement.startDragFromTouch(
        MobilePlacement.beginTowerTouch(
          MobilePlacement.createInitialDragPlacementState(),
          1,
          'basic',
          { x: 10, y: 10 }
        )
      );
      const updated = MobilePlacement.updateDragPosition(
        dragging,
        { x: 340, y: 185 },
        createRect(),
        { width: 960, height: 540 },
        TD.Grid.getGridConfig(),
        () => ({ canPlace: true })
      );

      expect(updated.cell).toEqual({ col: 10, row: 5 });
      expect(updated.snappedPosition).toEqual({ x: 504, y: 264 });
    });

    test('updateTowerDrag deve usar snap-to-grid e resolver validacao', () => {
      const dragging = MobilePlacement.startDragFromTouch(
        MobilePlacement.beginTowerTouch(
          MobilePlacement.createInitialDragPlacementState(),
          1,
          'heavy',
          { x: 10, y: 10 }
        )
      );
      const updated = MobilePlacement.updateDragPosition(
        dragging,
        { x: 340, y: 185 },
        createRect(),
        { width: 960, height: 540 },
        TD.Grid.getGridConfig(),
        (position, cell) => ({
          canPlace: false,
          reason: 'PATH_BLOCKED',
          position,
          cell
        })
      );

      expect(updated.canPlace).toBe(false);
      expect(updated.reason).toBe('PATH_BLOCKED');
      expect(updated.snappedPosition).toEqual({ x: 504, y: 264 });
    });

    test('endTowerDrag em posicao valida deve retornar acao de build', () => {
      const state = {
        ...MobilePlacement.createInitialDragPlacementState(),
        isDragging: true,
        towerType: 'basic',
        isOverCanvas: true,
        canPlace: true,
        snappedPosition: { x: 120, y: 120 },
        cell: { col: 2, row: 2 }
      };
      const result = MobilePlacement.finishDragPlacement(state);

      expect(result.action).toBe('build');
      expect(result.towerType).toBe('basic');
      expect(result.position).toEqual({ x: 120, y: 120 });
      expect(result.cell).toEqual({ col: 2, row: 2 });
    });

    test('endTowerDrag fora do canvas deve cancelar', () => {
      const state = {
        ...MobilePlacement.createInitialDragPlacementState(),
        isDragging: true,
        towerType: 'basic',
        isOverCanvas: false
      };
      const result = MobilePlacement.finishDragPlacement(state);

      expect(result.action).toBe('cancel');
      expect(result.reason).toBe('OUTSIDE_CANVAS');
    });

    test('endTowerDrag em celula invalida deve cancelar', () => {
      const state = {
        ...MobilePlacement.createInitialDragPlacementState(),
        isDragging: true,
        towerType: 'basic',
        isOverCanvas: true,
        canPlace: false,
        reason: 'TOWER_OCCUPIED'
      };
      const result = MobilePlacement.finishDragPlacement(state);

      expect(result.action).toBe('cancel');
      expect(result.reason).toBe('TOWER_OCCUPIED');
    });

    test('toque sem movimento acima do threshold deve ser tratado como selecao', () => {
      const state = MobilePlacement.beginTowerTouch(
        MobilePlacement.createInitialDragPlacementState(),
        1,
        'basic',
        { x: 20, y: 20 }
      );
      const result = MobilePlacement.finishDragPlacement(state);

      expect(result.action).toBe('select');
      expect(result.towerType).toBe('basic');
    });

    test('modal aberto deve bloquear inicio do drag', () => {
      expect(MobilePlacement.shouldBlockTowerDrag({
        appMode: 'playing',
        gameOver: false,
        cardChoice: { isOpen: true }
      })).toBe(true);

      expect(MobilePlacement.shouldBlockTowerDrag({
        appMode: 'playing',
        gameOver: false,
        cardChoice: { isOpen: false }
      })).toBe(false);
    });
  });
})(globalThis);
