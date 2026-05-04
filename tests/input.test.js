(function inputTests(global) {
  const TD = global.TowerDefender;

  function createCanvasStub() {
    return {
      addEventListener() {},
      removeEventListener() {},
      getBoundingClientRect() {
        return {
          left: 0,
          top: 0,
          width: TD.CONFIG.CANVAS_WIDTH,
          height: TD.CONFIG.CANVAS_HEIGHT
        };
      }
    };
  }

  function createKeyboardEvent(key, overrides = {}) {
    let prevented = false;

    return {
      key,
      target: overrides.target || document.body,
      repeat: Boolean(overrides.repeat),
      altKey: Boolean(overrides.altKey),
      ctrlKey: Boolean(overrides.ctrlKey),
      metaKey: Boolean(overrides.metaKey),
      preventDefault() {
        prevented = true;
      },
      wasPrevented() {
        return prevented;
      }
    };
  }

  function createGameStub() {
    return {
      appMode: 'playing',
      selected: [],
      selectTowerType(type) {
        this.selected.push(type);
      },
      upgradeCount: 0,
      upgradeSelectedTower() {
        this.upgradeCount += 1;
      },
      sellCount: 0,
      sellSelectedTower() {
        this.sellCount += 1;
      },
      startWaveCount: 0,
      startWave() {
        this.startWaveCount += 1;
      },
      cancelCount: 0,
      cancelSelection() {
        this.cancelCount += 1;
      }
    };
  }

  describe('InputController keyboard shortcuts', () => {
    test('Q, W e E devem selecionar torres basic, rapid e heavy', () => {
      const game = createGameStub();
      const controller = new TD.InputController(createCanvasStub(), game);

      try {
        controller.handleKeyDown(createKeyboardEvent('q'));
        controller.handleKeyDown(createKeyboardEvent('W'));
        controller.handleKeyDown(createKeyboardEvent('e'));

        expect(game.selected).toEqual(['basic', 'rapid', 'heavy']);
      } finally {
        controller.destroy();
      }
    });

    test('R deve acionar upgrade da torre selecionada', () => {
      const game = createGameStub();
      const controller = new TD.InputController(createCanvasStub(), game);

      try {
        const event = createKeyboardEvent('r');
        controller.handleKeyDown(event);

        expect(game.upgradeCount).toBe(1);
        expect(event.wasPrevented()).toBe(true);
      } finally {
        controller.destroy();
      }
    });

    test('V deve acionar venda da torre selecionada', () => {
      const game = createGameStub();
      const controller = new TD.InputController(createCanvasStub(), game);

      try {
        const event = createKeyboardEvent('v');
        controller.handleKeyDown(event);

        expect(game.sellCount).toBe(1);
        expect(event.wasPrevented()).toBe(true);
      } finally {
        controller.destroy();
      }
    });

    test('Espaco deve iniciar a proxima onda', () => {
      const game = createGameStub();
      const controller = new TD.InputController(createCanvasStub(), game);

      try {
        const event = createKeyboardEvent(' ');
        controller.handleKeyDown(event);

        expect(game.startWaveCount).toBe(1);
        expect(event.wasPrevented()).toBe(true);
      } finally {
        controller.destroy();
      }
    });

    test('Escape deve cancelar selecao durante a partida', () => {
      const game = createGameStub();
      const controller = new TD.InputController(createCanvasStub(), game);

      try {
        const event = createKeyboardEvent('Escape');
        controller.handleKeyDown(event);

        expect(game.cancelCount).toBe(1);
        expect(event.wasPrevented()).toBe(true);
      } finally {
        controller.destroy();
      }
    });

    test('atalhos devem ser ignorados fora do modo de jogo', () => {
      const game = createGameStub();
      game.appMode = 'menu';
      const controller = new TD.InputController(createCanvasStub(), game);

      try {
        controller.handleKeyDown(createKeyboardEvent('q'));
        controller.handleKeyDown(createKeyboardEvent('r'));
        controller.handleKeyDown(createKeyboardEvent('v'));
        controller.handleKeyDown(createKeyboardEvent(' '));
        controller.handleKeyDown(createKeyboardEvent('Escape'));

        expect(game.selected.length).toBe(0);
        expect(game.upgradeCount).toBe(0);
        expect(game.sellCount).toBe(0);
        expect(game.startWaveCount).toBe(0);
        expect(game.cancelCount).toBe(0);
      } finally {
        controller.destroy();
      }
    });

    test('atalhos devem ser ignorados em campos editaveis e repeticao', () => {
      const game = createGameStub();
      const controller = new TD.InputController(createCanvasStub(), game);

      try {
        controller.handleKeyDown(createKeyboardEvent('q', {
          target: document.createElement('input')
        }));
        controller.handleKeyDown(createKeyboardEvent('w', {
          repeat: true
        }));
        controller.handleKeyDown(createKeyboardEvent('e', {
          ctrlKey: true
        }));

        expect(game.selected.length).toBe(0);
      } finally {
        controller.destroy();
      }
    });
  });
})(globalThis);
