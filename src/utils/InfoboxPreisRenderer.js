/**
 * InfoboxPreisRenderer - Preislisten-Rendering für den Pergola-Konfigurator
 *
 * Enthält alle Funktionen für die Preisberechnung und -darstellung:
 * - Preisberechnung aus Materialien
 * - Dienstleistungspositionen
 * - HTML-Rendering der Preisliste
 *
 * Extrahiert aus Infobox.js für bessere Wartbarkeit
 */

import { PRICE_TABLE, EXTRA_POSITIONS, VAT_RATE } from "../data/pricing.js";
import { Logger } from "./Logger.js";

const logger = new Logger("PreisRenderer");

/**
 * Findet den Preis für eine Kategorie/Schlüssel-Kombination
 * @param {string} kategorie - Preis-Kategorie
 * @param {string} schluessel - Schlüssel
 * @returns {object|null} - Preis-Konfiguration oder null
 */
function findePreis(kategorie, schluessel) {
    const kat = PRICE_TABLE[kategorie];
    if (!kat) return null;
    return kat[schluessel] || kat.default || null;
}

/**
 * Entfernt "(Segment X)" aus einer Bezeichnung
 * @param {string} bezeichnung - Bezeichnung
 * @returns {string} - Berinigte Bezeichnung
 */
function getBasisBezeichnung(bezeichnung) {
    return bezeichnung.replace(/\s*\(Segment\s+\d+\)\s*$/i, "").trim();
}

/**
 * Normalisiert eine Zahl
 * @param {*} value - Wert
 * @returns {number} - Normalisierte Zahl
 */
function normalizeNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

/**
 * Berechnet alle Preise aus einer Materialsammlung
 * @param {object} materialien - Materialsammlung
 * @param {object} config - Konfiguration
 * @param {number} gesamtAlumeterSumme - Vorberechnete Alumeter-Summe
 * @param {function} berechneAlumeterFn - Funktion zur Alumeter-Berechnung
 * @returns {object} - Preisdetails
 */
