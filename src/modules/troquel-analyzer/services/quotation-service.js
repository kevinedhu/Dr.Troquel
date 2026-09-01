/**
 * TroquelMaster — Quotation Service
 * 
 * Calculates pricing for two production modes:
 *   - LINEAL: charge per cm of blade/pleca (standard die-cutting)
 *   - CUCHILLAS: charge per cm² of wooden base + blade mounting (physical die)
 */

import {
  TraceType,
  TroquelMode,
  DEFAULT_RATES_LINEAL,
  DEFAULT_RATES_CUCHILLAS,
  DEFAULT_EXTRAS,
} from '../types.js';

/**
 * Calculate a quotation for TROQUEL LINEAL mode
 * (price per cm of each trace type)
 */
export function calculateQuotationLineal({
  cutLengthCm = 0,
  foldLengthCm = 0,
  perforationLengthCm = 0,
  rates = DEFAULT_RATES_LINEAL,
  extras = DEFAULT_EXTRAS,
  includeTypes = [TraceType.CUT, TraceType.FOLD],
  igvRate = 0.18,
}) {
  const lineItems = [];

  if (includeTypes.includes(TraceType.CUT) && cutLengthCm > 0) {
    const rate = rates[TraceType.CUT] ?? DEFAULT_RATES_LINEAL[TraceType.CUT];
    lineItems.push({
      id: 'cut', label: 'Cuchilla de Corte',
      quantity: cutLengthCm, unit: 'cm', rate, subtotal: cutLengthCm * rate,
    });
  }

  if (includeTypes.includes(TraceType.FOLD) && foldLengthCm > 0) {
    const rate = rates[TraceType.FOLD] ?? DEFAULT_RATES_LINEAL[TraceType.FOLD];
    lineItems.push({
      id: 'fold', label: 'Pleca de Doblez',
      quantity: foldLengthCm, unit: 'cm', rate, subtotal: foldLengthCm * rate,
    });
  }

  if (includeTypes.includes(TraceType.PERFORATION) && perforationLengthCm > 0) {
    const rate = rates[TraceType.PERFORATION] ?? DEFAULT_RATES_LINEAL[TraceType.PERFORATION];
    lineItems.push({
      id: 'perforation', label: 'Perforación',
      quantity: perforationLengthCm, unit: 'cm', rate, subtotal: perforationLengthCm * rate,
    });
  }

  const activeExtras = extras.filter(e => e.enabled);
  const extrasSubtotal = activeExtras.reduce((sum, e) => sum + e.price, 0);
  const lineItemsSubtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const subtotal = lineItemsSubtotal + extrasSubtotal;
  const igv = subtotal * igvRate;

  return {
    mode: TroquelMode.LINEAL,
    lineItems, extras: activeExtras, extrasSubtotal, lineItemsSubtotal,
    subtotal, igvRate, igv, total: subtotal + igv,
    currency: 'S/.', timestamp: Date.now(),
  };
}

/**
 * Calculate a quotation for TROQUEL CON CUCHILLAS mode
 * (price per cm² of base + mounting + blade length)
 */
export function calculateQuotationCuchillas({
  baseAreaCm2 = 0,
  bladeLengthCm = 0,
  foldBladeLenCm = 0,
  bladeCount = 1,
  complexity = 'simple',
  rates = DEFAULT_RATES_CUCHILLAS,
  extras = DEFAULT_EXTRAS,
  igvRate = 0.18,
}) {
  const lineItems = [];

  const complexityMult = {
    simple: rates.complexitySimple ?? 1.0,
    medium: rates.complexityMedium ?? 1.3,
    complex: rates.complexityComplex ?? 1.7,
  }[complexity] ?? 1.0;

  // Base de madera
  if (baseAreaCm2 > 0) {
    const rate = rates.basePerCm2 ?? 0.35;
    lineItems.push({
      id: 'base', label: 'Base de Madera (área)',
      quantity: baseAreaCm2, unit: 'cm²', rate, subtotal: baseAreaCm2 * rate,
    });
  }

  // Cuchillas de corte
  if (bladeLengthCm > 0) {
    const rate = (rates.bladePerCm ?? 0.90) * complexityMult;
    lineItems.push({
      id: 'blade',
      label: `Cuchillas de Corte (complejidad: ${complexity})`,
      quantity: bladeLengthCm, unit: 'cm', rate, subtotal: bladeLengthCm * rate,
    });
  }

  // Plecas de doblez
  if (foldBladeLenCm > 0) {
    const rate = rates.foldBladePerCm ?? 0.55;
    lineItems.push({
      id: 'fold_blade', label: 'Plecas de Doblez',
      quantity: foldBladeLenCm, unit: 'cm', rate, subtotal: foldBladeLenCm * rate,
    });
  }

  // Armado / setup fijo
  const setupFee = rates.setupFee ?? 25.00;
  lineItems.push({
    id: 'setup', label: 'Armado y Montaje',
    quantity: 1, unit: 'servicio', rate: setupFee, subtotal: setupFee,
  });

  const activeExtras = extras.filter(e => e.enabled);
  const extrasSubtotal = activeExtras.reduce((sum, e) => sum + e.price, 0);
  const lineItemsSubtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const subtotal = lineItemsSubtotal + extrasSubtotal;
  const igv = subtotal * igvRate;

  return {
    mode: TroquelMode.CUCHILLAS,
    lineItems, extras: activeExtras, extrasSubtotal, lineItemsSubtotal,
    subtotal, igvRate, igv, total: subtotal + igv,
    currency: 'S/.', timestamp: Date.now(),
    metadata: { baseAreaCm2, bladeLengthCm, bladeCount, complexity },
  };
}

/**
 * Unified quotation calculator — auto-selects mode or uses explicit mode.
 * This is the main function called by the UI.
 */
export function calculateQuotation({
  mode = TroquelMode.LINEAL,
  cutLengthCm = 0,
  foldLengthCm = 0,
  perforationLengthCm = 0,
  rates = DEFAULT_RATES_LINEAL,
  extras = DEFAULT_EXTRAS,
  includeTypes = [TraceType.CUT, TraceType.FOLD],
  igvRate = 0.18,
  // CUCHILLAS extras
  baseAreaCm2 = 0,
  bladeLengthCm,
  foldBladeLenCm,
  bladeCount = 0,
  complexity = 'simple',
  ratesCuchillas = DEFAULT_RATES_CUCHILLAS,
}) {
  if (mode === TroquelMode.CUCHILLAS) {
    return calculateQuotationCuchillas({
      baseAreaCm2,
      bladeLengthCm: bladeLengthCm ?? cutLengthCm,
      foldBladeLenCm: foldBladeLenCm ?? foldLengthCm,
      bladeCount, complexity,
      rates: ratesCuchillas, extras, igvRate,
    });
  }
  return calculateQuotationLineal({
    cutLengthCm, foldLengthCm, perforationLengthCm,
    rates, extras, includeTypes, igvRate,
  });
}

/** Format a currency value */
export function formatCurrency(value, currency = 'S/.') {
  if (value === null || value === undefined) return '—';
  return `${currency} ${value.toFixed(2)}`;
}

/** Convert mm to cm */
export function mmToCm(mm) {
  if (mm === null || mm === undefined) return null;
  return mm / 10;
}
