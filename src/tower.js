(function towerModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG, TOWER_TYPES } = TD;

  class Tower {
    constructor({ type = 'basic', x, y }) {
      const stats = TOWER_TYPES[type] || TOWER_TYPES.basic;

      this.id = TD.Utils.createId('tower');
      this.type = stats.id;
      this.name = stats.name;
      this.x = x;
      this.y = y;
      this.radius = CONFIG.TOWER_RADIUS;
      this.range = stats.range;
      this.damage = stats.damage;
      this.cooldown = stats.cooldown;
      this.cost = stats.cost;
      this.projectileSpeed = stats.projectileSpeed;
      this.color = stats.color;
      this.accent = stats.accent;
      this.level = 1;
      this.lastShotAt = Number.NEGATIVE_INFINITY;
      this.rotation = 0;
      this.shotPulse = 0;
    }

    findTarget(enemies) {
      const candidates = enemies.filter((enemy) => {
        if (enemy.isDead() || enemy.hasReachedEnd()) {
          return false;
        }

        return TD.Collision.distanceBetweenPoints(this, enemy) <= this.range;
      });

      if (candidates.length === 0) {
        return null;
      }

      return candidates.sort((a, b) => {
        if (b.distanceTravelled === a.distanceTravelled) {
          return TD.Collision.distanceBetweenPoints(this, a) - TD.Collision.distanceBetweenPoints(this, b);
        }

        return b.distanceTravelled - a.distanceTravelled;
      })[0];
    }

    canFire(currentTime) {
      return currentTime - this.lastShotAt >= this.cooldown;
    }

    shoot(target, currentTime) {
      if (!target || !this.canFire(currentTime)) {
        return null;
      }

      this.lastShotAt = currentTime;
      this.rotation = Math.atan2(target.y - this.y, target.x - this.x);
      this.shotPulse = 1;

      return new TD.Projectile({
        x: this.x,
        y: this.y,
        target,
        damage: this.damage,
        speed: this.projectileSpeed,
        color: this.accent,
        type: this.type
      });
    }

    update(deltaMs, currentTime, enemies) {
      this.shotPulse = Math.max(0, this.shotPulse - deltaMs / 160);

      const target = this.findTarget(enemies);

      if (!target) {
        return null;
      }

      this.rotation = Math.atan2(target.y - this.y, target.x - this.x);
      return this.shoot(target, currentTime);
    }

    getUpgradeCost() {
      return Math.round(this.cost * (0.7 + this.level * 0.45));
    }

    upgrade() {
      this.level += 1;
      this.damage = Math.round(this.damage * 1.25);
      this.range = Math.round(this.range + 10);
      this.cooldown = Math.max(140, Math.round(this.cooldown * 0.9));

      return this;
    }
  }

  TD.Tower = Tower;
})(globalThis);
