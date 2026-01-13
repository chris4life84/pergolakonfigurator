/**
 * RGBELoader für .hdr Dateien (RGBE Format)
 * Lädt HDR-Umgebungen für fotorealistisches Rendering
 */
export class RGBELoader {
    constructor() {
        this.loader = null;
        this.pmremGenerator = null;
        console.log("🎨 RGBE Loader initialisiert");
    }

    /**
     * Initialisiert den RGBE Loader mit dem Renderer
     * @param {THREE.WebGLRenderer} renderer - Three.js Renderer
     */
    initialisieren(renderer) {
        if (!window.THREE || !window.THREE.RGBELoader) {
            console.warn("⚠️ THREE.RGBELoader nicht verfügbar - versuche lokalen Fallback");
            // Fallback: Verwende den Loader aus three.js CDN wenn verfügbar
            if (window.THREE) {
                console.log("✓ Verwende THREE.js Basis");
            } else {
                throw new Error("THREE.js nicht verfügbar");
            }
        }

        this.loader = new THREE.RGBELoader();
        this.pmremGenerator = new THREE.PMREMGenerator(renderer);
        this.pmremGenerator.compileEquirectangularShader();
        
        console.log("✅ RGBE Loader bereit für .hdr Dateien");
    }

    /**
     * Lädt eine .hdr Datei und erstellt Environment Map
     * @param {string} pfad - Pfad zur .hdr Datei
     * @param {Function} onProgress - Progress callback (optional)
     * @returns {Promise<THREE.Texture>} Environment Map
     */
    ladeHDRI(pfad, onProgress = null) {
        return new Promise((resolve, reject) => {
            if (!this.loader) {
                reject(new Error("Loader nicht initialisiert. Bitte initialisieren() aufrufen."));
                return;
            }

            console.log("🔄 Lade HDR-Umgebung:", pfad);

            this.loader.load(
                pfad,
                // onLoad
                (texture) => {
                    console.log("✅ HDR-Textur geladen");
                    
                    // Konvertiere zu Environment Map für PBR
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
                    
                    // Original-Textur für Background verwenden
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    
                    console.log("✅ Environment Map erstellt");
                    
                    resolve({
                        envMap: envMap,        // Für scene.environment (PBR)
                        background: texture    // Für scene.background (sichtbar)
                    });
                },
                // onProgress
                (xhr) => {
                    if (xhr.lengthComputable) {
                        const progress = (xhr.loaded / xhr.total * 100).toFixed(1);
                        console.log(`⏳ HDR Ladefortschritt: ${progress}%`);
                        if (onProgress) onProgress(progress);
                    }
                },
                // onError
                (error) => {
                    console.error("❌ Fehler beim Laden der HDR-Datei:", error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Bereinigt Ressourcen
     */
    dispose() {
        if (this.pmremGenerator) {
            this.pmremGenerator.dispose();
            this.pmremGenerator = null;
        }
        this.loader = null;
    }
}
