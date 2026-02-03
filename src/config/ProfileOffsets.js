/**
 * Profil-Offsets für den Pergola-Konfigurator
 * Zentralisiert Magic Numbers für Pultdach/Flachdach-Berechnungen
 *
 * Eliminiert verschachtelte if/else-Ketten in:
 * - Quertraeger.js
 * - Laengstraeger.js
 * - Glaeser.js
 */

// ============================================================================
// PROFIL-OFFSET LOOKUP TABLES
// ============================================================================

/**
 * Pultdach-Offsets basierend auf Längsträgerhöhe
 * Key: Längsträgerhöhe in Metern (als String für präzisen Lookup)
 * Value: Offset in Metern
 */
export const PULTDACH_OFFSETS = {
    '0.08': 0.040,   // 80×60 Profil
    '0.10': 0.050,   // 100×80 Profil
    '0.12': 0.060,   // 120×80 Profil
    '0.20': 0.080    // 200×100 Profil
};

/**
 * Flachdach-Offsets basierend auf Längsträgerhöhe
 */
export const FLACHDACH_OFFSETS = {
    '0.08': 0.010,
    '0.10': 0.010,
    '0.12': 0.020,
    '0.20': 0.030
};

/**
 * Default-Offset wenn kein Match gefunden wird
 */
export const DEFAULT_OFFSET = 0.061;

/**
 * Toleranz für Höhenvergleich (in Metern)
 */
export const HEIGHT_TOLERANCE = 0.001;

// ============================================================================
// PROFIL-DIMENSIONEN
// ============================================================================

/**
 * Standardprofile mit ihren Abmessungen
 */
export const PROFILE_DIMENSIONS = {
    '80x60': {
        width: 0.080,
        height: 0.060,
        displayName: '80×60 mm'
    },
    '100x80': {
        width: 0.100,
        height: 0.080,
        displayName: '100×80 mm'
    },
    '120x80': {
        width: 0.120,
        height: 0.080,
        displayName: '120×80 mm'
    },
    '100x100x3': {
        width: 0.100,
        height: 0.100,
        thickness: 0.003,
        displayName: '100×100×3 mm'
    },
    '120x120x4': {
        width: 0.120,
        height: 0.120,
        thickness: 0.004,
        displayName: '120×120×4 mm'
    },
    '150x150x5': {
        width: 0.150,
        height: 0.150,
        thickness: 0.005,
        displayName: '150×150×5 mm'
    },
    '200x100x4': {
        width: 0.200,
        height: 0.100,
        thickness: 0.004,
        displayName: '200×100×4 mm'
    }
};

// ============================================================================
// HELPER FUNKTIONEN
// ============================================================================

/**
 * Ermittelt den Offset für einen Dachtyp und Längsträgerhöhe
 *
 * @param {number} laengstraegerHoehe - Höhe des Längsträgers in Metern
 * @param {string} dachTyp - 'pultdach' oder 'flachdach'
 * @returns {number} - Der Offset in Metern
 *
 * @example
 * getProfileOffset(0.12, 'pultdach') // => 0.060
 */
export function getProfileOffset(laengstraegerHoehe, dachTyp = 'pultdach') {
    const offsets = dachTyp === 'flachdach' ? FLACHDACH_OFFSETS : PULTDACH_OFFSETS;

    // Suche nach passendem Offset mit Toleranz
    for (const [heightKey, offset] of Object.entries(offsets)) {
        const keyHeight = parseFloat(heightKey);
        if (Math.abs(keyHeight - laengstraegerHoehe) < HEIGHT_TOLERANCE) {
            return offset;
        }
    }

    return DEFAULT_OFFSET;
}

/**
 * Prüft ob es ein Pultdach ist (Neigung > 0)
 * @param {number} neigung - Neigung in Grad
 * @returns {boolean}
 */
export function isPultdach(neigung) {
    return Math.abs(Number(neigung) || 0) > HEIGHT_TOLERANCE;
}

/**
 * Prüft ob es ein Flachdach ist (Neigung ≈ 0)
 * @param {number} neigung - Neigung in Grad
 * @returns {boolean}
 */
export function isFlachdach(neigung) {
    return !isPultdach(neigung);
}

/**
 * Ermittelt den Dachtyp basierend auf der Neigung
 * @param {number} neigung - Neigung in Grad
 * @returns {'pultdach'|'flachdach'}
 */
export function getDachTypFromNeigung(neigung) {
    return isPultdach(neigung) ? 'pultdach' : 'flachdach';
}

/**
 * Ermittelt das Profil aus der Profilhöhe
 * @param {number} height - Höhe in Metern
 * @returns {object|null} - Profil-Objekt oder null
 */
export function getProfileByHeight(height) {
    for (const [key, profile] of Object.entries(PROFILE_DIMENSIONS)) {
        if (Math.abs(profile.height - height) < HEIGHT_TOLERANCE) {
            return { id: key, ...profile };
        }
    }
    return null;
}

/**
 * Berechnet die Y-Position für einen Auflager auf dem Längsträger
 *
 * @param {object} laengstraeger - Der Längsträger mit Referenzpunkten
 * @param {number} z - Z-Position
 * @returns {number|null} - Y-Position oder null
 */
export function calculateSupportYPosition(laengstraeger, z) {
    const ref = laengstraeger?.referenzpunkte;
    if (!ref?.start || !ref?.ende) return null;

    const startZ = ref.start.z;
    const deltaZ = ref.ende.z - startZ;

    // Interpolation entlang der Z-Achse
    const t = deltaZ !== 0 ? (z - startZ) / deltaZ : 0;
    const y = ref.start.y + (ref.ende.y - ref.start.y) * t;

    // Addiere Höhe des Längsträgers
    const hoehe = laengstraeger.abmessungen?.hoehe || 0;
    return y + hoehe;
}

/**
 * Interpoliert einen Y-Wert entlang einer Achse
 *
 * @param {object} startPoint - { y, z } Startpunkt
 * @param {object} endPoint - { y, z } Endpunkt
 * @param {number} targetZ - Ziel-Z-Position
 * @param {number} yOffset - Zusätzlicher Y-Offset
 * @returns {number}
 */
export function interpolateAlongAxis(startPoint, endPoint, targetZ, yOffset = 0) {
    const deltaZ = endPoint.z - startPoint.z;

    if (Math.abs(deltaZ) < HEIGHT_TOLERANCE) {
        return startPoint.y + yOffset;
    }

    const t = (targetZ - startPoint.z) / deltaZ;
    const y = startPoint.y + (endPoint.y - startPoint.y) * t;

    return y + yOffset;
}

// Default-Export
export default {
    PULTDACH_OFFSETS,
    FLACHDACH_OFFSETS,
    DEFAULT_OFFSET,
    HEIGHT_TOLERANCE,
    PROFILE_DIMENSIONS,
    getProfileOffset,
    isPultdach,
    isFlachdach,
    getDachTypFromNeigung,
    getProfileByHeight,
    calculateSupportYPosition,
    interpolateAlongAxis
};
