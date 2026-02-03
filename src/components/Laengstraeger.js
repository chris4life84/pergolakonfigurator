/**
 * Längsträger-Komponente für den Pergola-Konfigurator
 *
 * Erstellt und verwaltet die Längsträger (links, mitte, rechts)
 * inklusive Glasführungsschienen und L-förmiger Schienen.
 *
 * Refactored: Erweitert Component3D für einheitliche API
 */

import { Component3D } from "../core/Component3D.js";
import { ProfileKonfiguration } from "../config/ProfileKonfiguration.js";
import { MaterialManager } from "../core/MaterialManager.js";
import { disposeEdgeHighlights } from "../utils/edgeHighlight.js";
import { ROOF_TYPES, COMPONENT_NAMES } from "../constants/index.js";

/**
 * Klasse zur Erstellung und Verwaltung von Längsträgern
 * @extends Component3D
 */
export class Laengstraeger extends Component3D {
    /**
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     * @param {object} pfostenInstanz - Referenz zur Pfosten-Komponente
     */
    constructor(koordinatenSystem, konfiguration, pfostenInstanz) {
        super(COMPONENT_NAMES.LAENGSTRAEGER, koordinatenSystem, konfiguration);

        /** @type {object} Referenz zur Pfosten-Komponente */
        this.pfostenInstanz = pfostenInstanz;

        /** @type {ProfileKonfiguration} */
        this.profileKonfig = new ProfileKonfiguration();

        /** @type {Array} Liste aller Längsträger */
        this.laengstraegerListe = [];

        /** @type {THREE.Group} */
        this.laengstraegerGruppe = new THREE.Group();
        this.laengstraegerGruppe.name = "LaengstraegerGruppe";

        // Gruppe der Basisklasse überschreiben
        this.gruppe = this.laengstraegerGruppe;
    }

    // ========================================================================
    // HAUPTMETHODEN
    // ========================================================================

    /**
     * Erstellt alle Längsträger basierend auf Referenzpunkten
     * @returns {THREE.Group}
     */
    erstelleLaengstraeger() {
        this.entferneLaengstraeger();

        const config = this.konfiguration.gibAktuelleKonfiguration();
        const referenzpunkte = this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz");

        if (!referenzpunkte) {
            this.logger.warn("Keine Längsträger-Referenzpunkte gefunden");
            return this.laengstraegerGruppe;
        }

        const traegerDaten = [];

        // Links
        if (referenzpunkte.links) {
            traegerDaten.push({ name: "links", daten: referenzpunkte.links });
        }

        // Zwischen (mittlere Träger)
        if (Array.isArray(referenzpunkte.zwischen)) {
            referenzpunkte.zwischen.forEach((zwischen, index) => {
                traegerDaten.push({ name: `mitte_${index + 1}`, daten: zwischen });
            });
        }

        // Rechts
        if (referenzpunkte.rechts) {
            traegerDaten.push({ name: "rechts", daten: referenzpunkte.rechts });
        }

        // Alle Träger erstellen
        traegerDaten.forEach(traeger => {
            const ergebnis = this.erstelleEinzelnenLaengstraeger(traeger.name, traeger.daten, config);
            if (ergebnis) {
                this.laengstraegerListe.push(ergebnis);
                this.laengstraegerGruppe.add(ergebnis.mesh);
                if (ergebnis.glasSchienen) {
                    this.laengstraegerGruppe.add(ergebnis.glasSchienen);
                }
            }
        });

        return this.laengstraegerGruppe;
    }

