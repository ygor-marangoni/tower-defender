(function inputModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG } = TD;
  const TOWER_SHORTCUTS = {
    q: 'basic',
    w: 'rapid',
    e: 'heavy'
  };

  function isEditableTarget(target) {
    if (!target || typeof target !== 'object') {
      return false;
    }

    if (target.isContentEditable) {
      return true;
    }

    const tagName = typeof target.tagName === 'string' ? target.tagName.toLowerCase() : '';
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  }

  class InputController {
    constructor(canvas, game) {
      this.canvas = canvas;
      this.game = game;
      this.boundMove = this.handleMouseMove.bind(this);
      this.boundLeave = this.handleMouseLeave.bind(this);
      this.boundClick = this.handleClick.bind(this);
      this.boundKeyDown = this.handleKeyDown.bind(this);
      this.bind();
    }

    bind() {
      this.canvas.addEventListener('mousemove', this.boundMove);
      this.canvas.addEventListener('mouseleave', this.boundLeave);
      this.canvas.addEventListener('click', this.boundClick);
      global.addEventListener('keydown', this.boundKeyDown);
    }

    destroy() {
      this.canvas.removeEventListener('mousemove', this.boundMove);
      this.canvas.removeEventListener('mouseleave', this.boundLeave);
      this.canvas.removeEventListener('click', this.boundClick);
      global.removeEventListener('keydown', this.boundKeyDown);
    }

    getCanvasPoint(event) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
      const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;

      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    }

    handleMouseMove(event) {
      this.game.setMouse({
        ...this.getCanvasPoint(event),
        inside: true
      });
    }

    handleMouseLeave() {
      this.game.setMouse({
        x: 0,
        y: 0,
        inside: false
      });
    }

    handleClick(event) {
      const point = this.getCanvasPoint(event);
      this.game.handleCanvasClick(point.x, point.y);
    }

    handleKeyDown(event) {
      if (!this.game || isEditableTarget(event.target) || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const key = String(event.key || '').toLowerCase();

      if (key === 'escape') {
        if (this.game.appMode !== 'playing') {
          return;
        }

        event.preventDefault();
        this.game.cancelSelection();
        return;
      }

      if (this.game.appMode !== 'playing') {
        return;
      }

      if (TOWER_SHORTCUTS[key]) {
        event.preventDefault();
        this.game.selectTowerType(TOWER_SHORTCUTS[key]);
        return;
      }

      if (key === ' ' || key === 'spacebar') {
        event.preventDefault();
        this.game.startWave();
        return;
      }

      if (key === 'r') {
        event.preventDefault();
        this.game.upgradeSelectedTower();
        return;
      }

      if (key === 'v') {
        event.preventDefault();
        this.game.sellSelectedTower();
      }
    }
  }

  TD.InputController = InputController;
})(globalThis);
