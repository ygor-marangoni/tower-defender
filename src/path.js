(function pathModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};
  const { CONFIG } = TD;

  function getSegments(points = CONFIG.PATH_POINTS) {
    const segments = [];
    let total = 0;

    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const length = Math.hypot(end.x - start.x, end.y - start.y);

      segments.push({
        start,
        end,
        length,
        from: total,
        to: total + length
      });

      total += length;
    }

    return {
      segments,
      total
    };
  }

  function getTotalLength(points = CONFIG.PATH_POINTS) {
    return getSegments(points).total;
  }

  function getPointAtDistance(distance, points = CONFIG.PATH_POINTS) {
    const { segments, total } = getSegments(points);
    const clampedDistance = TD.Utils.clamp(distance, 0, total);

    for (const segment of segments) {
      if (clampedDistance <= segment.to) {
        const localDistance = clampedDistance - segment.from;
        const progress = segment.length === 0 ? 0 : localDistance / segment.length;

        return {
          x: TD.Utils.lerp(segment.start.x, segment.end.x, progress),
          y: TD.Utils.lerp(segment.start.y, segment.end.y, progress),
          angle: Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x),
          progress: total === 0 ? 1 : clampedDistance / total
        };
      }
    }

    const lastPoint = points[points.length - 1];

    return {
      x: lastPoint.x,
      y: lastPoint.y,
      angle: 0,
      progress: 1
    };
  }

  function distanceToSegment(point, start, end) {
    const segmentX = end.x - start.x;
    const segmentY = end.y - start.y;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (lengthSquared === 0) {
      return Math.hypot(point.x - start.x, point.y - start.y);
    }

    const projection = (
      ((point.x - start.x) * segmentX) +
      ((point.y - start.y) * segmentY)
    ) / lengthSquared;
    const clampedProjection = TD.Utils.clamp(projection, 0, 1);
    const closest = {
      x: start.x + segmentX * clampedProjection,
      y: start.y + segmentY * clampedProjection
    };

    return Math.hypot(point.x - closest.x, point.y - closest.y);
  }

  function distanceToPath(point, points = CONFIG.PATH_POINTS) {
    const { segments } = getSegments(points);

    return segments.reduce((closestDistance, segment) => {
      return Math.min(
        closestDistance,
        distanceToSegment(point, segment.start, segment.end)
      );
    }, Number.POSITIVE_INFINITY);
  }

  function isPointOnPath(point, padding = 0, points = CONFIG.PATH_POINTS) {
    return distanceToPath(point, points) <= (CONFIG.PATH_WIDTH / 2) + padding;
  }

  TD.Path = {
    getSegments,
    getTotalLength,
    getPointAtDistance,
    distanceToSegment,
    distanceToPath,
    isPointOnPath
  };
})(globalThis);
