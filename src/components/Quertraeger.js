/**
 * Querträger-Komponente für den Pergola-Konfigurator
 *
 * Refactored: Erbt von Component3D, nutzt Logger und Constants
 */

import { ProfileKonfiguration } from "../config/ProfileKonfiguration.js";
import { MaterialManager } from "../core/MaterialManager.js";
import { disposeEdgeHighlights } from "../utils/edgeHighlight.js";
import { createSmoothBoxGeometry } from "../utils/geometry.js";

// Neue Module
import { Component3D } from "../core/Component3D.js";
import { COMPONENT_NAMES, ROOF_TYPES } from "../constants/index.js";

/**
 * Querträger-Komponente
 * Verwaltet alle Querträger der Pergola (vorne, hinten, zwischen)
 */
export class Quertraeger extends Component3D {
    /**
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     * @param {object} pfostenInstanz - Referenz zur Pfosten-Komponente
     * @param {object} laengstraegerInstanz - Referenz zur Längsträger-Komponente
     */
    constructor(koordinatenSystem, konfiguration, pfostenInstanz, laengstraegerInstanz) {
        super(COMPONENT_NAMES.QUERTRAEGER, koordinatenSystem, konfiguration);

        // Querträger-spezifische Eigenschaften
        this.pfostenInstanz = pfostenInstanz;
        this.laengstraegerInstanz = laengstraegerInstanz;
        this.profileKonfig = new ProfileKonfiguration();
        this.quertraegerListe = [];
        this.quertraegerGruppe = this.gruppe; // Alias für Legacy-Kompatibilität
        this.quertraegerGruppe.name = "QuertraegerGruppe";
    }

    // ========================================================================
    // COMPONENT3D INTERFACE
    // ========================================================================

    /**
     * Erstellt alle Querträger
     * @returns {THREE.Group}
     */
    create() {
        return this.erstelleQuertraeger();
    }

    // ========================================================================
    // QUERTRÄGER-ERSTELLUNG
    // ========================================================================

    /**
     * Erstellt alle Querträger basierend auf der Konfiguration
     * @returns {THREE.Group}
     */
    erstelleQuertraeger() {
        this.entferneQuertraeger();

        const config = this.konfiguration.gibAktuelleKonfiguration();
        const referenzpunkte = this.koordinatenSystem.gibReferenzpunkt("quertraegerReferenz");

        if (!referenzpunkte || referenzpunkte.length === 0) {
            this.logger.warn("Keine Querträger-Referenzpunkte gefunden");
            return this.quertraegerGruppe;
        }

        referenzpunkte.forEach((ref, index) => {
            const quertraeger = this.erstelleEinzelnenQuertraeger(ref, config, index);
            if (quertraeger) {
                this.quertraegerListe.push(quertraeger);
                this.quertraegerGruppe.add(quertraeger.mesh);
            }
        });

        return this.quertraegerGruppe;
    }

