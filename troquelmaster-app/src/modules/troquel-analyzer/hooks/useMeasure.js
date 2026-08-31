/**
 * TroquelMaster — useMeasure Hook
 * 
 * Manages the interactive measurement tool state.
 */

import { useState, useCallback } from 'react';
import { distanceBetweenPoints } from '../utils/geometry.js';

export function useMeasure(scale = null) {
  const [point1, setPoint1] = useState(null);
  const [point2, setPoint2] = useState(null);
  const [isActive, setIsActive] = useState(false);

  const startMeasure = useCallback(() => {
    setPoint1(null);
    setPoint2(null);
    setIsActive(true);
  }, []);

  const setPoint = useCallback((point) => {
    if (!point1) {
      setPoint1(point);
    } else if (!point2) {
      setPoint2(point);
    }
  }, [point1, point2]);

  const clear = useCallback(() => {
    setPoint1(null);
    setPoint2(null);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    setPoint1(null);
    setPoint2(null);
  }, []);

  // Calculate distance
  const distancePx = (point1 && point2) ? distanceBetweenPoints(point1, point2) : null;
  const distanceMm = (distancePx !== null && scale) ? distancePx / scale : null;
  const distanceCm = distanceMm !== null ? distanceMm / 10 : null;

  return {
    point1,
    point2,
    isActive,
    distancePx,
    distanceMm,
    distanceCm,
    isComplete: point1 !== null && point2 !== null,

    startMeasure,
    setPoint,
    clear,
    stop,
  };
}
