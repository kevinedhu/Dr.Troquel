/**
 * TroquelMaster — Storage Service
 * 
 * Persists analysis results and quotations.
 * Currently uses localStorage. Architecture prepared for IndexedDB/server migration.
 */

const STORAGE_KEY = 'troquelmaster_analyses';
const MAX_STORED = 50;

/**
 * Save an analysis result
 * @param {object} analysis - The analysis result to save
 * @returns {string} The saved analysis ID
 */
export function saveAnalysis(analysis) {
  const id = analysis.id || `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  // Create a lightweight copy (don't store heavy SVG content in localStorage)
  const storable = {
    ...analysis,
    id,
    savedAt: new Date().toISOString(),
    // Strip heavy content to avoid localStorage bloat
    svgContent: null,
    originalContent: null,
    // Keep trace data but reduce it
    traces: analysis.traces?.map(t => ({
      id: t.id,
      type: t.type,
      lengthPx: t.lengthPx,
      lengthMm: t.lengthMm,
      included: t.included,
      label: t.label,
      svgElement: t.svgElement,
    })),
  };

  try {
    const existing = loadAllAnalyses();
    existing.unshift(storable);
    
    // Limit storage
    const limited = existing.slice(0, MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    
    return id;
  } catch (err) {
    console.error('Error saving analysis:', err);
    return null;
  }
}

/**
 * Load all saved analyses
 * @returns {Array}
 */
export function loadAllAnalyses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Load a specific analysis by ID
 * @param {string} id
 * @returns {object|null}
 */
export function loadAnalysis(id) {
  const all = loadAllAnalyses();
  return all.find(a => a.id === id) || null;
}

/**
 * Delete an analysis by ID
 * @param {string} id
 */
export function deleteAnalysis(id) {
  try {
    const all = loadAllAnalyses();
    const filtered = all.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error deleting analysis:', err);
  }
}

/**
 * Clear all saved analyses
 */
export function clearAllAnalyses() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing analyses:', err);
  }
}
