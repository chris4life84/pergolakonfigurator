/**
 * OutdoorMoebel-Komponente für den Pergola-Konfigurator
 *
 * Erstellt und verwaltet Outdoor-Dekoration (Pflanzen) um die Pergola.
 * Aktuell deaktiviert.
 *
 * Refactored: Erweitert Component3D für einheitliche API
 */

import { Component3D } from "../core/Component3D.js";
import { COMPONENT_NAMES } from "../constants/index.js";

/**
 * Pflanzen-Konfiguration
 */
const PFLANZEN_CONFIG = {
    anzahlBlaetter: 6,
    blattBreite: 0.25,
    blattHoehe: 0.35,
    abstandVomPfosten: 0.5,
    blattRadius: 0.15
};

/**
 * Textur-Konfiguration
 */
const TEXTUR_CONFIG = {
    basePath: "textures/deco/",
    resolution: "4k",
    pflanzenDatei: "anthurium_botany_01"
};

/**
 * Klasse zur Erstellung und Verwaltung von Outdoor-Dekoration
 * @extends Component3D
 */
export class OutdoorMoebel extends Component3D {
    /**
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     */
    constructor(koordinatenSystem, konfiguration) {
        super(COMPONENT_NAMES.OUTDOOR_MOEBEL, koordinatenSystem, konfiguration);

        /** @type {THREE.Group} */
        this.moebelGruppe = new THREE.Group();
        this.moebelGruppe.name = "OutdoorDekoration";

        // Gruppe der Basisklasse überschreiben
        this.gruppe = this.moebelGruppe;

        /** @type {Object<string, THREE.Material>} */
        this.materialien = {};

        /** @type {THREE.Object3D[]} */
        this.moebel = [];
    }

    // ========================================================================
    // HAUPTMETHODEN
    // ========================================================================

    /**
     * Erstellt alle Outdoor-Dekorationselemente
     * @returns {THREE.Group}
     */
    erstelleOutdoorMoebel() {
        this.logger.group("ERSTELLE OUTDOOR-DEKORATION (PFLANZEN)");

        try {
            this.entferneMoebel();

            const config = this.konfiguration.gibAktuelleKonfiguration();

            // Deaktiviert - keine Pflanzen anzeigen
            this.logger.info("Outdoor-Dekoration temporär deaktiviert");
            this.logger.groupEnd();
            return this.moebelGruppe;

            /*
            // Nur erstellen, wenn aktiviert
            if (!config.outdoorMoebel) {
                this.logger.info("Outdoor-Dekoration deaktiviert");
                this.logger.groupEnd();
                return this.moebelGruppe;
            }

            this.erstelleMaterialien();
            this.erstellePflanzen();

            this.logger.debug(`${this.moebel.length} Pflanzen erstellt`);
            */
        } catch (error) {
            this.logger.error("Fehler beim Erstellen der Outdoor-Dekoration:", error);
        }

        this.logger.groupEnd();
        return this.moebelGruppe;
    }

    // ========================================================================
    // MATERIAL-ERSTELLUNG
    // ========================================================================

