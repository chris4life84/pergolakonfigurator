/**
 * Kopfbänder-Komponente für den Pergola-Konfigurator
 *
 * Erstellt diagonale Verstärkungsbänder zwischen Pfosten und Trägern
 * zur zusätzlichen Stabilisierung der Pergola-Struktur.
 *
 * Refactored: Erweitert Component3D für einheitliche API
 */

import { Component3D } from "../core/Component3D.js";
import { ProfileKonfiguration } from "../config/ProfileKonfiguration.js";
import { MaterialManager } from "../core/MaterialManager.js";
import { COMPONENT_NAMES } from "../constants/index.js";

/**
 * Profil-Zuordnung für Kopfbänder basierend auf Pfostenprofil
 * @type {Object<string, string>}
 */
const KOPFBAND_PROFILE = {
    "200x120x4": "160x80x4",
    "200x100x4": "120x80x4",
    "160x80x4": "120x80x4",
    "120x80x4": "100x60x3"
};

/**
 * Standard-Kopfbandprofil wenn kein passendes gefunden wird
 * @type {string}
 */
const DEFAULT_KOPFBAND_PROFIL = "120x80x4";

/**
 * Kopfband-Konstanten
 */
const KOPFBAND_CONFIG = {
    /** Horizontale Länge des Kopfbands */
    LAENGE: 0.8,
    /** Vertikale Absenkung zum Träger */
    HOEHEN_OFFSET: 0.4,
    /** Mindestlänge für gültige Kopfbänder */
    MIN_LAENGE: 0.1
};

/**
 * Klasse zur Erstellung und Verwaltung von Kopfbändern
 * @extends Component3D
 */
export class Kopfbaender extends Component3D {
    /**
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     */
    constructor(koordinatenSystem, konfiguration) {
        super(COMPONENT_NAMES.KOPFBAENDER, koordinatenSystem, konfiguration);

        /** @type {ProfileKonfiguration} */
        this.profileKonfig = new ProfileKonfiguration();

        /** @type {THREE.Group} */
        this.kopfbaenderGruppe = new THREE.Group();
        this.kopfbaenderGruppe.name = "Kopfbänder";

        // Gruppe der Basisklasse überschreiben
        this.gruppe = this.kopfbaenderGruppe;
    }

    // ========================================================================
    // HAUPTMETHODEN
    // ========================================================================

    /**
     * Erstellt alle Kopfbänder basierend auf Konfiguration
     * @returns {THREE.Group}
     */
    erstelleKopfbaender() {
        this.entferneKopfbaender();

        const config = this.konfiguration.gibAktuelleKonfiguration();

        // Nur erstellen wenn aktiviert
        if (!config.kopfbaenderAktiv) {
            return this.kopfbaenderGruppe;
        }

        this.logger.debug("Erstelle Kopfbänder...");

        try {
            const pfostenPositionen = this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen");

            if (!pfostenPositionen) {
                this.logger.warn("Keine Pfosten-Positionen verfügbar für Kopfbänder");
                return this.kopfbaenderGruppe;
            }

            const profil = this.bestimmeKopfbandProfil(config);
            const position = config.kopfbaenderPosition || "ecken";

            switch (position) {
                case "ecken":
                    this.erstelleEckKopfbaender(pfostenPositionen, config, profil);
                    break;
                case "alle":
                    this.erstelleAlleKopfbaender(pfostenPositionen, config, profil);
                    break;
                case "vorne":
                    this.erstelleVordereKopfbaender(pfostenPositionen, config, profil);
                    break;
                case "hinten":
                    this.erstelleHintereKopfbaender(pfostenPositionen, config, profil);
                    break;
            }

            this.logger.debug(`${this.kopfbaenderGruppe.children.length} Kopfbänder erstellt`);
        } catch (error) {
            this.logger.error("Fehler beim Erstellen der Kopfbänder:", error);
            this.logger.warn("Kopfbänder werden übersprungen, Pergola wird ohne Kopfbänder erstellt");
        }

        return this.kopfbaenderGruppe;
    }

    // ========================================================================
    // KOPFBAND-ERSTELLUNG NACH POSITION
    // ========================================================================

