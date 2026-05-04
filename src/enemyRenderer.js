(function enemyRendererModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const HIT_FLASH_DURATION = 150;

  function clamp01(value) {
    return TD.Utils.clamp(value, 0, 1);
  }

  function getEnemyInfo(enemy, theme) {
    if (theme && theme.id && typeof TD.getThemeEnemyInfo === 'function') {
      return TD.getThemeEnemyInfo(theme.id, enemy.type);
    }

    return {};
  }

  function getAnimationState(enemy, time) {
    const offset = enemy.animationOffset || 0;
    const hitRatio = clamp01((enemy.hitTimer || 0) / HIT_FLASH_DURATION);
    const walkSpeed = enemy.type === 'fast' ? 0.016 : enemy.type === 'tank' ? 0.005 : 0.009;
    const walkCycle = Math.sin(time * walkSpeed + offset);
    const altCycle = Math.cos(time * walkSpeed * 1.35 + offset);
    const shakeStrength = hitRatio * (enemy.type === 'tank' ? 2.2 : 1.15);

    return {
      offset,
      walkCycle,
      altCycle,
      hitRatio,
      bob: walkCycle * (enemy.type === 'tank' ? 1.15 : enemy.type === 'fast' ? 1.7 : 2.2),
      wobble: Math.sin(time * 0.003 + offset) * (enemy.type === 'tank' ? 0.035 : 0.075),
      pulse: 0.5 + Math.sin(time * 0.006 + offset) * 0.5,
      shakeX: hitRatio ? Math.sin(time * 0.11 + offset) * shakeStrength : 0,
      shakeY: hitRatio ? Math.cos(time * 0.13 + offset) * shakeStrength * 0.65 : 0
    };
  }

  function roundedRect(ctx, x, y, width, height, radius) {
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

  function drawLocalShadow(ctx, radius, alpha = 0.32, scaleX = 1.25) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.58, radius * scaleX, radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHexagon(ctx, radius) {
    ctx.beginPath();
    for (let index = 0; index < 6; index += 1) {
      const angle = Math.PI / 6 + index * Math.PI / 3;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
  }

  function drawDamageFlash(ctx, enemy, theme, radius) {
    const hitRatio = clamp01((enemy.hitTimer || 0) / HIT_FLASH_DURATION);

    if (!hitRatio) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = 0.18 + hitRatio * 0.34;
    ctx.fillStyle = hitRatio > 0.55 ? '#ffffff' : (theme.palette?.danger || '#f43f5e');
    ctx.shadowColor = theme.palette?.danger || '#f43f5e';
    ctx.shadowBlur = 8 * hitRatio;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.16, radius * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFuturisticEnemy(ctx, enemy, theme, time, animationState) {
    const info = getEnemyInfo(enemy, theme);

    if (info.renderer === 'sondaCortante') {
      drawSondaCortante(ctx, enemy, theme, time, animationState, info);
      return;
    }

    if (info.renderer === 'colossoBlindado') {
      drawColossoBlindado(ctx, enemy, theme, time, animationState, info);
      return;
    }

    drawDroneVigia(ctx, enemy, theme, time, animationState, info);
  }

  function drawMedievalEnemy(ctx, enemy, theme, time, animationState) {
    const info = getEnemyInfo(enemy, theme);

    if (info.renderer === 'loboSombrio') {
      drawLoboSombrio(ctx, enemy, theme, time, animationState, info);
      return;
    }

    if (info.renderer === 'ogroDeCerco') {
      drawOgroDeCerco(ctx, enemy, theme, time, animationState, info);
      return;
    }

    drawGoblinSaqueador(ctx, enemy, theme, time, animationState, info);
  }

  function drawDroneVigia(ctx, enemy, theme, time, animationState, info) {
    const radius = enemy.radius;
    const pulse = animationState.pulse;
    const accent = info.accent || enemy.accent;
    const glow = info.glow || accent;

    drawLocalShadow(ctx, radius, 0.28, 1.45);
    ctx.rotate(animationState.wobble);

    ctx.save();
    ctx.globalAlpha = 0.42 + pulse * 0.28;
    ctx.fillStyle = glow;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.78, -radius * 0.82, radius * 0.32, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.ellipse(-radius * 0.78, radius * 0.82, radius * 0.32, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#101826';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    roundedRect(ctx, -radius * 1.24, -radius * 0.32, radius * 0.72, radius * 0.64, radius * 0.22);
    ctx.fill();
    ctx.stroke();
    roundedRect(ctx, radius * 0.52, -radius * 0.32, radius * 0.72, radius * 0.64, radius * 0.22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = info.color || '#172131';
    ctx.strokeStyle = 'rgba(226, 244, 255, 0.52)';
    ctx.lineWidth = 1.4;
    drawHexagon(ctx, radius * 0.86);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.2, -radius * 0.78);
    ctx.lineTo(radius * 0.15, -radius * 1.15);
    ctx.stroke();

    ctx.shadowColor = accent;
    ctx.shadowBlur = 9;
    ctx.fillStyle = '#07131f';
    ctx.beginPath();
    ctx.arc(radius * 0.18, 0, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.stroke();

    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.72 + pulse * 0.28;
    ctx.beginPath();
    ctx.arc(radius * 0.18, 0, radius * (0.17 + pulse * 0.05), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    drawDamageFlash(ctx, enemy, theme, radius);
  }

  function drawSondaCortante(ctx, enemy, theme, time, animationState, info) {
    const radius = enemy.radius;
    const accent = info.accent || '#EF4444';
    const glow = info.glow || accent;
    const jitter = animationState.altCycle * 0.8;

    drawLocalShadow(ctx, radius, 0.18, 1.6);

    ctx.save();
    ctx.globalAlpha = 0.18 + animationState.pulse * 0.18;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(-radius * 1.05, -radius * 0.26 + jitter * 0.2);
    ctx.lineTo(-radius * 2.05, 0);
    ctx.lineTo(-radius * 1.05, radius * 0.26 - jitter * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = info.color || '#0D2430';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.45;
    ctx.beginPath();
    ctx.moveTo(radius * 1.18, 0);
    ctx.lineTo(-radius * 0.72, -radius * 0.66);
    ctx.lineTo(-radius * 0.36, 0);
    ctx.lineTo(-radius * 0.72, radius * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(251, 146, 60, 0.76)';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.2, -radius * 0.56);
    ctx.lineTo(radius * 0.38, -radius * 0.16);
    ctx.lineTo(-radius * 0.08, -radius * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.2, radius * 0.56);
    ctx.lineTo(radius * 0.38, radius * 0.16);
    ctx.lineTo(-radius * 0.08, radius * 0.06);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(radius * 0.16, 0, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.16 + animationState.pulse * 0.2;
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1;
    for (let index = 0; index < 3; index += 1) {
      const y = (index - 1) * radius * 0.45;
      ctx.beginPath();
      ctx.moveTo(-radius * (1.55 + index * 0.12), y);
      ctx.lineTo(-radius * (2.08 + index * 0.2), y + animationState.walkCycle * 1.2);
      ctx.stroke();
    }
    ctx.restore();

    drawDamageFlash(ctx, enemy, theme, radius);
  }

  function drawColossoBlindado(ctx, enemy, theme, time, animationState, info) {
    const radius = enemy.radius;
    const accent = info.accent || '#F97316';
    const glow = info.glow || accent;
    const sway = animationState.walkCycle * 1.2;

    drawLocalShadow(ctx, radius, 0.38, 1.45);
    ctx.rotate(animationState.wobble * 0.65);

    ctx.fillStyle = '#111827';
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.lineWidth = 1.4;
    roundedRect(ctx, -radius * 1.02, -radius * 0.78 + sway * 0.08, radius * 2.04, radius * 1.56, radius * 0.38);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = info.color || '#26313E';
    roundedRect(ctx, -radius * 0.72, -radius * 0.92, radius * 1.44, radius * 1.84, radius * 0.34);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.stroke();

    ctx.fillStyle = '#394656';
    roundedRect(ctx, -radius * 1.24, -radius * 0.54 + sway * 0.12, radius * 0.46, radius * 1.08, radius * 0.18);
    ctx.fill();
    roundedRect(ctx, radius * 0.78, -radius * 0.54 - sway * 0.12, radius * 0.46, radius * 1.08, radius * 0.18);
    ctx.fill();

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.28)';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.48, -radius * 0.35);
    ctx.lineTo(radius * 0.48, -radius * 0.35);
    ctx.moveTo(-radius * 0.48, radius * 0.35);
    ctx.lineTo(radius * 0.48, radius * 0.35);
    ctx.stroke();

    ctx.shadowColor = glow;
    ctx.shadowBlur = 9 + animationState.pulse * 4;
    ctx.fillStyle = '#190A08';
    ctx.beginPath();
    ctx.arc(radius * 0.12, 0, radius * 0.43, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.52 + animationState.pulse * 0.38;
    ctx.beginPath();
    ctx.arc(radius * 0.12, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (animationState.hitRatio) {
      ctx.save();
      ctx.globalAlpha = animationState.hitRatio;
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 1.3;
      for (let index = 0; index < 3; index += 1) {
        const sparkX = -radius * 0.45 + index * radius * 0.42;
        ctx.beginPath();
        ctx.moveTo(sparkX, -radius * 0.9);
        ctx.lineTo(sparkX + 4, -radius * 1.17);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawDamageFlash(ctx, enemy, theme, radius * 1.05);
  }

  function drawGoblinSaqueador(ctx, enemy, theme, time, animationState, info) {
    const radius = enemy.radius;
    const skin = info.color || '#6CA86E';
    const accent = info.accent || '#D6A84F';
    const step = animationState.walkCycle;
    const stride = step * radius * 0.18;
    const lift = Math.abs(step) * radius * 0.07;
    const outline = '#172512';
    const skinLight = '#86BE78';
    const skinDark = '#3F7C45';
    const leather = '#5A351F';
    const leatherDark = '#2A190E';
    const cloth = '#2F5F38';
    const clothDark = '#18351F';

    drawLocalShadow(ctx, radius, 0.32, 1.42);
    ctx.rotate(animationState.wobble * 0.38);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Back arm and knife silhouette.
    ctx.save();
    ctx.rotate(0.08 + step * 0.035);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(radius * 0.04, -radius * 0.04);
    ctx.quadraticCurveTo(radius * 0.42, radius * 0.18, radius * 0.75, radius * 0.07);
    ctx.stroke();

    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.04, -radius * 0.04);
    ctx.quadraticCurveTo(radius * 0.42, radius * 0.18, radius * 0.75, radius * 0.07);
    ctx.stroke();

    ctx.fillStyle = skin;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(radius * 0.75, radius * 0.07, radius * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#6B4428';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(radius * 0.74, radius * 0.06);
    ctx.lineTo(radius * 1.03, -radius * 0.03);
    ctx.stroke();

    ctx.fillStyle = '#D8DEE8';
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(radius * 1.04, -radius * 0.13);
    ctx.lineTo(radius * 1.5, -radius * 0.26);
    ctx.lineTo(radius * 1.1, radius * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Legs and boots.
    ctx.strokeStyle = leatherDark;
    ctx.lineWidth = 2.2;
    ctx.fillStyle = '#342313';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.38, radius * 0.43);
    ctx.lineTo(-radius * 0.66 - stride, radius * 0.86 - lift);
    ctx.moveTo(radius * 0.12, radius * 0.43);
    ctx.lineTo(radius * 0.42 + stride, radius * 0.86 - lift);
    ctx.stroke();

    ctx.fillStyle = '#15100A';
    roundedRect(ctx, -radius * 0.78 - stride, radius * 0.78 - lift, radius * 0.36, radius * 0.16, radius * 0.05);
    ctx.fill();
    roundedRect(ctx, radius * 0.28 + stride, radius * 0.78 - lift, radius * 0.4, radius * 0.16, radius * 0.05);
    ctx.fill();

    // Tunic and belt.
    ctx.fillStyle = leather;
    ctx.strokeStyle = leatherDark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.62, -radius * 0.28);
    ctx.quadraticCurveTo(-radius * 0.72, radius * 0.12, -radius * 0.52, radius * 0.52);
    ctx.lineTo(radius * 0.42, radius * 0.52);
    ctx.quadraticCurveTo(radius * 0.52, radius * 0.1, radius * 0.34, -radius * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3D2516';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.46, -radius * 0.17);
    ctx.lineTo(radius * 0.28, -radius * 0.17);
    ctx.lineTo(radius * 0.18, radius * 0.31);
    ctx.lineTo(-radius * 0.38, radius * 0.34);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.56, radius * 0.16);
    ctx.lineTo(radius * 0.34, radius * 0.16);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(-radius * 0.02, radius * 0.16, radius * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Ears behind the head.
    ctx.fillStyle = cloth;
    ctx.strokeStyle = clothDark;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(radius * 0.16, -radius * 0.42);
    ctx.lineTo(-radius * 0.58, -radius * 0.83);
    ctx.lineTo(-radius * 0.24, -radius * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(radius * 0.57, -radius * 0.58);
    ctx.lineTo(radius * 0.26, -radius * 1.07);
    ctx.lineTo(radius * 0.87, -radius * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Head and face.
    ctx.fillStyle = skin;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.08, -radius * 0.56);
    ctx.quadraticCurveTo(radius * 0.22, -radius * 0.88, radius * 0.72, -radius * 0.72);
    ctx.quadraticCurveTo(radius * 1.03, -radius * 0.62, radius * 1.02, -radius * 0.28);
    ctx.quadraticCurveTo(radius * 0.94, radius * 0.02, radius * 0.48, radius * 0.1);
    ctx.quadraticCurveTo(radius * 0.02, radius * 0.04, -radius * 0.08, -radius * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const cheek = ctx.createLinearGradient(radius * 0.05, -radius * 0.6, radius * 0.95, 0);
    cheek.addColorStop(0, skinLight);
    cheek.addColorStop(0.62, skin);
    cheek.addColorStop(1, skinDark);
    ctx.fillStyle = cheek;
    ctx.beginPath();
    ctx.moveTo(radius * 0.04, -radius * 0.51);
    ctx.quadraticCurveTo(radius * 0.32, -radius * 0.72, radius * 0.72, -radius * 0.6);
    ctx.quadraticCurveTo(radius * 0.86, -radius * 0.47, radius * 0.8, -radius * 0.28);
    ctx.quadraticCurveTo(radius * 0.56, -radius * 0.14, radius * 0.22, -radius * 0.22);
    ctx.quadraticCurveTo(radius * 0.0, -radius * 0.3, radius * 0.04, -radius * 0.51);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#24411E';
    ctx.beginPath();
    ctx.moveTo(radius * 0.68, -radius * 0.46);
    ctx.quadraticCurveTo(radius * 1.0, -radius * 0.4, radius * 0.98, -radius * 0.27);
    ctx.quadraticCurveTo(radius * 0.84, -radius * 0.21, radius * 0.7, -radius * 0.31);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(radius * 0.55, -radius * 0.39, radius * 0.082, radius * 0.11, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E8D7A8';
    ctx.beginPath();
    ctx.arc(radius * 0.58, -radius * 0.42, radius * 0.026, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#18280F';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(radius * 0.23, -radius * 0.56);
    ctx.lineTo(radius * 0.65, -radius * 0.5);
    ctx.stroke();

    ctx.strokeStyle = '#1B2A11';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(radius * 0.76, -radius * 0.06);
    ctx.lineTo(radius * 0.42, -radius * 0.02);
    ctx.stroke();

    ctx.fillStyle = '#E8D7A8';
    ctx.beginPath();
    ctx.moveTo(radius * 0.68, -radius * 0.01);
    ctx.lineTo(radius * 0.81, radius * 0.1);
    ctx.lineTo(radius * 0.57, radius * 0.06);
    ctx.closePath();
    ctx.fill();

    // Front arm.
    ctx.strokeStyle = '#35502B';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.02, -radius * 0.02);
    ctx.lineTo(-radius * 0.54, radius * (0.18 - step * 0.05));
    ctx.stroke();

    // Cap and red bandana keep the original goblin identity.
    ctx.fillStyle = '#4A2B19';
    ctx.strokeStyle = '#24140A';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.03, -radius * 0.62);
    ctx.quadraticCurveTo(radius * 0.25, -radius * 1.08, radius * 0.78, -radius * 0.82);
    ctx.quadraticCurveTo(radius * 0.58, -radius * 0.66, radius * 0.12, -radius * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#70482A';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.1, -radius * 0.6);
    ctx.quadraticCurveTo(radius * 0.23, -radius * 0.76, radius * 0.83, -radius * 0.6);
    ctx.quadraticCurveTo(radius * 0.54, -radius * 0.51, radius * 0.03, -radius * 0.52);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#9B2E2C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.02, -radius * 0.58);
    ctx.quadraticCurveTo(radius * 0.36, -radius * 0.67, radius * 0.78, -radius * 0.57);
    ctx.stroke();

    drawDamageFlash(ctx, enemy, theme, radius);
  }

  function drawLoboSombrio(ctx, enemy, theme, time, animationState, info) {
   const radius = enemy.radius;
            const wolfScale = 1.08;
            const step = animationState.walkCycle;
            const hBob = animationState.bob * 0.3; 
            
            const furDark = '#4A413C'; 
            const furMid = '#746760';  
            const furLight = '#B0A290'; 
            const outline = '#231D1A';

            drawLocalShadow(ctx, radius * wolfScale, 0.2, 1.4);
            
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.save();
            ctx.scale(wolfScale, wolfScale);
            ctx.rotate(Math.sin(time * 0.005) * 0.05);

            // --- FUNÇÃO AUXILIAR PARA PERNAS (UNIFICADAS E FLUIDAS) ---
            const drawWolfLeg = (x, y, swing, isBackLeg, isDark) => {
                const lift = Math.max(0, -Math.sin(swing * 2)) * radius * 0.15; 
                const lowerY = radius * 0.40 - lift; 
                const lowerRot = -swing * 0.8;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(swing);

                // --- 1. FILL DA CANELA/PATA (Parte de Baixo) ---
                // Desenhada primeiro para que o topo fique por debaixo da coxa
                ctx.save();
                ctx.translate(0, lowerY);
                ctx.rotate(lowerRot);
                ctx.fillStyle = isDark ? furMid : furLight;
                ctx.beginPath();
                if (isBackLeg) {
                    ctx.moveTo(-radius * 0.15, -radius * 0.15); // Sobe bem lá para cima na coxa
                    ctx.lineTo(radius * 0.15, -radius * 0.15);
                    ctx.lineTo(radius * 0.08, radius * 0.25);
                    ctx.bezierCurveTo(radius * 0.20, radius * 0.35, radius * 0.15, radius * 0.45, radius * 0.10, radius * 0.45);
                    ctx.lineTo(-radius * 0.10, radius * 0.45);
                    ctx.quadraticCurveTo(-radius * 0.12, radius * 0.35, -radius * 0.08, radius * 0.25);
                    ctx.lineTo(-radius * 0.16, radius * 0.05);
                } else {
                    ctx.moveTo(-radius * 0.15, -radius * 0.15);
                    ctx.lineTo(radius * 0.15, -radius * 0.15);
                    ctx.lineTo(radius * 0.08, radius * 0.25);
                    ctx.bezierCurveTo(radius * 0.20, radius * 0.35, radius * 0.15, radius * 0.45, radius * 0.10, radius * 0.45);
                    ctx.lineTo(-radius * 0.10, radius * 0.45);
                    ctx.quadraticCurveTo(-radius * 0.12, radius * 0.35, -radius * 0.08, radius * 0.25);
                }
                ctx.closePath();
                ctx.fill();

                // --- 2. CONTORNO DA CANELA (Aberto no topo!) ---
                // Desenhamos apenas as laterais e o fundo da canela. 
                // Não há linha preta no topo (joelho), removendo o efeito de armadura.
                ctx.strokeStyle = outline;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                if (isBackLeg) {
                    ctx.moveTo(radius * 0.09, -radius * 0.05); // Nasce da borda frontal
                    ctx.lineTo(radius * 0.08, radius * 0.25);
                    ctx.bezierCurveTo(radius * 0.20, radius * 0.35, radius * 0.15, radius * 0.45, radius * 0.10, radius * 0.45);
                    ctx.lineTo(-radius * 0.10, radius * 0.45);
                    ctx.quadraticCurveTo(-radius * 0.12, radius * 0.35, -radius * 0.08, radius * 0.25);
                    ctx.lineTo(-radius * 0.16, radius * 0.05); // Termina na borda traseira
                } else {
                    ctx.moveTo(radius * 0.09, -radius * 0.02);
                    ctx.lineTo(radius * 0.08, radius * 0.25);
                    ctx.bezierCurveTo(radius * 0.20, radius * 0.35, radius * 0.15, radius * 0.45, radius * 0.10, radius * 0.45);
                    ctx.lineTo(-radius * 0.10, radius * 0.45);
                    ctx.quadraticCurveTo(-radius * 0.12, radius * 0.35, -radius * 0.08, radius * 0.25);
                    ctx.lineTo(-radius * 0.09, -radius * 0.02);
                }
                ctx.stroke();

                // Linhas dos dedinhos
                ctx.beginPath();
                ctx.moveTo(radius * 0.06, radius * 0.45);
                ctx.lineTo(radius * 0.03, radius * 0.38);
                ctx.moveTo(-radius * 0.01, radius * 0.45);
                ctx.lineTo(-radius * 0.03, radius * 0.38);
                ctx.stroke();
                
                ctx.restore(); // Fim da Canela/Pata

                // --- 3. FILL DA COXA (Parte de Cima) ---
                // Desenhado *por cima* da pata para a cobrir como um músculo real
                ctx.fillStyle = isDark ? furDark : furMid;
                ctx.beginPath();
                if (isBackLeg) {
                    ctx.ellipse(-radius * 0.05, radius * 0.15, radius * 0.16, radius * 0.28, -0.2, 0, Math.PI * 2);
                } else {
                    ctx.ellipse(0, radius * 0.15, radius * 0.14, radius * 0.26, 0.1, 0, Math.PI * 2);
                }
                ctx.fill();

                // --- 4. CONTORNO DA COXA (Aberto em Baixo!) ---
                // Desenhamos a linha só nas laterais e em cima.
                // O fundo da elipse não é desenhado, fazendo a cor fundir-se com a canela!
                ctx.strokeStyle = isDark ? outline : 'rgba(35, 29, 26, 0.15)'; 
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                if (isBackLeg) {
                    // Omitindo cerca de 30% da circunferência em baixo
                    ctx.ellipse(-radius * 0.05, radius * 0.15, radius * 0.16, radius * 0.28, -0.2, Math.PI * 0.7, Math.PI * 2.3);
                } else {
                    ctx.ellipse(0, radius * 0.15, radius * 0.14, radius * 0.26, 0.1, Math.PI * 0.7, Math.PI * 2.3);
                }
                ctx.stroke();

                ctx.restore(); // Fim da perna inteira
            };

            // --- PERNAS DE TRÁS (Fundo) ---
            drawWolfLeg(-radius * 0.35, -radius * 0.05, step * 0.6, true, true);
            drawWolfLeg(radius * 0.35, -radius * 0.05, -step * 0.6, false, true);

            // --- CAUDA (Perfeitamente integrada à anca) ---
            ctx.save();
            ctx.translate(-radius * 0.65, -radius * 0.4); 
            ctx.rotate(-0.3 + step * 0.15); 

            ctx.fillStyle = furDark;
            ctx.strokeStyle = outline;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(radius * 0.05, -radius * 0.05);
            ctx.bezierCurveTo(-radius * 0.1, radius * 0.1, -radius * 0.3, radius * 0.35, -radius * 0.45, radius * 0.35);
            ctx.bezierCurveTo(-radius * 0.2, radius * 0.15, -radius * 0.1, radius * 0.05, -radius * 0.1, -radius * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = furMid;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-radius * 0.08, radius * 0.1, -radius * 0.25, radius * 0.25, -radius * 0.35, radius * 0.28);
            ctx.bezierCurveTo(-radius * 0.15, radius * 0.15, -radius * 0.05, radius * 0.05, -radius * 0.05, 0);
            ctx.fill();
            ctx.restore();

            // --- ORELHA ESQUERDA (Fundo) ---
            ctx.save();
            ctx.translate(radius * 0.55, -radius * 0.45 + hBob);
            ctx.fillStyle = furDark;
            ctx.strokeStyle = outline;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-radius * 0.05, -radius * 0.05);
            ctx.lineTo(radius * 0.05, -radius * 0.28);
            ctx.lineTo(radius * 0.15, -radius * 0.05);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // === SILHUETA DO CORPO (Orgânica e Elegante) ===
            ctx.fillStyle = furMid; 
            ctx.strokeStyle = outline;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            ctx.moveTo(-radius * 0.65, -radius * 0.45); // Começa na base da cauda
            ctx.bezierCurveTo(-radius * 0.3, -radius * 0.55, radius * 0.1, -radius * 0.55, radius * 0.35, -radius * 0.55 + (hBob * 0.3));
            ctx.bezierCurveTo(radius * 0.5, -radius * 0.65 + hBob, radius * 0.65, -radius * 0.65 + hBob, radius * 0.8, -radius * 0.55 + hBob);
            
            // Focinho de lobo alongado
            ctx.bezierCurveTo(radius * 0.9, -radius * 0.5 + hBob, radius * 1.05, -radius * 0.35 + hBob, radius * 1.2, -radius * 0.25 + hBob);
            ctx.bezierCurveTo(radius * 1.0, -radius * 0.15 + hBob, radius * 0.8, -radius * 0.05 + hBob, radius * 0.55, -radius * 0.05 + hBob);
            
            // Pescoço e barriga fluídos
            ctx.bezierCurveTo(radius * 0.5, -radius * 0.05 + (hBob * 0.3), radius * 0.55, -radius * 0.05, radius * 0.45, -radius * 0.05);
            ctx.bezierCurveTo(radius * 0.1, radius * 0.05, -radius * 0.2, -radius * 0.05, -radius * 0.45, -radius * 0.15);
            ctx.bezierCurveTo(-radius * 0.7, -radius * 0.2, -radius * 0.75, -radius * 0.45, -radius * 0.65, -radius * 0.45);
            
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // --- MANCHAS CLARAS NA BARRIGA ---
            ctx.fillStyle = furLight;
            ctx.beginPath();
            ctx.moveTo(radius * 0.45, -radius * 0.05);
            ctx.bezierCurveTo(radius * 0.1, radius * 0.05, -radius * 0.2, -radius * 0.05, -radius * 0.45, -radius * 0.15);
            ctx.bezierCurveTo(-radius * 0.15, -radius * 0.08, radius * 0.1, -radius * 0.05, radius * 0.35, -radius * 0.15);
            ctx.quadraticCurveTo(radius * 0.45, -radius * 0.1, radius * 0.45, -radius * 0.05);
            ctx.fill();

            // --- PERNAS DA FRENTE (Primeiro plano) ---
            drawWolfLeg(-radius * 0.35, -radius * 0.05, -step * 0.6, true, false);
            drawWolfLeg(radius * 0.35, -radius * 0.05, step * 0.6, false, false);

            // --- DETALHES DO ROSTO ---
            ctx.save();
            ctx.translate(radius * 0.55, -radius * 0.45 + hBob);

            // Focinho Claro
            ctx.fillStyle = furLight;
            ctx.beginPath();
            ctx.ellipse(radius * 0.45, radius * 0.15, radius * 0.25, radius * 0.08, 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Nariz
            ctx.fillStyle = '#050505';
            ctx.beginPath();
            ctx.arc(radius * 0.65, radius * 0.20, radius * 0.04, 0, Math.PI * 2);
            ctx.fill();

            // Presas Ferozes
            ctx.fillStyle = '#E8DCC4';
            ctx.beginPath();
            ctx.moveTo(radius * 0.48, radius * 0.22);
            ctx.lineTo(radius * 0.52, radius * 0.32);
            ctx.lineTo(radius * 0.56, radius * 0.22);
            ctx.fill();
            ctx.strokeStyle = '#231D1A';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Olho Feroz Vermelho
            ctx.fillStyle = '#FF1111';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.ellipse(radius * 0.28, 0.0, radius * 0.035, radius * 0.015, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Sobrancelha
            ctx.strokeStyle = '#1A1510';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(radius * 0.18, -radius * 0.05);
            ctx.lineTo(radius * 0.34, 0.02);
            ctx.stroke();

            // Cicatriz
            ctx.strokeStyle = '#6B1A1A';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(radius * 0.32, -radius * 0.08);
            ctx.lineTo(radius * 0.26, radius * 0.06);
            ctx.stroke();

            // Orelha Direita (Frente)
            ctx.fillStyle = furMid;
            ctx.strokeStyle = outline;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(radius * 0.05, -radius * 0.05);
            ctx.lineTo(radius * 0.2, -radius * 0.3);
            ctx.lineTo(radius * 0.35, -radius * 0.05);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = furLight;
            ctx.beginPath();
            ctx.moveTo(radius * 0.1, -radius * 0.08);
            ctx.lineTo(radius * 0.2, -radius * 0.24);
            ctx.lineTo(radius * 0.28, -radius * 0.08);
            ctx.fill();

            ctx.restore(); // Fim da cabeça
            ctx.restore(); // Fim do lobo

            drawDamageFlash(ctx, enemy, theme, radius * 0.86);
  }

  function drawOgroDeCerco(ctx, enemy, theme, time, animationState, info) {
  const radius = enemy.radius;
  const accent = info.accent || '#B94A48';
  const glow = info.glow || '#D6A84F';
  const step = animationState.walkCycle;
  const stride = step * radius * 0.18;
  const lift = Math.abs(step) * radius * 0.06;
  const outline = '#1A1510';

  // Paleta de cores - tons de pele de ogro
  const skinLight = '#A89F5C';
  const skinMid = '#8A8239';
  const skinDark = '#6B6628';
  const skinShadow = '#4A4518';

  // Paleta de armadura de placas - ferro forjado e couro
  const armorPlate = '#5C5C5C';
  const armorPlateLight = '#787878';
  const armorPlateDark = '#3D3D3D';
  const armorRivet = '#2A2A2A';
  const leather = '#5C4033';
  const leatherDark = '#3D2A22';

  // Paleta de metal - detalhes
  const metalDark = '#2D2D2D';
  const metalHighlight = '#9A9A9A';
  const metalGold = '#B8860B';

  // Cores da clava
  const clubWood = '#5C4033';
  const clubWoodLight = '#7A5A48';
  const clubSpike = '#4A4A4A';
  const clubSpikeLight = '#6A6A6A';

  // Marfim dos dentes
  const tusk = '#E8DCC4';
  const tuskShadow = '#C4B89C';

  drawLocalShadow(ctx, radius, 0.38, 1.55);
  ctx.rotate(animationState.wobble * 0.35);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ========== PERNAS COM ANIMAÇÃO ==========
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.5;

  // Perna esquerda
  ctx.fillStyle = leatherDark;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.48, radius * 0.52);
  ctx.lineTo(-radius * 0.72 - stride, radius * 0.92 - lift);
  ctx.lineTo(-radius * 0.42 - stride, radius * 0.92 - lift);
  ctx.lineTo(-radius * 0.24, radius * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bota esquerda
  ctx.fillStyle = '#3D2A22';
  ctx.beginPath();
  ctx.ellipse(
  -radius * 0.57 - stride,         
  radius * 0.92 - lift,            
  radius * 0.18,
  radius * 0.12,
  step * 0.2,                      
  0,
  Math.PI * 2
  );
  ctx.fill();
 

  // Perna direita
  ctx.fillStyle = leatherDark;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(radius * 0.24, radius * 0.52);
  ctx.lineTo(radius * 0.08 + stride, radius * 0.92 - lift);
  ctx.lineTo(radius * 0.38 + stride, radius * 0.92 - lift);
  ctx.lineTo(radius * 0.48, radius * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bota direita
  ctx.fillStyle = '#3D2A22';
  ctx.beginPath();
  ctx.ellipse(
    radius * 0.23 + stride,          
  radius * 0.92 - lift,            
  radius * 0.18,
  radius * 0.12,
  -step * 0.2,                     
  0,
  Math.PI * 2
  );
  ctx.fill();
  // ========== TÚNICA / SAIA DE COURO ==========
  ctx.fillStyle = leather;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.78, radius * 0.22);
  ctx.lineTo(-radius * 0.88, radius * 0.52);
  ctx.lineTo(-radius * 0.48, radius * 0.56);
  ctx.lineTo(radius * 0.0, radius * 0.52);
  ctx.lineTo(radius * 0.48, radius * 0.56);
  ctx.lineTo(radius * 0.88, radius * 0.52);
  ctx.lineTo(radius * 0.78, radius * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Costuras
  ctx.strokeStyle = leatherDark;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.28, radius * 0.26);
  ctx.lineTo(-radius * 0.32, radius * 0.5);
  ctx.moveTo(radius * 0.28, radius * 0.26);
  ctx.lineTo(radius * 0.32, radius * 0.5);
  ctx.stroke();

  // ========== CINTURÃO ==========
  ctx.fillStyle = leatherDark;
  ctx.strokeStyle = metalGold;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.rect(-radius * 0.72, radius * 0.18, radius * 1.44, radius * 0.1);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = metalGold;
  ctx.beginPath();
  ctx.rect(-radius * 0.06, radius * 0.16, radius * 0.12, radius * 0.14);
  ctx.fill();
  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // ========== PEITORAL ==========
  ctx.fillStyle = armorPlateDark;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(-radius * 0.02, radius * 0.02, radius * 0.95, radius * 0.82, 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = armorPlate;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.58, radius * 0.0);
  ctx.quadraticCurveTo(-radius * 0.02, -radius * 0.32, radius * 0.58, radius * 0.0);
  ctx.quadraticCurveTo(radius * 0.64, radius * 0.24, radius * 0.02, radius * 0.36);
  ctx.quadraticCurveTo(-radius * 0.64, radius * 0.24, -radius * 0.58, radius * 0.0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = metalHighlight;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Rebites
  ctx.fillStyle = armorRivet;
  const rivetPositions = [
    { x: -0.48, y: -0.12 },
    { x: -0.3, y: -0.24 },
    { x: -0.12, y: -0.28 },
    { x: 0.12, y: -0.28 },
    { x: 0.3, y: -0.24 },
    { x: 0.48, y: -0.12 },
    { x: -0.38, y: 0.1 },
    { x: 0.0, y: 0.15 },
    { x: 0.38, y: 0.1 }
  ];

  rivetPositions.forEach((rivet) => {
    ctx.beginPath();
    ctx.arc(radius * rivet.x, radius * rivet.y, radius * 0.03, 0, Math.PI * 2);
    ctx.fill();
  });

  // ========== OMBREIRAS ==========
  ctx.fillStyle = armorPlateLight;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.1;

  ctx.beginPath();
  ctx.ellipse(-radius * 0.82, -radius * 0.22, radius * 0.36, radius * 0.32, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = armorRivet;
  ctx.beginPath();
  ctx.arc(-radius * 0.82, radius * -0.22, radius * 0.035, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = armorPlateLight;
  ctx.beginPath();
  ctx.ellipse(radius * 0.82, -radius * 0.18, radius * 0.34, radius * 0.3, 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = armorRivet;
  ctx.beginPath();
  ctx.arc(radius * 0.82, radius * -0.18, radius * 0.035, 0, Math.PI * 2);
  ctx.fill();

  // ========== BRAÇO ESQUERDO ==========
  ctx.fillStyle = armorPlateDark;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(-radius * 0.92, radius * 0.26, radius * 0.18, radius * 0.26, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = skinMid;
  ctx.beginPath();
  ctx.ellipse(-radius * 0.98, radius * 0.48, radius * 0.15, radius * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // ========== CLAVA ==========
  ctx.strokeStyle = clubWoodLight;
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.95, radius * 0.38);
  // Valores fixos: o cabo agora está estático em relação ao corpo
  ctx.lineTo(radius * 1.12, radius * 0.72); 
  ctx.stroke();

  ctx.fillStyle = clubWood;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.ellipse(radius * 1.32, radius * 0.76, radius * 0.34, radius * 0.4, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

 // Espinhos melhorados com profundidade 3D e distribuição radial correta
            const numSpikes = 5; // Quantidade de espinhos esmagadores
            const cx = radius * 1.32;
            const cy = radius * 0.76;
            const clubRot = 0.15;
            const rx = radius * 0.34;
            const ry = radius * 0.4;

            for (let i = 0; i < numSpikes; i++) {
                const angle = (i / numSpikes) * Math.PI * 2;
                
                // Função para achar a coordenada na borda da elipse já rotacionada
                const baseWidth = 0.22;
                const getEllipsePoint = (a) => {
                    const lx = Math.cos(a) * rx;
                    const ly = Math.sin(a) * ry;
                    return {
                        x: cx + (lx * Math.cos(clubRot) - ly * Math.sin(clubRot)),
                        y: cy + (lx * Math.sin(clubRot) + ly * Math.cos(clubRot)),
                        // Direção exata do centro da elipse para fora
                        dir: Math.atan2(ly, lx) + clubRot
                    };
                };

                const centerPt = getEllipsePoint(angle);
                const leftPt = getEllipsePoint(angle - baseWidth);
                const rightPt = getEllipsePoint(angle + baseWidth);

                // A ponta do espinho projetada para fora
                const tipDist = radius * 0.25; 
                const tipX = centerPt.x + Math.cos(centerPt.dir) * tipDist;
                const tipY = centerPt.y + Math.sin(centerPt.dir) * tipDist;

                // Desenha a base (sombra) do espinho
                ctx.fillStyle = clubSpike;
                ctx.strokeStyle = outline;
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.moveTo(leftPt.x, leftPt.y);
                ctx.lineTo(tipX, tipY);
                ctx.lineTo(rightPt.x, rightPt.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Adiciona o brilho metálico na metade esquerda do espinho (efeito 3D)
                ctx.fillStyle = clubSpikeLight;
                ctx.beginPath();
                ctx.moveTo(leftPt.x, leftPt.y);
                ctx.lineTo(tipX, tipY);
                ctx.lineTo(centerPt.x, centerPt.y);
                ctx.closePath();
                ctx.fill();
            }

  // ========== PESCOÇO ==========
  ctx.fillStyle = skinDark;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(-radius * 0.02, -radius * 0.38, radius * 0.28, radius * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = leatherDark;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.24, -radius * 0.46);
  ctx.lineTo(-radius * 0.28, -radius * 0.24);
  ctx.lineTo(radius * 0.0, -radius * 0.18);
  ctx.lineTo(radius * 0.28, -radius * 0.24);
  ctx.lineTo(radius * 0.24, -radius * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = leather;
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // ========== ELMO ==========
  ctx.fillStyle = armorPlateDark;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(-radius * 0.02, -radius * 0.78, radius * 0.5, radius * 0.44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = armorPlate;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.36, -radius * 0.82);
  ctx.quadraticCurveTo(-radius * 0.02, -radius * 1.18, radius * 0.36, -radius * 0.82);
  ctx.quadraticCurveTo(radius * 0.42, -radius * 0.7, radius * 0.02, -radius * 0.64);
  ctx.quadraticCurveTo(-radius * 0.42, -radius * 0.7, -radius * 0.36, -radius * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.06, -radius * 1.16);
  ctx.lineTo(radius * 0.0, -radius * 1.04);
  ctx.lineTo(radius * 0.06, -radius * 1.16);
  ctx.lineTo(radius * 0.0, -radius * 1.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Viseira
  ctx.fillStyle = '#1A1510';
  ctx.strokeStyle = metalHighlight;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.32, -radius * 0.72);
  ctx.quadraticCurveTo(-radius * 0.02, -radius * 0.62, radius * 0.32, -radius * 0.72);
  ctx.quadraticCurveTo(radius * 0.36, -radius * 0.58, radius * 0.02, -radius * 0.52);
  ctx.quadraticCurveTo(-radius * 0.36, -radius * 0.58, -radius * 0.32, -radius * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#0A0806';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.15, -radius * 0.68);
  ctx.lineTo(-radius * 0.13, -radius * 0.58);
  ctx.moveTo(radius * 0.15, -radius * 0.68);
  ctx.lineTo(radius * 0.13, -radius * 0.58);
  ctx.stroke();

  // Proteções laterais do elmo
  ctx.fillStyle = armorPlateLight;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.9;

  ctx.beginPath();
  ctx.moveTo(-radius * 0.44, -radius * 0.68);
  ctx.lineTo(-radius * 0.5, -radius * 0.44);
  ctx.lineTo(-radius * 0.32, -radius * 0.4);
  ctx.lineTo(-radius * 0.28, -radius * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(radius * 0.44, -radius * 0.68);
  ctx.lineTo(radius * 0.5, -radius * 0.44);
  ctx.lineTo(radius * 0.32, -radius * 0.4);
  ctx.lineTo(radius * 0.28, -radius * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ========== ROSTO ==========
  ctx.fillStyle = skinLight;
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.24, -radius * 0.42);
  ctx.quadraticCurveTo(-radius * 0.02, -radius * 0.32, radius * 0.24, -radius * 0.42);
  ctx.quadraticCurveTo(radius * 0.28, -radius * 0.36, radius * 0.02, -radius * 0.26);
  ctx.quadraticCurveTo(-radius * 0.28, -radius * 0.36, -radius * 0.24, -radius * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Olhos
  ctx.fillStyle = '#1A0A08';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.12, -radius * 0.64, radius * 0.07, radius * 0.04, -0.1, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.12, -radius * 0.64, radius * 0.07, radius * 0.04, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.ellipse(-radius * 0.12, -radius * 0.64, radius * 0.035, radius * 0.02, -0.1, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.12, -radius * 0.64, radius * 0.035, radius * 0.02, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Sobrancelhas
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.2, -radius * 0.72);
  ctx.lineTo(-radius * 0.05, -radius * 0.75);
  ctx.moveTo(radius * 0.2, -radius * 0.72);
  ctx.lineTo(radius * 0.05, -radius * 0.75);
  ctx.stroke();

  // Dentes
  ctx.fillStyle = tusk;
  ctx.strokeStyle = tuskShadow;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.15, -radius * 0.36);
  ctx.lineTo(-radius * 0.12, -radius * 0.24);
  ctx.lineTo(-radius * 0.18, -radius * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(radius * 0.15, -radius * 0.36);
  ctx.lineTo(radius * 0.12, -radius * 0.24);
  ctx.lineTo(radius * 0.18, -radius * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nariz
  ctx.fillStyle = skinMid;
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.07, -radius * 0.46);
  ctx.lineTo(-radius * 0.1, -radius * 0.54);
  ctx.lineTo(radius * 0.0, -radius * 0.5);
  ctx.lineTo(radius * 0.1, -radius * 0.54);
  ctx.lineTo(radius * 0.07, -radius * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cicatriz
  ctx.strokeStyle = skinShadow;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(radius * 0.24, -radius * 0.5);
  ctx.lineTo(radius * 0.36, -radius * 0.42);
  ctx.lineTo(radius * 0.32, -radius * 0.36);
  ctx.stroke();

  // ========== BRAÇO DIREITO ==========
  ctx.fillStyle = armorPlateDark;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(radius * 0.82, radius * 0.22, radius * 0.16, radius * 0.22, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = skinMid;
  ctx.beginPath();
  ctx.ellipse(radius * 0.76, radius * 0.42, radius * 0.13, radius * 0.11, 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // ========== BRILHO NA ARMADURA ==========
  ctx.save();
  ctx.globalAlpha = 0.12 + animationState.pulse * 0.08;
  ctx.fillStyle = metalHighlight;

  ctx.beginPath();
  ctx.ellipse(-radius * 0.26, -radius * 0.12, radius * 0.12, radius * 0.06, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(radius * 0.22, -radius * 0.1, radius * 0.1, radius * 0.05, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  drawDamageFlash(ctx, enemy, theme, radius * 0.95);
}

  function drawEnemy(ctx, enemy, theme = TD.getThemeById(TD.DEFAULT_THEME_ID), time = 0) {
    const animationState = getAnimationState(enemy, time);
    const angle = enemy.angle || 0;

    ctx.save();
    ctx.translate(enemy.x + animationState.shakeX, enemy.y + animationState.bob + animationState.shakeY);
    if (theme.id === 'medieval') {
      const horizontalDirection = Math.cos(angle);

      if (horizontalDirection < -0.05) {
        ctx.scale(-1, 1);
      }
    } else {
      ctx.rotate(angle);
    }
    ctx.shadowColor = 'rgba(0, 0, 0, 0.36)';
    ctx.shadowBlur = enemy.type === 'tank' ? 7 : 5;

    if (theme.id === 'medieval') {
      drawMedievalEnemy(ctx, enemy, theme, time, animationState);
    } else {
      drawFuturisticEnemy(ctx, enemy, theme, time, animationState);
    }

    ctx.restore();
    drawEnemyHealthBar(ctx, enemy, theme);
  }

  function drawEnemyHealthBar(ctx, enemy, theme = TD.getThemeById(TD.DEFAULT_THEME_ID)) {
    const width = enemy.radius * (enemy.type === 'tank' ? 2.55 : 2.35);
    const height = Math.max(4, enemy.radius * 0.22);
    const x = enemy.x - width / 2;
    const y = enemy.y - enemy.radius - 15;
    const ratio = enemy.getHealthRatio();

    ctx.save();
    ctx.fillStyle = 'rgba(7, 10, 15, 0.74)';
    roundedRect(ctx, x, y, width, height, height / 2);
    ctx.fill();
    ctx.fillStyle = getEnemyHealthColor(ratio);
    roundedRect(ctx, x, y, width * ratio, height, height / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    roundedRect(ctx, x, y, width, height, height / 2);
    ctx.stroke();
    ctx.restore();
  }

  function getEnemyHealthColor(ratio) {
    if (ratio > 0.8) {
      return '#22C55E';
    }

    if (ratio > 0.4) {
      return '#FACC15';
    }

    return '#EF4444';
  }

  function drawEnemyDeathEffect(ctx, effect, theme = TD.getThemeById(effect.themeId), time = 0) {
    const effectTheme = TD.getThemeById(effect.themeId || theme.id);
    const progress = clamp01(effect.age / effect.duration);
    const alpha = Math.max(0, 1 - progress);
    const color = effect.color || effectTheme.palette.primary;
    const accent = effect.accent || effectTheme.palette.warning;

    ctx.save();
    ctx.translate(effect.x, effect.y);
    ctx.rotate(effect.angle || 0);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = accent;
    ctx.fillStyle = color;
    ctx.shadowColor = accent;
    ctx.shadowBlur = effect.deathEffect && effect.deathEffect.includes('Dust') ? 0 : 7;
    ctx.lineWidth = effect.deathEffect && effect.deathEffect.includes('heavy') ? 2 : 1.4;

    if (effect.deathEffect === 'energyBurst') {
      drawEnergyBurst(ctx, effect, progress, alpha, accent);
    } else if (effect.deathEffect === 'disintegrate') {
      drawDisintegrate(ctx, effect, progress, alpha, color, accent);
    } else if (effect.deathEffect === 'heavyExplosion') {
      drawHeavyExplosion(ctx, effect, progress, alpha, color, accent);
    } else if (effect.deathEffect === 'rollDust') {
      drawRollDust(ctx, effect, progress, alpha, color);
    } else if (effect.deathEffect === 'heavyDust') {
      drawHeavyDust(ctx, effect, progress, alpha, color);
    } else {
      drawDustPop(ctx, effect, progress, alpha, color);
    }

    ctx.restore();
  }

  function drawEnergyBurst(ctx, effect, progress, alpha, accent) {
    ctx.globalAlpha = alpha * 0.82;
    ctx.beginPath();
    ctx.arc(0, 0, effect.radius * (0.55 + progress * 2.2), 0, Math.PI * 2);
    ctx.stroke();

    effect.particles.forEach((particle) => {
      ctx.globalAlpha = alpha * particle.alpha;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(particle.x * progress, particle.y * progress, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawDisintegrate(ctx, effect, progress, alpha, color, accent) {
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-effect.radius * (1.4 + progress), 0);
    ctx.lineTo(-effect.radius * (0.25 + progress * 0.45), 0);
    ctx.stroke();

    effect.particles.forEach((particle) => {
      ctx.globalAlpha = alpha * particle.alpha;
      ctx.fillStyle = progress > 0.55 ? accent : color;
      ctx.beginPath();
      ctx.arc(particle.x * progress, particle.y * progress, particle.size * (1 - progress * 0.45), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawHeavyExplosion(ctx, effect, progress, alpha, color, accent) {
    ctx.globalAlpha = alpha * 0.72;
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 0, effect.radius * (0.75 + progress * 2.6), 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.42;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 0, effect.radius * (0.6 - progress * 0.25), 0, Math.PI * 2);
    ctx.fill();

    effect.particles.forEach((particle, index) => {
      ctx.save();
      ctx.globalAlpha = alpha * particle.alpha;
      ctx.translate(particle.x * progress, particle.y * progress);
      ctx.rotate((effect.animationOffset || 0) + progress * 3 + index);
      ctx.fillStyle = index % 2 === 0 ? color : '#94A3B8';
      ctx.fillRect(-particle.size, -particle.size * 0.6, particle.size * 2.1, particle.size * 1.2);
      ctx.restore();
    });
  }

  function drawDustPop(ctx, effect, progress, alpha, color) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = color || '#8A6238';
    effect.particles.forEach((particle) => {
      ctx.globalAlpha = alpha * particle.alpha * 0.75;
      ctx.beginPath();
      ctx.ellipse(particle.x * progress, particle.y * progress, particle.size * 1.55, particle.size, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawRollDust(ctx, effect, progress, alpha, color) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = color || '#4B5563';
    effect.particles.forEach((particle) => {
      ctx.globalAlpha = alpha * particle.alpha * 0.62;
      ctx.beginPath();
      ctx.ellipse(
        particle.x * progress - effect.radius * progress,
        particle.y * progress * 0.55,
        particle.size * 1.8,
        particle.size * 0.82,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }

  function drawHeavyDust(ctx, effect, progress, alpha, color) {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha * 0.36;
    ctx.strokeStyle = color || '#7A5C3A';
    ctx.beginPath();
    ctx.ellipse(0, effect.radius * 0.35, effect.radius * (0.9 + progress * 1.8), effect.radius * (0.22 + progress * 0.35), 0, 0, Math.PI * 2);
    ctx.stroke();

    drawDustPop(ctx, effect, progress, alpha, color);
  }

  TD.EnemyRenderer = {
    drawEnemy,
    drawFuturisticEnemy,
    drawMedievalEnemy,
    drawDroneVigia,
    drawSondaCortante,
    drawColossoBlindado,
    drawGoblinSaqueador,
    drawLoboSombrio,
    drawOgroDeCerco,
    drawEnemyHealthBar,
    drawEnemyDamageFlash: drawDamageFlash,
    drawEnemyDeathEffect,
    getEnemyHealthColor
  };
})(globalThis);
