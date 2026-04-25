(function rendererModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG, TOWER_TYPES } = TD;

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
    }

    render(state) {
      const ctx = this.ctx;

      ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      this.drawBackground(state.theme);
      this.drawPath(state.pathPoints, state.theme);
      this.drawBase(state.pathPoints, state.theme);
      this.drawEffects(state.effects, true);
      this.drawTowers(state.towers, state.selectedPlacedTower, state.hoveredTower, state.theme);
      this.drawEnemies(state.enemies, state.theme);
      this.drawProjectiles(state.projectiles, state.theme);
      this.drawEffects(state.effects, false);
      this.drawPlacementPreview(state);
      this.drawMapHints(state);
    }

    drawBackground(theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
      const ctx = this.ctx;
      if (theme.id === 'medieval') {
        this.drawMedievalBackground(theme);
        return;
      }

      const isMobileLayout = CONFIG.CURRENT_LAYOUT === 'mobile';
      const gradient = ctx.createRadialGradient(190, 80, 30, 480, 270, 620);
      gradient.addColorStop(0, isMobileLayout ? '#0a1118' : '#111827');
      gradient.addColorStop(0.55, isMobileLayout ? '#060b11' : '#080d14');
      gradient.addColorStop(1, '#05070b');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.strokeStyle = '#dbeafe';
      ctx.lineWidth = 1;

      for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
        ctx.stroke();
      }

      for (let y = 0; y <= CONFIG.CANVAS_HEIGHT; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
        ctx.stroke();
      }

      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.08;
      for (let index = 0; index < 12; index += 1) {
        const x = (index * 137) % CONFIG.CANVAS_WIDTH;
        const y = (index * 71) % CONFIG.CANVAS_HEIGHT;
        const radius = 1.5 + (index % 3);
        ctx.fillStyle = index % 2 === 0 ? '#38bdf8' : '#34d399';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawMedievalBackground(theme) {
      const ctx = this.ctx;
      const palette = theme.palette;
      const gradient = ctx.createRadialGradient(230, 110, 30, 480, 270, 680);
      gradient.addColorStop(0, '#263d24');
      gradient.addColorStop(0.58, palette.grass);
      gradient.addColorStop(1, palette.background);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

      ctx.save();
      ctx.globalAlpha = 0.16;
      for (let index = 0; index < 34; index += 1) {
        const x = (index * 83 + 42) % CONFIG.CANVAS_WIDTH;
        const y = (index * 59 + 28) % CONFIG.CANVAS_HEIGHT;
        ctx.fillStyle = index % 3 === 0 ? '#6CA86E' : '#3B2716';
        ctx.beginPath();
        ctx.ellipse(x, y, 3 + (index % 4), 2 + (index % 3), index, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      this.drawMedievalDecorations();
    }

    drawMedievalDecorations() {
      const ctx = this.ctx;
      const isMobileLayout = CONFIG.CURRENT_LAYOUT === 'mobile';
      const trees = isMobileLayout
        ? [
          { x: 52, y: 210, scale: 0.78 },
          { x: 430, y: 168, scale: 0.82 },
          { x: 68, y: 382, scale: 0.7 },
          { x: 424, y: 360, scale: 0.72 },
          { x: 66, y: 690, scale: 0.76 }
        ]
        : [
          { x: 80, y: 110, scale: 1 },
          { x: 260, y: 470, scale: 1 },
          { x: 450, y: 100, scale: 1 },
          { x: 700, y: 455, scale: 1 },
          { x: 895, y: 95, scale: 1 }
        ];
      ctx.save();
      trees.forEach((tree) => {
        const trunkWidth = 6 * tree.scale;
        const trunkHeight = 18 * tree.scale;
        const canopyWidth = 18 * tree.scale;
        const canopyTop = 20 * tree.scale;
        const canopyBottom = 14 * tree.scale;

        ctx.fillStyle = '#342313';
        ctx.fillRect(tree.x - trunkWidth / 2, tree.y + 8 * tree.scale, trunkWidth, trunkHeight);
        ctx.fillStyle = '#244B2D';
        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y - canopyTop);
        ctx.lineTo(tree.x - canopyWidth, tree.y + canopyBottom);
        ctx.lineTo(tree.x + canopyWidth, tree.y + canopyBottom);
        ctx.closePath();
        ctx.fill();
      });

      ctx.restore();
    }

    drawPath(points = CONFIG.PATH_POINTS, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
      const ctx = this.ctx;
      const palette = theme.palette;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        ctx.lineTo(points[index].x, points[index].y);
      }
      ctx.strokeStyle = theme.id === 'medieval' ? 'rgba(42, 25, 12, 0.55)' : 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = CONFIG.PATH_WIDTH + 16;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 8;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = theme.id === 'medieval' ? palette.earth : '#111827';
      ctx.lineWidth = CONFIG.PATH_WIDTH;
      ctx.stroke();

      ctx.strokeStyle = palette.path || '#1f2a37';
      ctx.lineWidth = CONFIG.PATH_WIDTH - 12;
      ctx.stroke();

      ctx.setLineDash(theme.id === 'medieval' ? [6, 18] : [18, 22]);
      ctx.lineDashOffset = theme.id === 'medieval' ? 0 : -performance.now() / 35;
      ctx.strokeStyle = palette.pathAccent || 'rgba(148, 163, 184, 0.34)';
      ctx.lineWidth = theme.id === 'medieval' ? 3 : 2;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }

    drawBase(points = CONFIG.PATH_POINTS, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
      const end = points[points.length - 1];

      if (theme.id === 'medieval') {
        this.drawMedievalBase(end);
      } else {
        this.drawFuturisticBase(end);
      }
    }

    drawFuturisticBase(end) {
      const ctx = this.ctx;
      const baseX = end.x > CONFIG.CANVAS_WIDTH ? end.x - 26 : end.x;

      ctx.save();
      ctx.translate(
        TD.Utils.clamp(baseX, 54, CONFIG.CANVAS_WIDTH - 54),
        TD.Utils.clamp(end.y, 54, CONFIG.CANVAS_HEIGHT - 54)
      );
      if (CONFIG.CURRENT_LAYOUT === 'mobile') {
        ctx.rotate(-Math.PI / 2);
      } else {
        ctx.scale(-1, 1);
      }

      ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#0D1724';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(14, -22);
      ctx.quadraticCurveTo(-10, -32, -34, -14);
      ctx.lineTo(-44, 0);
      ctx.lineTo(-34, 14);
      ctx.quadraticCurveTo(-10, 32, 14, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#15263A';
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.46)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(-6, 0, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34D399';
      ctx.shadowColor = 'rgba(52, 211, 153, 0.65)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(18, 0, 8.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.82)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-30, -10);
      ctx.lineTo(-47, -18);
      ctx.lineTo(-38, -3);
      ctx.moveTo(-30, 10);
      ctx.lineTo(-47, 18);
      ctx.lineTo(-38, 3);
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.arc(-18, -8, 2.5, 0, Math.PI * 2);
      ctx.arc(-18, 8, 2.5, 0, Math.PI * 2);
      ctx.arc(2, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.beginPath();
      ctx.ellipse(-45, 0, 12, 21, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    drawMedievalBase(end) {
      const ctx = this.ctx;
      const x = TD.Utils.clamp(end.x - 36, 20, CONFIG.CANVAS_WIDTH - 92);
      const y = TD.Utils.clamp(end.y - 42, 16, CONFIG.CANVAS_HEIGHT - 92);
      const stone = '#687482';
      const stoneDark = '#3f4a56';
      const stoneLight = '#a2acb7';
      const gate = '#171d24';

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = stone;
      ctx.strokeStyle = stoneLight;
      ctx.lineWidth = 1.5;

      this.drawRoundedRect(ctx, x, y + 28, 72, 48, 4);
      ctx.fill();
      ctx.stroke();

      this.drawRoundedRect(ctx, x - 14, y + 8, 26, 68, 5);
      ctx.fill();
      ctx.stroke();

      this.drawRoundedRect(ctx, x + 60, y + 8, 26, 68, 5);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = stoneLight;
      for (let i = 0; i < 5; i += 1) {
        ctx.fillRect(x + 5 + i * 14, y + 18, 8, 12);
      }
      ctx.fillRect(x - 11, y - 1, 8, 12);
      ctx.fillRect(x + 1, y - 1, 8, 12);
      ctx.fillRect(x + 63, y - 1, 8, 12);
      ctx.fillRect(x + 75, y - 1, 8, 12);

      ctx.fillStyle = stoneDark;
      for (let i = 0; i < 4; i += 1) {
        ctx.fillRect(x + 11 + i * 16, y + 40, 8, 2);
        ctx.fillRect(x - 6 + (i % 2) * 8, y + 24 + i * 10, 7, 2);
        ctx.fillRect(x + 68 + (i % 2) * 8, y + 24 + i * 10, 7, 2);
      }

      ctx.fillStyle = gate;
      ctx.beginPath();
      ctx.moveTo(x + 27, y + 76);
      ctx.lineTo(x + 27, y + 56);
      ctx.quadraticCurveTo(x + 36, y + 42, x + 45, y + 56);
      ctx.lineTo(x + 45, y + 76);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.fillRect(x - 8, y + 17, 5, 12);
      ctx.fillRect(x + 75, y + 17, 5, 12);
      ctx.restore();
    }

    drawTowers(towers, selectedTower, hoveredTower, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
      towers.forEach((tower) => {
        const isSelected = selectedTower && selectedTower.id === tower.id;
        const isHovered = hoveredTower && hoveredTower.id === tower.id;

        if (isSelected || isHovered) {
          this.drawRange(tower.x, tower.y, tower.range, tower.color, isSelected ? 0.1 : 0.065);
        }

        this.drawTower(tower, isSelected, theme);
      });
    }

    drawTower(tower, selected, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
      if (theme.id === 'medieval') {
        this.drawMedievalTower(tower, selected, theme);
        return;
      }

      const ctx = this.ctx;

      ctx.save();
      ctx.translate(tower.x, tower.y);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = selected ? 10 : 3;
      ctx.fillStyle = '#0d141f';
      ctx.strokeStyle = tower.color;
      ctx.lineWidth = selected ? 2.5 : 1.5;

      ctx.beginPath();
      for (let side = 0; side < 6; side += 1) {
        const angle = Math.PI / 6 + side * Math.PI / 3;
        const x = Math.cos(angle) * tower.radius;
        const y = Math.sin(angle) * tower.radius;

        if (side === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.rotate(tower.rotation);
      ctx.fillStyle = tower.accent;
      ctx.fillRect(-2, -4, tower.radius + 10 + tower.shotPulse * 4, 8);
      ctx.beginPath();
      ctx.arc(0, 0, 7 + tower.shotPulse, 0, Math.PI * 2);
      ctx.fillStyle = tower.color;
      ctx.fill();

      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'rgba(230, 237, 243, 0.86)';
      ctx.font = '600 11px Figtree, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`L${tower.level}`, tower.x, tower.y + 36);
      ctx.restore();
    }

    drawMedievalTower(tower, selected) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(tower.x, tower.y);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
      ctx.shadowBlur = selected ? 10 : 3;
      ctx.fillStyle = tower.type === 'heavy' ? '#4E3422' : '#6B5641';
      ctx.strokeStyle = tower.type === 'rapid' ? '#C7B58C' : '#D6A84F';
      ctx.lineWidth = selected ? 2.5 : 1.4;

      if (tower.type === 'heavy') {
        ctx.fillRect(-18, -12, 36, 24);
        ctx.strokeRect(-18, -12, 36, 24);
        ctx.rotate(tower.rotation);
        ctx.fillStyle = '#2A1B10';
        ctx.fillRect(0, -5, 30 + tower.shotPulse * 4, 10);
      } else {
        ctx.fillRect(-14, -18, 28, 36);
        ctx.strokeRect(-14, -18, 28, 36);
        ctx.beginPath();
        ctx.moveTo(-18, -18);
        ctx.lineTo(0, -32);
        ctx.lineTo(18, -18);
        ctx.closePath();
        ctx.fillStyle = tower.type === 'rapid' ? '#3B2716' : '#5A3518';
        ctx.fill();
        ctx.stroke();
        ctx.rotate(tower.rotation);
        ctx.strokeStyle = '#E8D7A8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(22 + tower.shotPulse * 4, 0);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'rgba(248, 235, 210, 0.86)';
      ctx.font = '600 11px Figtree, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`L${tower.level}`, tower.x, tower.y + 36);
      ctx.restore();
    }

    drawEnemies(enemies, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
      enemies.forEach((enemy) => {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 5;

        const colors = this.getEnemyColors(enemy, theme);
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 1.5;

        if (enemy.type === 'fast') {
          ctx.beginPath();
          ctx.moveTo(enemy.radius + 4, 0);
          ctx.lineTo(-enemy.radius, -enemy.radius);
          ctx.lineTo(-enemy.radius * 0.45, 0);
          ctx.lineTo(-enemy.radius, enemy.radius);
          ctx.closePath();
        } else if (enemy.type === 'tank') {
          this.drawRoundedRect(ctx, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2, 6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        }

        ctx.fill();
        ctx.stroke();
        ctx.restore();

        this.drawHealthBar(enemy, theme);
      });
    }

    getEnemyColors(enemy, theme) {
      if (theme.id !== 'medieval') {
        return { fill: enemy.color, stroke: enemy.accent };
      }

      const palette = {
        common: { fill: '#315C32', stroke: '#A7C77E' },
        fast: { fill: '#5C5249', stroke: '#C7B58C' },
        tank: { fill: '#65405A', stroke: '#D6A84F' }
      };

      return palette[enemy.type] || palette.common;
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
      const right = x + width;
      const bottom = y + height;

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(right - radius, y);
      ctx.quadraticCurveTo(right, y, right, y + radius);
      ctx.lineTo(right, bottom - radius);
      ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
      ctx.lineTo(x + radius, bottom);
      ctx.quadraticCurveTo(x, bottom, x, bottom - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    drawHealthBar(enemy, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
      const ctx = this.ctx;
      const width = enemy.radius * 2.3;
      const height = 4;
      const x = enemy.x - width / 2;
      const y = enemy.y - enemy.radius - 14;

      ctx.save();
      ctx.fillStyle = 'rgba(7, 10, 15, 0.72)';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = enemy.getHealthRatio() > 0.45
        ? (theme.id === 'medieval' ? '#6CA86E' : '#34d399')
        : (theme.id === 'medieval' ? '#B94A48' : '#f43f5e');
      ctx.fillRect(x, y, width * enemy.getHealthRatio(), height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
    }

    drawProjectiles(projectiles, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
      projectiles.forEach((projectile) => {
        const ctx = this.ctx;
        const color = this.getProjectileColor(projectile, theme);

        ctx.save();
        projectile.trail.forEach((point, index) => {
          ctx.globalAlpha = (index + 1) / projectile.trail.length * 0.16;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, projectile.radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.globalAlpha = 1;
        ctx.shadowColor = color;
        ctx.shadowBlur = 7;
        ctx.fillStyle = color;

        if (theme.id === 'medieval' && projectile.type !== 'heavy') {
          ctx.translate(projectile.x, projectile.y);
          ctx.rotate(Math.atan2(projectile.target.y - projectile.y, projectile.target.x - projectile.x));
          ctx.fillRect(-8, -1.5, 16, 3);
          ctx.beginPath();
          ctx.moveTo(9, 0);
          ctx.lineTo(3, -4);
          ctx.lineTo(3, 4);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, projectile.radius + (theme.id === 'medieval' ? 1.5 : 0), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    getProjectileColor(projectile, theme) {
      if (theme.id !== 'medieval') {
        return projectile.color;
      }

      return {
        basic: '#E8D7A8',
        rapid: '#C7B58C',
        heavy: '#E09F3E'
      }[projectile.type] || '#E8D7A8';
    }

    drawEffects(effects, behindActors) {
      effects
        .filter((effect) => Boolean(effect.behindActors) === behindActors)
        .forEach((effect) => {
          const ctx = this.ctx;
          const progress = effect.age / effect.duration;
          const alpha = Math.max(0, 1 - progress);

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = effect.color;
          ctx.fillStyle = effect.color;
          ctx.shadowColor = effect.color;
          ctx.shadowBlur = 6;
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.arc(effect.x, effect.y, effect.radius * (0.45 + progress), 0, Math.PI * 2);
          ctx.stroke();

          for (let index = 0; index < effect.particles.length; index += 1) {
            const particle = effect.particles[index];
            ctx.globalAlpha = alpha * particle.alpha;
            ctx.beginPath();
            ctx.arc(
              effect.x + particle.x * progress,
              effect.y + particle.y * progress,
              particle.size,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          ctx.restore();
        });
    }

    drawPlacementPreview(state) {
      if (!state.selectedTowerType || !state.mouse.inside || state.gameOver) {
        return;
      }

      const towerType = TOWER_TYPES[state.selectedTowerType];
      const valid = state.placement.valid && state.canAffordSelectedTower;
      const color = valid
        ? state.theme.palette.success
        : state.theme.palette.danger;

      this.drawRange(state.mouse.x, state.mouse.y, towerType.range, color, 0.085);

      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = 0.78;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = state.theme.palette.panel;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(state.mouse.x, state.mouse.y, CONFIG.TOWER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    drawRange(x, y, range, color, alpha) {
      const ctx = this.ctx;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, range, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = Math.min(0.34, alpha + 0.14);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    drawMapHints(state) {
      if (state.waveActive || state.gameOver || state.towers.length > 0) {
        return;
      }

      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = state.theme.id === 'medieval' ? 'rgba(248, 235, 210, 0.72)' : 'rgba(230, 237, 243, 0.72)';
      ctx.font = `600 ${CONFIG.MAP_HINT_FONT_SIZE}px Figtree, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(state.theme.instructions[0], CONFIG.CANVAS_WIDTH / 2, 36);
      ctx.restore();
    }
  }

  TD.Renderer = Renderer;
})(globalThis);
