/**
 * Formatierungsfunktionen für den Pergola-Konfigurator
 * Eliminiert Duplikate in Infobox.js und PriceTag.js
 */

// ============================================================================
// WÄHRUNGSFORMATIERUNG
// ============================================================================

/**
 * Formatiert einen Betrag als Euro-Währung
 * @param {number} amount - Der Betrag
 * @param {boolean} showSymbol - Euro-Symbol anzeigen (default: true)
 * @returns {string}
 *
 * @example
 * formatCurrency(1234.56) // => '1.234,56 €'
 */
export function formatCurrency(amount, showSymbol = true) {
    const num = Number(amount) || 0;

    const formatter = new Intl.NumberFormat('de-DE', {
        style: showSymbol ? 'currency' : 'decimal',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return formatter.format(num);
}

/**
 * Formatiert einen Betrag ohne Währungssymbol
 * @param {number} amount - Der Betrag
 * @returns {string}
 */
export function formatAmount(amount) {
    return formatCurrency(amount, false);
}

// ============================================================================
// ZAHLENFORMATIERUNG
// ============================================================================

/**
 * Formatiert eine Zahl mit deutschen Trennzeichen
 * @param {number} value - Die Zahl
 * @param {number} decimals - Anzahl Nachkommastellen (default: 2)
 * @returns {string}
 *
 * @example
 * formatNumber(1234.567, 2) // => '1.234,57'
 */
export function formatNumber(value, decimals = 2) {
    const num = Number(value) || 0;

    return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

/**
 * Formatiert eine Ganzzahl
 * @param {number} value - Die Zahl
 * @returns {string}
 */
export function formatInteger(value) {
    return formatNumber(value, 0);
}

/**
 * Formatiert eine Prozentzahl
 * @param {number} value - Der Wert (0-1 oder 0-100)
 * @param {boolean} isDecimal - true wenn Wert 0-1 ist
 * @returns {string}
 */
export function formatPercent(value, isDecimal = false) {
    const num = isDecimal ? value * 100 : value;
    return `${formatNumber(num, 1)} %`;
}

// ============================================================================
// LÄNGENFORMATIERUNG
// ============================================================================

/**
 * Formatiert einen Wert in Millimetern
 * @param {number} value - Der Wert (in Metern oder mm)
 * @param {boolean} fromMeters - true wenn Eingabe in Metern
 * @returns {string}
 *
 * @example
 * formatMillimeter(0.5, true) // => '500 mm'
 * formatMillimeter(500) // => '500 mm'
 */
export function formatMillimeter(value, fromMeters = false) {
    let mm = Number(value) || 0;
    if (fromMeters) {
        mm = mm * 1000;
    }
    return `${Math.round(mm)} mm`;
}

/**
 * Alias für Kompatibilität (deutsche Benennung)
 * @deprecated Verwende formatMillimeter stattdessen
 */
export const formatMillimeters = formatMillimeter;

/**
 * Formatiert einen Wert in Metern
 * @param {number} value - Der Wert in Metern
 * @param {number} decimals - Anzahl Nachkommastellen (default: 2)
 * @returns {string}
 *
 * @example
 * formatMeter(2.5) // => '2,50 m'
 */
export function formatMeter(value, decimals = 2) {
    const num = Number(value) || 0;
    return `${num.toFixed(decimals).replace('.', ',')} m`;
}

/**
 * Alias für Kompatibilität
 */
export const formatMeters = formatMeter;

/**
 * Formatiert einen Wert in Zentimetern
 * @param {number} value - Der Wert in Metern
 * @returns {string}
 */
export function formatCentimeter(value) {
    const cm = (Number(value) || 0) * 100;
    return `${Math.round(cm)} cm`;
}

/**
 * Formatiert eine Quadratmeterzahl
 * @param {number} value - Der Wert in m²
 * @param {number} decimals - Anzahl Nachkommastellen
 * @returns {string}
 */
export function formatSquareMeter(value, decimals = 2) {
    const num = Number(value) || 0;
    return `${num.toFixed(decimals).replace('.', ',')} m²`;
}

// ============================================================================
// WINKELFORMATIERUNG
// ============================================================================

/**
 * Formatiert einen Winkel in Grad
 * @param {number} value - Der Winkel in Grad
 * @param {number} decimals - Anzahl Nachkommastellen
 * @returns {string}
 */
export function formatDegree(value, decimals = 1) {
    const num = Number(value) || 0;
    return `${num.toFixed(decimals).replace('.', ',')}°`;
}

/**
 * Formatiert eine Neigung als Prozent
 * @param {number} degrees - Neigung in Grad
 * @returns {string}
 */
export function formatSlopePercent(degrees) {
    const percent = Math.tan((Number(degrees) || 0) * Math.PI / 180) * 100;
    return `${formatNumber(percent, 1)} %`;
}

// ============================================================================
// SPEZIALFORMATE
// ============================================================================

/**
 * Formatiert ein Profil (z.B. "100x100x3")
 * @param {object} dimensions - { width, height, thickness }
 * @returns {string}
 */
export function formatProfile(dimensions) {
    if (!dimensions) return '-';

    const { width, height, thickness } = dimensions;
    const w = Math.round((width || 0) * 1000);
    const h = Math.round((height || 0) * 1000);
    const t = thickness ? Math.round(thickness * 1000) : null;

    return t ? `${w}×${h}×${t} mm` : `${w}×${h} mm`;
}

/**
 * Extrahiert Suffix nach Zahlen (z.B. "2 Stück" → "Stück")
 * @param {string} str - Der String
 * @returns {string}
 */
export function extractUnitSuffix(str = '') {
    if (!str) return '';
    const match = String(str).match(/^[\d\s.,+-]+(.*)$/);
    return match ? match[1].trim() : '';
}

/**
 * Formatiert eine Anzahl mit Einheit
 * @param {number} count - Die Anzahl
 * @param {string} singularUnit - Einheit Singular
 * @param {string} pluralUnit - Einheit Plural (optional)
 * @returns {string}
 */
export function formatCount(count, singularUnit, pluralUnit = null) {
    const num = Number(count) || 0;
    const unit = num === 1 ? singularUnit : (pluralUnit || singularUnit);
    return `${formatInteger(num)} ${unit}`;
}

/**
 * Formatiert Versatz-Anzeige für Pfosten
 * @param {number} value - Der Versatz in Metern
 * @param {string} axis - 'x' oder 'z'
 * @returns {string}
 */
export function formatVersatz(value, axis = 'x') {
    if (!Number.isFinite(value) || Math.abs(value) < 1e-4) {
        return '0 mm';
    }

    const mm = Math.round(value * 1000);
    let direction;

    if (axis === 'z') {
        direction = mm > 0 ? 'nach hinten (+)' : 'nach vorne (−)';
    } else {
        direction = mm > 0 ? 'nach innen (+)' : 'nach außen (−)';
    }

    return `${Math.abs(mm)} mm ${direction}`;
}

// ============================================================================
// ZEITFORMATIERUNG
// ============================================================================

/**
 * Formatiert einen Zeitstempel
 * @param {Date|number|string} date - Das Datum
 * @returns {string}
 */
export function formatDateTime(date) {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(d);
}

/**
 * Formatiert nur das Datum
 * @param {Date|number|string} date - Das Datum
 * @returns {string}
 */
export function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium'
    }).format(d);
}

// Default-Export mit allen Funktionen
export default {
    formatCurrency,
    formatAmount,
    formatNumber,
    formatInteger,
    formatPercent,
    formatMillimeter,
    formatMillimeters,
    formatMeter,
    formatMeters,
    formatCentimeter,
    formatSquareMeter,
    formatDegree,
    formatSlopePercent,
    formatProfile,
    extractUnitSuffix,
    formatCount,
    formatVersatz,
    formatDateTime,
    formatDate
};
