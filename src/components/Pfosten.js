/**
 * Pfosten-Komponente für den Pergola-Konfigurator
 *
 * Refactored: Erbt von Component3D, nutzt Logger und StringNormalizer
 */

import { ProfileKonfiguration } from "../config/ProfileKonfiguration.js";
import { MaterialManager } from "../core/MaterialManager.js";
import { disposeEdgeHighlights } from "../utils/edgeHighlight.js";
import { createSmoothBoxGeometry, createWedgeGeometry } from "../utils/geometry.js";
import StaticsCheck from "../core/StaticsCheck.js";

// Neue Module
import { Component3D } from "../core/Component3D.js";
import { normalizePfostenId } from "../utils/StringNormalizer.js";
import { COMPONENT_NAMES, PERGOLA_TYPES, ROOF_TYPES } from "../constants/index.js";

/**
 * Pfosten-Komponente
 * Verwaltet alle Pfosten der Pergola (Eck-, Zwischen-, Mittelpfosten)
 */
export class Pfosten extends Component3D {
    /**
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     */
    constructor(koordinatenSystem, konfiguration) {
        super(COMPONENT_NAMES.PFOSTEN, koordinatenSystem, konfiguration);

        // Pfosten-spezifische Eigenschaften
        this.profileKonfig = new ProfileKonfiguration();
        this.pfostenListe = [];
        this.pfostenGruppe = this.gruppe; // Alias für Legacy-Kompatibilität
        this.pfostenGruppe.name = "PfostenGruppe";
    }

    // ========================================================================
    // COMPONENT3D INTERFACE
    // ========================================================================

    /**
     * Erstellt alle Pfosten
     * @returns {THREE.Group}
     */
    create() {
        return this.erstellePfosten();
    }

    // ========================================================================
    // HILFSMETHODEN
    // ========================================================================

    /**
     * Normalisiert eine Pfosten-ID (nutzt zentralen StringNormalizer)
     * @param {any} id - Die zu normalisierende ID
     * @returns {string}
     */
    normalisierePfostenId(id) {
        return normalizePfostenId(id);
    }

    /**
     * Ermittelt eindeutige Pfosten-Informationen
     * @param {object} positionen - Pfosten-Positionen
     * @param {Function} filterFn - Filter-Funktion
     * @returns {Array}
     */
    ermittleEindeutigePfostenInfos(positionen, filterFn) {
        if (!positionen || typeof positionen !== 'object') return [];

        const result = [];
        const seen = new Set();

        Object.keys(positionen).forEach(key => {
            const normalizedId = this.normalisierePfostenId(key);

            if (typeof filterFn === 'function' && !filterFn(normalizedId, key)) return;
            if (!normalizedId || seen.has(normalizedId)) return;

            const position = positionen[normalizedId] || positionen[key];
            if (position) {
                result.push({
                    name: normalizedId,
                    position: position,
                    rotationY: position.rotationY ?? positionen[key]?.rotationY ?? 0
                });
                seen.add(normalizedId);
            }
        });

        return result;
    }

    /**
     * Begrenzt X-Versatz basierend auf Pfosten-Position
     */
    clampVersatzX(pfostenId, versatz) {
        const normalizedId = this.normalisierePfostenId(pfostenId);
        return normalizedId.includes("mitte")
            ? Math.max(-1.5, Math.min(1.5, versatz))
            : Math.max(0, Math.min(1.5, versatz));
    }

    /**
     * Begrenzt Z-Versatz
     */
    clampVersatzZ(versatz) {
        return Math.max(-1.5, Math.min(1.5, versatz));
    }

    /**
     * Ermittelt den Versatz für einen Pfosten
     */
    ermittlePfostenVersatz(pfostenId, achse = "x") {
        const config = this.konfiguration.gibAktuelleKonfiguration();
        const normalizedId = this.normalisierePfostenId(pfostenId);
        const individuell = config.pfostenVersaetze?.individuell || {};

        const parseVersatz = (wert) => {
            if (typeof wert === "number") {
                return { achse: "x", wert: Number(wert) };
            }
            if (typeof wert === "object" && wert !== null) {
                const a = typeof wert.achse === "string" ? wert.achse :
                          typeof wert.axis === "string" ? wert.axis : "x";
                const w = Number(wert.wert ?? wert.value ?? 0);
                if (Number.isFinite(w)) {
                    return { achse: a, wert: w };
                }
            }
            return null;
        };

        const parsed = parseVersatz(individuell[normalizedId] ?? individuell[pfostenId]);

        if (parsed && parsed.achse === achse) {
            return achse === "z"
                ? this.clampVersatzZ(parsed.wert)
                : this.clampVersatzX(pfostenId, parsed.wert);
        }

        if (achse === "x") {
            if (normalizedId.startsWith("vorne")) {
                return this.clampVersatzX(pfostenId, Number(config.pfostenVersaetze?.vorne || 0));
            }
            if (normalizedId.startsWith("hinten")) {
                return this.clampVersatzX(pfostenId, Number(config.pfostenVersaetze?.hinten || 0));
            }
        }

        return 0;
    }

