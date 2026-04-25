(function collisionModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG } = TD;

  function distanceBetweenPoints(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function circlesCollide(a, b) {
    return distanceBetweenPoints(a, b) <= (a.radius + b.radius);
  }

  function isProjectileCollidingWithEnemy(projectile, enemy) {
    return circlesCollide(
      {
        x: projectile.x,
        y: projectile.y,
        radius: projectile.radius || CONFIG.PROJECTILE_RADIUS
      },
      {
        x: enemy.x,
        y: enemy.y,
        radius: enemy.radius || CONFIG.ENEMY_BASE_RADIUS
      }
    );
  }

  function canPlaceTower({
    x,
    y,
    towers = [],
    pathPoints = CONFIG.PATH_POINTS,
    towerRadius = CONFIG.TOWER_RADIUS
  }) {
    const point = { x, y };

    if (
      x < towerRadius ||
      y < towerRadius ||
      x > CONFIG.CANVAS_WIDTH - towerRadius ||
      y > CONFIG.CANVAS_HEIGHT - towerRadius
    ) {
      return {
        valid: false,
        reason: 'bounds'
      };
    }

    if (TD.Path.isPointOnPath(point, towerRadius + CONFIG.PLACEMENT_PADDING, pathPoints)) {
      return {
        valid: false,
        reason: 'path'
      };
    }

    const overlapsTower = towers.some((tower) => {
      return distanceBetweenPoints(point, tower) < (towerRadius * 2) + CONFIG.PLACEMENT_PADDING;
    });

    if (overlapsTower) {
      return {
        valid: false,
        reason: 'tower'
      };
    }

    return {
      valid: true,
      reason: null
    };
  }

  TD.Collision = {
    distanceBetweenPoints,
    circlesCollide,
    isProjectileCollidingWithEnemy,
    canPlaceTower
  };
})(globalThis);
