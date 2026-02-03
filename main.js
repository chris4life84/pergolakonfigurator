/**
 * Pergola Konfigurator - Haupteinstiegspunkt
 *
 * Refactored: Verwendet ServiceRegistry statt globaler Variablen
 */

import { RenderEngine } from "./src/core/RenderEngine.js";
import { PergolaKonfiguration } from "./src/config/PergolaKonfiguration.js";
import { UIController } from "./src/ui/UIController.js";
import { StaticsCheck } from "./src/core/StaticsCheck.js";
import {
    initializeTerraceTextureControls,
    initializeOutdoorFurnitureControls
} from "./src/ui/TerraceAndFurnitureControls.js";

// Neue Module
import { createLogger, setDebugMode, isDebug } from "./src/utils/Logger.js";
import ServiceRegistry, {
    registerKonfigurator,
    registerRenderEngine,
    registerUIController,
    registerStaticsCheck,
    getKonfigurator,
    getRenderEngine,
    getUIController
} from "./src/core/ServiceRegistry.js";
import StorageService, { STORAGE_KEYS } from "./src/utils/StorageService.js";
import { CONFIG, DOM_SELECTORS, EVENTS, COMPONENT_NAMES } from "./src/constants/index.js";
import EventBus, { EventTypes, initializeEventBridges } from "./src/core/EventBus.js";

// Logger für dieses Modul
const logger = createLogger('Main');

// StaticsCheck in Registry registrieren (statt window.StaticsCheck)
registerStaticsCheck(StaticsCheck);

// Legacy-Kompatibilität: StaticsCheck auch global verfügbar machen
// TODO: Schrittweise entfernen, wenn alle Abhängigkeiten migriert sind
window.StaticsCheck = StaticsCheck;

/**
 * Hauptklasse des Pergola-Konfigurators
 */
class PergolaKonfigurator {
    constructor() {
        this.renderEngine = null;
        this.konfiguration = null;
        this.uiController = null;
        this.istInitialisiert = false;

        // Event-Listener-Referenzen für Cleanup
        this._keydownHandler = null;
        this._resizeHandler = null;

        logger.info("Pergola Konfigurator gestartet");
    }

    async initialisieren() {
        try {
            logger.group("INITIALISIERE PERGOLA KONFIGURATOR");

            await this.warteDOMBereit();

            // Event-Bridges initialisieren
            initializeEventBridges();

            logger.info("Initialisiere Render-Engine...");
            this.renderEngine = new RenderEngine(DOM_SELECTORS.CANVAS);
            await this.renderEngine.initialisieren();
            registerRenderEngine(this.renderEngine);

            logger.info("Initialisiere UI-Controller...");
            this.uiController = new UIController(this.renderEngine);
            registerUIController(this.uiController);

            // Legacy-Kompatibilität
            window.uiController = this.uiController;

            this.uiController.initialisieren();
            this.konfiguration = this.renderEngine.gibPergola().gibKonfiguration();

            this.initEventSystem();

            // Initialisiere neue UI-Controls
            setTimeout(() => {
                initializeTerraceTextureControls();
                initializeOutdoorFurnitureControls();
            }, CONFIG.INITIALIZATION_DELAY);

            this.istInitialisiert = true;

            // Event emittieren
            EventBus.emit(EventTypes.APP_INITIALIZED, { konfigurator: this });

            logger.info("Pergola Konfigurator erfolgreich initialisiert");

            if (this.istDebugModus()) {
                this.debugKonfigurator();
            }
        } catch (e) {
            logger.error("Fehler bei der Initialisierung:", e);
            this.zeigeFehlermeldung("Initialisierung fehlgeschlagen", e.message);
        }

        logger.groupEnd();
    }

