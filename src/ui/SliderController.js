/**
 * SliderController - Slider-Steuerung für den Pergola-Konfigurator
 *
 * Verwaltet alle Dimension-Slider (Breite, Tiefe, Höhe, Neigung):
 * - Range-Input Synchronisation
 * - Number-Input Validierung
 * - Werte-Clamping
 * - Event-Handling
 *
 * Extrahiert aus UIController.js für bessere Modularität
 */

import { Logger } from "../utils/Logger.js";

/**
 * Slider-Konfiguration
 */
const SLIDER_CONFIG = [
    { id: "width", property: "breite", decimals: 2 },
    { id: "depth", property: "tiefe", decimals: 2 },
    { id: "height", property: "hoehe", decimals: 2 },
    { id: "slope", property: "neigung", decimals: 1 }
];

/**
 * Klasse zur Verwaltung der Dimension-Slider
 */
export class SliderController {
    /**
     * @param {object} elemente - DOM-Elemente Referenz
     * @param {object} konfiguration - Aktuelle Konfiguration Referenz
     * @param {Function} onChangeCallback - Callback bei Änderungen
     */
    constructor(elemente, konfiguration, onChangeCallback) {
        /** @type {object} */
        this.elemente = elemente;

        /** @type {object} */
        this.konfiguration = konfiguration;

        /** @type {Function} */
        this.onChangeCallback = onChangeCallback;

        /** @type {Logger} */
        this.logger = new Logger("SliderController");

        /** @type {Function[]} */
        this.updateCallbacks = [];
    }

    // ========================================================================
    // INITIALISIERUNG
    // ========================================================================

    /**
     * Initialisiert alle Slider
     */
    initialisieren() {
        SLIDER_CONFIG.forEach(config => {
            this.initialisiereEinzelnenSlider(config);
        });

        this.logger.debug("Slider initialisiert");
    }

    /**
     * Initialisiert einen einzelnen Slider
     * @param {object} config - Slider-Konfiguration
     */
    initialisiereEinzelnenSlider({ id, property, decimals }) {
        const range = this.elemente[id];
        const input = this.elemente[`${id}Input`];

        if (!range || !input) {
            this.logger.warn(`Slider oder Input nicht gefunden: ${id}`);
            return;
        }

        // Clamping-Funktion
        const clampValue = (value) => {
            const min = parseFloat(range.min);
            const max = parseFloat(range.max);
            const val = isNaN(value) ? min : Math.max(min, Math.min(max, value));
            return val;
        };

        // Range-Event (live)
        range.addEventListener("input", (event) => {
            const value = parseFloat(event.target.value);
            input.value = value.toFixed(decimals);
            this.konfiguration[property] = value;

            // Spezielle Updates für Höhe
            if (id === "height") {
                this.triggerHeightUpdate();
            }

            this.triggerChange();
        });

        // Input-Events je nach Typ
        if (["width", "depth", "height", "slope"].includes(id)) {
            // Nur Enter übernimmt Werte
            input.addEventListener("keydown", (event) => {
                if (event.key !== "Enter") return;

                event.preventDefault();
                const value = parseFloat(String(event.target.value).replace(",", "."));
                const clamped = clampValue(value);

                range.value = clamped;
                input.value = clamped.toFixed(decimals);
                this.konfiguration[property] = clamped;

                this.triggerChange();
            });

            // Blur formatiert nur
            input.addEventListener("blur", (event) => {
                const value = parseFloat(String(event.target.value).replace(",", "."));
                if (!isNaN(value)) {
                    event.target.value = value.toFixed(decimals);
                }
            });
        } else {
            // Standard: live input
            input.addEventListener("input", (event) => {
                let value = parseFloat(event.target.value);
                value = clampValue(value);

                range.value = value;
                event.target.value = value.toFixed(decimals);
                this.konfiguration[property] = value;

                if (id === "height") {
                    this.triggerHeightUpdate();
                }

                this.triggerChange();
            });

            input.addEventListener("blur", (event) => {
                const value = parseFloat(event.target.value);
                if (!isNaN(value)) {
                    event.target.value = value.toFixed(decimals);
                }
            });
        }
    }

    // ========================================================================
    // UPDATES
    // ========================================================================

