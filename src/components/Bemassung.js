/**
 * Bemaßungs-Komponente für den Pergola-Konfigurator
 *
 * Erstellt visuelle Bemaßungslinien zur Anzeige der
 * Pergola-Dimensionen (Breite, Tiefe, Höhe).
 *
 * Refactored: Erweitert Component3D für einheitliche API
 */

import { Component3D } from "../core/Component3D.js";
import { COMPONENT_NAMES } from "../constants/index.js";

/**
 * Bemaßungs-Stil-Konfiguration
 */
const BEMASSUNG_STYLES = {
    linienfarbe: 0xff0000,
    textfarbe: "#000000",
    linienbreite: 2,
    pfeilgroesse: 0.08,
    textgroesse: 0.15,
    abstand: 0.3
};

/**
 * Klasse zur Erstellung und Verwaltung von Bemaßungslinien
 * @extends Component3D
 */
export class Bemassung extends Component3D {
    /**
     * Konstruktor
     */
    constructor() {
        // Component3D ohne koordinatenSystem und konfiguration initialisieren
        super(COMPONENT_NAMES.BEMASSUNG, null, null);

        /** @type {THREE.Group} */
        this.gruppe = new THREE.Group();
        this.gruppe.name = "Bemaßung";

        /** @type {boolean} */
        this.istSichtbar = false;

        /** @type {object} */
        this.styles = { ...BEMASSUNG_STYLES };
    }

    // ========================================================================
    // HAUPTMETHODEN
    // ========================================================================

    /**
     * Erstellt alle Bemaßungslinien
     * @param {object} config - Konfiguration mit breite, tiefe, hoehe
     */
    erstelleBemassung(config) {
        this.entferneAlleBemassung();

        const breite = config.breite;
        const tiefe = config.tiefe;
        const hoehe = config.hoehe;

        this.erstelleBreitenBemassung(breite, tiefe, hoehe);
        this.erstelleTiefenBemassung(breite, tiefe, hoehe);
        this.erstelleHoehenBemassung(breite, tiefe, hoehe);
        this.erstellePfostenHoehenBemassung(config);

        this.logger.debug("Bemaßungen erstellt");
    }

    // ========================================================================
    // EINZELNE BEMASSUNGEN
    // ========================================================================

    /**
     * Erstellt die Breitenbemaßung
     * @param {number} breite - Breite
     * @param {number} tiefe - Tiefe
     * @param {number} hoehe - Höhe
     */
    erstelleBreitenBemassung(breite, tiefe, hoehe) {
        const abstand = this.styles.abstand;
        const yPos = -abstand;
        const zPos = -abstand;

        const start = new THREE.Vector3(0, yPos, zPos);
        const ende = new THREE.Vector3(breite, yPos, zPos);

        this.erstelleMasslinie(start, ende, `${breite.toFixed(2)}m`, "horizontal");
    }

    /**
     * Erstellt die Tiefenbemaßung
     * @param {number} breite - Breite
     * @param {number} tiefe - Tiefe
     * @param {number} hoehe - Höhe
     */
    erstelleTiefenBemassung(breite, tiefe, hoehe) {
        const abstand = this.styles.abstand;
        const xPos = -abstand;
        const yPos = -abstand;

        const start = new THREE.Vector3(xPos, yPos, 0);
        const ende = new THREE.Vector3(xPos, yPos, tiefe);

        this.erstelleMasslinie(start, ende, `${tiefe.toFixed(2)}m`, "horizontal");
    }

    /**
     * Erstellt die Höhenbemaßung
     * @param {number} breite - Breite
     * @param {number} tiefe - Tiefe
     * @param {number} hoehe - Höhe
     */
    erstelleHoehenBemassung(breite, tiefe, hoehe) {
        const xPos = breite + this.styles.abstand;

        const start = new THREE.Vector3(xPos, 0, 0);
        const ende = new THREE.Vector3(xPos, hoehe, 0);

        this.erstelleMasslinie(start, ende, `${hoehe.toFixed(2)}m`, "vertikal");
    }

    /**
     * Erstellt die Pfosten-Höhenbemaßung (hinten)
     * @param {object} config - Konfiguration
     */
    erstellePfostenHoehenBemassung(config) {
        const breite = config.breite;
        const tiefe = config.tiefe;
        const hoehe = config.hoehe;
        const neigung = (config.neigung || 2) * Math.PI / 180;
        const hintereHoehe = hoehe + Math.tan(neigung) * tiefe;

        this.erstellePfostenHoeheMasslinie(breite, tiefe, hintereHoehe, "Hinten", 0.2, -0.2);
    }

