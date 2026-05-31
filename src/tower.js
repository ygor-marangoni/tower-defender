(function towerModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG, TOWER_TYPES } = TD;

  function getBaseTowerStats(type) {
    return TOWER_TYPES[type] || TOWER_TYPES.basic;
  }

  function getUpgradeBonusLevels(level) {
    return Math.max(0, Math.floor(level) - 1);
  }

  function getDiminishingDamageMultiplier(level) {
    const upgradeConfig = CONFIG.TOWER_UPGRADE || {};
    const bonusLevels = getUpgradeBonusLevels(level);
    const linearGrowth = upgradeConfig.damageLinearGrowth ?? 0.32;
    const curveGrowth = upgradeConfig.damageCurveGrowth ?? 0.14;
    const curveExponent = upgradeConfig.damageCurveExponent ?? 1.35;
    const maxMultiplier = upgradeConfig.maxDamageMultiplier ?? 60;
    const multiplier = 1 + bonusLevels * linearGrowth + Math.pow(bonusLevels, curveExponent) * curveGrowth;

    return Math.min(maxMultiplier, multiplier);
  }

  function getTowerStatsForLevel(type, level) {
    const stats = getBaseTowerStats(type);
    const upgradeConfig = CONFIG.TOWER_UPGRADE || {};
    const bonusLevels = getUpgradeBonusLevels(level);
    const rangeBonus = Math.min(
      upgradeConfig.maxRangeBonus ?? 70,
      bonusLevels * (upgradeConfig.rangePerLevel ?? 5)
    );
    const cooldownReduction = Math.min(
      upgradeConfig.maxCooldownReduction ?? 0.45,
      bonusLevels * (upgradeConfig.cooldownReductionPerLevel ?? 0.035)
    );

    return {
      damage: Math.max(1, Math.round(stats.damage * getDiminishingDamageMultiplier(level))),
      range: Math.round(stats.range + rangeBonus),
      cooldown: Math.max(
        upgradeConfig.minCooldown ?? 140,
        Math.round(stats.cooldown * (1 - cooldownReduction))
      )
    };
  }

  function getTowerUpgradeCost(type, level) {
    const stats = getBaseTowerStats(type);
    const upgradeConfig = CONFIG.TOWER_UPGRADE || {};
    const costMultiplier = (upgradeConfig.costBaseMultiplier ?? 0.8)
      + level * (upgradeConfig.costLevelMultiplier ?? 0.45)
      + Math.pow(level, upgradeConfig.costGrowthExponent ?? 1.25) * (upgradeConfig.costGrowthMultiplier ?? 0.12);

    return Math.round(stats.cost * costMultiplier);
  }

  class Tower {
    constructor({ type = 'basic', x, y, themeId = TD.DEFAULT_THEME_ID }) {
      const stats = getBaseTowerStats(type);

      this.id = TD.Utils.createId('tower');
      this.type = stats.id;
      this.themeId = themeId;
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
      this.totalInvested = stats.cost;
      this.sellRatio = CONFIG.TOWER_SELL_RATIO || 0.7;
      this.cardDamageMultiplier = 1;
      this.lastShotAt = Number.NEGATIVE_INFINITY;
      this.rotation = 0;
      this.shotPulse = 0;
    }

    getAimOrigin() {
      if (this.themeId === 'medieval' && this.type === 'basic') {
        const visualOffset = CONFIG.MEDIEVAL_ARCHER_VISUAL_Y_OFFSET || 0;

        return {
          x: this.x,
          y: this.y - 34 + visualOffset
        };
      }

      return {
        x: this.x,
        y: this.y
      };
    }

    getProjectileOrigin() {
      if (this.themeId === 'medieval' && this.type === 'basic') {
        const bowOffset = 15;
        const visualOffset = CONFIG.MEDIEVAL_ARCHER_VISUAL_Y_OFFSET || 0;

        return {
          x: this.x + Math.cos(this.rotation) * bowOffset,
          y: this.y - 34 + visualOffset + Math.sin(this.rotation) * bowOffset
        };
      }

      return {
        x: this.x,
        y: this.y
      };
    }

    findTarget(enemies, upgrades = null) {
      const effectiveRange = TD.getEffectiveTowerRange
        ? TD.getEffectiveTowerRange(this, upgrades)
        : this.range;
      const candidates = enemies.filter((enemy) => {
        if (enemy.isDead() || enemy.hasReachedEnd()) {
          return false;
        }

        return TD.Collision.distanceBetweenPoints(this, enemy) <= effectiveRange;
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

    canFire(currentTime, upgrades = null) {
      const cooldown = TD.getEffectiveTowerCooldown
        ? TD.getEffectiveTowerCooldown(this, upgrades)
        : this.cooldown;

      return currentTime - this.lastShotAt >= cooldown;
    }

    shoot(target, currentTime, upgrades = null, context = {}) {
      if (!target || target.isDead() || target.hasReachedEnd() || !this.canFire(currentTime, upgrades)) {
        return null;
      }

      const aimOrigin = this.getAimOrigin();
      this.lastShotAt = currentTime;
      this.rotation = Math.atan2(target.y - aimOrigin.y, target.x - aimOrigin.x);
      this.shotPulse = 1;
      const projectileOrigin = this.getProjectileOrigin();

      return new TD.Projectile({
        x: projectileOrigin.x,
        y: projectileOrigin.y,
        target,
        damage: TD.getEffectiveTowerDamage ? TD.getEffectiveTowerDamage(this, upgrades, context) : this.damage,
        speed: this.projectileSpeed,
        color: this.accent,
        type: this.type
      });
    }

    update(deltaMs, currentTime, enemies, upgrades = null, context = {}) {
      this.shotPulse = Math.max(0, this.shotPulse - deltaMs / 160);

      const target = this.findTarget(enemies, upgrades);

      if (!target) {
        return null;
      }

      return this.shoot(target, currentTime, upgrades, context);
    }

    getUpgradeCost() {
      return getTowerUpgradeCost(this.type, this.level);
    }

    addInvestment(amount) {
      if (!Number.isFinite(amount) || amount <= 0) {
        return this.totalInvested;
      }

      this.totalInvested += amount;
      return this.totalInvested;
    }

    getSellValue(upgrades = null) {
      if (TD.getEffectiveTowerSellValue) {
        return TD.getEffectiveTowerSellValue(this, upgrades);
      }

      const totalInvested = Number.isFinite(this.totalInvested) ? this.totalInvested : this.cost;
      const sellRatio = Number.isFinite(this.sellRatio) ? this.sellRatio : (CONFIG.TOWER_SELL_RATIO || 0.7);

      return Math.max(0, Math.floor(totalInvested * sellRatio));
    }

    upgrade(upgradeCost = this.getUpgradeCost()) {
      this.addInvestment(upgradeCost);
      this.level += 1;
      this.applyLevelStats();

      return this;
    }

    applyLevelStats() {
      const stats = getTowerStatsForLevel(this.type, this.level);

      this.damage = stats.damage;
      this.range = stats.range;
      this.cooldown = stats.cooldown;
      return this;
    }
  }

  TD.getTowerStatsForLevel = getTowerStatsForLevel;
  TD.getTowerUpgradeCost = getTowerUpgradeCost;
  TD.Tower = Tower;
})(globalThis);