    /**
     * Erstellt Kopfbänder an den Ecken
     * @param {object} positionen - Pfosten-Positionen
     * @param {object} config - Konfiguration
     * @param {object} profil - Kopfbandprofil
     */
    erstelleEckKopfbaender(positionen, config, profil) {
        this.logger.debug("Erstelle Eck-Kopfbänder...");
        this.logger.debug("Verfügbare Pfosten-Positionen:", Object.keys(positionen));

        const ecken = [
            { pfosten: positionen.vorne_links, richtung: "vorne_links" },
            { pfosten: positionen.vorne_rechts, richtung: "vorne_rechts" },
            { pfosten: positionen.hinten_links, richtung: "hinten_links" },
            { pfosten: positionen.hinten_rechts, richtung: "hinten_rechts" }
        ];

        ecken.forEach(ecke => {
            if (ecke.pfosten) {
                this.logger.debug(`Verarbeite Ecke: ${ecke.richtung}`, ecke.pfosten);
                this.erstelleEinzelnesKopfband(ecke.pfosten, ecke.richtung, config, profil);
            } else {
                this.logger.warn(`Keine Position für ${ecke.richtung}`);
            }
        });
    }

    /**
     * Erstellt alle Kopfbänder (Ecken + Mitte)
     * @param {object} positionen - Pfosten-Positionen
     * @param {object} config - Konfiguration
     * @param {object} profil - Kopfbandprofil
     */
    erstelleAlleKopfbaender(positionen, config, profil) {
        this.erstelleEckKopfbaender(positionen, config, profil);

        // Mittelpfosten nur wenn aktiv
        if (positionen.mitte && config.mittelpfostenAktiv) {
            this.erstelleEinzelnesKopfband(positionen.mitte, "mitte", config, profil);
        }
    }

    /**
     * Erstellt nur vordere Kopfbänder
     * @param {object} positionen - Pfosten-Positionen
     * @param {object} config - Konfiguration
     * @param {object} profil - Kopfbandprofil
     */
    erstelleVordereKopfbaender(positionen, config, profil) {
        if (positionen.vorne_links) {
            this.erstelleEinzelnesKopfband(positionen.vorne_links, "vorne_links", config, profil);
        }
        if (positionen.vorne_rechts) {
            this.erstelleEinzelnesKopfband(positionen.vorne_rechts, "vorne_rechts", config, profil);
        }
    }

    /**
     * Erstellt nur hintere Kopfbänder
     * @param {object} positionen - Pfosten-Positionen
     * @param {object} config - Konfiguration
     * @param {object} profil - Kopfbandprofil
     */
    erstelleHintereKopfbaender(positionen, config, profil) {
        if (positionen.hinten_links) {
            this.erstelleEinzelnesKopfband(positionen.hinten_links, "hinten_links", config, profil);
        }
        if (positionen.hinten_rechts) {
            this.erstelleEinzelnesKopfband(positionen.hinten_rechts, "hinten_rechts", config, profil);
        }
    }

    // ========================================================================
    // EINZELNES KOPFBAND
    // ========================================================================

