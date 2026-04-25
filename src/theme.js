(function themeModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG } = TD;

  const DEFAULT_THEME_ID = 'futuristic';
  const FUTURISTIC_PATH = (CONFIG.PATH_POINTS || []).map((point) => ({ ...point }));
  const FUTURISTIC_MOBILE_PATH = [
    { x: 240, y: -46 },
    { x: 240, y: 104 },
    { x: 104, y: 104 },
    { x: 104, y: 270 },
    { x: 348, y: 270 },
    { x: 348, y: 430 },
    { x: 156, y: 430 },
    { x: 156, y: 604 },
    { x: 240, y: 604 },
    { x: 240, y: 846 }
  ];
  const MEDIEVAL_PATH = [
    { x: -40, y: 430 },
    { x: 212, y: 430 },
    { x: 212, y: 250 },
    { x: 450, y: 250 },
    { x: 450, y: 400 },
    { x: 750, y: 400 },
    { x: 750, y: 170 },
    { x: 1025, y: 170 },
    { x: 1025, y: 320 },
    { x: 1245, y: 320 }
  ];
  const MEDIEVAL_MOBILE_PATH = [
    { x: 124, y: -46 },
    { x: 124, y: 114 },
    { x: 340, y: 114 },
    { x: 340, y: 276 },
    { x: 180, y: 276 },
    { x: 180, y: 442 },
    { x: 372, y: 442 },
    { x: 372, y: 616 },
    { x: 240, y: 616 },
    { x: 240, y: 846 }
  ];

  const THEMES = {
    futuristic: {
      id: 'futuristic',
      name: 'Modo Futurista',
      shortName: 'Futurista',
      subtitle: 'Defenda o núcleo com torres de energia e tecnologia avançada.',
      headerSubtitle: 'Defenda o núcleo. Posicione torres. Sobreviva às ondas.',
      menuDescription: 'Defenda o núcleo com torres de energia, lasers e tecnologia avançada.',
      bodyClass: 'theme-futuristic',
      palette: {
        background: '#070A0F',
        panel: '#0D141F',
        panel2: '#111A26',
        primary: '#38BDF8',
        success: '#34D399',
        danger: '#F43F5E',
        warning: '#F59E0B',
        path: '#1F2A37',
        pathAccent: 'rgba(148, 163, 184, 0.34)'
      },
      labels: {
        base: 'Núcleo',
        life: 'Vida',
        money: 'Créditos',
        wave: 'Onda',
        score: 'Pontuação',
        bestScore: 'Recorde',
        bestWave: 'Maior onda',
        startWave: 'Iniciar onda',
        restart: 'Reiniciar',
        changeMode: 'Trocar modo',
        selected: 'Seleção',
        towers: 'Torres',
        route: 'Rota de ataque',
        gameOverTitle: 'Núcleo comprometido',
        gameOverText: 'As unidades inimigas atravessaram a defesa.',
        tryAgain: 'Tentar novamente'
      },
      towers: {
        basic: { name: 'Canhão de Pulso', description: 'Equilibrada e precisa.', icon: 'target' },
        rapid: { name: 'Torre Laser', description: 'Rápida contra enxames.', icon: 'zap' },
        heavy: { name: 'Lança Plasma', description: 'Dano alto à distância.', icon: 'bomb' }
      },
      enemies: {
        common: { name: 'Drone' },
        fast: { name: 'Interceptor' },
        tank: { name: 'Blindado' }
      },
      instructions: [
        'Escolha uma torre e clique fora da rota para posicionar.',
        'ESC cancela a seleção.',
        'Torres priorizam inimigos mais próximos do núcleo.'
      ],
      path: FUTURISTIC_PATH,
      responsivePaths: {
        mobile: FUTURISTIC_MOBILE_PATH
      }
    },
    medieval: {
      id: 'medieval',
      name: 'Modo Medieval',
      shortName: 'Medieval',
      subtitle: 'Proteja o reino com arqueiros, canhões e muralhas antigas.',
      headerSubtitle: 'Proteja o castelo. Posicione defesas. Resista ao cerco.',
      menuDescription: 'Proteja o reino com arqueiros, canhões, muralhas e estratégia.',
      bodyClass: 'theme-medieval',
      palette: {
        background: '#101511',
        panel: '#141B17',
        panel2: '#1B241D',
        primary: '#D8B35A',
        success: '#7FA66A',
        danger: '#B76255',
        warning: '#C9873F',
        path: '#8A6238',
        pathAccent: 'rgba(233, 211, 157, 0.3)',
        grass: '#1E3926',
        earth: '#3A2819'
      },
      labels: {
        base: 'Castelo',
        life: 'Reino',
        money: 'Ouro',
        wave: 'Cerco',
        score: 'Glória',
        bestScore: 'Recorde',
        bestWave: 'Maior cerco',
        startWave: 'Iniciar cerco',
        restart: 'Recomeçar',
        changeMode: 'Trocar modo',
        selected: 'Seleção',
        towers: 'Defesas',
        route: 'Estrada do cerco',
        gameOverTitle: 'O castelo caiu',
        gameOverText: 'Os invasores romperam as defesas do reino.',
        tryAgain: 'Tentar novamente'
      },
      towers: {
        basic: { name: 'Torre de Arqueiros', description: 'Flechas precisas.', icon: 'castle' },
        rapid: { name: 'Besteiros', description: 'Disparos rápidos.', icon: 'crosshair' },
        heavy: { name: 'Canhão Real', description: 'Impacto pesado.', icon: 'flame' }
      },
      enemies: {
        common: { name: 'Goblin' },
        fast: { name: 'Lobo' },
        tank: { name: 'Ogro' }
      },
      instructions: [
        'Escolha uma defesa e clique fora da estrada para posicionar.',
        'ESC cancela a seleção.',
        'As defesas priorizam invasores mais próximos do castelo.'
      ],
      path: MEDIEVAL_PATH,
      responsivePaths: {
        mobile: MEDIEVAL_MOBILE_PATH
      }
    }
  };

  function getThemeById(themeId) {
    return THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  }

  function getThemePath(themeId, layout = 'desktop') {
    const theme = getThemeById(themeId);

    if (layout === 'mobile' && theme.responsivePaths?.mobile) {
      return theme.responsivePaths.mobile;
    }

    return theme.path;
  }

  function getThemeLabels(themeId) {
    return getThemeById(themeId).labels;
  }

  function getThemeTowerInfo(themeId, towerType) {
    const theme = getThemeById(themeId);
    return theme.towers[towerType] || theme.towers.basic;
  }

  function getThemeEnemyInfo(themeId, enemyType) {
    const theme = getThemeById(themeId);
    return theme.enemies[enemyType] || theme.enemies.common;
  }

  TD.DEFAULT_THEME_ID = DEFAULT_THEME_ID;
  TD.THEMES = THEMES;
  TD.FUTURISTIC_PATH = FUTURISTIC_PATH;
  TD.FUTURISTIC_MOBILE_PATH = FUTURISTIC_MOBILE_PATH;
  TD.MEDIEVAL_PATH = MEDIEVAL_PATH;
  TD.MEDIEVAL_MOBILE_PATH = MEDIEVAL_MOBILE_PATH;
  TD.getThemeById = getThemeById;
  TD.getThemePath = getThemePath;
  TD.getThemeLabels = getThemeLabels;
  TD.getThemeTowerInfo = getThemeTowerInfo;
  TD.getThemeEnemyInfo = getThemeEnemyInfo;
})(globalThis);