    /**
     * Erstellt die Pflanzen-Materialien
     */
    erstelleMaterialien() {
        const textureLoader = new THREE.TextureLoader();
        const { basePath, resolution, pflanzenDatei } = TEXTUR_CONFIG;

        this.logger.debug("Lade Pflanzen-Texturen...");

        // Pflanzen-Material (Anthurium)
        this.materialien.pflanze = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xffffff),
            roughness: 0.7,
            metalness: 0.0,
            side: THREE.DoubleSide
        });

        // Pflanzen Diffuse Map
        const plantDiffuse = textureLoader.load(
            `${basePath}${pflanzenDatei}_diff_${resolution}.jpg`,
            () => this.logger.debug("Pflanzen Diffuse Map geladen"),
            undefined,
            () => this.logger.warn("Pflanzen Diffuse Map nicht gefunden")
        );
        plantDiffuse.colorSpace = THREE.SRGBColorSpace;
        this.materialien.pflanze.map = plantDiffuse;

        // Pflanzen Normal Map
        const plantNormal = textureLoader.load(
            `${basePath}${pflanzenDatei}_nor_gl_${resolution}.jpg`,
            () => {
                this.materialien.pflanze.needsUpdate = true;
            }
        );
        this.materialien.pflanze.normalMap = plantNormal;
        this.materialien.pflanze.normalScale = new THREE.Vector2(1.5, 1.5);

        // Pflanzen ARM Map (AO + Roughness + Metalness)
        const plantARM = textureLoader.load(
            `${basePath}${pflanzenDatei}_arm_${resolution}.jpg`,
            () => {
                this.materialien.pflanze.needsUpdate = true;
            }
        );
        this.materialien.pflanze.aoMap = plantARM;
        this.materialien.pflanze.roughnessMap = plantARM;
        this.materialien.pflanze.metalnessMap = plantARM;

        this.logger.debug("Pflanzen-Material erstellt (Anthurium)");
    }

    // ========================================================================
    // PFLANZEN-ERSTELLUNG
    // ========================================================================

    /**
     * Erstellt Pflanzen um die Pfosten herum
     */
    erstellePflanzen() {
        const config = this.konfiguration.gibAktuelleKonfiguration();

        // Hole Pfosten-Referenzpunkte für die Pergola-Ränder
        const pfostenReferenz = this.koordinatenSystem.gibReferenzpunkt("pfostenReferenz");

        if (!pfostenReferenz || pfostenReferenz.length === 0) {
            this.logger.warn("Keine Pfosten-Referenzen gefunden");
            return;
        }

        // Erstelle Pflanzen um jeden Pfosten herum (außerhalb der Pergola)
        pfostenReferenz.forEach((pfosten, index) => {
            this.erstellePflanzeAnPfosten(pfosten, index, config);
        });

        this.logger.debug(`${pfostenReferenz.length} Pflanzen um die Pergola herum erstellt`);
    }

    /**
     * Erstellt eine Pflanze an einem Pfosten
     * @param {object} pfosten - Pfosten-Position
     * @param {number} index - Pfosten-Index
     * @param {object} config - Konfiguration
     */
    erstellePflanzeAnPfosten(pfosten, index, config) {
        const pfostenX = pfosten.x || 0;
        const pfostenZ = pfosten.z || 0;

        // Platziere Pflanze außerhalb der Pergola
        const abstand = PFLANZEN_CONFIG.abstandVomPfosten;

        // Bestimme Richtung nach außen (vom Zentrum weg)
        const mittePosX = config.breite / 2;
        const mittePosZ = config.tiefe / 2;

        const richtungX = pfostenX - mittePosX;
        const richtungZ = pfostenZ - mittePosZ;
        const laenge = Math.sqrt(richtungX * richtungX + richtungZ * richtungZ);

        if (laenge > 0) {
            const normX = richtungX / laenge;
            const normZ = richtungZ / laenge;

            const pflanzeX = pfostenX + normX * abstand;
            const pflanzeZ = pfostenZ + normZ * abstand;

            const pflanze = this.erstellePflanze();
            pflanze.position.set(pflanzeX, 0, pflanzeZ);
            pflanze.name = `Pflanze_Pfosten_${index + 1}`;

            this.moebelGruppe.add(pflanze);
            this.moebel.push(pflanze);

            this.logger.debug(
                `Pflanze ${index + 1} bei Pfosten erstellt: x=${pflanzeX.toFixed(2)}, z=${pflanzeZ.toFixed(2)}`
            );
        }
    }

    /**
     * Erstellt eine einzelne Pflanze
     * @returns {THREE.Group}
     */
    erstellePflanze() {
        const pflanzenGruppe = new THREE.Group();

        const { anzahlBlaetter, blattBreite, blattHoehe, blattRadius } = PFLANZEN_CONFIG;

        for (let i = 0; i < anzahlBlaetter; i++) {
            const blatt = this.erstelleBlatt(i, anzahlBlaetter, blattBreite, blattHoehe, blattRadius);
            pflanzenGruppe.add(blatt);
        }

        return pflanzenGruppe;
    }

    /**
     * Erstellt ein einzelnes Blatt
     * @param {number} index - Blatt-Index
     * @param {number} anzahl - Gesamtanzahl Blätter
     * @param {number} breite - Blattbreite
     * @param {number} hoehe - Blatthöhe
     * @param {number} radius - Anordnungsradius
     * @returns {THREE.Mesh}
     */
    erstelleBlatt(index, anzahl, breite, hoehe, radius) {
        const winkel = (Math.PI * 2 / anzahl) * index + (Math.random() - 0.5) * 0.5;
        const neigung = 0.3 + Math.random() * 0.4;
        const blattHoehe = 0.3 + Math.random() * 0.15;

        // Blatt-Geometrie mit leichter Wölbung
        const blattGeo = new THREE.PlaneGeometry(breite, hoehe, 8, 8);
        this.wendeBlattWoelbungAn(blattGeo, breite, hoehe);

        const blatt = new THREE.Mesh(blattGeo, this.materialien.pflanze);

        // Positionierung
        const blattX = Math.cos(winkel) * radius;
        const blattZ = Math.sin(winkel) * radius;

        blatt.position.set(blattX, blattHoehe, blattZ);
        blatt.rotation.y = winkel + Math.PI / 2;
        blatt.rotation.x = -neigung;
        blatt.rotation.z = (Math.random() - 0.5) * 0.3;

        blatt.castShadow = true;
        blatt.receiveShadow = true;

        return blatt;
    }

    /**
     * Wendet eine leichte Wölbung auf die Blatt-Geometrie an
     * @param {THREE.PlaneGeometry} geometrie - Blatt-Geometrie
     * @param {number} breite - Blattbreite
     * @param {number} hoehe - Blatthöhe
     */
    wendeBlattWoelbungAn(geometrie, breite, hoehe) {
        const positions = geometrie.attributes.position;

        for (let j = 0; j < positions.count; j++) {
            const x = positions.getX(j);
            const y = positions.getY(j);
            const normX = x / (breite / 2);
            const normY = y / (hoehe / 2);

            const distFromCenter = Math.sqrt(normX * normX + normY * normY);
            const woelbung = Math.max(0, 1 - distFromCenter) * 0.03;
            positions.setZ(j, woelbung);
        }

        positions.needsUpdate = true;
        geometrie.computeVertexNormals();
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Entfernt alle Möbel/Dekorationselemente
     */
    entferneMoebel() {
        while (this.moebelGruppe.children.length > 0) {
            const child = this.moebelGruppe.children[0];

            this.moebelGruppe.remove(child);

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

        this.moebel = [];
    }

    // ========================================================================
    // GETTER / LEGACY API
    // ========================================================================

    /**
     * Gibt alle Möbel/Dekorationselemente zurück
     * @returns {THREE.Object3D[]}
     */
    gibAlleMoebel() {
        return [...this.moebel];
    }

    /**
     * Legacy: Gibt die 3D-Gruppe zurück
     * @deprecated Verwende getGroup() stattdessen
     * @returns {THREE.Group}
     */
    gib3DGruppe() {
        return this.moebelGruppe;
    }

    // ========================================================================
    // COMPONENT3D INTERFACE
    // ========================================================================

    /**
     * Erstellt die Komponente (Component3D Interface)
     * @returns {THREE.Group}
     */
    create() {
        return this.erstelleOutdoorMoebel();
    }

    /**
     * Gibt alle Elemente zurück (Component3D Interface)
     * @returns {THREE.Object3D[]}
     */
    getAll() {
        return this.gibAlleMoebel();
    }

    /**
     * Gibt die 3D-Gruppe zurück (Component3D Interface)
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.moebelGruppe;
    }

    /**
     * Cleanup (Component3D Interface)
     */
    dispose() {
        this.entferneMoebel();

        // Materialien aufräumen
        Object.values(this.materialien).forEach(material => {
            if (material.map) material.map.dispose();
            if (material.normalMap) material.normalMap.dispose();
            if (material.roughnessMap) material.roughnessMap.dispose();
            if (material.metalnessMap) material.metalnessMap.dispose();
            if (material.aoMap) material.aoMap.dispose();

            material.dispose();
        });

        this.materialien = {};
        super.dispose();
    }
}