    /**
     * Begrenzt Tiefe auf gültigen Bereich
     */
    clampTiefe(tiefe, config) {
        const maxTiefe = Number(config?.tiefe) || 0;
        return Math.max(0, Math.min(maxTiefe, tiefe));
    }

    // ========================================================================
    // PFOSTEN-ERSTELLUNG
    // ========================================================================

    /**
     * Erstellt alle Pfosten basierend auf der Konfiguration
     * @returns {THREE.Group}
     */
    erstellePfosten() {
        this.entfernePfosten();

        const config = this.konfiguration.gibAktuelleKonfiguration();
        const positionen = this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen");

        if (config.typ === PERGOLA_TYPES.FREISTEHEND) {
            this.erstelleFreistehendenPfosten(positionen, config);
        } else {
            this.erstelleWandanschlussPfosten(positionen, config);
        }

        this.erstelleZwischenpfostenFallsNoetig(config);

        return this.pfostenGruppe;
    }

    /**
     * Prüft und erstellt Zwischenpfosten
     */
    erstelleZwischenpfostenFallsNoetig(config) {
        this.logger.debug("Zwischenpfosten-Prüfung: Manuell gesteuert");

        const hatBreitePfosten = config.zwischenpfostenBreite === true;
        const hatTiefePfosten = config.zwischenpfostenTiefe === true;

        this.logger.debug(`Zwischenpfosten Breite: ${hatBreitePfosten ? "AKTIV" : "inaktiv"}`);
        this.logger.debug(`Zwischenpfosten Tiefe: ${hatTiefePfosten ? "AKTIV" : "inaktiv"}`);

        if (!hatBreitePfosten && !hatTiefePfosten) {
            this.logger.debug("Keine Zwischenpfosten aktiviert");
            this.erstelleZentralenMittelpfosten(config);
            return;
        }

        const profilId = this.bestimmeZwischenpfostenProfil();

        if (hatBreitePfosten && hatTiefePfosten) {
            this.logger.debug("BEIDE aktiviert → Erstelle komplettes Raster");
            this.erstelleZwischenpfostenRaster(config, profilId);
        } else if (hatBreitePfosten) {
            this.logger.debug("Breite aktiviert → Zwischenpfosten unter Querträgern");
            this.erstelleZwischenpfostenFuerBreite(config, profilId);
        } else if (hatTiefePfosten) {
            this.logger.debug("Tiefe aktiviert → Zwischenpfosten unter Längsträgern");
            this.erstelleZwischenpfostenFuerTiefe(config, profilId);
        }

        this.erstelleZentralenMittelpfosten(config);
    }

    /**
     * Bestimmt das Profil für Zwischenpfosten
     * @returns {string}
     */
    bestimmeZwischenpfostenProfil() {
        const konfig = this.konfiguration.gibAktuelleKonfiguration();
        const overrideId = konfig?.zwischenpfostenProfil;

        if (overrideId) {
            const prof = this.profileKonfig.gibProfil?.(overrideId);
            if (prof?.id) {
                return prof.id;
            }
        }

        const mittelProfil = this.profileKonfig.gibMitteltraegerProfil(konfig);
        if (mittelProfil?.id) return mittelProfil.id;

        const aktuellesProfil = this.profileKonfig.gibAktuellesProfil();
        const profilId = aktuellesProfil?.id;

        const profilMapping = {
            "160x80x4": "100x80x4",
            "200x120x4": "100x80x4"
        };

        return profilMapping[profilId] || "100x80x4";
    }

    /**
     * Bestimmt Rotation für Zwischenpfosten
     */
    bestimmeRotationFuerZwischenpfosten(name, config, defaultRotation = 0) {
        const profilId = config?.pfostenProfil;
        const aktuellesProfil = this.profileKonfig.gibAktuellesProfil();
        const ist200x120 = (profilId || aktuellesProfil?.id) === "200x120x4";
        const istZwischen = typeof name === "string" &&
            (name.includes("mitte") || name.includes("zwischen"));

        if (!ist200x120 || !istZwischen) return defaultRotation;

        const istVorneHintenMitte = ["vorne", "hinten"].some(prefix =>
            name.startsWith(prefix)) && name.includes("mitte");

        return istVorneHintenMitte ? 0 : defaultRotation;
    }

