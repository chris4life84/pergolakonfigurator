/**
 * InfoboxMaterialCalculator - Materialberechnungslogik für den Pergola-Konfigurator
 *
 * Enthält alle Berechnungsfunktionen für die Materialzusammenstellung:
 * - Einzelmaterial-Berechnung (Pfosten, Träger, Glas, etc.)
 * - Segment-Kombination und -Skalierung
 * - Alu-Flächen- und Meterberechnung
 *
 * Extrahiert aus Infobox.js für bessere Wartbarkeit
 */

import {
    normalisierePfostenId,
    formatMillimeter,
    formatMeter,
    extractAnzahlSuffix,
    ermittlePfostenLabel,
    normalisiereProfil
} from "./InfoboxFormatters.js";
import { Logger } from "./Logger.js";

const logger = new Logger("MaterialCalculator");

/**
 * Erstellt eine Segment-Konfiguration basierend auf Basis und Segment-Overrides
 * @param {object} basisKonfig - Basis-Konfiguration
 * @param {object} segmentOverrides - Segment-spezifische Overrides
 * @returns {object} - Zusammengeführte Segment-Konfiguration
 */
export function erstelleSegmentKonfiguration(basisKonfig, segmentOverrides = {}) {
    const result = {
        ...basisKonfig,
        pfostenVersaetze: {
            ...basisKonfig.pfostenVersaetze,
            individuell: {
                ...(basisKonfig.pfostenVersaetze?.individuell || {})
            }
        },
        pfostenKuerzung: {
            ...basisKonfig.pfostenKuerzung,
            individuell: {
                ...(basisKonfig.pfostenKuerzung?.individuell || {})
            }
        },
        pfostenAktiv: {
            ...basisKonfig.pfostenAktiv,
            individuell: {
                ...(basisKonfig.pfostenAktiv?.individuell || {})
            }
        }
    };

    // Übernehme Standard-Properties
    ["breite", "tiefe", "hoehe", "neigung", "typ", "material", "farbe",
     "dach", "dachTyp", "pfostenProfil", "regenwasserAbfluss", "befestigung"
    ].forEach(key => {
        if (segmentOverrides[key] !== undefined) {
            result[key] = segmentOverrides[key];
        }
    });

    // Übernehme Pfosten-Spezifika
    if (segmentOverrides.pfostenVersaetze) {
        result.pfostenVersaetze.individuell = { ...segmentOverrides.pfostenVersaetze };
    }
    if (segmentOverrides.pfostenKuerzung) {
        result.pfostenKuerzung.individuell = { ...segmentOverrides.pfostenKuerzung };
    }
    if (segmentOverrides.pfostenAktiv) {
        result.pfostenAktiv.individuell = { ...segmentOverrides.pfostenAktiv };
    }

    result.carportModus = false;
    result.carportSegmente = [];

    return result;
}

/**
 * Kombiniert Materialsammlungen mehrerer Segmente
 * @param {Array} segmentSammlungen - Array von Materialsammlungen
 * @returns {object} - Kombinierte Materialsammlung
 */
