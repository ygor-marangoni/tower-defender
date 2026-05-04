(function cardChoiceTests(global) {
  const TD = global.TowerDefender;

  describe('Escolha de cartas entre ondas', () => {
    test('ao terminar onda 3 deve abrir escolha de cartas', () => {
      const cardChoice = TD.createCardChoiceState();

      expect(TD.shouldOpenCardChoiceAfterWave(3, cardChoice)).toBeTruthy();
    });

    test('ao terminar onda 2 nao deve abrir escolha', () => {
      const cardChoice = TD.createCardChoiceState();

      expect(TD.shouldOpenCardChoiceAfterWave(2, cardChoice)).toBeFalsy();
    });

    test('ao terminar onda 6 deve abrir escolha', () => {
      const cardChoice = TD.createCardChoiceState();

      expect(TD.shouldOpenCardChoiceAfterWave(6, cardChoice)).toBeTruthy();
    });

    test('nao deve abrir escolha duas vezes para a mesma onda', () => {
      const cardChoice = TD.createCardChoiceState();

      TD.openCardChoice(cardChoice, 3, TD.UPGRADE_CARDS, () => 0.1);

      expect(TD.shouldOpenCardChoiceAfterWave(3, cardChoice)).toBeFalsy();
    });

    test('abrir escolha deve gerar 3 opcoes', () => {
      const cardChoice = TD.createCardChoiceState();

      TD.openCardChoice(cardChoice, 3, TD.UPGRADE_CARDS, () => 0.1);

      expect(cardChoice.isOpen).toBeTruthy();
      expect(cardChoice.choices.length).toBe(3);
      expect(cardChoice.triggeredForWave).toBe(3);
    });

    test('escolher uma carta deve fechar escolha e registrar carta escolhida', () => {
      const cardChoice = TD.createCardChoiceState();

      TD.openCardChoice(cardChoice, 3, TD.UPGRADE_CARDS, () => 0.1);
      const chosenId = cardChoice.choices[0].id;
      const result = TD.chooseCard(cardChoice, chosenId);

      expect(result.chosen).toBeTruthy();
      expect(cardChoice.isOpen).toBeFalsy();
      expect(cardChoice.chosenCards[0]).toBe(chosenId);
    });

    test('reiniciar estado deve limpar escolhas e upgrades', () => {
      const initialState = TD.createInitialGameState('futuristic');

      expect(initialState.cardChoice.isOpen).toBeFalsy();
      expect(initialState.cardChoice.chosenCards.length).toBe(0);
      expect(initialState.upgrades.chosenCards.length).toBe(0);
    });

    test('trocar tema deve iniciar escolhas e upgrades limpos', () => {
      const initialState = TD.createInitialGameState('medieval');

      expect(initialState.currentThemeId).toBe('medieval');
      expect(initialState.cardChoice.choices.length).toBe(0);
      expect(initialState.upgrades.chosenCards.length).toBe(0);
    });
  });
})(globalThis);