    /**
     * Erstellt einen einzelnen Längsträger
     * @param {string} name - Name des Trägers (links, rechts, mitte_1, etc.)
     * @param {object} daten - Referenzpunktdaten (start, ende)
     * @param {object} config - Aktuelle Konfiguration
     * @returns {object|null}
     */
    erstelleEinzelnenLaengstraeger(name, daten, config) {
        if (!daten?.start || !daten?.ende) {
            this.logger.warn(`Unvollständige Referenzpunkte für Längsträger (${name}).`);
            return null;
        }

        // Länge berechnen
        const laenge = Math.sqrt(
            Math.pow(daten.ende.x - daten.start.x, 2) +
            Math.pow(daten.ende.y - daten.start.y, 2) +
            Math.pow(daten.ende.z - daten.start.z, 2)
        );

        // Ist es ein Mittelträger?
        const istMitteltraeger = typeof name === "string" && !["links", "rechts"].includes(name.toLowerCase());

        // Offset für EPDM-Mittelträger
        const epdmOffset = config.dachTyp === ROOF_TYPES.EPDM && istMitteltraeger ? 0.02 : 0;

        // Profil ermitteln
        const mitteltraegerProfil = this.profileKonfig.gibMitteltraegerProfil(config);
        const aktuellesProfil = istMitteltraeger && mitteltraegerProfil
            ? mitteltraegerProfil
            : this.profileKonfig.gibAktuellesProfil();

        const abmessungen = aktuellesProfil?.abmessungen || {};
        const profilTiefe = abmessungen.tiefe || 0;
        const profilBreite = abmessungen.breite || 0;

        // Modifizierte Start-/Endpunkte für Flachdach-Neigung
        let modStart = { ...daten.start };
        let modEnde = { ...daten.ende };

        // Flachdach erkennen: neigung === 0
        const istFlachdach = config.neigung === 0;

        this.logger.debug(`Längsträger ${name}:`, {
            dachTyp: config.dachTyp,
            neigung: config.neigung,
            istFlachdach,
            istMitteltraeger,
            bedingungErfuellt: istFlachdach && istMitteltraeger
        });

        // Flachdach-Anpassungen für Mittelträger
        if (istFlachdach && istMitteltraeger) {
            this.berechneFlachdachMitteltraegerOffsets(modStart, modEnde, daten, config, name);
        }

        // Geometrie erzeugen
        const { geometrie, center } = this.erzeugeLaengstraegerGeometrie(
            modStart, modEnde, profilTiefe, profilBreite
        );

        // Material erstellen
        const material = this.erstelleLaengstraegerMaterial(config);

        // Mesh erstellen
        const mesh = new THREE.Mesh(geometrie, material);
        mesh.position.set(center.x, center.y - epdmOffset, center.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `Laengstraeger_${name}`;

        // Glasführungsschienen für innere Längsträger bei Glas-Dächern
        const glasSchienen = this.erzeugeGlasfuehrungsschienen(name, istMitteltraeger, modStart, modEnde, config);

        // L-förmige Schienen für äußere Längsträger (nur bei Pultdach)
        const istRahmen = ["links", "rechts"].includes(name.toLowerCase());
        const lSchienen = this.erzeugeLFoermigeSchienen(name, istRahmen, modStart, modEnde, config);

        // Schienen-Gruppe erstellen
        const schienenGruppe = new THREE.Group();
        schienenGruppe.name = `Glasschienen_${name}`;

        if (glasSchienen && glasSchienen.length > 0) {
            glasSchienen.forEach(schiene => schienenGruppe.add(schiene));
        }
        if (lSchienen && lSchienen.length > 0) {
            lSchienen.forEach(schiene => schienenGruppe.add(schiene));
        }

        // Flachdach: Innere Längsträger hinten um 8mm absenken
        if (istFlachdach && istMitteltraeger) {
            this.senkeHinteresEndeAb(geometrie, modStart, modEnde, center, name);
        }

        return {
            name,
            mesh,
            glasSchienen: schienenGruppe,
            geometrie,
            material,
            referenzpunkte: {
                start: { ...modStart },
                ende: { ...modEnde },
                mittelpunkt: { ...center }
            },
            abmessungen: {
                laenge,
                breite: profilTiefe,
                hoehe: profilBreite
            },
            eigenschaften: {
                neigungswinkel: daten.neigungswinkel,
                neigungGrad: (180 * daten.neigungswinkel) / Math.PI,
                seite: name
            }
        };
    }

    /**
     * Berechnet Flachdach-Mittelträger-Offsets
     * @private
     */
    berechneFlachdachMitteltraegerOffsets(modStart, modEnde, daten, config, name) {
        const quertraegerProfil = this.profileKonfig.gibAktuellesProfil();
        const quertraegerHoehe = quertraegerProfil?.abmessungen?.breite || 0;
        const mitteltraegerProfil = this.profileKonfig.gibMitteltraegerProfil(config) || quertraegerProfil;
        const mitteltraegerHoehe = mitteltraegerProfil?.abmessungen?.breite || 0;

        const istEPDM = config.dachTyp === ROOF_TYPES.EPDM;
        const istProfil200x100 = config?.pfostenProfil === "200x100x4" || quertraegerProfil?.id === "200x100x4";

        if (istEPDM) {
            if (istProfil200x100) {
                // Speziell für 200×100 + EPDM
                const absenkung = Math.max(quertraegerHoehe - mitteltraegerHoehe, 0);
                if (daten.start.z > daten.ende.z) {
                    modEnde.y = daten.ende.y - absenkung;
                    this.logger.debug(`Flachdach-EPDM-Mittelträger ${name} (200×100): start=hinten, ende=vorne (ABSENKUNG vorne)`);
                } else {
                    modStart.y = daten.start.y - absenkung + 0.04;
                    this.logger.debug(`Flachdach-EPDM-Mittelträger ${name} (200×100): start=vorne, ende=hinten (ABSENKUNG vorne)`);
                }
                this.logger.debug(`Flachdach-EPDM-Mittelträger ${name} (200×100):`, {
                    startY: modStart.y,
                    endeY: modEnde.y,
                    hoehendifferenz: Math.abs(modStart.y - modEnde.y),
                    mitteltraegerHoehe,
                    quertraegerHoehe,
                    absenkung,
                    istProfil200x100
                });
            } else {
                // Bei EPDM-Folie (andere Profile)
                const anhebung = quertraegerHoehe - mitteltraegerHoehe;
                if (daten.start.z > daten.ende.z) {
                    modEnde.y = daten.ende.y + anhebung;
                    this.logger.debug(`Flachdach-EPDM-Mittelträger ${name}: start=hinten, ende=vorne (ANHEBUNG vorne)`);
                } else {
                    modStart.y = daten.start.y + anhebung - 0.1;
                    this.logger.debug(`Flachdach-EPDM-Mittelträger ${name}: start=vorne, ende=hinten (ANHEBUNG vorne)`);
                }
                this.logger.debug(`Flachdach-EPDM-Mittelträger ${name}:`, {
                    startY: modStart.y,
                    endeY: modEnde.y,
                    hoehendifferenz: Math.abs(modStart.y - modEnde.y),
                    mitteltraegerHoehe,
                    quertraegerHoehe,
                    anhebung
                });
            }
        } else {
            // Bei Glas: Mittelträger neigen sich von hinten nach vorne
            const absenkung = quertraegerHoehe - mitteltraegerHoehe;
            if (daten.start.z > daten.ende.z) {
                modEnde.y = daten.ende.y - absenkung;
                this.logger.debug(`Flachdach-Glas-Mittelträger ${name}: start=hinten, ende=vorne (ABSENKUNG vorne)`);
            } else {
                modStart.y = daten.start.y - absenkung;
                this.logger.debug(`Flachdach-Glas-Mittelträger ${name}: start=vorne, ende=hinten (ABSENKUNG vorne)`);
            }
            this.logger.debug(`Flachdach-Glas-Mittelträger ${name}:`, {
                startY: modStart.y,
                endeY: modEnde.y,
                hoehendifferenz: Math.abs(modStart.y - modEnde.y),
                mitteltraegerHoehe,
                quertraegerHoehe,
                absenkung
            });
        }
    }

    /**
     * Senkt das hintere Ende des Längsträgers um 8mm ab
     * @private
     */
    senkeHinteresEndeAb(geometrie, modStart, modEnde, center, name) {
        const posAttr = geometrie.attributes.position;
        if (!posAttr?.array) return;

        const arr = posAttr.array;
        const zielZ = Math.max(modStart.z, modEnde.z);
        const lokalZielZ = zielZ - center.z;

        this.logger.debug(`Absenkung Längsträger ${name}:`, {
            weltZielZ: zielZ,
            lokalZielZ,
            centerZ: center.z
        });

        let verticesGefunden = 0;
        for (let idx = 0; idx < arr.length; idx += 3) {
            const lokalZ = arr[idx + 2];
            if (Math.abs(lokalZ - lokalZielZ) < 0.01) {
                arr[idx + 1] -= 0.008; // 8mm nach unten
                verticesGefunden++;
            }
        }
        this.logger.debug(`${verticesGefunden} Vertices am hinteren Ende um 8mm abgesenkt`);

        posAttr.needsUpdate = true;
        geometrie.computeVertexNormals();
    }

    /**
     * Erstellt einen inneren Längsträger
     * @param {object} config - Konfiguration
     * @returns {object|null}
     */
    erstelleInnerenLaengstraeger(config) {
        const abhaengigeWerte = this.konfiguration.berechneAbhaengigeWerte();
        const rahmenProfil = this.profileKonfig.gibAktuellesProfil();
        const mitteltraegerProfil = this.profileKonfig.gibMitteltraegerProfil(config) || rahmenProfil;

        const halbeTiefe = rahmenProfil?.abmessungen?.tiefe ? rahmenProfil.abmessungen.tiefe / 2 : 0;
        const rahmenBreite = rahmenProfil?.abmessungen?.breite || 0;
        const mitteltraegerBreite = mitteltraegerProfil?.abmessungen?.breite || 0;
        const hoehendifferenz = Math.max(rahmenBreite - mitteltraegerBreite, 0);

        const halbeBreite = config.breite / 2;
        const daten = {
            start: {
                x: halbeBreite,
                y: abhaengigeWerte.vordereHoehe + hoehendifferenz,
                z: halbeTiefe
            },
            ende: {
                x: halbeBreite,
                y: abhaengigeWerte.hintereHoehe + hoehendifferenz,
                z: config.tiefe - halbeTiefe
            },
            neigungswinkel: Math.atan2(abhaengigeWerte.hoehenDifferenz, config.tiefe)
        };

        return this.erstelleEinzelnenLaengstraeger("mitte", daten, config);
    }

    // ========================================================================
    // GLASFÜHRUNGSSCHIENEN
    // ========================================================================

    /**
     * Erzeugt Glasführungsschienen für innere Längsträger
     * @param {string} traegerName - Name des Trägers
     * @param {boolean} istMitteltraeger - Ob Mittelträger
     * @param {object} startPunkt - Startpunkt
     * @param {object} endPunkt - Endpunkt
     * @param {object} config - Konfiguration
     * @returns {THREE.Mesh[]}
     */
    erzeugeGlasfuehrungsschienen(traegerName, istMitteltraeger, startPunkt, endPunkt, config) {
        // Nur für innere Längsträger und nur bei Glas-Dächern
        if (!istMitteltraeger || config.dachTyp === ROOF_TYPES.EPDM) {
            return [];
        }

        this.logger.debug(`Erstelle Glasführungsschienen für ${traegerName}`);
        const schienen = [];

        // Dimensionen
        const schienenBreite = 0.070;  // 70mm
        const schienenHoehe = 0.01;    // 10mm
        const glasDicke = 0.008;       // 8mm

        // Schienenlänge berechnen
        const profilTiefe = this.profileKonfig.gibAktuellesProfil()?.abmessungen?.tiefe || 0.08;
        const glasUeberstand = config.regenwasserAbfluss === "glasueberstand" ? 0.10 : -0.03;

        let verlaengerungVorne = profilTiefe / 2 + glasUeberstand;
        if (config.neigung > 0 && config.regenwasserAbfluss === "glasueberstand") {
            const rahmenBreite = this.profileKonfig.gibAktuellesProfil()?.abmessungen?.breite || 0.16;
            // Profil-spezifische Verlängerung
            if (Math.abs(rahmenBreite - 0.12) < 0.002) {
                verlaengerungVorne += 0;
            } else if (Math.abs(rahmenBreite - 0.16) < 0.002) {
                verlaengerungVorne += 0;
            } else if (Math.abs(rahmenBreite - 0.20) < 0.002) {
                verlaengerungVorne += 0;
            } else {
                verlaengerungVorne += 0.035;
            }
        }

        // Längsträger-Länge
        const laengstraegerLaenge = Math.sqrt(
            Math.pow(endPunkt.x - startPunkt.x, 2) +
            Math.pow(endPunkt.y - startPunkt.y, 2) +
            Math.pow(endPunkt.z - startPunkt.z, 2)
        );

        const schienenTiefe = laengstraegerLaenge + verlaengerungVorne;

        // Richtungsvektor
        const direction = new THREE.Vector3(
            endPunkt.x - startPunkt.x,
            endPunkt.y - startPunkt.y,
            endPunkt.z - startPunkt.z
        ).normalize();

        // Vorder-/Hinterpunkt bestimmen
        const istStartVorne = startPunkt.z < endPunkt.z;
        const vordererPunkt = istStartVorne ? startPunkt : endPunkt;
        const hintererPunkt = istStartVorne ? endPunkt : startPunkt;

        // Vorderen Punkt verlängern
        const verlaengerterVorderpunkt = {
            x: vordererPunkt.x + (istStartVorne ? -direction.x : direction.x) * verlaengerungVorne,
            y: vordererPunkt.y + (istStartVorne ? -direction.y : direction.y) * verlaengerungVorne,
            z: vordererPunkt.z + (istStartVorne ? -direction.z : direction.z) * verlaengerungVorne
        };

        // Bei Flachdach mit Glas: Hinterer Punkt 8mm absenken
        const hintererPunktAdjusted = { ...hintererPunkt };
        if (config.neigung === 0 && config.dachTyp === ROOF_TYPES.GLAS) {
            hintererPunktAdjusted.y -= 0.008;
        }

        // Mittelpunkt berechnen
        const centerX = (verlaengerterVorderpunkt.x + hintererPunktAdjusted.x) / 2;
        const centerY = (verlaengerterVorderpunkt.y + hintererPunktAdjusted.y) / 2;
        const centerZ = (verlaengerterVorderpunkt.z + hintererPunktAdjusted.z) / 2;

        // Richtung neu berechnen
        const actualDirection = new THREE.Vector3(
            hintererPunktAdjusted.x - verlaengerterVorderpunkt.x,
            hintererPunktAdjusted.y - verlaengerterVorderpunkt.y,
            hintererPunktAdjusted.z - verlaengerterVorderpunkt.z
        ).normalize();

        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), actualDirection);

