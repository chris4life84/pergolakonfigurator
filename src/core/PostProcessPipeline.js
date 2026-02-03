/**
 * PostProcessPipeline - Post-Processing für den Pergola-Konfigurator
 *
 * Verwaltet alle Post-Processing-Effekte:
 * - Bloom (UnrealBloomPass)
 * - Depth of Field (BokehPass)
 * - Color Grading (ColorGradeShader)
 * - Anti-Aliasing (FXAA)
 *
 * Extrahiert aus RenderEngine.js für bessere Modularität
 */

import { Logger } from "../utils/Logger.js";

/**
 * Post-Processing Konfiguration
 */
const POSTPROCESS_CONFIG = {
    bloom: {
        threshold: 0.95,
        strength: 0.15,
        radius: 0.25
    },
    bokeh: {
        aperture: 0.00018,
        maxblur: 0.007
    },
    colorGrade: {
        exposure: 1.3,
        temperature: 0,
        contrast: 1.18,
        saturation: 1.05
    },
    toneMappingExposure: {
        base: 1.5,
        max: 1.8
    }
};

/**
 * Klasse zur Verwaltung der Post-Processing-Pipeline
 */
export class PostProcessPipeline {
    /**
     * @param {THREE.WebGLRenderer} renderer - Der Three.js Renderer
     * @param {THREE.Scene} scene - Die Three.js Szene
     * @param {THREE.Camera} camera - Die Kamera
     */
    constructor(renderer, scene, camera) {
        /** @type {THREE.WebGLRenderer} */
        this.renderer = renderer;

        /** @type {THREE.Scene} */
        this.scene = scene;

        /** @type {THREE.Camera} */
        this.camera = camera;

        /** @type {Logger} */
        this.logger = new Logger("PostProcessPipeline");

        /** @type {THREE.EffectComposer} */
        this.composer = null;

        /** @type {THREE.RenderPass} */
        this.renderPass = null;

        /** @type {THREE.UnrealBloomPass} */
        this.bloomPass = null;

        /** @type {THREE.BokehPass} */
        this.bokehPass = null;

        /** @type {THREE.ShaderPass} */
        this.colorGradePass = null;

        /** @type {THREE.ShaderPass} */
        this.fxaaPass = null;

        /** @type {boolean} */
        this.istInitialisiert = false;
    }

    // ========================================================================
    // INITIALISIERUNG
    // ========================================================================

    /**
     * Initialisiert die Post-Processing-Pipeline
     * @param {number} width - Canvas-Breite
     * @param {number} height - Canvas-Höhe
     * @returns {boolean} - True wenn erfolgreich
     */
    initialisieren(width, height) {
        // Prüfe ob EffectComposer verfügbar
        if (!THREE.EffectComposer || !THREE.RenderPass) {
            this.logger.warn("Post-Processing nicht verfügbar (EffectComposer fehlt)");
            return false;
        }

        const resolution = new THREE.Vector2(width, height);
        const pixelRatio = this.renderer.getPixelRatio();

        // Render Target erstellen
        const renderTarget = new THREE.WebGLRenderTarget(width, height, {
            samples: this.renderer.capabilities.isWebGL2 ? 2 : 0
        });

        // Effect Composer
        this.composer = new THREE.EffectComposer(this.renderer, renderTarget);
        this.composer.setPixelRatio(pixelRatio);

        // Render Pass (Basis)
        this.renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        // Bloom Pass
        this.initialisiereBloom(resolution);

        // Bokeh Pass (Depth of Field)
        this.initialisiereBokeh(resolution);

        // Color Grade Pass
        this.initialisiereColorGrade();

        // FXAA Pass
        this.initialisiereFXAA(width, height, pixelRatio);

        this.istInitialisiert = true;
        this.logger.debug("Post-Processing aktiviert");

        return true;
    }

    /**
     * Initialisiert den Bloom-Pass
     * @param {THREE.Vector2} resolution - Auflösung
     */
    initialisiereBloom(resolution) {
        if (!THREE.UnrealBloomPass) {
            this.logger.warn("UnrealBloomPass nicht verfügbar - Bloom deaktiviert");
            return;
        }

        const config = POSTPROCESS_CONFIG.bloom;

        this.bloomPass = new THREE.UnrealBloomPass(
            resolution,
            config.strength,
            0.4, // Standard radius für Konstruktor
            config.threshold
        );

        this.bloomPass.threshold = config.threshold;
        this.bloomPass.strength = config.strength;
        this.bloomPass.radius = config.radius;

        this.composer.addPass(this.bloomPass);
    }

    /**
     * Initialisiert den Bokeh-Pass (Depth of Field)
     * @param {THREE.Vector2} resolution - Auflösung
     */
    initialisiereBokeh(resolution) {
        if (!THREE.BokehPass) {
            this.logger.warn("BokehPass nicht verfügbar - Depth of Field deaktiviert");
            return;
        }

        const config = POSTPROCESS_CONFIG.bokeh;

        this.bokehPass = new THREE.BokehPass(this.scene, this.camera, {
            focus: 2.8, // Standard-Fokus
            aperture: config.aperture,
            maxblur: config.maxblur,
            width: resolution.x,
            height: resolution.y
        });

        this.composer.addPass(this.bokehPass);
    }