    warteDOMBereit() {
        return new Promise(resolve => {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", resolve);
            } else {
                resolve();
            }
        });
    }

    initUIIntegration() {
        logger.info("UI-Integration: Verwende Übergangs-Setup...");

        if (window.ConfigPanel) {
            logger.debug("Integriere altes ConfigPanel...");
            this.integriereAltesConfigPanel();
        }

        if (window.MaterialList) {
            logger.debug("Integriere alte MaterialList...");
            this.integriereAlteMaterialList();
        }
    }

    integriereAltesConfigPanel() {
        try {
            const panel = new window.ConfigPanel(this.renderEngine);

            EventBus.on(EventTypes.CONFIG_CHANGED, (detail) => {
                if (this.renderEngine && this.renderEngine.gibPergola()) {
                    logger.debug("Konfiguration geändert:", detail);
                }
            });

            this.uiElemente = this.uiElemente || {};
            this.uiElemente.konfigurationspanel = panel;
        } catch (e) {
            logger.warn("Altes ConfigPanel konnte nicht integriert werden:", e);
        }
    }

    integriereAlteMaterialList() {
        try {
            const materialList = new window.MaterialList();

            EventBus.on(EventTypes.STRUCTURE_UPDATED, (detail) => {
                if (materialList && materialList.updateMaterials) {
                    const pergola = detail?.pergola;
                    if (pergola) {
                        pergola.gibKonfiguration();
                        materialList.updateMaterials(this.berechneNeueMateriealien(pergola));
                    }
                }
            });

            this.uiElemente = this.uiElemente || {};
            this.uiElemente.materialliste = materialList;
        } catch (e) {
            logger.warn("Alte MaterialList konnte nicht integriert werden:", e);
        }
    }

    berechneNeueMateriealien(pergola) {
        const konfig = pergola.gibKonfiguration();
        const statistiken = pergola.berechneStatistiken();
        const pfosten = pergola.gibKomponente(COMPONENT_NAMES.PFOSTEN).gibAllePfosten();
        const laengstraeger = pergola.gibKomponente(COMPONENT_NAMES.LAENGSTRAEGER).gibAlleLaengstraeger();
        const quertraeger = pergola.gibKomponente(COMPONENT_NAMES.QUERTRAEGER).gibAlleQuertraeger();

        return {
            pfosten: {
                anzahl: pfosten.length,
                einzelhoehe: pfosten[0]?.abmessungen?.hoehe || 0,
                gesamtlaenge: pfosten.reduce((sum, p) => sum + p.abmessungen.hoehe, 0),
                profil: "100x100mm Aluprofil"
            },
            laengstraeger: {
                anzahl: laengstraeger.length,
                einzellaenge: laengstraeger[0]?.abmessungen?.laenge || 0,
                gesamtlaenge: laengstraeger.reduce((sum, l) => sum + l.abmessungen.laenge, 0),
                profil: "160x80mm Aluprofil"
            },
            quertraeger: {
                anzahl: quertraeger.length,
                einzellaenge: quertraeger[0]?.abmessungen?.laenge || 0,
                gesamtlaenge: quertraeger.reduce((sum, q) => sum + q.abmessungen.laenge, 0),
                profil: "80x160mm Aluprofil"
            },
            konfiguration: konfig,
            statistiken: statistiken
        };
    }

    initEventSystem() {
        // Keyboard-Handler
        this._keydownHandler = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case "d":
                        e.preventDefault();
                        this.toggleDebugModus();
                        break;
                    case "r":
                        e.preventDefault();
                        this.neuErstellen();
                        break;
                }
            }
        };
        document.addEventListener("keydown", this._keydownHandler);

        // Resize-Handler
        this._resizeHandler = () => {
            if (this.renderEngine) {
                this.renderEngine.aufFensterGroesseAendern();
            }
        };
        window.addEventListener("resize", this._resizeHandler);

        this.registriereConsoleBefehle();
    }

    registriereConsoleBefehle() {
        // In ServiceRegistry registrieren statt window
        // Legacy-Kompatibilität bleibt vorerst erhalten

        window.PergolaKonfigurator = this;

        window.debugPergola = () => {
            const engine = getRenderEngine();
            if (engine && engine.gibPergola()) {
                engine.gibPergola().debugPergola();
            }
        };

        window.debugRenderEngine = () => {
            const engine = getRenderEngine();
            if (engine) {
                engine.debugRenderEngine();
            }
        };

        window.neuerstellen = () => {
            this.neuErstellen();
        };

        // Neue Debug-Befehle
        window.debugServices = () => {
            ServiceRegistry.debug();
        };

        window.debugEvents = () => {
            EventBus.debug();
        };

        logger.info("Console-Befehle: debugPergola(), debugRenderEngine(), neuerstellen(), debugServices(), debugEvents()");
    }

    neuErstellen() {
        if (this.renderEngine && this.renderEngine.gibPergola()) {
            logger.info("Erstelle Pergola neu...");
            this.renderEngine.gibPergola().erstellePergola();
        }
    }

    toggleDebugModus() {
        const neuerStatus = !StorageService.getBoolean(STORAGE_KEYS.DEBUG, false);
        StorageService.setBoolean(STORAGE_KEYS.DEBUG, neuerStatus);
        setDebugMode(neuerStatus);

        logger.info(`Debug-Modus ${neuerStatus ? "aktiviert" : "deaktiviert"}`);

        if (neuerStatus && this.renderEngine && this.renderEngine.gibPergola()) {
            this.renderEngine.gibPergola().debugPergola();
        }
    }

    istDebugModus() {
        // StorageService nutzen statt direktem localStorage-Zugriff
        if (StorageService.getBoolean(STORAGE_KEYS.DEBUG, false)) {
            return true;
        }

        // URL-Parameter prüfen
        const params = new URLSearchParams(window.location.search);
        return params.get(CONFIG.DEBUG_URL_PARAM) === "1";
    }

    debugKonfigurator() {
        logger.group("PERGOLA KONFIGURATOR DEBUG");
        logger.info("Initialisiert:", this.istInitialisiert);
        logger.info("Render-Engine:", !!this.renderEngine);
        logger.info("UI-Elemente:", this.uiElemente);

        if (this.renderEngine) {
            this.renderEngine.debugRenderEngine();
        }

        ServiceRegistry.debug();
        logger.groupEnd();
    }

    zeigeFehlermeldung(titel, nachricht) {
        logger.error(`${titel}: ${nachricht}`);

        const container = document.getElementById(DOM_SELECTORS.ERROR_CONTAINER);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>${titel}</h3>
                    <p>${nachricht}</p>
                </div>
            `;
            container.style.display = "block";
        }
    }

    dispose() {
        // Event-Listener entfernen
        if (this._keydownHandler) {
            document.removeEventListener("keydown", this._keydownHandler);
        }
        if (this._resizeHandler) {
            window.removeEventListener("resize", this._resizeHandler);
        }

        // RenderEngine disposen
        if (this.renderEngine) {
            this.renderEngine.dispose();
        }

        // Event emittieren
        EventBus.emit(EventTypes.APP_DISPOSED);

        // ServiceRegistry aufräumen
        ServiceRegistry.dispose();

        logger.info("Pergola Konfigurator beendet");
    }
}

/**
 * Ermittelt die Share-ID aus URL-Parametern oder Pfad
 */
function ermittleShareId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get(CONFIG.SHARE_URL_PARAM);

    if (fromQuery) return fromQuery;

    const pathMatch = window.location.pathname.match(/\/s\/([^/]+)\.json$/i);
    return pathMatch ? pathMatch[1] : null;
}

/**
 * Lädt eine geteilte Konfiguration
 */
async function ladeGeteilteKonfiguration(konfigurator) {
    const shareId = ermittleShareId();

    if (!shareId || !konfigurator?.uiController) return;

    const params = new URLSearchParams(window.location.search);
    const targetIntern = params.get(CONFIG.TARGET_URL_PARAM) === CONFIG.TARGET_INTERN ||
                         /\/intern\//.test(window.location.pathname);

    try {
        const baseDir = targetIntern ? "./intern/" : "./s/";
        const shareUrl = new URL(
            `${baseDir}${encodeURIComponent(shareId)}.json`,
            window.location.href
        ).toString();

        logger.info("Lade geteilte Konfiguration:", shareUrl);

        const response = await fetch(shareUrl, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Snapshot ${shareId} nicht gefunden (HTTP ${response.status})`);
        }

        const snapshot = await response.json();
        const cfg = snapshot?.originalConfig || snapshot?.details || snapshot?.config;

        if (!cfg) {
            logger.warn("Snapshot enthält keine rekonstruierbare Konfiguration");
            return;
        }

        konfigurator.uiController.ladeExterneKonfiguration(cfg);
        logger.info("Snapshot angewendet:", shareId);

        if (snapshot?.share?.viewUrl) {
            logger.info("Link:", snapshot.share.viewUrl);
        }
    } catch (err) {
        logger.warn("Geteilte Konfiguration konnte nicht geladen werden:", err);
    }
}

/**
 * Startet die Anwendung
 */
async function starteAnwendung() {
    try {
        logger.info("Starte Pergola Konfigurator...");

        const konfigurator = new PergolaKonfigurator();
        await konfigurator.initialisieren();

        // In ServiceRegistry registrieren
        registerKonfigurator(konfigurator);

        // Legacy-Kompatibilität
        window.konfigurator = konfigurator;

        await ladeGeteilteKonfiguration(konfigurator);

        logger.info("Anwendung erfolgreich gestartet");
        logger.info("Debug-Modus: Strg+D | Neu erstellen: Strg+R");
    } catch (e) {
        logger.error("Fehler beim Starten der Anwendung:", e);
    }
}

// Anwendung starten
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", starteAnwendung);
} else {
    starteAnwendung();
}

export { PergolaKonfigurator };