    /**
     * Erstellt ein einzelnes Kopfband
     * @param {object} pfostenPos - Pfosten-Position
     * @param {string} richtung - Richtungsbezeichnung
     * @param {object} config - Konfiguration
     * @param {object} profil - Kopfbandprofil
     */
    erstelleEinzelnesKopfband(pfostenPos, richtung, config, profil) {
        try {
            if (!pfostenPos) {
                this.logger.warn(`Keine Pfosten-Position für ${richtung}`);
                return;
            }

            // Profil-Abmessungen
            const breite = profil?.abmessungen?.breite || 0.08;
            const hoehe = profil?.abmessungen?.hoehe || 0.04;

            // Startpunkt am Pfosten ermitteln
            const oberkante = pfostenPos.oberkante || pfostenPos;
            const boden = pfostenPos.boden || pfostenPos;

            const startY = oberkante.y || pfostenPos.hoehe || pfostenPos.y || config.gesamthoehe || 2.5;
            const startX = boden.x || pfostenPos.x || 0;
            const startZ = boden.z || pfostenPos.z || 0;

            this.logger.debug(
                `Erstelle Kopfband ${richtung}: Start bei Pfosten ` +
                `(${startX.toFixed(2)}, ${startY.toFixed(2)}, ${startZ.toFixed(2)})`
            );

            // Endpunkt berechnen basierend auf Richtung
            let endX = startX;
            let endZ = startZ;
            let endY = startY;

            // Horizontale Verschiebung
            if (richtung.includes("links")) {
                endX += KOPFBAND_CONFIG.LAENGE;
            } else if (richtung.includes("rechts")) {
                endX -= KOPFBAND_CONFIG.LAENGE;
            }

            // Tiefenverschiebung
            if (richtung.includes("vorne")) {
                endZ += KOPFBAND_CONFIG.LAENGE;
            } else if (richtung.includes("hinten")) {
                endZ -= KOPFBAND_CONFIG.LAENGE;
            }

            // Vertikale Verschiebung
            endY = startY - KOPFBAND_CONFIG.HOEHEN_OFFSET;

            this.logger.debug(
                `Ende bei Träger (${endX.toFixed(2)}, ${endY.toFixed(2)}, ${endZ.toFixed(2)})`
            );

            // Richtungsvektor und Länge berechnen
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaZ = endZ - startZ;
            const laenge = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

            // Prüfen ob Kopfband lang genug ist
            if (laenge < KOPFBAND_CONFIG.MIN_LAENGE) {
                this.logger.warn(`Kopfband ${richtung} zu kurz (${laenge.toFixed(2)}m)`);
                return;
            }

            // Geometrie erstellen
            const geometrie = new THREE.BoxGeometry(breite, hoehe, laenge);

            // Material erstellen
            const material = MaterialManager.gibStrukturMaterial({
                teil: "kopfband",
                config
            });

            // Mesh erstellen
            const mesh = new THREE.Mesh(geometrie, material);

            // Positionieren (Mittelpunkt)
            mesh.position.set(
                (startX + endX) / 2,
                (startY + endY) / 2,
                (startZ + endZ) / 2
            );

            // Rotation berechnen
            const direction = new THREE.Vector3(deltaX, deltaY, deltaZ).normalize();
            const defaultDir = new THREE.Vector3(0, 0, 1);
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(defaultDir, direction);
            mesh.quaternion.copy(quaternion);

            mesh.name = `Kopfband_${richtung}`;
            this.kopfbaenderGruppe.add(mesh);

            // Debug: Winkel berechnen
            const winkel = Math.abs(
                (180 * Math.atan2(deltaY, Math.sqrt(deltaX * deltaX + deltaZ * deltaZ))) / Math.PI
            );
            this.logger.debug(
                `Kopfband ${richtung} erstellt (Länge: ${laenge.toFixed(2)}m, Winkel: ${winkel.toFixed(1)}°)`
            );
        } catch (error) {
            this.logger.error(`Fehler beim Erstellen von Kopfband ${richtung}:`, error);
        }
    }

    // ========================================================================
    // PROFIL-BESTIMMUNG
    // ========================================================================

    /**
     * Bestimmt das passende Kopfbandprofil basierend auf Pfostenprofil
     * @param {object} config - Konfiguration
     * @returns {object} - Kopfbandprofil
     */
    bestimmeKopfbandProfil(config) {
        const pfostenProfil = config.pfostenProfil || "160x80x4";
        const kopfbandProfilId = KOPFBAND_PROFILE[pfostenProfil] || DEFAULT_KOPFBAND_PROFIL;

        return this.profileKonfig.gibProfil(kopfbandProfilId) ||
               this.profileKonfig.gibAktuellesProfil();
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Entfernt alle Kopfbänder
     */
    entferneKopfbaender() {
        while (this.kopfbaenderGruppe.children.length > 0) {
            const child = this.kopfbaenderGruppe.children[0];

            if (child.geometry) {
                child.geometry.dispose();
            }

            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }

            this.kopfbaenderGruppe.remove(child);
        }
    }

    // ========================================================================
    // COMPONENT3D INTERFACE
    // ========================================================================

    /**
     * Erstellt die Komponente (Component3D Interface)
     * @returns {THREE.Group}
     */
    create() {
        return this.erstelleKopfbaender();
    }

    /**
     * Gibt alle Elemente zurück (Component3D Interface)
     * @returns {THREE.Object3D[]}
     */
    getAll() {
        return [...this.kopfbaenderGruppe.children];
    }

    /**
     * Gibt die 3D-Gruppe zurück (Component3D Interface)
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.kopfbaenderGruppe;
    }

    /**
     * Legacy: Gibt die 3D-Gruppe zurück
     * @deprecated Verwende getGroup() stattdessen
     * @returns {THREE.Group}
     */
    gib3DGruppe() {
        return this.kopfbaenderGruppe;
    }

    /**
     * Cleanup (Component3D Interface)
     */
    dispose() {
        this.entferneKopfbaender();
        super.dispose();
    }

    // ========================================================================
    // STATISCHE METHODEN
    // ========================================================================

    /**
     * Gibt den statischen Verbesserungsfaktor zurück
     * @returns {number}
     */
    static gibVerbesserungsFaktor() {
        return 1.3;
    }
}
