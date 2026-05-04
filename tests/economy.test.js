(function economyTests(global) {
  const TD = global.TowerDefender;

  describe('Economy', () => {
    test('jogador deve iniciar com dinheiro definido', () => {
      const economy = new TD.Economy();

      expect(economy.money).toBe(150);
    });

    test('comprar torre deve reduzir dinheiro', () => {
      const economy = new TD.Economy();

      const purchased = economy.buyTower('basic');

      expect(purchased).toBeTruthy();
      expect(economy.money).toBe(100);
    });

    test('não deve comprar torre sem dinheiro suficiente', () => {
      const economy = new TD.Economy({ initialMoney: 20 });

      const purchased = economy.buyTower('heavy');

      expect(purchased).toBeFalsy();
      expect(economy.money).toBe(20);
    });

    test('matar inimigo deve adicionar recompensa', () => {
      const economy = new TD.Economy({ initialMoney: 0 });
      const enemy = new TD.Enemy({ type: 'tank' });

      economy.rewardEnemy(enemy);

      expect(economy.money).toBe(25);
      expect(economy.score).toBe(250);
    });

    test('refund de venda deve adicionar dinheiro sem afetar score', () => {
      const economy = new TD.Economy({ initialMoney: 100, initialScore: 80 });

      const money = economy.refundMoney(35);

      expect(money).toBe(135);
      expect(economy.money).toBe(135);
      expect(economy.score).toBe(80);
    });
  });
})(globalThis);
