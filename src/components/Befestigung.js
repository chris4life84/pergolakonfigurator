/**
 * Befestigung-Komponente für den Pergola-Konfigurator
 *
 * Erstellt Befestigungselemente für die Pergola-Pfosten:
 * - Ankerplatten mit Schrauben
 * - Betonblöcke für Einbetonierung
 *
 * Refactored: Erweitert Component3D für einheitliche API
 */

import { Component3D } from "../core/Component3D.js";
import { normalizePfostenId } from "../utils/StringNormalizer.js";
import { COMPONENT_NAMES, COLOR_PALETTE } from "../constants/index.js";

/**
 * Befestigungs-Konfiguration
 */
const BEFESTIGUNGS_CONFIG = {
    ankerplatte: {
        breite: 0.25,
        hoehe: 0.02,
        tiefe: 0.25,
        offset: 0.05
    },
    betonblock: {
        breiteExtra: 0.05,
        hoehe: 1,
        tiefeExtra: 0.05,
        offset: -0.02
    },
    schraube: {
        radius: 0.005,
        hoehe: 0.008,
        positionen: [
            { x: -0.08, z: -0.08 },
            { x: 0.08, z: -0.08 },
            { x: -0.08, z: 0.08 },
            { x: 0.08, z: 0.08 }
        ]
    }
};

/**
 * Farbzuordnung für Pergola-Farben
 */
const PERGOLA_FARBEN = {
    ral7016: 0x383c3c,
    ral9016: 0xf7f6f6,
    ral6005: 0x2f4538,
    ral3004: 0x75161e,
    "ncs-s0500-n": 0xdfe0e1,
    "ncs-s2005-g": 0xaeb9b2,
    "ncs-s3020-b": 0x3a4a67,
    "ncs-s2050-y80r": 0xa4562b,
    "ncs-s3060-g10y": 0x2a6345,
    "ncs-s8500-n": 0x1a191a
};

/**
 * Klasse zur Erstellung und Verwaltung von Befestigungselementen
 * @extends Component3D
 */
export class Befestigung extends Component3D {
    /**
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     * @param {object} pfosten - Referenz zur Pfosten-Komponente
     */
    constructor(koordinatenSystem, konfiguration, pfosten) {
        super(COMPONENT_NAMES.BEFESTIGUNG, koordinatenSystem, konfiguration);

        /** @type {object} Referenz zur Pfosten-Komponente */
        this.pfosten = pfosten;

        /** @type {THREE.Group} */
        this.befestigungGruppe = new THREE.Group();
        this.befestigungGruppe.name = "Befestigung";

        // Gruppe der Basisklasse überschreiben
        this.gruppe = this.befestigungGruppe;

        /** @type {object} Befestigungs-Konfiguration */
        this.befestigungsKonfiguration = BEFESTIGUNGS_CONFIG;

        /** @type {Object<string, THREE.Material>} */
        this.materialien = {};

        /** @type {THREE.Mesh[]} */
        this.befestigungsElemente = [];
    }

    // ========================================================================
    // HILFSMETHODEN
    // ========================================================================

    /**
     * Normalisiert eine Pfosten-ID
     * @param {string} id - Pfosten-ID
     * @returns {string}
     */
    normalisierePfostenId(id) {
        return normalizePfostenId(id);
    }

    /**
     * Gibt die Pergola-Farbe als Hexwert zurück
     * @param {string} farbeName - Farbname
     * @returns {number}
     */
    gibPergolaFarbe(farbeName) {
        return PERGOLA_FARBEN[farbeName] || PERGOLA_FARBEN.ral7016;
    }

