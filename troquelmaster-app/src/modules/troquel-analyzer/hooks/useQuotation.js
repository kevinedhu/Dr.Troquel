/**
 * TroquelMaster — useQuotation Hook
 * 
 * Manages quotation state: rates, extras, and calculation.
 */

import { useState, useCallback, useMemo } from 'react';
import { TraceType, DEFAULT_RATES, DEFAULT_EXTRAS } from '../types.js';
import { calculateQuotation, formatCurrency } from '../services/quotation-service.js';

export function useQuotation(analysisResult = null) {
  const [rates, setRates] = useState({ ...DEFAULT_RATES });
  const [extras, setExtras] = useState(DEFAULT_EXTRAS.map(e => ({ ...e })));
  const [includeTypes, setIncludeTypes] = useState([TraceType.CUT]);
  const [igvRate] = useState(0.18);

  /**
   * Set rate for a trace type
   */
  const setRate = useCallback((type, value) => {
    setRates(prev => ({ ...prev, [type]: parseFloat(value) || 0 }));
  }, []);

  /**
   * Toggle an extra on/off
   */
  const toggleExtra = useCallback((extraId) => {
    setExtras(prev => prev.map(e =>
      e.id === extraId ? { ...e, enabled: !e.enabled } : e
    ));
  }, []);

  /**
   * Update extra price
   */
  const updateExtraPrice = useCallback((extraId, price) => {
    setExtras(prev => prev.map(e =>
      e.id === extraId ? { ...e, price: parseFloat(price) || 0 } : e
    ));
  }, []);

  /**
   * Add a new extra
   */
  const addExtra = useCallback((name, price) => {
    const id = `custom_${Date.now()}`;
    setExtras(prev => [...prev, { id, name, price: parseFloat(price) || 0, enabled: true }]);
  }, []);

  /**
   * Remove a custom extra
   */
  const removeExtra = useCallback((extraId) => {
    setExtras(prev => prev.filter(e => e.id !== extraId));
  }, []);

  /**
   * Set which trace types to include in quotation
   */
  const setInclude = useCallback((types) => {
    setIncludeTypes(types);
  }, []);

  /**
   * Toggle a trace type inclusion
   */
  const toggleType = useCallback((type) => {
    setIncludeTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  /**
   * Calculate quotation from current analysis result and settings
   */
  const quotation = useMemo(() => {
    if (!analysisResult) return null;

    // Determine lengths to use (manual override or automatic)
    let cutMm = analysisResult.cutLengthMm || 0;
    if (analysisResult.useManualLength && analysisResult.manualCutLengthMm !== null) {
      cutMm = analysisResult.manualCutLengthMm;
    }

    return calculateQuotation({
      cutLengthCm: cutMm / 10,
      foldLengthCm: (analysisResult.foldLengthMm || 0) / 10,
      perforationLengthCm: (analysisResult.perforationLengthMm || 0) / 10,
      rates,
      extras,
      includeTypes,
      igvRate,
    });
  }, [analysisResult, rates, extras, includeTypes, igvRate]);

  return {
    rates,
    extras,
    includeTypes,
    igvRate,
    quotation,

    setRate,
    toggleExtra,
    updateExtraPrice,
    addExtra,
    removeExtra,
    setInclude,
    toggleType,
    formatCurrency,
  };
}
