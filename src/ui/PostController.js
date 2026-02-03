/**
 * PostController - Pfosten-Steuerung für den Pergola-Konfigurator
 *
 * Verwaltet alle pfosten-bezogenen UI-Elemente:
 * - Pfosten-Versatz (vorne/hinten)
 * - Pfosten-Kürzung (vorne/hinten/mitte)
 * - Pfosten-Aktivierung/Deaktivierung
 * - Zentraler Mittelpfosten
 * - Zwischenpfosten
 *
 * Extrahiert aus UIController.js für bessere Modularität
 */

import { Logger } from "../utils/Logger.js";

/**
 * Versatz-Grenzen
 */
const VERSATZ_CONFIG = {
    min: 0,
    max: 0.5
};

/**
 * Klasse zur Verwaltung der Pfosten-Steuerung
 */
export class PostController {
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
        this.logger = new Logger("PostController");
    }

    // ========================================================================
    // INITIALISIERUNG
    // ========================================================================

    /**
     * Initialisiert alle Pfosten-Steuerungen
     */
    initialisieren() {
        this.initPfostenVersatz();
        this.initPfostenKuerzung();
        this.initCenterPostToggle();
        this.initIntermediatePostsToggle();
        this.initKeinePfostenButtons();

        this.logger.debug("PostController initialisiert");
    }

    // ========================================================================
    // PFOSTEN-VERSATZ
    // ========================================================================

    /**
     * Initialisiert die Pfosten-Versatz-Steuerung
     */
    initPfostenVersatz() {
        const controls = [
            { key: "vorne", range: this.elemente.postOffsetFrontRange, input: this.elemente.postOffsetFrontInput },
            { key: "hinten", range: this.elemente.postOffsetRearRange, input: this.elemente.postOffsetRearInput }
        ];

        controls.forEach(({ key, range, input }) => {
            if (!range || !input) return;

            range.addEventListener("input", (e) => {
                this.aktualisierePfostenVersatz(key, e.target.value, true);
            });

            input.addEventListener("change", (e) => {
                this.aktualisierePfostenVersatz(key, e.target.value, true);
            });

            input.addEventListener("blur", () => {
                const wert = this.konfiguration.pfostenVersaetze?.[key] ?? 0;
                this.aktualisierePfostenVersatz(key, wert, false);
            });
        });

        // Initialwerte setzen
        this.aktualisierePfostenVersatz("vorne", this.konfiguration.pfostenVersaetze?.vorne ?? 0, false);
        this.aktualisierePfostenVersatz("hinten", this.konfiguration.pfostenVersaetze?.hinten ?? 0, false);
    }

    /**
     * Aktualisiert einen Pfosten-Versatz-Wert
     * @param {string} key - "vorne" oder "hinten"
     * @param {number|string} wert - Neuer Wert
     * @param {boolean} triggerChange - Change-Event auslösen
     */
    aktualisierePfostenVersatz(key, wert, triggerChange = true) {
        // Konfiguration initialisieren falls nötig
        if (!this.konfiguration.pfostenVersaetze) {
            this.konfiguration.pfostenVersaetze = { vorne: 0, hinten: 0 };
        }

        const alterWert = this.konfiguration.pfostenVersaetze[key] ?? 0;
        const neuerWert = this.clampVersatz(wert, alterWert);
        const hatSichGeaendert = Math.abs(alterWert - neuerWert) > 1e-4;

        // Konfiguration aktualisieren
        this.konfiguration.pfostenVersaetze = {
            ...this.konfiguration.pfostenVersaetze,
            [key]: neuerWert
        };

        // UI aktualisieren
        const range = key === "vorne" ? this.elemente.postOffsetFrontRange : this.elemente.postOffsetRearRange;
        const input = key === "vorne" ? this.elemente.postOffsetFrontInput : this.elemente.postOffsetRearInput;

        if (range) range.value = neuerWert;
        if (input) input.value = neuerWert.toFixed(2);

        // Callback auslösen
        if (triggerChange && hatSichGeaendert) {
            this.triggerChange();
        }
    }

    /**
     * Clampt einen Versatz-Wert
     * @param {number|string} wert - Wert zum Clampen
     * @param {number} fallback - Fallback-Wert
     * @returns {number}
     */
    clampVersatz(wert, fallback = 0) {
        if (wert == null) return fallback;

        const parsed = Number.parseFloat(String(wert).replace(",", "."));
        if (!Number.isFinite(parsed)) return fallback;

        return Math.max(VERSATZ_CONFIG.min, Math.min(VERSATZ_CONFIG.max, parsed));
    }

    // ========================================================================
    // PFOSTEN-KÜRZUNG
    // ========================================================================

    /**
     * Initialisiert die Pfosten-Kürzungs-Steuerung
     */
    initPfostenKuerzung() {
        const controls = [
            { key: "vorne", range: this.elemente.postShortenFrontRange, input: this.elemente.postShortenFrontInput },
            { key: "hinten", range: this.elemente.postShortenRearRange, input: this.elemente.postShortenRearInput },
            { key: "mitte", range: this.elemente.postShortenMiddleRange, input: this.elemente.postShortenMiddleInput }
        ];

        controls.forEach(({ key, range, input }) => {
            if (!range || !input) return;

            range.addEventListener("input", (e) => {
                this.aktualisierePfostenKuerzung(key, e.target.value, true);
            });

            input.addEventListener("change", (e) => {
                this.aktualisierePfostenKuerzung(key, e.target.value, true);
            });

            input.addEventListener("blur", () => {
                const wert = this.konfiguration.pfostenKuerzung?.[key] ?? 0;
                this.aktualisierePfostenKuerzung(key, wert, false);
            });
        });

        // Initialwerte setzen
        this.aktualisierePfostenKuerzung("vorne", this.konfiguration.pfostenKuerzung?.vorne ?? 0, false);
        this.aktualisierePfostenKuerzung("hinten", this.konfiguration.pfostenKuerzung?.hinten ?? 0, false);
        this.aktualisierePfostenKuerzung("mitte", this.konfiguration.pfostenKuerzung?.mitte ?? 0, false);
    }

    /**
     * Aktualisiert einen Pfosten-Kürzungs-Wert
     * @param {string} key - "vorne", "hinten" oder "mitte"
     * @param {number|string} wert - Neuer Wert
     * @param {boolean} triggerChange - Change-Event auslösen
     */
    aktualisierePfostenKuerzung(key, wert, triggerChange = true) {
        // Konfiguration initialisieren falls nötig
        if (!this.konfiguration.pfostenKuerzung) {
            this.konfiguration.pfostenKuerzung = { vorne: 0, hinten: 0, mitte: 0 };
        }

        const alterWert = this.konfiguration.pfostenKuerzung[key] ?? 0;
        const neuerWert = this.clampKuerzung(wert, alterWert);
        const hatSichGeaendert = Math.abs(alterWert - neuerWert) > 1e-4;

        // Konfiguration aktualisieren
        this.konfiguration.pfostenKuerzung = {
            ...this.konfiguration.pfostenKuerzung,
            [key]: neuerWert
        };

        // UI aktualisieren
        const ranges = {
            vorne: this.elemente.postShortenFrontRange,
            hinten: this.elemente.postShortenRearRange,
            mitte: this.elemente.postShortenMiddleRange
        };

        const inputs = {
            vorne: this.elemente.postShortenFrontInput,
            hinten: this.elemente.postShortenRearInput,
            mitte: this.elemente.postShortenMiddleInput
        };

        const range = ranges[key];
        const input = inputs[key];

        if (range) range.value = neuerWert;
        if (input) input.value = neuerWert.toFixed(2);

        // Callback auslösen
        if (triggerChange && hatSichGeaendert) {
            this.triggerChange();
        }
    }

    /**
     * Berechnet die maximale Pfosten-Kürzung
     * @returns {number}
     */
    berechneMaxKuerzung() {
        const hoehe = this.konfiguration.hoehe || 2.5;
        return Math.max(0, hoehe - 0.03);
    }

    /**
     * Aktualisiert die Max-Werte für Pfosten-Kürzung
     */
    aktualisiereKuerzungMaxWerte() {
        const maxWert = this.berechneMaxKuerzung();

        // Mitte initialisieren falls nötig
        if (this.konfiguration.pfostenKuerzung && this.konfiguration.pfostenKuerzung.mitte === undefined) {
            this.konfiguration.pfostenKuerzung.mitte = 0;
        }

        // Range Max-Werte aktualisieren
        const ranges = [
            this.elemente.postShortenFrontRange,
            this.elemente.postShortenRearRange,
            this.elemente.postShortenMiddleRange
        ];

        const inputs = [
            this.elemente.postShortenFrontInput,
            this.elemente.postShortenRearInput,
            this.elemente.postShortenMiddleInput
        ];

        ranges.forEach(range => {
            if (range) range.max = maxWert.toFixed(2);
        });

        inputs.forEach(input => {
            if (input) input.max = maxWert.toFixed(2);
        });

        // Werte clampen falls über Maximum
        if (this.konfiguration.pfostenKuerzung) {
            ["vorne", "hinten", "mitte"].forEach(key => {
                if (this.konfiguration.pfostenKuerzung[key] > maxWert) {
                    this.aktualisierePfostenKuerzung(key, maxWert, true);
                }
            });
        }
    }

    /**
     * Clampt einen Kürzungs-Wert
     * @param {number|string} wert - Wert zum Clampen
     * @param {number} fallback - Fallback-Wert
     * @returns {number}
     */
    clampKuerzung(wert, fallback = 0) {
        if (wert == null) return fallback;

        const parsed = Number.parseFloat(String(wert).replace(",", "."));
        if (!Number.isFinite(parsed)) return fallback;

        const maxWert = this.berechneMaxKuerzung();
        return Math.max(0, Math.min(maxWert, parsed));
    }

    // ========================================================================
    // ZENTRALER MITTELPFOSTEN
    // ========================================================================

    /**
     * Initialisiert den Mittelpfosten-Toggle
     */
    initCenterPostToggle() {
        const toggle = this.elemente.centerPostToggle;
        if (!toggle) return;

        toggle.checked = !!this.konfiguration.zentralerMittelpfosten;

        toggle.addEventListener("change", () => {
            const neuerWert = toggle.checked;
            if (!!this.konfiguration.zentralerMittelpfosten !== neuerWert) {
                this.konfiguration.zentralerMittelpfosten = neuerWert;
                this.triggerChange();
            }
        });
    }

    /**
     * Synchronisiert den Mittelpfosten-Toggle mit der Konfiguration
     */
    syncCenterPostToggle() {
        const toggle = this.elemente.centerPostToggle;
        if (!toggle) return;

        const sollWert = !!this.konfiguration.zentralerMittelpfosten;
        if (toggle.checked !== sollWert) {
            toggle.checked = sollWert;
        }
    }

    // ========================================================================
    // ZWISCHENPFOSTEN
    // ========================================================================

    /**
     * Initialisiert die Zwischenpfosten-Toggles
     */
    initIntermediatePostsToggle() {
        const checkboxWidth = this.elemente.intermediatePostsWidthToggle;
        const checkboxDepth = this.elemente.intermediatePostsDepthToggle;
        const btnWidth = this.elemente.intermediatePostsWidthBtn;
        const btnDepth = this.elemente.intermediatePostsDepthBtn;

        const syncButtons = () => {
            if (btnWidth) btnWidth.classList.toggle("active", !!this.konfiguration.zwischenpfostenBreite);
            if (btnDepth) btnDepth.classList.toggle("active", !!this.konfiguration.zwischenpfostenTiefe);
        };

        const toggleWidth = () => {
            this.konfiguration.zwischenpfostenBreite = !this.konfiguration.zwischenpfostenBreite;
            if (checkboxWidth) checkboxWidth.checked = this.konfiguration.zwischenpfostenBreite;
            syncButtons();
            this.triggerChange();
        };

        const toggleDepth = () => {
            this.konfiguration.zwischenpfostenTiefe = !this.konfiguration.zwischenpfostenTiefe;
            if (checkboxDepth) checkboxDepth.checked = this.konfiguration.zwischenpfostenTiefe;
            syncButtons();
            this.triggerChange();
        };

        // Checkboxen
        if (checkboxWidth) {
            checkboxWidth.checked = !!this.konfiguration.zwischenpfostenBreite;
            checkboxWidth.addEventListener("change", toggleWidth);
        }

        if (checkboxDepth) {
            checkboxDepth.checked = !!this.konfiguration.zwischenpfostenTiefe;
            checkboxDepth.addEventListener("change", toggleDepth);
        }

        // Buttons
        if (btnWidth) btnWidth.addEventListener("click", toggleWidth);
        if (btnDepth) btnDepth.addEventListener("click", toggleDepth);

        syncButtons();

        // Profil-Select
        const profilSelect = this.elemente.intermediatePostsProfile;
        if (profilSelect) {
            const initialProfil = this.konfiguration.zwischenpfostenProfil || "120x80x4_mittel";
            profilSelect.value = initialProfil;
        }
    }

    // ========================================================================
    // PFOSTEN AKTIVIERUNG
    // ========================================================================

    /**
     * Initialisiert die "Keine Pfosten" Buttons
     */
    initKeinePfostenButtons() {
        const frontButton = this.elemente.noPostsFrontButton;
        const rearButton = this.elemente.noPostsRearButton;

        if (frontButton) {
            frontButton.addEventListener("click", () => this.togglePfostenAktiv("vorne"));
        }

        if (rearButton) {
            rearButton.addEventListener("click", () => this.togglePfostenAktiv("hinten"));
        }

        this.updateKeinePfostenButtonStatus();
    }

    /**
     * Toggled einen Pfosten-Aktiv-Status
     * @param {string} key - "vorne" oder "hinten"
     */
    togglePfostenAktiv(key) {
        if (!this.konfiguration.pfostenAktiv) {
            this.konfiguration.pfostenAktiv = { vorne: true, hinten: true };
        }

        this.konfiguration.pfostenAktiv[key] = !this.konfiguration.pfostenAktiv[key];
        this.updateKeinePfostenButtonStatus();
        this.triggerChange();
    }

    /**
     * Aktualisiert die Button-Status für "Keine Pfosten"
     */
    updateKeinePfostenButtonStatus() {
        const frontButton = this.elemente.noPostsFrontButton;
        const rearButton = this.elemente.noPostsRearButton;

        if (frontButton) {
            const istAktiv = this.konfiguration.pfostenAktiv?.vorne !== false;
            if (istAktiv) {
                frontButton.classList.remove("active");
                frontButton.textContent = "Keine vorderen Pfosten";
            } else {
                frontButton.classList.add("active");
                frontButton.textContent = "✓ Vordere Pfosten ausgeblendet";
            }
        }

        if (rearButton) {
            const istAktiv = this.konfiguration.pfostenAktiv?.hinten !== false;
            if (istAktiv) {
                rearButton.classList.remove("active");
                rearButton.textContent = "Keine hinteren Pfosten";
            } else {
                rearButton.classList.add("active");
                rearButton.textContent = "✓ Hintere Pfosten ausgeblendet";
            }
        }
    }

    // ========================================================================
    // CALLBACKS
    // ========================================================================

    /**
     * Triggert den onChange-Callback
     */
    triggerChange() {
        if (typeof this.onChangeCallback === "function") {
            this.onChangeCallback();
        }
    }
}