    /**
     * Erstellt Zwischenpfosten für Breite (unter Querträgern)
     */
    erstelleZwischenpfostenFuerBreite(config, profilId) {
        const positionen = this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen");
        const mittelpunktX = config.breite / 2;

        // Vorne Mitte
        if (positionen.vorneLinks && positionen.vorneRechts &&
            this.istPfostenAktiv("vorne_mitte", config)) {

            const xPos = mittelpunktX + this.ermittlePfostenVersatz("vorne_mitte", "x", config);
            const zPos = this.clampTiefe(positionen.vorneLinks.boden.z, config);

            const pfosten = this.erstelleZwischenpfosten(
                "vorne_mitte", xPos, zPos,
                positionen.vorneLinks, positionen.vorneRechts,
                config, profilId, 0
            );

            if (pfosten) {
                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            }
        }

        // Hinten Mitte
        if (positionen.hintenLinks && positionen.hintenRechts &&
            this.istPfostenAktiv("hinten_mitte", config)) {

            const xPos = mittelpunktX + this.ermittlePfostenVersatz("hinten_mitte", "x", config);
            const zPos = this.clampTiefe(positionen.hintenLinks.boden.z, config);

            const pfosten = this.erstelleZwischenpfosten(
                "hinten_mitte", xPos, zPos,
                positionen.hintenLinks, positionen.hintenRechts,
                config, profilId, 0
            );

            if (pfosten) {
                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            }
        }
    }

    /**
     * Erstellt Zwischenpfosten für Tiefe (unter Längsträgern)
     */
    erstelleZwischenpfostenFuerTiefe(config, profilId) {
        const positionen = this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen");
        const laengstraegerRef = this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz");
        const mittelpunktZ = config.tiefe / 2;

        // Mitte Links
        if (positionen.vorneLinks && positionen.hintenLinks &&
            laengstraegerRef?.links && this.istPfostenAktiv("mitte_links", config)) {

            const xPos = laengstraegerRef.links.start.x;
            const zPos = this.clampTiefe(
                mittelpunktZ + this.ermittlePfostenVersatz("mitte_links", "z"),
                config
            );

            const pfosten = this.erstelleZwischenpfosten(
                "mitte_links", xPos, zPos,
                positionen.vorneLinks, positionen.hintenLinks,
                config, profilId, Math.PI / 2
            );

            if (pfosten) {
                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            }
        }

        // Mitte Rechts
        if (positionen.vorneRechts && positionen.hintenRechts &&
            laengstraegerRef?.rechts && this.istPfostenAktiv("mitte_rechts", config)) {

            const xPos = laengstraegerRef.rechts.start.x;
            const zPos = this.clampTiefe(
                mittelpunktZ + this.ermittlePfostenVersatz("mitte_rechts", "z"),
                config
            );

            const pfosten = this.erstelleZwischenpfosten(
                "mitte_rechts", xPos, zPos,
                positionen.vorneRechts, positionen.hintenRechts,
                config, profilId, Math.PI / 2
            );

            if (pfosten) {
                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            }
        }
    }

