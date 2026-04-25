(function enemyModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG, ENEMY_TYPES } = TD;

  class Enemy {
    constructor({
      type = 'common',
      pathPoints = CONFIG.PATH_POINTS,
      healthMultiplier = 1
    } = {}) {
      const stats = ENEMY_TYPES[type] || ENEMY_TYPES.common;

      this.id = TD.Utils.createId('enemy');
      this.type = stats.id;
      this.name = stats.name;
      this.pathPoints = pathPoints;
      this.maxHealth = Math.round(stats.health * healthMultiplier);
      this.health = this.maxHealth;
      this.speed = stats.speed;
      this.reward = stats.reward;
      this.leakDamage = stats.leakDamage;
      this.radius = Math.round(stats.radius * (CONFIG.ENEMY_RADIUS_SCALE || 1));
      this.color = stats.color;
      this.accent = stats.accent;
      this.distanceTravelled = 0;
      this.progress = 0;
      this.reachedEnd = false;
      this.markedForReward = false;

      const start = TD.Path.getPointAtDistance(0, this.pathPoints);
      this.x = start.x;
      this.y = start.y;
      this.angle = start.angle;
    }

    update(deltaMs) {
      if (this.isDead() || this.reachedEnd) {
        return;
      }

      const totalLength = TD.Path.getTotalLength(this.pathPoints);
      this.distanceTravelled += this.speed * (deltaMs / 16.6667);

      if (this.distanceTravelled >= totalLength) {
        this.distanceTravelled = totalLength;
        this.reachedEnd = true;
      }

      const point = TD.Path.getPointAtDistance(this.distanceTravelled, this.pathPoints);
      this.x = point.x;
      this.y = point.y;
      this.angle = point.angle;
      this.progress = point.progress;
    }

    takeDamage(amount) {
      this.health = TD.Utils.clamp(this.health - amount, 0, this.maxHealth);
      return this.isDead();
    }

    isDead() {
      return this.health <= 0;
    }

    hasReachedEnd() {
      return this.reachedEnd;
    }

    getHealthRatio() {
      return this.maxHealth === 0 ? 0 : this.health / this.maxHealth;
    }
  }

  TD.Enemy = Enemy;
})(globalThis);