    /**
     * Erstellt einen einzelnen Querträger
     */
    erstelleEinzelnenQuertraeger(referenz, config, index) {
        const auflagepunkte = this.berechneAuflagepunkteAufLaengstraegern(referenz, config);

        if (!auflagepunkte) {
            this.logger.warn(`Keine gültigen Auflagepunkte für Querträger ${referenz.position}`);
            return null;
        }

        // Prüfe ob es ein mittlerer Querträger ist
        const istMittlererQuertraeger = typeof referenz.position === "string" &&
            !["vorne", "hinten"].includes(referenz.position.toLowerCase());

        // EPDM-Offset für mittlere Querträger
        const epdmOffset = (config.dachTyp === ROOF_TYPES.EPDM && istMittlererQuertraeger) ? 0.02 : 0;

        // Profil-Auswahl
        const mittelProfil = this.profileKonfig.gibMitteltraegerProfil(config);
        const profil = (istMittlererQuertraeger && mittelProfil) ? mittelProfil : this.profileKonfig.gibAktuellesProfil();
        const abmessungen = profil?.abmessungen || {};
        const profilTiefe = abmessungen.tiefe || 0;
        const profilBreite = abmessungen.breite || 0;

        // Pfosten- und Längsträger-Profile
        const pfostenProfil = this.pfostenInstanz?.profileKonfig?.gibAktuellesProfil?.() || null;
        const pfostenBreite = pfostenProfil?.abmessungen?.breite || 0;
        const laengstraegerProfil = this.laengstraegerInstanz?.profileKonfig?.gibAktuellesProfil?.() || null;
        const laengstraegerTiefe = laengstraegerProfil?.abmessungen?.tiefe || 0;

        // Prüfe ob hintere Pfosten aktiv sind (für Wandmontage)
        const hinterePfostenAktiv = config.individuellerPfostenStand?.hinten_links !== false &&
            config.individuellerPfostenStand?.hinten_rechts !== false;
        const istHintererQuertraeger = referenz.position === "hinten";

        // Berechne Richtung und Länge
        const richtung = new THREE.Vector3(
            auflagepunkte.rechts.x - auflagepunkte.links.x,
            auflagepunkte.rechts.y - auflagepunkte.links.y,
            auflagepunkte.rechts.z - auflagepunkte.links.z
        );
        const basisLaenge = richtung.length();

        // Effektive Länge berechnen
        let effektiveLaenge = basisLaenge;
        let kuerzung = 0;

        if (istMittlererQuertraeger) {
            const offset = laengstraegerTiefe;
            effektiveLaenge = Math.max(0.05, basisLaenge - offset);
            kuerzung = offset;
        } else if (istHintererQuertraeger && !hinterePfostenAktiv) {
            const offset = 2 * laengstraegerTiefe;
            effektiveLaenge = Math.max(0.05, basisLaenge - offset);
            kuerzung = offset;
            this.logger.debug(`WANDMONTAGE: Hinterer Querträger gekürzt von ${basisLaenge.toFixed(3)}m auf ${effektiveLaenge.toFixed(3)}m`);
        } else if (pfostenBreite > 0 && referenz.links?.x !== undefined && referenz.rechts?.x !== undefined) {
            const linksX = referenz.links.x - pfostenBreite / 2;
            const rechtsX = referenz.rechts.x + pfostenBreite / 2;
            effektiveLaenge = Math.max(basisLaenge, rechtsX - linksX);
        } else {
            effektiveLaenge += laengstraegerTiefe;
        }

        // Material erstellen
        const material = this.erstelleQuertraegerMaterial(config);

        let mesh, geometrien;

        // Rinnen-Querträger oder Standard-Querträger
        if (config.regenwasserAbfluss === "rinne" && referenz.position === "vorne") {
            const quertraegerZ = referenz.z;
            const quertraegerX = (auflagepunkte.links.x + auflagepunkte.rechts.x) / 2;
            const wandstaerke = profil?.abmessungen?.wandstaerke || 0.1 * profilBreite;

            const rinne = this.erzeugeRinnenQuertraeger(
                effektiveLaenge, profilBreite, profilTiefe, wandstaerke,
                material, config, quertraegerZ, quertraegerX
            );
            mesh = rinne.mesh;
            geometrien = rinne.geometrien;
        } else {
            const geometrie = createSmoothBoxGeometry(effektiveLaenge, profilBreite, profilTiefe);

            // Geometrie-Anpassungen
            if (config.regenwasserAbfluss === "glasueberstand" && referenz.position === "vorne") {
                this.passeOberkanteFuerGlasUeberstandAn(geometrie, profilBreite, profilTiefe, referenz.neigungswinkel || 0);
            }

            if (referenz.position === "hinten") {
                this.passeOberkanteFuerHinterenQuertraegerAn(geometrie, profilBreite, profilTiefe, referenz.neigungswinkel || 0);
            }

            mesh = new THREE.Mesh(geometrie, material);
            geometrien = [geometrie];

            // Blendblech und L-Schienen für hinteren Querträger
            if (referenz.position === "hinten") {
                const blendblech = this.erzeugeBlendblech(
                    effektiveLaenge, profilBreite, profilTiefe,
                    referenz.neigungswinkel || 0, material, auflagepunkte, referenz.z
                );
                if (blendblech) {
                    mesh.add(blendblech.mesh);
                    geometrien.push(blendblech.geometrie);
                }

                // L-Schienen für Pultdach mit Glas
                const lSchienen = this.erzeugeLFoermigeSchieneFuerHinterenQuertraeger(config, auflagepunkte, profilTiefe);
                lSchienen.forEach(schiene => mesh.add(schiene));
            }
        }

        // Position berechnen
        const mittelpunkt = new THREE.Vector3(
            (auflagepunkte.links.x + auflagepunkte.rechts.x) / 2,
            (auflagepunkte.links.y + auflagepunkte.rechts.y) / 2,
            referenz.z
        );

        // Z-Anpassung für Wandmontage
        if (istHintererQuertraeger && !hinterePfostenAktiv && Number.isFinite(profilTiefe)) {
            const epsilon = 0.001;
            mittelpunkt.z -= profilTiefe / 2 + epsilon;
        }

        // Auflagehöhe berechnen
        let auflageHoehe = null;

        if (istMittlererQuertraeger) {
            const hoehe = this.berechneAuflageHoeheFuerMittlerenQuertraeger(referenz.z, auflagepunkte);
            if (Number.isFinite(hoehe)) {
                auflageHoehe = hoehe;
            }
        } else {
            const linksLaengstraeger = this.laengstraegerInstanz?.gibLaengstraeger?.("links");
            const rechtsLaengstraeger = this.laengstraegerInstanz?.gibLaengstraeger?.("rechts");

            const hoehen = [
                linksLaengstraeger ? this.berechneLaengstraegerOberkanteBeiZ(linksLaengstraeger, auflagepunkte.links?.z ?? referenz.z) : null,
                rechtsLaengstraeger ? this.berechneLaengstraegerOberkanteBeiZ(rechtsLaengstraeger, auflagepunkte.rechts?.z ?? referenz.z) : null
            ].filter(h => Number.isFinite(h));

            if (hoehen.length) {
                auflageHoehe = hoehen.reduce((sum, h) => sum + h, 0) / hoehen.length;
            }
        }

        // Rotation berechnen
        const richtungNorm = { x: richtung.x, y: richtung.y, z: richtung.z };
        let rotationZ = 0;
        if (Math.abs(richtungNorm.y) > 0.001 || Math.abs(richtungNorm.z) > 0.001) {
            rotationZ = Math.atan2(richtungNorm.y, richtungNorm.x);
        }

        let neigungswinkel = referenz.neigungswinkel || 0;

        // Flachdach + Glas: Neigung aus Mittelträgern ableiten
        if (istMittlererQuertraeger && config.dachTyp === ROOF_TYPES.GLAS && Math.abs(config.neigung || 0) <= 1e-6) {
            const mitteltraeger = this.laengstraegerInstanz?.gibAlleLaengstraeger?.()
                .find(lt => typeof lt.name === "string" && lt.name.startsWith("mitte"));

            const start = mitteltraeger?.referenzpunkte?.start;
            const ende = mitteltraeger?.referenzpunkte?.ende;
            const hoehe = mitteltraeger?.abmessungen?.hoehe || 0;

            if (start && ende) {
                let startTop = start.y + hoehe;
                let endeTop = ende.y + hoehe;
                const hintenIstStart = start.z > ende.z;

                // Geometrie: hintere Kante 8mm abgesenkt
                if (hintenIstStart) {
                    startTop -= 0.008;
                } else {
                    endeTop -= 0.008;
                }

                const deltaZ = ende.z - start.z;
                const effektiveTiefe = Math.abs(deltaZ) > 1e-6 ? deltaZ : (config.tiefe || 1);
                neigungswinkel = Math.atan2(endeTop - startTop, effektiveTiefe);

                this.logger.debug(`Querträger ${referenz.position} Neigung aus Mittelträger:`, {
                    startTop, endeTop,
                    deltaZ: effektiveTiefe,
                    winkelGrad: (neigungswinkel * 180 / Math.PI).toFixed(3)
                });
            } else {
                const absenkungHinten = 0.008;
                neigungswinkel = Math.atan2(absenkungHinten, config.tiefe || 1);

                this.logger.debug(`Querträger ${referenz.position}: Nutze Fallback-Neigung`, {
                    absenkung: absenkungHinten,
                    tiefe: config.tiefe || 1,
                    winkelGrad: (neigungswinkel * 180 / Math.PI).toFixed(3)
                });
            }
        }

        // Euler-Rotation erstellen
        const istMittePosition = typeof referenz.position === "string" && referenz.position.startsWith("mitte");
        const rotation = istMittePosition
            ? new THREE.Euler(-neigungswinkel, 0, rotationZ, "XYZ")
            : new THREE.Euler(0, 0, rotationZ, "XYZ");

        mesh.rotation.copy(rotation);

        // Position mit Offset berechnen
        const oberkanteOffset = new THREE.Vector3(0, profilBreite / 2, 0).applyEuler(rotation);
        const unterkanteOffset = oberkanteOffset.clone().negate();

        if (Number.isFinite(auflageHoehe)) {
            // Flachdach + Glas: Innere Querträger leicht absenken
            if (istMittlererQuertraeger && config.dachTyp === ROOF_TYPES.GLAS && Math.abs(config.neigung || 0) <= 1e-6) {
                auflageHoehe -= 0.004;
            }

            if (!istMittlererQuertraeger) {
                auflageHoehe -= 1e-5;
            }

            const neuePosition = new THREE.Vector3(mittelpunkt.x, auflageHoehe, mittelpunkt.z)
                .clone().add(unterkanteOffset);
            mittelpunkt.copy(neuePosition).sub(oberkanteOffset);
            mittelpunkt.y = Math.min(mittelpunkt.y, auflageHoehe - 1e-6);
        }

        // Finale Position
        const epsilon = new THREE.Vector3(1, 0, 0).applyEuler(rotation).multiplyScalar(1e-4);
        const finalePosition = mittelpunkt.clone().add(oberkanteOffset).add(epsilon);

        finalePosition.y -= epdmOffset;
        mesh.position.copy(finalePosition);

        // Wandmontage: Z-Position anpassen
        if (istHintererQuertraeger && !hinterePfostenAktiv && Number.isFinite(profilTiefe)) {
            const epsilonZ = 0.001;
            mesh.position.z = config.tiefe - profilTiefe / 2 - epsilonZ;
        }

        // Schatten aktivieren
        mesh.traverse?.(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        if (!mesh.traverse) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        mesh.name = `Quertraeger_${referenz.position}_${index}`;

        return {
            name: `${referenz.position}_${index}`,
            position: referenz.position,
            mesh: mesh,
            geometrie: geometrien,
            material: material,
            auflagepunkte: {
                links: { ...auflagepunkte.links },
                rechts: { ...auflagepunkte.rechts },
                mittelpunkt: {
                    x: finalePosition.x,
                    y: finalePosition.y,
                    z: finalePosition.z
                }
            },
            abmessungen: {
                laenge: effektiveLaenge,
                breite: profilTiefe,
                hoehe: profilBreite
            },
            eigenschaften: {
                zPosition: referenz.z,
                index: index,
                typ: this.bestimmeQuertraegerTyp(referenz.position)
            }
        };
    }

    // ========================================================================
    // RINNEN-QUERTRÄGER
    // ========================================================================

    /**
     * Erzeugt einen Rinnen-Querträger (U-Profil)
     */
    erzeugeRinnenQuertraeger(laenge, hoehe, tiefe, wandstaerke, material, config, quertraegerZ, quertraegerX) {
        const gruppe = new THREE.Group();

        // Boden
        const bodenGeom = createSmoothBoxGeometry(laenge, wandstaerke, tiefe);
        const bodenMesh = new THREE.Mesh(bodenGeom, material);
        bodenMesh.position.y = -hoehe / 2 + wandstaerke / 2;

        // Bestimme ob Flachdach mit EPDM
        const istFlachdach = config?.neigung === 0;
        const istEPDM = config?.dachTyp === ROOF_TYPES.EPDM;

        // Außenseite (vordere Seite)
        const aussenseiteGeom = createSmoothBoxGeometry(laenge, hoehe, wandstaerke);
        const aussenseiteMesh = new THREE.Mesh(aussenseiteGeom, material);
        aussenseiteMesh.position.z = -tiefe / 2 + wandstaerke / 2;

        // Innenseite (hintere Seite)
        let innenseiteHoehe = hoehe;
        let innenseiteYOffset = 0;

        if (istFlachdach && istEPDM) {
            const epdmOffset = -0.05;
            innenseiteHoehe = hoehe + epdmOffset;
            innenseiteYOffset = epdmOffset / 2;

            this.logger.debug("Flachdach mit EPDM - Rinnen-Innenseite verlängert:", {
                epdmOffset, originalHoehe: hoehe, neueHoehe: innenseiteHoehe
            });
        } else if (istFlachdach) {
            const rahmenProfilHoehe = this.profileKonfig?.gibAktuellesProfil?.()?.abmessungen?.breite ?? hoehe;
            const mittelProfilHoehe = this.profileKonfig?.gibMitteltraegerProfil?.(config)?.abmessungen?.breite ?? rahmenProfilHoehe;
            const profilDifferenz = Math.max(rahmenProfilHoehe - mittelProfilHoehe, 0);

            if (profilDifferenz > 0) {
                innenseiteHoehe = Math.max(hoehe - profilDifferenz, wandstaerke);
                innenseiteYOffset = -profilDifferenz / 2;

                this.logger.debug("Flachdach Rinnen-Innenseite (Profil-Differenz):", {
                    rahmenProfilHoehe, mittelProfilHoehe, profilDifferenz
                });
            }
        }

        const innenseiteGeom = innenseiteHoehe !== hoehe
            ? createSmoothBoxGeometry(laenge, innenseiteHoehe, wandstaerke)
            : createSmoothBoxGeometry(laenge, hoehe, wandstaerke);

        const innenseiteMesh = new THREE.Mesh(innenseiteGeom, material);
        innenseiteMesh.position.z = tiefe / 2 - wandstaerke / 2;
        if (innenseiteHoehe !== hoehe) {
            innenseiteMesh.position.y = innenseiteYOffset;
        }

        // Seitenteile
        const seiteGeom = createSmoothBoxGeometry(wandstaerke, hoehe, tiefe);
        const linksMesh = new THREE.Mesh(seiteGeom, material);
        linksMesh.position.x = -laenge / 2 + wandstaerke / 2;

        const rechtsMesh = new THREE.Mesh(seiteGeom.clone(), material);
        rechtsMesh.position.x = laenge / 2 - wandstaerke / 2;

        // Blockelemente
        const innenseiteTop = (innenseiteYOffset ?? 0) + (innenseiteHoehe / 2);
        const blockelemente = this.erzeugeRinnenBlockelemente(
            laenge, hoehe, tiefe, wandstaerke, material, config,
            quertraegerZ, quertraegerX, innenseiteHoehe, innenseiteTop
        );

        const alleMeshes = [bodenMesh, aussenseiteMesh, innenseiteMesh, linksMesh, rechtsMesh, ...blockelemente];
        const alleGeometrien = [bodenGeom, aussenseiteGeom, innenseiteGeom, seiteGeom, seiteGeom.clone(),
            ...blockelemente.map(b => b.geometry)];

        alleMeshes.forEach(mesh => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            gruppe.add(mesh);
        });

        return { mesh: gruppe, geometrien: alleGeometrien };
    }

