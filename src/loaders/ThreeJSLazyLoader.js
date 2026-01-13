/**
 * ========================================
 * THREE.JS LAZY LOADER - PERFORMANCE-OPTIMIERUNG
 * ========================================
 * Zweck: Lazy Loading für Three.js Module
 * Vorteil: Reduziert initiale Bundle-Größe und verbessert Ladezeit
 *
 * ANALYSE:
 * - three.min.js: 609KB (größte Datei!)
 * - OrbitControls.js: 26KB
 * - EXRLoader.js: 5.7KB
 *
 * OPTIMIERUNG:
 * - Lade Three.js erst wenn Canvas sichtbar wird
 * - EXRLoader nur bei Bedarf laden (HDRI)
 * - Code-Splitting für OrbitControls
 */

export class ThreeJSLazyLoader {
    constructor() {
        this.threeLoaded = false;
        this.orbitControlsLoaded = false;
        this.exrLoaderLoaded = false;
        this.loadingPromises = {};
    }

    /**
     * Lädt Three.js Core Library (609KB)
     * Wird beim ersten Render benötigt
     */
    async loadThreeCore() {
        if (this.threeLoaded) {
            return window.THREE;
        }

        if (this.loadingPromises.threeCore) {
            return this.loadingPromises.threeCore;
        }

        console.log('📦 Lazy Loading: Three.js Core (609KB)...');

        this.loadingPromises.threeCore = new Promise((resolve, reject) => {
            // Prüfe ob already loaded
            if (window.THREE) {
                this.threeLoaded = true;
                resolve(window.THREE);
                return;
            }

            // Dynamisch laden
            const script = document.createElement('script');
            script.src = '/three.min.js';
            script.async = true;

            script.onload = () => {
                this.threeLoaded = true;
                console.log('✅ Three.js Core geladen');
                resolve(window.THREE);
            };

            script.onerror = () => {
                reject(new Error('Three.js konnte nicht geladen werden'));
            };

            document.head.appendChild(script);
        });

        return this.loadingPromises.threeCore;
    }

    /**
     * Lädt OrbitControls (26KB)
     * Wird für Kamera-Steuerung benötigt
     */
    async loadOrbitControls() {
        if (this.orbitControlsLoaded) {
            return window.THREE.OrbitControls;
        }

        if (this.loadingPromises.orbitControls) {
            return this.loadingPromises.orbitControls;
        }

        console.log('📦 Lazy Loading: OrbitControls (26KB)...');

        // Three.js muss zuerst geladen sein
        await this.loadThreeCore();

        this.loadingPromises.orbitControls = new Promise((resolve, reject) => {
            // Prüfe ob already loaded
            if (window.THREE && window.THREE.OrbitControls) {
                this.orbitControlsLoaded = true;
                resolve(window.THREE.OrbitControls);
                return;
            }

            const script = document.createElement('script');
            script.src = '/OrbitControls.js';
            script.async = true;

            script.onload = () => {
                this.orbitControlsLoaded = true;
                console.log('✅ OrbitControls geladen');
                resolve(window.THREE.OrbitControls);
            };

            script.onerror = () => {
                reject(new Error('OrbitControls konnte nicht geladen werden'));
            };

            document.head.appendChild(script);
        });

        return this.loadingPromises.orbitControls;
    }

    /**
     * Lädt EXRLoader (5.7KB)
     * NUR bei Bedarf für HDRI-Texturen
     */
    async loadEXRLoader() {
        if (this.exrLoaderLoaded) {
            return window.THREE.EXRLoader;
        }

        if (this.loadingPromises.exrLoader) {
            return this.loadingPromises.exrLoader;
        }

        console.log('📦 Lazy Loading: EXRLoader (5.7KB) - Optional...');

        // Three.js muss zuerst geladen sein
        await this.loadThreeCore();

        this.loadingPromises.exrLoader = new Promise((resolve, reject) => {
            // Prüfe ob already loaded
            if (window.THREE && window.THREE.EXRLoader) {
                this.exrLoaderLoaded = true;
                resolve(window.THREE.EXRLoader);
                return;
            }

            const script = document.createElement('script');
            script.src = '/EXRLoader.js';
            script.async = true;

            script.onload = () => {
                this.exrLoaderLoaded = true;
                console.log('✅ EXRLoader geladen (optional)');
                resolve(window.THREE.EXRLoader);
            };

            script.onerror = () => {
                console.warn('⚠️ EXRLoader konnte nicht geladen werden (optional)');
                resolve(null); // Nicht kritisch
            };

            document.head.appendChild(script);
        });

        return this.loadingPromises.exrLoader;
    }

    /**
     * Lädt alle benötigten Three.js Module
     * @param {Object} options - Optionen für Lazy Loading
     * @param {boolean} options.orbitControls - OrbitControls laden (Standard: true)
     * @param {boolean} options.exrLoader - EXRLoader laden (Standard: false)
     */
    async loadAll(options = {}) {
        const {
            orbitControls = true,
            exrLoader = false
        } = options;

        console.log('📦 Starte Lazy Loading für Three.js Module...');
        const startTime = performance.now();

        try {
            // Three.js Core (immer benötigt)
            await this.loadThreeCore();

            // OrbitControls parallel laden
            const promises = [];
            if (orbitControls) {
                promises.push(this.loadOrbitControls());
            }

            // EXRLoader nur bei Bedarf
            if (exrLoader) {
                promises.push(this.loadEXRLoader());
            }

            await Promise.all(promises);

            const loadTime = (performance.now() - startTime).toFixed(2);
            console.log(`✅ Three.js Lazy Loading abgeschlossen in ${loadTime}ms`);

            return {
                THREE: window.THREE,
                OrbitControls: orbitControls ? window.THREE.OrbitControls : null,
                EXRLoader: exrLoader ? window.THREE.EXRLoader : null
            };

        } catch (error) {
            console.error('❌ Fehler beim Lazy Loading:', error);
            throw error;
        }
    }

    /**
     * Preload für schnellere UX
     * Startet Laden im Hintergrund, ohne zu blockieren
     */
    preload() {
        console.log('🚀 Preload: Starte Three.js Download im Hintergrund...');

        // Link Prefetch für Three.js
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = '/three.min.js';
        document.head.appendChild(prefetchLink);

        // OrbitControls auch prefetchen
        const prefetchOrbit = document.createElement('link');
        prefetchOrbit.rel = 'prefetch';
        prefetchOrbit.href = '/OrbitControls.js';
        document.head.appendChild(prefetchOrbit);
    }

    /**
     * Intersection Observer für automatisches Lazy Loading
     * Lädt Three.js erst wenn Canvas im Viewport sichtbar wird
     */
    setupIntersectionObserver(canvasElement) {
        console.log('👁️ Setup Intersection Observer für Canvas...');

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.threeLoaded) {
                        console.log('👀 Canvas ist sichtbar - Starte Three.js Lazy Loading');
                        this.loadAll({ orbitControls: true, exrLoader: false });
                        observer.disconnect(); // Nur einmal laden
                    }
                });
            },
            {
                rootMargin: '50px', // 50px vor Sichtbarkeit laden
                threshold: 0.1
            }
        );

        observer.observe(canvasElement);
    }

    /**
     * Gibt Status zurück
     */
    getStatus() {
        return {
            threeLoaded: this.threeLoaded,
            orbitControlsLoaded: this.orbitControlsLoaded,
            exrLoaderLoaded: this.exrLoaderLoaded
        };
    }
}

// Singleton Instance
export const threeJSLoader = new ThreeJSLazyLoader();
