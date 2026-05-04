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

    refundMoney(amount) {
      if (!Number.isFinite(amount) || amount < 0) {
        return this.money;
      }

      return this.addMoney(amount);
    }

    addScore(amount) {
      this.score += amount;
      return this.score;
    }

    buyTower(type, upgrades = null) {
      const towerType = TOWER_TYPES[type];

      if (!towerType) {
        return false;
      }

      const cost = TD.getEffectiveTowerCost ? TD.getEffectiveTowerCost(type, upgrades) : towerType.cost;
      return this.spend(cost);
    }

    rewardEnemy(enemy, upgrades = null) {
      const reward = TD.getEffectiveEnemyReward ? TD.getEffectiveEnemyReward(enemy, upgrades) : enemy.reward;

      this.addMoney(reward);
      this.addScore(reward * 10);
    }
  }

  TD.Economy = Economy;
})(globalThis);
