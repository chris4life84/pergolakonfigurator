/**
 * InfoboxFormatters - Formatierungshilfen für den Pergola-Konfigurator
 *
 * Enthält alle Formatierungsfunktionen für die Infobox:
 * - Millimeter/Meter-Formatierung
 * - Pfosten-Label-Generierung
 * - Versatz-Anzeige
 * - ID-Normalisierung
 *
 * Extrahiert aus Infobox.js für bessere Wiederverwendbarkeit
 */

/**
 * Pfosten-Label-Mapping
 */
const PFOSTEN_LABELS = {
    vorne_links: "vorne links",
    vorne_rechts: "vorne rechts",
    hinten_links: "hinten links",
    hinten_rechts: "hinten rechts",
    vorne_mitte: "vorne (Mitte)",
    hinten_mitte: "hinten (Mitte)",
    mitte_links: "seitlich links (Mitte)",
    mitte_rechts: "seitlich rechts (Mitte)",
    mitte_zentral: "zentral (Mitte)"
};

/**
 * Normalisiert eine Pfosten-ID zu einem einheitlichen Format
 * @param {string} id - Pfosten-ID (z.B. "vorneLinks", "Vorne Links", "vorne-links")
 * @returns {string} - Normalisierte ID (z.B. "vorne_links")
 */
export function normalisierePfostenId(id) {
    if (typeof id !== "string") return "";
    return id
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
        .toLowerCase();
}

/**
 * Formatiert einen Wert in Millimeter
 * @param {number} value - Wert in Millimetern
 * @returns {string} - Formatierter String (z.B. "1500mm")
 */
export function formatMillimeter(value) {
    return `${Math.round(Number(value) || 0)}mm`;
}

/**
 * Formatiert einen Wert in Meter
 * @param {number} value - Wert in Metern
 * @param {number} decimals - Anzahl Dezimalstellen (Standard: 2)
 * @returns {string} - Formatierter String (z.B. "1.50 m")
 */
export function formatMeter(value, decimals = 2) {
    return `${(Number(value) || 0).toFixed(decimals)} m`;
}

/**
 * Formatiert einen Wert in Quadratmeter
 * @param {number} value - Wert in Quadratmetern
 * @param {number} decimals - Anzahl Dezimalstellen (Standard: 2)
 * @returns {string} - Formatierter String (z.B. "12.50 m²")
 */
export function formatQuadratmeter(value, decimals = 2) {
    return `${(Number(value) || 0).toFixed(decimals)} m²`;
}

/**
 * Extrahiert das Suffix aus einer Anzahl-Angabe
 * @param {string} anzahl - Anzahl-String (z.B. "4 Stk")
 * @returns {string} - Suffix (z.B. "Stk")
 */
export function extractAnzahlSuffix(anzahl = "") {
    if (!anzahl) return "";
    const match = String(anzahl).match(/^[\d\s.,+-]+(.*)$/);
    return match ? match[1].trim() : "";
}

/**
 * Ermittelt das lesbare Label für eine Pfosten-ID
 * @param {string} id - Pfosten-ID
 * @returns {string} - Lesbares Label
 */
export function ermittlePfostenLabel(id) {
    const normalisiert = normalisierePfostenId(id);
    return PFOSTEN_LABELS[normalisiert] || normalisiert.replace(/_/g, " ");
}

/**
 * Erstellt eine lesbare Versatz-Anzeige
 * @param {number} versatz - Versatz in Metern
 * @param {string} achse - Achse ("x" oder "z")
 * @returns {string} - Lesbare Anzeige
 */
export function ermittleVersatzAnzeige(versatz, achse) {
    if (!Number.isFinite(versatz) || Math.abs(versatz) < 1e-4) {
        return "0 mm";
    }

    const mm = Math.round(1000 * versatz);
    const richtung = achse === "z"
        ? (mm > 0 ? "nach hinten (+)" : "nach vorne (−)")
        : (mm > 0 ? "nach innen (+)" : "nach außen (−)");

    return `${Math.abs(mm)} mm ${richtung}`;
}

/**
 * Berechnet abhängige Werte für eine Konfiguration
 * @param {object} config - Konfigurationsobjekt
 * @returns {object} - Berechnete Werte
 */
export function berechneAbhaengigeWerteFuerKonfiguration(config) {
    const neigung = Number(config.neigung) || 0;
    const tiefe = Number(config.tiefe) || 0;
    const hoehe = Number(config.hoehe) || 0;

    // Höhendifferenz durch Neigung
    const hoehenDifferenz = Math.tan(neigung * Math.PI / 180) * tiefe;

    return {
        hoehenDifferenz,
        vordereHoehe: hoehe,
        hintereHoehe: hoehe + hoehenDifferenz,
        durchgangsHoehe: hoehe - 0.16,
        anzahlEckpfosten: config.typ === "freistehend" ? 4 : 2,
        glasflaeche: (config.dachTyp === "glas" || config.dach === "glas")
            ? (Number(config.breite) || 0) * tiefe
            : 0
    };
}

/**
 * Formatiert eine Zahl mit bestimmter Präzision
 * @param {number} value - Wert
 * @param {number} decimals - Anzahl Dezimalstellen
 * @returns {string} - Formatierter String oder "-"
 */
export function formatNumber(value, decimals = 3) {
    return Number.isFinite(value) ? value.toFixed(decimals) : "-";
}

/**
 * Normalisiert einen Profil-String für Schlüsselvergleiche
 * @param {string} profil - Profil-String (z.B. "160×80×4mm")
 * @returns {string} - Normalisierter String (z.B. "160x80x4mm")
 */
export function normalisiereProfil(profil = "") {
    return profil
        .toLowerCase()
        .replace(/[^0-9a-zäöü×x]/g, "")
        .replace(/×/g, "x");
}

/**
 * Erstellt einen Profil-Label-String
 * @param {number} breite - Profilbreite in mm
 * @param {number} tiefe - Profiltiefe in mm
 * @returns {string} - Label (z.B. "160 × 80mm")
 */
export function erstelleProfilLabel(breite, tiefe) {
    const b = Math.round(breite);
    const t = Math.round(tiefe);
    return b > 0 && t > 0 ? `${b} × ${t}mm` : "160 × 80mm";
}
