(function waveModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG } = TD;

  function createEnemyPlan(number) {
    const total = 5 + number + Math.floor(number / 2);
    const plan = [];

    for (let index = 0; index < total; index += 1) {
      let type = 'common';

      if (number >= 3 && index % 5 === 0) {
        type = 'tank';
      } else if (number >= 2 && index % 4 === 1) {
        type = 'fast';
      }

      plan.push(type);
    }

    return plan;
  }

  class Wave {
    constructor({
      number = 1,
      pathPoints = CONFIG.PATH_POINTS
    } = {}) {
      this.number = number;
      this.pathPoints = pathPoints;
      this.enemyPlan = createEnemyPlan(number);
      this.totalEnemies = this.enemyPlan.length;
      this.spawnedCount = 0;
      this.spawnTimer = 0;
      this.spawnInterval = Math.max(420, 900 - number * 24);
      this.active = false;
      this.healthMultiplier = Math.pow(CONFIG.WAVE_HEALTH_GROWTH, number - 1);
    }

    start() {
      this.active = true;
      this.spawnTimer = this.spawnInterval;
    }

    createEnemy(type) {
      return new TD.Enemy({
        type,
        pathPoints: this.pathPoints,
        healthMultiplier: this.healthMultiplier
      });
    }

    spawnNext() {
      if (this.spawnedCount >= this.totalEnemies) {
        return null;
      }

      const type = this.enemyPlan[this.spawnedCount];
      this.spawnedCount += 1;
      return this.createEnemy(type);
    }

    update(deltaMs) {
      const spawnedEnemies = [];

      if (!this.active) {
        return spawnedEnemies;
      }

      this.spawnTimer += deltaMs;

      while (this.spawnTimer >= this.spawnInterval && this.spawnedCount < this.totalEnemies) {
        this.spawnTimer -= this.spawnInterval;
        spawnedEnemies.push(this.spawnNext());
      }

      return spawnedEnemies;
    }

    isFinished(activeEnemies) {
      return (
        this.active &&
        this.spawnedCount >= this.totalEnemies &&
        activeEnemies.every((enemy) => enemy.isDead() || enemy.hasReachedEnd())
      );
    }
  }

  TD.createEnemyPlan = createEnemyPlan;
  TD.Wave = Wave;
})(globalThis);