export function kombiniereSegmentMaterialien(segmentSammlungen = []) {
    const kategorien = ["pfosten", "laengstraeger", "quertraeger", "glas", "aluschienen"];
    const kombinierteMaterialien = {
        pfosten: [],
        laengstraeger: [],
        quertraeger: [],
        glas: [],
        aluschienen: [],
        gesamtAlu: 0,
        gesamtGlas: 0
    };

    const gruppen = {};
    kategorien.forEach(kat => gruppen[kat] = new Map());

    const baueSchluessel = item => [
        item.bezeichnung || "",
        item.profil || "",
        item.material || "",
        item.preisInfo?.kategorie || "",
        item.preisInfo?.schluessel || "",
        item.preisInfo?.typ || ""
    ].join("|");

    const kloneItem = item => JSON.parse(JSON.stringify(item));

    const formatAnzahl = (entry) => {
        if (entry.preisInfo && Number.isFinite(entry.preisInfo.anzahl)) {
            const suffix = entry.__anzahlSuffix || extractAnzahlSuffix(entry.anzahl) || "Stk";
            entry.anzahl = `${entry.preisInfo.anzahl} ${suffix}`.trim();
        }
    };

    segmentSammlungen.forEach(materialSet => {
        kategorien.forEach(kat => {
            (materialSet[kat] || []).forEach(item => {
                const key = baueSchluessel(item);
                if (!gruppen[kat].has(key)) {
                    const copy = kloneItem(item);
                    copy.__anzahlSuffix = extractAnzahlSuffix(copy.anzahl);
                    gruppen[kat].set(key, copy);
                } else {
                    const existing = gruppen[kat].get(key);
                    if (existing.preisInfo && item.preisInfo) {
                        existing.preisInfo.menge = (existing.preisInfo.menge || 0) + (item.preisInfo.menge || 0);
                        existing.preisInfo.anzahl = (existing.preisInfo.anzahl || 0) + (item.preisInfo.anzahl || 0);
                    }
                }
            });
        });
        kombinierteMaterialien.gesamtAlu += materialSet.gesamtAlu || 0;
        kombinierteMaterialien.gesamtGlas += materialSet.gesamtGlas || 0;
    });

    kategorien.forEach(kat => {
        kombinierteMaterialien[kat] = Array.from(gruppen[kat].values()).map(entry => {
            if (entry.preisInfo) {
                if (entry.preisInfo.typ === "meter") {
                    entry.gesamtLaenge = formatMeter(entry.preisInfo.menge);
                } else if (entry.preisInfo.typ === "qm") {
                    entry.gesamtLaenge = `${(entry.preisInfo.menge || 0).toFixed(2)} m²`;
                }
                formatAnzahl(entry);
            }
            delete entry.__anzahlSuffix;
            return entry;
        });
    });

    return kombinierteMaterialien;
}

/**
 * Skaliert eine Materialsammlung um einen Faktor
 * @param {object} sammlung - Materialsammlung
 * @param {number} faktor - Skalierungsfaktor
 * @returns {object} - Skalierte Sammlung
 */
export function skaliereMaterialsammlung(sammlung, faktor = 1) {
    if (faktor === 1 || !sammlung) return sammlung;

    const result = {
        pfosten: [],
        laengstraeger: [],
        quertraeger: [],
        glas: [],
        aluschienen: [],
        aluprofile: [],
        gesamtAlu: (sammlung.gesamtAlu || 0) * faktor,
        gesamtGlas: (sammlung.gesamtGlas || 0) * faktor
    };

    ["pfosten", "laengstraeger", "quertraeger", "glas", "aluschienen"].forEach(kat => {
        (sammlung[kat] || []).forEach(item => {
            result[kat].push(multipliziereItem(item, faktor));
        });
    });

    return result;
}

/**
 * Multipliziert ein einzelnes Item
 * @param {object} item - Material-Item
 * @param {number} faktor - Multiplikationsfaktor
 * @returns {object} - Multipliziertes Item
 */
export function multipliziereItem(item, faktor) {
    if (faktor === 1) return item;

    const result = { ...item };

    if (typeof result.anzahl === "string") {
        const match = result.anzahl.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
        if (match) {
            const newValue = parseFloat(match[1]) * faktor;
            result.anzahl = `${newValue} ${match[2]}`;
        }
    }

    if (typeof result.gesamtLaenge === "string") {
        const match = result.gesamtLaenge.match(/^([\d, \.]+)\s*(.*)$/);
        if (match) {
            const newValue = parseFloat(match[1].replace(",", ".")) * faktor;
            result.gesamtLaenge = `${newValue.toFixed(2).replace(".", ",")} ${match[2]}`;
        }
    }

    if (result.preisInfo) {
        result.preisInfo = { ...result.preisInfo };
        if (typeof result.preisInfo.menge === "number") {
            result.preisInfo.menge *= faktor;
        }
        if (typeof result.preisInfo.anzahl === "number") {
            result.preisInfo.anzahl *= faktor;
        }
    }

    return result;
}

/**
 * Berechnet die Alumeter-Summe aus einer Materialsammlung
 * @param {object|Array} sammlung - Materialsammlung oder Array davon
 * @returns {number} - Gesamtmeter
 */
export function berechneAlumeterAusSammlung(sammlung) {
    if (!sammlung) return 0;

    const sumKategorie = (s) => ["pfosten", "laengstraeger", "quertraeger"].reduce((sum, kat) => {
        const items = s?.[kat] || [];
        return sum + items.reduce((itemSum, item) => itemSum + (Number(item?.preisInfo?.menge) || 0), 0);
    }, 0);

    if (Array.isArray(sammlung)) {
        return sammlung.reduce((sum, s) => sum + berechneAlumeterAusSammlung(s), 0);
    }

    return sumKategorie(sammlung);
}

