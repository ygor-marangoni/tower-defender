(function inputModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG } = TD;

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
      if (event.key === 'Escape') {
        this.game.cancelSelection();
      }
    }
  }

  TD.InputController = InputController;
})(globalThis);
