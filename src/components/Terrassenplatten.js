/**
 * Terrassenplatten-Komponente für den Pergola-Konfigurator
 *
 * Erstellt und verwaltet die Terrassenplatten unter der Pergola.
 *
 * Refactored: Erweitert Component3D für einheitliche API
 */

import { Component3D } from "../core/Component3D.js";
import { COMPONENT_NAMES } from "../constants/index.js";

/**
 * Terrassenplatten-Konfiguration
 */
const PLATTEN_CONFIG = {
    groesse: 0.6,
    dicke: 0.04,
    fugenhoehe: 0.003,
    erweiterungsFaktor: 1.5,
    versatz: 0.1
};

/**
 * Farbkonfiguration für Platten
 */
const PLATTEN_FARBEN = {
    hauptPlatte: "#4a4a4a",     // Sattes Dunkelgrau
    platteEmissive: "#2a2a2a",  // Sehr dunkles Emissive
    randstein: "#3f3f3f",       // Noch dunkler
    randsteinEmissive: "#222222"
};

/**
 * Klasse zur Erstellung und Verwaltung von Terrassenplatten
 * @extends Component3D
 */
export class Terrassenplatten extends Component3D {
    /**
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     */
    constructor(koordinatenSystem, konfiguration) {
        super(COMPONENT_NAMES.TERRASSENPLATTEN, koordinatenSystem, konfiguration);

        /** @type {THREE.Group} */
        this.terrassenplattenGruppe = new THREE.Group();
        this.terrassenplattenGruppe.name = "Terrassenplatten";

        // Gruppe der Basisklasse überschreiben
        this.gruppe = this.terrassenplattenGruppe;

        /** @type {object} Platten-Konfiguration */
        this.plattenKonfiguration = { ...PLATTEN_CONFIG };

        /** @type {Object<string, THREE.Material>} */
        this.materialien = {};

        /** @type {THREE.Texture} */
        this.noiseTexture = null;

        /** @type {THREE.Mesh[]} */
        this.platten = [];
    }

    // ========================================================================
    // HAUPTMETHODEN
    // ========================================================================

    /**
     * Erstellt alle Terrassenplatten
     * @returns {THREE.Group}
     */
    erstelleTerrassenplatten() {
        this.logger.group("ERSTELLE TERRASSENPLATTEN");

        try {
            this.entfernePlatten();

            const config = this.konfiguration.gibAktuelleKonfiguration();
            this.konfiguration.berechneAbhaengigeWerte();

            const terrassenBereich = this.berechneTerrassenBereich(config);

            this.erstelleMaterialien();
            this.erstellePlattenGrid(terrassenBereich);

            this.logger.debug(`${this.platten.length} Terrassenplatten erstellt`);
        } catch (error) {
            this.logger.error("Fehler beim Erstellen der Terrassenplatten:", error);
        }

        this.logger.groupEnd();
        return this.terrassenplattenGruppe;
    }

    // ========================================================================
    // BERECHNUNG
    // ========================================================================

    /**
     * Berechnet den Terrassenbereich basierend auf Pergola-Dimensionen
     * @param {object} config - Konfiguration
     * @returns {object} Terrassenbereich
     */
    berechneTerrassenBereich(config) {
        const erweiterung = this.plattenKonfiguration.erweiterungsFaktor;
        const breite = config.breite * erweiterung;
        const tiefe = config.tiefe * erweiterung;

        return {
            startX: (config.breite - breite) / 2,
            startZ: (config.tiefe - tiefe) / 2,
            breite,
            tiefe,
            hoehe: this.plattenKonfiguration.dicke / 2,
            pergolaBreite: config.breite,
            pergolaTiefe: config.tiefe
        };
    }

    // ========================================================================
    // MATERIAL-ERSTELLUNG
    // ========================================================================

    /**
     * Erstellt die benötigten Materialien
     */
    erstelleMaterialien() {
        this.logger.debug("Erzeuge graue Terrassenplatten mit subtiler Textur...");

        // Noise-Textur für Variation
        this.noiseTexture = this.erzeugeNoiseTextur(512);

        // Hauptplatten-Material
        this.materialien.hauptPlatte = new THREE.MeshStandardMaterial({
            color: new THREE.Color(PLATTEN_FARBEN.hauptPlatte),
            roughness: 0.78,
            metalness: 0.01,
            envMapIntensity: 0.1,
            emissive: new THREE.Color(PLATTEN_FARBEN.platteEmissive),
            emissiveIntensity: 0.015,
            map: this.noiseTexture,
            toneMapped: true,
            flatShading: false
        });
        this.materialien.hauptPlatte.receiveShadow = true;
        this.materialien.hauptPlatte.castShadow = true;
        this.materialien.hauptPlattenVarianten = [this.materialien.hauptPlatte];

        this.logger.debug("Platten-Material Farbe:",
            this.materialien.hauptPlatte.color.getStyle(),
            "Emissive:", this.materialien.hauptPlatte.emissive.getStyle()
        );

        // Randstein-Material
        this.materialien.randstein = new THREE.MeshStandardMaterial({
            color: new THREE.Color(PLATTEN_FARBEN.randstein),
            roughness: 0.8,
            metalness: 0.01,
            envMapIntensity: 0.08,
            emissive: new THREE.Color(PLATTEN_FARBEN.randsteinEmissive),
            emissiveIntensity: 0.01,
            map: this.noiseTexture,
            toneMapped: true
        });
        this.materialien.randstein.receiveShadow = true;
        this.materialien.randstein.castShadow = true;
    }

