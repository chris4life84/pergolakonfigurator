/**
 * Gläser-Komponente für den Pergola-Konfigurator
 *
 * Erstellt und verwaltet die Glasflächen auf dem Dach der Pergola
 * inklusive seitlicher und hinterer Auflager-Profile.
 *
 * Refactored: Erweitert Component3D für einheitliche API
 */

import { Component3D } from "../core/Component3D.js";
import { ProfileKonfiguration } from "../config/ProfileKonfiguration.js";
import { createSmoothBoxGeometry } from "../utils/geometry.js";
import { MaterialManager } from "../core/MaterialManager.js";
import { COMPONENT_NAMES, ROOF_TYPES } from "../constants/index.js";

/**
 * Glas-Material-Konfigurationen
 * @type {Object<string, object>}
 */
const GLAS_MATERIALIEN = {
    klar: {
        baseColor: 0xd4f1f9,
        attenuationColor: 0xc8e6ef,
        attenuationDistance: 2.8,
        transmission: 0.92,
        roughness: 0.05,
        thickness: 0.055,
        ior: 1.52,
        specularIntensity: 0.5
    },
    matt: {
        baseColor: 0xdae7e2,
        attenuationColor: 0xe90df1,
        attenuationDistance: 2.2,
        transmission: 0.3,
        roughness: 0.86,
        thickness: 0.095,
        ior: 1,
        specularIntensity: 0.015
    },
    grau: {
        baseColor: 0xc2bfcf,
        attenuationColor: 0xbbe1d8,
        attenuationDistance: 2.1,
        transmission: 0.32,
        roughness: 0.84,
        thickness: 0.07,
        ior: 1,
        specularIntensity: 0.018
    },
    bronze: {
        baseColor: 0xd9dea9,
        attenuationColor: 0xe0fea7,
        attenuationDistance: 2.3,
        transmission: 0.31,
        roughness: 0.85,
        thickness: 0.078,
        ior: 1,
        specularIntensity: 0.018
    }
};

/**
 * Glas-Dimensionskonstanten
 */
const GLAS_CONFIG = {
    MIN_BREITE: 0.7,
    MAX_BREITE: 0.85,
    GAP_BREITE: 0.02,
    MAX_LAENGE: 3,
    GAP_TIEFE: 0.005,
    DICKE: 0.008
};

/**
 * Klasse zur Erstellung und Verwaltung von Glasflächen
 * @extends Component3D
 */
export class Glaeser extends Component3D {
    /**
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     * @param {object} laengstraegerInstanz - Referenz zur Längsträger-Komponente
     */
    constructor(koordinatenSystem, konfiguration, laengstraegerInstanz) {
        super(COMPONENT_NAMES.GLAESER, koordinatenSystem, konfiguration);

        /** @type {object} Referenz zur Längsträger-Komponente */
        this.laengstraegerInstanz = laengstraegerInstanz;

        /** @type {ProfileKonfiguration} */
        this.profileKonfig = new ProfileKonfiguration();

        // Konfigurationswerte aus GLAS_CONFIG
        this.MIN_GLAS_BREITE = GLAS_CONFIG.MIN_BREITE;
        this.MAX_GLAS_BREITE = GLAS_CONFIG.MAX_BREITE;
        this.GAP_BREITE = GLAS_CONFIG.GAP_BREITE;
        this.MAX_LAENGE = GLAS_CONFIG.MAX_LAENGE;
        this.GAP_TIEFE = GLAS_CONFIG.GAP_TIEFE;
        this.DICKE = GLAS_CONFIG.DICKE;
    }

    // ========================================================================
    // MATERIAL-ERSTELLUNG
    // ========================================================================

