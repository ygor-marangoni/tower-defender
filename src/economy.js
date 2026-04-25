(function economyModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG, TOWER_TYPES } = TD;

  class Economy {
    constructor({
      initialMoney = CONFIG.INITIAL_MONEY,
      initialScore = CONFIG.INITIAL_SCORE
    } = {}) {
      this.money = initialMoney;
      this.score = initialScore;
    }

    canAfford(amount) {
      return this.money >= amount;
    }

    spend(amount) {
      if (!this.canAfford(amount)) {
        return false;
      }

      this.money -= amount;
      return true;
    }

    addMoney(amount) {
      this.money += amount;
      return this.money;
    }

    addScore(amount) {
      this.score += amount;
      return this.score;
    }

    buyTower(type) {
      const towerType = TOWER_TYPES[type];

      if (!towerType) {
        return false;
      }

      return this.spend(towerType.cost);
    }

    rewardEnemy(enemy) {
      this.addMoney(enemy.reward);
      this.addScore(enemy.reward * 10);
    }
  }

  TD.Economy = Economy;
})(globalThis);