    /**
     * Erstellt das komplette Zwischenpfosten-Raster
     */
    erstelleZwischenpfostenRaster(config, profilId) {
        const positionen = this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen");
        const mittelpunktX = config.breite / 2;
        const mittelpunktZ = config.tiefe / 2;

        // Zentraler Pfosten
        if (this.istPfostenAktiv("mitte_zentral", config)) {
            const xPos = mittelpunktX + this.ermittlePfostenVersatz("mitte_zentral", "x", config);
            const zPos = this.clampTiefe(mittelpunktZ, config);

            const pfosten = this.erstelleZwischenpfosten(
                "mitte_zentral", xPos, zPos,
                positionen.vorneLinks, positionen.hintenRechts,
                config, profilId, 0
            );

            if (pfosten) {
                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
                this.logger.debug("Zentraler Zwischenpfosten erstellt");
            }
        }

        // Vorne Mitte
        if (positionen.vorneLinks && positionen.vorneRechts &&
            this.istPfostenAktiv("vorne_mitte", config)) {

            const xPos = mittelpunktX + this.ermittlePfostenVersatz("vorne_mitte", "x", config);
            const pfosten = this.erstelleZwischenpfosten(
                "vorne_mitte", xPos,
                this.clampTiefe(positionen.vorneLinks.boden.z, config),
                positionen.vorneLinks, positionen.vorneRechts,
                config, profilId, 0
            );

            if (pfosten) {
                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            }
        }

        // Hinten Mitte
        if (positionen.hintenLinks && positionen.hintenRechts &&
            this.istPfostenAktiv("hinten_mitte", config)) {

            const xPos = mittelpunktX + this.ermittlePfostenVersatz("hinten_mitte", "x", config);
            const pfosten = this.erstelleZwischenpfosten(
                "hinten_mitte", xPos,
                this.clampTiefe(positionen.hintenLinks.boden.z, config),
                positionen.hintenLinks, positionen.hintenRechts,
                config, profilId, 0
            );

            if (pfosten) {
                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            }
        }

        // Seitliche Zwischenpfosten
        const laengstraegerRef = this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz");

        if (positionen.vorneLinks && positionen.hintenLinks &&
            laengstraegerRef?.links && this.istPfostenAktiv("mitte_links", config)) {

            const xPos = laengstraegerRef.links.start.x;
            const zPos = this.clampTiefe(
                mittelpunktZ + this.ermittlePfostenVersatz("mitte_links", "z"),
                config
            );

            const pfosten = this.erstelleZwischenpfosten(
                "mitte_links", xPos, zPos,
                positionen.vorneLinks, positionen.hintenLinks,
                config, profilId, Math.PI / 2
            );

            if (pfosten) {
                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            }
        }

        if (positionen.vorneRechts && positionen.hintenRechts &&
            laengstraegerRef?.rechts && this.istPfostenAktiv("mitte_rechts", config)) {

            const xPos = laengstraegerRef.rechts.start.x;
            const zPos = this.clampTiefe(
                mittelpunktZ + this.ermittlePfostenVersatz("mitte_rechts", "z"),
                config
            );

            const pfosten = this.erstelleZwischenpfosten(
                "mitte_rechts", xPos, zPos,
                positionen.vorneRechts, positionen.hintenRechts,
                config, profilId, Math.PI / 2
            );

            if (pfosten) {
                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            }
        }

        this.logger.debug(`Zwischenpfosten-Raster erstellt: ${this.pfostenListe.length} Pfosten gesamt`);
    }

    /**
     * Erstellt den zentralen Mittelpfosten (bei großen Spannweiten)
     */
    erstelleZentralenMittelpfosten(config) {
        if (!config?.zentralerMittelpfosten) return;
        if (config.typ !== PERGOLA_TYPES.FREISTEHEND) return;
        if (!this.istPfostenAktiv("mitte_zentral", config)) return;

        const abhaengigeWerte = this.konfiguration.berechneAbhaengigeWerte();
        const versatzX = this.ermittlePfostenVersatz("mitte_zentral", "x");
        const versatzZ = this.ermittlePfostenVersatz("mitte_zentral", "z");

        const aktuellesProfil = this.profileKonfig?.gibAktuellesProfil?.();
        const halbeBreite = aktuellesProfil?.abmessungen?.breite
            ? aktuellesProfil.abmessungen.breite / 2
            : 0;

        let xPos = config.breite / 2 + versatzX;
        xPos = Math.max(halbeBreite, Math.min(config.breite - halbeBreite, xPos));

        let zPos = this.clampTiefe(config.tiefe / 2 + versatzZ, config);

        const tRatio = config.tiefe > 0 ? zPos / config.tiefe : 0;
        const laengstraegerRef = this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz");

        let oberkanteY;
        let naechsterLaengstraeger = null;

        if (laengstraegerRef) {
            const kandidaten = [];

            if (Array.isArray(laengstraegerRef.zwischen)) {
                laengstraegerRef.zwischen.forEach(ref => kandidaten.push({ ref, typ: "zwischen" }));
            }
            if (laengstraegerRef.links) kandidaten.push({ ref: laengstraegerRef.links, typ: "links" });
            if (laengstraegerRef.rechts) kandidaten.push({ ref: laengstraegerRef.rechts, typ: "rechts" });

            naechsterLaengstraeger = kandidaten.reduce((best, item) => {
                const ref = item.ref;
                if (!ref?.start || !ref?.ende) return best;
                const dist = Math.abs(ref.start.x - xPos);
                return (!best || dist < best.dist) ? { dist, ref, typ: item.typ } : best;
            }, null);
        }

        if (naechsterLaengstraeger?.ref?.start && naechsterLaengstraeger.ref.ende) {
            const { ref, typ } = naechsterLaengstraeger;
            const deltaZ = ref.ende.z - ref.start.z;
            const t = deltaZ !== 0 ? (zPos - ref.start.z) / deltaZ : 0;
            const tClamped = Math.max(0, Math.min(1, t));
            const epdmOffset = (config.dachTyp === ROOF_TYPES.EPDM && typ === "zwischen") ? 0.02 : 0;
            oberkanteY = ref.start.y + (ref.ende.y - ref.start.y) * tClamped - epdmOffset;
        } else {
            const epdmOffset = config.dachTyp === ROOF_TYPES.EPDM ? 0.02 : 0;
            oberkanteY = abhaengigeWerte.vordereHoehe + abhaengigeWerte.hoehenDifferenz * tRatio - epdmOffset;
        }

        const bodenPosition = { x: xPos, y: 0, z: zPos };
        const oberkantePosition = { x: xPos, y: oberkanteY, z: zPos };

        const rotation = this.bestimmeRotationFuerZwischenpfosten("mitte_zentral", config, 0);
        const konfig = this.konfiguration.gibAktuelleKonfiguration();
        const mittelProfil = this.profileKonfig.gibMitteltraegerProfil(konfig);

        const pfosten = this.erstelleEinzelnenPfosten(
            "mitte_zentral", bodenPosition, oberkantePosition,
            config, this.pfostenListe.length, rotation, mittelProfil
        );

        const kopfkeil = this.erstellePfostenKopfKeil(pfosten, naechsterLaengstraeger, config);
        if (kopfkeil) {
            pfosten.mesh.add(kopfkeil.mesh);
            pfosten.kopfkeil = kopfkeil;
        }

        this.pfostenListe.push(pfosten);
        this.pfostenGruppe.add(pfosten.mesh);
        this.fuegeMaueransatzHinzu(pfosten);
    }

