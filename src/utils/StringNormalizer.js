/**
 * String-Normalisierungsfunktionen für den Pergola-Konfigurator
 * Eliminiert Duplikate in Pfosten.js, Infobox.js, PergolaKonfiguration.js, Befestigung.js
 */

/**
 * Normalisiert eine Pfosten-ID
 * Konvertiert camelCase zu snake_case und macht alles lowercase
 *
 * @param {any} id - Die zu normalisierende ID
 * @returns {string} - Die normalisierte ID
 *
 * @example
 * normalizePfostenId('vorneMitte') // => 'vorne_mitte'
 * normalizePfostenId('VorneLinks') // => 'vorne_links'
 */
export function normalizePfostenId(id) {
    if (typeof id !== 'string') return '';

    return id
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
}

/**
 * Alias für Kompatibilität (deutsche Benennung)
 * @deprecated Verwende normalizePfostenId stattdessen
 */
export const normalisierePfostenId = normalizePfostenId;

/**
 * Einfache lowercase-Normalisierung für Post-IDs
 * @param {any} id - Die zu normalisierende ID
 * @returns {string}
 */
export function normalizePostIdSimple(id) {
    if (typeof id === 'string') {
        return id.toLowerCase();
    }
    return String(id || '').toLowerCase();
}

/**
 * Normalisiert einen Konfigurationsschlüssel
 * @param {string} key - Der Schlüssel
 * @returns {string}
 */
export function normalizeConfigKey(key) {
    if (typeof key !== 'string') return '';
    return key.trim().toLowerCase();
}

/**
 * Konvertiert camelCase zu Titel mit Leerzeichen
 * @param {string} str - Der String
 * @returns {string}
 *
 * @example
 * camelToTitle('vorneMitte') // => 'Vorne Mitte'
 */
export function camelToTitle(str) {
    if (typeof str !== 'string') return '';

    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^./, char => char.toUpperCase());
}

/**
 * Konvertiert snake_case zu Titel mit Leerzeichen
 * @param {string} str - Der String
 * @returns {string}
 *
 * @example
 * snakeToTitle('vorne_mitte') // => 'Vorne Mitte'
 */
export function snakeToTitle(str) {
    if (typeof str !== 'string') return '';

    return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Ersetzt Unterstriche durch Leerzeichen
 * @param {string} str - Der String
 * @returns {string}
 */
export function underscoreToSpace(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/_/g, ' ');
}

/**
 * Slug-Erzeugung (URL-freundlich)
 * @param {string} str - Der String
 * @returns {string}
 */
export function slugify(str) {
    if (typeof str !== 'string') return '';

    return str
        .toLowerCase()
        .replace(/[äöüß]/g, char => ({
            'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss'
        }[char] || char))
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Prüft ob ein String ein gültiger Bezeichner ist
 * @param {string} str - Der String
 * @returns {boolean}
 */
export function isValidIdentifier(str) {
    if (typeof str !== 'string' || str.length === 0) return false;
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str);
}

/**
 * Entfernt führende/nachfolgende Leerzeichen und normalisiert
 * mehrfache Leerzeichen zu einzelnen
 * @param {string} str - Der String
 * @returns {string}
 */
export function normalizeWhitespace(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ');
}

// Default-Export mit allen Funktionen
export default {
    normalizePfostenId,
    normalisierePfostenId,
    normalizePostIdSimple,
    normalizeConfigKey,
    camelToTitle,
    snakeToTitle,
    underscoreToSpace,
    slugify,
    isValidIdentifier,
    normalizeWhitespace
};
