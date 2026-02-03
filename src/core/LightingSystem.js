/**
 * LightingSystem - Beleuchtungssystem für den Pergola-Konfigurator
 *
 * Verwaltet die gesamte Beleuchtung der 3D-Szene:
 * - Ambient Light
 * - Directional Lights (Hauptlicht, Fülllichter)
 * - Shadow-Konfiguration
 * - Fill Light für Kamera-Follow
 *
 * Extrahiert aus RenderEngine.js für bessere Modularität
 */

import { Logger } from "../utils/Logger.js";
import { RENDER_CONFIG } from "../constants/index.js";

/**
 * Beleuchtungs-Konfiguration
 */
const LIGHTING_CONFIG = {
    ambient: {
        color: 0xffffff,
        intensity: 0.4
    },
    main: {
        color: 0xffffff,
        intensity: 0.8,
        position: [25, 25, 55],
        shadow: {
            mapSize: 4096,
            near: 1,
            far: 80,
            bounds: { left: -15, right: 15, top: 15, bottom: -15 },
            bias: -0.0008,
            normalBias: 0.01,
            radius: 1
        }
    },
    fill: [
        { position: [-25, 12, 0], intensity: 0.8 },
        { position: [0, 8, 25], intensity: 0.6 },
        { position: [0, 8, -25], intensity: 0.5 }
    ],
    cameraFill: {
        intensity: 0.4,
        position: [2, 2, 2]
    }
};

/**
 * Klasse zur Verwaltung der Szenen-Beleuchtung
 */
export class LightingSystem {
    /**
     * @param {THREE.Scene} scene - Die Three.js Szene
     */
    constructor(scene) {
        /** @type {THREE.Scene} */
        this.scene = scene;

        /** @type {Logger} */
        this.logger = new Logger("LightingSystem");

        /** @type {THREE.Group} */
        this.beleuchtungGruppe = new THREE.Group();
        this.beleuchtungGruppe.name = "Beleuchtung";

        /** @type {THREE.AmbientLight} */
        this.ambientLight = null;

        /** @type {THREE.DirectionalLight} */
        this.mainLight = null;

        /** @type {THREE.DirectionalLight[]} */
        this.fillLights = [];

        /** @type {THREE.DirectionalLight} */
        this.cameraFillLight = null;
    }

    // ========================================================================
    // HAUPTMETHODEN
    // ========================================================================

    /**
     * Erstellt die komplette Beleuchtung
     * @returns {THREE.Group}
     */
    erstelleBeleuchtung() {
        this.logger.debug("Erstelle Beleuchtung...");

        // Ambient Light
        this.erstelleAmbientLight();

        // Hauptlicht mit Schatten
        this.erstelleHauptlicht();

        // Fülllichter
        this.erstelleFuelllichter();

        // Kamera-Follow-Licht
        this.erstelleCameraFillLight();

        // Zur Szene hinzufügen
        this.scene.add(this.beleuchtungGruppe);

        this.logger.debug("Professionelle Beleuchtung mit verbesserten Schatten aktiviert");

        return this.beleuchtungGruppe;
    }

    // ========================================================================
    // LICHT-ERSTELLUNG
    // ========================================================================

    /**
     * Erstellt das Ambient Light
     */
    erstelleAmbientLight() {
        const config = LIGHTING_CONFIG.ambient;

        this.ambientLight = new THREE.AmbientLight(config.color, config.intensity);
        this.beleuchtungGruppe.add(this.ambientLight);
    }

    /**
     * Erstellt das Hauptlicht mit Schatten
     */
    erstelleHauptlicht() {
        const config = LIGHTING_CONFIG.main;

        this.mainLight = new THREE.DirectionalLight(config.color, config.intensity);
        this.mainLight.position.set(...config.position);
        this.mainLight.castShadow = true;

        // Shadow-Konfiguration
        const shadow = config.shadow;
        this.mainLight.shadow.mapSize.width = shadow.mapSize;
        this.mainLight.shadow.mapSize.height = shadow.mapSize;
        this.mainLight.shadow.camera.near = shadow.near;
        this.mainLight.shadow.camera.far = shadow.far;
        this.mainLight.shadow.camera.left = shadow.bounds.left;
        this.mainLight.shadow.camera.right = shadow.bounds.right;
        this.mainLight.shadow.camera.top = shadow.bounds.top;
        this.mainLight.shadow.camera.bottom = shadow.bounds.bottom;
        this.mainLight.shadow.bias = shadow.bias;
        this.mainLight.shadow.normalBias = shadow.normalBias;
        this.mainLight.shadow.radius = shadow.radius;

        this.beleuchtungGruppe.add(this.mainLight);
    }