    /**
     * Initialisiert den Color-Grade-Pass
     */
    initialisiereColorGrade() {
        if (!THREE.ColorGradeShader || !THREE.ShaderPass) {
            this.logger.warn("ColorGradeShader nicht verfügbar - Farbkorrektur deaktiviert");
            return;
        }

        const config = POSTPROCESS_CONFIG.colorGrade;

        this.colorGradePass = new THREE.ShaderPass(THREE.ColorGradeShader);
        this.colorGradePass.uniforms.exposure.value = config.exposure;
        this.colorGradePass.uniforms.temperature.value = config.temperature;
        this.colorGradePass.uniforms.contrast.value = config.contrast;
        this.colorGradePass.uniforms.saturation.value = config.saturation;

        this.composer.addPass(this.colorGradePass);
    }

    /**
     * Initialisiert den FXAA-Pass
     * @param {number} width - Breite
     * @param {number} height - Höhe
     * @param {number} pixelRatio - Pixel-Ratio
     */
    initialisiereFXAA(width, height, pixelRatio) {
        if (!THREE.FXAAShader || !THREE.ShaderPass) {
            // Letzten Pass auf renderToScreen setzen
            if (this.composer.passes.length > 0) {
                this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;
            }
            this.logger.warn("FXAA Shader nicht verfügbar - nutze Renderer AA");
            return;
        }

        this.fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
        this.fxaaPass.renderToScreen = true;
        this.aktualisiereFXAAAufloesung(width, height, pixelRatio);

        this.composer.addPass(this.fxaaPass);
    }

    // ========================================================================
    // UPDATES
    // ========================================================================

    /**
     * Aktualisiert die FXAA-Auflösung
     * @param {number} width - Breite
     * @param {number} height - Höhe
     * @param {number} pixelRatio - Pixel-Ratio
     */
    aktualisiereFXAAAufloesung(width, height, pixelRatio) {
        if (!this.fxaaPass?.material?.uniforms?.resolution) return;

        this.fxaaPass.material.uniforms.resolution.value.set(
            1 / (width * pixelRatio),
            1 / (height * pixelRatio)
        );
    }

    /**
     * Aktualisiert den Depth-of-Field-Fokus
     * @param {THREE.Vector3} cameraPosition - Kamera-Position
     * @param {THREE.Vector3} target - Blickziel
     */
    aktualisiereDofFokus(cameraPosition, target) {
        if (!this.bokehPass) return;

        const distanz = cameraPosition.distanceTo(target);
        this.bokehPass.uniforms.focus.value = distanz;
        this.bokehPass.uniforms.aspect.value = this.camera.aspect;
    }

    /**
     * Aktualisiert die Belichtung basierend auf Kamera-Distanz
     * @param {THREE.Vector3} cameraPosition - Kamera-Position
     * @param {THREE.Vector3} target - Blickziel
     */
    aktualisiereBelichtung(cameraPosition, target) {
        const distanz = cameraPosition.distanceTo(target);
        const config = POSTPROCESS_CONFIG.toneMappingExposure;

        // Belichtungs-Boost bei Nahaufnahmen
        const nahaufnahmeBoost = Math.max(0, 3 - distanz) * 0.05;
        const exposure = THREE.MathUtils.clamp(
            config.base + nahaufnahmeBoost,
            config.base,
            config.max
        );

        // Renderer Tone Mapping
        this.renderer.toneMappingExposure = exposure;

        // Color Grade Pass
        if (this.colorGradePass?.uniforms?.exposure) {
            this.colorGradePass.uniforms.exposure.value = Math.max(1.25, exposure * 1.05);
        }

        return exposure;
    }

    /**
     * Passt die Größe an
     * @param {number} width - Neue Breite
     * @param {number} height - Neue Höhe
     */
    setzeGroesse(width, height) {
        const pixelRatio = this.renderer.getPixelRatio();

        if (this.composer) {
            this.composer.setSize(width, height);
            this.composer.setPixelRatio(pixelRatio);
        }

        if (this.bloomPass) {
            this.bloomPass.setSize(width, height);
        }

        if (this.bokehPass) {
            this.bokehPass.setSize(width, height);
        }

        this.aktualisiereFXAAAufloesung(width, height, pixelRatio);
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    /**
     * Rendert die Szene mit Post-Processing
     */
    render() {
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Prüft ob der Composer aktiv ist
     * @returns {boolean}
     */
    istAktiv() {
        return this.composer !== null && this.istInitialisiert;
    }

    // ========================================================================
    // GETTER
    // ========================================================================

    /**
     * Gibt den Composer zurück
     * @returns {THREE.EffectComposer}
     */
    gibComposer() {
        return this.composer;
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Räumt alle Ressourcen auf
     */
    dispose() {
        if (this.bokehPass?.dispose) {
            this.bokehPass.dispose();
        }

        if (this.bloomPass?.dispose) {
            this.bloomPass.dispose();
        }

        if (this.composer?.dispose) {
            this.composer.dispose();
        }

        this.composer = null;
        this.renderPass = null;
        this.bloomPass = null;
        this.bokehPass = null;
        this.colorGradePass = null;
        this.fxaaPass = null;
        this.istInitialisiert = false;

        this.logger.debug("PostProcessPipeline aufgeräumt");
    }
}