    /**
     * Berechnet die Kürzung für einen Pfosten
     * @param {string} pfostenName - Pfosten-Name
     * @param {object} config - Konfiguration
     * @param {object} position - Position des Pfostens
     * @returns {number}
     */
    berechneKuerzungFuerPfosten(pfostenName, config, position = null) {
        if (!config?.pfostenKuerzung) return 0;

        const normalizedId = this.normalisierePfostenId(pfostenName);
        const id = typeof normalizedId === "string" ? normalizedId : "";
        const individuell = config.pfostenKuerzung.individuell || {};

        // Prüfe individuelle Kürzung
        if (individuell[id] !== undefined) {
            return Number(individuell[id]) || 0;
        }
        if (pfostenName !== id && individuell[pfostenName] !== undefined) {
            return Number(individuell[pfostenName]) || 0;
        }

        // Gruppenkürzungen
        const vorneKuerzung = Number(config.pfostenKuerzung.vorne) || 0;
        const hintenKuerzung = Number(config.pfostenKuerzung.hinten) || 0;
        const mitteKuerzung = Number(config.pfostenKuerzung.mitte) || 0;

        // Nach Namen bestimmen
        if (id.includes("mitte") || id.includes("zwischen")) {
            return mitteKuerzung;
        }
        if (id.includes("vorne") || id.includes("front")) {
            return vorneKuerzung;
        }
        if (id.includes("hinten") || id.includes("rear")) {
            return hintenKuerzung;
        }

        // Nach Z-Position interpolieren
        const zPos = position?.z;
        const tiefe = parseFloat(String(config.tiefe ?? 0).toString().replace(",", ".")) || 0;

        if (typeof zPos === "number" && tiefe > 0) {
            const faktor = Math.min(Math.max(zPos / tiefe, 0), 1);
            return vorneKuerzung + (hintenKuerzung - vorneKuerzung) * faktor;
        }

        return mitteKuerzung;
    }

    // ========================================================================
    // MATERIAL-ERSTELLUNG
    // ========================================================================

