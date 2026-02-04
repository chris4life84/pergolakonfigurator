/**
 * Zentraler EventBus für den Pergola-Konfigurator
 * Ersetzt direkte document.addEventListener/dispatchEvent Aufrufe
 *
 * Vorteile:
 * - Typisierte Events
 * - Einfaches Unsubscribe
 * - Debug-Möglichkeiten
 * - Memory-Leak Prävention
 */

import { createLogger } from '../utils/Logger.js';
import { EVENTS } from '../constants/index.js';

const logger = createLogger('EventBus');

/**
 * Event-Typen für den Konfigurator
 * @readonly
 * @enum {string}
 */
export const EventTypes = {
    // Konfiguration
    CONFIG_CHANGED: EVENTS.CONFIGURATION_CHANGED,
    STRUCTURE_UPDATED: EVENTS.STRUCTURE_UPDATED,
    DIMENSION_CHANGED: EVENTS.DIMENSION_CHANGE,
    COLOR_CHANGED: EVENTS.COLOR_CHANGE,
    PROFILE_CHANGED: EVENTS.PROFILE_CHANGE,

    // UI
    STEPPER_CHANGED: EVENTS.STEPPER_CHANGED,
    STATICS_ACTION: EVENTS.STATICS_ACTION,

    // Rendering
    RENDER_REQUEST: 'renderRequest',
    CAMERA_CHANGED: 'cameraChanged',

    // Komponenten
    COMPONENT_CREATED: 'componentCreated',
    COMPONENT_UPDATED: 'componentUpdated',
    COMPONENT_REMOVED: 'componentRemoved',

    // Interaktion
    ELEMENT_SELECTED: 'elementSelected',
    ELEMENT_HOVERED: 'elementHovered',

    // Lebenszyklus
    APP_INITIALIZED: 'appInitialized',
    APP_DISPOSED: 'appDisposed'
};

/**
 * EventBus Singleton-Klasse
 */
class EventBusClass {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this.listeners = new Map();

        /** @type {Map<Function, { event: string, once: boolean }>} */
        this.listenerMeta = new Map();

        /** @type {boolean} */
        this.debugMode = false;

        /** @type {Array<{event: string, data: any, timestamp: number}>} */
        this.history = [];