    /**
     * Erzeugt Blockelemente für die Rinne
     */
    erzeugeRinnenBlockelemente(rinnenBreite, rinnenHoehe, rinnenTiefe, wandstaerke, material, config,
                               quertraegerZ, quertraegerX, innenseiteHoehe = rinnenHoehe, innenseiteTop = rinnenHoehe / 2) {
        const blockelemente = [];

        if (!this.laengstraegerInstanz) return blockelemente;

        const alleLaengstraeger = this.laengstraegerInstanz.gibAlleLaengstraeger?.();
        if (!alleLaengstraeger) return blockelemente;

        // Filtere nur Mittelträger
        const mitteltraeger = alleLaengstraeger.filter(lt =>
            lt.name && typeof lt.name === "string" && lt.name.startsWith("mitte")
        );

        if (mitteltraeger.length === 0) return blockelemente;

        const mittelProfil = this.profileKonfig?.gibMitteltraegerProfil?.(config);
        if (!mittelProfil) return blockelemente;

        const mittelProfilBreite = mittelProfil.abmessungen?.breite || 0.1;
        const mittelProfilTiefe = mittelProfil.abmessungen?.tiefe || 0.08;
        const effektiveWandstaerke = Number.isFinite(wandstaerke) ? wandstaerke : 0;

        // Blockelement-Dimensionen
        const blockBreite = mittelProfilTiefe / 2;
        const maxInnenHoehe = Math.max(Math.min(innenseiteHoehe, rinnenHoehe - 2 * effektiveWandstaerke), 0.001);
        const blockHoehe = Math.min(Math.max(mittelProfilBreite - 0.020, 0.060), maxInnenHoehe);
        const blockTiefe = Math.max(rinnenTiefe - 2 * effektiveWandstaerke, 0.001);

        this.logger.debug("Rinnen-Blockelemente:", {
            mittelProfilBreite: (mittelProfilBreite * 1000).toFixed(0) + "mm",
            blockBreite: (blockBreite * 1000).toFixed(0) + "mm",
            blockHoehe: (blockHoehe * 1000).toFixed(0) + "mm",
            anzahlMitteltraeger: mitteltraeger.length
        });

        mitteltraeger.forEach((mt, index) => {
            const xPos = mt.referenzpunkte?.start?.x || mt.abmessungen?.xPosition || 0;
            const zPos = mt.referenzpunkte?.start?.z || 0;

            const blockGeom = new THREE.BoxGeometry(blockBreite, blockHoehe, blockTiefe);
            const blockMesh = new THREE.Mesh(blockGeom, material.clone());

            const blockX = xPos - quertraegerX;
            const blockY = innenseiteTop - blockHoehe / 2 - 1e-5;

            const innenHalbeTiefe = Math.max((rinnenTiefe / 2) - effektiveWandstaerke, 0);
            const maxZOffset = Math.max(innenHalbeTiefe - blockTiefe / 2, 0);
            const rawBlockZ = zPos - quertraegerZ;
            const blockZ = Math.max(Math.min(rawBlockZ, maxZOffset), -maxZOffset);

            blockMesh.position.set(blockX, blockY, blockZ);
            blockMesh.name = `RinnenBlock_${index}`;

            this.logger.debug(`Block ${index}: x=${blockX.toFixed(3)}, y=${blockY.toFixed(3)}, z=${blockZ.toFixed(3)}`);

            blockelemente.push(blockMesh);
        });

        return blockelemente;
    }

