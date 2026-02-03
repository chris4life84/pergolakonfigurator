/**
 * OptionCardController - Option-Card-Steuerung für den Pergola-Konfigurator
 *
 * Verwaltet alle visuellen Option-Cards:
 * - Typ (Freistehend/Wandanschluss)
 * - Dachtyp (Glas/EPDM)
 * - Dachform (Pultdach/Flachdach)
 * - Entwässerung
 * - Material
 * - Farbe
 * - Profil
 *
 * Extrahiert aus UIController.js für bessere Modularität
 */

import { Logger } from "../utils/Logger.js";

/**
 * Klasse zur Verwaltung der Option-Cards
 */
export class OptionCardController {
    /**
     * @param {object} elemente - DOM-Elemente Referenz
     * @param {object} konfiguration - Aktuelle Konfiguration Referenz
     * @param {object} selectPropertyMap - Mapping von Select-IDs zu Properties
     * @param {Function} onChangeCallback - Callback bei Änderungen
     */
    constructor(elemente, konfiguration, selectPropertyMap, onChangeCallback) {
        /** @type {object} */
        this.elemente = elemente;

        /** @type {object} */
        this.konfiguration = konfiguration;

        /** @type {object} */
        this.selectPropertyMap = selectPropertyMap;

        /** @type {Function} */
        this.onChangeCallback = onChangeCallback;

        /** @type {Logger} */
        this.logger = new Logger("OptionCardController");

        /** @type {Object<string, HTMLElement[]>} */
        this.cardGroups = {};
    }

    // ========================================================================
    // INITIALISIERUNG
    // ========================================================================

    /**
     * Initialisiert alle Option-Card-Gruppen
     */
    initialisieren() {
        this.sammelCardGruppen();
        this.registriereEventListener();
        this.setzeInitialStates();

        this.logger.debug("OptionCardController initialisiert");
    }

    /**
     * Sammelt alle Card-Gruppen
     */
    sammelCardGruppen() {
        this.cardGroups = {
            type: Array.from(this.elemente.typeOptionCards || []),
            roofType: Array.from(this.elemente.roofTypeOptionCards || []),
            dachTyp: Array.from(this.elemente.dachTypOptionCards || []),
            drainage: Array.from(this.elemente.drainageOptionCards || []),
            material: Array.from(this.elemente.materialOptionCards || []),
            color: Array.from(this.elemente.colorOptionCards || []),
            ncsColor: Array.from(this.elemente.ncsColorCards || []),
            pfostenProfil: Array.from(this.elemente.profileOptionCards || [])
        };
    }

    /**
     * Registriert Event-Listener für alle Cards
     */
    registriereEventListener() {
        Object.entries(this.cardGroups).forEach(([groupName, cards]) => {
            if (!cards || cards.length === 0) return;

            cards.forEach(card => {
                card.addEventListener("click", () => {
                    // Prüfe ob Button disabled ist
                    if (card.disabled || card.hasAttribute("disabled")) {
                        this.logger.debug("Button ist deaktiviert, Klick ignoriert:", card.dataset.value);
                        return;
                    }

                    const value = card.dataset.value;
                    if (value) {
                        this.handleSelection(groupName, value);
                    }
                });
            });
        });
    }

    /**
     * Setzt die initialen Zustände
     */
    setzeInitialStates() {
        this.updateState("type", this.konfiguration.typ);
        this.updateState("roofType", this.konfiguration.dachTyp);
        this.updateState("dachTyp", this.konfiguration.dachForm || (this.konfiguration.neigung > 0 ? "pultdach" : "flachdach"));
        this.updateState("drainage", this.konfiguration.regenwasserAbfluss);
        this.updateState("material", this.konfiguration.material);
        this.updateState("color", this.konfiguration.ncsFarbe || this.konfiguration.farbe);
        this.updateState("pfostenProfil", this.konfiguration.pfostenProfil);
    }

    // ========================================================================
    // SELECTION HANDLING
    // ========================================================================

    /**
     * Behandelt eine Card-Auswahl
     * @param {string} group - Gruppen-Name
     * @param {string} value - Ausgewählter Wert
     */
    handleSelection(group, value) {
        // Spezialbehandlung für Dachtyp
        if (group === "dachTyp") {
            this.handleDachTypSelection(value);
            return;
        }

        // Select-Element aktualisieren
        const select = this.elemente[group] || document.getElementById(group);
        if (select && select.value !== value) {
            select.value = value;
            this.updateState(group, value);

            const event = new Event("change", { bubbles: true });
            select.dispatchEvent(event);
        }

        this.updateState(group, value);

        // Property in Konfiguration aktualisieren
        const property = this.selectPropertyMap[group];

        // Spezialbehandlung für Farben
        if (group === "color") {
            this.handleColorSelection(value);
            return;
        }

        if (group === "ncsColor") {
            this.handleNcsColorSelection(value);
            return;
        }

        if (group === "pfostenProfil") {
            this.konfiguration.pfostenProfil = value;
            this.triggerChange();
            return;
        }

        // Standard: Property setzen
        if (property && group !== "ncsColor") {
            this.konfiguration[property] = value;
        }

        this.triggerChange();
    }

