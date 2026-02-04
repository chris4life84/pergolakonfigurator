/**
 * Glaswände-Komponente für den Pergola-Konfigurator
 *
 * Erstellt optionale Glas-Seitenwände (Festglas oder Schiebewände)
 * für alle vier Seiten der Pergola.
 *
 * Features:
 * - Automatische Panel-Berechnung (~1.2m Breite pro Panel)
 * - Unterstützung für Pultdach (Trapezform) und Flachdach
 * - Tür-Option mit größerem Griff
 * - Wandanbau-Modus (hintere Seite deaktiviert)
 */

import { Component3D } from "../core/Component3D.js";
import { MaterialManager } from "../core/MaterialManager.js";
import { createSmoothBoxGeometry } from "../utils/geometry.js";

/**
 * Glas-Material-Konfigurationen für Seitenwände
 */
const GLASWAND_MATERIALIEN = {
    klar: {
        baseColor: 0xffffff,
        transmission: 0.92,
        roughness: 0.05,
        thickness: 0.008,
        ior: 1.5,
        opacity: 0.15
    },
    matt: {
        baseColor: 0xf5f5f5,
        transmission: 0.7,
        roughness: 0.4,
        thickness: 0.008,
        ior: 1.5,
        opacity: 0.25
    },
    grau: {
        baseColor: 0x808080,
        transmission: 0.75,
        roughness: 0.1,
        thickness: 0.008,
        ior: 1.5,
        opacity: 0.3
    },
    bronze: {
        baseColor: 0xCD7F32,
        transmission: 0.72,
        roughness: 0.12,
        thickness: 0.008,
        ior: 1.5,
        opacity: 0.28
    }
};

/**
 * Konstanten für Glaswand-Dimensionen
 */
const GLASWAND_CONFIG = {
    PANEL_ZIEL_BREITE: 1.2,      // Zielbreite pro Panel in Metern
    PANEL_MIN_ANZAHL: 2,          // Minimum Panels pro Seite
    PANEL_MAX_ANZAHL: 6,          // Maximum Panels pro Seite
    RAHMEN_BREITE: 0.04,          // Rahmenbreite 40mm
    RAHMEN_TIEFE: 0.04,           // Rahmentiefe 40mm
    GLAS_DICKE: 0.008,            // Glasdicke 8mm (VSG)
    SCHIENEN_HOEHE: 0.025,        // Schienenhöhe 25mm
    SCHIENEN_BREITE: 0.06,        // Schienenbreite 60mm
    GRIFF_BREITE: 0.025,          // Griffbreite 25mm
    GRIFF_HOEHE: 0.15,            // Standard-Griffhöhe 150mm
    GRIFF_HOEHE_TUER: 0.30,       // Tür-Griffhöhe 300mm
    GRIFF_TIEFE: 0.02,            // Grifftiefe 20mm
    PANEL_GAP: 0.003,             // Abstand zwischen Panels 3mm
    BODEN_ABSTAND: 0.01,          // Abstand zum Boden 10mm
    DACH_ABSTAND: 0.0             // Kein Abstand zum Dach - bündig
};

/**
 * Seiten-Definitionen für die Positionierung
 */
const SEITEN_CONFIG = {
    links: { achse: 'z', richtung: 1, rotation: Math.PI / 2 },
    rechts: { achse: 'z', richtung: -1, rotation: -Math.PI / 2 },
    vorne: { achse: 'x', richtung: 1, rotation: 0 },
    hinten: { achse: 'x', richtung: -1, rotation: Math.PI }
};

/**
 * Klasse zur Erstellung und Verwaltung von Glaswänden
 * @extends Component3D
 */
export class Glaswaende extends Component3D {
    /**
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     * @param {object} pfostenInstanz - Referenz zur Pfosten-Komponente
     */
    constructor(koordinatenSystem, konfiguration, pfostenInstanz) {
        super('Glaswaende', koordinatenSystem, konfiguration);

        /** @type {object} Referenz zur Pfosten-Komponente */
        this.pfostenInstanz = pfostenInstanz;

        /** @type {Map<string, THREE.Material>} Glas-Materialien Cache */
        this.glasMaterialien = new Map();

        /** @type {Map<string, THREE.Material>} Rahmen-Materialien Cache */
        this.rahmenMaterialien = new Map();
    }

