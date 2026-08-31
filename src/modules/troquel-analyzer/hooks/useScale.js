/**
 * TroquelMaster — useScale Hook
 * 
 * Manages scale calibration state and operations.
 */

import { useState, useCallback } from 'react';
import { ScaleSource } from '../types.js';
import {
  scaleFromManualCalibration,
  scaleFromKnownDimension,
  scaleFromPhysicalReference,
  convertLength,
} from '../services/scale-service.js';

export function useScale(initialScale = null, initialSource = ScaleSource.NONE) {
  const [scale, setScale] = useState(initialScale);
  const [scaleSource, setScaleSource] = useState(initialSource);
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [isCalibrating, setIsCalibrating] = useState(false);

  /**
   * Start manual calibration mode
   */
  const startCalibration = useCallback(() => {
    setCalibrationPoints([]);
    setIsCalibrating(true);
  }, []);

  /**
   * Add a calibration point
   */
  const addCalibrationPoint = useCallback((point) => {
    setCalibrationPoints(prev => {
      const next = [...prev, point];
      return next.slice(0, 2); // max 2 points
    });
  }, []);

  /**
   * Complete calibration with the real distance
   */
  const completeCalibration = useCallback((realDistanceMm) => {
    if (calibrationPoints.length !== 2) return null;
    
    const scaleObj = scaleFromManualCalibration(
      calibrationPoints[0],
      calibrationPoints[1],
      realDistanceMm
    );
    
    if (scaleObj) {
      setScale(scaleObj.pxPerMm);
      setScaleSource(ScaleSource.MANUAL_CALIBRATION);
      setIsCalibrating(false);
      setCalibrationPoints([]);
      return scaleObj.pxPerMm;
    }
    return null;
  }, [calibrationPoints]);

  /**
   * Set scale from a known dimension
   */
  const calibrateFromDimension = useCallback((pixelLength, realLengthMm) => {
    const scaleObj = scaleFromKnownDimension(pixelLength, realLengthMm);
    if (scaleObj) {
      setScale(scaleObj.pxPerMm);
      setScaleSource(ScaleSource.KNOWN_DIMENSION);
      return scaleObj.pxPerMm;
    }
    return null;
  }, []);

  /**
   * Set scale from a physical reference
   */
  const calibrateFromReference = useCallback((referenceType, pixelMeasurement) => {
    const scaleObj = scaleFromPhysicalReference(referenceType, pixelMeasurement);
    if (scaleObj) {
      setScale(scaleObj.pxPerMm);
      setScaleSource(ScaleSource.PHYSICAL_REFERENCE);
      return scaleObj.pxPerMm;
    }
    return null;
  }, []);

  /**
   * Set scale directly (e.g., from SVG metadata)
   */
  const setAutoScale = useCallback((pxPerMm, source) => {
    setScale(pxPerMm);
    setScaleSource(source);
  }, []);

  /**
   * Cancel calibration
   */
  const cancelCalibration = useCallback(() => {
    setIsCalibrating(false);
    setCalibrationPoints([]);
  }, []);

  /**
   * Convert px to mm using current scale
   */
  const pxToMm = useCallback((px) => {
    if (!scale) return null;
    return px / scale;
  }, [scale]);

  return {
    scale,
    scaleSource,
    calibrationPoints,
    isCalibrating,
    hasScale: scale !== null && scale > 0,

    startCalibration,
    addCalibrationPoint,
    completeCalibration,
    calibrateFromDimension,
    calibrateFromReference,
    setAutoScale,
    cancelCalibration,
    pxToMm,
  };
}