    /**
     * Erstellt einen Zwischenpfosten
     */
    erstelleZwischenpfosten(name, xPos, zPos, refLinks, refRechts, config, profilId, rotation = 0) {
        const startZ = refLinks?.boden?.z ?? 0;
        const deltaZ = (refRechts?.boden?.z ?? 0) - startZ;

        let t = 0;
        if (Math.abs(deltaZ) > 1e-6) {
            t = (zPos - startZ) / deltaZ;
        }
        t = Math.max(0, Math.min(1, t));

        const bodenYLinks = refLinks?.boden?.y ?? 0;
        const bodenYRechts = refRechts?.boden?.y ?? 0;
        const oberkanteYLinks = refLinks?.oberkante?.y ?? 0;
        const oberkanteYRechts = refRechts?.oberkante?.y ?? 0;

        const bodenPosition = {
            x: xPos,
            y: bodenYLinks + (bodenYRechts - bodenYLinks) * t,
            z: zPos
        };

        const oberkantePosition = {
            x: xPos,
            y: oberkanteYLinks + (oberkanteYRechts - oberkanteYLinks) * t,
            z: zPos
        };

        const finalRotation = this.bestimmeRotationFuerZwischenpfosten(name, config, rotation);
        const profil = this.profileKonfig.gibProfil(profilId) || this.profileKonfig.gibAktuellesProfil();

        return this.erstelleEinzelnenPfosten(name, bodenPosition, oberkantePosition, config, 999, finalRotation, profil);
    }

    /**
     * Fügt Maueransatz zur Gruppe hinzu
     */
    fuegeMaueransatzHinzu(pfosten) {
        const maueransatzMesh = pfosten?.maueransatz?.mesh;
        if (maueransatzMesh && !this.pfostenGruppe.children.includes(maueransatzMesh)) {
            this.pfostenGruppe.add(maueransatzMesh);
        }
    }