/**
 * Liest einen individuellen Versatz-Eintrag
 * @param {number|object} eintrag - Versatz-Wert oder -Objekt
 * @returns {object|null} - Normalisierter Eintrag {achse, wert}
 */
export function leseIndividuellenVersatzEintrag(eintrag) {
    if (typeof eintrag === "number") {
        return { achse: "x", wert: Number(eintrag) };
    }

    if (typeof eintrag === "object" && eintrag !== null) {
        const achse = typeof eintrag.achse === "string"
            ? eintrag.achse
            : (typeof eintrag.axis === "string" ? eintrag.axis : "x");
        const wert = Number(eintrag.wert ?? eintrag.value ?? 0);
        if (Number.isFinite(wert)) {
            return { achse, wert };
        }
    }

    return null;
}

/**
 * Liest den Pfosten-Versatz (seitlich)
 * @param {object} config - Konfiguration
 * @param {string} pfostenId - Pfosten-ID
 * @param {string} achse - Achse ("x" oder "z")
 * @returns {number} - Versatz-Wert
 */
export function lesePfostenVersatz(config, pfostenId, achse) {
    const normId = normalisierePfostenId(pfostenId);
    const individuell = config.pfostenVersaetze?.individuell || {};
    const eintrag = individuell[normId] ?? individuell[pfostenId];

    if (eintrag !== undefined) {
        const parsed = leseIndividuellenVersatzEintrag(eintrag);
        if (parsed && parsed.achse === achse) return parsed.wert;
        if (parsed && achse === "x" && (parsed.achse === "x" || parsed.achse === undefined)) {
            return parsed.wert;
        }
    }

    if (achse === "x") {
        if (normId.startsWith("vorne")) return Number(config.pfostenVersaetze?.vorne || 0);
        if (normId.startsWith("hinten")) return Number(config.pfostenVersaetze?.hinten || 0);
    }

    return 0;
}

/**
 * Liest den Pfosten-Versatz (Tiefe)
 * @param {object} config - Konfiguration
 * @param {string} pfostenId - Pfosten-ID
 * @returns {number} - Versatz-Wert
 */
export function lesePfostenVersatzTiefe(config, pfostenId) {
    const normId = normalisierePfostenId(pfostenId);
    const individuell = config.pfostenVersaetze?.individuell || {};
    const eintrag = individuell[normId] ?? individuell[pfostenId];
    const parsed = leseIndividuellenVersatzEintrag(eintrag);
    return (parsed && parsed.achse === "z") ? parsed.wert : 0;
}

/**
 * Prüft ob Segmente identisch sind
 * @param {Array} segmentList - Liste der Segmente
 * @param {object} referenzKonfiguration - Referenz-Konfiguration
 * @returns {boolean} - true wenn alle identisch
 */
export function segmenteSindIdentisch(segmentList = [], referenzKonfiguration = {}) {
    if (segmentList.length <= 1) return true;

    const first = segmentList[0];
    const keys = ["breite", "tiefe", "hoehe", "neigung", "dachTyp", "pfostenProfil"];

    const isClose = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) < 1e-3;

    const compareBitmask = (segA, segB) => {
        return keys.every(key => {
            if (["breite", "tiefe", "hoehe", "neigung"].includes(key)) {
                return isClose(segA[key], segB[key] ?? referenzKonfiguration[key]);
            }
            return (segA[key] ?? referenzKonfiguration[key]) === (segB[key] ?? referenzKonfiguration[key]);
        });
    };

    for (let i = 1; i < segmentList.length; i++) {
        if (!compareBitmask(first, segmentList[i])) return false;
    }

    return true;
}

/**
 * Prüft ob ein Segment der Basis-Konfiguration entspricht
 * @param {object} segmentKonfig - Segment-Konfiguration
 * @param {object} basisKonfig - Basis-Konfiguration
 * @param {object} originalesSegment - Originales Segment
 * @returns {boolean} - true wenn identisch
 */
