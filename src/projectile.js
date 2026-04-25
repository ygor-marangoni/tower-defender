(function projectileModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG } = TD;

  class Projectile {
    constructor({
      x,
      y,
      target,
      damage,
      speed = 8,
      radius = CONFIG.PROJECTILE_RADIUS,
      color = '#faff6a',
      type = 'basic'
    }) {
      this.id = TD.Utils.createId('projectile');
      this.x = x;
      this.y = y;
      this.target = target;
      this.damage = damage;
      this.speed = speed;
      this.radius = radius;
      this.color = color;
      this.type = type;
      this.active = true;
      this.hasHit = false;
      this.trail = [];
    }

    update(deltaMs) {
      if (!this.active) {
        return;
      }

      if (!this.target || this.target.isDead() || this.target.hasReachedEnd()) {
        this.active = false;
        return;
      }

      if (TD.Collision.isProjectileCollidingWithEnemy(this, this.target)) {
        this.impact();
        return;
      }

      const vector = TD.Utils.normalizeVector(this.target.x - this.x, this.target.y - this.y);
      const step = this.speed * (deltaMs / 16.6667);

      this.trail.push({ x: this.x, y: this.y });

      if (this.trail.length > 6) {
        this.trail.shift();
      }

      if (step >= vector.length) {
        this.x = this.target.x;
        this.y = this.target.y;
        this.impact();
        return;
      }

      this.x += vector.x * step;
      this.y += vector.y * step;

      if (TD.Collision.isProjectileCollidingWithEnemy(this, this.target)) {
        this.impact();
      }
    }

    impact() {
      if (!this.active || !this.target || this.target.isDead()) {
        this.active = false;
        return;
      }

      this.target.takeDamage(this.damage);
      this.active = false;
      this.hasHit = true;
    }
  }

  TD.Projectile = Projectile;
})(globalThis);
