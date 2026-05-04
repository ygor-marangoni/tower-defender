(function deckTests(global) {
  const TD = global.TowerDefender;

  describe('Deck de upgrades', () => {
    test('deve existir um deck com pelo menos 15 cartas', () => {
      expect(TD.UPGRADE_CARDS.length).toBeGreaterThan(14);
    });

    test('toda carta deve ter id, raridade, categoria e efeito', () => {
      const validRarities = ['common', 'rare', 'epic'];
      const validCategories = ['attack', 'economy', 'defense', 'specialization', 'utility'];

      TD.UPGRADE_CARDS.forEach((card) => {
        expect(Boolean(card.id)).toBeTruthy();
        expect(validRarities.indexOf(card.rarity) >= 0).toBeTruthy();
        expect(validCategories.indexOf(card.category) >= 0).toBeTruthy();
        expect(Boolean(card.effect)).toBeTruthy();
      });
    });

    test('generateCardChoices deve retornar 3 cartas', () => {
      const choices = TD.generateCardChoices(TD.UPGRADE_CARDS, 3, () => 0.1);

      expect(choices.length).toBe(3);
    });

    test('generateCardChoices nao deve repetir carta na mesma escolha', () => {
      let index = 0;
      const rolls = [0.1, 0.1, 0.1, 0.35, 0.1, 0.65, 0.1, 0.95];
      const choices = TD.generateCardChoices(TD.UPGRADE_CARDS, 3, () => {
        const value = rolls[index % rolls.length];
        index += 1;
        return value;
      });
      const ids = choices.map((card) => card.id);

      expect(new Set(ids).size).toBe(3);
    });

    test('generateCardChoices deve respeitar raridades validas', () => {
      const choices = TD.generateCardChoices(TD.UPGRADE_CARDS, 3, () => 0.99);

      choices.forEach((card) => {
        expect(['common', 'rare', 'epic'].indexOf(card.rarity) >= 0).toBeTruthy();
      });
    });

    test('generateCardChoices deve funcionar com RNG injetavel', () => {
      let calls = 0;
      TD.generateCardChoices(TD.UPGRADE_CARDS, 3, () => {
        calls += 1;
        return 0.2;
      });

      expect(calls).toBeGreaterThan(0);
    });

    test('getCardDisplayData deve retornar nome conforme tema', () => {
      const futuristic = TD.getCardDisplayData('sharpenedProjectiles', 'futuristic');
      const medieval = TD.getCardDisplayData('sharpenedProjectiles', 'medieval');

      expect(futuristic.name).toBe('Projeteis Otimizados');
      expect(medieval.name).toBe('Pontas Afiadas');
    });

    test('display da carta deve conter raridade, descricao, categoria e icone', () => {
      const display = TD.getCardDisplayData('fasterReload', 'medieval');

      expect(display.rarity).toBe('rare');
      expect(Boolean(display.description)).toBeTruthy();
      expect(Boolean(display.categoryLabel)).toBeTruthy();
      expect(Boolean(display.icon)).toBeTruthy();
    });
  });
})(globalThis);
