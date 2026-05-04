(function storageModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG } = TD;
  const LEGACY_KEYS = CONFIG.STORAGE_KEYS;
  const LAST_THEME_KEY = 'towerDefender.lastTheme';
  const ACTIVE_GAME_KEY = 'towerDefender.activeGame';
  const ACTIVE_GAME_VERSION = 1;

  function normalizeThemeId(themeId) {
    return TD.getThemeById ? TD.getThemeById(themeId).id : (themeId || 'futuristic');
  }

  function getThemeKey(themeId, key) {
    return `towerDefender.${normalizeThemeId(themeId)}.${key}`;
  }

  function readNumber(key, fallback = 0) {
    try {
      const value = global.localStorage.getItem(key);
      return value === null ? fallback : Number(value);
    } catch (error) {
      return fallback;
    }
  }

  function writeNumber(key, value) {
    try {
      global.localStorage.setItem(key, String(value));
    } catch (error) {
      return false;
    }

    return true;
  }

  function getBestScore(themeId = TD.DEFAULT_THEME_ID) {
    const key = getThemeKey(themeId, 'bestScore');
    const legacy = normalizeThemeId(themeId) === 'futuristic'
      ? readNumber(LEGACY_KEYS.BEST_SCORE, 0)
      : 0;
    return Math.max(readNumber(key, 0), legacy);
  }

  function setBestScore(themeId = TD.DEFAULT_THEME_ID, score = 0) {
    const bestScore = Math.max(getBestScore(themeId), score);
    writeNumber(getThemeKey(themeId, 'bestScore'), bestScore);
    return bestScore;
  }

  function getBestWave(themeId = TD.DEFAULT_THEME_ID) {
    const key = getThemeKey(themeId, 'bestWave');
    const legacy = normalizeThemeId(themeId) === 'futuristic'
      ? readNumber(LEGACY_KEYS.BEST_WAVE, 0)
      : 0;
    return Math.max(readNumber(key, 0), legacy);
  }

  function setBestWave(themeId = TD.DEFAULT_THEME_ID, wave = 0) {
    const bestWave = Math.max(getBestWave(themeId), wave);
    writeNumber(getThemeKey(themeId, 'bestWave'), bestWave);
    return bestWave;
  }

  function getRecords(themeId = TD.DEFAULT_THEME_ID) {
    return {
      bestScore: getBestScore(themeId),
      bestWave: getBestWave(themeId)
    };
  }

  function saveRecords({ themeId = TD.DEFAULT_THEME_ID, score, wave }) {
    const records = getRecords(themeId);
    const bestScore = Math.max(records.bestScore, score);
    const bestWave = Math.max(records.bestWave, wave);

    writeNumber(getThemeKey(themeId, 'bestScore'), bestScore);
    writeNumber(getThemeKey(themeId, 'bestWave'), bestWave);

    return {
      bestScore,
      bestWave
    };
  }

  function setLastTheme(themeId) {
    try {
      global.localStorage.setItem(LAST_THEME_KEY, normalizeThemeId(themeId));
    } catch (error) {
      return false;
    }

    return true;
  }

  function getLastTheme() {
    try {
      return normalizeThemeId(global.localStorage.getItem(LAST_THEME_KEY));
    } catch (error) {
      return TD.DEFAULT_THEME_ID;
    }
  }

  function saveActiveGame(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      return false;
    }

    try {
      global.localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify({
        ...snapshot,
        version: ACTIVE_GAME_VERSION,
        savedAt: Date.now()
      }));
    } catch (error) {
      return false;
    }

    return true;
  }

  function getActiveGame() {
    try {
      const rawSnapshot = global.localStorage.getItem(ACTIVE_GAME_KEY);

      if (!rawSnapshot) {
        return null;
      }

      const snapshot = JSON.parse(rawSnapshot);

      if (!snapshot || snapshot.version !== ACTIVE_GAME_VERSION || snapshot.appMode !== 'playing') {
        return null;
      }

      return snapshot;
    } catch (error) {
      return null;
    }
  }

  function clearActiveGame() {
    try {
      global.localStorage.removeItem(ACTIVE_GAME_KEY);
    } catch (error) {
      return false;
    }

    return true;
  }

  TD.Storage = {
    getBestScore,
    setBestScore,
    getBestWave,
    setBestWave,
    getRecords,
    saveRecords,
    getLastTheme,
    setLastTheme,
    saveActiveGame,
    getActiveGame,
    clearActiveGame
  };
})(globalThis);