    /**
     * Erstellt Kopf-Keil für schräge Mittelpfosten
     */
    erstellePfostenKopfKeil(pfosten, laengstraegerInfo, config) {
        if (!pfosten || !this.sollPfostenObenAngeschraegt(pfosten?.name)) return null;

        const abmessungen = pfosten.abmessungen || {};
        const breite = abmessungen.breite || 0;
        const tiefe = abmessungen.tiefe || 0;

        if (breite <= 0 || tiefe <= 0) return null;

        const oberkanteY = pfosten.positionen?.oberkante?.y;
        if (!Number.isFinite(oberkanteY)) return null;

        const halbeTiefe = tiefe / 2;
        const mittelpunktZ = pfosten.positionen?.mittelpunkt?.z ?? 0;

        const abhaengigeWerte = this.konfiguration?.berechneAbhaengigeWerte?.();
        const steigung = config?.tiefe ? (abhaengigeWerte?.hoehenDifferenz || 0) / config.tiefe : 0;

        const ref = laengstraegerInfo?.ref;
        const typ = laengstraegerInfo?.typ;

        const berechneYFuerOffset = (offset) => {
            if (ref?.start && ref?.ende) {
                const deltaZ = ref.ende.z - ref.start.z;
                let t = deltaZ !== 0 ? (mittelpunktZ + offset - ref.start.z) / deltaZ : 0;
                t = Math.max(0, Math.min(1, t));
                const epdmOffset = (config.dachTyp === ROOF_TYPES.EPDM && typ === "zwischen") ? 0.02 : 0;
                return ref.start.y + (ref.ende.y - ref.start.y) * t - epdmOffset;
            }
            return oberkanteY + steigung * offset;
        };

        const vorneDiff = berechneYFuerOffset(halbeTiefe) - oberkanteY;
        const hintenDiff = berechneYFuerOffset(-halbeTiefe) - oberkanteY;

        if (Math.abs(vorneDiff) < 1e-5 && Math.abs(hintenDiff) < 1e-5) return null;

        const geometrie = createWedgeGeometry(breite, tiefe, hintenDiff, vorneDiff);
        const mesh = new THREE.Mesh(geometrie, pfosten.material);
        mesh.position.set(0, abmessungen.hoehe / 2, 0);

        return { mesh, geometrie };
    }

    /**
     * Prüft ob Pfosten oben angeschrägt werden soll
     */
    sollPfostenObenAngeschraegt(name) {
        if (typeof name !== "string") return false;
        const lower = name.toLowerCase();
        return !lower.includes("vorne") && !lower.includes("hinten") &&
               (lower.includes("mitte") || lower.includes("zwischen"));
    }

    /**
     * Erstellt freistehende Pfosten
     */
    erstelleFreistehendenPfosten(positionen, config) {
        this.ermittleEindeutigePfostenInfos(positionen, id => !id.startsWith("wand"))
            .forEach(({ name, position, rotationY }, index) => {
                if (!position) return;
                if (!this.istPfostenAktiv(name, config)) return;

                const rotation = this.bestimmeRotationFuerZwischenpfosten(name, config, rotationY || 0);
                const pfosten = this.erstelleEinzelnenPfosten(
                    name, position.boden, position.oberkante, config, index, rotation
                );

                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            });
    }

    /**
     * Erstellt Wandanschluss-Pfosten
     */
    erstelleWandanschlussPfosten(positionen, config) {
        this.ermittleEindeutigePfostenInfos(positionen,
            id => id.startsWith("vorne") || id.startsWith("mitte"))
            .forEach(({ name, position, rotationY }, index) => {
                if (!position) return;
                if (!this.istPfostenAktiv(name, config)) return;

                const rotation = this.bestimmeRotationFuerZwischenpfosten(name, config, rotationY || 0);
                const pfosten = this.erstelleEinzelnenPfosten(
                    name, position.boden, position.oberkante, config, index, rotation
                );

                this.pfostenListe.push(pfosten);
                this.pfostenGruppe.add(pfosten.mesh);
                this.fuegeMaueransatzHinzu(pfosten);
            });
    }

