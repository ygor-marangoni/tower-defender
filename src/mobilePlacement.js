(function mobilePlacementModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG } = TD;

  const DEFAULT_DRAG_CONFIG = {
    threshold: 8,
    ghostOffset: {
      x: 0,
      y: -48
    }
  };

  function getDragConfig() {
    return {
      ...DEFAULT_DRAG_CONFIG,
      ...(CONFIG?.DRAG_PLACEMENT || {}),
      ghostOffset: {
        ...DEFAULT_DRAG_CONFIG.ghostOffset,
        ...(CONFIG?.DRAG_PLACEMENT?.ghostOffset || {})
      }
    };
  }

  function createInitialDragPlacementState() {
    return {
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
    };
  }

  function clonePoint(point) {
    if (!point) {
      return null;
    }

    return {
      x: point.x,
      y: point.y
    };
  }

  function isPointInsideRect(x, y, rect) {
    if (!rect) {
      return false;
    }

    const right = Number.isFinite(rect.right) ? rect.right : rect.left + rect.width;
    const bottom = Number.isFinite(rect.bottom) ? rect.bottom : rect.top + rect.height;

    return x >= rect.left && x <= right && y >= rect.top && y <= bottom;
  }

  function getElementRect(elementOrRect) {
    if (elementOrRect && typeof elementOrRect.getBoundingClientRect === 'function') {
      return elementOrRect.getBoundingClientRect();
    }

    return elementOrRect;
  }

  function getCanvasPointFromClientPosition(clientX, clientY, canvasOrRect, canvasSize = null) {
    const rect = getElementRect(canvasOrRect);
    const width = canvasSize?.width || canvasOrRect?.width || CONFIG.CANVAS_WIDTH;
    const height = canvasSize?.height || canvasOrRect?.height || CONFIG.CANVAS_HEIGHT;

    return {
      x: (clientX - rect.left) * (width / rect.width),
      y: (clientY - rect.top) * (height / rect.height)
    };
  }

  function beginTowerTouch(currentState, pointerId, towerType, screenPosition) {
    return {
      ...createInitialDragPlacementState(),
      isPending: true,
      pointerId,
      towerType,
      startScreenPosition: clonePoint(screenPosition),
      screenPosition: clonePoint(screenPosition)
    };
  }

  function shouldStartDrag(startPoint, currentPoint, threshold = getDragConfig().threshold) {
    if (!startPoint || !currentPoint) {
      return false;
    }

    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;
    return Math.hypot(dx, dy) > threshold;
  }

  function startDragFromTouch(currentState) {
    if (!currentState?.isPending || !currentState.towerType) {
      return createInitialDragPlacementState();
    }

    return {
      ...currentState,
      isPending: false,
      isDragging: true
    };
  }

  function clearCanvasPlacement(currentState, screenPosition) {
    return {
      ...currentState,
      screenPosition: clonePoint(screenPosition),
      canvasPosition: null,
      isOverCanvas: false,
      snappedPosition: null,
      cell: null,
      canPlace: false,
      reason: null
    };
  }

  function updateDragPosition(currentState, screenPosition, canvasRect, canvasSize, gridConfig, resolvePlacement) {
    if (!currentState?.isDragging) {
      return currentState || createInitialDragPlacementState();
    }

    if (!isPointInsideRect(screenPosition.x, screenPosition.y, canvasRect)) {
      return clearCanvasPlacement(currentState, screenPosition);
    }

    const gridSize = gridConfig?.size || CONFIG.GRID.size;
    const canvasPosition = getCanvasPointFromClientPosition(screenPosition.x, screenPosition.y, canvasRect, canvasSize);
    const cell = TD.Grid.getGridCellFromPoint(canvasPosition.x, canvasPosition.y, gridSize);
    const snappedPosition = TD.Grid.getGridCellCenter(cell, gridSize);
    const placement = typeof resolvePlacement === 'function'
      ? resolvePlacement(snappedPosition, cell)
      : {
        canPlace: true,
        reason: null,
        position: snappedPosition,
        cell
      };

    return {
      ...currentState,
      screenPosition: clonePoint(screenPosition),
      canvasPosition,
      isOverCanvas: true,
      snappedPosition: placement.position || snappedPosition,
      cell: placement.cell || cell,
      canPlace: Boolean(placement.canPlace),
      reason: placement.reason || null
    };
  }

  function finishDragPlacement(currentState) {
    if (!currentState?.isDragging) {
      return {
        action: currentState?.isPending ? 'select' : 'cancel',
        towerType: currentState?.towerType || null,
        reason: currentState?.isPending ? null : 'NOT_DRAGGING'
      };
    }

    if (currentState.isOverCanvas && currentState.canPlace && currentState.snappedPosition) {
      return {
        action: 'build',
        towerType: currentState.towerType,
        position: currentState.snappedPosition,
        cell: currentState.cell,
        reason: null
      };
    }

    return {
      action: 'cancel',
      towerType: currentState.towerType,
      reason: currentState.reason || (currentState.isOverCanvas ? 'INVALID_CELL' : 'OUTSIDE_CANVAS')
    };
  }

  function resetDragPlacement() {
    return createInitialDragPlacementState();
  }

  function shouldIgnorePointer(currentState, pointerId) {
    return currentState?.pointerId !== null && currentState?.pointerId !== pointerId;
  }

  function shouldBlockTowerDrag(gameState = {}) {
    return Boolean(
      gameState.gameOver
      || gameState.appMode !== 'playing'
      || gameState.cardChoice?.isOpen
      || (typeof gameState.isCardChoiceOpen === 'function' && gameState.isCardChoiceOpen())
    );
  }

  function createDragGhostElement(sourceElement, towerType, themeId, documentRef = global.document) {
    if (!documentRef) {
      return null;
    }

    const ghost = documentRef.createElement('div');
    ghost.className = `tower-drag-ghost theme-${themeId || 'futuristic'} tower-${towerType}`;
    ghost.setAttribute('aria-hidden', 'true');

    const token = sourceElement?.querySelector?.('.tower-token');
    if (token) {
      ghost.appendChild(token.cloneNode(true));
    } else {
      ghost.textContent = towerType ? towerType[0].toUpperCase() : '?';
    }

    documentRef.body.appendChild(ghost);
    return ghost;
  }

  function updateDragGhostElement(ghost, screenPosition, dragState, config = getDragConfig()) {
    if (!ghost || !screenPosition) {
      return;
    }

    const offset = config.ghostOffset || DEFAULT_DRAG_CONFIG.ghostOffset;
    const x = screenPosition.x + offset.x;
    const y = screenPosition.y + offset.y;

    ghost.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    ghost.classList.toggle('is-over-canvas', Boolean(dragState?.isOverCanvas));
    ghost.classList.toggle('is-valid', Boolean(dragState?.isOverCanvas && dragState?.canPlace));
    ghost.classList.toggle('is-invalid', Boolean(dragState?.isOverCanvas && !dragState?.canPlace));
  }

  function removeDragGhostElement(ghost) {
    if (ghost?.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
  }

  TD.MobilePlacement = {
    getDragConfig,
    createInitialDragPlacementState,
    isPointInsideRect,
    getCanvasPointFromClientPosition,
    beginTowerTouch,
    shouldStartDrag,
    startDragFromTouch,
    updateDragPosition,
    finishDragPlacement,
    resetDragPlacement,
    shouldIgnorePointer,
    shouldBlockTowerDrag,
    createDragGhostElement,
    updateDragGhostElement,
    removeDragGhostElement
  };
})(globalThis);
