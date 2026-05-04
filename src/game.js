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
        button.addEventListener('click', () => this.selectTowerType(button.dataset.tower));
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
        const cardButton = event.target.closest('[data-card-id]');

        if (cardButton) {
          this.chooseUpgradeCard(cardButton.dataset.cardId);
        }
      });
      global.addEventListener('beforeunload', () => this.persistGameState({ force: true }));
    }

    reset(themeId = this.currentThemeId, { clearSavedGame = false, saveAfterReset = this.appMode === 'playing' } = {}) {
      if (clearSavedGame) {
        TD.Storage.clearActiveGame();
      }

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
      this.feedback = this.currentTheme.instructions[0];
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
        ? 'Escolha uma bencao do reino'
        : 'Escolha um protocolo';
    }

    renderCardChoice() {
      if (!this.elements.cardChoiceOverlay || !this.elements.cardChoiceGrid) {
        return;
      }

      const isOpen = this.isCardChoiceOpen();
      this.elements.cardChoiceOverlay.classList.toggle('is-hidden', !isOpen);
      this.elements.cardChoiceOverlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

      if (!isOpen) {
        this.elements.cardChoiceGrid.innerHTML = '';
        return;
      }

      this.elements.cardChoiceTitle.textContent = this.getCardChoiceTitle();
      this.elements.cardChoiceSubtitle.textContent = 'A cada 3 ondas, escolha uma carta para fortalecer sua defesa.';
      this.elements.cardChoiceGrid.innerHTML = this.cardChoice.choices.map((card) => {
        const display = TD.getCardDisplayData(card, this.currentThemeId);

        return `
          <button class="upgrade-card rarity-${display.rarity}" type="button" data-card-id="${display.id}">
            <span class="upgrade-card-topline">
              <span class="upgrade-card-rarity">${display.rarityLabel}</span>
              <span class="upgrade-card-category">${display.categoryLabel}</span>
            </span>
            <span class="upgrade-card-icon" aria-hidden="true">
              <i data-lucide="${display.icon}"></i>
            </span>
            <strong>${display.name}</strong>
            <span class="upgrade-card-description">${display.description}</span>
            <small>${display.flavor}</small>
            <span class="upgrade-card-action">Escolher</span>
          </button>
        `;
      }).join('');
      this.refreshIcons();
    }

    openCardChoiceForWave(completedWave) {
      const result = TD.openCardChoice(this.cardChoice, completedWave, TD.UPGRADE_CARDS, Math.random);

      if (!result.opened) {
        return false;
      }

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

      const tower = this.getTowerAt(x, y);

      if (this.selectedTowerType) {
        if (tower) {
          this.selectedTowerType = null;
          this.selectedPlacedTower = tower;
          this.showFeedback(this.getSelectedTowerFeedback(tower));
          this.updateButtons();
          return;
        }

        this.tryPlaceTower(x, y);
        return;
      }

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

    tryPlaceTower(x, y) {
      const towerInfo = TD.getThemeTowerInfo(this.currentThemeId, this.selectedTowerType);
      const cost = TD.getEffectiveTowerCost(this.selectedTowerType, this.upgrades);

      if (!this.economy.canAfford(cost)) {
        this.showFeedback(`${this.currentTheme.labels.money} insuficiente para ${towerInfo.name}.`);
        return false;
      }

      const placement = TD.Collision.canPlaceTower({
        x,
        y,
        towers: this.towers,
        pathPoints: this.pathPoints
      });

      if (!placement.valid) {
        this.showFeedback(this.getPlacementError(placement.reason));
        return false;
      }

      this.economy.spend(cost);
      const tower = new TD.Tower({
        type: this.selectedTowerType,
        themeId: this.currentThemeId,
        x,
        y
      });
      tower.totalInvested = cost;
      this.towers.push(tower);
      this.selectedPlacedTower = tower;
      this.selectedTowerType = null;
      this.addEffect(x, y, tower.color, 30, true);
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

      TD.clearTowerSelections(this);
      this.showFeedback('Seleção cancelada.');
      this.updateButtons();
    }

    setMouse(mouse) {
      this.mouse = mouse;
    }

    updateMouseState() {
      if (!this.mouse.inside) {
        this.hoveredTower = null;
        this.placement = { valid: false, reason: null };
        return;
      }

      this.hoveredTower = this.getTowerAt(this.mouse.x, this.mouse.y);

      if (this.selectedTowerType) {
        this.placement = TD.Collision.canPlaceTower({
          x: this.mouse.x,
          y: this.mouse.y,
          towers: this.towers,
          pathPoints: this.pathPoints
        });
      } else {
        this.placement = { valid: false, reason: null };
      }
    }

    getTowerAt(x, y) {
      return TD.getTowerAtPosition(this.towers, x, y);
    }

    getPlacementError(reason) {
      const messages = {
        path: 'Não dá para construir no caminho dos inimigos.',
        tower: 'Essa posição está muito perto de outra defesa.',
        bounds: 'Construa um pouco mais para dentro da arena.'
      };

      return messages[reason] || 'Posicao invalida para construir.';
    }

    addEffect(x, y, color, radius, behindActors) {
      this.effects.push(TD.Effects.createImpactEffect(x, y, color, radius, behindActors, {
        themeId: this.currentThemeId
      }));
    }

    updateEffects(deltaMs) {
      this.effects = TD.Effects.updateEffects(this.effects, deltaMs);
    }

    showFeedback(message) {
      this.feedback = message;
      this.feedbackTimer = 3400;
    }

    updateFeedback(deltaMs) {
      if (this.feedbackTimer > 0) {
        this.feedbackTimer -= deltaMs;
      }
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
        : this.currentTheme.instructions[0];
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
      this.elements.boardTipText.textContent = this.currentTheme.instructions[0];
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
      const selectedType = this.selectedTowerType ? TOWER_TYPES[this.selectedTowerType] : null;
      const selectedPreviewTower = selectedType ? { ...selectedType, type: selectedType.id } : null;

      return {
        towers: this.towers,
        enemies: this.enemies,
        projectiles: this.projectiles,
        effects: this.effects,
        selectedTowerType: this.selectedTowerType,
        selectedPlacedTower: this.selectedPlacedTower,
        hoveredTower: this.hoveredTower,
        mouse: this.mouse,
        placement: this.placement,
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