    /**
     * Erstellt einen einzelnen Pfosten
     */
    erstelleEinzelnenPfosten(name, boden, oberkante, config, index, rotationY = 0, profilOverride = null) {
        const kuerzung = this.berechneKuerzungFuerPfosten(name, config, boden);
        const kuerzungClamped = Math.max(0, kuerzung);

        const ankerplatteOffset = config?.befestigung === "ankerplatte" ? 0.06 : 0;
        const einbetonierOffset = config?.befestigung === "einbetonieren" ? 0.7 : 0;

        const angepassteBoden = {
            x: boden.x,
            y: boden.y + kuerzungClamped + ankerplatteOffset - einbetonierOffset,
            z: boden.z
        };

        const hoehe = oberkante.y - angepassteBoden.y;
        const profil = profilOverride || this.profileKonfig.gibAktuellesProfil();
        const breite = profil.abmessungen.breite;
        const tiefe = profil.abmessungen.tiefe;

        const geometrie = createSmoothBoxGeometry(breite, hoehe, tiefe);
        const material = this.erstellePfostenMaterial(config);
        const mesh = new THREE.Mesh(geometrie, material);

        const mittelpunkt = {
            x: (angepassteBoden.x + oberkante.x) / 2,
            y: (angepassteBoden.y + oberkante.y) / 2,
            z: (angepassteBoden.z + oberkante.z) / 2
        };

        mesh.position.set(mittelpunkt.x, mittelpunkt.y, mittelpunkt.z);

        const neigung = Math.atan2(oberkante.z - angepassteBoden.z, oberkante.y - angepassteBoden.y);
        mesh.rotation.x = neigung;
        mesh.rotation.y = rotationY;

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `Pfosten_${name}`;

        const pfostenDaten = {
            name: name,
            mesh: mesh,
            geometrie: geometrie,
            material: material,
            positionen: {
                boden: { ...boden },
                angepassteBoden: { ...angepassteBoden },
                oberkante: { ...oberkante },
                mittelpunkt: { ...mittelpunkt }
            },
            abmessungen: {
                breite: breite,
                tiefe: tiefe,
                hoehe: hoehe
            },
            eigenschaften: {
                typ: config.typ,
                material: config.material,
                farbe: config.farbe,
                profil: profil.id,
                profilName: profil.name,
                rotationY: rotationY,
                rotationYGrad: (180 * rotationY) / Math.PI,
                kuerzung: kuerzungClamped,
                kuerzungOriginal: kuerzung
            }
        };

        // Maueransatz erstellen falls nötig
        if (kuerzungClamped > 1e-6) {
            const maueransatz = this.erstelleMaueransatz(
                angepassteBoden, kuerzungClamped, breite, tiefe, rotationY, config
            );
            if (maueransatz) {
                pfostenDaten.maueransatz = maueransatz;
            }
        }

        return pfostenDaten;
    }

    /**
     * Prüft ob ein Pfosten aktiv ist
     */
    istPfostenAktiv(name, config) {
        const normalizedId = this.normalisierePfostenId(name);

        if (!config?.pfostenAktiv) return true;

        // Zentraler Mittelpfosten hat eigene Logik
        if (normalizedId === "mitte_zentral" || name === "mitte_zentral") {
            return config.zentralerMittelpfosten === true;
        }

        const individuell = config.pfostenAktiv.individuell || {};

        if (individuell[normalizedId] !== undefined) {
            return individuell[normalizedId] === true;
        }
        if (name !== normalizedId && individuell[name] !== undefined) {
            return individuell[name] === true;
        }

        // Gruppenlogik
        if (normalizedId.startsWith("vorne")) {
            return config.pfostenAktiv.vorne !== false;
        }
        if (normalizedId.startsWith("hinten")) {
            return config.pfostenAktiv.hinten !== false;
        }
        if (normalizedId.startsWith("mitte")) {
            return config.pfostenAktiv.vorne !== false && config.pfostenAktiv.hinten !== false;
        }

        return true;
    }

    /**
     * Berechnet Kürzung für einen Pfosten
     */
    berechneKuerzungFuerPfosten(name, config, bodenPosition = null) {
        if (!config?.pfostenKuerzung) return 0;

        const normalizedId = this.normalisierePfostenId(name);
        const idStr = typeof normalizedId === "string" ? normalizedId : "";
        const individuell = config.pfostenKuerzung.individuell || {};

        if (individuell[idStr] !== undefined) {
            return Number(individuell[idStr]) || 0;
        }
        if (name !== idStr && individuell[name] !== undefined) {
            return Number(individuell[name]) || 0;
        }

        const kuerzungVorne = Number(config.pfostenKuerzung.vorne) || 0;
        const kuerzungHinten = Number(config.pfostenKuerzung.hinten) || 0;
        const kuerzungMitte = Number(config.pfostenKuerzung.mitte) || 0;

        if (idStr.includes("mitte") || idStr.includes("zwischen")) {
            return kuerzungMitte;
        }
        if (idStr.startsWith("vorne") || idStr.includes("front")) {
            return kuerzungVorne;
        }
        if (idStr.startsWith("hinten") || idStr.includes("rear")) {
            return kuerzungHinten;
        }

        // Interpolation basierend auf Z-Position
        const zPos = bodenPosition?.z;
        const tiefe = parseFloat(String(config.tiefe ?? 0).toString().replace(",", ".")) || 0;

        if (typeof zPos === "number" && tiefe > 0) {
            const t = Math.min(Math.max(zPos / tiefe, 0), 1);
            return kuerzungVorne + (kuerzungHinten - kuerzungVorne) * t;
        }

        return kuerzungMitte;
    }

