(function gridModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG, TOWER_TYPES } = TD;

  const REASON_MAP = {
    bounds: 'OUT_OF_BOUNDS',
    path: 'PATH_BLOCKED',
    tower: 'TOWER_OCCUPIED'
  };

  function getGridConfig(theme = null) {
    return {
      ...CONFIG.GRID,
      ...(theme?.grid || {})
    };
  }

  function getGridCellFromPoint(x, y, gridSize = CONFIG.GRID.size) {
    return {
      col: Math.floor(x / gridSize),
      row: Math.floor(y / gridSize)
    };
  }

  function getGridCellCenter(cell, gridSize = CONFIG.GRID.size) {
    return {
      x: cell.col * gridSize + gridSize / 2,
      y: cell.row * gridSize + gridSize / 2
    };
  }

  function snapPointToGrid(x, y, gridSize = CONFIG.GRID.size) {
    return getGridCellCenter(getGridCellFromPoint(x, y, gridSize), gridSize);
  }

  function isCellInsideCanvas(cell, canvasWidth = CONFIG.CANVAS_WIDTH, canvasHeight = CONFIG.CANVAS_HEIGHT, gridSize = CONFIG.GRID.size) {
    if (!cell || cell.col < 0 || cell.row < 0) {
      return false;
    }

    const center = getGridCellCenter(cell, gridSize);
    return center.x >= 0 && center.y >= 0 && center.x <= canvasWidth && center.y <= canvasHeight;
  }

  function getCellKey(cell) {
    if (!cell) {
      return '';
    }

    return `${cell.col}:${cell.row}`;
  }

  function getTowerCell(tower, gridSize = CONFIG.GRID.size) {
    if (!tower || !Number.isFinite(tower.x) || !Number.isFinite(tower.y)) {
      return null;
    }

    if (tower.gridCell && Number.isFinite(tower.gridCell.col) && Number.isFinite(tower.gridCell.row)) {
      return {
        col: tower.gridCell.col,
        row: tower.gridCell.row
      };
    }

    return getGridCellFromPoint(tower.x, tower.y, gridSize);
  }

  function isSameCell(cellA, cellB) {
    if (!cellA || !cellB) {
      return false;
    }

    return cellA.col === cellB.col && cellA.row === cellB.row;
  }

  function isCellOccupied(cell, towers = [], gridSize = CONFIG.GRID.size) {
    return towers.some((tower) => {
      if (tower?.gridKey) {
        return tower.gridKey === getCellKey(cell);
      }

      return isSameCell(cell, getTowerCell(tower, gridSize));
    });
  }

  function getTowerCost(towerType, state = {}) {
    if (!towerType || !TOWER_TYPES[towerType]) {
      return 0;
    }

    if (typeof TD.getEffectiveTowerCost === 'function') {
      return TD.getEffectiveTowerCost(towerType, state.upgrades);
    }

    return TOWER_TYPES[towerType].cost;
  }

  function canAffordTower(state = {}, towerType) {
    const cost = getTowerCost(towerType, state);

    if (state.economy && typeof state.economy.canAfford === 'function') {
      return state.economy.canAfford(cost);
    }

    if (Number.isFinite(state.money)) {
      return state.money >= cost;
    }

    return true;
  }

  function createPlacementResult(canPlace, reason, position, cell) {
    return {
      canPlace,
      reason,
      position,
      cell
    };
  }

  function canPlaceTowerAtSnappedPosition(state = {}, snappedPosition, towerType) {
    const gridConfig = getGridConfig(state.currentTheme || state.theme);
    const gridSize = gridConfig.size;
    const position = {
      x: snappedPosition?.x,
      y: snappedPosition?.y
    };
    const cell = getGridCellFromPoint(position.x, position.y, gridSize);

    if (!towerType || !TOWER_TYPES[towerType]) {
      return createPlacementResult(false, 'NO_TOWER_SELECTED', position, cell);
    }

    if (!isCellInsideCanvas(cell, state.canvasWidth || CONFIG.CANVAS_WIDTH, state.canvasHeight || CONFIG.CANVAS_HEIGHT, gridSize)) {
      return createPlacementResult(false, 'OUT_OF_BOUNDS', position, cell);
    }

    if (isCellOccupied(cell, state.towers || [], gridSize)) {
      return createPlacementResult(false, 'TOWER_OCCUPIED', position, cell);
    }

    const placement = TD.Collision.canPlaceTower({
      x: position.x,
      y: position.y,
      towers: state.towers || [],
      pathPoints: state.pathPoints || CONFIG.PATH_POINTS
    });

    if (!placement.valid) {
      return createPlacementResult(false, REASON_MAP[placement.reason] || 'OUT_OF_BOUNDS', position, cell);
    }

    if (!canAffordTower(state, towerType)) {
      return createPlacementResult(false, 'NOT_ENOUGH_MONEY', position, cell);
    }

    return createPlacementResult(true, null, position, cell);
  }

  function getGridPlacementState(state = {}, x, y, towerType) {
    const gridConfig = getGridConfig(state.currentTheme || state.theme);
    const gridSize = gridConfig.size;
    const cell = getGridCellFromPoint(x, y, gridSize);
    const position = getGridCellCenter(cell, gridSize);
    const placement = canPlaceTowerAtSnappedPosition(state, position, towerType);

    return {
      ...placement,
      position,
      cell,
      isActive: Boolean(towerType),
      towerType
    };
  }

  TD.Grid = {
    getGridConfig,
    getGridCellFromPoint,
    getGridCellCenter,
    snapPointToGrid,
    isCellInsideCanvas,
    getCellKey,
    getTowerCell,
    isSameCell,
    isCellOccupied,
    canPlaceTowerAtSnappedPosition,
    getGridPlacementState
  };
})(globalThis);
