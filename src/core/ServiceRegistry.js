/**
 * Service Registry für den Pergola-Konfigurator
 * Ersetzt globale window-Variablen durch Dependency Injection
 *
 * Singleton-Pattern für zentralen Zugriff auf Services
 */

import { createLogger } from '../utils/Logger.js';

const logger = createLogger('ServiceRegistry');

/**
 * Zentrale Service-Registry
 * Verwaltet alle Services und ermöglicht Dependency Injection
 */
class ServiceRegistryClass {
    constructor() {
        /** @type {Map<string, any>} */
        this.services = new Map();

        /** @type {Map<string, Function[]>} */
        this.listeners = new Map();

        /** @type {boolean} */
        this.isInitialized = false;
    }

    /**
     * Registriert einen Service
     * @param {string} name - Name des Services
     * @param {any} service - Die Service-Instanz
     * @returns {ServiceRegistryClass} - Für Method Chaining
     */
    register(name, service) {
        if (this.services.has(name)) {
            logger.warn(`Service '${name}' wird überschrieben`);
        }

        this.services.set(name, service);
        logger.debug(`Service '${name}' registriert`);

        // Benachrichtige Listener
        this.notifyListeners(name, service);

        return this;
    }

    /**
     * Holt einen Service
     * @param {string} name - Name des Services
     * @returns {any} - Der Service oder undefined
     */
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            logger.debug(`Service '${name}' nicht gefunden`);
        }
        return service;
    }

    /**
     * Prüft ob ein Service existiert
     * @param {string} name - Name des Services
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Entfernt einen Service
     * @param {string} name - Name des Services
     * @returns {boolean} - true wenn entfernt
     */
    unregister(name) {
        const result = this.services.delete(name);
        if (result) {
            logger.debug(`Service '${name}' entfernt`);
        }
        return result;
    }

    /**
     * Registriert einen Listener für einen Service
     * Wird aufgerufen sobald der Service verfügbar ist
     * @param {string} name - Name des Services
     * @param {Function} callback - Callback-Funktion
     */
    onServiceAvailable(name, callback) {
        // Falls Service schon existiert, sofort aufrufen
        if (this.services.has(name)) {
            callback(this.services.get(name));
            return;
        }

        // Sonst Listener registrieren
        if (!this.listeners.has(name)) {
            this.listeners.set(name, []);
        }
        this.listeners.get(name).push(callback);
    }

    /**
     * Benachrichtigt Listener wenn Service verfügbar wird
     * @param {string} name - Name des Services
     * @param {any} service - Der Service
     */
    notifyListeners(name, service) {
        const callbacks = this.listeners.get(name);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(service);
                } catch (e) {
                    logger.error(`Fehler in Service-Listener für '${name}':`, e);
                }
            });
            // Listener nur einmal aufrufen
            this.listeners.delete(name);
        }
    }

    /**
     * Gibt alle registrierten Service-Namen zurück
     * @returns {string[]}
     */
    getServiceNames() {
        return Array.from(this.services.keys());
    }

    /**
     * Räumt alle Services auf
     */
    dispose() {
        this.services.forEach((service, name) => {
            if (typeof service.dispose === 'function') {
                try {
                    service.dispose();
                    logger.debug(`Service '${name}' disposed`);
                } catch (e) {
                    logger.error(`Fehler beim Disposen von '${name}':`, e);
                }
            }
        });
        this.services.clear();
        this.listeners.clear();
        this.isInitialized = false;
        logger.info('Alle Services entfernt');
    }

    /**
     * Debug-Ausgabe aller Services
     */
    debug() {
        logger.group('Registrierte Services');
        this.services.forEach((service, name) => {
            logger.info(`- ${name}:`, typeof service);
        });
        logger.groupEnd();
    }
}

// Singleton-Instanz
const ServiceRegistry = new ServiceRegistryClass();

// ============================================================================
// BEKANNTE SERVICE-NAMEN (Typsicherheit)
// ============================================================================

export const SERVICE_NAMES = {
    KONFIGURATOR: 'konfigurator',
    RENDER_ENGINE: 'renderEngine',
    UI_CONTROLLER: 'uiController',
    STATICS_CHECK: 'staticsCheck',
    KONFIGURATION: 'konfiguration',
    PERGOLA: 'pergola'
};

// ============================================================================
// HELPER-FUNKTIONEN
// ============================================================================

/**
 * Registriert den Konfigurator
 * @param {any} konfigurator
 */
export function registerKonfigurator(konfigurator) {
    ServiceRegistry.register(SERVICE_NAMES.KONFIGURATOR, konfigurator);
}

/**
 * Holt den Konfigurator
 * @returns {any}
 */
export function getKonfigurator() {
    return ServiceRegistry.get(SERVICE_NAMES.KONFIGURATOR);
}

/**
 * Registriert die RenderEngine
 * @param {any} renderEngine
 */
export function registerRenderEngine(renderEngine) {
    ServiceRegistry.register(SERVICE_NAMES.RENDER_ENGINE, renderEngine);
}

/**
 * Holt die RenderEngine
 * @returns {any}
 */
export function getRenderEngine() {
    return ServiceRegistry.get(SERVICE_NAMES.RENDER_ENGINE);
}

/**
 * Registriert den UIController
 * @param {any} uiController
 */
export function registerUIController(uiController) {
    ServiceRegistry.register(SERVICE_NAMES.UI_CONTROLLER, uiController);
}

/**
 * Holt den UIController
 * @returns {any}
 */
export function getUIController() {
    return ServiceRegistry.get(SERVICE_NAMES.UI_CONTROLLER);
}

/**
 * Registriert StaticsCheck
 * @param {any} staticsCheck
 */
export function registerStaticsCheck(staticsCheck) {
    ServiceRegistry.register(SERVICE_NAMES.STATICS_CHECK, staticsCheck);
}

/**
 * Holt StaticsCheck
 * @returns {any}
 */
export function getStaticsCheck() {
    return ServiceRegistry.get(SERVICE_NAMES.STATICS_CHECK);
}

// Default-Export
export default ServiceRegistry;