    /**
     * Erzeugt eine Noise-Textur für Variation
     * @param {number} size - Texturgröße
     * @returns {THREE.CanvasTexture}
     */
    erzeugeNoiseTextur(size = 512) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");

        // Basis-Füllung
        ctx.fillStyle = "#bfbfbf";
        ctx.fillRect(0, 0, size, size);

        // Noise-Punkte
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = "#ffffff";
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                if (Math.random() < 0.12) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        ctx.globalAlpha = 1;

        // Textur erstellen
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        tex.needsUpdate = true;

        return tex;
    }

    // ========================================================================
    // PLATTEN-GRID
    // ========================================================================

    /**
     * Erstellt das Platten-Grid
     * @param {object} bereich - Terrassenbereich
     */
    erstellePlattenGrid(bereich) {
        const groesse = this.plattenKonfiguration.groesse;
        const fugenhoehe = this.plattenKonfiguration.fugenhoehe;
        const dicke = this.plattenKonfiguration.dicke;

        // Anzahl Platten berechnen
        const anzahlX = Math.floor(bereich.breite / (groesse + fugenhoehe));
        const anzahlZ = Math.floor(bereich.tiefe / (groesse + fugenhoehe));

        // Gesamtgröße des Grids
        const gridBreite = anzahlX * (groesse + fugenhoehe) - fugenhoehe;
        const gridTiefe = anzahlZ * (groesse + fugenhoehe) - fugenhoehe;

        // Startpunkt zentrieren
        const startX = bereich.startX + (bereich.breite - gridBreite) / 2;
        const startZ = bereich.startZ + (bereich.tiefe - gridTiefe) / 2;

        // Geometrie erstellen (für alle Platten wiederverwendet)
        const geometrie = new THREE.BoxGeometry(groesse, dicke, groesse);
        geometrie.setAttribute('uv2', new THREE.BufferAttribute(geometrie.attributes.uv.array, 2));

        // Platten erstellen
        for (let ix = 0; ix < anzahlX; ix++) {
            for (let iz = 0; iz < anzahlZ; iz++) {
                const x = startX + ix * (groesse + fugenhoehe) + groesse / 2;
                const z = startZ + iz * (groesse + fugenhoehe) + groesse / 2;

                // Leichte Höhenvariation
                const yVariation = 0.002 * (Math.random() - 0.5);

                const mesh = new THREE.Mesh(geometrie, this.holePlattenMaterial());
                mesh.position.set(x, bereich.hoehe + yVariation, z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.name = `Terrassenplatte_${ix}_${iz}`;

                this.terrassenplattenGruppe.add(mesh);
                this.platten.push(mesh);
            }
        }

        this.logger.debug(`Grid erstellt: ${anzahlX}x${anzahlZ} = ${anzahlX * anzahlZ} Platten`);
    }

    /**
     * Gibt ein Platten-Material zurück
     * @returns {THREE.Material}
     */
    holePlattenMaterial() {
        if (this.materialien.hauptPlattenVarianten && this.materialien.hauptPlattenVarianten.length > 0) {
            return this.materialien.hauptPlattenVarianten[0];
        }

        return this.materialien.hauptPlatte || new THREE.MeshStandardMaterial({
            color: new THREE.Color("#f5f5dc"),
            roughness: 0.82,
            metalness: 0.02
        });
    }

    // ========================================================================
    // RANDSTEINE
    // ========================================================================

    /**
     * Erstellt Randsteine um die Terrasse
     * @param {object} bereich - Terrassenbereich
     */
    erstelleRandsteine(bereich) {
        const randsteinLaenge = 0.08;
        const geometrie = new THREE.BoxGeometry(0.1, 0.05, randsteinLaenge);

        const seiten = [
            {
                seite: "vorne",
                start: { x: bereich.startX, z: bereich.startZ - 0.04 },
                ende: { x: bereich.startX + bereich.breite, z: bereich.startZ - 0.04 },
                richtung: "x"
            },
            {
                seite: "hinten",
                start: { x: bereich.startX, z: bereich.startZ + bereich.tiefe + 0.04 },
                ende: { x: bereich.startX + bereich.breite, z: bereich.startZ + bereich.tiefe + 0.04 },
                richtung: "x"
            },
            {
                seite: "links",
                start: { x: bereich.startX - 0.04, z: bereich.startZ },
                ende: { x: bereich.startX - 0.04, z: bereich.startZ + bereich.tiefe },
                richtung: "z"
            },
            {
                seite: "rechts",
                start: { x: bereich.startX + bereich.breite + 0.04, z: bereich.startZ },
                ende: { x: bereich.startX + bereich.breite + 0.04, z: bereich.startZ + bereich.tiefe },
                richtung: "z"
            }
        ];

        seiten.forEach(seite => {
            this.erstelleRandsteinSeite(seite, geometrie, 0.05, bereich);
        });
    }

    /**
     * Erstellt eine Randsteinseite
     * @param {object} seite - Seitendefinition
     * @param {THREE.BufferGeometry} geometrie - Randstein-Geometrie
     * @param {number} hoehe - Randsteinhöhe
     * @param {object} bereich - Terrassenbereich
     */
    erstelleRandsteinSeite(seite, geometrie, hoehe, bereich) {
        const laenge = seite.richtung === "x"
            ? Math.abs(seite.ende.x - seite.start.x)
            : Math.abs(seite.ende.z - seite.start.z);

        const anzahl = Math.floor(laenge / 0.15);
        const schrittweite = laenge / anzahl;

        for (let i = 0; i < anzahl; i++) {
            let x, z;

            if (seite.richtung === "x") {
                x = seite.start.x + i * schrittweite + schrittweite / 2;
                z = seite.start.z;
            } else {
                x = seite.start.x;
                z = seite.start.z + i * schrittweite + schrittweite / 2;
            }

            const mesh = new THREE.Mesh(geometrie, this.materialien.randstein);
            mesh.position.set(x, bereich.hoehe + hoehe / 2, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.name = `Randstein_${seite.seite}_${i}`;

            this.terrassenplattenGruppe.add(mesh);
            this.platten.push(mesh);
        }
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Entfernt alle Platten
     */
    entfernePlatten() {
        while (this.terrassenplattenGruppe.children.length > 0) {
            const child = this.terrassenplattenGruppe.children[0];

            this.terrassenplattenGruppe.remove(child);

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

        this.platten = [];
    }

    // ========================================================================
    // GETTER / LEGACY API
    // ========================================================================

    /**
     * Gibt alle Platten zurück
     * @returns {THREE.Mesh[]}
     */
    gibAllePlatten() {
        return [...this.platten];
    }

    /**
     * Legacy: Gibt die 3D-Gruppe zurück
     * @deprecated Verwende getGroup() stattdessen
     * @returns {THREE.Group}
     */
    gib3DGruppe() {
        return this.terrassenplattenGruppe;
    }

    // ========================================================================
    // COMPONENT3D INTERFACE
    // ========================================================================

    /**
     * Erstellt die Komponente (Component3D Interface)
     * @returns {THREE.Group}
     */
    create() {
        return this.erstelleTerrassenplatten();
    }

    /**
     * Gibt alle Elemente zurück (Component3D Interface)
     * @returns {THREE.Mesh[]}
     */
    getAll() {
        return this.gibAllePlatten();
    }

    /**
     * Gibt die 3D-Gruppe zurück (Component3D Interface)
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.terrassenplattenGruppe;
    }

    // ========================================================================
    // DEBUG
    // ========================================================================

    /**
     * Debug-Ausgabe für Terrassenplatten
     */
    debugTerrassenplatten() {
        this.logger.group("TERRASSENPLATTEN DEBUG");
        this.logger.info("Anzahl Platten:", this.platten.length);
        this.logger.info("Konfiguration:", this.plattenKonfiguration);
        this.logger.info("Materialien:", Object.keys(this.materialien));
        this.logger.groupEnd();
    }

    /**
     * Cleanup (Component3D Interface)
     */
    dispose() {
        this.entfernePlatten();

        Object.values(this.materialien).forEach(material => {
            const materialList = Array.isArray(material) ? material : [material];
            materialList.forEach(mat => {
                if (!mat || typeof mat.dispose !== "function") return;

                if (mat.map) mat.map.dispose();
                if (mat.normalMap) mat.normalMap.dispose();
                if (mat.roughnessMap) mat.roughnessMap.dispose();
                if (mat.aoMap) mat.aoMap.dispose();

                mat.dispose();
            });
        });

        this.materialien = {};
        super.dispose();
    }
}