export function berechnePreise(materialien, config, gesamtAlumeterSumme = 0, berechneAlumeterFn = null) {
    const materialPositionen = [];
    const dienstleistungsPositionen = [];
    let gesamtNetto = 0;

    // Gruppierung für Preisliste: Sammle Items nach Basis-Bezeichnung
    const groupedItems = new Map();

    // Materialpositionen - gruppiert
    const kategorien = ["pfosten", "laengstraeger", "quertraeger", "glas", "aluschienen", "seitenprofile", "aluprofile"];

    kategorien.forEach(kategorie => {
        const items = materialien[kategorie] || [];
        items.forEach(item => {
            if (!item.preisInfo) return;

            const { kategorie: kat, schluessel, typ, menge, anzahl, displayName } = item.preisInfo;
            const preisConfig = findePreis(kat, schluessel);
            if (!preisConfig) return;

            // Basis-Bezeichnung ohne "(Segment X)"
            const vollBezeichnung = displayName || item.bezeichnung;
            const basisBezeichnung = getBasisBezeichnung(vollBezeichnung);

            // Gruppierungs-Schlüssel
            const groupKey = `${basisBezeichnung}|${kat}|${schluessel}|${typ}`;

            if (!groupedItems.has(groupKey)) {
                groupedItems.set(groupKey, {
                    bezeichnung: basisBezeichnung,
                    kategorie: kat,
                    schluessel,
                    typ,
                    menge: 0,
                    anzahl: 0,
                    preisConfig
                });
            }

            const grouped = groupedItems.get(groupKey);
            grouped.menge += menge || 0;
            grouped.anzahl += anzahl || 0;
        });
    });

    // Erstelle Preispositionen aus gruppierten Items
    groupedItems.forEach(grouped => {
        const { bezeichnung, typ, menge, preisConfig } = grouped;
        let einzelpreis = 0;
        let gesamtpreis = 0;

        if (typ === "meter" && preisConfig.unit === "kilogramm") {
            const gewicht = preisConfig.weightPerMeter * menge;
            einzelpreis = preisConfig.pricePerKg;
            gesamtpreis = gewicht * einzelpreis;
            materialPositionen.push({
                bezeichnung,
                menge: `${menge.toFixed(2)} m (${gewicht.toFixed(2)} kg)`,
                einzelpreis: `${einzelpreis.toFixed(2)} €/kg`,
                gesamtpreis
            });
        } else if (typ === "qm" && preisConfig.unit === "sqm") {
            einzelpreis = preisConfig.price;
            gesamtpreis = menge * einzelpreis;
            materialPositionen.push({
                bezeichnung,
                menge: `${menge.toFixed(2)} m²`,
                einzelpreis: `${einzelpreis.toFixed(2)} €/m²`,
                gesamtpreis
            });
        } else if (typ === "meter" && preisConfig.unit === "meter") {
            einzelpreis = preisConfig.price;
            gesamtpreis = menge * einzelpreis;
            materialPositionen.push({
                bezeichnung,
                menge: `${menge.toFixed(2)} m`,
                einzelpreis: `${einzelpreis.toFixed(2)} €/m`,
                gesamtpreis
            });
        }

        gesamtNetto += gesamtpreis;
    });

    // Berechne Gesamt-Alumeter für Vorbehandlung
    let gesamtAlumeter = Number(gesamtAlumeterSumme) || 0;
    if (!gesamtAlumeter && berechneAlumeterFn) {
        gesamtAlumeter = berechneAlumeterFn(materialien);
    }

    // Dienstleistungen - Vorbehandlung
    const vorbehandlungPreis = findePreis("vorbehandlung", "alumeter");
    if (vorbehandlungPreis && gesamtAlumeter > 0) {
        const preis = gesamtAlumeter * vorbehandlungPreis.price;
        dienstleistungsPositionen.push({
            bezeichnung: "Vorbehandlung",
            menge: `${gesamtAlumeter.toFixed(2)} m`,
            einzelpreis: `${vorbehandlungPreis.price.toFixed(2)} €/m`,
            gesamtpreis: preis,
            istDienstleistung: true
        });
        gesamtNetto += preis;
    }

    // Oberflächenbehandlung
    const aluFlaeche = materialien.gesamtAlu || 0;
    const oberflaechenPreis = findePreis("oberflaechenbehandlung", "sichtbar");
    if (oberflaechenPreis && aluFlaeche > 0) {
        const preis = aluFlaeche * oberflaechenPreis.price;
        dienstleistungsPositionen.push({
            bezeichnung: "Oberflächenbehandlung (Grundierung / Lackierung)",
            menge: `${aluFlaeche.toFixed(2)} m²`,
            einzelpreis: `${oberflaechenPreis.price.toFixed(2)} €/m²`,
            gesamtpreis: preis,
            istDienstleistung: true
        });
        gesamtNetto += preis;
    }

    // Montage
    const baseBreite = normalizeNumber(config?.breite);
    const baseTiefe = normalizeNumber(config?.tiefe);
    const baseHoehe = normalizeNumber(config?.hoehe);
    const baseMontageLaenge = baseBreite + baseTiefe + baseHoehe;

    const carportSegmente = Array.isArray(config?.carportSegmente) ? config.carportSegmente : [];
    const montageSumme = carportSegmente.reduce((sum, segment) => {
        const breite = normalizeNumber(segment?.breite) || baseBreite;
        const tiefe = normalizeNumber(segment?.tiefe) || baseTiefe;
        const hoehe = normalizeNumber(segment?.hoehe) || baseHoehe;
        return sum + breite + tiefe + hoehe;
    }, 0);

    const fallbackMultiplier = !carportSegmente.length && config?.carportModus
        ? Math.max(1, Number(config?.carportAnzahl) || 0)
        : 1;

    const gesamtLaenge = montageSumme > 0 ? montageSumme : baseMontageLaenge * fallbackMultiplier;
    const montagePreis = findePreis("montage", "gesamt");

    if (montagePreis && gesamtLaenge > 0) {
        const preis = gesamtLaenge * montagePreis.price;
        dienstleistungsPositionen.push({
            bezeichnung: "Montage (B+T+H)",
            menge: `${gesamtLaenge.toFixed(2)} m`,
            einzelpreis: `${montagePreis.price.toFixed(2)} €/m`,
            gesamtpreis: preis,
            istDienstleistung: true
        });
        gesamtNetto += preis;
    }

    // Extra-Positionen
    EXTRA_POSITIONS.forEach(extra => {
        if (extra.price > 0) {
            dienstleistungsPositionen.push({
                bezeichnung: extra.label,
                menge: "1 Stk",
                einzelpreis: `${extra.price.toFixed(2)} €`,
                gesamtpreis: extra.price,
                istDienstleistung: true
            });
            gesamtNetto += extra.price;
        } else {
            dienstleistungsPositionen.push({
                bezeichnung: extra.label,
                menge: "—",
                einzelpreis: "—",
                gesamtpreis: 0,
                leer: true,
                istDienstleistung: true
            });
        }
    });

    const mwst = gesamtNetto * VAT_RATE;
    const gesamtBrutto = gesamtNetto + mwst;

    return {
        materialPositionen,
        dienstleistungsPositionen,
        gesamtNetto,
        mwst,
        mwstSatz: VAT_RATE * 100,
        gesamtBrutto
    };
}