    /**
     * Behandelt Dachtyp-Auswahl (Pultdach/Flachdach)
     * @param {string} value - "pultdach" oder "flachdach"
     */
    handleDachTypSelection(value) {
        if (value === "flachdach") {
            // Flachdach: Neigung auf 0° setzen
            this.konfiguration.neigung = 0;
            this.updateSlopeInputs("0");
            this.logger.debug("Flachdach ausgewählt - Neigung auf 0° gesetzt");
        } else if (value === "pultdach") {
            // Pultdach: Neigung auf 2° setzen
            this.konfiguration.neigung = 2;
            this.updateSlopeInputs("2");
            this.logger.debug("Pultdach ausgewählt - Neigung auf 2° gesetzt");
        }

        // Property setzen
        const property = this.selectPropertyMap["dachTyp"];
        if (property) {
            this.konfiguration[property] = value;
        }

        this.updateState("dachTyp", value);
        this.triggerChange();
    }

    /**
     * Aktualisiert die Neigungs-Inputs
     * @param {string} value - Neuer Wert
     */
    updateSlopeInputs(value) {
        const slopeInput = this.elemente.slopeInput;
        const slopeRange = this.elemente.slope;

        if (slopeInput) slopeInput.value = `${value}.0`;
        if (slopeRange) slopeRange.value = value;
    }

    /**
     * Behandelt Farb-Auswahl (RAL)
     * @param {string} value - Farbwert
     */
    handleColorSelection(value) {
        const alteFarbe = this.konfiguration.farbe;
        this.konfiguration.farbe = value;
        this.konfiguration.ncsFarbe = null;

        // NCS-Cards deselektieren
        this.updateState("ncsColor", null);

        if (alteFarbe !== value) {
            this.triggerChange();
        }
    }

    /**
     * Behandelt NCS-Farb-Auswahl
     * @param {string} value - NCS-Farbwert
     */
    handleNcsColorSelection(value) {
        this.konfiguration.farbe = value;
        this.konfiguration.ncsFarbe = value;

        // RAL-Cards deselektieren
        this.updateState("color", null);
        this.updateState("ncsColor", value);

        this.triggerChange();
    }

    // ========================================================================
    // STATE UPDATES
    // ========================================================================

    /**
     * Aktualisiert den Zustand einer Card-Gruppe
     * @param {string} group - Gruppen-Name
     * @param {string|null} activeValue - Aktiver Wert
     */
    updateState(group, activeValue) {
        const cards = this.cardGroups?.[group];
        if (!cards || cards.length === 0) return;

        cards.forEach(card => {
            const isActive = card.dataset.value === activeValue;
            card.classList.toggle("active", isActive);
            card.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    /**
     * Deaktiviert eine spezifische Card
     * @param {string} group - Gruppen-Name
     * @param {string} value - Wert der Card
     * @param {boolean} disabled - Deaktiviert oder nicht
     */
    setCardDisabled(group, value, disabled) {
        const cards = this.cardGroups?.[group];
        if (!cards) return;

        const card = cards.find(c => c.dataset.value === value);
        if (card) {
            card.disabled = disabled;
            card.setAttribute("aria-disabled", disabled ? "true" : "false");
            card.style.display = disabled ? "none" : "";
        }
    }

    /**
     * Blendet eine Card ein/aus
     * @param {string} group - Gruppen-Name
     * @param {string} value - Wert der Card
     * @param {boolean} visible - Sichtbar oder nicht
     */
    setCardVisible(group, value, visible) {
        const cards = this.cardGroups?.[group];
        if (!cards) return;

        const card = cards.find(c => c.dataset.value === value);
        if (card) {
            card.style.display = visible ? "" : "none";
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

    // ========================================================================
    // GETTER
    // ========================================================================

    /**
     * Gibt eine Card-Gruppe zurück
     * @param {string} group - Gruppen-Name
     * @returns {HTMLElement[]}
     */
    getCardGroup(group) {
        return this.cardGroups?.[group] || [];
    }
}
