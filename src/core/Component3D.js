/**
 * Basis-Klasse für alle 3D-Komponenten des Pergola-Konfigurators
 *
 * Diese abstrakte Basisklasse definiert das gemeinsame Interface und
 * die Grundfunktionalität für alle Pergola-Komponenten:
 * - Pfosten, Querträger, Längsträger, Kopfbänder
 * - Gläser, Befestigung, Bemaßung
 * - Terrassenplatten, Outdoor-Möbel
 *
 * Eliminiert Code-Duplikate und etabliert ein konsistentes API.
 */

import { createLogger } from '../utils/Logger.js';

/**
 * Abstrakte Basis-Klasse für 3D-Komponenten
 */
export class Component3D {
    /**
     * @param {string} name - Name der Komponente (z.B. 'Pfosten', 'Quertraeger')
     * @param {object} koordinatenSystem - Referenz zum KoordinatenSystem
     * @param {object} konfiguration - Referenz zur PergolaKonfiguration
     */
    constructor(name, koordinatenSystem, konfiguration) {
        /** @type {string} */
        this.name = name;

        /** @type {object} */
        this.koordinatenSystem = koordinatenSystem;

        /** @type {object} */
        this.konfiguration = konfiguration;

        /** @type {THREE.Group} */
        this.gruppe = new THREE.Group();
        this.gruppe.name = `${name}Gruppe`;

        /** @type {Array} */
        this.elemente = [];

        /** @type {Map<string, THREE.Material>} */
        this.materialien = new Map();

        /** @type {Logger} */
        this.logger = createLogger(name);

        /** @type {boolean} */
        this.isDisposed = false;
    }

    // ========================================================================
    // ABSTRAKTE METHODEN (müssen von Unterklassen implementiert werden)
    // ========================================================================

    /**
     * Erstellt die Komponente
     * @abstract
     * @returns {THREE.Group}
     */
    create() {
        throw new Error(`${this.name}: create() muss implementiert werden`);
    }

    // ========================================================================
    // GEMEINSAME GETTER
    // ========================================================================

    /**
     * Gibt ein Element nach Name zurück
     * @param {string} name - Name des Elements
     * @returns {object|null}
     */
    get(name) {
        return this.elemente.find(el => el.name === name) || null;
    }

    /**
     * Gibt alle Elemente zurück
     * @returns {Array}
     */
    getAll() {
        return [...this.elemente];
    }

    /**
     * Gibt die THREE.Group zurück
     * @returns {THREE.Group}
     */
    getGroup() {
        return this.gruppe;
    }

    /**
     * Gibt die Anzahl der Elemente zurück
     * @returns {number}
     */
    getCount() {
        return this.elemente.length;
    }

    /**
     * Prüft ob Elemente existieren
     * @returns {boolean}
     */
    hasElements() {
        return this.elemente.length > 0;
    }

    /**
     * Gibt die aktuelle Konfiguration zurück
     * @returns {object}
     */
    getConfig() {
        return this.konfiguration?.gibAktuelleKonfiguration?.() || {};
    }

    // ========================================================================
    // ELEMENT-VERWALTUNG
    // ========================================================================

    /**
     * Fügt ein Element zur Gruppe hinzu
     * @param {object} element - Das Element (mit mesh Property)
     * @param {object} metadata - Optionale Metadaten
     * @returns {object} - Das hinzugefügte Element
     */
    addElement(element, metadata = {}) {
        if (!element) {
            this.logger.warn('addElement: Ungültiges Element');
            return null;
        }

        // Metadaten speichern
        element.metadata = { ...element.metadata, ...metadata };

        // Zur Liste hinzufügen
        this.elemente.push(element);

        // Mesh zur Gruppe hinzufügen
        if (element.mesh) {
            this.gruppe.add(element.mesh);
        }

        return element;
    }

    /**
     * Entfernt ein Element aus der Gruppe
     * @param {object|string} elementOrName - Das Element oder sein Name
     * @returns {boolean} - true wenn entfernt
     */
    removeElement(elementOrName) {
        const element = typeof elementOrName === 'string'
            ? this.get(elementOrName)
            : elementOrName;

        if (!element) return false;

        // Aus Liste entfernen
        const index = this.elemente.indexOf(element);
        if (index > -1) {
            this.elemente.splice(index, 1);
        }

        // Mesh aus Gruppe entfernen und disposed
        if (element.mesh) {
            this.gruppe.remove(element.mesh);
            this.disposeObject3D(element.mesh);
        }

        return true;
    }

    // ========================================================================
    // CLEANUP METHODEN
    // ========================================================================

    /**
     * Entfernt alle Elemente aus der Gruppe
     */
    clear() {
        // Alle Kinder der Gruppe disposen
        while (this.gruppe.children.length > 0) {
            const child = this.gruppe.children[0];
            this.disposeObject3D(child);
            this.gruppe.remove(child);
        }

        // Liste leeren
        this.elemente = [];

        this.logger.debug('Alle Elemente entfernt');
    }