    /**
     * Erstellt die Fülllichter
     */
    erstelleFuelllichter() {
        LIGHTING_CONFIG.fill.forEach((config, index) => {
            const light = new THREE.DirectionalLight(0xffffff, config.intensity);
            light.position.set(...config.position);
            light.name = `FillLight_${index + 1}`;

            this.fillLights.push(light);
            this.beleuchtungGruppe.add(light);
        });
    }

    /**
     * Erstellt das Kamera-Follow-Licht
     */
    erstelleCameraFillLight() {
        const config = LIGHTING_CONFIG.cameraFill;

        this.cameraFillLight = new THREE.DirectionalLight(0xffffff, config.intensity);
        this.cameraFillLight.position.set(...config.position);
        this.cameraFillLight.castShadow = false;
        this.cameraFillLight.target.position.set(0, 0, 0);
        this.cameraFillLight.name = "CameraFillLight";

        this.beleuchtungGruppe.add(this.cameraFillLight);
    }

    // ========================================================================
    // UPDATES
    // ========================================================================

    /**
     * Aktualisiert das Fill-Light basierend auf der Kamera-Position
     * @param {THREE.Vector3} cameraPosition - Kamera-Position
     * @param {THREE.Vector3} target - Blickziel
     */
    aktualisiereCameraFillLight(cameraPosition, target) {
        if (!this.cameraFillLight) return;

        // Positioniere Fill-Light relativ zur Kamera
        this.cameraFillLight.position.copy(cameraPosition);
        this.cameraFillLight.position.add(new THREE.Vector3(0.4, 0.8, 0.4));

        // Ziel setzen
        if (this.cameraFillLight.target && this.cameraFillLight.target.position) {
            this.cameraFillLight.target.position.copy(target);
        }
    }

    /**
     * Setzt die Intensität des Ambient Lights
     * @param {number} intensity - Neue Intensität
     */
    setzeAmbientIntensitaet(intensity) {
        if (this.ambientLight) {
            this.ambientLight.intensity = intensity;
        }
    }

    /**
     * Setzt die Intensität des Hauptlichts
     * @param {number} intensity - Neue Intensität
     */
    setzeHauptlichtIntensitaet(intensity) {
        if (this.mainLight) {
            this.mainLight.intensity = intensity;
        }
    }

    // ========================================================================
    // GETTER
    // ========================================================================

    /**
     * Gibt das Kamera-Fill-Light zurück
     * @returns {THREE.DirectionalLight}
     */
    gibCameraFillLight() {
        return this.cameraFillLight;
    }

    /**
     * Gibt die Beleuchtungsgruppe zurück
     * @returns {THREE.Group}
     */
    gibGruppe() {
        return this.beleuchtungGruppe;
    }

    /**
     * Gibt das Hauptlicht zurück
     * @returns {THREE.DirectionalLight}
     */
    gibHauptlicht() {
        return this.mainLight;
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Räumt alle Lichter auf
     */
    dispose() {
        // Lichter aus Gruppe entfernen
        while (this.beleuchtungGruppe.children.length > 0) {
            const light = this.beleuchtungGruppe.children[0];
            this.beleuchtungGruppe.remove(light);

            if (light.dispose) {
                light.dispose();
            }
        }

        // Gruppe aus Szene entfernen
        if (this.scene) {
            this.scene.remove(this.beleuchtungGruppe);
        }

        this.ambientLight = null;
        this.mainLight = null;
        this.fillLights = [];
        this.cameraFillLight = null;

        this.logger.debug("LightingSystem aufgeräumt");
    }
}