    /**
     * Aktualisiert alle Slider-Werte aus der Konfiguration
     */
    aktualisiereWerte() {
        const config = this.konfiguration;

        // Width
        if (this.elemente.widthInput) {
            this.elemente.widthInput.value = config.breite.toFixed(2);
        }
        if (this.elemente.width) {
            this.elemente.width.value = config.breite;
        }

        // Depth
        if (this.elemente.depthInput) {
            this.elemente.depthInput.value = config.tiefe.toFixed(2);
        }
        if (this.elemente.depth) {
            this.elemente.depth.value = config.tiefe;
        }

        // Height
        if (this.elemente.heightInput) {
            this.elemente.heightInput.value = config.hoehe.toFixed(2);
        }
        if (this.elemente.height) {
            this.elemente.height.value = config.hoehe;
        }

        // Slope
        if (this.elemente.slopeInput) {
            this.elemente.slopeInput.value = config.neigung.toFixed(1);
        }
        if (this.elemente.slope) {
            this.elemente.slope.value = config.neigung;
        }
    }

    /**
     * Setzt einen einzelnen Slider-Wert
     * @param {string} property - Property-Name
     * @param {number} value - Neuer Wert
     */
    setzeWert(property, value) {
        const mapping = SLIDER_CONFIG.find(c => c.property === property);
        if (!mapping) return;

        const { id, decimals } = mapping;
        const range = this.elemente[id];
        const input = this.elemente[`${id}Input`];

        if (range) range.value = value;
        if (input) input.value = value.toFixed(decimals);

        this.konfiguration[property] = value;
    }

    /**
     * Aktiviert/Deaktiviert alle Slider
     * @param {boolean} aktiv - Aktiv oder nicht
     */
    setzeAktiv(aktiv) {
        ["width", "depth", "height", "slope"].forEach(id => {
            const element = this.elemente[id];
            if (element) {
                element.disabled = !aktiv;
            }
        });
    }

    // ========================================================================
    // CALLBACKS
    // ========================================================================

    /**
     * Registriert einen Callback für Höhen-Updates
     * @param {Function} callback - Callback-Funktion
     */
    onHeightUpdate(callback) {
        if (typeof callback === "function") {
            this.updateCallbacks.push(callback);
        }
    }

    /**
     * Triggert Höhen-Update Callbacks
     */
    triggerHeightUpdate() {
        this.updateCallbacks.forEach(cb => {
            try {
                cb();
            } catch (error) {
                this.logger.warn("Height-Update Callback Fehler:", error);
            }
        });
    }

    /**
     * Triggert den onChange-Callback
     */
    triggerChange() {
        if (typeof this.onChangeCallback === "function") {
            this.onChangeCallback();
        }
    }

    // ========================================================================
    // NEIGUNG-STEUERUNG
    // ========================================================================

    /**
     * Aktualisiert die Neigungssteuerung basierend auf Dachform
     * @param {boolean} istFlachdach - Ist Flachdach aktiv
     * @param {boolean} istCarport - Ist Carport-Modus aktiv
     */
    aktualisiereNeigungsSteuerung(istFlachdach, istCarport) {
        const slopeInput = this.elemente.slopeInput;
        const slopeRange = this.elemente.slope;
        const slopeGroup = this.elemente.slopeGroup;
        const buttons = Array.from(document.querySelectorAll('[data-dim="slope"]'));

        const slopeVisible = !istFlachdach && !istCarport;

        // Gruppe ein-/ausblenden
        if (slopeGroup) {
            slopeGroup.style.display = slopeVisible ? "" : "none";
        }

        // Buttons deaktivieren
        buttons.forEach(btn => {
            btn.disabled = istFlachdach;
            btn.setAttribute("aria-disabled", istFlachdach ? "true" : "false");
        });

        // Inputs deaktivieren
        if (slopeInput) {
            slopeInput.disabled = istFlachdach;
            if (istFlachdach) slopeInput.value = "0.0";
        }

        if (slopeRange) {
            slopeRange.disabled = istFlachdach;
            if (istFlachdach) slopeRange.value = "0";
        }

        // Segment-Neigung synchron halten
        const segmentSlopes = document.querySelectorAll(".segment-slope, .segment-slope-range");
        segmentSlopes.forEach(el => {
            el.disabled = istFlachdach;
            if (istFlachdach) {
                el.value = "0";
                el.setAttribute("aria-disabled", "true");
            } else {
                el.removeAttribute("aria-disabled");
            }
        });

        const segmentSlopeButtons = document.querySelectorAll(
            '.segment-dimension-dec[data-target="segment-slope"], .segment-dimension-inc[data-target="segment-slope"]'
        );
        segmentSlopeButtons.forEach(btn => {
            btn.disabled = istFlachdach;
            btn.style.opacity = istFlachdach ? "0.5" : "";
            btn.style.cursor = istFlachdach ? "not-allowed" : "";
            btn.style.pointerEvents = istFlachdach ? "none" : "auto";
            btn.setAttribute("aria-disabled", istFlachdach ? "true" : "false");
        });
    }
}
