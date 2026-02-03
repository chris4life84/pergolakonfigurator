/**
 * CameraController - Kamera-Steuerung für den Pergola-Konfigurator
 *
 * Verwaltet Kamera und OrbitControls:
 * - Kamera-Positionierung
 * - OrbitControls-Setup
 * - Responsive Anpassung (Mobile/Desktop)
 * - Standard-Ansicht basierend auf Szenen-Objekten
 *
 * Extrahiert aus RenderEngine.js für bessere Modularität
 */

import { Logger } from "../utils/Logger.js";
import { RENDER_CONFIG } from "../constants/index.js";

/**
 * Kamera-Konfiguration
 */
const CAMERA_CONFIG = {
    mobile: {
        fov: 88,
        position: [2.2, 0.8, 2.2],
        lookAt: [1.8, 1.8, 0.2]
    },
    desktop: {
        fov: 75,
        position: [1.35, 0.45, 1.35],
        lookAt: [1.8, 1.85, 0]
    },
    standardAnsicht: {
        mobileFov: 88,
        desktopFov: 70,
        offset: {
            x: 3.75,
            y: -5,
            zMobile: 2.5,
            zDesktop: -2.5
        },
        targetOffset: {
            x: 0.5,
            yFactor: -0.1
        }
    }
};

/**
 * OrbitControls-Konfiguration
 */
const CONTROLS_CONFIG = {
    enableDamping: true,
    dampingFactor: 0.12,
    minDistance: 3,
    maxDistance: 25,
    maxPolarAngle: Math.PI / 2.1,
    enablePan: true,
    panSpeed: 0.28,
    enableZoom: true,
    zoomSpeed: 0.48,
    rotateSpeed: 0.26,
    autoRotate: false,
    screenSpacePanning: true
};

/**
 * Klasse zur Verwaltung der Kamera und Steuerung
 */
export class CameraController {
    /**
     * @param {THREE.Camera} camera - Die Three.js Kamera
     * @param {HTMLCanvasElement} canvas - Das Canvas-Element
     */
    constructor(camera, canvas) {
        /** @type {THREE.Camera} */
        this.camera = camera;

        /** @type {HTMLCanvasElement} */
        this.canvas = canvas;

        /** @type {Logger} */
        this.logger = new Logger("CameraController");

        /** @type {THREE.OrbitControls} */
        this.controls = null;
    }

    // ========================================================================
    // INITIALISIERUNG
    // ========================================================================

    /**
     * Initialisiert die Kamera-Steuerung
     * @returns {THREE.OrbitControls|null}
     */
    initialisieren() {
        this.positioniereKamera();
        this.erstelleSteuerung();

        return this.controls;
    }

    /**
     * Positioniert die Kamera basierend auf Bildschirmgröße
     */
    positioniereKamera() {
        const isMobile = window.innerWidth <= 768;
        const config = isMobile ? CAMERA_CONFIG.mobile : CAMERA_CONFIG.desktop;

        this.camera.fov = config.fov;
        this.camera.position.set(...config.position);
        this.camera.lookAt(...config.lookAt);
        this.camera.updateProjectionMatrix();

        this.logger.debug(`Kamera positioniert (${isMobile ? 'Mobile' : 'Desktop'})`);
    }

    /**
     * Erstellt die OrbitControls
     */
    erstelleSteuerung() {
        if (!window.THREE?.OrbitControls) {
            this.logger.warn("OrbitControls nicht verfügbar - Kamera-Steuerung deaktiviert");
            return;
        }

        this.controls = new THREE.OrbitControls(this.camera, this.canvas);

        // Konfiguration anwenden
        Object.entries(CONTROLS_CONFIG).forEach(([key, value]) => {
            this.controls[key] = value;
        });

        // Mouse-Buttons
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };

        // Touch-Gesten
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        this.controls.update();
        this.logger.debug("OrbitControls erstellt");
    }

    // ========================================================================
    // ANSICHT-STEUERUNG
    // ========================================================================

    /**
     * Setzt die Kamera auf eine Standard-Ansicht basierend auf der Szene
     * @param {THREE.Object3D} sceneObject - Das Objekt für die Bounding-Box-Berechnung
     */
    setzeStandardAnsicht(sceneObject) {
        if (!sceneObject) return;

        // Bounding Box berechnen
        const boundingBox = new THREE.Box3().setFromObject(sceneObject);

        if (boundingBox.isEmpty()) return;

        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        boundingBox.getCenter(center);
        boundingBox.getSize(size);

        const isMobile = window.innerWidth <= 768;
        const config = CAMERA_CONFIG.standardAnsicht;

        // FOV setzen
        this.camera.fov = isMobile ? config.mobileFov : config.desktopFov;

        // Kamera-Position berechnen
        const offset = config.offset;
        const zOffset = isMobile ? offset.zMobile : offset.zDesktop;
        this.camera.position.set(
            center.x + offset.x,
            center.y + offset.y,
            center.z + zOffset
        );

        // Target berechnen
        const targetOffset = config.targetOffset;
        const target = new THREE.Vector3(
            center.x + targetOffset.x,
            center.y + targetOffset.yFactor * size.y,
            center.z
        );

        // Kamera ausrichten
        this.camera.lookAt(target);
        this.camera.updateProjectionMatrix();

        // Controls aktualisieren
        if (this.controls) {
            this.controls.target.copy(target);
            this.controls.update();
        }
    }

    /**
     * Setzt die Kamera auf eine bestimmte Position
     * @param {THREE.Vector3} position - Neue Kamera-Position
     * @param {THREE.Vector3} target - Neues Blickziel
     */
    setzePosition(position, target) {
        this.camera.position.copy(position);
        this.camera.lookAt(target);
        this.camera.updateProjectionMatrix();

        if (this.controls) {
            this.controls.target.copy(target);
            this.controls.update();
        }
    }

    /**
     * Aktualisiert das Seitenverhältnis
     * @param {number} aspectRatio - Neues Seitenverhältnis
     */
    aktualisiereAspectRatio(aspectRatio) {
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }

    // ========================================================================
    // GETTER
    // ========================================================================

    /**
     * Gibt das aktuelle Blickziel zurück
     * @returns {THREE.Vector3}
     */
    gibTarget() {
        return this.controls?.target || new THREE.Vector3();
    }

    /**
     * Gibt die aktuelle Kamera-Position zurück
     * @returns {THREE.Vector3}
     */
    gibPosition() {
        return this.camera.position.clone();
    }

    /**
     * Gibt die Distanz zum Target zurück
     * @returns {number}
     */
    gibDistanzZumTarget() {
        const target = this.gibTarget();
        return this.camera.position.distanceTo(target);
    }

    /**
     * Gibt die Controls zurück
     * @returns {THREE.OrbitControls}
     */
    gibControls() {
        return this.controls;
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    /**
     * Aktualisiert die Controls (im Animation-Loop aufrufen)
     */
    update() {
        if (this.controls) {
            this.controls.update();
        }
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Räumt die Ressourcen auf
     */
    dispose() {
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }

        this.logger.debug("CameraController aufgeräumt");
    }
}