export function segmentEntsprichtBasis(segmentKonfig = {}, basisKonfig = {}, originalesSegment = {}) {
    if (!basisKonfig) return false;

    const keys = ["breite", "tiefe", "hoehe", "neigung", "dachTyp", "pfostenProfil"];
    const isClose = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) < 1e-3;
    const eps = 1e-4;
    const diffNumber = (val, base = 0) => Math.abs((Number(val) || 0) - (Number(base) || 0)) > eps;

    const hatIndividuellePfosten = () => {
        const segVers = segmentKonfig?.pfostenVersaetze || {};
        const basisVers = basisKonfig?.pfostenVersaetze || {};

        if (diffNumber(segVers.vorne, basisVers.vorne)) return true;
        if (diffNumber(segVers.hinten, basisVers.hinten)) return true;

        const indivVers = segVers.individuell || {};
        for (const key of Object.keys(indivVers || {})) {
            const eintrag = leseIndividuellenVersatzEintrag(indivVers[key]);
            const wert = eintrag ? eintrag.wert : indivVers[key];
            if (Math.abs(Number(wert) || 0) > eps) return true;
        }

        const segKurz = segmentKonfig?.pfostenKuerzung || {};
        const basisKurz = basisKonfig?.pfostenKuerzung || {};

        if (diffNumber(segKurz.vorne, basisKurz.vorne)) return true;
        if (diffNumber(segKurz.hinten, basisKurz.hinten)) return true;
        if (diffNumber(segKurz.mitte, basisKurz.mitte)) return true;

        const indivKurz = segKurz.individuell || {};
        for (const key of Object.keys(indivKurz || {})) {
            if (Math.abs(Number(indivKurz[key]) || 0) > eps) return true;
        }

        const segAktiv = segmentKonfig?.pfostenAktiv || {};
        const basisAktiv = basisKonfig?.pfostenAktiv || {};

        const normalizeBool = (val, fallback = true) => val === undefined ? fallback : val !== false;
        const baseVorne = normalizeBool(basisAktiv.vorne, true);
        const baseHinten = normalizeBool(basisAktiv.hinten, true);
        const segVorne = normalizeBool(segAktiv.vorne, baseVorne);
        const segHinten = normalizeBool(segAktiv.hinten, baseHinten);

        if (segVorne !== baseVorne) return true;
        if (segHinten !== baseHinten) return true;

        const indivAktiv = segAktiv.individuell || {};
        for (const key of Object.keys(indivAktiv || {})) {
            if (!normalizeBool(indivAktiv[key], true)) return true;
        }

        return false;
    };

    if (hatIndividuellePfosten()) return false;

    return keys.every(key => {
        const basisWert = basisKonfig[key];
        const segmentWert = segmentKonfig[key];
        if (["breite", "tiefe", "hoehe", "neigung"].includes(key)) {
            return isClose(segmentWert, basisWert);
        }
        return (segmentWert ?? basisWert) === basisWert;
    });
}

/**
 * Generiert eine Standard-Pfosten-Liste
 * @param {object} config - Konfiguration
 * @returns {Array<string>} - Liste der Pfosten-IDs
 */
export function generiereStandardPfostenListe(config) {
    const liste = ["vorne_links", "vorne_rechts", "hinten_links", "hinten_rechts"];
    if (config.breite > 4) {
        liste.push("vorne_mitte", "hinten_mitte");
    }
    if (config.tiefe > 4) {
        liste.push("mitte_links", "mitte_rechts");
    }
    if (config.zentralerMittelpfosten) {
        liste.push("mitte_zentral");
    }
    return liste;
}

/**
 * Normalisiert einen Profil-String für Schlüsselvergleiche
 * @param {string} profil - Profil-String
 * @returns {string} - Normalisierter String
 */
export function normalisiereProfilFuerSchluessel(profil = "") {
    return profil.toLowerCase().replace(/[^0-9a-z×x]/g, "").replace(/×/g, "x");
}

/**
 * Erstellt Profil-Info Objekt
 * @param {object} profil - Profil-Objekt
 * @returns {object} - Profil-Info {label, key, anzeigeBreite, anzeigeTiefe}
 */
export function erstelleProfilInfo(profil) {
    const b = Math.round(1000 * (profil?.abmessungen?.breite || 0));
    const t = Math.round(1000 * (profil?.abmessungen?.tiefe || 0));
    const gueltig = b > 0 && t > 0;
    const anzeigeBreite = gueltig ? b : 160;
    const anzeigeTiefe = gueltig ? t : 80;

    return {
        label: gueltig ? `${b} × ${t}mm` : `${anzeigeBreite} × ${anzeigeTiefe}mm`,
        key: gueltig ? `${b}x${t}` : "pfostenprofil",
        anzeigeBreite,
        anzeigeTiefe
    };
}