        // Hauptschiene erstellen
        const schieneGeometry = new THREE.BoxGeometry(schienenBreite, schienenHoehe, schienenTiefe);
        const schieneMaterial = new THREE.MeshStandardMaterial({
            color: 0xc8c8c8,
            metalness: 0.9,
            roughness: 0.15,
            envMapIntensity: 0.8,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });

        const schieneMesh = new THREE.Mesh(schieneGeometry, schieneMaterial);

        // Y-Position berechnen
        const rahmenProfil = this.profileKonfig.gibAktuellesProfil();
        const laengstraegerProfil = this.profileKonfig.gibMitteltraegerProfil(config) || rahmenProfil;
        const rahmenHoehe = rahmenProfil?.abmessungen?.breite || 0.16;
        const laengstraegerHoehe = laengstraegerProfil?.abmessungen?.breite || 0.1;
        const profilDifferenz = rahmenHoehe - laengstraegerHoehe;
        const laengstraegerOberkante = centerY + (laengstraegerHoehe / 2);

        // Spezialfall: Flachdach + Glas
        let zusaetzlicheAbsenkung = 0;
        if (config.neigung === 0 && config.dachTyp === ROOF_TYPES.GLAS) {
            if (rahmenHoehe >= 0.159 && rahmenHoehe <= 0.161 && profilDifferenz >= 0.059) {
                zusaetzlicheAbsenkung = 0.010;
            } else if (rahmenHoehe >= 0.119 && rahmenHoehe <= 0.121) {
                zusaetzlicheAbsenkung = 0.020;
            } else if (rahmenHoehe >= 0.199 && rahmenHoehe <= 0.201) {
                zusaetzlicheAbsenkung = -0.02;
            }
        }