        /** @type {number} */
        this.historyMaxSize = 100;
    }

    /**
     * Aktiviert/Deaktiviert Debug-Modus
     * @param {boolean} enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Registriert einen Event-Listener
     * @param {string} event - Event-Name
     * @param {Function} callback - Callback-Funktion
     * @param {object} options - { once: boolean }
     * @returns {Function} - Unsubscribe-Funktion
     */
    on(event, callback, options = {}) {
        if (typeof callback !== 'function') {
            logger.error(`on: Callback für '${event}' ist keine Funktion`);
            return () => {};
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event).add(callback);
        this.listenerMeta.set(callback, { event, once: options.once || false });

        if (this.debugMode) {
            logger.debug(`Listener registriert für '${event}'`);
        }

        // Unsubscribe-Funktion zurückgeben
        return () => this.off(event, callback);
    }

    /**
     * Registriert einen einmaligen Event-Listener
     * @param {string} event - Event-Name
     * @param {Function} callback - Callback-Funktion
     * @returns {Function} - Unsubscribe-Funktion
     */
    once(event, callback) {
        return this.on(event, callback, { once: true });
    }

    /**
     * Entfernt einen Event-Listener
     * @param {string} event - Event-Name
     * @param {Function} callback - Callback-Funktion
     * @returns {boolean} - true wenn entfernt
     */
    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (!listeners) return false;

        const result = listeners.delete(callback);
        this.listenerMeta.delete(callback);

        if (listeners.size === 0) {
            this.listeners.delete(event);
        }

        if (this.debugMode && result) {
            logger.debug(`Listener entfernt für '${event}'`);
        }

        return result;
    }

    /**
     * Entfernt alle Listener für ein Event
     * @param {string} event - Event-Name
     */
    offAll(event) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(cb => this.listenerMeta.delete(cb));
            this.listeners.delete(event);

            if (this.debugMode) {
                logger.debug(`Alle Listener entfernt für '${event}'`);
            }
        }
    }

    /**
     * Feuert ein Event
     * @param {string} event - Event-Name
     * @param {any} data - Event-Daten
     */
    emit(event, data = null) {
        if (this.debugMode) {
            logger.debug(`Event: '${event}'`, data);
        }

        // In History speichern
        this.addToHistory(event, data);

        const listeners = this.listeners.get(event);
        if (!listeners || listeners.size === 0) {
            return;
        }

        // Kopie erstellen, da Listener sich selbst entfernen können
        const listenersCopy = [...listeners];

        listenersCopy.forEach(callback => {
            try {
                callback(data);

                // Once-Listener entfernen
                const meta = this.listenerMeta.get(callback);
                if (meta?.once) {
                    this.off(event, callback);
                }
            } catch (error) {
                logger.error(`Fehler in Listener für '${event}':`, error);
            }
        });
    }

    /**
     * Alias für emit (für CustomEvent-Kompatibilität)
     * @param {string} event - Event-Name
     * @param {any} detail - Event-Details
     */
    dispatch(event, detail = null) {
        this.emit(event, detail);
    }

    /**
     * Prüft ob Listener für ein Event existieren
     * @param {string} event - Event-Name
     * @returns {boolean}
     */
    hasListeners(event) {
        const listeners = this.listeners.get(event);
        return listeners ? listeners.size > 0 : false;
    }

    /**
     * Gibt die Anzahl der Listener für ein Event zurück
     * @param {string} event - Event-Name
     * @returns {number}
     */
    listenerCount(event) {
        const listeners = this.listeners.get(event);
        return listeners ? listeners.size : 0;
    }

    /**
     * Gibt alle registrierten Events zurück
     * @returns {string[]}
     */
    getRegisteredEvents() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Fügt ein Event zur History hinzu
     * @param {string} event
     * @param {any} data
     */
    addToHistory(event, data) {
        this.history.push({
            event,
            data,
            timestamp: Date.now()
        });

        // History-Größe begrenzen
        if (this.history.length > this.historyMaxSize) {
            this.history.shift();
        }
    }

    /**
     * Gibt die Event-History zurück
     * @param {string} event - Optional: Filter nach Event
     * @returns {Array}
     */
    getHistory(event = null) {
        if (event) {
            return this.history.filter(h => h.event === event);
        }
        return [...this.history];
    }

    /**
     * Löscht die Event-History
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * Entfernt alle Listener
     */
    dispose() {
        this.listeners.forEach((listeners, event) => {
            listeners.forEach(cb => this.listenerMeta.delete(cb));
        });
        this.listeners.clear();
        this.history = [];

        logger.info('EventBus disposed');
    }

    /**
     * Debug-Ausgabe
     */
    debug() {
        logger.group('EventBus Debug');
        logger.info(`Registrierte Events: ${this.listeners.size}`);

        this.listeners.forEach((listeners, event) => {
            logger.info(`  ${event}: ${listeners.size} Listener`);
        });

        logger.info(`History: ${this.history.length} Events`);
        logger.groupEnd();
    }
}

// Singleton-Instanz
const EventBus = new EventBusClass();

// ============================================================================
// BRIDGE ZU DOCUMENT EVENTS (für Legacy-Kompatibilität)
// ============================================================================

/**
 * Bridged ein Document-Event zum EventBus
 * @param {string} domEvent - DOM Event-Name
 * @param {string} busEvent - EventBus Event-Name (optional, default = domEvent)
 */
export function bridgeFromDocument(domEvent, busEvent = null) {
    const targetEvent = busEvent || domEvent;

    document.addEventListener(domEvent, (e) => {
        EventBus.emit(targetEvent, e.detail || e);
    });

    logger.debug(`Bridge: document.${domEvent} → EventBus.${targetEvent}`);
}

/**
 * Bridged EventBus-Events zum Document
 * @param {string} busEvent - EventBus Event-Name
 * @param {string} domEvent - DOM Event-Name (optional, default = busEvent)
 */
export function bridgeToDocument(busEvent, domEvent = null) {
    const targetEvent = domEvent || busEvent;

    EventBus.on(busEvent, (data) => {
        document.dispatchEvent(new CustomEvent(targetEvent, { detail: data }));
    });

    logger.debug(`Bridge: EventBus.${busEvent} → document.${targetEvent}`);
}

/**
 * Initialisiert alle Standard-Bridges für Legacy-Kompatibilität
 */
export function initializeEventBridges() {
    // Von Document zum EventBus
    bridgeFromDocument(EVENTS.CONFIGURATION_CHANGED);
    bridgeFromDocument(EVENTS.STRUCTURE_UPDATED);
    bridgeFromDocument(EVENTS.STATICS_ACTION);
    bridgeFromDocument(EVENTS.PROFILE_CHANGE);
    bridgeFromDocument(EVENTS.STEPPER_CHANGED);

    logger.info('Event-Bridges initialisiert');
}

// Export
export { EventBus };
export default EventBus;