    /**
     * Erstellt einen Maueransatz
     */
    erstelleMaueransatz(position, kuerzung, breite, tiefe, rotation, config) {
        const skalierteBreite = 1.2 * breite;
        const skalierteTiefe = 1.2 * tiefe;
        const istAnkerplatte = config?.befestigung === "ankerplatte";

        const kuerzungHoehe = Math.max(kuerzung, 0);
        const bodenY = istAnkerplatte ? position.y - 0.02 : position.y;
        const startY = istAnkerplatte ? 0.04 : Math.max(bodenY - kuerzungHoehe, 0);
        const ansatzHoehe = Math.max(bodenY - startY, 0);

        if (ansatzHoehe <= 0) return null;

        const geometrie = new THREE.BoxGeometry(skalierteBreite, ansatzHoehe, skalierteTiefe);
        const material = new THREE.MeshPhongMaterial({
            color: "#999999",
            shininess: 5,
            specular: "#222222",
            transparent: true,
            opacity: 0.25,
            wireframe: false
        });

        const mesh = new THREE.Mesh(geometrie, material);
        const mittelpunktY = startY + ansatzHoehe / 2;

        mesh.position.set(position.x, mittelpunktY, position.z);
        mesh.rotation.y = rotation;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `Maueransatz_${position.x}_${position.z}`;

        return {
            mesh: mesh,
            geometrie: geometrie,
            material: material,
            hoehe: kuerzungHoehe
        };
    }

    /**
     * Erstellt Pfosten-Material
     */
    erstellePfostenMaterial(config) {
        return MaterialManager.gibStrukturMaterial({
            teil: "pfosten",
            config: config
        });
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Entfernt alle Pfosten
     */
    entfernePfosten() {
        this.pfostenListe.forEach(pfosten => {
            disposeEdgeHighlights(pfosten.mesh);
            pfosten.geometrie.dispose();

            const material = pfosten.material;
            const istManaged = material?.userData?.managedMaterial;
            if (material?.dispose && !istManaged) {
                material.dispose();
            }

            if (pfosten.maueransatz) {
                pfosten.maueransatz.geometrie.dispose();
                if (pfosten.maueransatz.material.dispose) {
                    pfosten.maueransatz.material.dispose();
                }
            }

            if (pfosten.kopfkeil) {
                if (pfosten.kopfkeil.mesh?.parent) {
                    pfosten.kopfkeil.mesh.parent.remove(pfosten.kopfkeil.mesh);
                }
                pfosten.kopfkeil.geometrie?.dispose();
            }
        });

        while (this.pfostenGruppe.children.length > 0) {
            this.pfostenGruppe.remove(this.pfostenGruppe.children[0]);
        }

        this.pfostenListe = [];
    }

    // ========================================================================
    // LEGACY API (Rückwärtskompatibilität)
    // ========================================================================

    /**
     * Gibt einen Pfosten nach Name zurück
     * @param {string} name
     * @returns {object|null}
     */
    gibPfosten(name) {
        return this.pfostenListe.find(p => p.name === name) || null;
    }

    /**
     * Gibt alle Pfosten zurück
     * @returns {Array}
     */
    gibAllePfosten() {
        return [...this.pfostenListe];
    }

    /**
     * Aktualisiert die Pfosten
     * @returns {THREE.Group}
     */
    aktualisierePfosten() {
        return this.erstellePfosten();
    }

    /**
     * Setzt ein neues Profil
     * @param {string} profilId
     * @returns {THREE.Group|boolean}
     */
    setzeProfil(profilId) {
        if (!this.profileKonfig.setzeAktuellesProfil(profilId)) {
            return false;
        }

        if (this.koordinatenSystem?.setzeProfil) {
            this.koordinatenSystem.setzeProfil(profilId);
        }

        return this.erstellePfosten();
    }

    /**
     * Debug-Ausgabe
     */
    debugPfosten() {
        this.logger.group("PFOSTEN-INFORMATIONEN");

        this.pfostenListe.forEach(pfosten => {
            this.logger.group(`Pfosten: ${pfosten.name}`);
            this.logger.info("Positionen:", pfosten.positionen);
            this.logger.info("Abmessungen:", pfosten.abmessungen);
            this.logger.info("Eigenschaften:", pfosten.eigenschaften);
            this.logger.groupEnd();
        });

        this.logger.groupEnd();
    }

    /**
     * Cleanup
     */
    dispose() {
        this.entfernePfosten();
        super.dispose();
    }
}