    // ========================================================================
    // L-SCHIENEN UND BLENDBLECH
    // ========================================================================

    /**
     * Erzeugt L-förmige Schienen für hinteren Querträger (Pultdach mit Glas)
     */
    erzeugeLFoermigeSchieneFuerHinterenQuertraeger(config, auflagepunkte, quertraegerTiefe) {
        // Nur für Pultdach mit Glas
        if (config.neigung === 0 || config.dachTyp === ROOF_TYPES.EPDM) {
            return [];
        }

        const schienen = [];

        const schienenBreite = 0.070;
        const schienenHoehe = 0.010;
        const vertikalerSchenkel = 0.008;
        const glasDicke = 0.008;

        // Querträger-Länge berechnen
        const quertraegerLaenge = Math.sqrt(
            Math.pow(auflagepunkte.rechts.x - auflagepunkte.links.x, 2) +
            Math.pow(auflagepunkte.rechts.y - auflagepunkte.links.y, 2) +
            Math.pow(auflagepunkte.rechts.z - auflagepunkte.links.z, 2)
        );

        const seitlicheVerlaengerung = schienenBreite;
        const schienenLaenge = quertraegerLaenge + seitlicheVerlaengerung;

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

        const quertraegerProfil = this.profileKonfig.gibAktuellesProfil();
        const quertraegerHoehe = quertraegerProfil?.abmessungen?.breite || 0.1;

        // Horizontaler Schenkel
        const horizontalGeom = new THREE.BoxGeometry(schienenLaenge, schienenHoehe, schienenBreite);
        const horizontalMesh = new THREE.Mesh(horizontalGeom, material.clone());

        const relativY = (quertraegerHoehe / 2) + glasDicke + 0.002 + (schienenHoehe / 2);
        const tiefenOffset = schienenBreite / 2 - 0.04;

        horizontalMesh.position.set(0, relativY, tiefenOffset);

        const neigungsWinkel = -(config.neigung * Math.PI / 180);
        horizontalMesh.rotation.x = neigungsWinkel;

        horizontalMesh.castShadow = true;
        horizontalMesh.receiveShadow = true;
        horizontalMesh.renderOrder = 10;
        horizontalMesh.name = "L-Schiene-Horizontal_HintererQuertraeger";

        // Vertikaler Schenkel
        const vertikalGeom = new THREE.BoxGeometry(schienenLaenge, vertikalerSchenkel, schienenHoehe);
        const vertikalMesh = new THREE.Mesh(vertikalGeom, material.clone());

        const vertikalY = relativY + (schienenHoehe / 2) - 0.0125;
        const vertikalZ = tiefenOffset + schienenBreite / 2 - schienenHoehe / 2;

        vertikalMesh.position.set(0, vertikalY, vertikalZ);
        vertikalMesh.rotation.x = neigungsWinkel;
        vertikalMesh.castShadow = true;
        vertikalMesh.receiveShadow = true;
        vertikalMesh.renderOrder = 10;
        vertikalMesh.name = "L-Schiene-Vertikal_HintererQuertraeger";

        schienen.push(horizontalMesh, vertikalMesh);

        this.logger.debug("L-Schiene für hinteren Querträger erstellt:", {
            länge: schienenLaenge.toFixed(3),
            relativY: relativY.toFixed(3)
        });

        return schienen;
    }