    /**
     * Erstellt die benötigten Materialien
     * @param {object} config - Konfiguration
     */
    erstelleMaterialien(config) {
        const farbe = this.gibPergolaFarbe(config.farbe);

        this.materialien.ankerplatte = new THREE.MeshStandardMaterial({
            color: new THREE.Color(farbe),
            roughness: 0.4,
            metalness: 0.3,
            envMapIntensity: 0.6
        });

        this.materialien.beton = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#555555"),
            roughness: 0.8,
            metalness: 0.03,
            envMapIntensity: 0.25
        });

        this.materialien.schraube = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x2c2c2c),
            roughness: 0.4,
            metalness: 0.3
        });

        // Schatten für alle Materialien aktivieren
        Object.values(this.materialien).forEach(mat => {
            mat.receiveShadow = true;
            mat.castShadow = true;
        });
    }

    // ========================================================================
    // HAUPTMETHODEN
    // ========================================================================

    /**
     * Erstellt alle Befestigungselemente
     * @returns {THREE.Group}
     */
    erstelleBefestigung() {
        this.logger.group("ERSTELLE BEFESTIGUNG");
        this.logger.debug("Befestigung wird erstellt...");

        try {
            this.entferneBefestigung();

            const config = this.konfiguration.gibAktuelleKonfiguration();
            this.logger.debug("Befestigungs-Konfiguration:", config.befestigung);

            this.erstelleMaterialien(config);

            const allePfosten = this.pfosten.gibAllePfosten();
            this.logger.debug("Gefundene Pfosten:", allePfosten.length);

            if (allePfosten.length === 0) {
                this.logger.warn("Keine Pfosten gefunden - keine Befestigung erstellt");
                return this.befestigungGruppe;
            }

            allePfosten.forEach((pfosten, index) => {
                this.logger.debug(`Pfosten ${index + 1}:`, {
                    position: pfosten.position,
                    abmessungen: pfosten.abmessungen,
                    name: pfosten.name
                });
            });

            if (config.befestigung === "ankerplatte") {
                this.logger.debug("Erstelle Ankerplatten...");
                this.erstelleAnkerplatten(allePfosten);
            } else if (config.befestigung === "einbetonieren") {
                this.logger.debug("Erstelle Betonblöcke...");
                this.erstelleBetonbloecke(allePfosten, config);
            }

            this.logger.debug(`${this.befestigungsElemente.length} Befestigungselemente erstellt (${config.befestigung})`);
        } catch (error) {
            this.logger.error("Fehler beim Erstellen der Befestigung:", error);
        }

        this.logger.groupEnd();
        return this.befestigungGruppe;
    }

    // ========================================================================
    // ANKERPLATTEN
    // ========================================================================

    /**
     * Erstellt Ankerplatten für alle Pfosten
     * @param {Array} pfosten - Liste der Pfosten
     */
    erstelleAnkerplatten(pfosten) {
        const plattenConfig = this.befestigungsKonfiguration.ankerplatte;

        this.logger.debug(`erstelleAnkerplatten() aufgerufen mit ${pfosten.length} Pfosten`);
        this.logger.debug(`Aktuelle befestigungGruppe.children.length = ${this.befestigungGruppe.children.length}`);

        pfosten.forEach((p, index) => {
            const bodenOriginal = p.positionen?.boden;
            const bodenAngepasst = p.positionen?.angepassteBoden;

            if (!bodenAngepasst && !bodenOriginal) {
                this.logger.warn(`Pfosten ${index + 1} hat keine Position - überspringe Ankerplatte`);
                return;
            }

            const name = p.name || `pfosten_${index + 1}`;
            this.logger.debug(`Erstelle Ankerplatte für Pfosten ${name}`, {
                bodenOriginal,
                bodenAngepasst
            });

            // Geometrie und Mesh erstellen
            const geometrie = new THREE.BoxGeometry(
                plattenConfig.breite,
                plattenConfig.hoehe,
                plattenConfig.tiefe
            );
            const mesh = new THREE.Mesh(geometrie, this.materialien.ankerplatte);

            const pos = bodenAngepasst || bodenOriginal;
            const yPos = pos.y - 0.01;
            mesh.position.set(pos.x, yPos, pos.z);
            mesh.name = `Ankerplatte_${name}`;

            this.befestigungGruppe.add(mesh);
            this.befestigungsElemente.push(mesh);

            this.logger.debug(`Ankerplatte ${mesh.name} erstellt an Y-Position:`, mesh.position.y, `(PfostenY: ${pos.y})`);

            // Schrauben hinzufügen
            this.erstelleBefestigungsschrauben(mesh, pos);
        });
    }

    /**
     * Erstellt Befestigungsschrauben für eine Ankerplatte
     * @param {THREE.Mesh} platte - Ankerplatte
     * @param {object} position - Position
     */
    erstelleBefestigungsschrauben(platte, position) {
        const schraubenConfig = this.befestigungsKonfiguration.schraube;
        const geometrie = new THREE.CylinderGeometry(
            schraubenConfig.radius,
            schraubenConfig.radius,
            schraubenConfig.hoehe,
            8
        );

        schraubenConfig.positionen.forEach((offset, index) => {
            const mesh = new THREE.Mesh(geometrie, this.materialien.schraube);
            const yPos = platte.position.y + 0.01 + schraubenConfig.hoehe / 2;

            mesh.position.set(
                position.x + offset.x,
                yPos,
                position.z + offset.z
            );
            mesh.name = `Schraube_${platte.name}_${index + 1}`;

            this.befestigungGruppe.add(mesh);
            this.befestigungsElemente.push(mesh);

            this.logger.debug(`Schraube ${mesh.name} erstellt an Position:`, mesh.position);
        });
    }

    // ========================================================================
    // BETONBLÖCKE
    // ========================================================================

    /**
     * Erstellt Betonblöcke für alle Pfosten
     * @param {Array} pfosten - Liste der Pfosten
     * @param {object} config - Konfiguration
     */
    erstelleBetonbloecke(pfosten, config) {
        const betonConfig = this.befestigungsKonfiguration.betonblock;

        pfosten.forEach((p, index) => {
            const position = p.positionen?.boden || p.positionen?.mittelpunkt;
            const abmessungen = p.abmessungen;

            if (!position || !abmessungen) {
                this.logger.warn(`Pfosten ${index + 1} hat keine Position/Abmessungen - überspringe Betonblock`);
                return;
            }

            this.logger.debug(`Erstelle Betonblock für Pfosten ${index + 1}:`, {
                position,
                abmessungen
            });

            // Dimensionen
            const breite = abmessungen.breite + 2 * betonConfig.breiteExtra;
            const tiefe = abmessungen.tiefe + 2 * betonConfig.tiefeExtra;

            // Geometrie und Mesh
            const geometrie = new THREE.BoxGeometry(breite, betonConfig.hoehe, tiefe);
            const mesh = new THREE.Mesh(geometrie, this.materialien.beton);

            mesh.position.set(
                position.x,
                betonConfig.offset - betonConfig.hoehe / 2,
                position.z
            );
            mesh.name = `Betonblock_${index + 1}`;

            this.befestigungGruppe.add(mesh);
            this.befestigungsElemente.push(mesh);

            this.logger.debug(`Betonblock ${mesh.name} erstellt:`, {
                position: mesh.position,
                dimensionen: { breite, hoehe: betonConfig.hoehe, tiefe }
            });
        });
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Entfernt alle Befestigungselemente
     */
    entferneBefestigung() {
        this.logger.debug(`entferneBefestigung() aufgerufen - ${this.befestigungGruppe.children.length} Children zu löschen`);

        while (this.befestigungGruppe.children.length > 0) {
            const child = this.befestigungGruppe.children[0];
            this.logger.debug(`Lösche Child: ${child.name}`);

            this.befestigungGruppe.remove(child);

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
        }

        this.befestigungsElemente = [];
        this.logger.debug("entferneBefestigung() abgeschlossen");
    }

    // ========================================================================
    // GETTER / LEGACY API
    // ========================================================================

    /**
     * Gibt alle Befestigungselemente zurück
     * @returns {THREE.Mesh[]}
     */
    gibAlleBefestigungsElemente() {
        return [...this.befestigungsElemente];
    }

    /**
     * Legacy: Gibt die 3D-Gruppe zurück
     * @deprecated Verwende getGroup() stattdessen
     * @returns {THREE.Group}
     */
    gib3DGruppe() {
        return this.befestigungGruppe;
    }

    // ========================================================================
    // COMPONENT3D INTERFACE
    // ========================================================================

    /**
     * Erstellt die Komponente (Component3D Interface)
     * @returns {THREE.Group}
     */
    create() {
        return this.erstelleBefestigung();
    }

    /**
     * Gibt alle Elemente zurück (Component3D Interface)
     * @returns {THREE.Mesh[]}
     */
    getAll() {
        return this.gibAlleBefestigungsElemente();
    }

    /**
     * Gibt die 3D-Gruppe zurück (Component3D Interface)
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.befestigungGruppe;
    }

    // ========================================================================
    // DEBUG
    // ========================================================================

    /**
     * Debug-Ausgabe für Befestigung
     */
    debugBefestigung() {
        this.logger.group("BEFESTIGUNG DEBUG");
        this.logger.info("Anzahl Elemente:", this.befestigungsElemente.length);
        this.logger.info("Materialien:", Object.keys(this.materialien));
        this.logger.info("Konfiguration:", this.befestigungsKonfiguration);
        this.logger.groupEnd();
    }

    /**
     * Cleanup (Component3D Interface)
     */
    dispose() {
        this.entferneBefestigung();

        Object.values(this.materialien).forEach(mat => {
            mat.dispose();
        });

        this.materialien = {};
        super.dispose();
    }
}