    /**
     * Erstellt Pfostenabstands-Bemaßungen
     * @param {object} config - Konfiguration
     */
    erstellePfostenAbstaende(config) {
        const breite = config.breite;
        const positionen = [0];

        // Zusätzliche Pfosten bei Breite > 4m
        if (breite > 4) {
            const anzahl = Math.ceil(breite / 2);
            const abstand = breite / anzahl;

            for (let i = 1; i < anzahl; i++) {
                positionen.push(i * abstand);
            }
        }

        // Zentraler Mittelpfosten
        if (config.zentralerMittelpfosten) {
            const mitte = breite / 2;
            if (!positionen.includes(mitte)) {
                positionen.push(mitte);
            }
        }

        positionen.push(breite);
        positionen.sort((a, b) => a - b);

        // Abstände zwischen Pfosten bemaßen
        for (let i = 0; i < positionen.length - 1; i++) {
            const startX = positionen[i];
            const endeX = positionen[i + 1];
            const abstand = endeX - startX;

            const start = new THREE.Vector3(startX, 0.05, 0.3);
            const ende = new THREE.Vector3(endeX, 0.05, 0.3);

            this.erstelleMasslinie(start, ende, `${abstand.toFixed(2)}m`, "horizontal", 0.1);
        }
    }

    // ========================================================================
    // MASSLINIE ERSTELLEN
    // ========================================================================

    /**
     * Erstellt eine Pfosten-Höhenmasslinie
     * @param {number} breite - Breite
     * @param {number} tiefe - Tiefe
     * @param {number} hoehe - Höhe
     * @param {string} bezeichnung - Bezeichnung
     * @param {number} xOffset - X-Offset
     * @param {number} zOffset - Z-Offset
     */
    erstellePfostenHoeheMasslinie(breite, tiefe, hoehe, bezeichnung, xOffset, zOffset) {
        const start = new THREE.Vector3(breite + xOffset, 0, tiefe + zOffset);
        const ende = new THREE.Vector3(breite + xOffset, hoehe, tiefe + zOffset);

        this.erstelleMasslinie(start, ende, `${hoehe.toFixed(2)}m`, "vertikal", 0.1);
    }

    /**
     * Erstellt eine vollständige Maßlinie mit Pfeilen und Text
     * @param {THREE.Vector3} start - Startpunkt
     * @param {THREE.Vector3} ende - Endpunkt
     * @param {string} text - Beschriftungstext
     * @param {string} orientierung - "horizontal" oder "vertikal"
     * @param {number} textGroesse - Optional: Textgröße
     */
    erstelleMasslinie(start, ende, text, orientierung, textGroesse = null) {
        const massGruppe = new THREE.Group();

        // Hauptlinie
        const linienMaterial = new THREE.LineBasicMaterial({
            color: this.styles.linienfarbe,
            linewidth: this.styles.linienbreite
        });

        const linienGeometrie = new THREE.BufferGeometry().setFromPoints([start, ende]);
        const linie = new THREE.Line(linienGeometrie, linienMaterial);
        massGruppe.add(linie);

        // Richtungsvektor
        const richtung = new THREE.Vector3().subVectors(ende, start);
        richtung.normalize();

        // Hilfslinien an den Enden
        this.erstelleHilfslinie(start, richtung, orientierung, massGruppe);
        this.erstelleHilfslinie(ende, richtung, orientierung, massGruppe);

        // Pfeile an den Enden
        this.erstellePfeil(start, richtung.clone().negate(), massGruppe);
        this.erstellePfeil(ende, richtung, massGruppe);

        // Text in der Mitte
        const mittelpunkt = new THREE.Vector3().addVectors(start, ende).multiplyScalar(0.5);
        this.erstelleText(mittelpunkt, text, orientierung, textGroesse, massGruppe);

        this.gruppe.add(massGruppe);
    }

    /**
     * Erstellt eine Hilfslinie senkrecht zur Maßlinie
     * @param {THREE.Vector3} punkt - Punkt
     * @param {THREE.Vector3} richtung - Richtungsvektor
     * @param {string} orientierung - "horizontal" oder "vertikal"
     * @param {THREE.Group} gruppe - Zielgruppe
     */
    erstelleHilfslinie(punkt, richtung, orientierung, gruppe) {
        let senkrecht;

        if (orientierung === "vertikal") {
            senkrecht = new THREE.Vector3(0, 0, 1);
        } else {
            senkrecht = new THREE.Vector3(0, 1, 0);
        }

        const start = punkt.clone().add(senkrecht.clone().multiplyScalar(-0.075));
        const ende = punkt.clone().add(senkrecht.clone().multiplyScalar(0.075));

        const geometrie = new THREE.BufferGeometry().setFromPoints([start, ende]);
        const material = new THREE.LineBasicMaterial({
            color: this.styles.linienfarbe,
            linewidth: 1
        });

        const linie = new THREE.Line(geometrie, material);
        gruppe.add(linie);
    }