        // Pultdach-Offset
        let pultdachOffset = 0.061;
        if (config.neigung > 0) {
            if (Math.abs(laengstraegerHoehe - 0.12) < 0.001) {
                pultdachOffset = 0.060;
            } else if (Math.abs(laengstraegerHoehe - 0.10) < 0.001) {
                pultdachOffset = 0.050;
            } else if (Math.abs(laengstraegerHoehe - 0.08) < 0.001) {
                pultdachOffset = 0.040;
            } else {
                pultdachOffset = 0.080;
            }
        }

        const basisOffset = config.neigung > 0 ? pultdachOffset : 0.061;
        const glasOberkanteY = laengstraegerOberkante + glasDicke + basisOffset - zusaetzlicheAbsenkung;
        const schienenCenterY = glasOberkanteY + (schienenHoehe / 2);

        schieneMesh.position.set(centerX, schienenCenterY, centerZ);
        schieneMesh.quaternion.copy(quaternion);
        schieneMesh.castShadow = true;
        schieneMesh.receiveShadow = true;
        schieneMesh.name = `Glasfuehrungsschiene_${traegerName}`;
        schieneMesh.renderOrder = 10;
        schieneMaterial.depthWrite = true;
        schieneMaterial.depthTest = true;

        // Dezente Nuten hinzufügen
        const nutBreite = 0.008;
        const nutHoehe = 0.002;
        const nutAbstand = 0.018;