    /**
     * Disposed ein THREE.Object3D rekursiv
     * @param {THREE.Object3D} obj - Das zu disposed Object
     */
    disposeObject3D(obj) {
        if (!obj) return;

        // Rekursiv alle Kinder disposen
        if (obj.children) {
            while (obj.children.length > 0) {
                this.disposeObject3D(obj.children[0]);
                obj.remove(obj.children[0]);
            }
        }

        // Geometrie disposen
        if (obj.geometry) {
            obj.geometry.dispose();
        }

        // Material disposen
        if (obj.material) {
            this.disposeMaterial(obj.material);
        }
    }

    /**
     * Disposed ein Material oder Array von Materialien
     * @param {THREE.Material|THREE.Material[]} material
     */
    disposeMaterial(material) {
        if (!material) return;

        const materials = Array.isArray(material) ? material : [material];

        materials.forEach(mat => {
            if (mat && typeof mat.dispose === 'function') {
                // Texturen disposen
                if (mat.map) mat.map.dispose();
                if (mat.normalMap) mat.normalMap.dispose();
                if (mat.roughnessMap) mat.roughnessMap.dispose();
                if (mat.metalnessMap) mat.metalnessMap.dispose();
                if (mat.aoMap) mat.aoMap.dispose();
                if (mat.emissiveMap) mat.emissiveMap.dispose();
                if (mat.envMap) mat.envMap.dispose();

                mat.dispose();
            }
        });
    }

    /**
     * Vollständiges Cleanup
     */
    dispose() {
        if (this.isDisposed) return;

        this.clear();

        // Alle gecachten Materialien disposen
        this.materialien.forEach((mat, key) => {
            this.disposeMaterial(mat);
        });
        this.materialien.clear();

        this.isDisposed = true;
        this.logger.debug('Disposed');
    }

    // ========================================================================
    // MATERIAL-VERWALTUNG
    // ========================================================================

    /**
     * Speichert ein Material im Cache
     * @param {string} key - Cache-Key
     * @param {THREE.Material} material
     */
    cacheMaterial(key, material) {
        this.materialien.set(key, material);
    }

    /**
     * Holt ein Material aus dem Cache
     * @param {string} key - Cache-Key
     * @returns {THREE.Material|null}
     */
    getCachedMaterial(key) {
        return this.materialien.get(key) || null;
    }

    // ========================================================================
    // HILFS-METHODEN FÜR UNTERKLASSEN
    // ========================================================================

    /**
     * Holt Referenzpunkte vom Koordinatensystem
     * @param {string} name - Name der Referenzpunkte
     * @returns {Array|null}
     */
    getReferenzpunkte(name) {
        return this.koordinatenSystem?.gibReferenzpunkt?.(name) || null;
    }

    /**
     * Erstellt eine THREE.Group mit Namen
     * @param {string} name - Name der Gruppe
     * @returns {THREE.Group}
     */
    createGroup(name) {
        const group = new THREE.Group();
        group.name = name;
        return group;
    }

    /**
     * Setzt Position und optional Rotation eines Objekts
     * @param {THREE.Object3D} obj - Das Objekt
     * @param {object} position - { x, y, z }
     * @param {object} rotation - { x, y, z } in Radiant (optional)
     */
    setTransform(obj, position, rotation = null) {
        if (position) {
            obj.position.set(
                position.x || 0,
                position.y || 0,
                position.z || 0
            );
        }

        if (rotation) {
            obj.rotation.set(
                rotation.x || 0,
                rotation.y || 0,
                rotation.z || 0
            );
        }
    }

    // ========================================================================
    // DEBUG
    // ========================================================================

    /**
     * Gibt Debug-Informationen aus
     */
    debug() {
        this.logger.group(`Debug ${this.name}`);
        this.logger.info(`Elemente: ${this.elemente.length}`);
        this.logger.info(`Gruppe-Kinder: ${this.gruppe.children.length}`);
        this.logger.info(`Cached Materialien: ${this.materialien.size}`);
        this.logger.info(`Disposed: ${this.isDisposed}`);

        if (this.elemente.length > 0) {
            this.logger.table(this.elemente.map(el => ({
                name: el.name,
                type: el.mesh?.type || 'unknown',
                position: el.mesh?.position?.toArray?.() || []
            })));
        }

        this.logger.groupEnd();
    }
}

// ============================================================================
// HELPER INTERFACE FÜR LEGACY-KOMPATIBILITÄT
// ============================================================================

/**
 * Mixin für Legacy-Methoden (gib* statt get*)
 * Kann von Unterklassen verwendet werden für Rückwärtskompatibilität
 */
export const LegacyMixin = {
    /**
     * Legacy: Gibt alle Elemente zurück
     * @deprecated Verwende getAll() stattdessen
     */
    gibAlle() {
        return this.getAll();
    },

    /**
     * Legacy: Gibt die 3D-Gruppe zurück
     * @deprecated Verwende getGroup() stattdessen
     */
    gib3DGruppe() {
        return this.getGroup();
    }
};

/**
 * Wendet das Legacy-Mixin auf eine Klasse an
 * @param {class} targetClass
 */
export function applyLegacyMixin(targetClass) {
    Object.assign(targetClass.prototype, LegacyMixin);
}

// Default-Export
export default Component3D;