    /**
     * Erstellt einen Pfeil
     * @param {THREE.Vector3} position - Position
     * @param {THREE.Vector3} richtung - Richtungsvektor
     * @param {THREE.Group} gruppe - Zielgruppe
     */
    erstellePfeil(position, richtung, gruppe) {
        const hoehe = this.styles.pfeilgroesse;
        const radius = 0.4 * this.styles.pfeilgroesse;

        const geometrie = new THREE.ConeGeometry(radius, hoehe, 8);
        const material = new THREE.MeshBasicMaterial({
            color: this.styles.linienfarbe,
            depthTest: false,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geometrie, material);
        mesh.position.copy(position);

        // Rotation zur Richtung
        const quaternion = new THREE.Quaternion();
        const oben = new THREE.Vector3(0, 1, 0);
        quaternion.setFromUnitVectors(oben, richtung);
        mesh.quaternion.copy(quaternion);

        mesh.renderOrder = 999;
        gruppe.add(mesh);
    }

    /**
     * Erstellt ein Text-Sprite
     * @param {THREE.Vector3} position - Position
     * @param {string} text - Text
     * @param {string} orientierung - "horizontal" oder "vertikal"
     * @param {number} groesse - Optional: Textgröße
     * @param {THREE.Group} gruppe - Zielgruppe
     */
    erstelleText(position, text, orientierung, groesse = null, gruppe) {
        const textGroesse = groesse || this.styles.textgroesse;

        // Canvas erstellen
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = 512;
        canvas.height = 128;

        // Hintergrund
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Text
        context.font = "Bold 60px Arial";
        context.fillStyle = this.styles.textfarbe;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        // Textur erstellen
        const textur = new THREE.CanvasTexture(canvas);
        textur.needsUpdate = true;

        // Sprite erstellen
        const spriteMaterial = new THREE.SpriteMaterial({
            map: textur,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.position.y += 0.1;
        sprite.scale.set(4 * textGroesse, textGroesse, 1);

        gruppe.add(sprite);
    }

    // ========================================================================
    // CLEANUP UND VISIBILITY
    // ========================================================================

    /**
     * Entfernt alle Bemaßungselemente
     */
    entferneAlleBemassung() {
        while (this.gruppe.children.length > 0) {
            const child = this.gruppe.children[0];

            if (child.geometry) {
                child.geometry.dispose();
            }

            if (child.material) {
                if (child.material.map) {
                    child.material.map.dispose();
                }
                child.material.dispose();
            }

            this.gruppe.remove(child);
        }
    }

    /**
     * Setzt die Sichtbarkeit der Bemaßung
     * @param {boolean} sichtbar - Sichtbar oder nicht
     */
    setzeVisibility(sichtbar) {
        this.istSichtbar = sichtbar;
        this.gruppe.visible = sichtbar;
        this.logger.debug("Bemaßung " + (sichtbar ? "eingeblendet" : "ausgeblendet"));
    }

    /**
     * Gibt die Gruppe zurück
     * @returns {THREE.Group}
     */
    gibGruppe() {
        return this.gruppe;
    }

    /**
     * Prüft ob die Bemaßung sichtbar ist
     * @returns {boolean}
     */
    istBemassungSichtbar() {
        return this.istSichtbar;
    }

    /**
     * Aktualisiert die Bemaßung
     * @param {object} config - Konfiguration
     */
    aktualisieren(config) {
        if (this.istSichtbar) {
            this.erstelleBemassung(config);
        }
    }

    // ========================================================================
    // COMPONENT3D INTERFACE
    // ========================================================================

    /**
     * Erstellt die Komponente (Component3D Interface)
     * @param {object} config - Konfiguration
     * @returns {THREE.Group}
     */
    create(config) {
        if (config) {
            this.erstelleBemassung(config);
        }
        return this.gruppe;
    }

    /**
     * Gibt alle Elemente zurück (Component3D Interface)
     * @returns {THREE.Object3D[]}
     */
    getAll() {
        return [...this.gruppe.children];
    }

    /**
     * Gibt die 3D-Gruppe zurück (Component3D Interface)
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.gruppe;
    }

    /**
     * Legacy: Gibt die 3D-Gruppe zurück
     * @deprecated Verwende getGroup() stattdessen
     * @returns {THREE.Group}
     */
    gib3DGruppe() {
        return this.gruppe;
    }

    /**
     * Cleanup (Component3D Interface)
     */
    dispose() {
        this.entferneAlleBemassung();
        this.logger.debug("Bemaßung aufgeräumt");
        super.dispose();
    }
}
