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
      effects: []
    };
  }

  class Game {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.renderer = new TD.Renderer(this.canvas);
      this.input = new TD.InputController(this.canvas, this);
      this.elements = this.getElements();
      this.lastTime = 0;
      this.animationFrame = null;
      this.appMode = 'menu';
      this.currentThemeId = TD.Storage.getLastTheme();
      this.currentTheme = TD.getThemeById(this.currentThemeId);
      this.boardMediaQuery = global.matchMedia('(max-width: 760px)');
      this.boardLayout = this.getBoardLayout();
      this.sidebarMediaQuery = global.matchMedia('(max-width: 1120px)');
      this.boardFocusActive = false;
      this.boardFocusPreviousSidebarCollapsed = null;
      this.applyBoardLayout(this.boardLayout);

      this.reset(this.currentThemeId);
      this.bindUI();
      this.showModeMenu();
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
        gameLayout: document.getElementById('gameLayout'),
        controlPanel: document.getElementById('controlPanel'),
        toggleSidebar: document.getElementById('toggleSidebarButton'),
        towerButtons: Array.from(document.querySelectorAll('[data-tower]')),
        overlay: document.getElementById('gameOverOverlay'),
        finalScore: document.getElementById('finalScore'),
        finalWave: document.getElementById('finalWave')
      };
    }

    bindUI() {
      this.elements.modeButtons.forEach((button) => {
        button.addEventListener('click', () => this.startGameWithTheme(button.dataset.themeChoice));
      });

      this.elements.continueButton.addEventListener('click', () => {
        this.startGameWithTheme(TD.Storage.getLastTheme());
      });

      this.elements.towerButtons.forEach((button) => {
        button.addEventListener('click', () => this.selectTowerType(button.dataset.tower));
      });

      this.elements.startWave.addEventListener('click', () => this.startWave());
      this.elements.restart.addEventListener('click', () => this.reset());
      this.elements.changeMode.addEventListener('click', () => this.returnToMenu());
      this.elements.upgrade.addEventListener('click', () => this.upgradeSelectedTower());
      this.elements.boardFocus.addEventListener('click', () => this.toggleBoardFocus());
      this.elements.toggleSidebar.addEventListener('click', () => this.toggleSidebar());
      this.boardMediaQuery.addEventListener('change', () => this.handleBoardLayoutChange());
      this.sidebarMediaQuery.addEventListener('change', () => this.updateSidebarToggleIcon());
      this.elements.overlay.addEventListener('click', (event) => {
        if (event.target.closest('[data-restart]')) {
          this.reset();
        }

        if (event.target.closest('[data-menu]')) {
          this.returnToMenu();
        }
      });
    }

    reset(themeId = this.currentThemeId) {
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
      this.selectedTowerType = null;
      this.selectedPlacedTower = null;
      this.hoveredTower = null;
      this.mouse = { x: 0, y: 0, inside: false };
      this.placement = { valid: false, reason: null };
      this.feedback = this.currentTheme.instructions[0];
      this.feedbackTimer = 0;
      this.gameOver = false;
      this.completedWave = 0;
      this.records = TD.Storage.getRecords(this.currentThemeId);

      this.applyTheme(this.currentThemeId);
      this.elements.overlay.classList.add('hidden');
      this.updateThemeLabels();
      this.updateHud();
      this.updateButtons();
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
      this.reset(this.currentThemeId);

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
      this.appMode = 'playing';
      this.elements.modeMenu.classList.add('is-hidden');
      this.elements.gameApp.classList.remove('is-hidden');
      TD.Storage.setLastTheme(themeId);
      this.reset(themeId);
    }

    returnToMenu() {
      this.appMode = 'menu';
      this.exitBoardFocus();
      this.reset(this.currentThemeId);
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
        this.renderer.render(this.getRenderState());
        this.updateHud();
      }

      this.animationFrame = requestAnimationFrame(this.loop);
    }

    update(deltaMs, currentTime) {
      this.updateMouseState();
      this.updateFeedback(deltaMs);
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
        const projectile = tower.update(deltaMs, currentTime, this.enemies);

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
          this.economy.rewardEnemy(enemy);
          this.addEffect(enemy.x, enemy.y, enemy.color, 38, false);
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
      this.records = TD.Storage.saveRecords({
        themeId: this.currentThemeId,
        score: this.economy.score,
        wave: this.completedWave
      });
      this.showFeedback(`${this.currentTheme.labels.wave} ${completedNumber} concluída. Bônus: ${bonus} ${this.currentTheme.labels.money}.`);
      this.updateButtons();
    }

    checkGameOver() {
      if (this.lives > 0 || this.gameOver) {
        return;
      }

      this.gameOver = true;
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
    }

    startWave() {
      if (this.gameOver || this.currentWave) {
        return;
      }

      this.currentWave = new TD.Wave({
        number: this.waveNumber,
        pathPoints: this.pathPoints
      });
      this.currentWave.start();
      this.showFeedback(`${this.currentTheme.labels.wave} ${this.waveNumber} iniciada. Segure a rota.`);
      this.updateButtons();
    }

    selectTowerType(type) {
      if (!TOWER_TYPES[type] || this.gameOver) {
        return;
      }

      this.selectedTowerType = type;
      this.selectedPlacedTower = null;
      this.showFeedback(`${TD.getThemeTowerInfo(this.currentThemeId, type).name} selecionada. Clique no mapa para posicionar.`);
      this.updateButtons();
    }

    handleCanvasClick(x, y) {
      if (this.gameOver || this.appMode !== 'playing') {
        return;
      }

      if (this.selectedTowerType) {
        this.tryPlaceTower(x, y);
        return;
      }

      const tower = this.getTowerAt(x, y);

      if (tower) {
        this.selectedPlacedTower = tower;
        this.showFeedback(`Defesa selecionada: ${TD.getThemeTowerInfo(this.currentThemeId, tower.type).name} L${tower.level}. Você pode melhorá-la.`);
      } else {
        this.selectedPlacedTower = null;
      }

      this.updateButtons();
    }

    tryPlaceTower(x, y) {
      const towerType = TOWER_TYPES[this.selectedTowerType];
      const towerInfo = TD.getThemeTowerInfo(this.currentThemeId, this.selectedTowerType);

      if (!this.economy.canAfford(towerType.cost)) {
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

      this.economy.buyTower(this.selectedTowerType);
      const tower = new TD.Tower({
        type: this.selectedTowerType,
        x,
        y
      });
      this.towers.push(tower);
      this.selectedPlacedTower = tower;
      this.selectedTowerType = null;
      this.addEffect(x, y, tower.color, 30, true);
      this.showFeedback(`${towerInfo.name} posicionada.`);
      this.updateButtons();
      return true;
    }

    upgradeSelectedTower() {
      const tower = this.selectedPlacedTower;

      if (!tower || this.gameOver) {
        return;
      }

      const cost = tower.getUpgradeCost();

      if (!this.economy.spend(cost)) {
        this.showFeedback(`${this.currentTheme.labels.money} insuficiente para melhoria. Custo: ${cost}.`);
        return;
      }

      tower.upgrade();
      this.addEffect(tower.x, tower.y, tower.color, 42, true);
      this.showFeedback(`${TD.getThemeTowerInfo(this.currentThemeId, tower.type).name} melhorada para nível ${tower.level}.`);
      this.updateButtons();
    }

    cancelSelection() {
      this.selectedTowerType = null;
      this.selectedPlacedTower = null;
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
      const point = { x, y };
      const candidates = this.towers
        .map((tower) => ({
          tower,
          distance: TD.Collision.distanceBetweenPoints(point, tower)
        }))
        .filter(({ tower, distance }) => distance <= tower.radius + CONFIG.TOWER_HIT_SLOP)
        .sort((a, b) => a.distance - b.distance);

      return candidates[0]?.tower || null;
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
      const particles = Array.from({ length: 10 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 10 + TD.Utils.randomBetween(-0.24, 0.24);
        const distance = TD.Utils.randomBetween(radius * 0.5, radius * 1.25);

        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: TD.Utils.randomBetween(1.5, 3.8),
          alpha: TD.Utils.randomBetween(0.35, 0.9)
        };
      });

      this.effects.push({
        x,
        y,
        color,
        radius,
        particles,
        age: 0,
        duration: 520,
        behindActors
      });
    }

    updateEffects(deltaMs) {
      this.effects.forEach((effect) => {
        effect.age += deltaMs;
      });
      this.effects = this.effects.filter((effect) => effect.age < effect.duration);
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

    updateThemeLabels() {
      const labels = this.currentTheme.labels;

      this.elements.currentModeName.textContent = this.currentTheme.shortName;
      this.elements.heroSubtitle.textContent = this.currentTheme.headerSubtitle;
      this.elements.startWave.querySelector('span').textContent = labels.startWave;
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

        title.textContent = towerInfo.name;
        icon.setAttribute('data-lucide', towerInfo.icon);
        element.textContent = `${towerInfo.description} Dano ${stats.damage} - alcance ${stats.range}.`;
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

      this.elements.startWave.disabled = Boolean(this.currentWave) || this.gameOver;
      this.elements.upgrade.disabled = !this.selectedPlacedTower || this.gameOver;

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

      this.refreshIcons();
    }

    updateTowerAffordability() {
      this.elements.towerButtons.forEach((button) => {
        const towerType = TOWER_TYPES[button.dataset.tower];
        const towerInfo = TD.getThemeTowerInfo(this.currentThemeId, button.dataset.tower);
        const unavailable = towerType && !this.economy.canAfford(towerType.cost);

        button.classList.toggle('unavailable', Boolean(unavailable));
        button.setAttribute('aria-disabled', unavailable ? 'true' : 'false');
        button.title = unavailable
          ? `${this.currentTheme.labels.money} insuficiente para ${towerInfo.name} (${towerType.cost})`
          : `Selecionar ${towerInfo.name} (${towerType.cost})`;
      });
    }

    refreshIcons() {
      if (global.lucide && typeof global.lucide.createIcons === 'function') {
        global.lucide.createIcons();
      }
    }

    getRenderState() {
      const selectedType = this.selectedTowerType ? TOWER_TYPES[this.selectedTowerType] : null;

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
        canAffordSelectedTower: selectedType ? this.economy.canAfford(selectedType.cost) : false,
        theme: this.currentTheme,
        pathPoints: this.pathPoints,
        waveActive: Boolean(this.currentWave),
        gameOver: this.gameOver
      };
    }
  }

  TD.createInitialGameState = createInitialGameState;
  TD.Game = Game;

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gameCanvas')) {
      global.towerDefenderGame = new Game();
    }
  });
})(globalThis);