/**
 * Rendert die Preisliste als HTML
 * @param {object} preisDetails - Preisdetails von berechnePreise()
 * @param {object} config - Konfiguration
 * @returns {string} - HTML-Markup
 */
export function renderPreisliste(preisDetails, config) {
    let posNr = 1;

    const renderRows = (positionen, titel) => {
        if (!positionen || positionen.length === 0) return { rows: "", summe: 0 };

        let summe = 0;
        const rows = positionen.map(pos => {
            if (!pos.leer) {
                summe += pos.gesamtpreis;
            }

            if (pos.leer) {
                return `<tr style="color:#999;">
                    <td>${posNr++}</td>
                    <td>${pos.bezeichnung}</td>
                    <td style="text-align:center;">${pos.menge}</td>
                    <td style="text-align:right;">${pos.einzelpreis}</td>
                    <td style="text-align:right;">—</td>
                </tr>`;
            }

            return `<tr>
                <td>${posNr++}</td>
                <td>${pos.bezeichnung}</td>
                <td style="text-align:center;">${pos.menge}</td>
                <td style="text-align:right;">${pos.einzelpreis}</td>
                <td style="text-align:right;"><strong>${pos.gesamtpreis.toFixed(2)} €</strong></td>
            </tr>`;
        }).join("");

        return {
            rows: `<tr style="background:#e3f2fd;font-weight:bold;">
                <td colspan="5" style="padding:0.5rem;text-align:left;">${titel}</td>
            </tr>${rows}`,
            summe
        };
    };

    const materialResult = renderRows(preisDetails.materialPositionen, "📦 MATERIAL");
    const dienstleistungResult = renderRows(preisDetails.dienstleistungsPositionen, "🔧 DIENSTLEISTUNG");

    return `
        <div style="margin-bottom:1rem;padding:0.75rem;background:#f5f5f5;border-radius:4px;">
            <strong>📐 Konfiguration:</strong> ${(config.breite || 0).toFixed(2)}m × ${(config.tiefe || 0).toFixed(2)}m × ${(config.hoehe || 0).toFixed(2)}m
        </div>
        <table class="material-table">
            <thead>
                <tr>
                    <th style="width:40px;">Pos.</th>
                    <th>Bezeichnung</th>
                    <th style="width:120px;text-align:center;">Menge</th>
                    <th style="width:120px;text-align:right;">Einzelpreis</th>
                    <th style="width:120px;text-align:right;">Gesamtpreis</th>
                </tr>
            </thead>
            <tbody>
                ${materialResult.rows}
                <tr style="background:#fff3cd;font-weight:bold;">
                    <td colspan="4" style="text-align:right;padding:0.5rem;">Gesamtpreis Material:</td>
                    <td style="text-align:right;padding:0.5rem;">${materialResult.summe.toFixed(2)} €</td>
                </tr>
                ${dienstleistungResult.rows}
                <tr style="background:#fff3cd;font-weight:bold;">
                    <td colspan="4" style="text-align:right;padding:0.5rem;">Gesamtpreis Dienstleistung:</td>
                    <td style="text-align:right;padding:0.5rem;">${dienstleistungResult.summe.toFixed(2)} €</td>
                </tr>
            </tbody>
            <tfoot>
                <tr style="border-top:2px solid #333;">
                    <td colspan="4" style="text-align:right;font-weight:bold;">Zwischensumme (Netto):</td>
                    <td style="text-align:right;font-weight:bold;">${preisDetails.gesamtNetto.toFixed(2)} €</td>
                </tr>
                <tr>
                    <td colspan="4" style="text-align:right;">MwSt. (${preisDetails.mwstSatz}%):</td>
                    <td style="text-align:right;">${preisDetails.mwst.toFixed(2)} €</td>
                </tr>
                <tr style="border-top:2px solid #333;background:#f0f0f0;">
                    <td colspan="4" style="text-align:right;font-weight:bold;font-size:1.1em;">Gesamtpreis (Brutto):</td>
                    <td style="text-align:right;font-weight:bold;font-size:1.1em;color:#2e7d32;">${preisDetails.gesamtBrutto.toFixed(2)} €</td>
                </tr>
            </tfoot>
        </table>
        <div style="margin-top:1rem;padding:0.75rem;background:#fff3e0;border-left:4px solid #ff9800;font-size:0.9em;">
            ℹ️ <strong>Hinweis:</strong> Alle Preise sind Nettopreise. Positionen mit "—" sind zur Information aufgeführt und derzeit nicht kalkuliert.
        </div>
    `;
}