    // ========================================================================
    // MATERIAL-ERSTELLUNG
    // ========================================================================

    /**
     * Erzeugt das Glas-Material für Seitenwände
     * @param {string} farbe - Glasfarbe (klar, matt, grau, bronze)
     * @returns {THREE.MeshPhysicalMaterial}
     */
    erzeugeGlasMaterial(farbe) {
        const cacheKey = `glaswand_${farbe}`;
        if (this.glasMaterialien.has(cacheKey)) {
            return this.glasMaterialien.get(cacheKey);
        }

        const materialConfig = GLASWAND_MATERIALIEN[farbe] || GLASWAND_MATERIALIEN.klar;

        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(materialConfig.baseColor),
            transparent: true,
            opacity: materialConfig.opacity,
            roughness: materialConfig.roughness,
            metalness: 0,
            transmission: materialConfig.transmission,
            thickness: materialConfig.thickness,
            ior: materialConfig.ior,
            side: THREE.DoubleSide,
            depthWrite: false,
            envMapIntensity: 0.8
        });

        material.clearcoat = 0.3;
        material.clearcoatRoughness = 0.1;

        this.glasMaterialien.set(cacheKey, material);
        return material;
    }

    /**
     * Erzeugt das Rahmen-Material (Aluminium)
     * @param {object} config - Konfiguration
     * @returns {THREE.MeshStandardMaterial}
     */
    erzeugeRahmenMaterial(config) {
        const farbe = config.glaswaendeRahmenFarbe || config.farbe || 'ral7016';
        return MaterialManager.gibStrukturMaterial({
            teil: 'glaswandRahmen',
            config: { ...config, farbe }
        });
    }

    /**
     * Erzeugt das Griff-Material (Edelstahl-Optik)
     * @returns {THREE.MeshStandardMaterial}
     */
    erzeugeGriffMaterial() {
        if (this.rahmenMaterialien.has('griff')) {
            return this.rahmenMaterialien.get('griff');
        }

        const material = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            roughness: 0.2,
            metalness: 0.9,
            envMapIntensity: 1.0
        });

        this.rahmenMaterialien.set('griff', material);
        return material;
    }

    // ========================================================================
    // BERECHNUNGEN
    // ========================================================================

    /**
     * Berechnet die Anzahl der Panels für eine Seite
     * @param {number} laenge - Länge der Seite in Metern
     * @returns {number} Anzahl der Panels
     */
    berechnePanelAnzahl(laenge) {
        const zielAnzahl = Math.round(laenge / GLASWAND_CONFIG.PANEL_ZIEL_BREITE);
        return Math.max(
            GLASWAND_CONFIG.PANEL_MIN_ANZAHL,
            Math.min(GLASWAND_CONFIG.PANEL_MAX_ANZAHL, zielAnzahl)
        );
    }

    /**
     * Berechnet die Panel-Breite
     * @param {number} laenge - Gesamtlänge
     * @param {number} anzahl - Anzahl Panels
     * @param {string} typ - 'festglas' oder 'schiebewand'
     * @returns {number} Breite eines Panels
     */
    berechnePanelBreite(laenge, anzahl, typ) {
        const rahmenGesamt = 2 * GLASWAND_CONFIG.RAHMEN_BREITE;
        const gaps = (anzahl - 1) * GLASWAND_CONFIG.PANEL_GAP;
        const verfuegbar = laenge - rahmenGesamt - gaps;
        return verfuegbar / anzahl;
    }

    /**
     * Berechnet die Höhen für eine Seite (berücksichtigt Pultdach-Neigung)
     * @param {string} seite - 'links', 'rechts', 'vorne', 'hinten'
     * @param {object} config - Konfiguration
     * @param {object} abhaengig - Abhängige Werte
     * @returns {object} { hoeheStart, hoeheEnde, isTrapezoidal }
     */
    berechneHoehen(seite, config, abhaengig) {
        const vordereHoehe = abhaengig.vordereHoehe;
        const hintereHoehe = abhaengig.hintereHoehe;
        const bodenAbstand = GLASWAND_CONFIG.BODEN_ABSTAND;
        const dachAbstand = GLASWAND_CONFIG.DACH_ABSTAND;

        // Effektive Höhen (abzüglich Abstände)
        const effVorne = vordereHoehe - bodenAbstand - dachAbstand;
        const effHinten = hintereHoehe - bodenAbstand - dachAbstand;

        switch (seite) {
            case 'vorne':
                return {
                    hoeheStart: effVorne,
                    hoeheEnde: effVorne,
                    isTrapezoidal: false
                };
            case 'hinten':
                return {
                    hoeheStart: effHinten,
                    hoeheEnde: effHinten,
                    isTrapezoidal: false
                };
            case 'links':
            case 'rechts':
                return {
                    hoeheStart: effVorne,
                    hoeheEnde: effHinten,
                    isTrapezoidal: Math.abs(effVorne - effHinten) > 0.01
                };
            default:
                return {
                    hoeheStart: effVorne,
                    hoeheEnde: effVorne,
                    isTrapezoidal: false
                };
        }
    }

    /**
     * Berechnet die Länge einer Seite
     * @param {string} seite - 'links', 'rechts', 'vorne', 'hinten'
     * @param {object} config - Konfiguration
     * @returns {number} Länge in Metern
     */
    berechneSeitenLaenge(seite, config) {
        switch (seite) {
            case 'vorne':
            case 'hinten':
                return config.breite;
            case 'links':
            case 'rechts':
                return config.tiefe;
            default:
                return 0;
        }
    }

    // ========================================================================
    // 3D-GEOMETRIE ERSTELLUNG
    // ========================================================================

    /**
     * Erstellt ein einzelnes Glas-Panel
     * @param {number} breite - Breite des Panels
     * @param {number} hoeheLinks - Höhe links
     * @param {number} hoeheRechts - Höhe rechts
     * @param {THREE.Material} glasMaterial - Glas-Material
     * @param {THREE.Material} rahmenMaterial - Rahmen-Material
     * @param {boolean} istTuer - Ist dies ein Tür-Panel?
     * @param {string} typ - 'festglas' oder 'schiebewand'
     * @returns {THREE.Group}
     */
    erstellePanel(breite, hoeheLinks, hoeheRechts, glasMaterial, rahmenMaterial, istTuer, typ) {
        const panelGruppe = new THREE.Group();
        panelGruppe.name = istTuer ? 'TuerPanel' : 'GlasPanel';

        const rahmenBreite = GLASWAND_CONFIG.RAHMEN_BREITE;
        const rahmenTiefe = GLASWAND_CONFIG.RAHMEN_TIEFE;
        const glasDicke = GLASWAND_CONFIG.GLAS_DICKE;

        // Durchschnittshöhe für nicht-trapezoidale Teile
        const avgHoehe = (hoeheLinks + hoeheRechts) / 2;
        const isTrapezoidal = Math.abs(hoeheLinks - hoeheRechts) > 0.01;

        // === RAHMEN ERSTELLEN ===
        
        // Unterer Rahmen
        const untenGeom = createSmoothBoxGeometry 
            ? createSmoothBoxGeometry(breite, rahmenBreite, rahmenTiefe, 0.002)
            : new THREE.BoxGeometry(breite, rahmenBreite, rahmenTiefe);
        const untenMesh = new THREE.Mesh(untenGeom, rahmenMaterial);
        untenMesh.position.set(0, rahmenBreite / 2, 0);
        untenMesh.name = 'RahmenUnten';
        panelGruppe.add(untenMesh);

        // Oberer Rahmen
        if (isTrapezoidal) {
            // Schräger oberer Rahmen für Pultdach
            const obenGeom = createSmoothBoxGeometry 
                ? createSmoothBoxGeometry(breite, rahmenBreite, rahmenTiefe, 0.002)
                : new THREE.BoxGeometry(breite, rahmenBreite, rahmenTiefe);
            const obenMesh = new THREE.Mesh(obenGeom, rahmenMaterial);
            
            // Positionierung und Rotation für Schräge
            const centerY = (hoeheLinks + hoeheRechts) / 2 - rahmenBreite / 2;
            const winkel = Math.atan2(hoeheRechts - hoeheLinks, breite);
            obenMesh.position.set(0, centerY, 0);
            obenMesh.rotation.z = winkel;
            obenMesh.name = 'RahmenObenSchraeg';
            panelGruppe.add(obenMesh);
        } else {
            const obenGeom = createSmoothBoxGeometry 
                ? createSmoothBoxGeometry(breite, rahmenBreite, rahmenTiefe, 0.002)
                : new THREE.BoxGeometry(breite, rahmenBreite, rahmenTiefe);
            const obenMesh = new THREE.Mesh(obenGeom, rahmenMaterial);
            obenMesh.position.set(0, avgHoehe - rahmenBreite / 2, 0);
            obenMesh.name = 'RahmenOben';
            panelGruppe.add(obenMesh);
        }

        // Linker Rahmen (vertikal)
        const linksHoehe = hoeheLinks - 2 * rahmenBreite;
        const linksGeom = createSmoothBoxGeometry 
            ? createSmoothBoxGeometry(rahmenBreite, linksHoehe, rahmenTiefe, 0.002)
            : new THREE.BoxGeometry(rahmenBreite, linksHoehe, rahmenTiefe);
        const linksMesh = new THREE.Mesh(linksGeom, rahmenMaterial);
        linksMesh.position.set(-breite / 2 + rahmenBreite / 2, rahmenBreite + linksHoehe / 2, 0);
        linksMesh.name = 'RahmenLinks';
        panelGruppe.add(linksMesh);

        // Rechter Rahmen (vertikal)
        const rechtsHoehe = hoeheRechts - 2 * rahmenBreite;
        const rechtsGeom = createSmoothBoxGeometry 
            ? createSmoothBoxGeometry(rahmenBreite, rechtsHoehe, rahmenTiefe, 0.002)
            : new THREE.BoxGeometry(rahmenBreite, rechtsHoehe, rahmenTiefe);
        const rechtsMesh = new THREE.Mesh(rechtsGeom, rahmenMaterial);
        rechtsMesh.position.set(breite / 2 - rahmenBreite / 2, rahmenBreite + rechtsHoehe / 2, 0);
        rechtsMesh.name = 'RahmenRechts';
        panelGruppe.add(rechtsMesh);

        // === GLAS ERSTELLEN ===
        const glasBreite = breite - 2 * rahmenBreite;
        const glasHoeheLinks = hoeheLinks - 2 * rahmenBreite;
        const glasHoeheRechts = hoeheRechts - 2 * rahmenBreite;

        if (isTrapezoidal) {
            // Trapezförmiges Glas für Pultdach
            const shape = new THREE.Shape();
            const halfWidth = glasBreite / 2;
            
            shape.moveTo(-halfWidth, 0);
            shape.lineTo(halfWidth, 0);
            shape.lineTo(halfWidth, glasHoeheRechts);
            shape.lineTo(-halfWidth, glasHoeheLinks);
            shape.closePath();

            const extrudeSettings = {
                depth: glasDicke,
                bevelEnabled: false
            };

            const glasGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            glasGeom.translate(0, 0, -glasDicke / 2);
            const glasMesh = new THREE.Mesh(glasGeom, glasMaterial);
            glasMesh.position.set(0, rahmenBreite, 0);
            glasMesh.name = 'GlasScheibe';
            panelGruppe.add(glasMesh);
        } else {
            const glasHoehe = glasHoeheLinks;
            const glasGeom = new THREE.BoxGeometry(glasBreite, glasHoehe, glasDicke);
            const glasMesh = new THREE.Mesh(glasGeom, glasMaterial);
            glasMesh.position.set(0, rahmenBreite + glasHoehe / 2, 0);
            glasMesh.name = 'GlasScheibe';
            panelGruppe.add(glasMesh);
        }

        // === GRIFF ERSTELLEN ===
        const griffHoehe = istTuer ? GLASWAND_CONFIG.GRIFF_HOEHE_TUER : GLASWAND_CONFIG.GRIFF_HOEHE;
        const griffBreite = GLASWAND_CONFIG.GRIFF_BREITE;
        const griffTiefe = GLASWAND_CONFIG.GRIFF_TIEFE;
        const griffMaterial = this.erzeugeGriffMaterial();

        // Griff-Position (mittig in der Höhe, nahe am Rand)
        const griffY = rahmenBreite + (glasHoeheLinks + glasHoeheRechts) / 4;
        const griffX = breite / 2 - rahmenBreite - 0.08; // 8cm vom Rand

        const griffGeom = createSmoothBoxGeometry 
            ? createSmoothBoxGeometry(griffBreite, griffHoehe, griffTiefe, 0.003)
            : new THREE.BoxGeometry(griffBreite, griffHoehe, griffTiefe);
        const griffMesh = new THREE.Mesh(griffGeom, griffMaterial);
        griffMesh.position.set(griffX, griffY, rahmenTiefe / 2 + griffTiefe / 2);
        griffMesh.name = istTuer ? 'TuerGriff' : 'Griff';
        panelGruppe.add(griffMesh);

        // Bei Tür: Zweiten Griff auf der Rückseite
        if (istTuer) {
            const griffMesh2 = new THREE.Mesh(griffGeom, griffMaterial);
            griffMesh2.position.set(griffX, griffY, -rahmenTiefe / 2 - griffTiefe / 2);
            griffMesh2.name = 'TuerGriffRueckseite';
            panelGruppe.add(griffMesh2);
        }

        return panelGruppe;
    }

    /**
     * Erstellt die Schienen für Schiebewände
     * @param {number} laenge - Länge der Schienen
     * @param {number} hoeheStart - Höhe am Startpunkt
     * @param {number} hoeheEnde - Höhe am Endpunkt
     * @param {THREE.Material} material - Schienen-Material
     * @returns {THREE.Group}
     */
    erstelleSchienen(laenge, hoeheStart, hoeheEnde, material) {
        const schienenGruppe = new THREE.Group();
        schienenGruppe.name = 'Schienen';

        const schienenHoehe = GLASWAND_CONFIG.SCHIENEN_HOEHE;
        const schienenBreite = GLASWAND_CONFIG.SCHIENEN_BREITE;

        // Untere Schiene (Bodenschiene)
        const untereGeom = createSmoothBoxGeometry 
            ? createSmoothBoxGeometry(laenge, schienenHoehe, schienenBreite, 0.002)
            : new THREE.BoxGeometry(laenge, schienenHoehe, schienenBreite);
        const untereMesh = new THREE.Mesh(untereGeom, material);
        untereMesh.position.set(0, schienenHoehe / 2, 0);
        untereMesh.name = 'UntereSchiene';
        schienenGruppe.add(untereMesh);

        // Obere Schiene (Decken-/Dachschiene)
        const isTrapezoidal = Math.abs(hoeheStart - hoeheEnde) > 0.01;
        
        if (isTrapezoidal) {
            // Schräge obere Schiene
            const schieneLaenge = Math.sqrt(
                laenge * laenge + Math.pow(hoeheEnde - hoeheStart, 2)
            );
            const winkel = Math.atan2(hoeheEnde - hoeheStart, laenge);
            
            const obereGeom = createSmoothBoxGeometry 
                ? createSmoothBoxGeometry(schieneLaenge, schienenHoehe, schienenBreite, 0.002)
                : new THREE.BoxGeometry(schieneLaenge, schienenHoehe, schienenBreite);
            const obereMesh = new THREE.Mesh(obereGeom, material);
            
            const centerX = 0;
            const centerY = (hoeheStart + hoeheEnde) / 2 - schienenHoehe / 2;
            obereMesh.position.set(centerX, centerY, 0);
            obereMesh.rotation.z = winkel;
            obereMesh.name = 'ObereSchiene';
            schienenGruppe.add(obereMesh);
        } else {
            const obereGeom = createSmoothBoxGeometry 
                ? createSmoothBoxGeometry(laenge, schienenHoehe, schienenBreite, 0.002)
                : new THREE.BoxGeometry(laenge, schienenHoehe, schienenBreite);
            const obereMesh = new THREE.Mesh(obereGeom, material);
            obereMesh.position.set(0, hoeheStart - schienenHoehe / 2, 0);
            obereMesh.name = 'ObereSchiene';
            schienenGruppe.add(obereMesh);
        }

        return schienenGruppe;
    }

    /**
     * Erstellt eine komplette Glaswand für eine Seite
     * @param {string} seite - 'links', 'rechts', 'vorne', 'hinten'
     * @param {object} seitenConfig - Konfiguration für diese Seite
     * @param {object} config - Gesamt-Konfiguration
     * @param {object} abhaengig - Abhängige Werte
     * @returns {THREE.Group}
     */
    erstelleGlaswandFuerSeite(seite, seitenConfig, config, abhaengig) {
        const seitenGruppe = new THREE.Group();
        seitenGruppe.name = `Glaswand_${seite}`;

        if (seitenConfig.typ === 'keine') {
            return seitenGruppe;
        }

        // Materialien
        const glasMaterial = this.erzeugeGlasMaterial(config.glaswaendeFarbe || 'klar');
        const rahmenMaterial = this.erzeugeRahmenMaterial(config);

        // Dimensionen berechnen
        const laenge = this.berechneSeitenLaenge(seite, config);
        const hoehen = this.berechneHoehen(seite, config, abhaengig);
        const anzahlPanels = this.berechnePanelAnzahl(laenge);
        const panelBreite = this.berechnePanelBreite(laenge, anzahlPanels, seitenConfig.typ);

        this.logger.debug(`Erstelle ${seite} Glaswand:`, {
            typ: seitenConfig.typ,
            laenge,
            anzahlPanels,
            panelBreite,
            hoehen
        });

        // Bei Schiebewand: Schienen erstellen
        if (seitenConfig.typ === 'schiebewand') {
            const schienen = this.erstelleSchienen(
                laenge,
                hoehen.hoeheStart,
                hoehen.hoeheEnde,
                rahmenMaterial
            );
            seitenGruppe.add(schienen);
        }

        // Panels erstellen
        const startX = -laenge / 2 + GLASWAND_CONFIG.RAHMEN_BREITE + panelBreite / 2;
        const tuerPanelIndex = seitenConfig.istTuer ? Math.floor(anzahlPanels / 2) : -1;

        for (let i = 0; i < anzahlPanels; i++) {
            // Höhen für dieses Panel interpolieren (bei trapezoidaler Form)
            const t = anzahlPanels > 1 ? i / (anzahlPanels - 1) : 0.5;
            const panelHoeheLinks = hoehen.hoeheStart + (hoehen.hoeheEnde - hoehen.hoeheStart) * t;
            
            const tNext = anzahlPanels > 1 ? (i + 1) / (anzahlPanels - 1) : 0.5;
            const panelHoeheRechts = hoehen.hoeheStart + (hoehen.hoeheEnde - hoehen.hoeheStart) * Math.min(tNext, 1);

            const istTuerPanel = i === tuerPanelIndex;
            
            const panel = this.erstellePanel(
                panelBreite,
                panelHoeheLinks,
                panelHoeheRechts,
                glasMaterial,
                rahmenMaterial,
                istTuerPanel,
                seitenConfig.typ
            );

            // Panel positionieren
            const xPos = startX + i * (panelBreite + GLASWAND_CONFIG.PANEL_GAP);
            panel.position.x = xPos;
            panel.position.y = GLASWAND_CONFIG.BODEN_ABSTAND;

            panel.name = istTuerPanel ? `TuerPanel_${i}` : `Panel_${i}`;
            seitenGruppe.add(panel);
        }

        // Seite positionieren und rotieren
        this.positioniereSeitenGruppe(seitenGruppe, seite, config);

        return seitenGruppe;
    }

    /**
     * Positioniert die Seiten-Gruppe korrekt im Raum
     * @param {THREE.Group} gruppe - Die zu positionierende Gruppe
     * @param {string} seite - 'links', 'rechts', 'vorne', 'hinten'
     * @param {object} config - Konfiguration
     */
    positioniereSeitenGruppe(gruppe, seite, config) {
        const breite = config.breite;
        const tiefe = config.tiefe;
        
        // Pfosten-Profil auslesen und Offset berechnen
        const pfostenProfil = config.pfostenProfil || '160x80x4';
        const profilParts = pfostenProfil.split('x');
        const pfostenBreite = parseInt(profilParts[0]) / 1000; // z.B. 0.16m
        const pfostenTiefe = parseInt(profilParts[1]) / 1000;  // z.B. 0.08m
        
        // Offset nach innen, sodass Glaswand innen an Pfosten anliegt
        const offsetX = pfostenBreite / 2;
        const offsetZ = pfostenTiefe / 2;

        switch (seite) {
            case 'vorne':
                // Vordere Glaswand: hinter der vorderen Pfostenreihe
                gruppe.position.set(breite / 2, 0, offsetZ);
                gruppe.rotation.y = 0;
                break;
            case 'hinten':
                // Hintere Glaswand: vor der hinteren Pfostenreihe
                gruppe.position.set(breite / 2, 0, tiefe - offsetZ);
                gruppe.rotation.y = Math.PI;
                break;
            case 'links':
                // Linke Glaswand: rechts von den linken Pfosten
                gruppe.position.set(offsetX, 0, tiefe / 2);
                gruppe.rotation.y = Math.PI / 2;
                break;
            case 'rechts':
                // Rechte Glaswand: links von den rechten Pfosten
                gruppe.position.set(breite - offsetX, 0, tiefe / 2);
                gruppe.rotation.y = -Math.PI / 2;
                break;
        }
    }

    // ========================================================================
    // HAUPTMETHODEN
    // ========================================================================

    /**
     * Erstellt alle Glaswände basierend auf der Konfiguration
     * @returns {THREE.Group}
     */
    erstelleGlaswaende() {
        this.clear();

        const config = this.konfiguration.gibAktuelleKonfiguration();
        const abhaengig = this.konfiguration.berechneAbhaengigeWerte();
        const glaswaendeConfig = config.glaswaende || {};

        this.logger.info('Erstelle Glaswände:', {
            glaswaendeConfig,
            typ: config.typ,
            breite: config.breite,
            tiefe: config.tiefe
        });

        const seiten = ['links', 'rechts', 'vorne', 'hinten'];

        seiten.forEach(seite => {
            const seitenConfig = glaswaendeConfig[seite] || { typ: 'keine', istTuer: false };
            
            // Bei Wandanbau: Hintere Seite überspringen
            if (seite === 'hinten' && config.typ === 'wandanbau') {
                this.logger.debug('Hinten übersprungen (Wandanbau)');
                return;
            }

            if (seitenConfig.typ !== 'keine') {
                const glaswand = this.erstelleGlaswandFuerSeite(
                    seite,
                    seitenConfig,
                    config,
                    abhaengig
                );
                this.gruppe.add(glaswand);

                this.addElement({
                    name: `glaswand_${seite}`,
                    mesh: glaswand,
                    typ: seitenConfig.typ,
                    seite: seite,
                    istTuer: seitenConfig.istTuer
                });
            }
        });

        this.logger.info(`${this.elemente.length} Glaswände erstellt`);
        return this.gruppe;
    }

    /**
     * Alias für erstelleGlaswaende (Component3D Interface)
     * @returns {THREE.Group}
     */
    create() {
        return this.erstelleGlaswaende();
    }

    /**
     * Aktualisiert die Glaswände
     * @returns {THREE.Group}
     */
    aktualisiere() {
        return this.erstelleGlaswaende();
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Räumt alle Ressourcen auf
     */
    dispose() {
        // Glas-Materialien disposen
        this.glasMaterialien.forEach(material => {
            if (material && material.dispose) {
                material.dispose();
            }
        });
        this.glasMaterialien.clear();

        // Rahmen-Materialien disposen
        this.rahmenMaterialien.forEach(material => {
            if (material && material.dispose) {
                material.dispose();
            }
        });
        this.rahmenMaterialien.clear();

        // Basis-Cleanup
        super.dispose();
    }
}