        for (let i = -1; i <= 1; i++) {
            const nutGeometry = new THREE.BoxGeometry(nutBreite, nutHoehe, schienenTiefe * 0.98);
            const nutMaterial = new THREE.MeshStandardMaterial({
                color: 0x808080,
                metalness: 0.5,
                roughness: 0.6
            });
            const nut = new THREE.Mesh(nutGeometry, nutMaterial);

            const lokalX = i * nutAbstand;
            const lokalY = schienenHoehe / 2 - nutHoehe / 2;

            const lokalPos = new THREE.Vector3(lokalX, lokalY, 0);
            lokalPos.applyQuaternion(quaternion);

            nut.position.set(
                centerX + lokalPos.x,
                schienenCenterY + lokalPos.y,
                centerZ + lokalPos.z
            );
            nut.quaternion.copy(quaternion);
            nut.castShadow = false;
            nut.receiveShadow = true;
            nut.name = `Nut_${traegerName}_${i}`;
            nut.renderOrder = 11;

            schienen.push(nut);
        }

        schienen.unshift(schieneMesh);
        return schienen;
    }

    // ========================================================================
    // L-FÖRMIGE SCHIENEN
    // ========================================================================

    /**
     * Erzeugt L-förmige Schienen für äußere Längsträger
     * @param {string} traegerName - Name des Trägers
     * @param {boolean} istRahmen - Ob Rahmenträger
     * @param {object} startPunkt - Startpunkt
     * @param {object} endPunkt - Endpunkt
     * @param {object} config - Konfiguration
     * @returns {THREE.Mesh[]}
     */
    erzeugeLFoermigeSchienen(traegerName, istRahmen, startPunkt, endPunkt, config) {
        // Nur für äußere Längsträger und nur bei Pultdach mit Glas
        if (!istRahmen || config.neigung === 0 || config.dachTyp === ROOF_TYPES.EPDM) {
            return [];
        }

        const schienen = [];

        // Dimensionen
        const schienenBreite = 0.070;
        const schienenHoehe = 0.010;
        const vertikalerSchenkel = 0.008;
        const glasDicke = 0.008;

        // Länge berechnen
        const profilTiefe = this.profileKonfig.gibAktuellesProfil()?.abmessungen?.tiefe || 0.08;
        const glasUeberstand = config.regenwasserAbfluss === "glasueberstand" ? 0.10 : -0.03;

        let verlaengerungVorne = profilTiefe / 2 + glasUeberstand;
        if (config.neigung > 0 && config.regenwasserAbfluss === "glasueberstand") {
            const rahmenBreite = this.profileKonfig.gibAktuellesProfil()?.abmessungen?.breite || 0.16;
            if (Math.abs(rahmenBreite - 0.12) < 0.002) {
                verlaengerungVorne += 0;
            } else if (Math.abs(rahmenBreite - 0.16) < 0.002) {
                verlaengerungVorne += 0;
            } else if (Math.abs(rahmenBreite - 0.20) < 0.002) {
                verlaengerungVorne += 0;
            } else {
                verlaengerungVorne += 0;
            }
        }

        const verlaengerungHinten = 0.070;

        const laengstraegerLaenge = Math.sqrt(
            Math.pow(endPunkt.x - startPunkt.x, 2) +
            Math.pow(endPunkt.y - startPunkt.y, 2) +
            Math.pow(endPunkt.z - startPunkt.z, 2)
        );

        const schienenTiefe = laengstraegerLaenge + verlaengerungVorne + verlaengerungHinten;

        // Richtung berechnen
        const direction = new THREE.Vector3(
            endPunkt.x - startPunkt.x,
            endPunkt.y - startPunkt.y,
            endPunkt.z - startPunkt.z
        ).normalize();

        const istStartVorne = startPunkt.z < endPunkt.z;
        const vordererPunkt = istStartVorne ? startPunkt : endPunkt;
        const hintererPunkt = istStartVorne ? endPunkt : startPunkt;

        const verlaengerterVorderpunkt = {
            x: vordererPunkt.x + (istStartVorne ? -direction.x : direction.x) * verlaengerungVorne,
            y: vordererPunkt.y + (istStartVorne ? -direction.y : direction.y) * verlaengerungVorne,
            z: vordererPunkt.z + (istStartVorne ? -direction.z : direction.z) * verlaengerungVorne
        };

        const verlaengerterHinterpunkt = {
            x: hintererPunkt.x + (istStartVorne ? direction.x : -direction.x) * verlaengerungHinten,
            y: hintererPunkt.y + (istStartVorne ? direction.y : -direction.y) * verlaengerungHinten,
            z: hintererPunkt.z + (istStartVorne ? direction.z : -direction.z) * verlaengerungHinten
        };

        // Bei Flachdach mit Glas: Absenkung hinten
        if (config.neigung === 0 && config.dachTyp === ROOF_TYPES.GLAS) {
            verlaengerterHinterpunkt.y -= 0.008;
        }

        const centerX = (verlaengerterVorderpunkt.x + verlaengerterHinterpunkt.x) / 2;
        const centerY = (verlaengerterVorderpunkt.y + verlaengerterHinterpunkt.y) / 2;
        const centerZ = (verlaengerterVorderpunkt.z + verlaengerterHinterpunkt.z) / 2;

        const actualDirection = new THREE.Vector3(
            verlaengerterHinterpunkt.x - verlaengerterVorderpunkt.x,
            verlaengerterHinterpunkt.y - verlaengerterVorderpunkt.y,
            verlaengerterHinterpunkt.z - verlaengerterVorderpunkt.z
        ).normalize();

        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), actualDirection);

        // Material
        const material = new THREE.MeshStandardMaterial({
            color: 0xc8c8c8,
            metalness: 0.9,
            roughness: 0.15,
            envMapIntensity: 0.8,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });

        // Horizontaler Schenkel
        const horizontalGeom = new THREE.BoxGeometry(schienenBreite, schienenHoehe, schienenTiefe);
        const horizontalMesh = new THREE.Mesh(horizontalGeom, material.clone());

        const laengstraegerProfil = this.profileKonfig.gibAktuellesProfil();
        const laengstraegerHoehe = laengstraegerProfil?.abmessungen?.breite || 0.1;

        // Pultdach-Offset
        let pultdachOffset = 0.08;
        if (config.neigung > 0) {
            if (Math.abs(laengstraegerHoehe - 0.12) < 0.001) {
                pultdachOffset = 0.06;
            } else if (Math.abs(laengstraegerHoehe - 0.10) < 0.001) {
                pultdachOffset = -0.035;
            } else if (Math.abs(laengstraegerHoehe - 0.08) < 0.001) {
                pultdachOffset = -0.015;
            } else if (Math.abs(laengstraegerHoehe) < 0.001) {
                pultdachOffset = -0.015;
            } else if (Math.abs(laengstraegerHoehe - 0.20) < 0.001) {
                pultdachOffset = 0.1;
            }
        }

        const laengstraegerOberkante = centerY + (laengstraegerHoehe / 2);
        const basisY = laengstraegerOberkante + glasDicke + pultdachOffset + (schienenHoehe / 2);

        const istLinks = traegerName === "links";

        horizontalMesh.position.set(centerX, basisY, centerZ);
        horizontalMesh.quaternion.copy(quaternion);
        horizontalMesh.castShadow = true;
        horizontalMesh.receiveShadow = true;
        horizontalMesh.renderOrder = 10;
        horizontalMesh.name = `L-Schiene-Horizontal_${traegerName}`;

        // Vertikaler Schenkel
        const vertikalGeom = new THREE.BoxGeometry(schienenHoehe, vertikalerSchenkel, schienenTiefe);
        const vertikalMesh = new THREE.Mesh(vertikalGeom, material.clone());

        const vertikalY = (basisY - schienenHoehe / 2) - vertikalerSchenkel / 2;
        const vertikalX = centerX + (istLinks
            ? -schienenBreite / 2 + schienenHoehe / 2
            : schienenBreite / 2 - schienenHoehe / 2);

        vertikalMesh.position.set(vertikalX, vertikalY, centerZ);
        vertikalMesh.quaternion.copy(quaternion);
        vertikalMesh.castShadow = true;
        vertikalMesh.receiveShadow = true;
        vertikalMesh.renderOrder = 10;
        vertikalMesh.name = `L-Schiene-Vertikal_${traegerName}`;

        schienen.push(horizontalMesh, vertikalMesh);
        return schienen;
    }

    // ========================================================================
    // GEOMETRIE UND MATERIAL
    // ========================================================================

    /**
     * Erzeugt die Längsträger-Geometrie
     * @param {object} start - Startpunkt
     * @param {object} ende - Endpunkt
     * @param {number} tiefe - Profiltiefe
     * @param {number} hoehe - Profilhöhe
     * @returns {{geometrie: THREE.BufferGeometry, center: object}}
     */
    erzeugeLaengstraegerGeometrie(start, ende, tiefe, hoehe) {
        const startY = start.y;
        const endeY = ende.y;
        const startOben = startY + hoehe;
        const endeOben = endeY + hoehe;

        const startLinks = start.x - tiefe / 2;
        const startRechts = start.x + tiefe / 2;
        const endeLinks = ende.x - tiefe / 2;
        const endeRechts = ende.x + tiefe / 2;

        const epsilon = 0.0001;
        const startZ = start.z - epsilon;
        const endeZ = ende.z + epsilon;

        // 8 Eckpunkte
        const vertices = [
            startLinks, startY, startZ,
            startRechts, startY, startZ,
            startRechts, startOben, startZ,
            startLinks, startOben, startZ,
            endeLinks, endeY, endeZ,
            endeRechts, endeY, endeZ,
            endeRechts, endeOben, endeZ,
            endeLinks, endeOben, endeZ
        ];

        // Mittelpunkt berechnen
        const xWerte = [];
        const yWerte = [];
        const zWerte = [];
        for (let i = 0; i < vertices.length; i += 3) {
            xWerte.push(vertices[i]);
            yWerte.push(vertices[i + 1]);
            zWerte.push(vertices[i + 2]);
        }

        const center = {
            x: (Math.min(...xWerte) + Math.max(...xWerte)) / 2,
            y: (Math.min(...yWerte) + Math.max(...yWerte)) / 2,
            z: (Math.min(...zWerte) + Math.max(...zWerte)) / 2
        };

        // Vertices relativ zum Mittelpunkt
        const positionArray = new Float32Array(vertices.length);
        for (let i = 0; i < vertices.length; i += 3) {
            positionArray[i] = vertices[i] - center.x;
            positionArray[i + 1] = vertices[i + 1] - center.y;
            positionArray[i + 2] = vertices[i + 2] - center.z;
        }

        const geometrie = new THREE.BufferGeometry();
        geometrie.setIndex([
            0, 1, 2, 0, 2, 3, // Vorne
            4, 6, 5, 4, 7, 6, // Hinten
            3, 2, 6, 3, 6, 7, // Oben
            0, 5, 1, 0, 4, 5, // Unten
            0, 3, 7, 0, 7, 4, // Links
            1, 5, 6, 1, 6, 2  // Rechts
        ]);
        geometrie.setAttribute("position", new THREE.Float32BufferAttribute(positionArray, 3));
        geometrie.computeVertexNormals();
        geometrie.computeBoundingBox();
        geometrie.computeBoundingSphere();

        return { geometrie, center };
    }

    /**
     * Erstellt das Längsträger-Material
     * @param {object} config - Konfiguration
     * @returns {THREE.Material}
     */
    erstelleLaengstraegerMaterial(config) {
        return MaterialManager.gibStrukturMaterial({
            teil: "laengstraeger",
            config
        });
    }

    // ========================================================================
    // QUERTRÄGER-AUFLAGEPUNKTE
    // ========================================================================

    /**
     * Berechnet die Auflagepunkte für Querträger
     * @returns {Array}
     */
    berechneQuertraegerAuflagepunkte() {
        this.konfiguration.gibAktuelleKonfiguration();
        const quertraegerRef = this.koordinatenSystem.gibReferenzpunkt("quertraegerReferenz");
        const auflagepunkte = [];

        if (!quertraegerRef) return auflagepunkte;

        quertraegerRef.forEach(ref => {
            const kontaktZ = this.berechneQuertraegerKontaktZ(ref);
            const links = this.berechneAuflagepunktAufLaengstraeger("links", kontaktZ);
            const rechts = this.berechneAuflagepunktAufLaengstraeger("rechts", kontaktZ);

            if (links && rechts) {
                auflagepunkte.push({
                    position: ref.position,
                    z: ref.z,
                    links,
                    rechts,
                    hoehe: ref.hoehe
                });
            }
        });

        return auflagepunkte;
    }

    /**
     * Berechnet die Kontakt-Z-Position für einen Querträger
     * @param {object} ref - Referenzpunkt
     * @returns {number}
     */
    berechneQuertraegerKontaktZ(ref) {
        const profil = this.profileKonfig.gibAktuellesProfil();
        const halbeTiefe = profil?.abmessungen?.tiefe ? profil.abmessungen.tiefe / 2 : 0;

        if (ref.position === "vorne") {
            return ref.z + halbeTiefe;
        } else if (ref.position === "hinten") {
            return ref.z - halbeTiefe;
        }
        return ref.z;
    }

    /**
     * Berechnet einen Auflagepunkt auf einem Längsträger
     * @param {string} seite - "links" oder "rechts"
     * @param {number} zielZ - Z-Position
     * @returns {object|null}
     */
    berechneAuflagepunktAufLaengstraeger(seite, zielZ) {
        const laengstraeger = this.gibLaengstraeger(seite);
        if (!laengstraeger) return null;

        const ref = laengstraeger.referenzpunkte;
        if (!ref?.start || !ref?.ende) return null;

        const startZ = ref.start.z;
        const zBereich = ref.ende.z - startZ;
        const faktor = zBereich !== 0 ? (zielZ - startZ) / zBereich : 0;

        const interpoliere = (a, b) => a + (b - a) * faktor;

        return {
            x: interpoliere(ref.start.x, ref.ende.x),
            y: interpoliere(ref.start.y, ref.ende.y),
            z: zielZ
        };
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Entfernt alle Längsträger
     */
    entferneLaengstraeger() {
        this.laengstraegerListe.forEach(laengstraeger => {
            disposeEdgeHighlights(laengstraeger.mesh);
            laengstraeger.geometrie.dispose();

            const material = laengstraeger.material;
            const isManagedMaterial = material?.userData?.managedMaterial;
            if (material?.dispose && !isManagedMaterial) {
                material.dispose();
            }

            // Glasführungsschienen entfernen
            if (laengstraeger.glasSchienen) {
                laengstraeger.glasSchienen.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
        });

        while (this.laengstraegerGruppe.children.length > 0) {
            this.laengstraegerGruppe.remove(this.laengstraegerGruppe.children[0]);
        }

        this.laengstraegerListe = [];
    }

    // ========================================================================
    // GETTER / LEGACY API
    // ========================================================================

    /**
     * Gibt einen Längsträger nach Name zurück
     * @param {string} name - Name des Trägers
     * @returns {object|null}
     */
    gibLaengstraeger(name) {
        return this.laengstraegerListe.find(l => l.name === name) || null;
    }

    /**
     * Gibt alle Längsträger zurück
     * @returns {Array}
     */
    gibAlleLaengstraeger() {
        return [...this.laengstraegerListe];
    }

    /**
     * Aktualisiert die Längsträger
     * @returns {THREE.Group}
     */
    aktualisiereLaengstraeger() {
        return this.erstelleLaengstraeger();
    }

    /**
     * Setzt das aktuelle Profil
     * @param {string} profilId - Profil-ID
     * @returns {THREE.Group|boolean}
     */
    setzeProfil(profilId) {
        if (!this.profileKonfig.setzeAktuellesProfil(profilId)) {
            return false;
        }

        if (this.koordinatenSystem?.setzeProfil) {
            this.koordinatenSystem.setzeProfil(profilId);
        }

        return this.erstelleLaengstraeger();
    }

    // ========================================================================
    // COMPONENT3D INTERFACE
    // ========================================================================

    /**
     * Erstellt die Komponente (Component3D Interface)
     * @returns {THREE.Group}
     */
    create() {
        return this.erstelleLaengstraeger();
    }

    /**
     * Gibt alle Elemente zurück (Component3D Interface)
     * @returns {Array}
     */
    getAll() {
        return this.gibAlleLaengstraeger();
    }

    /**
     * Gibt die 3D-Gruppe zurück (Component3D Interface)
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.laengstraegerGruppe;
    }

    /**
     * Legacy: Gibt die 3D-Gruppe zurück
     * @deprecated Verwende getGroup() stattdessen
     * @returns {THREE.Group}
     */
    gib3DGruppe() {
        return this.laengstraegerGruppe;
    }

    // ========================================================================
    // DEBUG
    // ========================================================================

    /**
     * Debug-Ausgabe für Längsträger
     */
    debugLaengstraeger() {
        this.logger.group("LÄNGSTRÄGER-INFORMATIONEN");
        this.laengstraegerListe.forEach(laengstraeger => {
            this.logger.group(`Längsträger: ${laengstraeger.name}`);
            this.logger.info("Referenzpunkte:", laengstraeger.referenzpunkte);
            this.logger.info("Abmessungen:", laengstraeger.abmessungen);
            this.logger.info("Eigenschaften:", laengstraeger.eigenschaften);
            this.logger.groupEnd();
        });
        this.logger.groupEnd();
    }

    /**
     * Cleanup (Component3D Interface)
     */
    dispose() {
        this.entferneLaengstraeger();
        super.dispose();
    }
}