    /**
     * Erzeugt Blendblech für hinteren Querträger
     */
    erzeugeBlendblech(laenge, hoehe, tiefe, neigungswinkel, material, auflagepunkte, zPosition) {
        if (!Number.isFinite(neigungswinkel) || Math.abs(neigungswinkel) < 1e-6) {
            return null;
        }

        const steigung = Math.tan(neigungswinkel);
        const breite = tiefe;
        const keilHoehe = Math.abs(steigung * breite);

        if (keilHoehe <= 0.001) return null;

        const zVorne = -tiefe / 2;
        const zHinten = tiefe / 2;
        const yOben = hoehe / 2;
        const yObenHinten = yOben + keilHoehe;
        const yUnten = -hoehe / 2;

        // Vertices für Keil-Geometrie
        const vertices = new Float32Array([
            -laenge / 2, yUnten, zVorne,
            laenge / 2, yUnten, zVorne,
            -laenge / 2, yUnten, zHinten,
            laenge / 2, yUnten, zHinten,
            -laenge / 2, yOben, zVorne,
            laenge / 2, yOben, zVorne,
            -laenge / 2, yObenHinten, zHinten,
            laenge / 2, yObenHinten, zHinten
        ]);

        const geometrie = new THREE.BufferGeometry();
        geometrie.setIndex([
            4, 5, 6, 5, 7, 6,  // Oben
            0, 2, 1, 1, 2, 3,  // Unten
            0, 1, 4, 1, 5, 4,  // Vorne
            2, 6, 3, 3, 6, 7,  // Hinten
            0, 4, 2, 2, 4, 6,  // Links
            1, 3, 5, 3, 7, 5   // Rechts
        ]);
        geometrie.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        geometrie.computeVertexNormals();

        const keilMaterial = material?.userData?.managedMaterial
            ? material
            : MaterialManager.gibStrukturMaterial({
                teil: "quertraeger",
                config: this.konfiguration.gibAktuelleKonfiguration()
            });

        const mesh = new THREE.Mesh(geometrie, keilMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = "Keilstueck_hintererQuertraeger";

        return { mesh, geometrie };
    }

    // ========================================================================
    // GEOMETRIE-ANPASSUNGEN
    // ========================================================================

    /**
     * Passt Oberkante für hinteren Querträger an
     */
    passeOberkanteFuerHinterenQuertraegerAn(geometrie, hoehe, tiefe, neigungswinkel) {
        if (!geometrie || !geometrie.attributes?.position) return;

        const position = geometrie.attributes.position;
        const halbeHoehe = hoehe / 2;
        const absenkung = Math.tan(neigungswinkel) * tiefe;

        for (let i = 0; i < position.count; i++) {
            if (position.getY(i) <= 0) continue;

            const istHinten = position.getZ(i) < 0;
            const neueHoehe = istHinten ? halbeHoehe - (istHinten ? absenkung : 0) : halbeHoehe;
            position.setY(i, Math.max(neueHoehe, -halbeHoehe));
        }

        position.needsUpdate = true;
        geometrie.computeVertexNormals();
        geometrie.computeBoundingBox();
        geometrie.computeBoundingSphere();
    }

    /**
     * Passt Oberkante für Glas-Überstand an
     */
    passeOberkanteFuerGlasUeberstandAn(geometrie, hoehe, tiefe, neigungswinkel) {
        if (!geometrie || !geometrie.attributes?.position) return;

        const position = geometrie.attributes.position;
        const halbeHoehe = hoehe / 2;
        const halbeTiefe = tiefe / 2;
        const steigung = Math.tan(neigungswinkel);

        for (let i = 0; i < position.count; i++) {
            if (position.getY(i) <= 0) continue;

            const z = position.getZ(i);
            const distanz = Math.max(0, halbeTiefe - z);
            const neueHoehe = halbeHoehe - steigung * Math.min(tiefe, distanz);
            position.setY(i, Math.max(neueHoehe, -halbeHoehe));
        }

        position.needsUpdate = true;
        geometrie.computeVertexNormals();
        geometrie.computeBoundingBox();
        geometrie.computeBoundingSphere();
    }

    // ========================================================================
    // HILFSMETHODEN
    // ========================================================================

    /**
     * Berechnet Auflagepunkte auf Längsträgern
     */
    berechneAuflagepunkteAufLaengstraegern(referenz, config) {
        if (this.laengstraegerInstanz?.berechneQuertraegerAuflagepunkte) {
            const auflagepunkte = this.laengstraegerInstanz.berechneQuertraegerAuflagepunkte()
                .find(ap => Math.abs(ap.z - referenz.z) < 0.01);

            if (auflagepunkte) {
                return { links: auflagepunkte.links, rechts: auflagepunkte.rechts };
            }
        }

        return { links: referenz.links, rechts: referenz.rechts };
    }

    /**
     * Berechnet Auflagehöhe für mittlere Querträger
     */
    berechneAuflageHoeheFuerMittlerenQuertraeger(zPosition, auflagepunkte) {
        if (!this.laengstraegerInstanz) return null;

        const mitteltraeger = this.laengstraegerInstanz.gibAlleLaengstraeger?.()
            .find(lt => typeof lt.name === "string" && lt.name.startsWith("mitte"));

        const oberkanteAusMittel = mitteltraeger
            ? this.berechneLaengstraegerOberkanteBeiZ(mitteltraeger, zPosition)
            : null;

        if (Number.isFinite(oberkanteAusMittel)) return oberkanteAusMittel;

        const hoehen = [];

        const linksLaengstraeger = this.laengstraegerInstanz.gibLaengstraeger?.("links");
        if (linksLaengstraeger && auflagepunkte?.links?.y !== undefined) {
            const h = auflagepunkte.links.y + (linksLaengstraeger.abmessungen?.hoehe || 0);
            if (Number.isFinite(h)) hoehen.push(h);
        }

        const rechtsLaengstraeger = this.laengstraegerInstanz.gibLaengstraeger?.("rechts");
        if (rechtsLaengstraeger && auflagepunkte?.rechts?.y !== undefined) {
            const h = auflagepunkte.rechts.y + (rechtsLaengstraeger.abmessungen?.hoehe || 0);
            if (Number.isFinite(h)) hoehen.push(h);
        }

        return hoehen.length ? Math.max(...hoehen) : null;
    }

    /**
     * Berechnet Längsträger-Oberkante bei Z-Position
     */
    berechneLaengstraegerOberkanteBeiZ(laengstraeger, zPosition) {
        const ref = laengstraeger?.referenzpunkte;
        if (!ref?.start || !ref?.ende) return null;

        const startZ = ref.start.z;
        const deltaZ = ref.ende.z - startZ;
        const t = deltaZ !== 0 ? (zPosition - startZ) / deltaZ : 0;

        const interpolierteY = ref.start.y + (ref.ende.y - ref.start.y) * t;
        return interpolierteY + (laengstraeger.abmessungen?.hoehe || 0);
    }

    /**
     * Bestimmt Querträger-Typ
     */
    bestimmeQuertraegerTyp(position) {
        if (position === "vorne") return "vordererQuertraeger";
        if (position === "hinten") return "hintererQuertraeger";
        if (position.startsWith("zwischen")) return "zwischenQuertraeger";
        return "standardQuertraeger";
    }

    /**
     * Erstellt Querträger-Material
     */
    erstelleQuertraegerMaterial(config) {
        return MaterialManager.gibStrukturMaterial({
            teil: "quertraeger",
            config: config
        });
    }

    /**
     * Berechnet Befestigungspunkte
     */
    berechneBefestigungspunkte() {
        const punkte = [];

        this.quertraegerListe.forEach(qt => {
            const anzahlPunkte = Math.ceil(qt.abmessungen.laenge / 1);

            for (let i = 0; i <= anzahlPunkte; i++) {
                const t = anzahlPunkte > 0 ? i / anzahlPunkte : 0;

                const position = {
                    x: qt.auflagepunkte.links.x + (qt.auflagepunkte.rechts.x - qt.auflagepunkte.links.x) * t,
                    y: qt.auflagepunkte.links.y + (qt.auflagepunkte.rechts.y - qt.auflagepunkte.links.y) * t + qt.abmessungen.hoehe / 2,
                    z: qt.auflagepunkte.links.z + (qt.auflagepunkte.rechts.z - qt.auflagepunkte.links.z) * t
                };

                punkte.push({
                    quertraeger: qt.name,
                    position: position,
                    index: i,
                    typ: "oberkante"
                });
            }
        });

        return punkte;
    }

    // ========================================================================
    // DEBUG
    // ========================================================================

    /**
     * Debug-Labels hinzufügen (für Entwicklung)
     */
    fuegeDebugLabelsHinzu(mesh, positionen) {
        const createLabel = (text, position, color = "#ffffff") => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = 512;
            canvas.height = 128;
            ctx.fillStyle = color;
            ctx.font = "Bold 48px Arial";
            ctx.textAlign = "center";
            ctx.fillText(text, 256, 80);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(position);
            sprite.scale.set(0.3, 0.075, 1);
            return sprite;
        };

        if (positionen.quertraegerOben) {
            mesh.add(createLabel("Querträgeroberkante", positionen.quertraegerOben, "#ff0000"));
        }
        if (positionen.laengstraegerOben) {
            mesh.add(createLabel("Längsträgeroberkante", positionen.laengstraegerOben, "#00ff00"));
        }
        if (positionen.keilHoehe) {
            const pos = new THREE.Vector3(0, positionen.quertraegerOben.y + positionen.keilHoehe / 2, 0);
            mesh.add(createLabel(`Keilhöhe: ${(1000 * positionen.keilHoehe).toFixed(1)}mm`, pos, "#ffff00"));
        }
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Entfernt alle Querträger
     */
    entferneQuertraeger() {
        this.quertraegerListe.forEach(qt => {
            disposeEdgeHighlights(qt.mesh);

            const geometrien = Array.isArray(qt.geometrie) ? qt.geometrie : [qt.geometrie].filter(Boolean);
            geometrien.forEach(g => g?.dispose?.());

            const material = qt.material;
            const istManaged = material?.userData?.managedMaterial;
            if (material?.dispose && !istManaged) {
                material.dispose();
            }
        });

        while (this.quertraegerGruppe.children.length > 0) {
            this.quertraegerGruppe.remove(this.quertraegerGruppe.children[0]);
        }

        this.quertraegerListe = [];
    }

    // ========================================================================
    // LEGACY API (Rückwärtskompatibilität)
    // ========================================================================

    /**
     * Gibt einen Querträger nach Name zurück
     */
    gibQuertraeger(name) {
        return this.quertraegerListe.find(qt => qt.name === name) || null;
    }

    /**
     * Gibt Querträger nach Position zurück
     */
    gibQuertraegerNachPosition(position) {
        return this.quertraegerListe.filter(qt =>
            qt.position === position || qt.position.startsWith(position)
        );
    }

    /**
     * Gibt alle Querträger zurück
     */
    gibAlleQuertraeger() {
        return [...this.quertraegerListe];
    }

    /**
     * Aktualisiert die Querträger
     */
    aktualisiereQuertraeger() {
        return this.erstelleQuertraeger();
    }

    /**
     * Setzt ein neues Profil
     */
    setzeProfil(profilId) {
        if (!this.profileKonfig.setzeAktuellesProfil(profilId)) {
            return false;
        }

        if (this.koordinatenSystem?.setzeProfil) {
            this.koordinatenSystem.setzeProfil(profilId);
        }

        return this.erstelleQuertraeger();
    }

    /**
     * Debug-Ausgabe
     */
    debugQuertraeger() {
        this.logger.group("QUERTRÄGER-INFORMATIONEN");

        this.quertraegerListe.forEach(qt => {
            this.logger.group(`Querträger: ${qt.name}`);
            this.logger.info("Position:", qt.position);
            this.logger.info("Auflagepunkte:", qt.auflagepunkte);
            this.logger.info("Abmessungen:", qt.abmessungen);
            this.logger.info("Eigenschaften:", qt.eigenschaften);
            this.logger.groupEnd();
        });

        this.logger.groupEnd();
    }

    /**
     * Cleanup
     */
    dispose() {
        this.entferneQuertraeger();
        super.dispose();
    }
}
