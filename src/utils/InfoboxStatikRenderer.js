/**
 * InfoboxStatikRenderer - Statik-Rendering für den Pergola-Konfigurator
 *
 * Enthält alle Rendering-Funktionen für die Statik-Ansicht:
 * - Statik-Status und Nachrichten
 * - Träger-Tabellen (Längs- und Querträger)
 * - Pfosten-Last-Anzeige
 * - Profil-Auswahl-UI
 *
 * Extrahiert aus Infobox.js für bessere Wartbarkeit
 */

import { Logger } from "./Logger.js";

const logger = new Logger("StatikRenderer");

/**
 * Formatiert eine Zahl mit bestimmter Präzision
 * @param {number} value - Wert
 * @param {number} decimals - Anzahl Dezimalstellen
 * @returns {string} - Formatierter String oder "-"
 */
function formatNumber(value, decimals = 3) {
    return Number.isFinite(value) ? value.toFixed(decimals) : "-";
}

/**
 * Ermittelt den Style für Ausnutzungswerte
 * @param {number} util - Ausnutzungswert (0-1)
 * @returns {string} - CSS-Style-String
 */
function getUtilizationStyle(util) {
    if (!Number.isFinite(util)) return "";
    if (util >= 1) return "background-color: #ffcdd2; color: #c62828; font-weight: bold;";
    if (util >= 0.85) return "background-color: #fff9c4; color: #f57f17; font-weight: bold;";
    return "";
}

/**
 * Rendert das Statik-Markup
 * @param {object} statikData - Statik-Berechnungsergebnis
 * @param {string} pfostenProfil - Aktuelles Pfosten-Profil
 * @param {string} mitteltraegerOverride - Aktuelles Mittelträger-Profil
 * @returns {string} - HTML-Markup
 */
export function renderStatikMarkup(statikData, pfostenProfil = "160x80x4", mitteltraegerOverride = "100x80x4") {
    if (!statikData) return "<div>Keine Daten</div>";

    const statusIcon = statikData.status === "green" ? "🟢"
        : (statikData.status === "yellow" ? "🟡" : "🔴");

    const messages = (statikData.messages || [])
        .map(msg => `<li>${msg}</li>`)
        .join("") || "<li>Alle Nachweise erfüllt.</li>";

    // Längsträger-Tabelle
    const longBeamRows = (statikData.calculated_values?.long_beams || [])
        .map((beam, idx) => `
            <tr>
                <td>${beam.type || idx}</td>
                <td>${formatNumber(beam.w)} kN/m</td>
                <td>${formatNumber(beam.L, 2)} m</td>
                <td>${formatNumber(beam.M_kNm, 2)} kNm</td>
                <td>${formatNumber(beam.V_kN, 2)} kN</td>
                <td>${formatNumber(1000 * beam.delta, 2)} mm</td>
                <td style="${getUtilizationStyle(beam.util_sigma)}">${formatNumber(100 * beam.util_sigma, 1)}%</td>
                <td style="${getUtilizationStyle(beam.util_defl)}">${formatNumber(100 * beam.util_defl, 1)}%</td>
            </tr>
        `).join("");

    // Querträger-Tabelle
    const transBeamRows = (statikData.calculated_values?.trans_beams || [])
        .map((beam, idx) => `
            <tr>
                <td>${beam.position || idx}</td>
                <td>${formatNumber(beam.w)} kN/m</td>
                <td>${formatNumber(beam.L, 2)} m</td>
                <td>${formatNumber(beam.M_kNm, 2)} kNm</td>
                <td>${formatNumber(beam.V_kN, 2)} kN</td>
                <td>${formatNumber(1000 * beam.delta, 2)} mm</td>
                <td style="${getUtilizationStyle(beam.util_sigma)}">${formatNumber(100 * beam.util_sigma, 1)}%</td>
                <td style="${getUtilizationStyle(beam.util_defl)}">${formatNumber(100 * beam.util_defl, 1)}%</td>
            </tr>
        `).join("");

    // Pfosten-Daten
    const posts = statikData.calculated_values?.posts || {};

    // Profil-Auswahl
    const profilauswahlHtml = renderProfilauswahl(pfostenProfil, mitteltraegerOverride);

    return `
        <div class="statik-status" style="margin-bottom:0.75rem;">
            <strong>Status:</strong> ${statusIcon}
            <span style="margin-left:0.5rem;color:#666;">
                ${statikData.status === "green" ? "maßgebend" : "kritisch"}: ${statikData.limiting_element || "-"}
            </span>
        </div>
        <div style="margin:0.5rem 0 0.75rem 0;">
            <strong>Hinweise:</strong>
            <ul>${messages}</ul>
        </div>

        ${profilauswahlHtml}

        <div class="statics-legend" style="color:#777;font-size:0.85em;line-height:1.2;margin:0.25rem 0 0.75rem 0;">
            <strong style="color:#666">Legende:</strong>
            <span style="margin-left:0.5rem;">w = Linienlast (kN/m)</span>
            <span style="margin-left:0.75rem;">L = Spannweite (m)</span>
            <span style="margin-left:0.75rem;">M = Biegemoment (kNm)</span>
            <span style="margin-left:0.75rem;">V = Querkraft (kN)</span>
            <span style="margin-left:0.75rem;">δ = Durchbiegung (mm)</span>
            <span style="margin-left:0.75rem;">σ‑Util = Ausnutzung Biegespannung (%)</span>
            <span style="margin-left:0.75rem;">δ‑Util = Ausnutzung Durchbiegung (%)</span>
        </div>

        <div style="margin:0.75rem 0;">
            <h5>Längsträger</h5>
            <table class="material-table">
                <thead>
                    <tr>
                        <th>Typ</th><th>w</th><th>L</th><th>M</th><th>V</th><th>δ</th><th>σ-Util</th><th>δ-Util</th>
                    </tr>
                </thead>
                <tbody>${longBeamRows}</tbody>
            </table>
        </div>

        <div style="margin:0.75rem 0;">
            <h5>Querträger</h5>
            <table class="material-table">
                <thead>
                    <tr>
                        <th>Pos</th><th>w</th><th>L</th><th>M</th><th>V</th><th>δ</th><th>σ-Util</th><th>δ-Util</th>
                    </tr>
                </thead>
                <tbody>${transBeamRows}</tbody>
            </table>
        </div>

        <div style="margin:0.75rem 0;">
            <h5>Pfosten</h5>
            <div>
                Last pro Pfosten: <strong>${formatNumber(posts.N_per_post_kN, 2)} kN</strong>
                (zulässig: ${formatNumber(posts.N_allow, 0)} kN) –
                Ausnutzung: ${formatNumber(100 * (posts.util || 0), 1)}% –
                Anzahl Pfosten: ${posts.nPosts || 0}
            </div>
        </div>
    `;
}

