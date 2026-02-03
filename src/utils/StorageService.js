/**
 * Zentraler Storage Service für den Pergola-Konfigurator
 * Kapselt alle localStorage-Zugriffe
 */

import { createLogger } from './Logger.js';

const logger = createLogger('StorageService');

/**
 * Storage Service Klasse
 * Bietet typsichere und fehlertolerante Speicherung
 */
class StorageServiceClass {
    /**
     * @param {string} prefix - Prefix für alle Keys
     */
    constructor(prefix = 'pergola_') {
        this.prefix = prefix;
        this.available = this.checkAvailability();
    }

    /**
     * Prüft ob localStorage verfügbar ist
     * @returns {boolean}
     */
    checkAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            logger.warn('localStorage nicht verfügbar');
            return false;
        }
    }

    /**
     * Baut den vollständigen Key
     * @param {string} key
     * @returns {string}
     */
    buildKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Speichert einen Wert
     * @param {string} key - Schlüssel
     * @param {any} value - Wert (wird als JSON gespeichert)
     * @returns {boolean} - Erfolg
     */
    set(key, value) {
        if (!this.available) return false;

        try {
            const fullKey = this.buildKey(key);
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            logger.debug(`Gespeichert: ${key}`);
            return true;
        } catch (e) {
            logger.error(`Fehler beim Speichern von '${key}':`, e);
            return false;
        }
    }

    /**
     * Liest einen Wert
     * @param {string} key - Schlüssel
     * @param {any} defaultValue - Standardwert falls nicht vorhanden
     * @returns {any} - Der gespeicherte Wert oder defaultValue
     */
    get(key, defaultValue = null) {
        if (!this.available) return defaultValue;

        try {
            const fullKey = this.buildKey(key);
            const item = localStorage.getItem(fullKey);

            if (item === null) {
                return defaultValue;
            }

            return JSON.parse(item);
        } catch (e) {
            logger.error(`Fehler beim Lesen von '${key}':`, e);
            return defaultValue;
        }
    }

    /**
     * Liest einen String-Wert direkt (ohne JSON.parse)
     * @param {string} key - Schlüssel
     * @param {string} defaultValue - Standardwert
     * @returns {string}
     */
    getString(key, defaultValue = '') {
        if (!this.available) return defaultValue;

        try {
            const fullKey = this.buildKey(key);
            const item = localStorage.getItem(fullKey);
            return item !== null ? item : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    /**
     * Speichert einen String direkt (ohne JSON.stringify)
     * @param {string} key - Schlüssel
     * @param {string} value - Wert
     * @returns {boolean}
     */
    setString(key, value) {
        if (!this.available) return false;

        try {
            const fullKey = this.buildKey(key);
            localStorage.setItem(fullKey, value);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Liest einen Boolean-Wert
     * @param {string} key - Schlüssel
     * @param {boolean} defaultValue - Standardwert
     * @returns {boolean}
     */
    getBoolean(key, defaultValue = false) {
        const value = this.getString(key, null);
        if (value === null) return defaultValue;
        return value === 'true';
    }

    /**
     * Speichert einen Boolean-Wert
     * @param {string} key - Schlüssel
     * @param {boolean} value - Wert
     * @returns {boolean}
     */
    setBoolean(key, value) {
        return this.setString(key, value.toString());
    }

    /**
     * Liest einen Zahlen-Wert
     * @param {string} key - Schlüssel
     * @param {number} defaultValue - Standardwert
     * @returns {number}
     */
    getNumber(key, defaultValue = 0) {
        const value = this.get(key, null);
        if (value === null) return defaultValue;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * Entfernt einen Wert
     * @param {string} key - Schlüssel
     * @returns {boolean}
     */
    remove(key) {
        if (!this.available) return false;

        try {
            const fullKey = this.buildKey(key);
            localStorage.removeItem(fullKey);
            logger.debug(`Entfernt: ${key}`);
            return true;
        } catch (e) {
            logger.error(`Fehler beim Entfernen von '${key}':`, e);
            return false;
        }
    }

    /**
     * Prüft ob ein Key existiert
     * @param {string} key - Schlüssel
     * @returns {boolean}
     */
    has(key) {
        if (!this.available) return false;

        const fullKey = this.buildKey(key);
        return localStorage.getItem(fullKey) !== null;
    }

    /**
     * Löscht alle Einträge mit dem Prefix
     * @returns {number} - Anzahl gelöschter Einträge
     */
    clear() {
        if (!this.available) return 0;

        let count = 0;
        const keys = this.getAllKeys();

        keys.forEach(key => {
            localStorage.removeItem(key);
            count++;
        });

        logger.info(`${count} Einträge gelöscht`);
        return count;
    }

    /**
     * Gibt alle Keys mit dem Prefix zurück
     * @returns {string[]}
     */
    getAllKeys() {
        if (!this.available) return [];

        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * Gibt die Größe des genutzten Speichers zurück
     * @returns {number} - Größe in Bytes
     */
    getUsedSpace() {
        if (!this.available) return 0;

        let total = 0;
        const keys = this.getAllKeys();

        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                total += key.length + value.length;
            }
        });

        return total * 2; // UTF-16 = 2 Bytes pro Zeichen
    }
}

// Singleton-Instanz
const StorageService = new StorageServiceClass();

// ============================================================================
// BEKANNTE STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
    DEBUG: 'debug',
    LAST_CONFIG: 'lastConfig',
    USER_PREFERENCES: 'userPreferences',
    THEME: 'theme'
};

// ============================================================================
// HELPER-FUNKTIONEN FÜR HÄUFIGE OPERATIONEN
// ============================================================================

/**
 * Prüft ob Debug-Modus aktiv ist
 * @returns {boolean}
 */
export function isDebugMode() {
    return StorageService.getBoolean(STORAGE_KEYS.DEBUG, false);
}

/**
 * Setzt Debug-Modus
 * @param {boolean} enabled
 */
export function setDebugMode(enabled) {
    StorageService.setBoolean(STORAGE_KEYS.DEBUG, enabled);
}

/**
 * Speichert die letzte Konfiguration
 * @param {object} config
 */
export function saveLastConfig(config) {
    StorageService.set(STORAGE_KEYS.LAST_CONFIG, config);
}

/**
 * Lädt die letzte Konfiguration
 * @returns {object|null}
 */
export function loadLastConfig() {
    return StorageService.get(STORAGE_KEYS.LAST_CONFIG, null);
}

// Default-Export
export default StorageService;
