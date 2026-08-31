/**
 * TroquelMaster — Quotation Service
 * 
 * Calculates pricing from analysis results, rates, and extras.
 */

import { TraceType, DEFAULT_RATES, DEFAULT_EXTRAS } from '../types.js';

/**
 * Calculate a quotation from analysis results
 * @param {object} params
 * @returns {object} QuotationResult
 */
export function calculateQuotation({
  cutLengthCm = 0,
  foldLengthCm = 0,
  perforationLengthCm = 0,
  rates = DEFAULT_RATES,
  extras = DEFAULT_EXTRAS,
  includeTypes = [TraceType.CUT],
  igvRate = 0.18,
}) {
  // Calculate line items
  const lineItems = [];

  if (includeTypes.includes(TraceType.CUT) && cutLengthCm > 0) {
    const rate = rates[TraceType.CUT] || DEFAULT_RATES[TraceType.CUT];
    lineItems.push({
      id: 'cut',
      label: 'Cuchilla de Corte',
      quantity: cutLengthCm,
      unit: 'cm',
      rate,
      subtotal: cutLengthCm * rate,
    });
  }

  if (includeTypes.includes(TraceType.FOLD) && foldLengthCm > 0) {
    const rate = rates[TraceType.FOLD] || DEFAULT_RATES[TraceType.FOLD];
    lineItems.push({
      id: 'fold',
      label: 'Pleca de Doblez',
      quantity: foldLengthCm,
      unit: 'cm',
      rate,
      subtotal: foldLengthCm * rate,
    });
  }

  if (includeTypes.includes(TraceType.PERFORATION) && perforationLengthCm > 0) {
    const rate = rates[TraceType.PERFORATION] || DEFAULT_RATES[TraceType.PERFORATION];
    lineItems.push({
      id: 'perforation',
      label: 'Perforación',
      quantity: perforationLengthCm,
      unit: 'cm',
      rate,
      subtotal: perforationLengthCm * rate,
    });
  }

  // Calculate extras
  const activeExtras = extras.filter(e => e.enabled);
  const extrasSubtotal = activeExtras.reduce((sum, e) => sum + e.price, 0);

  // Totals
  const lineItemsSubtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const subtotal = lineItemsSubtotal + extrasSubtotal;
  const igv = subtotal * igvRate;
  const total = subtotal + igv;

  return {
    lineItems,
    extras: activeExtras,
    extrasSubtotal,
    lineItemsSubtotal,
    subtotal,
    igvRate,
    igv,
    total,
    currency: 'S/.',
    timestamp: Date.now(),
  };
}

/**
 * Format a currency value
 */
export function formatCurrency(value, currency = 'S/.') {
  if (value === null || value === undefined) return '—';
  return `${currency} ${value.toFixed(2)}`;
}