/**
 * Rendert die Profil-Auswahl UI
 * @param {string} aktuellesProfil - Aktuelles Pfosten-Profil
 * @param {string} aktuellesMitteltraegerProfil - Aktuelles Mittelträger-Profil
 * @returns {string} - HTML-Markup
 */
export function renderProfilauswahl(aktuellesProfil, aktuellesMitteltraegerProfil) {
    const profile = [
        { id: "120x80x4", label: "120×80×4", mittel: ["80x60x4"] },
        { id: "160x80x4", label: "160×80×4", mittel: ["100x80x4", "120x80x4_mittel"] },
        { id: "200x100x4", label: "200×100×4", mittel: ["160x80x4_mittel"] }
    ];

    const profilButtons = profile.map(p => {
        const isActive = p.id === aktuellesProfil;
        const style = isActive
            ? "background: #2196f3; color: white; border: 2px solid #1976d2;"
            : "background: white; color: #666; border: 2px solid #ddd;";

        return `
            <button
                type="button"
                class="profil-btn"
                data-profil="${p.id}"
                style="padding: 0.75rem 1.5rem; margin: 0.25rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.95em; ${style}"
            >
                ${p.label}
            </button>
        `;
    }).join("");

    // Mittelträger-Auswahl für 160x80x4
    let mitteltraegerSection = "";

    if (aktuellesProfil === "160x80x4") {
        const is100x80 = aktuellesMitteltraegerProfil === "100x80x4";
        const is120x80 = aktuellesMitteltraegerProfil === "120x80x4_mittel";

        mitteltraegerSection = `
            <div style="margin-top: 1rem; padding: 0.75rem; background: #f5f5f5; border-radius: 6px;">
                <div style="margin-bottom: 0.5rem; color: #666; font-size: 0.9em;">
                    <strong>Mittelträger:</strong>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button
                        type="button"
                        class="mitteltraeger-btn"
                        data-mittel="100x80x4"
                        style="flex: 1; padding: 0.6rem; border-radius: 4px; cursor: pointer; font-weight: ${is100x80 ? "bold" : "normal"};
                               background: ${is100x80 ? "#2196f3" : "white"};
                               color: ${is100x80 ? "white" : "#666"};
                               border: 2px solid ${is100x80 ? "#1976d2" : "#ddd"};"
                    >
                        100×80mm
                    </button>
                    <button
                        type="button"
                        class="mitteltraeger-btn"
                        data-mittel="120x80x4_mittel"
                        style="flex: 1; padding: 0.6rem; border-radius: 4px; cursor: pointer; font-weight: ${is120x80 ? "bold" : "normal"};
                               background: ${is120x80 ? "#2196f3" : "white"};
                               color: ${is120x80 ? "white" : "#666"};
                               border: 2px solid ${is120x80 ? "#1976d2" : "#ddd"};"
                    >
                        120×80mm
                    </button>
                </div>
            </div>
        `;
    } else {
        // Zeige festen Mittelträger für andere Profile
        let mittelLabel = "";
        if (aktuellesProfil === "120x80x4") {
            mittelLabel = "80×60mm";
        } else if (aktuellesProfil === "200x100x4") {
            mittelLabel = aktuellesMitteltraegerProfil === "120x80x4_mittel" ? "120×80mm" : "160×80mm";
        }

        if (mittelLabel) {
            mitteltraegerSection = `
                <div style="margin-top: 0.75rem; padding: 0.5rem; background: #e3f2fd; border-radius: 4px; color: #1976d2; font-size: 0.85em;">
                    <strong>Mittelträger:</strong> ${mittelLabel}
                </div>
            `;
        }
    }

    return `
        <div style="margin: 1rem 0; padding: 1rem; background: #fafafa; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h5 style="margin: 0 0 0.75rem 0; color: #333;">Profilstärke</h5>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${profilButtons}
            </div>
            ${mitteltraegerSection}
        </div>
    `;
}

/**
 * Rendert den Carport-Modus Hinweis
 * @param {number} segmentCount - Anzahl der Segmente
 * @returns {string} - HTML-Markup oder leerer String
 */
export function renderCarportHinweis(segmentCount) {
    if (segmentCount <= 0) return "";

    return `
        <div style="padding: 1rem; margin-bottom: 0.75rem; border-left: 4px solid #ff9800; background: #fff3e0; color: #e65100;">
            ⚠️ Carport-Modus mit ${segmentCount} Segment${segmentCount > 1 ? "en" : ""}:
            Statik basiert auf der Basis-Pergola. Bitte jedes Segment separat prüfen.
        </div>
    `;
}
