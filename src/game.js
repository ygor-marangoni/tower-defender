(function gameModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG, TOWER_TYPES } = TD;

  function createInitialGameState(themeId = TD.DEFAULT_THEME_ID, layout = 'desktop') {
    const currentTheme = TD.getThemeById(themeId);
    const pathPoints = TD.getThemePath(currentTheme.id, layout);
    const towerInfo = {};

    Object.keys(TOWER_TYPES).forEach((type) => {
      towerInfo[type] = TD.getThemeTowerInfo(currentTheme.id, type);
    });

    return {
      currentTheme,
      currentThemeId: currentTheme.id,
      labels: currentTheme.labels,
      towerInfo,
      pathPoints,
      lives: CONFIG.INITIAL_LIVES,
      money: CONFIG.INITIAL_MONEY,
      waveNumber: 1,
      score: CONFIG.INITIAL_SCORE,
      towers: [],
      enemies: [],
      projectiles: [],
      effects: [],
      selectedTowerType: null,
      selectedPlacedTower: null,
      placementPreview: createInactivePlacementPreview(),
      upgrades: TD.createUpgradeState ? TD.createUpgradeState() : null,
      cardChoice: TD.createCardChoiceState ? TD.createCardChoiceState() : null
    };
  }

  function clearTowerSelections(state) {
    if (!state || typeof state !== 'object') {
      return state;
    }

    state.selectedTowerType = null;
    state.selectedPlacedTower = null;
    clearPlacementPreview(state);
    return state;
  }

  function createInactivePlacementPreview() {
    return {
      isActive: false,
      cell: null,
      position: null,
      canPlace: false,
      reason: null,
      towerType: null
    };
  }

  function clearPlacementPreview(state) {
    if (!state || typeof state !== 'object') {
      return state;
    }

    state.placementPreview = createInactivePlacementPreview();
    return state;
  }

  function isSameTower(leftTower, rightTower) {
    if (!leftTower || !rightTower) {
      return false;
    }

    if (leftTower === rightTower) {
      return true;
    }

    return Boolean(leftTower.id) && leftTower.id === rightTower.id;
  }

  function getTowerAtPosition(towers, x, y, hitSlop = CONFIG.TOWER_HIT_SLOP) {
    if (!Array.isArray(towers) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    const point = { x, y };

    return towers
      .map((tower) => {
        const baseRadius = Number.isFinite(tower?.radius) ? tower.radius : CONFIG.TOWER_RADIUS;
        const maxDistance = Math.max(CONFIG.MIN_TOWER_SELECTION_RADIUS || 18, baseRadius + (hitSlop || 0));

        return {
          tower,
          distance: TD.Collision.distanceBetweenPoints(point, tower),
          maxDistance
        };
      })
      .filter(({ tower, distance, maxDistance }) => tower && distance <= maxDistance)
      .sort((left, right) => left.distance - right.distance)[0]?.tower || null;
  }

  function addRefundToState(state, amount) {
    if (!Number.isFinite(amount) || amount < 0 || !state || typeof state !== 'object') {
      return false;
    }

    if (state.economy) {
      if (typeof state.economy.refundMoney === 'function') {
        state.economy.refundMoney(amount);
        return true;
      }

      if (typeof state.economy.addMoney === 'function') {
        state.economy.addMoney(amount);
        return true;
      }
    }

    if (!Number.isFinite(state.money)) {
      return false;
    }

    state.money += amount;
    return true;
  }

  function sellSelectedTower(state) {
    if (!state || typeof state !== 'object' || !Array.isArray(state.towers)) {
      return {
        sold: false,
        refund: 0,
        reason: 'INVALID_STATE'
      };
    }

    if (state.gameOver) {
      clearTowerSelections(state);
      return {
        sold: false,
        refund: 0,
        reason: 'GAME_OVER'
      };
    }

    const selectedTower = state.selectedPlacedTower;

    if (!selectedTower) {
      return {
        sold: false,
        refund: 0,
        reason: 'NO_TOWER_SELECTED'
      };
    }

    const towerIndex = state.towers.findIndex((tower) => isSameTower(tower, selectedTower));

    if (towerIndex === -1) {
      clearTowerSelections(state);
      if (isSameTower(state.hoveredTower, selectedTower)) {
        state.hoveredTower = null;
      }

      return {
        sold: false,
        refund: 0,
        reason: 'TOWER_NOT_FOUND'
      };
    }

    const tower = state.towers[towerIndex];
    const refund = TD.getEffectiveTowerSellValue
      ? TD.getEffectiveTowerSellValue(tower, state.upgrades)
      : Math.max(0, Number.isFinite(tower.getSellValue?.()) ? tower.getSellValue() : 0);

    if (!addRefundToState(state, refund)) {
      return {
        sold: false,
        refund: 0,
        reason: 'INVALID_STATE'
      };
    }

    state.towers.splice(towerIndex, 1);
    clearTowerSelections(state);

    if (isSameTower(state.hoveredTower, tower)) {
      state.hoveredTower = null;
    }

    return {
      sold: true,
      refund,
      towerType: tower.type
    };
  }

  function readFiniteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function readPositiveInteger(value, fallback = 0) {
    return Math.max(0, Math.floor(readFiniteNumber(value, fallback)));
  }

  function serializeTower(tower) {
    return {
      id: tower.id,
      type: tower.type,
      x: tower.x,
      y: tower.y,
      gridCell: tower.gridCell || null,
      gridKey: tower.gridKey || null,
      level: tower.level,
      damage: tower.damage,
      range: tower.range,
      cooldown: tower.cooldown,
      totalInvested: tower.totalInvested,
      rotation: tower.rotation,
      cardDamageMultiplier: tower.cardDamageMultiplier
    };
  }

  function hydrateTower(savedTower, themeId, scaleX = 1, scaleY = 1) {
    if (!savedTower || !TOWER_TYPES[savedTower.type]) {
      return null;
    }

    const tower = new TD.Tower({
      type: savedTower.type,
      themeId,
      x: TD.Utils.clamp(readFiniteNumber(savedTower.x) * scaleX, 0, CONFIG.CANVAS_WIDTH),
      y: TD.Utils.clamp(readFiniteNumber(savedTower.y) * scaleY, 0, CONFIG.CANVAS_HEIGHT)
    });

    tower.id = savedTower.id || tower.id;
    tower.level = Math.max(1, readPositiveInteger(savedTower.level, tower.level));
    tower.damage = Math.max(1, readPositiveInteger(savedTower.damage, tower.damage));
    tower.range = Math.max(1, readPositiveInteger(savedTower.range, tower.range));
    tower.cooldown = Math.max(140, readPositiveInteger(savedTower.cooldown, tower.cooldown));
    tower.totalInvested = Math.max(0, readPositiveInteger(savedTower.totalInvested, tower.totalInvested));
    tower.rotation = readFiniteNumber(savedTower.rotation, tower.rotation);
    tower.cardDamageMultiplier = Math.max(0.1, readFiniteNumber(savedTower.cardDamageMultiplier, tower.cardDamageMultiplier || 1));
    tower.lastShotAt = Number.NEGATIVE_INFINITY;
    tower.shotPulse = 0;
    tower.gridCell = savedTower.gridCell && Number.isFinite(savedTower.gridCell.col) && Number.isFinite(savedTower.gridCell.row)
      ? { col: savedTower.gridCell.col, row: savedTower.gridCell.row }
      : TD.Grid.getTowerCell(tower);
    tower.gridKey = savedTower.gridKey || TD.Grid.getCellKey(tower.gridCell);

    return tower;
  }

  function serializeWave(wave) {
    if (!wave) {
      return null;
    }

    return {
      number: wave.number,
      spawnedCount: wave.spawnedCount,
      spawnTimer: wave.spawnTimer,
      spawnInterval: wave.spawnInterval,
      active: wave.active,
      enemyPlan: wave.enemyPlan,
      totalEnemies: wave.totalEnemies,
      healthMultiplier: wave.healthMultiplier,
      endPadding: wave.endPadding
    };
  }

  function hydrateWave(savedWave, pathPoints) {
    if (!savedWave || !savedWave.active) {
      return null;
    }

    const wave = new TD.Wave({
      number: Math.max(1, readPositiveInteger(savedWave.number, 1)),
      pathPoints,
      endPadding: Math.max(0, readFiniteNumber(savedWave.endPadding, 0))
    });
    const enemyPlan = Array.isArray(savedWave.enemyPlan)
      ? savedWave.enemyPlan.filter((type) => Boolean(TD.ENEMY_TYPES[type]))
      : wave.enemyPlan;

    wave.enemyPlan = enemyPlan.length > 0 ? enemyPlan : wave.enemyPlan;
    wave.totalEnemies = wave.enemyPlan.length;
    wave.spawnedCount = TD.Utils.clamp(readPositiveInteger(savedWave.spawnedCount, 0), 0, wave.totalEnemies);
    wave.spawnTimer = Math.max(0, readFiniteNumber(savedWave.spawnTimer, 0));
    wave.spawnInterval = Math.max(120, readFiniteNumber(savedWave.spawnInterval, wave.spawnInterval));
    wave.healthMultiplier = Math.max(0.1, readFiniteNumber(savedWave.healthMultiplier, wave.healthMultiplier));
    wave.active = true;

    return wave;
  }

  function serializeEnemy(enemy) {
    return {
      id: enemy.id,
      type: enemy.type,
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      distanceTravelled: enemy.distanceTravelled,
      reachedEnd: enemy.reachedEnd,
      markedForReward: enemy.markedForReward,
      escapeHandled: enemy.escapeHandled,
      endPadding: enemy.endPadding
    };
  }

  function hydrateEnemy(savedEnemy, pathPoints) {
    if (!savedEnemy || !TD.ENEMY_TYPES[savedEnemy.type]) {
      return null;
    }

    const enemy = new TD.Enemy({
      type: savedEnemy.type,
      pathPoints,
      endPadding: Math.max(0, readFiniteNumber(savedEnemy.endPadding, 0))
    });

    enemy.id = savedEnemy.id || enemy.id;
    enemy.maxHealth = Math.max(1, readPositiveInteger(savedEnemy.maxHealth, enemy.maxHealth));
    enemy.health = TD.Utils.clamp(readFiniteNumber(savedEnemy.health, enemy.maxHealth), 0, enemy.maxHealth);
    enemy.distanceTravelled = Math.max(0, readFiniteNumber(savedEnemy.distanceTravelled, 0));
    enemy.reachedEnd = Boolean(savedEnemy.reachedEnd);
    enemy.markedForReward = Boolean(savedEnemy.markedForReward);
    enemy.escapeHandled = Boolean(savedEnemy.escapeHandled);
    enemy.totalPathLength = TD.Path.getTotalLength(pathPoints);
    enemy.endDistance = Math.max(0, enemy.totalPathLength - enemy.endPadding);
    enemy.distanceTravelled = TD.Utils.clamp(enemy.distanceTravelled, 0, enemy.endDistance);

    const point = TD.Path.getPointAtDistance(enemy.distanceTravelled, pathPoints);
    enemy.x = point.x;
    enemy.y = point.y;
    enemy.angle = point.angle;
    enemy.progress = point.progress;

    return enemy;
  }

  class Game {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.renderer = new TD.Renderer(this.canvas);
      this.input = new TD.InputController(this.canvas, this);
      this.elements = this.getElements();
      this.lastTime = 0;
      this.animationFrame = null;
      this.autoSaveTimer = 0;
      this.appMode = 'menu';
      this.currentThemeId = TD.Storage.getLastTheme();
      this.currentTheme = TD.getThemeById(this.currentThemeId);
      this.boardMediaQuery = global.matchMedia('(max-width: 760px)');
      this.boardLayout = this.getBoardLayout();
      this.sidebarMediaQuery = global.matchMedia('(max-width: 1120px)');
      this.boardFocusActive = false;
      this.boardFocusPreviousSidebarCollapsed = null;
      this.cardChoiceRenderedOpen = false;
      this.dragPlacement = TD.MobilePlacement.createInitialDragPlacementState();
      this.dragGhostElement = null;
      this.dragSourceButton = null;
      this.placementToast = null;
      this.suppressNextTowerClick = false;
      this.applyBoardLayout(this.boardLayout);

      this.reset(this.currentThemeId, { saveAfterReset: false });
      this.bindUI();
      if (!this.restoreSavedGame()) {
        this.showModeMenu();
      }
      this.updateSidebarToggleIcon();
      this.loop = this.loop.bind(this);
      this.animationFrame = requestAnimationFrame(this.loop);
    }

    ensureLoop() {
      if (this.animationFrame === null) {
        this.lastTime = 0;
        this.animationFrame = requestAnimationFrame(this.loop);
      }
    }

    getElements() {
      return {
        modeMenu: document.getElementById('modeMenu'),
        gameApp: document.getElementById('gameApp'),
        modeButtons: Array.from(document.querySelectorAll('[data-theme-choice]')),
        continueButton: document.getElementById('continueThemeButton'),
        currentModeName: document.getElementById('currentModeName'),
        heroSubtitle: document.getElementById('heroSubtitle'),
        hudLabels: Array.from(document.querySelectorAll('[data-label-key]')),
        routeTitle: document.getElementById('routeTitle'),
        boardTipText: document.getElementById('boardTipText'),
        towerListTitle: document.getElementById('towerListTitle'),
        towerMiniNote: document.getElementById('towerMiniNote'),
        towerDescriptions: Array.from(document.querySelectorAll('[data-tower-description]')),
        gameOverTitle: document.getElementById('gameOverTitle'),
        gameOverText: document.getElementById('gameOverText'),
        gameOverMenu: document.getElementById('gameOverMenuButton'),
        lives: document.getElementById('livesValue'),
        money: document.getElementById('moneyValue'),
        wave: document.getElementById('waveValue'),
        score: document.getElementById('scoreValue'),
        record: document.getElementById('recordValue'),
        bestWave: document.getElementById('bestWaveValue'),
        focusLives: document.getElementById('focusLivesValue'),
        focusMoney: document.getElementById('focusMoneyValue'),
        focusWave: document.getElementById('focusWaveValue'),
        selected: document.getElementById('selectedValue'),
        feedback: document.getElementById('feedbackText'),
        boardFocus: document.getElementById('boardFocusButton'),
        startWave: document.getElementById('startWaveButton'),
        restart: document.getElementById('restartButton'),
        changeMode: document.getElementById('changeModeButton'),
        upgrade: document.getElementById('upgradeButton'),
        sell: document.getElementById('sellTowerButton'),
        gameLayout: document.getElementById('gameLayout'),
        controlPanel: document.getElementById('controlPanel'),
        toggleSidebar: document.getElementById('toggleSidebarButton'),
        towerButtons: Array.from(document.querySelectorAll('[data-tower]')),
        overlay: document.getElementById('gameOverOverlay'),
        finalScore: document.getElementById('finalScore'),
        finalWave: document.getElementById('finalWave'),
        cardChoiceOverlay: document.getElementById('cardChoiceOverlay'),
        cardChoiceTitle: document.getElementById('cardChoiceTitle'),
        cardChoiceSubtitle: document.getElementById('cardChoiceSubtitle'),
        cardChoiceGrid: document.getElementById('cardChoiceGrid')
      };
    }

    bindUI() {
      this.elements.modeButtons.forEach((button) => {
        button.addEventListener('click', () => this.startGameWithTheme(button.dataset.themeChoice));
      });

      this.elements.continueButton.addEventListener('click', () => {
        if (!this.restoreSavedGame()) {
          this.startGameWithTheme(TD.Storage.getLastTheme());
        }
      });

      this.elements.towerButtons.forEach((button) => {
        button.addEventListener('click', (event) => this.handleTowerButtonClick(event, button));
        button.addEventListener('pointerdown', (event) => this.handleTowerPointerDown(event, button));
        button.addEventListener('pointermove', (event) => this.handleTowerPointerMove(event, button));
        button.addEventListener('pointerup', (event) => this.handleTowerPointerUp(event, button));
        button.addEventListener('pointercancel', (event) => this.handleTowerPointerCancel(event, button));
      });

      this.elements.startWave.addEventListener('click', () => this.startWave());
      this.elements.restart.addEventListener('click', () => this.restartGame());
      this.elements.changeMode.addEventListener('click', () => this.returnToMenu());
      this.elements.upgrade.addEventListener('click', () => this.upgradeSelectedTower());
      this.elements.sell.addEventListener('click', () => this.sellSelectedTower());
      this.elements.boardFocus.addEventListener('click', () => this.toggleBoardFocus());
      this.elements.toggleSidebar.addEventListener('click', () => this.toggleSidebar());
      this.boardMediaQuery.addEventListener('change', () => this.handleBoardLayoutChange());
      this.sidebarMediaQuery.addEventListener('change', () => this.updateSidebarToggleIcon());
      this.elements.overlay.addEventListener('click', (event) => {
        if (event.target.closest('[data-restart]')) {
          this.restartGame();
        }

        if (event.target.closest('[data-menu]')) {
          this.returnToMenu();
        }
      });
      this.elements.cardChoiceGrid?.addEventListener('click', (event) => {
        const cardButton = event.target.closest('.upgrade-card-action[data-card-id]');

        if (cardButton && this.elements.cardChoiceGrid.contains(cardButton)) {
          this.chooseUpgradeCard(cardButton.dataset.cardId);
        }
      });
      global.addEventListener('beforeunload', () => this.persistGameState({ force: true }));
    }

    handleTowerButtonClick(event, button) {
      if (this.suppressNextTowerClick) {
        event.preventDefault();
        event.stopPropagation();
        this.suppressNextTowerClick = false;
        return;
      }

      this.selectTowerType(button.dataset.towerType || button.dataset.tower);
    }

    getPointerScreenPosition(event) {
      return {
        x: event.clientX,
        y: event.clientY
      };
    }

    handleTowerPointerDown(event, button) {
      if (event.pointerType === 'mouse' || button.disabled || TD.MobilePlacement.shouldBlockTowerDrag(this)) {
        return;
      }

      if (this.dragPlacement.isPending || this.dragPlacement.isDragging) {
        return;
      }

      const towerType = button.dataset.towerType || button.dataset.tower;

      if (!TOWER_TYPES[towerType]) {
        return;
      }

      this.dragPlacement = TD.MobilePlacement.beginTowerTouch(
        this.dragPlacement,
        event.pointerId,
        towerType,
        this.getPointerScreenPosition(event)
      );
      this.dragSourceButton = button;

      if (typeof button.setPointerCapture === 'function') {
        button.setPointerCapture(event.pointerId);
      }
    }

    handleTowerPointerMove(event, button) {
      if (event.pointerType === 'mouse' || TD.MobilePlacement.shouldIgnorePointer(this.dragPlacement, event.pointerId)) {
        return;
      }

      const screenPosition = this.getPointerScreenPosition(event);

      if (!this.dragPlacement.isDragging) {
        if (!TD.MobilePlacement.shouldStartDrag(
          this.dragPlacement.startScreenPosition,
          screenPosition,
          TD.MobilePlacement.getDragConfig().threshold
        )) {
          return;
        }

        this.startTowerDrag(button, screenPosition);
      }

      event.preventDefault();
      this.updateTowerDrag(screenPosition);
    }

    handleTowerPointerUp(event, button) {
      if (event.pointerType === 'mouse' || TD.MobilePlacement.shouldIgnorePointer(this.dragPlacement, event.pointerId)) {
        return;
      }

      const wasActiveTouch = this.dragPlacement.isPending || this.dragPlacement.isDragging;

      if (!wasActiveTouch) {
        return;
      }

      event.preventDefault();

      if (this.dragPlacement.isDragging) {
        this.updateTowerDrag(this.getPointerScreenPosition(event));
      }

      const result = TD.MobilePlacement.finishDragPlacement(this.dragPlacement);

      if (result.action === 'build') {
        this.tryPlaceTower(result.position.x, result.position.y, result.towerType, {
          canPlace: true,
          reason: null,
          position: result.position,
          cell: result.cell,
          isActive: true,
          towerType: result.towerType
        });
        } else if (result.action === 'select') {
          this.selectTowerType(result.towerType);
        } else if (result.reason) {
          const message = this.getMobilePlacementError(result.reason);
          const toastPosition = this.dragPlacement.snappedPosition || this.dragPlacement.canvasPosition || {
            x: CONFIG.CANVAS_WIDTH / 2,
            y: CONFIG.CANVAS_HEIGHT / 2
          };

          this.showFeedback(message, 1600);
          this.showPlacementToast(message, toastPosition);
        }

      this.suppressNextTowerClick = true;
      this.finishTowerDrag(button, event.pointerId);
    }

    handleTowerPointerCancel(event, button) {
      if (event.pointerType === 'mouse' || TD.MobilePlacement.shouldIgnorePointer(this.dragPlacement, event.pointerId)) {
        return;
      }

      this.showFeedback('Posicionamento cancelado.');
      this.finishTowerDrag(button, event.pointerId);
    }

    startTowerDrag(button, screenPosition) {
      this.dragPlacement = TD.MobilePlacement.startDragFromTouch(this.dragPlacement);
      this.selectedTowerType = null;
      this.selectedPlacedTower = null;
      this.dragSourceButton = button;
      button.classList.add('is-dragging');
      document.body.classList.add('is-dragging-tower');
      this.dragGhostElement = TD.MobilePlacement.createDragGhostElement(
        button,
        this.dragPlacement.towerType,
        this.currentThemeId,
        document
      );
      TD.MobilePlacement.updateDragGhostElement(this.dragGhostElement, screenPosition, this.dragPlacement);
      this.updateButtons();
    }

    updateTowerDrag(screenPosition) {
      const canvasRect = this.canvas.getBoundingClientRect();
      const grid = TD.Grid.getGridConfig(this.currentTheme);

      this.dragPlacement = TD.MobilePlacement.updateDragPosition(
        this.dragPlacement,
        screenPosition,
        canvasRect,
        {
          width: CONFIG.CANVAS_WIDTH,
          height: CONFIG.CANVAS_HEIGHT
        },
        grid,
        (position) => TD.Grid.canPlaceTowerAtSnappedPosition(this, position, this.dragPlacement.towerType)
      );

      TD.MobilePlacement.updateDragGhostElement(this.dragGhostElement, screenPosition, this.dragPlacement);

      if (this.dragPlacement.isOverCanvas) {
        this.mouse = {
          ...this.dragPlacement.canvasPosition,
          inside: true
        };
        this.placementPreview = {
          isActive: true,
          cell: this.dragPlacement.cell,
          position: this.dragPlacement.snappedPosition,
          canPlace: this.dragPlacement.canPlace,
          reason: this.dragPlacement.reason,
          towerType: this.dragPlacement.towerType
        };
        this.placement = {
          valid: this.dragPlacement.canPlace,
          reason: this.dragPlacement.reason
        };
        return;
      }

      this.mouse = { x: 0, y: 0, inside: false };
      this.placement = { valid: false, reason: null };
      this.placementPreview = createInactivePlacementPreview();
    }

    finishTowerDrag(button = this.dragSourceButton, pointerId = null) {
      if (button && pointerId !== null && typeof button.releasePointerCapture === 'function') {
        try {
          button.releasePointerCapture(pointerId);
        } catch (error) {
          // Pointer capture may already be released by the browser on cancel.
        }
      }

      this.clearDragPlacementState();
      this.updateButtons();
    }

    clearDragPlacementState() {
      TD.MobilePlacement.removeDragGhostElement(this.dragGhostElement);
      this.dragGhostElement = null;

      if (this.dragSourceButton) {
        this.dragSourceButton.classList.remove('is-dragging');
      }

      this.dragSourceButton = null;
      document.body.classList.remove('is-dragging-tower');
      this.dragPlacement = TD.MobilePlacement.resetDragPlacement();
      this.mouse = { x: 0, y: 0, inside: false };
      this.placement = { valid: false, reason: null };
      this.placementPreview = createInactivePlacementPreview();
    }

    reset(themeId = this.currentThemeId, { clearSavedGame = false, saveAfterReset = this.appMode === 'playing' } = {}) {
      if (clearSavedGame) {
        TD.Storage.clearActiveGame();
      }

      this.clearDragPlacementState();

      const initialState = createInitialGameState(themeId, this.boardLayout);

      this.currentTheme = initialState.currentTheme;
      this.currentThemeId = initialState.currentThemeId;
      this.pathPoints = initialState.pathPoints;
      this.lives = initialState.lives;
      this.economy = new TD.Economy();
      this.waveNumber = initialState.waveNumber;
      this.currentWave = null;
      this.towers = initialState.towers;
      this.enemies = initialState.enemies;
      this.projectiles = initialState.projectiles;
      this.effects = initialState.effects;
      this.upgrades = initialState.upgrades;
      this.cardChoice = initialState.cardChoice;
      TD.clearTowerSelections(this);
      this.hoveredTower = null;
      this.mouse = { x: 0, y: 0, inside: false };
      this.placement = { valid: false, reason: null };
      this.placementPreview = createInactivePlacementPreview();
      this.placementToast = null;
      this.feedback = this.getPrimaryInstruction();
      this.feedbackTimer = 0;
      this.gameOver = false;
      this.completedWave = 0;
      this.waveStartLives = this.lives;
      this.autoSaveTimer = 0;
      this.records = TD.Storage.getRecords(this.currentThemeId);

      this.applyTheme(this.currentThemeId);
      this.elements.overlay.classList.add('hidden');
      this.updateThemeLabels();
      this.renderCardChoice();
      this.updateHud();
      this.updateButtons();

      if (saveAfterReset) {
        this.persistGameState({ force: true });
      }
    }

    restartGame() {
      this.reset(this.currentThemeId, {
        clearSavedGame: true,
        saveAfterReset: this.appMode === 'playing'
      });
    }

    showGameScreen() {
      this.appMode = 'playing';
      this.elements.modeMenu.classList.add('is-hidden');
      this.elements.gameApp.classList.remove('is-hidden');
      this.refreshIcons();
    }

    createSaveSnapshot() {
      return {
        appMode: 'playing',
        themeId: this.currentThemeId,
        layout: this.boardLayout,
        board: {
          width: CONFIG.CANVAS_WIDTH,
          height: CONFIG.CANVAS_HEIGHT
        },
        lives: this.lives,
        waveNumber: this.waveNumber,
        completedWave: this.completedWave,
        waveStartLives: this.waveStartLives,
        economy: {
          money: this.economy.money,
          score: this.economy.score
        },
        upgrades: this.upgrades,
        cardChoice: {
          ...this.cardChoice,
          choices: (this.cardChoice?.choices || []).map((card) => card.id)
        },
        selectedPlacedTowerId: this.selectedPlacedTower?.id || null,
        towers: this.towers.map(serializeTower),
        currentWave: serializeWave(this.currentWave),
        enemies: this.currentWave ? this.enemies.map(serializeEnemy) : []
      };
    }

    persistGameState({ force = false } = {}) {
      if (this.appMode !== 'playing' || this.gameOver) {
        return false;
      }

      if (!force && this.autoSaveTimer < 1200) {
        return false;
      }

      this.autoSaveTimer = 0;
      return TD.Storage.saveActiveGame(this.createSaveSnapshot());
    }

    restoreSavedGame(snapshot = TD.Storage.getActiveGame()) {
      if (!snapshot) {
        return false;
      }

      this.clearDragPlacementState();

      const theme = TD.getThemeById(snapshot.themeId);
      const pathPoints = TD.getThemePath(theme.id, this.boardLayout);
      const savedWidth = readFiniteNumber(snapshot.board?.width, CONFIG.CANVAS_WIDTH);
      const savedHeight = readFiniteNumber(snapshot.board?.height, CONFIG.CANVAS_HEIGHT);
      const scaleX = savedWidth > 0 ? CONFIG.CANVAS_WIDTH / savedWidth : 1;
      const scaleY = savedHeight > 0 ? CONFIG.CANVAS_HEIGHT / savedHeight : 1;

      this.currentTheme = theme;
      this.currentThemeId = theme.id;
      this.pathPoints = pathPoints;
      this.lives = Math.max(0, readPositiveInteger(snapshot.lives, CONFIG.INITIAL_LIVES));
      this.waveNumber = Math.max(1, readPositiveInteger(snapshot.waveNumber, 1));
      this.completedWave = Math.max(0, readPositiveInteger(snapshot.completedWave, 0));
      this.waveStartLives = Math.max(0, readPositiveInteger(snapshot.waveStartLives, this.lives));
      this.economy = new TD.Economy({
        initialMoney: Math.max(0, readFiniteNumber(snapshot.economy?.money, CONFIG.INITIAL_MONEY)),
        initialScore: Math.max(0, readFiniteNumber(snapshot.economy?.score, CONFIG.INITIAL_SCORE))
      });
      this.upgrades = TD.createUpgradeState(snapshot.upgrades || {});
      this.towers = Array.isArray(snapshot.towers)
        ? snapshot.towers
          .map((tower) => hydrateTower(tower, this.currentThemeId, scaleX, scaleY))
          .filter(Boolean)
        : [];
      this.currentWave = hydrateWave(snapshot.currentWave, pathPoints);
      this.enemies = this.currentWave && Array.isArray(snapshot.enemies)
        ? snapshot.enemies
          .map((enemy) => hydrateEnemy(enemy, pathPoints))
          .filter((enemy) => enemy && !enemy.isDead() && !enemy.hasReachedEnd())
        : [];
      this.projectiles = [];
      this.effects = [];
      const savedChoice = snapshot.cardChoice || {};
      this.cardChoice = TD.createCardChoiceState({
        ...savedChoice,
        choices: Array.isArray(savedChoice.choices)
          ? savedChoice.choices.map((cardId) => TD.getCardById(cardId)).filter(Boolean)
          : []
      });
      this.selectedTowerType = null;
      this.selectedPlacedTower = this.towers.find((tower) => tower.id === snapshot.selectedPlacedTowerId) || null;
      this.hoveredTower = null;
      this.mouse = { x: 0, y: 0, inside: false };
      this.placement = { valid: false, reason: null };
      this.placementPreview = createInactivePlacementPreview();
      this.feedback = this.currentWave
        ? `${this.currentTheme.labels.wave} ${this.currentWave.number} restaurada.`
        : 'Partida restaurada.';
      this.feedbackTimer = 1800;
      this.gameOver = false;
      this.autoSaveTimer = 0;
      this.records = TD.Storage.getRecords(this.currentThemeId);

      TD.Storage.setLastTheme(this.currentThemeId);
      this.applyTheme(this.currentThemeId);
      this.elements.overlay.classList.add('hidden');
      this.updateThemeLabels();
      this.showGameScreen();
      this.renderCardChoice();
      this.updateHud();
      this.updateButtons();
      this.persistGameState({ force: true });

      return true;
    }

    isCardChoiceOpen() {
      return Boolean(this.cardChoice?.isOpen);
    }

    getCardChoiceTitle() {
      return this.currentThemeId === 'medieval'
        ? 'Escolha uma bênção'
        : 'Escolha um protocolo';
    }

    setCardChoiceScrollLock(isLocked) {
      document.documentElement?.classList.toggle('card-choice-lock', isLocked);
      document.body?.classList.toggle('card-choice-lock', isLocked);
    }

    resetCardChoiceScroll() {
      const overlay = this.elements.cardChoiceOverlay;
      const panel = overlay?.querySelector('.card-choice-panel');

      if (overlay) {
        overlay.scrollTop = 0;
      }

      if (panel) {
        panel.scrollTop = 0;
      }
    }

    renderCardChoice() {
      if (!this.elements.cardChoiceOverlay || !this.elements.cardChoiceGrid) {
        return;
      }

      const isOpen = this.isCardChoiceOpen();
      const didOpen = isOpen && !this.cardChoiceRenderedOpen;
      this.elements.cardChoiceOverlay.classList.toggle('is-hidden', !isOpen);
      this.elements.cardChoiceOverlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      this.setCardChoiceScrollLock(isOpen);

      if (!isOpen) {
        this.elements.cardChoiceGrid.innerHTML = '';
        this.cardChoiceRenderedOpen = false;
        return;
      }

      if (didOpen) {
        this.resetCardChoiceScroll();
      }

      this.elements.cardChoiceTitle.textContent = this.getCardChoiceTitle();
      this.elements.cardChoiceSubtitle.textContent = 'A cada 3 ondas, escolha uma carta para fortalecer sua defesa.';
      this.elements.cardChoiceGrid.innerHTML = this.cardChoice.choices.map((card) => {
        const display = TD.getCardDisplayData(card, this.currentThemeId);
        const rarityIcon = {
          common: 'diamond',
          rare: 'sparkle',
          epic: 'sparkles'
        }[display.rarity] || 'diamond';

        return `
          <article class="upgrade-card rarity-${display.rarity}">
            <div class="upgrade-card-main">
              <span class="upgrade-card-topline">
                <span class="upgrade-card-rarity">
                  <i data-lucide="${rarityIcon}" aria-hidden="true"></i>
                  ${display.rarityLabel}
                </span>
                <span class="upgrade-card-category">${display.categoryLabel}</span>
              </span>
              <span class="upgrade-card-icon" aria-hidden="true">
                <i data-lucide="${display.icon}"></i>
              </span>
              <h3>${display.name}</h3>
              <p class="upgrade-card-description">${display.description}</p>
              <p class="upgrade-card-flavor">${display.flavor}</p>
            </div>
            <button class="upgrade-card-action" type="button" data-card-id="${display.id}" aria-label="Escolher ${display.name}">
              <span>Escolher</span>
              <i data-lucide="chevron-right" aria-hidden="true"></i>
            </button>
          </article>
        `;
      }).join('');
      this.refreshIcons();

      if (didOpen) {
        requestAnimationFrame(() => this.resetCardChoiceScroll());
      }

      this.cardChoiceRenderedOpen = true;
    }

    openCardChoiceForWave(completedWave) {
      const result = TD.openCardChoice(this.cardChoice, completedWave, TD.UPGRADE_CARDS, Math.random);

      if (!result.opened) {
        return false;
      }

      this.clearDragPlacementState();
      this.showFeedback('Escolha uma melhoria para continuar fortalecendo sua defesa.');
      this.renderCardChoice();
      this.updateButtons();
      this.persistGameState({ force: true });
      return true;
    }

    chooseUpgradeCard(cardId) {
      const choice = TD.chooseCard(this.cardChoice, cardId);

      if (!choice.chosen) {
        return choice;
      }

      const result = TD.applyCardUpgrade(this, choice.cardId);
      const display = TD.getCardDisplayData(choice.cardId, this.currentThemeId);

      this.showFeedback(`${display.name} aplicada.`);
      this.updateThemeLabels();
      this.renderCardChoice();
      this.updateHud();
      this.updateButtons();
      this.persistGameState({ force: true });
      this.ensureLoop();
      return result;
    }

    getBoardLayout() {
      return this.boardMediaQuery.matches ? 'mobile' : 'desktop';
    }

    applyBoardLayout(layout) {
      const profile = CONFIG.CANVAS_LAYOUTS[layout] || CONFIG.CANVAS_LAYOUTS.desktop;
      const desktopProfile = CONFIG.CANVAS_LAYOUTS.desktop;

      CONFIG.CURRENT_LAYOUT = layout;
      CONFIG.CANVAS_WIDTH = profile.width;
      CONFIG.CANVAS_HEIGHT = profile.height;
      CONFIG.PATH_WIDTH = profile.pathWidth || desktopProfile.pathWidth;
      CONFIG.TOWER_RADIUS = profile.towerRadius || desktopProfile.towerRadius;
      CONFIG.PLACEMENT_PADDING = profile.placementPadding || desktopProfile.placementPadding;
      CONFIG.ENEMY_RADIUS_SCALE = profile.enemyRadiusScale || desktopProfile.enemyRadiusScale;
      CONFIG.TOWER_HIT_SLOP = profile.towerHitSlop || desktopProfile.towerHitSlop;
      CONFIG.MAP_HINT_FONT_SIZE = profile.mapHintFontSize || desktopProfile.mapHintFontSize;
      this.canvas.width = profile.width;
      this.canvas.height = profile.height;
      this.canvas.dataset.boardLayout = layout;
    }

    handleBoardLayoutChange() {
      const nextLayout = this.getBoardLayout();

      if (nextLayout === this.boardLayout) {
        return;
      }

      this.boardLayout = nextLayout;
      if (this.boardFocusActive) {
        this.exitBoardFocus();
      }
      this.applyBoardLayout(nextLayout);
      this.reset(this.currentThemeId, { saveAfterReset: false });

      if (this.appMode === 'playing') {
        this.showFeedback('Mapa ajustado para o tamanho da tela.');
      }
    }

    applyTheme(themeId) {
      const theme = TD.getThemeById(themeId);
      document.body.classList.remove('theme-futuristic', 'theme-medieval');
      document.body.classList.add(theme.bodyClass);

      this.elements.modeButtons.forEach((button) => {
        button.classList.toggle('is-last', button.dataset.themeChoice === TD.Storage.getLastTheme());
      });
    }

    startGameWithTheme(themeId) {
      TD.Storage.setLastTheme(themeId);
      this.showGameScreen();
      this.reset(themeId, { clearSavedGame: true, saveAfterReset: true });
    }

    returnToMenu() {
      this.appMode = 'menu';
      this.exitBoardFocus();
      TD.Storage.clearActiveGame();
      this.reset(this.currentThemeId, { clearSavedGame: true, saveAfterReset: false });
      this.elements.gameApp.classList.add('is-hidden');
      this.elements.modeMenu.classList.remove('is-hidden');
      this.elements.overlay.classList.add('hidden');
      this.refreshIcons();
    }

    showModeMenu() {
      this.appMode = 'menu';
      this.applyTheme(this.currentThemeId);
      this.elements.gameApp.classList.add('is-hidden');
      this.elements.modeMenu.classList.remove('is-hidden');
    }

    toggleSidebar() {
      if (this.boardFocusActive) {
        this.exitBoardFocus();
        return;
      }

      const collapsed = !this.elements.controlPanel.classList.contains('is-collapsed');

      this.setSidebarCollapsed(collapsed);
    }

    setSidebarCollapsed(collapsed) {
      const label = this.boardFocusActive
        ? 'Sair da tela cheia'
        : collapsed
          ? 'Expandir painel de controle'
          : 'Minimizar painel de controle';
      const title = this.boardFocusActive
        ? 'Sair da tela cheia'
        : collapsed
          ? 'Expandir painel'
          : 'Minimizar painel';

      this.elements.controlPanel.classList.toggle('is-collapsed', collapsed);
      this.elements.gameLayout.classList.toggle('sidebar-collapsed', collapsed);
      this.elements.toggleSidebar.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      this.elements.toggleSidebar.setAttribute('aria-label', label);
      this.elements.toggleSidebar.title = title;
      this.updateSidebarToggleIcon(collapsed);
    }

    getSidebarToggleIcon(collapsed) {
      if (this.boardFocusActive) {
        return 'minimize-2';
      }

      if (this.sidebarMediaQuery.matches) {
        return collapsed ? 'chevron-down' : 'chevron-up';
      }

      return collapsed ? 'panel-right-open' : 'panel-right-close';
    }

    updateSidebarToggleIcon(collapsed = this.elements.controlPanel.classList.contains('is-collapsed')) {
      const icon = this.getSidebarToggleIcon(collapsed);

      if (this.elements.toggleSidebar.dataset.currentIcon === icon) {
        return;
      }

      this.elements.toggleSidebar.dataset.currentIcon = icon;
      this.elements.toggleSidebar.innerHTML = `<i data-lucide="${icon}"></i>`;
      this.refreshIcons();
    }

    toggleBoardFocus() {
      if (this.boardFocusActive) {
        this.exitBoardFocus();
      } else {
        this.enterBoardFocus();
      }
    }

    enterBoardFocus() {
      if (!this.boardMediaQuery.matches || this.appMode !== 'playing') {
        return;
      }

      this.boardFocusActive = true;
      this.boardFocusPreviousSidebarCollapsed = this.elements.controlPanel.classList.contains('is-collapsed');
      this.elements.gameApp.classList.add('board-focus-active');
      document.body.classList.add('board-focus-lock');
      this.setSidebarCollapsed(true);
      this.updateBoardFocusButton();
    }

    exitBoardFocus() {
      if (!this.boardFocusActive) {
        return;
      }

      const shouldRestoreSidebar = this.boardFocusPreviousSidebarCollapsed !== null;

      this.boardFocusActive = false;
      this.elements.gameApp.classList.remove('board-focus-active');
      document.body.classList.remove('board-focus-lock');

      if (shouldRestoreSidebar) {
        this.setSidebarCollapsed(this.boardFocusPreviousSidebarCollapsed);
      } else {
        this.updateSidebarToggleIcon();
      }

      this.boardFocusPreviousSidebarCollapsed = null;
      this.updateBoardFocusButton();
    }

    updateBoardFocusButton() {
      const active = this.boardFocusActive;
      const icon = active ? 'minimize-2' : 'maximize-2';

      this.elements.boardFocus.setAttribute('aria-pressed', active ? 'true' : 'false');
      this.elements.boardFocus.setAttribute('aria-label', active ? 'Reduzir arena' : 'Ampliar arena');
      this.elements.boardFocus.title = active ? 'Reduzir arena' : 'Ampliar arena';
      this.elements.boardFocus.innerHTML = `<i data-lucide="${icon}"></i>`;
      this.refreshIcons();
    }

    loop(timestamp) {
      const deltaMs = Math.min(80, timestamp - (this.lastTime || timestamp));
      this.lastTime = timestamp;

      if (this.appMode === 'playing') {
        if (this.isCardChoiceOpen()) {
          this.updateFeedback(deltaMs);
          this.animationFrame = null;
          return;
        }

        this.update(deltaMs, timestamp);
        this.renderer.render(this.getRenderState(timestamp));
        this.updateHud();
        this.autoSaveTimer += deltaMs;
        this.persistGameState();
      }

      this.animationFrame = requestAnimationFrame(this.loop);
    }

    update(deltaMs, currentTime) {
      this.updateFeedback(deltaMs);

      if (this.isCardChoiceOpen()) {
        return;
      }

      this.updateMouseState();
      this.updateEffects(deltaMs);

      if (this.gameOver) {
        return;
      }

      this.spawnWaveEnemies(deltaMs);
      this.updateEnemies(deltaMs);
      this.updateTowers(deltaMs, currentTime);
      this.updateProjectiles(deltaMs);
      this.collectEnemyRewards();
      this.removeInactiveActors();
      this.checkWaveCompletion();
      this.checkGameOver();
    }

    spawnWaveEnemies(deltaMs) {
      if (!this.currentWave || !this.currentWave.active) {
        return;
      }

      this.enemies.push(...this.currentWave.update(deltaMs));
    }

    updateEnemies(deltaMs) {
      this.enemies.forEach((enemy) => {
        enemy.update(deltaMs);

        if (enemy.hasReachedEnd() && !enemy.escapeHandled) {
          const enemyInfo = TD.getThemeEnemyInfo(this.currentThemeId, enemy.type);

          enemy.escapeHandled = true;
          this.lives = Math.max(0, this.lives - enemy.leakDamage);
          this.addEffect(enemy.x, enemy.y, '#ff5f7a', 34, true);
          this.showFeedback(`${enemyInfo.name} atravessou a defesa: -${enemy.leakDamage} ${this.currentTheme.labels.life}.`);
        }
      });
    }

    updateTowers(deltaMs, currentTime) {
      this.towers.forEach((tower) => {
        const projectile = tower.update(deltaMs, currentTime, this.enemies, this.upgrades, {
          lives: this.lives
        });

        if (projectile) {
          this.projectiles.push(projectile);
        }
      });
    }

    updateProjectiles(deltaMs) {
      this.projectiles.forEach((projectile) => {
        const wasActive = projectile.active;
        projectile.update(deltaMs);

        if (wasActive && projectile.hasHit) {
          this.addEffect(projectile.x, projectile.y, projectile.color, 24, false);
        }
      });
    }

    collectEnemyRewards() {
      this.enemies.forEach((enemy) => {
        if (enemy.isDead() && !enemy.markedForReward) {
          enemy.markedForReward = true;
          this.economy.rewardEnemy(enemy, this.upgrades);
          this.effects.push(TD.Effects.createEnemyDeathEffect(enemy, this.currentTheme));
        }
      });
    }

    removeInactiveActors() {
      this.enemies = this.enemies.filter((enemy) => !enemy.isDead() && !enemy.hasReachedEnd());
      this.projectiles = this.projectiles.filter((projectile) => projectile.active);
    }

    checkWaveCompletion() {
      if (!this.currentWave || !this.currentWave.isFinished(this.enemies)) {
        return;
      }

      const completedNumber = this.currentWave.number;
      const bonus = 12 + completedNumber * 3;

      this.completedWave = completedNumber;
      this.currentWave.active = false;
      this.currentWave = null;
      this.waveNumber = completedNumber + 1;
      this.economy.addMoney(bonus);
      const modifiers = this.upgrades?.modifiers || {};
      const perfectBonus = Math.max(0, modifiers.perfectWaveBonus || 0);
      const repairAmount = Math.max(0, modifiers.baseRepairEveryThreeWaves || 0);

      if (perfectBonus > 0 && this.lives >= this.waveStartLives) {
        this.economy.addMoney(perfectBonus);
      }

      if (repairAmount > 0 && completedNumber % 3 === 0) {
        this.lives += repairAmount;
      }

      this.records = TD.Storage.saveRecords({
        themeId: this.currentThemeId,
        score: this.economy.score,
        wave: this.completedWave
      });
      this.showFeedback(`${this.currentTheme.labels.wave} ${completedNumber} concluída. Bônus: ${bonus} ${this.currentTheme.labels.money}.`);
      this.openCardChoiceForWave(completedNumber);
      this.updateButtons();
      this.persistGameState({ force: true });
    }

    checkGameOver() {
      if (this.lives > 0 || this.gameOver) {
        return;
      }

      this.gameOver = true;
      TD.closeCardChoice(this.cardChoice);
      this.renderCardChoice();
      this.records = TD.Storage.saveRecords({
        themeId: this.currentThemeId,
        score: this.economy.score,
        wave: Math.max(this.completedWave, this.currentWave ? this.currentWave.number : 0)
      });
      this.elements.finalScore.textContent = TD.Utils.formatNumber(this.economy.score);
      this.elements.finalWave.textContent = String(Math.max(this.completedWave, this.currentWave ? this.currentWave.number : 0));
      this.elements.overlay.classList.remove('hidden');
      this.showFeedback(this.currentTheme.labels.gameOverText);
      this.updateButtons();
      TD.Storage.clearActiveGame();
    }

    startWave() {
      if (this.gameOver || this.currentWave || this.isCardChoiceOpen()) {
        return;
      }

      const endPadding = TD.getThemeBaseHitInset(this.currentThemeId, this.boardLayout);

      this.currentWave = new TD.Wave({
        number: this.waveNumber,
        pathPoints: this.pathPoints,
        endPadding
      });
      this.currentWave.start();
      this.waveStartLives = this.lives;
      this.showFeedback(`${this.currentTheme.labels.wave} ${this.waveNumber} iniciada. Segure a rota.`);
      this.updateButtons();
      this.persistGameState({ force: true });
    }

    selectTowerType(type) {
      if (!TOWER_TYPES[type] || this.gameOver || this.isCardChoiceOpen()) {
        return;
      }

      this.selectedTowerType = type;
      this.selectedPlacedTower = null;
      this.placementPreview = createInactivePlacementPreview();
      this.showFeedback(`${TD.getThemeTowerInfo(this.currentThemeId, type).name} selecionada. Clique no mapa para posicionar.`);
      this.updateButtons();
    }

    getRefundCurrencyLabel() {
      return this.currentTheme.labels.refundCurrency || String(this.currentTheme.labels.money || '').toLowerCase();
    }

    getSelectedTowerFeedback(tower) {
      return `${this.currentTheme.labels.selectedPlacedTower}: ${TD.getThemeTowerInfo(this.currentThemeId, tower.type).name} L${tower.level}.`;
    }

    handleCanvasClick(x, y) {
      if (this.gameOver || this.appMode !== 'playing' || this.isCardChoiceOpen()) {
        return;
      }

      if (this.selectedTowerType) {
        this.tryPlaceTower(x, y);
        return;
      }

      const tower = this.getTowerAt(x, y);

      if (tower) {
        this.selectedPlacedTower = tower;
        this.showFeedback(this.getSelectedTowerFeedback(tower));
        this.updateButtons();
        return;
      } else {
        this.selectedPlacedTower = null;
      }

      this.updateButtons();
    }

    tryPlaceTower(x, y, towerType = this.selectedTowerType, placementOverride = null) {
      if (!towerType || !TOWER_TYPES[towerType]) {
        this.showFeedback(this.getPlacementError('NO_TOWER_SELECTED'));
        return false;
      }

      const towerInfo = TD.getThemeTowerInfo(this.currentThemeId, towerType);
      const cost = TD.getEffectiveTowerCost(towerType, this.upgrades);
      const placement = placementOverride || (this.placementPreview?.isActive && this.placementPreview.towerType === towerType
        ? this.placementPreview
        : TD.Grid.getGridPlacementState(this, x, y, towerType));
      const position = placement.position || { x, y };

      if (!placement.canPlace) {
        this.showFeedback(this.getPlacementError(placement.reason));
        return false;
      }

      this.economy.spend(cost);
      const tower = new TD.Tower({
        type: towerType,
        themeId: this.currentThemeId,
        x: position.x,
        y: position.y
      });
      tower.totalInvested = cost;
      tower.gridCell = placement.cell;
      tower.gridKey = TD.Grid.getCellKey(placement.cell);
      this.towers.push(tower);
      this.selectedPlacedTower = tower;
      this.selectedTowerType = null;
      this.placementPreview = createInactivePlacementPreview();
      this.addEffect(position.x, position.y, tower.color, 30, true);
      this.showFeedback(`${towerInfo.name} posicionada.`);
      this.updateButtons();
      this.persistGameState({ force: true });
      return true;
    }

    upgradeSelectedTower() {
      const tower = this.selectedPlacedTower;

      if (!tower || this.gameOver || this.isCardChoiceOpen()) {
        return;
      }

      const cost = tower.getUpgradeCost();

      if (!this.economy.spend(cost)) {
        this.showFeedback(`${this.currentTheme.labels.money} insuficiente para melhoria. Custo: ${cost}.`);
        return;
      }

      tower.upgrade(cost);
      this.addEffect(tower.x, tower.y, tower.color, 42, true);
      this.showFeedback(`${TD.getThemeTowerInfo(this.currentThemeId, tower.type).name} melhorada para nível ${tower.level}.`);
      this.updateButtons();
      this.persistGameState({ force: true });
    }

    sellSelectedTower() {
      if (this.isCardChoiceOpen()) {
        return {
          sold: false,
          refund: 0,
          reason: 'CARD_CHOICE_OPEN'
        };
      }

      const tower = this.selectedPlacedTower;
      const result = TD.sellSelectedTower(this);

      if (!result.sold) {
        this.updateButtons();
        return result;
      }

      if (tower) {
        this.effects.push(TD.Effects.createTowerSellEffect(tower, this.currentTheme, result.refund));
      }

      this.showFeedback(`${TD.getThemeTowerInfo(this.currentThemeId, result.towerType).name} vendida por ${result.refund} ${this.getRefundCurrencyLabel()}.`);
      this.updateButtons();
      this.persistGameState({ force: true });
      return result;
    }

    cancelSelection() {
      if (this.isCardChoiceOpen()) {
        return;
      }

      this.clearDragPlacementState();
      TD.clearTowerSelections(this);
      this.showFeedback('Seleção cancelada.');
      this.updateButtons();
    }

    setMouse(mouse) {
      this.mouse = mouse;
    }

    updateMouseState() {
      if (this.dragPlacement?.isDragging) {
        return;
      }

      if (!this.mouse.inside) {
        this.hoveredTower = null;
        this.placement = { valid: false, reason: null };
        this.placementPreview = createInactivePlacementPreview();
        return;
      }

      this.hoveredTower = this.getTowerAt(this.mouse.x, this.mouse.y);

      if (this.selectedTowerType) {
        this.placementPreview = TD.Grid.getGridPlacementState(this, this.mouse.x, this.mouse.y, this.selectedTowerType);
        this.placement = {
          valid: this.placementPreview.canPlace,
          reason: this.placementPreview.reason
        };
      } else {
        this.placement = { valid: false, reason: null };
        this.placementPreview = createInactivePlacementPreview();
      }
    }

    getTowerAt(x, y) {
      return TD.getTowerAtPosition(this.towers, x, y);
    }

    getPlacementError(reason) {
      const messages = {
        path: 'Não dá para construir no caminho dos inimigos.',
        tower: 'Essa posição está muito perto de outra defesa.',
        bounds: 'Construa um pouco mais para dentro da arena.',
        PATH_BLOCKED: 'Não dá para construir no caminho dos inimigos.',
        TOWER_OCCUPIED: 'Célula ocupada por outra defesa.',
        OUT_OF_BOUNDS: 'Construa um pouco mais para dentro da arena.',
        NOT_ENOUGH_MONEY: `${this.currentTheme.labels.money} insuficiente para construir.`,
        NO_TOWER_SELECTED: 'Escolha uma defesa antes de posicionar.',
        OUTSIDE_CANVAS: 'Solte a defesa dentro da arena.',
        INVALID_CELL: 'Posição inválida para construir.'
      };

      return messages[reason] || 'Posicao invalida para construir.';
    }

    getMobilePlacementError(reason) {
      if (reason === 'NOT_ENOUGH_MONEY') {
        return this.currentThemeId === 'medieval'
          ? 'Ouro insuficiente.'
          : `${this.currentTheme.labels.money} insuficientes.`;
      }

      return 'Local inválido.';
    }

    addEffect(x, y, color, radius, behindActors) {
      this.effects.push(TD.Effects.createImpactEffect(x, y, color, radius, behindActors, {
        themeId: this.currentThemeId
      }));
    }

    updateEffects(deltaMs) {
      this.effects = TD.Effects.updateEffects(this.effects, deltaMs);
    }

    showFeedback(message, duration = 3400) {
      this.feedback = message;
      this.feedbackTimer = duration;
    }

    updateFeedback(deltaMs) {
      if (this.feedbackTimer > 0) {
        this.feedbackTimer -= deltaMs;
      }

      if (this.placementToast) {
        this.placementToast.remaining -= deltaMs;

        if (this.placementToast.remaining <= 0) {
          this.placementToast = null;
        }
      }
    }

    showPlacementToast(message, position) {
      const margin = 72;

      this.placementToast = {
        message,
        x: TD.Utils.clamp(position?.x ?? CONFIG.CANVAS_WIDTH / 2, margin, CONFIG.CANVAS_WIDTH - margin),
        y: TD.Utils.clamp((position?.y ?? CONFIG.CANVAS_HEIGHT / 2) - 54, margin, CONFIG.CANVAS_HEIGHT - margin),
        remaining: 1150,
        duration: 1150
      };
    }

    updateHud() {
      const waveLabel = this.currentWave ? this.currentWave.number : this.waveNumber;
      const selectedLabel = this.selectedTowerType
        ? `Construir: ${TD.getThemeTowerInfo(this.currentThemeId, this.selectedTowerType).name}`
        : this.selectedPlacedTower
          ? `${TD.getThemeTowerInfo(this.currentThemeId, this.selectedPlacedTower.type).name} L${this.selectedPlacedTower.level}`
          : 'Nenhuma';

      this.elements.lives.textContent = String(this.lives);
      this.elements.money.textContent = TD.Utils.formatNumber(this.economy.money);
      this.elements.wave.textContent = String(waveLabel);
      this.elements.score.textContent = TD.Utils.formatNumber(this.economy.score);
      this.elements.record.textContent = TD.Utils.formatNumber(this.records.bestScore);
      this.elements.bestWave.textContent = String(this.records.bestWave);
      this.elements.focusLives.textContent = String(this.lives);
      this.elements.focusMoney.textContent = TD.Utils.formatNumber(this.economy.money);
      this.elements.focusWave.textContent = String(waveLabel);
      this.elements.selected.textContent = selectedLabel;
      this.elements.feedback.textContent = this.feedbackTimer > 0
        ? this.feedback
        : this.getPrimaryInstruction();
      this.updateTowerAffordability();
    }

    updateSellButton() {
      const labels = this.currentTheme.labels;
      const tower = this.selectedPlacedTower;

      if (!tower) {
        this.elements.sell.disabled = true;
        this.elements.sell.querySelector('span').textContent = labels.sellAction;
        this.elements.sell.setAttribute('aria-label', labels.sellAction);
        this.elements.sell.title = 'Selecione uma defesa posicionada para vender';
        return;
      }

      const sellValue = TD.getEffectiveTowerSellValue(tower, this.upgrades);
      const text = `${labels.sellAction} (${sellValue})`;

      this.elements.sell.disabled = this.gameOver || this.isCardChoiceOpen();
      this.elements.sell.querySelector('span').textContent = text;
      this.elements.sell.setAttribute('aria-label', text);
      this.elements.sell.title = text;
    }

    updateThemeLabels() {
      const labels = this.currentTheme.labels;
      const primaryInstruction = this.getPrimaryInstruction();

      this.elements.currentModeName.textContent = this.currentTheme.shortName;
      this.elements.heroSubtitle.textContent = this.currentTheme.headerSubtitle;
      this.elements.startWave.innerHTML = `
        <i data-lucide="play"></i>
        <span>${labels.startWave}</span>
      `;
      this.elements.startWave.setAttribute('aria-label', `${labels.startWave} (Espaço)`);
      this.elements.startWave.title = `${labels.startWave} (Espaço)`;
      this.elements.restart.querySelector('span').textContent = labels.restart;
      this.elements.changeMode.querySelector('span').textContent = labels.changeMode;
      this.elements.routeTitle.textContent = labels.route;
      this.elements.boardTipText.textContent = primaryInstruction;
      this.elements.towerListTitle.textContent = labels.towers;
      this.elements.towerMiniNote.textContent = this.currentTheme.shortName;
      this.elements.gameOverTitle.textContent = labels.gameOverTitle;
      this.elements.gameOverText.textContent = labels.gameOverText;
      this.elements.gameOverMenu.querySelector('span').textContent = labels.changeMode;

      this.elements.hudLabels.forEach((element) => {
        const key = element.dataset.labelKey;
        element.textContent = labels[key] || element.textContent;
      });

      this.elements.towerDescriptions.forEach((element) => {
        const type = element.dataset.towerDescription;
        const towerInfo = TD.getThemeTowerInfo(this.currentThemeId, type);
        const stats = TOWER_TYPES[type];
        const button = element.closest('[data-tower]');
        const title = button.querySelector('[data-tower-name]');
        const icon = button.querySelector('[data-tower-icon]');
        const cost = button.querySelector('.tower-title em');
        const previewTower = { ...stats, type: stats.id };
        const effectiveCost = TD.getEffectiveTowerCost(type, this.upgrades);
        const effectiveDamage = TD.getEffectiveTowerDamage(previewTower, this.upgrades, { lives: this.lives });
        const effectiveRange = TD.getEffectiveTowerRange(previewTower, this.upgrades);

        title.textContent = towerInfo.name;
        icon.setAttribute('data-lucide', towerInfo.icon);
        cost.textContent = String(effectiveCost);
        element.textContent = `${towerInfo.description} Dano ${effectiveDamage} - alcance ${effectiveRange}.`;
        button.setAttribute('aria-label', `Selecionar ${towerInfo.name}`);
      });

      this.refreshIcons();
    }

    getPrimaryInstruction() {
      if (this.boardLayout === 'mobile' && this.currentTheme.mobileInstructions?.length) {
        return this.currentTheme.mobileInstructions[0];
      }

      return this.currentTheme.instructions[0];
    }

    updateButtons() {
      this.elements.towerButtons.forEach((button) => {
        const isSelected = button.dataset.tower === this.selectedTowerType;
        button.classList.toggle('selected', isSelected);
      });
      this.updateTowerAffordability();

      this.elements.startWave.disabled = Boolean(this.currentWave) || this.gameOver || this.isCardChoiceOpen();
      this.elements.upgrade.disabled = !this.selectedPlacedTower || this.gameOver || this.isCardChoiceOpen();

      if (this.selectedPlacedTower) {
        this.elements.upgrade.innerHTML = `
          <i data-lucide="arrow-up-circle"></i>
          <span>Melhorar (${this.selectedPlacedTower.getUpgradeCost()})</span>
        `;
        this.elements.upgrade.title = `Melhorar ${TD.getThemeTowerInfo(this.currentThemeId, this.selectedPlacedTower.type).name} para o próximo nível`;
      } else {
        this.elements.upgrade.innerHTML = `
          <i data-lucide="arrow-up-circle"></i>
          <span>Melhorar defesa</span>
        `;
        this.elements.upgrade.title = 'Selecione uma defesa posicionada para melhorar';
      }

      this.updateSellButton();
      this.refreshIcons();
    }

    updateTowerAffordability() {
      this.elements.towerButtons.forEach((button) => {
        const towerType = TOWER_TYPES[button.dataset.tower];
        const towerInfo = TD.getThemeTowerInfo(this.currentThemeId, button.dataset.tower);
        const cost = TD.getEffectiveTowerCost(button.dataset.tower, this.upgrades);
        const unavailable = towerType && !this.economy.canAfford(cost);
        const costElement = button.querySelector('.tower-title em');

        if (costElement) {
          costElement.textContent = String(cost);
        }

        button.classList.toggle('unavailable', Boolean(unavailable));
        button.disabled = this.isCardChoiceOpen();
        button.setAttribute('aria-disabled', unavailable || this.isCardChoiceOpen() ? 'true' : 'false');
        button.title = unavailable
          ? `${this.currentTheme.labels.money} insuficiente para ${towerInfo.name} (${cost})`
          : `Selecionar ${towerInfo.name} (${cost})`;
      });
    }

    refreshIcons() {
      if (global.lucide && typeof global.lucide.createIcons === 'function') {
        global.lucide.createIcons();
      }
    }

    getRenderState(timestamp = 0) {
      const activePlacementType = this.placementPreview?.towerType || this.selectedTowerType || null;
      const selectedType = activePlacementType ? TOWER_TYPES[activePlacementType] : null;
      const selectedPreviewTower = selectedType ? { ...selectedType, type: selectedType.id } : null;

      return {
        towers: this.towers,
        enemies: this.enemies,
        projectiles: this.projectiles,
        effects: this.effects,
        selectedTowerType: this.selectedTowerType,
        activePlacementType,
        dragPlacement: this.dragPlacement,
        selectedPlacedTower: this.selectedPlacedTower,
        hoveredTower: this.hoveredTower,
        mouse: this.mouse,
        placement: this.placement,
        placementPreview: this.placementPreview,
        placementToast: this.placementToast,
        grid: TD.Grid.getGridConfig(this.currentTheme),
        canAffordSelectedTower: selectedType ? this.economy.canAfford(TD.getEffectiveTowerCost(selectedType.id, this.upgrades)) : false,
        selectedTowerRange: selectedPreviewTower ? TD.getEffectiveTowerRange(selectedPreviewTower, this.upgrades) : 0,
        upgrades: this.upgrades,
        cardChoice: this.cardChoice,
        lives: this.lives,
        theme: this.currentTheme,
        pathPoints: this.pathPoints,
        waveActive: Boolean(this.currentWave),
        gameOver: this.gameOver,
        time: timestamp
      };
    }
  }

  TD.createInitialGameState = createInitialGameState;
  TD.clearTowerSelections = clearTowerSelections;
  TD.getTowerAtPosition = getTowerAtPosition;
  TD.sellSelectedTower = sellSelectedTower;
  TD.Game = Game;

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gameCanvas')) {
      global.towerDefenderGame = new Game();
    }
  });
})(globalThis);
