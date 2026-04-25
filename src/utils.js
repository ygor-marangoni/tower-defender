(function utilities(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function normalizeVector(x, y) {
    const length = Math.hypot(x, y);

    if (length === 0) {
      return { x: 0, y: 0, length: 0 };
    }

    return {
      x: x / length,
      y: y / length,
      length
    };
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString('pt-BR');
  }

  TD.Utils = {
    clamp,
    lerp,
    randomBetween,
    normalizeVector,
    createId,
    formatNumber
  };
})(globalThis);