    /**
     * Erzeugt das Glas-Material
     * @param {string} farbe - Glasfarbe (klar, matt, grau, bronze)
     * @returns {THREE.MeshPhysicalMaterial}
     */
    erzeugeGlasMaterial(farbe) {
        const materialConfig = GLAS_MATERIALIEN[farbe] || GLAS_MATERIALIEN.klar;

        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(materialConfig.baseColor),
            transparent: true,
            opacity: 0.3,
            roughness: materialConfig.roughness,
            metalness: 0,
            transmission: materialConfig.transmission,
            thickness: materialConfig.thickness,
            attenuationColor: new THREE.Color(materialConfig.attenuationColor),
            attenuationDistance: materialConfig.attenuationDistance,
            ior: materialConfig.ior,
            specularIntensity: materialConfig.specularIntensity,
            specularColor: new THREE.Color(0xffffff),
            side: THREE.DoubleSide,
            dithering: false,
            reflectivity: 0.5
        });

        material.clearcoat = 0.35;
        material.clearcoatRoughness = 0.28;
        material.sheen = 0;
        material.envMapIntensity = 0.45;
        material.toneMapped = true;

        return material;
    }

    // ========================================================================
    // BERECHNUNGEN
    // ========================================================================

    /**
     * Berechnet die Glasbreiten für die gegebene Pergolabreite
     * @param {number} gesamtBreite - Gesamtbreite
     * @param {number} aeussererAuflager - Äußerer Auflagerbereich
     * @param {number} mittlererAuflager - Mittlerer Auflagerbereich
     * @returns {object}
     */
    berechneBreiten(gesamtBreite, aeussererAuflager, mittlererAuflager) {
        const minBreite = this.MIN_GLAS_BREITE;
        const maxBreite = this.MAX_GLAS_BREITE;
        const gapBreite = this.GAP_BREITE;

        const innerMin = minBreite - 2 * mittlererAuflager;
        const innerMax = maxBreite - 2 * mittlererAuflager;
        const outerMin = minBreite - (aeussererAuflager + mittlererAuflager + gapBreite / 2);
        const outerMax = maxBreite - (aeussererAuflager + mittlererAuflager + gapBreite / 2);

        for (let anzahl = 2; anzahl <= 20; anzahl++) {
            const verfuegbar = gesamtBreite - 2 * aeussererAuflager - (anzahl - 1) * (2 * mittlererAuflager + gapBreite) - gapBreite;

            if (verfuegbar <= 0) continue;

            const zielBreite = (minBreite + maxBreite) / 2;
            let innerClear = Math.min(Math.max(zielBreite - 2 * mittlererAuflager, innerMin), innerMax);
            let outerClear = (verfuegbar - (anzahl - 2) * innerClear) / 2;
            let outerGlas = outerClear + aeussererAuflager + mittlererAuflager + gapBreite / 2;

            if (outerGlas < minBreite) {
                outerClear = outerMin;
                innerClear = (verfuegbar - 2 * outerClear) / (anzahl - 2);
            }

            if (outerGlas > maxBreite) {
                outerClear = outerMax;
                innerClear = (verfuegbar - 2 * outerClear) / (anzahl - 2);
            }

            const innerGlas = innerClear + 2 * mittlererAuflager;
            outerGlas = outerClear + aeussererAuflager + mittlererAuflager + gapBreite / 2;

            if (!(innerGlas >= minBreite - 1e-6 && innerGlas <= maxBreite + 1e-6 &&
                  outerGlas >= minBreite - 1e-6 && outerGlas <= maxBreite + 1e-6)) {
                continue;
            }

            const glasBreiten = [];
            const lichtabstaende = [];

            for (let i = 0; i < anzahl; i++) {
                if (i === 0 || i === anzahl - 1) {
                    glasBreiten.push(outerGlas);
                } else {
                    glasBreiten.push(innerGlas);
                }
            }

            lichtabstaende.push(outerClear);
            for (let i = 0; i < Math.max(0, anzahl - 3); i++) {
                lichtabstaende.push(innerClear);
            }

            return {
                n: anzahl,
                glasBreiten,
                lichtabstaende,
                innerClear,
                outerClear
            };
        }

        return {
            n: 0,
            glasBreiten: [],
            lichtabstaende: []
        };
    }

    /**
     * Berechnet die Glaslängen für die gegebene Tiefe
     * @param {number} gesamtTiefe - Gesamttiefe
     * @param {object} config - Konfiguration
     * @returns {object}
     */
    berechneLaengen(gesamtTiefe, config) {
        const neigungRad = (config.neigung * Math.PI) / 180;
        const neigungsFaktor = 1 / Math.cos(neigungRad);
        const maxHorizontaleLaenge = this.MAX_LAENGE / neigungsFaktor;

        let reihen = Math.max(1, Math.ceil(gesamtTiefe / maxHorizontaleLaenge));

        // Spezialfall: Bei 6m Tiefe immer 2 Reihen
        if (Math.abs(gesamtTiefe - 6) <= 0.05) {
            reihen = 2;
        }

        const gesamtGaps = (reihen - 1) * this.GAP_TIEFE;
        const ueberstand = config.regenwasserAbfluss === "glasueberstand" ? 0.1 : 0;
        const horizontaleLaenge = (gesamtTiefe - gesamtGaps) / reihen;
        const laenge = horizontaleLaenge * neigungsFaktor;

        this.logger.debug("berechneLaengen:", {
            gesamttiefe: gesamtTiefe,
            reihen,
            gesamtGaps,
            horizontaleLaenge,
            laenge,
            neigung: config.neigung,
            neigungsFaktor: neigungsFaktor.toFixed(4),
            glasUeberstand: ueberstand,
            regenwasserAbfluss: config.regenwasserAbfluss
        });

        return { reihen, laenge, ueberstand };
    }

    /**
     * Berechnet die Längsträger-Oberkante bei einer Z-Position
     * @param {object} laengstraeger - Längsträger-Objekt
     * @param {number} zPos - Z-Position
     * @returns {number|null}
     */
    berechneLaengstraegerOberkanteBeiZ(laengstraeger, zPos) {
        const ref = laengstraeger?.referenzpunkte;
        if (!ref?.start || !ref?.ende) return null;

        const startZ = ref.start.z;
        const deltaZ = ref.ende.z - startZ;
        const faktor = deltaZ !== 0 ? (zPos - startZ) / deltaZ : 0;

        const interpolierteY = ref.start.y + (ref.ende.y - ref.start.y) * faktor;
        return interpolierteY + (laengstraeger.abmessungen?.hoehe || 0);
    }

    // ========================================================================
    // HAUPTMETHODE
    // ========================================================================

    /**
     * Erstellt alle Glasflächen
     * @returns {THREE.Group}
     */
    erstelleGlaeser() {
        const config = this.konfiguration.gibAktuelleKonfiguration();
        const glasGruppe = new THREE.Group();
        glasGruppe.name = "Glaeser";

        // Bei EPDM-Flachdach nur Auflager erstellen
        const nurAuflagerBeiEPDM = config.dachTyp === ROOF_TYPES.EPDM && Math.abs(config.neigung) <= 1e-6;

        // Bei EPDM mit Neigung keine Gläser
        if (config.dachTyp === ROOF_TYPES.EPDM && !nurAuflagerBeiEPDM) {
            return glasGruppe;
        }

        // Referenzpunkte holen
        const laengstraegerRef = this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz");
        const quertraegerRef = this.koordinatenSystem.gibReferenzpunkt("quertraegerReferenz");

        if (!laengstraegerRef || !quertraegerRef) {
            return glasGruppe;
        }

        // Profil-Dimensionen
        const profil = this.profileKonfig.gibAktuellesProfil();
        const profilTiefe = profil?.abmessungen?.tiefe || 0.08;
        const outerSupport = (profil?.id || "").startsWith("200x120") ? 0.08 : 0.04;

        // Innenkanten berechnen
        const linksX = laengstraegerRef.links?.start?.x ?? 0;
        const rechtsX = laengstraegerRef.rechts?.start?.x ?? config.breite;
        const innenkanteLinks = linksX - profilTiefe / 2 + profilTiefe;
        const innenkanteRechts = rechtsX + profilTiefe / 2 - profilTiefe;
        const innereLichtBreite = Math.max(0, innenkanteRechts - innenkanteLinks);

        // Mittelträger-Profil
        const mitteltraegerProfil = this.profileKonfig.gibMitteltraegerProfil(config);
        const mitteltraegerTiefe = mitteltraegerProfil?.abmessungen?.tiefe || 0.08;
        const middleSupport = Math.max(0.03, (mitteltraegerTiefe - this.GAP_BREITE) / 2);

        // Glasberechnung aus KoordinatenSystem
        const glasBerechnung = this.koordinatenSystem.glasBerechnung;
        const hatGlasBerechnung = glasBerechnung && glasBerechnung.anzahlGlaeser > 0;

        if (!hatGlasBerechnung) {
            this.logger.warn("Keine Glasberechnung vorhanden! Gläser können nicht erstellt werden.");
            this.logger.warn("Hinweis: Seitliche Auflager werden dennoch versucht (sofern Flachdach)");
        }

        const anzahlGlaeser = hatGlasBerechnung ? glasBerechnung.anzahlGlaeser : 0;
        const glasBreiten = hatGlasBerechnung ? glasBerechnung.glasBreiten : [];
        const mitteltraegerX = laengstraegerRef.zwischen?.map(m => m.start.x) || [];
        const panelSpans = [];

        if (hatGlasBerechnung) {
            this.logger.debug("Verwende Glasberechnung aus KoordinatenSystem:", {
                anzahlGlaeser,
                glasBreiten,
                lichtabstaende: glasBerechnung.lichtabstaende,
                mitteltraegerPositionen: mitteltraegerX
            });
        }

        // Längenberechnung
        const { reihen: rowsCount, laenge: glasLaenge, ueberstand } = this.berechneLaengen(config.tiefe, config);

        // Höhenberechnung
        const rahmenHoehe = this.profileKonfig.gibAktuellesProfil()?.abmessungen?.breite || 0;
        const seitenProfilBreite = 0.04;
        const istFlachdach = config.neigung === 0;
        const istGlasdach = config.dachTyp === ROOF_TYPES.GLAS;
        const mittelProfilHoehe = this.profileKonfig.gibMitteltraegerProfil(config)?.abmessungen?.breite || rahmenHoehe;
        const glasAuflageHoehe = istFlachdach ? mittelProfilHoehe : rahmenHoehe;

        // Höhen-Interpolation
        const berechneHoeheBeiZ = (zPos) => {
            const abhaengigeWerte = this.konfiguration.berechneAbhaengigeWerte();
            return this.koordinatenSystem.interpoliereHoehe(
                0, abhaengigeWerte.vordereHoehe,
                config.tiefe, abhaengigeWerte.hintereHoehe,
                zPos
            );
        };

        // Profil-spezifische Prüfung
        const profilId = ((profil?.id || config.pfostenProfil || "") + "");
        const isProfil200x100 = profilId.startsWith("200x100");

        // Mittelträger für Höhenberechnung
        const mitteltraeger = this.laengstraegerInstanz?.gibAlleLaengstraeger?.().find(
            t => typeof t.name === "string" && t.name.startsWith("mitte")
        );
        const mtStart = mitteltraeger?.referenzpunkte?.start;
        const mtEnde = mitteltraeger?.referenzpunkte?.ende;

        // Glasoberkante auf Mittelträger berechnen
        const glasOberkanteMitteltraeger = (zPos) => {
            if (!mtStart || !mtEnde) return null;

            const hoehe = mitteltraeger?.abmessungen?.hoehe || 0;
            const hintenIstStart = mtStart.z > mtEnde.z;

            let startTop = mtStart.y + hoehe;
            let endeTop = mtEnde.y + hoehe;

            if (istFlachdach) {
                if (hintenIstStart) {
                    startTop -= 0.008;
                } else {
                    endeTop -= 0.008;
                }
            }

            const deltaZ = mtEnde.z - mtStart.z;
            if (Math.abs(deltaZ) < 1e-6) return startTop;

            const faktor = (zPos - mtStart.z) / deltaZ;
            return startTop + (endeTop - startTop) * faktor;
        };

        // Neigungswinkel
        const mitteltraegerNeigungswinkel = istFlachdach && mtStart && mtEnde
            ? Math.atan2(
                (glasOberkanteMitteltraeger(mtEnde.z) || mtEnde.y) -
                (glasOberkanteMitteltraeger(mtStart.z) || mtStart.y),
                mtEnde.z - mtStart.z || 1e-6
            )
            : null;

        const neigungswinkel = mitteltraegerNeigungswinkel !== null
            ? mitteltraegerNeigungswinkel
            : laengstraegerRef.links?.neigungswinkel || 0;

        // Glas-Auflage-Y berechnen
        const glasAuflageY = (zPos) => {
            if (istFlachdach && mitteltraeger) {
                const y = glasOberkanteMitteltraeger(zPos);
                if (Number.isFinite(y)) return y;
            }
            return berechneHoeheBeiZ(zPos) + glasAuflageHoehe;
        };

        // Startposition
        let currentZ = -ueberstand;

        this.logger.debug("Glas-Berechnung:", {
            innereLichtBreite,
            spalten: anzahlGlaeser,
            glasBreiten,
            outerSupport,
            middleSupport,
            mitteltraegerX,
            innenkanteLinks,
            innenkanteRechts,
            glasLaenge,
            ueberstandVorne: ueberstand,
            reihen: rowsCount,
            startFront: currentZ
        });

        // Glas-Material
        const glasMaterial = this.erzeugeGlasMaterial(config.glasFarbe);
        glasMaterial.depthWrite = false;
        glasMaterial.depthTest = true;
        glasMaterial.alphaHash = false;
        glasMaterial.needsUpdate = true;
        glasMaterial.polygonOffset = true;
        glasMaterial.polygonOffsetFactor = -0.5;
        glasMaterial.polygonOffsetUnits = -0.5;

        // Seitliche Auflager erstellen
        const fuegeSeitlicheAuflagerHinzu = () => {
            if (Math.abs(config.neigung) > 1e-6 ||
                !(config.dachTyp === ROOF_TYPES.GLAS || config.dachTyp === ROOF_TYPES.EPDM)) {
                return;
            }

            const breiteProfil = 0.04;
            const hoeheProfil = 0.04;
            const auflagerMaterial = MaterialManager.gibStrukturMaterial({
                teil: "seitlicheGlasauflage",
                config
            });

            const erstelleAuflager = (ref, xPos) => {
                const startZ = ref?.start?.z;
                const endeZ = ref?.ende?.z;

                if (!Number.isFinite(startZ) || !Number.isFinite(endeZ)) return null;

                const zMin = Math.min(startZ, endeZ);
                const zMax = Math.max(startZ, endeZ);
                const effektiveLaenge = Math.max(0.05, zMax - zMin);
                const centerZ = (zMin + zMax) / 2;

                const geometrie = createSmoothBoxGeometry(breiteProfil, hoeheProfil, effektiveLaenge);
                const mesh = new THREE.Mesh(geometrie, auflagerMaterial);

                const yVorne = glasAuflageY(zMin);
                const yHinten = glasAuflageY(zMax);
                const yPos = (yVorne + yHinten) / 2 - hoeheProfil / 2;

                mesh.position.set(xPos, yPos, centerZ);
                mesh.rotation.x = -neigungswinkel;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.name = "SeitlicheGlasauflage";

                return mesh;
            };

            const linkeX = innenkanteLinks + breiteProfil / 2;
            const rechteX = innenkanteRechts - breiteProfil / 2;

            const linkesAuflager = erstelleAuflager(laengstraegerRef.links, linkeX);
            const rechtesAuflager = erstelleAuflager(laengstraegerRef.rechts, rechteX);

            if (linkesAuflager) glasGruppe.add(linkesAuflager);
            if (rechtesAuflager) glasGruppe.add(rechtesAuflager);
        };

        // Gläser erstellen
        for (let reihe = 0; reihe < rowsCount && hatGlasBerechnung && !nurAuflagerBeiEPDM; reihe++) {
            const zusatzUeberstand = reihe === 0 ? ueberstand : 0;
            const rinneOffset = reihe === 0 && config.regenwasserAbfluss === "rinne" ? 0.03 : 0;
            const aktuelleGlasLaenge = glasLaenge + zusatzUeberstand - rinneOffset;
            const startZ = currentZ + rinneOffset;

            for (let spalte = 0; spalte < anzahlGlaeser; spalte++) {
                let linksX, rechtsX, breite, centerX;

                if (anzahlGlaeser === 1) {
                    linksX = innenkanteLinks - outerSupport;
                    rechtsX = innenkanteRechts + outerSupport;
                    breite = rechtsX - linksX;
                    centerX = (linksX + rechtsX) / 2;
                } else if (spalte === 0) {
                    linksX = innenkanteLinks - outerSupport;
                    rechtsX = mitteltraegerX.length > 0
                        ? mitteltraegerX[0] - this.GAP_BREITE / 2
                        : innenkanteLinks - outerSupport + glasBreiten[spalte];
                    breite = rechtsX - linksX;
                    centerX = (linksX + rechtsX) / 2;
                } else if (spalte === anzahlGlaeser - 1) {
                    linksX = mitteltraegerX.length > 0
                        ? mitteltraegerX[mitteltraegerX.length - 1] + this.GAP_BREITE / 2
                        : innenkanteRechts + outerSupport - glasBreiten[spalte];
                    rechtsX = innenkanteRechts + outerSupport;
                    breite = rechtsX - linksX;
                    centerX = (linksX + rechtsX) / 2;
                } else {
                    linksX = mitteltraegerX[spalte - 1] + this.GAP_BREITE / 2;
                    rechtsX = mitteltraegerX[spalte] - this.GAP_BREITE / 2;
                    breite = rechtsX - linksX;
                    centerX = (linksX + rechtsX) / 2;
                }

                // Flachdach-Anpassung für Randgläser
                if (istFlachdach) {
                    if (spalte === 0) {
                        linksX += seitenProfilBreite;
                        breite = rechtsX - linksX;
                        centerX = (linksX + rechtsX) / 2;
                    } else if (spalte === anzahlGlaeser - 1) {
                        rechtsX -= seitenProfilBreite;
                        breite = rechtsX - linksX;
                        centerX = (linksX + rechtsX) / 2;
                    }
                }

                // Panel-Spans speichern für hintere Auflager
                if (!panelSpans[spalte]) {
                    panelSpans[spalte] = [linksX, rechtsX];
                }

                // Kürzung für letzte Reihe bei Flachdach
                const trimBack = istFlachdach && istGlasdach && reihe === rowsCount - 1
                    ? (isProfil200x100 ? 0.05 : 0.04)
                    : 0;
                const effectiveLen = Math.max(0.05, aktuelleGlasLaenge - trimBack);

                // Geometrie und Mesh erstellen
                const geometrie = createSmoothBoxGeometry(breite, this.DICKE, effectiveLen);
                const mesh = new THREE.Mesh(geometrie, glasMaterial);

                const zPos = startZ + effectiveLen / 2;
                const yPos = glasAuflageY(zPos) + this.DICKE / 2;

                mesh.position.set(centerX, yPos, zPos);
                mesh.rotation.x = -neigungswinkel;
                mesh.castShadow = false;
                mesh.receiveShadow = false;
                mesh.renderOrder = 5;
                mesh.name = `Glas_r${reihe + 1}_c${spalte + 1}`;

                glasGruppe.add(mesh);

                this.logger.debug(`Glas ${mesh.name}:`, {
                    position: { x: centerX, y: yPos, z: zPos },
                    dimensionen: { breite, dicke: this.DICKE, laenge: effectiveLen }
                });
            }

            currentZ += glasLaenge + this.GAP_TIEFE + zusatzUeberstand;
        }

        // Hintere Auflager-Profile (nur Flachdach)
        if (istFlachdach && panelSpans.length) {
            const auflagerMaterial = MaterialManager.gibStrukturMaterial({
                teil: "seitlicheGlasauflageHinten",
                config
            });

            const profilBreite = 0.04;
            const profilHoehe = 0.04;
            const backZ = config.tiefe - 0.04;

            panelSpans.forEach(span => {
                if (!span || span.length < 2) return;

                const xs = span[0];
                const xe = span[1];

                if (!Number.isFinite(xs) || !Number.isFinite(xe) || xe <= xs) return;

                const breite = Math.max(0, xe - xs);
                const geometrie = createSmoothBoxGeometry(breite, profilHoehe, profilBreite);
                const mesh = new THREE.Mesh(geometrie, auflagerMaterial);

                const zPos = backZ - profilBreite / 2;
                const yPos = glasAuflageY(backZ) - profilHoehe / 2;

                mesh.position.set((xs + xe) / 2, yPos, zPos);
                mesh.rotation.x = -neigungswinkel;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.name = "SeitlicheGlasauflageHinten";

                glasGruppe.add(mesh);
            });
        }

        // Seitliche Auflager hinzufügen
        fuegeSeitlicheAuflagerHinzu();

        return glasGruppe;
    }

    // ========================================================================
    // COMPONENT3D INTERFACE
    // ========================================================================

    /**
     * Erstellt die Komponente (Component3D Interface)
     * @returns {THREE.Group}
     */
    create() {
        return this.erstelleGlaeser();
    }

    /**
     * Gibt alle Elemente zurück (Component3D Interface)
     * @returns {THREE.Object3D[]}
     */
    getAll() {
        const glaeser = this.create();
        return [...glaeser.children];
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
        return this.getGroup();
    }
}
