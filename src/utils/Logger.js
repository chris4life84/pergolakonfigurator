/**
 * Zentrales Logger-System für den Pergola-Konfigurator
 * Ersetzt alle direkten console.log Aufrufe
 */

import { CONFIG } from '../constants/index.js';

// Log-Levels
export const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// Aktuelle Konfiguration
let currentLevel = LOG_LEVELS.INFO;
let isDebugEnabled = false;

/**
 * Prüft, ob Debug-Modus aktiv ist
 */
function checkDebugMode() {
    try {
        // localStorage Check
        if (localStorage.getItem(CONFIG.DEBUG_FLAG) === 'true') {
            return true;
        }
        // URL Parameter Check
        const params = new URLSearchParams(window.location.search);
        if (params.get(CONFIG.DEBUG_URL_PARAM) === '1') {
            return true;
        }
    } catch (e) {
        // localStorage nicht verfügbar
    }
    return false;
}

/**
 * Initialisiert den Logger
 */
export function initLogger() {
    isDebugEnabled = checkDebugMode();
    currentLevel = isDebugEnabled ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
}

/**
 * Setzt das Log-Level
 * @param {number} level - Eines der LOG_LEVELS
 */
export function setLogLevel(level) {
    currentLevel = level;
}

/**
 * Aktiviert/Deaktiviert Debug-Modus
 * @param {boolean} enabled
 */
export function setDebugMode(enabled) {
    isDebugEnabled = enabled;
    try {
        localStorage.setItem(CONFIG.DEBUG_FLAG, enabled.toString());
    } catch (e) {
        // localStorage nicht verfügbar
    }
    currentLevel = enabled ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
}

/**
 * Prüft ob Debug aktiv ist
 * @returns {boolean}
 */
export function isDebug() {
    return isDebugEnabled;
}

/**
 * Formatiert die Log-Nachricht mit Namespace
 * @param {string} namespace
 * @param {string} message
 * @returns {string}
 */
function formatMessage(namespace, message) {
    return `[${namespace}] ${message}`;
}

/**
 * Logger-Klasse für namespace-basiertes Logging
 */
export class Logger {
    /**
     * @param {string} namespace - Name des Moduls/der Komponente
     */
    constructor(namespace) {
        this.namespace = namespace;
    }

    /**
     * Debug-Log (nur bei aktiviertem Debug-Modus)
     * @param {string} message
     * @param  {...any} args
     */
    debug(message, ...args) {
        if (currentLevel <= LOG_LEVELS.DEBUG) {
            console.log(formatMessage(this.namespace, message), ...args);
        }
    }

    /**
     * Info-Log
     * @param {string} message
     * @param  {...any} args
     */
    info(message, ...args) {
        if (currentLevel <= LOG_LEVELS.INFO) {
            console.log(formatMessage(this.namespace, message), ...args);
        }
    }

    /**
     * Warning-Log
     * @param {string} message
     * @param  {...any} args
     */
    warn(message, ...args) {
        if (currentLevel <= LOG_LEVELS.WARN) {
            console.warn(formatMessage(this.namespace, `⚠️ ${message}`), ...args);
        }
    }

    /**
     * Error-Log
     * @param {string} message
     * @param  {...any} args
     */
    error(message, ...args) {
        if (currentLevel <= LOG_LEVELS.ERROR) {
            console.error(formatMessage(this.namespace, `❌ ${message}`), ...args);
        }
    }

    /**
     * Gruppierter Log-Beginn
     * @param {string} message
     */
    group(message) {
        if (currentLevel <= LOG_LEVELS.INFO) {
            console.group(formatMessage(this.namespace, message));
        }
    }

    /**
     * Gruppierter Log-Ende
     */
    groupEnd() {
        if (currentLevel <= LOG_LEVELS.INFO) {
            console.groupEnd();
        }
    }

    /**
     * Tabellarische Ausgabe
     * @param {any} data
     */
    table(data) {
        if (currentLevel <= LOG_LEVELS.DEBUG) {
            console.table(data);
        }
    }

    /**
     * Zeit-Messung starten
     * @param {string} label
     */
    time(label) {
        if (currentLevel <= LOG_LEVELS.DEBUG) {
            console.time(`[${this.namespace}] ${label}`);
        }
    }

    /**
     * Zeit-Messung beenden
     * @param {string} label
     */
    timeEnd(label) {
        if (currentLevel <= LOG_LEVELS.DEBUG) {
            console.timeEnd(`[${this.namespace}] ${label}`);
        }
    }
}

/**
 * Factory-Funktion für Logger-Instanzen
 * @param {string} namespace
 * @returns {Logger}
 */
export function createLogger(namespace) {
    return new Logger(namespace);
}

// Initialisierung beim Laden
initLogger();

// Default-Export für einfache Nutzung
export default {
    Logger,
    createLogger,
    setLogLevel,
    setDebugMode,
    isDebug,
    LOG_LEVELS
};
