(function rendererModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG, TOWER_TYPES } = TD;
  const PLACED_TOWER_SELECTION_PALETTE = {
    range: '#C9BEA4',
    ring: '#DDD3BD',
    medievalRange: '#C9BEA4',
    medievalRing: '#DDD3BD'
  };
  const MEDIEVAL_TOWER_ART = {
    stoneLight: '#BCA98A',
    stoneMid: '#8B7355',
    stoneDark: '#5F4D38',
    wood: '#7B5536',
    woodDark: '#4B2F1D',
    iron: '#545454',
    steel: '#8A8A83',
    gold: '#D6A84F',
    goldDark: '#A87B29',
    royalRed: '#8F2E2E',
    moss: '#4F6A43',
    parchment: '#E7D8B6',
    shadow: 'rgba(0, 0, 0, 0.24)'
  };

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
    }

    render(state) {
      const ctx = this.ctx;
      const time = state.time || 0;

      ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      this.drawBackground(state.theme);
      this.drawPath(state.pathPoints, state.theme);
      this.drawEffects(state.effects, true, state.theme, time);
      this.drawTowers(state.towers, state.selectedPlacedTower, state.hoveredTower, state.theme, state.upgrades, {
        lives: state.lives
      });
      this.drawEnemies(state.enemies, state.theme, time);
      this.drawProjectiles(state.projectiles, state.theme);
      this.drawBaseForeground(state.pathPoints, state.theme);
      this.drawEffects(state.effects, false, state.theme, time);
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
          { x: 52, y: 210, scale: 0.52 },
          { x: 430, y: 168, scale: 0.56 },
          { x: 68, y: 382, scale: 0.48 },
          { x: 424, y: 360, scale: 0.5 },
          { x: 66, y: 690, scale: 0.54 }
        ]
        : [
          { x: 78, y: 104, scale: 0.58 },
          { x: 122, y: 126, scale: 0.46 },
          { x: 438, y: 98, scale: 0.54 },
          { x: 892, y: 86, scale: 0.54 },
          { x: 1016, y: 110, scale: 0.48 },
          { x: 286, y: 500, scale: 0.64 },
          { x: 1036, y: 504, scale: 0.58 }
        ];
      ctx.save();
      trees.forEach((tree) => {
        const trunkWidth = 4 * tree.scale;
        const trunkHeight = 12 * tree.scale;
        const foliageWidth = 16 * tree.scale;
        const foliageHeight = 15 * tree.scale;

        ctx.fillStyle = 'rgba(5, 9, 7, 0.26)';
        ctx.beginPath();
        ctx.ellipse(tree.x, tree.y + 13 * tree.scale, 10 * tree.scale, 4 * tree.scale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#49301D';
        ctx.fillRect(tree.x - trunkWidth / 2, tree.y + 3 * tree.scale, trunkWidth, trunkHeight);

        const layers = [
          { y: tree.y - 12 * tree.scale, width: foliageWidth * 0.74, height: foliageHeight * 0.92, color: '#255432' },
          { y: tree.y - 4 * tree.scale, width: foliageWidth, height: foliageHeight, color: '#1C4327' },
          { y: tree.y + 4 * tree.scale, width: foliageWidth * 0.82, height: foliageHeight * 0.84, color: '#15331E' }
        ];

        layers.forEach((layer) => {
          ctx.fillStyle = layer.color;
          ctx.beginPath();
          ctx.moveTo(tree.x, layer.y - layer.height);
          ctx.lineTo(tree.x - layer.width, layer.y + layer.height * 0.2);
          ctx.lineTo(tree.x - layer.width * 0.42, layer.y + layer.height * 0.2);
          ctx.lineTo(tree.x - layer.width * 0.64, layer.y + layer.height * 0.72);
          ctx.lineTo(tree.x, layer.y + layer.height * 0.38);
          ctx.lineTo(tree.x + layer.width * 0.64, layer.y + layer.height * 0.72);
          ctx.lineTo(tree.x + layer.width * 0.42, layer.y + layer.height * 0.2);
          ctx.lineTo(tree.x + layer.width, layer.y + layer.height * 0.2);
          ctx.closePath();
          ctx.fill();
        });

        ctx.strokeStyle = 'rgba(153, 195, 129, 0.12)';
        ctx.lineWidth = 1.1 * tree.scale;
        ctx.beginPath();
        ctx.moveTo(tree.x - 1.5 * tree.scale, tree.y - 14 * tree.scale);
        ctx.lineTo(tree.x - 4.8 * tree.scale, tree.y - 2 * tree.scale);
        ctx.moveTo(tree.x + 2 * tree.scale, tree.y - 9 * tree.scale);
        ctx.lineTo(tree.x + 5.2 * tree.scale, tree.y + 4 * tree.scale);
        ctx.stroke();

        ctx.fillStyle = '#2D6137';
        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y - 19 * tree.scale);
        ctx.lineTo(tree.x - 2.2 * tree.scale, tree.y - 13 * tree.scale);
        ctx.lineTo(tree.x + 2.2 * tree.scale, tree.y - 13 * tree.scale);
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
        this.drawMedievalBase(points);
      } else {
        this.drawFuturisticBase(end);
      }
    }

    drawBaseForeground(points = CONFIG.PATH_POINTS, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
      if (theme.id === 'futuristic') {
        const end = points[points.length - 1];
        this.drawFuturisticBase(end);
        return;
      }

      if (theme.id !== 'medieval') {
        return;
      }

      this.drawMedievalBase(points);
    }

    getFuturisticBasePose(end) {
      const baseX = end.x > CONFIG.CANVAS_WIDTH ? end.x - 26 : end.x;

      return {
        x: TD.Utils.clamp(baseX, 54, CONFIG.CANVAS_WIDTH - 54),
        y: TD.Utils.clamp(end.y, 54, CONFIG.CANVAS_HEIGHT - 54),
        mobile: CONFIG.CURRENT_LAYOUT === 'mobile'
      };
    }

    drawFuturisticBase(end) {
      const ctx = this.ctx;
      const pose = this.getFuturisticBasePose(end);
      ctx.save();
      ctx.translate(pose.x, pose.y);
      if (pose.mobile) {
        ctx.rotate(-Math.PI / 2);
      } else {
        ctx.scale(-1, 1);
      }

      ctx.shadowBlur = 0;

      ctx.fillStyle = '#09111B';
      ctx.beginPath();
      ctx.moveTo(-31, -8);
      ctx.lineTo(-40, -13);
      ctx.lineTo(-52, -5);
      ctx.lineTo(-44, 0);
      ctx.lineTo(-33, -2);
      ctx.closePath();
      ctx.moveTo(-31, 8);
      ctx.lineTo(-40, 13);
      ctx.lineTo(-52, 5);
      ctx.lineTo(-44, 0);
      ctx.lineTo(-33, 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#101B29';
      ctx.beginPath();
      ctx.moveTo(-34, -4);
      ctx.lineTo(-43, -9);
      ctx.lineTo(-48, -5);
      ctx.lineTo(-42, 0);
      ctx.lineTo(-34, -1);
      ctx.closePath();
      ctx.moveTo(-34, 4);
      ctx.lineTo(-43, 9);
      ctx.lineTo(-48, 5);
      ctx.lineTo(-42, 0);
      ctx.lineTo(-34, 1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(78, 194, 255, 0.68)';
      ctx.lineWidth = 1.0;
      ctx.shadowColor = 'rgba(56, 189, 248, 1)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(-32, -8);
      ctx.lineTo(-42, -13);
      ctx.lineTo(-50, -6);
      ctx.moveTo(-32, 8);
      ctx.lineTo(-42, 13);
      ctx.lineTo(-50, 6);
      ctx.moveTo(-44, -4);
      ctx.lineTo(-44, 4);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.0;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.42)';
      ctx.shadowBlur = 3.5;
      ctx.beginPath();
      ctx.moveTo(-31, -8);
      ctx.lineTo(-40, -13);
      ctx.lineTo(-52, -5);
      ctx.lineTo(-44, 0);
      ctx.lineTo(-33, -2);
      ctx.moveTo(-31, 8);
      ctx.lineTo(-40, 13);
      ctx.lineTo(-52, 5);
      ctx.lineTo(-44, 0);
      ctx.lineTo(-33, 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#0D1724';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(14, -22);
      ctx.quadraticCurveTo(-10, -32, -34, -14);
      ctx.lineTo(-44, 0);
      ctx.lineTo(-34, 14);
      ctx.quadraticCurveTo(-10, 32, 14, 22);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = 'rgba(56, 189, 248, 0.88)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 8;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(14, -22);
      ctx.quadraticCurveTo(-10, -32, -34, -14);
      ctx.lineTo(-44, 0);
      ctx.lineTo(-34, 14);
      ctx.quadraticCurveTo(-10, 32, 14, 22);
      ctx.closePath();
      ctx.clip();

      const noseShade = ctx.createLinearGradient(8, 0, 34, 0);
      noseShade.addColorStop(0, 'rgba(5, 10, 18, 0)');
      noseShade.addColorStop(0.62, 'rgba(5, 10, 18, 0.08)');
      noseShade.addColorStop(1, 'rgba(5, 10, 18, 0.24)');

      ctx.fillStyle = noseShade;
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(18, -16);
      ctx.lineTo(9, -8);
      ctx.lineTo(9, 8);
      ctx.lineTo(18, 16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(6, 12, 20, 0.14)';
      ctx.beginPath();
      ctx.moveTo(33, 0);
      ctx.lineTo(24, -9);
      ctx.lineTo(20, -4);
      ctx.lineTo(20, 4);
      ctx.lineTo(24, 9);
      ctx.closePath();
      ctx.fill();

      const noseFacet = ctx.createLinearGradient(20, 0, 34, 0);
      noseFacet.addColorStop(0, 'rgba(56, 189, 248, 0)');
      noseFacet.addColorStop(0.58, 'rgba(56, 189, 248, 0.08)');
      noseFacet.addColorStop(1, 'rgba(125, 231, 255, 0.18)');

      ctx.fillStyle = noseFacet;
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(26, -6.5);
      ctx.lineTo(23, -2.5);
      ctx.lineTo(23, 2.5);
      ctx.lineTo(26, 6.5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(125, 231, 255, 0.42)';
      ctx.lineWidth = 0.75;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.36)';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(32.5, -0.8);
      ctx.lineTo(25.5, -6.2);
      ctx.moveTo(32.5, 0.8);
      ctx.lineTo(25.5, 6.2);
      ctx.moveTo(33.4, 0);
      ctx.lineTo(28.5, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#142231';
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(7, -16);
      ctx.quadraticCurveTo(-8, -22, -24, -11);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-24, 11);
      ctx.quadraticCurveTo(-8, 22, 7, 16);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(147, 220, 255, 0.22)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(-7, 0, 20, 13, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#0C1522';
      ctx.beginPath();
      ctx.ellipse(-7, 0, 15, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1C3044';
      ctx.beginPath();
      ctx.ellipse(-8, 0, 10, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#243C55';
      ctx.beginPath();
      ctx.ellipse(-6, 0, 5.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(127, 202, 255, 0.32)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(-3, -1);
      ctx.moveTo(-14, 4);
      ctx.lineTo(-3, 1);
      ctx.moveTo(-8, -6);
      ctx.lineTo(0, 0);
      ctx.lineTo(-8, 6);
      ctx.stroke();

      ctx.fillStyle = '#2DD394';
      ctx.beginPath();
      ctx.arc(18, 0, 6.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#98F7C9';
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.arc(18, 0, 2.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(152, 247, 201, 0.42)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(12.5, -4.5);
      ctx.lineTo(20, -1.6);
      ctx.lineTo(12.5, 1.6);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(60, 191, 255, 0.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-25, -7);
      ctx.quadraticCurveTo(-35, -14, -42, -10);
      ctx.moveTo(-25, 7);
      ctx.quadraticCurveTo(-35, 14, -42, 10);
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.globalAlpha = 0.58;
      ctx.beginPath();
      ctx.arc(-14, -7, 1.8, 0, Math.PI * 2);
      ctx.arc(-14, 7, 1.8, 0, Math.PI * 2);
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    getMedievalBasePose(points = CONFIG.PATH_POINTS) {
      const end = points[points.length - 1];
      const previous = points[points.length - 2] || end;
      const direction = TD.Utils.normalizeVector(end.x - previous.x, end.y - previous.y);
      const angle = Math.atan2(direction.y, direction.x);
      const distanceFromEnd = CONFIG.CURRENT_LAYOUT === 'mobile' ? 48 : 42;
      let centerX = end.x - direction.x * distanceFromEnd;
      const centerY = end.y - direction.y * distanceFromEnd;
      const edgePadding = CONFIG.CURRENT_LAYOUT === 'mobile' ? 44 : 36;

      // No mobile, empurrar o castelo mais para a direita para centralizar com o caminho
      if (CONFIG.CURRENT_LAYOUT === 'mobile') {
        centerX += 25;
      }

      return {
        x: TD.Utils.clamp(centerX, edgePadding, CONFIG.CANVAS_WIDTH - edgePadding),
        y: TD.Utils.clamp(centerY, edgePadding, CONFIG.CANVAS_HEIGHT - edgePadding),
        rotation: 0
      };
    }

    drawMedievalBase(points = CONFIG.PATH_POINTS) {
      const ctx = this.ctx;
      const pose = this.getMedievalBasePose(points);
      const scale = CONFIG.CURRENT_LAYOUT === 'mobile' ? 0.96 : 0.88;
      const outline = 'rgba(37, 31, 24, 0.56)';
      const stoneTop = '#707070';
      const stoneLeft = '#555555';
      const stoneRight = '#444444';
      const stoneFront = '#505050';
      const stoneEdge = '#606060';
      const roofTop = '#B7663F';
      const roofMid = '#8E4934';
      const roofDark = '#5B3029';
      const garden = '#4F7F43';
      const gardenLight = '#86A75D';
      const gardenDark = '#2F5832';
      const gardenBright = '#A9C868';
      const gardenMid = '#6FA84F';
      const statueLight = '#878581';
      const statueMid = '#686662';
      const statueDark = '#4E4C48';

      const drawPolygon = (points, fill, stroke = null, lineWidth = 1) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.fill();

        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      const drawPrism = (top, depth, palette = {}) => {
        const bottom = top.map((point) => ({ x: point.x, y: point.y + depth }));
        const centerX = top.reduce((sum, point) => sum + point.x, 0) / top.length;
        const centerY = top.reduce((sum, point) => sum + point.y, 0) / top.length;

        top.forEach((point, index) => {
          const nextIndex = (index + 1) % top.length;
          const next = top[nextIndex];
          const lowerNext = bottom[nextIndex];
          const lower = bottom[index];
          const avgX = (point.x + next.x) / 2;
          const avgY = (point.y + next.y) / 2;
          const fill = avgY > centerY
            ? (palette.front || stoneFront)
            : (avgX > centerX ? (palette.right || stoneRight) : (palette.left || stoneLeft));

          drawPolygon([point, next, lowerNext, lower], fill, outline);
        });

        drawPolygon(top, palette.top || stoneTop, palette.stroke || stoneEdge, 1.15);
      };

      const drawRoof = (cx, cy, width, height, squash = 0.58) => {
        const base = [
          { x: cx, y: cy - width * squash },
          { x: cx + width, y: cy },
          { x: cx, y: cy + width * squash },
          { x: cx - width, y: cy }
        ];
        const tip = { x: cx, y: cy - height };

        drawPolygon([base[0], base[1], tip], roofTop, outline, 1);
        drawPolygon([base[1], base[2], tip], roofMid, outline, 1);
        drawPolygon([base[2], base[3], tip], roofDark, outline, 1);
        drawPolygon([base[3], base[0], tip], '#9F5738', outline, 1);

        ctx.strokeStyle = 'rgba(255, 218, 160, 0.24)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - height + 6);
        ctx.lineTo(cx - width * 0.44, cy - width * 0.05);
        ctx.stroke();
      };

      const drawTower = (cx, cy, radius, height, roofHeight = 30) => {
        const top = [
          { x: cx, y: cy - radius * 0.62 },
          { x: cx + radius * 0.86, y: cy - radius * 0.16 },
          { x: cx + radius * 0.78, y: cy + radius * 0.5 },
          { x: cx, y: cy + radius * 0.82 },
          { x: cx - radius * 0.78, y: cy + radius * 0.5 },
          { x: cx - radius * 0.86, y: cy - radius * 0.16 }
        ];

        drawPrism(top, height, {
          top: '#757575',
          left: stoneLeft,
          right: stoneRight,
          front: stoneFront,
          stroke: stoneEdge
        });

        drawRoof(cx, cy - radius * 0.2, radius * 1.08, roofHeight, 0.54);

        ctx.fillStyle = '#3F4743';
        this.drawRoundedRect(ctx, cx - 3, cy + height * 0.52, 6, 11, 3);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 245, 220, 0.16)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.45, cy + radius * 0.62);
        ctx.lineTo(cx - radius * 0.45, cy + height + radius * 0.18);
        ctx.stroke();
      };

      const drawWarriorStatue = (cx, cy) => {
        drawPrism([
          { x: cx, y: cy - 10 },
          { x: cx + 14, y: cy - 2 },
          { x: cx, y: cy + 6 },
          { x: cx - 14, y: cy - 2 }
        ], 3, {
          top: statueMid,
          left: '#5E5C58',
          right: '#4A4844',
          front: '#56544F',
          stroke: '#9A968D'
        });

        drawPrism([
          { x: cx, y: cy - 6 },
          { x: cx + 10, y: cy },
          { x: cx, y: cy + 6 },
          { x: cx - 10, y: cy }
        ], 4, {
          top: statueLight,
          left: '#76746F',
          right: '#5C5A56',
          front: '#686662',
          stroke: '#A8A39A'
        });

        ctx.fillStyle = statueDark;
        this.drawRoundedRect(ctx, cx - 4, cy - 20, 8, 18, 2);
        ctx.fill();

        ctx.fillStyle = statueMid;
        this.drawRoundedRect(ctx, cx - 6, cy - 29, 12, 10, 3);
        ctx.fill();

        ctx.fillStyle = statueDark;
        this.drawRoundedRect(ctx, cx - 3, cy - 26, 2.5, 4, 1);
        ctx.fill();
        this.drawRoundedRect(ctx, cx + 0.5, cy - 26, 2.5, 4, 1);
        ctx.fill();

        ctx.fillStyle = statueLight;
        drawPolygon([
          { x: cx, y: cy - 35 },
          { x: cx + 7, y: cy - 29 },
          { x: cx, y: cy - 24 },
          { x: cx - 7, y: cy - 29 }
        ], statueLight, '#B1ACA2', 1);

        ctx.fillStyle = statueMid;
        this.drawRoundedRect(ctx, cx - 3.5, cy - 18, 7, 13, 2);
        ctx.fill();
        this.drawRoundedRect(ctx, cx - 12, cy - 20, 6, 8, 2);
        ctx.fill();
        this.drawRoundedRect(ctx, cx + 6, cy - 20, 6, 8, 2);
        ctx.fill();

        ctx.fillStyle = statueLight;
        this.drawRoundedRect(ctx, cx - 1.6, cy - 16, 3.2, 24, 1.5);
        ctx.fill();

        ctx.strokeStyle = '#B5B0A5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 34);
        ctx.lineTo(cx, cy - 24);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(90, 97, 107, 0.72)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 16);
        ctx.lineTo(cx + 10, cy - 16);
        ctx.moveTo(cx - 6, cy - 10);
        ctx.lineTo(cx - 1, cy - 4);
        ctx.moveTo(cx + 6, cy - 10);
        ctx.lineTo(cx + 1, cy - 4);
        ctx.stroke();
      };

      ctx.save();
      ctx.translate(pose.x, pose.y);
      ctx.rotate(pose.rotation);
      ctx.scale(scale, scale);
      ctx.translate(-29, -17);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 48, 80, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      drawPrism([
        { x: -66, y: -8 },
        { x: 0, y: -45 },
        { x: 66, y: -8 },
        { x: 70, y: 24 },
        { x: 0, y: 66 },
        { x: -70, y: 24 }
      ], 16, {
        top: '#575757',
        left: '#414141',
        right: '#343434',
        front: '#494949',
        stroke: '#6A6A6A'
      });

      drawPrism([
        { x: -56, y: -18 },
        { x: 0, y: -50 },
        { x: 57, y: -18 },
        { x: 58, y: 18 },
        { x: 0, y: 53 },
        { x: -58, y: 18 }
      ], 15, {
        top: '#7B7B7B',
        left: '#666666',
        right: '#585858',
        front: '#6A6A6A',
        stroke: '#8A8A8A'
      });

      ctx.strokeStyle = 'rgba(26, 26, 26, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-56, 18);
      ctx.lineTo(0, 53);
      ctx.lineTo(58, 18);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(214, 214, 214, 0.24)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-53, -16);
      ctx.lineTo(0, -46);
      ctx.lineTo(54, -16);
      ctx.stroke();

      // Porta do castelo
      ctx.fillStyle = '#2A2520';
      ctx.beginPath();
      ctx.moveTo(-12, 34);
      ctx.lineTo(-12, 10);
      ctx.quadraticCurveTo(0, 4, 12, 10);
      ctx.lineTo(12, 34);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Detalhes da porta (pregos)
      ctx.fillStyle = '#4A4540';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-6, 14 + i * 7, 1.5, 0, Math.PI * 2);
        ctx.arc(6, 14 + i * 7, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Janelas superiores
      ctx.fillStyle = '#1A1815';
      ctx.beginPath();
      ctx.moveTo(-28, -5);
      ctx.lineTo(-28, -18);
      ctx.lineTo(-18, -18);
      ctx.lineTo(-18, -5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#505050';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(28, -5);
      ctx.lineTo(28, -18);
      ctx.lineTo(18, -18);
      ctx.lineTo(18, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Grade das janelas
      ctx.strokeStyle = '#606060';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-23, -5);
      ctx.lineTo(-23, -18);
      ctx.moveTo(-18, -11.5);
      ctx.lineTo(-28, -11.5);
      ctx.moveTo(23, -5);
      ctx.lineTo(23, -18);
      ctx.moveTo(18, -11.5);
      ctx.lineTo(28, -11.5);
      ctx.stroke();

      // Bandeira no topo
      ctx.strokeStyle = '#3A3A3A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(0, -68);
      ctx.stroke();

      ctx.fillStyle = '#8B3A3A';
      ctx.beginPath();
      ctx.moveTo(0, -68);
      ctx.lineTo(18, -62);
      ctx.lineTo(0, -56);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5A2525';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Corrente ou corda decorativa
      ctx.strokeStyle = '#4A4035';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-62, 24);
      ctx.quadraticCurveTo(-65, 35, -62, 45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(62, 24);
      ctx.quadraticCurveTo(65, 35, 62, 45);
      ctx.stroke();

      drawPolygon([
        { x: -39, y: -10 },
        { x: 0, y: -32 },
        { x: 39, y: -10 },
        { x: 42, y: 14 },
        { x: 0, y: 40 },
        { x: -42, y: 14 }
      ], gardenDark, 'rgba(37, 67, 35, 0.76)', 1.1);

      drawPolygon([
        { x: -33, y: -8 },
        { x: 0, y: -27 },
        { x: 33, y: -8 },
        { x: 35, y: 13 },
        { x: 0, y: 34 },
        { x: -35, y: 13 }
      ], garden, 'rgba(95, 150, 74, 0.52)', 1);

      drawPolygon([
        { x: -26, y: -6 },
        { x: 0, y: -21 },
        { x: 26, y: -6 },
        { x: 27, y: 10 },
        { x: 0, y: 27 },
        { x: -27, y: 10 }
      ], gardenMid, 'rgba(126, 181, 93, 0.54)', 1);

      drawPolygon([
        { x: -17, y: -4 },
        { x: 0, y: -14 },
        { x: 17, y: -4 },
        { x: 18, y: 7 },
        { x: 0, y: 18 },
        { x: -18, y: 7 }
      ], '#79B35D', 'rgba(194, 229, 127, 0.5)', 1);

      ctx.fillStyle = gardenBright;
      ctx.beginPath();
      ctx.ellipse(-12, 5, 4.6, 2.4, -0.35, 0, Math.PI * 2);
      ctx.ellipse(12, 0, 4.8, 2.3, 0.25, 0, Math.PI * 2);
      ctx.ellipse(1, 13, 4.3, 2.1, 0.1, 0, Math.PI * 2);
      ctx.ellipse(0, -8, 4, 2, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(72, 122, 62, 0.62)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-24, 10);
      ctx.lineTo(0, -4);
      ctx.lineTo(24, 10);
      ctx.moveTo(-11, 18);
      ctx.lineTo(0, 12);
      ctx.lineTo(11, 18);
      ctx.stroke();

      const wallPalette = {
        top: stoneTop,
        left: stoneLeft,
        right: stoneRight,
        front: stoneFront,
        stroke: stoneEdge
      };

      drawPrism([
        { x: -52, y: -31 },
        { x: -9, y: -55 },
        { x: 1, y: -45 },
        { x: -44, y: -20 }
      ], 19, wallPalette);
      drawPrism([
        { x: 9, y: -55 },
        { x: 52, y: -31 },
        { x: 44, y: -20 },
        { x: -1, y: -45 }
      ], 19, wallPalette);

      drawTower(-55, -38, 17, 41, 31);
      drawTower(55, -38, 17, 41, 31);

      drawPrism([
        { x: -61, y: -15 },
        { x: -48, y: -23 },
        { x: -41, y: 27 },
        { x: -55, y: 36 }
      ], 19, wallPalette);
      drawPrism([
        { x: 48, y: -23 },
        { x: 61, y: -15 },
        { x: 55, y: 36 },
        { x: 41, y: 27 }
      ], 19, wallPalette);

      drawPrism([
        { x: -42, y: 28 },
        { x: 42, y: 28 },
        { x: 53, y: 39 },
        { x: 0, y: 66 },
        { x: -53, y: 39 }
      ], 20, wallPalette);

      drawWarriorStatue(0, 2);

      ctx.strokeStyle = 'rgba(255, 244, 214, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-43, -20);
      ctx.lineTo(-4, -42);
      ctx.moveTo(8, -42);
      ctx.lineTo(44, -21);
      ctx.moveTo(-33, 31);
      ctx.lineTo(33, 31);
      ctx.stroke();

      drawTower(-59, 22, 18, 41, 30);
      drawTower(59, 22, 18, 41, 30);

      ctx.fillStyle = gardenLight;
      ctx.beginPath();
      ctx.ellipse(-16, 9, 2.6, 1.5, -0.2, 0, Math.PI * 2);
      ctx.ellipse(17, 5, 2.6, 1.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawTowerSelectionRing(tower, emphasized = false, isMedieval = false) {
      const ctx = this.ctx;
      const color = isMedieval
        ? PLACED_TOWER_SELECTION_PALETTE.medievalRing
        : PLACED_TOWER_SELECTION_PALETTE.ring;

      ctx.save();
      ctx.translate(tower.x, tower.y);
      ctx.globalAlpha = emphasized ? 0.78 : 0.46;
      ctx.strokeStyle = color;
      ctx.lineWidth = emphasized ? 2.2 : 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, tower.radius + (emphasized ? 7 : 5), 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = emphasized ? 0.3 : 0.18;
      ctx.setLineDash([4, 5]);
      ctx.lineDashOffset = emphasized ? -2 : 0;
      ctx.beginPath();
      ctx.arc(0, 0, tower.radius + (emphasized ? 11 : 9), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawTowers(towers, selectedTower, hoveredTower, theme = TD.getThemeById(TD.DEFAULT_THEME_ID), upgrades = null, context = {}) {
      const orderedTowers = [...towers].sort((left, right) => {
        if (left.y === right.y) {
          return left.x - right.x;
        }

        return left.y - right.y;
      });

      orderedTowers.forEach((tower) => {
        const isSelected = selectedTower && selectedTower.id === tower.id;
        const isHovered = hoveredTower && hoveredTower.id === tower.id;
        const isMedieval = theme.id === 'medieval';
        const selectionColor = isMedieval
          ? PLACED_TOWER_SELECTION_PALETTE.medievalRange
          : PLACED_TOWER_SELECTION_PALETTE.range;

        if (isSelected || isHovered) {
          const range = TD.getEffectiveTowerRange ? TD.getEffectiveTowerRange(tower, upgrades) : tower.range;
          const clarityBonus = upgrades?.modifiers?.rangeClarityBonus ? 0.035 : 0;
          this.drawRange(tower.x, tower.y, range, selectionColor, (isSelected ? 0.1 : 0.055) + clarityBonus);
          this.drawTowerSelectionRing(tower, isSelected, isMedieval);
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
      ctx.fillText(`L${tower.level}`, tower.x, tower.y + 34);
      ctx.restore();
    }

    drawMedievalTower(tower, selected) {
      this.drawMedievalTowerShadow(tower, selected);

      const drawByType = {
        basic: this.drawMedievalArcherTower,
        rapid: this.drawMedievalXBow,
        heavy: this.drawMedievalRoyalCannon
      }[tower.type] || this.drawMedievalArcherTower;

      const ctx = this.ctx;
      ctx.save();
      ctx.translate(tower.x, tower.y);
      drawByType.call(this, tower, selected);
      ctx.restore();

      this.drawMedievalTowerLevel(tower);
    }

    drawMedievalTowerShadow(tower, selected) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = MEDIEVAL_TOWER_ART.shadow;
      ctx.globalAlpha = selected ? 0.34 : 0.26;
      ctx.beginPath();
      ctx.ellipse(tower.x, tower.y + 17, tower.type === 'heavy' ? 28 : 23, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawMedievalTowerLevel(tower) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = 'rgba(248, 235, 210, 0.86)';
      ctx.font = '600 11px Figtree, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`L${tower.level}`, tower.x, tower.y + 29);
      ctx.restore();
    }

    drawMedievalArcherTower(tower, selected) {
      const ctx = this.ctx;
      const art = MEDIEVAL_TOWER_ART;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
      ctx.shadowBlur = selected ? 10 : 4;
      ctx.shadowOffsetY = 2;

      // === BASE DE PEDRA (fundação) ===
      ctx.fillStyle = art.stoneDark;
      ctx.beginPath();
      ctx.moveTo(-22, 8);
      ctx.lineTo(-24, 2);
      ctx.lineTo(24, 2);
      ctx.lineTo(22, 8);
      ctx.closePath();
      ctx.fill();

      // === CORPO PRINCIPAL DA TORRE ===
      // Parede frontal de pedra
      ctx.fillStyle = art.stoneMid;
      ctx.beginPath();
      ctx.moveTo(-18, 2);
      ctx.lineTo(-20, -14);
      ctx.lineTo(20, -14);
      ctx.lineTo(18, 2);
      ctx.closePath();
      ctx.fill();

      // Detalhe de pedra mais clara (reforço central)
      ctx.fillStyle = art.stoneLight;
      ctx.beginPath();
      ctx.moveTo(-8, 2);
      ctx.lineTo(-10, -14);
      ctx.lineTo(10, -14);
      ctx.lineTo(8, 2);
      ctx.closePath();
      ctx.fill();

      // Detalhes de pedra (tijolos decorativos)
      ctx.fillStyle = art.stoneDark;
      ctx.fillRect(-16, -8, 6, 3);
      ctx.fillRect(10, -6, 6, 3);
      ctx.fillRect(-6, -2, 5, 2.5);
      ctx.fillRect(4, 0, 4, 2);

      // === PLATAFORMA SUPERIOR (topo defensivo) ===
      // Base da plataforma
      ctx.fillStyle = art.woodDark;
      ctx.beginPath();
      ctx.moveTo(-22, -14);
      ctx.lineTo(-24, -20);
      ctx.lineTo(24, -20);
      ctx.lineTo(22, -14);
      ctx.closePath();
      ctx.fill();

      // Ameias (parapeito dentado)
      ctx.fillStyle = art.stoneLight;
      const merlonPositions = [-20, -12, -4, 4, 12, 20];
      merlonPositions.forEach((x) => {
        ctx.fillRect(x - 3, -26, 6, 8);
      });

      // Vãos entre ameias
      ctx.fillStyle = art.stoneMid;
      ctx.fillRect(-16, -24, 4, 6);
      ctx.fillRect(-8, -24, 4, 6);
      ctx.fillRect(0, -24, 4, 6);
      ctx.fillRect(8, -24, 4, 6);

      ctx.fillStyle = art.royalRed;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(0, -32);
      ctx.lineTo(8, -30);
      ctx.lineTo(0, -28);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = art.woodDark;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(0, -32);
      ctx.stroke();

      // === ARQUEIRO (personagem em cima) ===
      // Corpo do arqueiro
      const archerAngle = Number.isFinite(tower.rotation) ? tower.rotation : 0;
      const archerFacing = Math.cos(archerAngle) < 0 ? -1 : 1;
      const archerTilt = TD.Utils.clamp(Math.sin(archerAngle) * 0.28, -0.28, 0.28);
      ctx.save();
      ctx.translate(0, -34);
      ctx.scale(archerFacing, 1);
      ctx.rotate(archerTilt);
      ctx.translate(0, 34);

      ctx.fillStyle = '#5C3D26'; // Tunica marrom escura
      ctx.beginPath();
      ctx.moveTo(-5, -26);
      ctx.lineTo(-6, -34);
      ctx.lineTo(6, -34);
      ctx.lineTo(5, -26);
      ctx.closePath();
      ctx.fill();

      // Cabeça do arqueiro
      ctx.fillStyle = '#E8D4B8'; // Pele clara
      ctx.beginPath();
      ctx.arc(0, -37, 4, 0, Math.PI * 2);
      ctx.fill();

      // Elmo/capacete do arqueiro
      ctx.fillStyle = art.steel;
      ctx.beginPath();
      ctx.arc(0, -38, 4.5, Math.PI, 0);
      ctx.fill();
      // Arco do arqueiro
      ctx.strokeStyle = art.wood;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(5, -34, 7, -Math.PI * 0.7, Math.PI * 0.3);
      ctx.stroke();

      // Corda do arco
      ctx.strokeStyle = art.parchment;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(5 - 6.5, -34 - 4);
      ctx.lineTo(5, -34);
      ctx.lineTo(5 - 6.5, -34 + 4);
      ctx.stroke();

      // Flecha apontando
      ctx.strokeStyle = art.steel;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(5 + 6, -34);
      ctx.lineTo(5 + 10, -34);
      ctx.stroke();
      ctx.fillStyle = art.iron;
      ctx.beginPath();
      ctx.moveTo(5 + 10, -34);
      ctx.lineTo(5 + 8, -35.5);
      ctx.lineTo(5 + 8, -32.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // === DETALHES ADICIONAIS ===
      // Madeira transversal (detalhe arquitetônico)
      ctx.fillStyle = art.wood;
      ctx.fillRect(-18, -16, 36, 3);
      ctx.fillStyle = art.woodDark;
      ctx.fillRect(-18, -16, 36, 1);

      // Moldura dourada sutil
      ctx.strokeStyle = 'rgba(214, 168, 79, 0.35)';
      ctx.lineWidth = selected ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(-20, -14);
      ctx.lineTo(-22, -20);
      ctx.lineTo(22, -20);
      ctx.lineTo(20, -14);
      ctx.stroke();

      // Círculo de alcance (shot pulse)
      ctx.restore();
    }

    drawMedievalXBow(tower, selected) {
      const ctx = this.ctx;
      const art = MEDIEVAL_TOWER_ART;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = selected ? 8 : 3;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 13, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = art.stoneDark;
      this.drawRoundedRect(ctx, -21, 4, 42, 15, 5);
      ctx.fill();
      ctx.fillStyle = art.stoneMid;
      this.drawRoundedRect(ctx, -17, -4, 34, 19, 5);
      ctx.fill();
      ctx.fillStyle = art.stoneLight;
      this.drawRoundedRect(ctx, -11, -7, 22, 6, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(231, 216, 182, 0.24)';
      ctx.lineWidth = selected ? 1.8 : 1.2;
      ctx.stroke();

      ctx.fillStyle = art.woodDark;
      ctx.beginPath();
      ctx.moveTo(-18, -4);
      ctx.lineTo(0, -18);
      ctx.lineTo(18, -4);
      ctx.lineTo(11, 5);
      ctx.lineTo(-11, 5);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.rotate(tower.rotation);

      ctx.fillStyle = art.wood;
      this.drawRoundedRect(ctx, -13, -5, 39 + tower.shotPulse * 3, 10, 4);
      ctx.fill();
      ctx.strokeStyle = art.goldDark;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.strokeStyle = art.steel;
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-18, -15);
      ctx.quadraticCurveTo(-3, -28, 18, -14);
      ctx.moveTo(-18, 15);
      ctx.quadraticCurveTo(-3, 28, 18, 14);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(231, 216, 182, 0.42)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-12, -10);
      ctx.quadraticCurveTo(-2, -18, 13, -10);
      ctx.moveTo(-12, 10);
      ctx.quadraticCurveTo(-2, 18, 13, 10);
      ctx.stroke();

      ctx.strokeStyle = art.parchment;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-18, -15);
      ctx.lineTo(-7 + tower.shotPulse * 3, 0);
      ctx.lineTo(-18, 15);
      ctx.stroke();

      ctx.fillStyle = art.goldDark;
      this.drawRoundedRect(ctx, 4, -7, 8, 14, 3);
      ctx.fill();

      ctx.strokeStyle = art.gold;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(31 + tower.shotPulse * 5, 0);
      ctx.stroke();

      ctx.fillStyle = art.gold;
      ctx.beginPath();
      ctx.moveTo(31 + tower.shotPulse * 5, 0);
      ctx.lineTo(26 + tower.shotPulse * 5, -3);
      ctx.lineTo(26 + tower.shotPulse * 5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = art.iron;
      ctx.beginPath();
      ctx.arc(14, 9, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = art.gold;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = art.goldDark;
      ctx.beginPath();
      ctx.arc(-14, 9, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    drawMedievalRoyalCannon(tower, selected) {
      const ctx = this.ctx;
      const art = MEDIEVAL_TOWER_ART;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
      ctx.shadowBlur = selected ? 9 : 4;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = art.woodDark;
      this.drawRoundedRect(ctx, -26, 1, 52, 21, 6);
      ctx.fill();
      ctx.fillStyle = art.wood;
      this.drawRoundedRect(ctx, -21, -7, 42, 20, 5);
      ctx.fill();
      ctx.fillStyle = 'rgba(231, 216, 182, 0.14)';
      this.drawRoundedRect(ctx, -17, -4, 34, 4, 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(231, 216, 182, 0.2)';
      ctx.lineWidth = selected ? 1.8 : 1.2;
      ctx.stroke();

      [-16, 16].forEach((x) => {
        ctx.fillStyle = '#2D261F';
        ctx.beginPath();
        ctx.arc(x, 16, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = art.goldDark;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#594431';
        ctx.beginPath();
        ctx.arc(x, 16, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = art.steel;
        ctx.beginPath();
        ctx.arc(x, 16, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.save();
      ctx.rotate(tower.rotation);
      const barrelLength = 43 + tower.shotPulse * 4;

      ctx.fillStyle = '#343434';
      this.drawRoundedRect(ctx, -11, -9, barrelLength, 18, 8);
      ctx.fill();
      ctx.fillStyle = '#5F5F5F';
      this.drawRoundedRect(ctx, -8, -7, barrelLength - 8, 6, 4);
      ctx.fill();
      ctx.fillStyle = '#262626';
      this.drawRoundedRect(ctx, 25, -11, 12 + tower.shotPulse * 3, 22, 5);
      ctx.fill();
      ctx.strokeStyle = '#8A8A83';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.fillStyle = art.gold;
      this.drawRoundedRect(ctx, -1, -10, 7, 20, 2);
      ctx.fill();
      ctx.fillStyle = art.goldDark;
      this.drawRoundedRect(ctx, 18, -10, 7, 20, 3);
      ctx.fill();

      ctx.fillStyle = '#151515';
      this.drawRoundedRect(ctx, 31, -6, 8 + tower.shotPulse * 3, 12, 5);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    drawEnemies(enemies, theme = TD.getThemeById(TD.DEFAULT_THEME_ID), time = 0) {
      enemies.forEach((enemy) => {
        TD.EnemyRenderer.drawEnemy(this.ctx, enemy, theme, time);
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
        if (theme.id === 'medieval') {
          this.drawMedievalProjectileTrail(ctx, projectile);
        } else {
          projectile.trail.forEach((point, index) => {
            ctx.globalAlpha = (index + 1) / projectile.trail.length * 0.16;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, projectile.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        ctx.globalAlpha = 1;
        ctx.shadowColor = color;
        ctx.shadowBlur = theme.id === 'medieval' ? 1.5 : 7;
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

    drawMedievalProjectileTrail(ctx, projectile) {
      const trailLength = projectile.trail.length || 1;

      projectile.trail.forEach((point, index) => {
        const alpha = (index + 1) / trailLength;

        ctx.save();
        ctx.translate(point.x, point.y);

        if (projectile.type === 'heavy') {
          ctx.globalAlpha = alpha * 0.14;
          ctx.fillStyle = '#5E5A53';
          ctx.beginPath();
          ctx.ellipse(0, 0, projectile.radius * 1.15, projectile.radius * 0.82, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = alpha * 0.1;
          ctx.fillStyle = '#857A67';
          ctx.beginPath();
          ctx.ellipse(-1, -1, projectile.radius * 0.8, projectile.radius * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const angle = Math.atan2(projectile.target.y - point.y, projectile.target.x - point.x);
          ctx.rotate(angle);
          ctx.globalAlpha = alpha * 0.18;
          ctx.strokeStyle = projectile.type === 'rapid' ? '#CBB893' : '#D9C8A3';
          ctx.lineWidth = projectile.type === 'rapid' ? 1.25 : 1.6;
          ctx.beginPath();
          ctx.moveTo(-5, 0);
          ctx.lineTo(3, 0);
          ctx.stroke();
        }

        ctx.restore();
      });
    }

    drawMedievalImpactEffect(ctx, effect, progress, alpha) {
      const dustColor = effect.color === '#ff5f7a' ? '#9E6258' : '#79685A';
      const dustHighlight = effect.color === '#ff5f7a' ? '#C08579' : '#B7A182';
      const chipColor = effect.color === '#ff5f7a' ? '#7C4A45' : '#54473D';

      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.shadowBlur = 0;

      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = dustColor;
      ctx.beginPath();
      ctx.ellipse(0, 2, effect.radius * (0.38 + progress * 0.55), effect.radius * (0.14 + progress * 0.18), 0, 0, Math.PI * 2);
      ctx.fill();

      effect.particles.forEach((particle, index) => {
        const px = particle.x * progress;
        const py = particle.y * progress;

        ctx.globalAlpha = alpha * particle.alpha * 0.55;
        ctx.fillStyle = index % 3 === 0 ? dustHighlight : dustColor;
        ctx.beginPath();
        ctx.ellipse(px, py, particle.size * 1.45, particle.size * 0.9, (effect.age * 0.002) + index, 0, Math.PI * 2);
        ctx.fill();

        if (index % 2 === 0) {
          ctx.globalAlpha = alpha * particle.alpha * 0.42;
          ctx.strokeStyle = chipColor;
          ctx.lineWidth = 1.15;
          ctx.beginPath();
          ctx.moveTo(px - particle.size * 0.8, py - particle.size * 0.25);
          ctx.lineTo(px + particle.size * 0.9, py + particle.size * 0.2);
          ctx.stroke();
        }
      });

      ctx.restore();
    }

    drawTowerSellEffect(ctx, effect, progress, alpha) {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.shadowBlur = 0;

      if (effect.sellStyle === 'dust') {
        ctx.globalAlpha = alpha * 0.24;
        ctx.fillStyle = effect.accent;
        ctx.beginPath();
        ctx.ellipse(0, effect.radius * 0.34, effect.radius * (0.72 + progress * 0.85), effect.radius * (0.18 + progress * 0.12), 0, 0, Math.PI * 2);
        ctx.fill();

        effect.particles.forEach((particle, index) => {
          ctx.globalAlpha = alpha * particle.alpha * 0.56;
          ctx.fillStyle = index % 2 === 0 ? effect.color : effect.accent;
          ctx.beginPath();
          ctx.ellipse(
            particle.x * progress,
            particle.y * progress * 0.76,
            particle.size * 1.25,
            particle.size * 0.82,
            index,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      } else {
        ctx.globalAlpha = alpha * 0.32;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, effect.radius * (0.55 + progress * 1.25), 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.12;
        ctx.fillStyle = effect.color;
        ctx.beginPath();
        ctx.arc(0, 0, effect.radius * (0.38 + progress * 0.42), 0, Math.PI * 2);
        ctx.fill();

        effect.particles.forEach((particle, index) => {
          ctx.globalAlpha = alpha * particle.alpha * 0.68;
          ctx.fillStyle = index % 2 === 0 ? effect.color : effect.accent;
          ctx.beginPath();
          ctx.arc(particle.x * progress, particle.y * progress, particle.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.textColor;
      ctx.font = '700 13px Figtree, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(effect.label, 0, -effect.radius * (0.8 + progress * 0.55));
      ctx.restore();
    }

    drawEffects(effects, behindActors, theme = TD.getThemeById(TD.DEFAULT_THEME_ID), time = 0) {
      effects
        .filter((effect) => Boolean(effect.behindActors) === behindActors)
        .forEach((effect) => {
          const ctx = this.ctx;

          if (effect.type === 'enemyDeath') {
            TD.EnemyRenderer.drawEnemyDeathEffect(ctx, effect, theme, time);
            return;
          }

          if (effect.type === 'towerSell') {
            const progress = effect.age / effect.duration;
            const alpha = Math.max(0, 1 - progress);

            this.drawTowerSellEffect(ctx, effect, progress, alpha);
            return;
          }

          const progress = effect.age / effect.duration;
          const alpha = Math.max(0, 1 - progress);

          ctx.save();
          if (effect.impactStyle === 'medievalDust') {
            this.drawMedievalImpactEffect(ctx, effect, progress, alpha);
            ctx.restore();
            return;
          }

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
      const color = valid ? state.theme.palette.success : state.theme.palette.danger;
      const rangeAlpha = (state.theme.id === 'medieval' ? 0.07 : 0.085) + (state.upgrades?.modifiers?.rangeClarityBonus ? 0.03 : 0);
      const range = state.selectedTowerRange || towerType.range;

      this.drawRange(state.mouse.x, state.mouse.y, range, color, rangeAlpha);

      if (state.theme.id === 'medieval') {
        this.drawMedievalPlacementGhost(state.selectedTowerType, state.mouse.x, state.mouse.y, valid, color);
        return;
      }

      this.drawFuturisticPlacementGhost(state.selectedTowerType, state.mouse.x, state.mouse.y, valid, color);
    }

    drawFuturisticPlacementGhost(type, x, y, valid, color) {
      const ctx = this.ctx;
      const towerType = TOWER_TYPES[type] || TOWER_TYPES.basic;
      const radius = CONFIG.TOWER_RADIUS;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = valid ? 0.78 : 0.48;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#0d141f';
      ctx.strokeStyle = towerType.color;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      for (let side = 0; side < 6; side += 1) {
        const angle = Math.PI / 6 + side * Math.PI / 3;
        const pointX = Math.cos(angle) * radius;
        const pointY = Math.sin(angle) * radius;

        if (side === 0) {
          ctx.moveTo(pointX, pointY);
        } else {
          ctx.lineTo(pointX, pointY);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.rotate(-Math.PI / 10);
      ctx.fillStyle = towerType.accent;
      ctx.fillRect(-2, -4, radius + 10, 8);
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = towerType.color;
      ctx.fill();

      ctx.rotate(Math.PI / 10);
      ctx.globalAlpha = valid ? 0.56 : 0.68;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawMedievalPlacementGhost(type, x, y, valid, color) {
      const ctx = this.ctx;
      const ghostTower = {
        type,
        radius: CONFIG.TOWER_RADIUS,
        rotation: -Math.PI / 10,
        shotPulse: 0
      };
      const drawByType = {
        basic: this.drawMedievalArcherTower,
        rapid: this.drawMedievalXBow,
        heavy: this.drawMedievalRoyalCannon
      }[type] || this.drawMedievalArcherTower;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = valid ? 0.82 : 0.46;
      drawByType.call(this, ghostTower, valid);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, CONFIG.TOWER_RADIUS + 8, 0, Math.PI * 2);
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
