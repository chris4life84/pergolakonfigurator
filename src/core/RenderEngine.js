/**
 * RenderEngine - Hauptklasse für das 3D-Rendering des Pergola-Konfigurators
 *
 * Verwaltet die gesamte Rendering-Pipeline:
 * - Three.js Scene, Renderer
 * - Kamera und Steuerung (CameraController)
 * - Beleuchtung (LightingSystem)
 * - Post-Processing (PostProcessPipeline)
 * - Pergola-Erstellung und Updates
 *
 * Refactored: Verwendet modulare Komponenten für bessere Wartbarkeit
 */

import { Pergola } from "./Pergola.js";
import { KoordinatenAnzeige } from "../components/KoordinatenAnzeige.js";
import { Bemassung } from "../components/Bemassung.js";
import { HDRILoader } from "../loaders/EXRLoader.js";
import { RGBELoader } from "../loaders/RGBELoader.js";
import { Logger } from "../utils/Logger.js";
import { LightingSystem } from "./LightingSystem.js";
import { PostProcessPipeline } from "./PostProcessPipeline.js";
import { CameraController } from "./CameraController.js";

/**
 * Hintergrund-Konfiguration
 */
const BACKGROUND_CONFIG = {
    farbe: 0xe8dcc8, // Helles Beige
    envFarbe: "#808080" // Neutralgrau für Reflexionen
};

/**
 * Haupt-Rendering-Klasse für den Pergola-Konfigurator
 */
export class RenderEngine {
    /**
     * @param {string} canvasId - ID des Canvas-Elements
     */
    constructor(canvasId) {
        /** @type {HTMLCanvasElement} */
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas mit ID '${canvasId}' nicht gefunden`);
        }

        /** @type {Logger} */
        this.logger = new Logger("RenderEngine");

        // Three.js Basis-Komponenten
        /** @type {THREE.Scene} */
        this.scene = new THREE.Scene();

        /** @type {THREE.PerspectiveCamera} */
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000
        );

        /** @type {THREE.WebGLRenderer} */
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            preserveDrawingBuffer: true // Wichtig für Screenshots
        });

        // Modulare Komponenten
        /** @type {CameraController} */
        this.cameraController = new CameraController(this.camera, this.canvas);

        /** @type {LightingSystem} */
        this.lightingSystem = null;

        /** @type {PostProcessPipeline} */
        this.postProcessPipeline = null;

        // Legacy-Referenzen für Rückwärtskompatibilität
        /** @type {THREE.OrbitControls} */
        this.controls = null;

        // Pergola und Komponenten
        /** @type {Pergola} */
        this.pergola = null;

        /** @type {KoordinatenAnzeige} */
        this.koordinatenAnzeige = new KoordinatenAnzeige();

        /** @type {Bemassung} */
        this.bemassung = new Bemassung();

        // Loader
        /** @type {HDRILoader} */
        this.hdriLoader = new HDRILoader();

        /** @type {RGBELoader} */
        this.rgbeLoader = new RGBELoader();

        // Post-Processing Referenzen (Legacy)
        this.composer = null;
        this.renderPass = null;
        this.bloomPass = null;
        this.bokehPass = null;
        this.colorGradePass = null;
        this.fxaaPass = null;

        // Beleuchtung Referenz (Legacy)
        this.fillLight = null;

        // Overlays und Raycasting
        /** @type {Function[]} */
        this.overlayUpdaters = [];

        /** @type {THREE.Raycaster} */
        this.raycaster = new THREE.Raycaster();

        /** @type {THREE.Vector2} */
        this.pointer = new THREE.Vector2();

        // Umgebung
        this.umgebung = {
            beleuchtung: new THREE.Group(),
            boden: null,
            hintergrund: null,
            hdriTexture: null
        };

        // Status
        /** @type {boolean} */
        this.istInitialisiert = false;

        /** @type {number} */
        this.animationId = null;

        // Kein Fog
        this.scene.fog = null;

        // Event Listener initialisieren
        this.initEventListener();
    }

    // ========================================================================
    // INITIALISIERUNG
    // ========================================================================

    /**
     * Initialisiert die Render-Engine
     */
    async initialisieren() {
        this.logger.group("INITIALISIERE RENDER-ENGINE");

        try {
            // Renderer konfigurieren
            this.konfigurierRenderer();

            // Kamera initialisieren
            this.cameraController.initialisieren();
            this.controls = this.cameraController.gibControls();

            // Hintergrund laden
            await this.ladeHDRI();

            // Beleuchtung erstellen
            this.erstelleBeleuchtung();

            // Umgebung erstellen
            this.erstelleUmgebung();

            // Pergola erstellen
            this.pergola = new Pergola();
            this.erstellePergolaStruktur();

            // Kamera-Ansicht setzen
            this.setzeKameraStandardAnsicht(this.scene);

            // Koordinatenanzeige
            this.koordinatenAnzeige.initialisieren(this.scene);
            this.aktualisiereKoordinatenAnzeige();

            // Bemaßung
            this.scene.add(this.bemassung.gibGruppe());
            this.bemassung.erstelleBemassung(this.pergola.gibKonfiguration());
            this.bemassung.setzeVisibility(false);

            // Post-Processing
            this.initialisierePostprocessing();

            // Animation starten
            this.starteAnimation();

            this.istInitialisiert = true;
            this.logger.info("Render-Engine erfolgreich initialisiert");

        } catch (error) {
            this.logger.error("Fehler bei der Initialisierung:", error);
            throw error;
        }

        this.logger.groupEnd();
    }

    /**
     * Konfiguriert den WebGL-Renderer
     */
    konfigurierRenderer() {
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        this.renderer.physicallyCorrectLights = false;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 1.6;
    }

    // ========================================================================
    // HDRI / HINTERGRUND
    // ========================================================================

    /**
     * Lädt HDRI oder erstellt hellen Hintergrund
     */
    async ladeHDRI() {
        this.logger.debug("Erstelle hellen Hintergrund...");
        this.erstelleHellenHintergrund();
        this.logger.debug("Heller Hintergrund erstellt");
    }

    /**
     * Erstellt einen hellen Hintergrund
     */
    erstelleHellenHintergrund() {
        // Hintergrundfarbe setzen
        this.scene.background = new THREE.Color(BACKGROUND_CONFIG.farbe);

        // Environment für Reflexionen
        const envCanvas = document.createElement("canvas");
        envCanvas.width = 512;
        envCanvas.height = 512;
        const envCtx = envCanvas.getContext("2d");
        envCtx.fillStyle = BACKGROUND_CONFIG.envFarbe;
        envCtx.fillRect(0, 0, 512, 512);

        const envTexture = new THREE.CanvasTexture(envCanvas);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        envTexture.colorSpace = THREE.SRGBColorSpace;
        envTexture.needsUpdate = true;

        this.scene.environment = envTexture;
        this.umgebung.hdriTexture = envTexture;
        this.umgebung.hintergrund = this.scene.background;
    }

    // ========================================================================
    // BELEUCHTUNG
    // ========================================================================

    /**
     * Erstellt die Beleuchtung
     */
    erstelleBeleuchtung() {
        this.lightingSystem = new LightingSystem(this.scene);
        this.umgebung.beleuchtung = this.lightingSystem.erstelleBeleuchtung();

        // Legacy-Referenz für fillLight
        this.fillLight = this.lightingSystem.gibCameraFillLight();

        this.logger.debug("Professionelle Beleuchtung mit verbesserten Schatten aktiviert");
    }

    // ========================================================================
    // UMGEBUNG
    // ========================================================================

    /**
     * Erstellt Hintergrund (Legacy)
     */
    erstelleHintergrund() {
        this.scene.background = new THREE.Color(0xffffff);
        this.umgebung.hintergrund = this.scene.background;
    }

    /**
     * Erstellt die Umgebung (Boden)
     */
    erstelleUmgebung() {
        const geometrie = new THREE.CircleGeometry(40, 64);
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#ffffff"),
            roughness: 0.95,
            metalness: 0.0,
            transparent: true,
            opacity: 0.08,
            envMapIntensity: 0.1
        });

        this.umgebung.boden = new THREE.Mesh(geometrie, material);
        this.umgebung.boden.rotation.x = -Math.PI / 2;
        this.umgebung.boden.position.y = -0.08;
        this.umgebung.boden.receiveShadow = true;
        this.umgebung.boden.name = "Hintergrund-Boden";

        this.scene.add(this.umgebung.boden);
    }

    /**
     * Erstellt die Steuerung (Legacy - delegiert an CameraController)
     */
    erstelleSteuerung() {
        // Wird jetzt vom CameraController gehandhabt
        this.controls = this.cameraController.gibControls();
    }

    // ========================================================================
    // POST-PROCESSING
    // ========================================================================

    /**
     * Initialisiert Post-Processing
     */
    initialisierePostprocessing() {
        this.postProcessPipeline = new PostProcessPipeline(
            this.renderer,
            this.scene,
            this.camera
        );

        const success = this.postProcessPipeline.initialisieren(
            this.canvas.clientWidth,
            this.canvas.clientHeight
        );

        if (success) {
            // Legacy-Referenzen setzen
            this.composer = this.postProcessPipeline.gibComposer();
            this.logger.debug("Post-Processing aktiviert");
        }
    }

    /**
     * Aktualisiert FXAA-Auflösung (Legacy)
     */
    aktualisiereFXAAAufloesung(width, height, pixelRatio) {
        if (this.postProcessPipeline) {
            this.postProcessPipeline.aktualisiereFXAAAufloesung(width, height, pixelRatio);
        }
    }

    /**
     * Aktualisiert DOF-Fokus
     */
    aktualisiereDofFokus() {
        if (!this.postProcessPipeline) return;

        const target = this.cameraController.gibTarget();
        this.postProcessPipeline.aktualisiereDofFokus(this.camera.position, target);
    }

    /**
     * Aktualisiert Belichtung und Fill-Light
     */
    aktualisiereBelichtungUndFill() {
        const target = this.cameraController.gibTarget();

        // Post-Processing Belichtung
        if (this.postProcessPipeline) {
            this.postProcessPipeline.aktualisiereBelichtung(this.camera.position, target);
        }

        // Fill-Light aktualisieren
        if (this.lightingSystem) {
            this.lightingSystem.aktualisiereCameraFillLight(this.camera.position, target);
        }
    }

    // ========================================================================
    // KAMERA
    // ========================================================================

    /**
     * Positioniert die Kamera (Legacy)
     */
    positioniereKamera() {
        this.cameraController.positioniereKamera();
    }

    /**
     * Setzt die Kamera auf Standard-Ansicht
     * @param {THREE.Object3D} sceneObject - Referenz-Objekt
     */
    setzeKameraStandardAnsicht(sceneObject) {
        this.cameraController.setzeStandardAnsicht(sceneObject);
    }

    // ========================================================================
    // ANIMATION
    // ========================================================================

    /**
     * Startet die Animation-Loop
     */
    starteAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            // Controls aktualisieren
            this.cameraController.update();

            // Overlay-Updater ausführen
            this.overlayUpdaters.forEach(updater => {
                try {
                    updater();
                } catch (error) {
                    this.logger.warn("Overlay-Update Fehler:", error);
                }
            });

            // Post-Processing Updates
            this.aktualisiereDofFokus();
            this.aktualisiereBelichtungUndFill();

            // Rendern
            if (this.postProcessPipeline?.istAktiv()) {
                this.postProcessPipeline.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }
        };

        animate();
    }

    /**
     * Stoppt die Animation
     */
    stoppeAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // ========================================================================
    // PERGOLA-VERWALTUNG
    // ========================================================================

    /**
     * Erstellt die Pergola-Struktur
     */
    erstellePergolaStruktur() {
        // Alte Pergolas entfernen
        this.scene.children
            .filter(obj => obj.name && (
                obj.name.startsWith("PergolaHauptgruppe") ||
                obj.name === "PergolaHauptgruppe" ||
                obj.name.startsWith("CarportSegment")
            ))
            .forEach(obj => this.scene.remove(obj));

        const config = this.pergola.gibKonfiguration();
        const carportModus = config.carportModus || false;
        const carportSegmente = config.carportSegmente || [];

        // SEGMENT-BASIERTER CARPORT-MODUS
        if (carportModus && carportSegmente.length > 0) {
            this.logger.debug(`Segment-basierter Carport: Erstelle ${carportSegmente.length} Segment(e)`);
            this.erstelleCarportSegmente(config, carportSegmente);
        }
        // ALTER CARPORT-MODUS (Rückwärtskompatibilität)
        else if (carportModus) {
            this.logger.warn("Carport-Modus aktiv, aber keine Segmente definiert - erstelle einzelne Pergola");
            const pergola = this.pergola.erstellePergola();
            pergola.position.set(0, 0, 0);
            this.scene.add(pergola);
        }
        // NORMALER PERGOLA-MODUS
        else {
            this.logger.debug("Normaler Modus: Erstelle einzelne Pergola");
            const pergola = this.pergola.erstellePergola();
            pergola.position.set(0, 0, 0);
            this.scene.add(pergola);
            this.logger.debug("Einzelne Pergola erstellt");
        }
    }

    /**
     * Erstellt Carport-Segmente
     * @param {object} originalKonfig - Originale Konfiguration
     * @param {Array} segmente - Segment-Definitionen
     */
    erstelleCarportSegmente(originalKonfig, segmente) {
        const konfig = JSON.parse(JSON.stringify(originalKonfig));
        let masterGlasBerechnung = null;

        segmente.forEach((segment, idx) => {
            this.logger.debug(`  → Segment ${idx + 1}: ${segment.breite}×${segment.tiefe}m bei (${segment.x}, ${segment.z}), Rotation: ${segment.rotation}°`);

            try {
                const segmentKonfig = this.erzeugeSegmentKonfiguration(konfig, segment);

                this.logger.debug("[RENDER] baue Segment", {
                    idx,
                    x: Number(segment.x) || 0,
                    z: Number(segment.z) || 0,
                    rotation: Number(segment.rotation) || 0,
                    neigung: segmentKonfig.neigung,
                    dachTyp: segmentKonfig.dachTyp
                });

                this.pergola.aktualisiereKonfigurationen(segmentKonfig);

                // Master-Glasraster auf Folgesegmente anwenden
                if (idx > 0 && masterGlasBerechnung) {
                    this.pergola.koordinatenSystem.glasBerechnung = JSON.parse(JSON.stringify(masterGlasBerechnung));
                }

                const segmentBasis = this.pergola.erstellePergola();

                // Erstes Segment definiert das Glasraster
                if (idx === 0) {
                    masterGlasBerechnung = JSON.parse(JSON.stringify(this.pergola?.koordinatenSystem?.glasBerechnung || null));
                }

                const segmentPergola = this.klonePergola(segmentBasis);

                // Positionieren und Rotieren
                const posX = Number(segment.x) || 0;
                const posZ = Number(segment.z) || 0;
                const rotation = Number(segment.rotation) || 0;

                segmentPergola.position.set(posX, 0, posZ);
                segmentPergola.rotation.y = rotation * Math.PI / 180;
                segmentPergola.name = `CarportSegment_${idx + 1}`;

                this.scene.add(segmentPergola);

                const pfostenVersaetzeCount = segment?.pfostenVersaetze ? Object.keys(segment.pfostenVersaetze).length : 0;
                this.logger.debug(`  Segment ${idx + 1} gerendert (Pfosten individuell: ${pfostenVersaetzeCount})`);

            } catch (error) {
                this.logger.error(`Segment ${idx + 1} konnte nicht erstellt werden:`, error);
            }
        });

        // Originale Konfiguration wiederherstellen
        this.pergola.aktualisiereKonfigurationen(originalKonfig);

        this.logger.debug(`Carport mit ${segmente.length} Segment(en) erstellt`);
    }

    /**
     * Klont eine Pergola inkl. Materialien
     * @param {THREE.Group} original - Original-Gruppe
     * @returns {THREE.Group}
     */
    klonePergola(original) {
        const klon = original.clone(true);

        klon.traverse(obj => {
            if (obj.isMesh && obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material = obj.material.map(mat => mat.clone());
                } else {
                    obj.material = obj.material.clone();
                }
            }
        });

        return klon;
    }

    /**
     * Erzeugt eine Segment-Konfiguration
     * @param {object} basisKonfig - Basis-Konfiguration
     * @param {object} segment - Segment-Definition
     * @returns {object}
     */
    erzeugeSegmentKonfiguration(basisKonfig = {}, segment = {}) {
        const konfig = JSON.parse(JSON.stringify(basisKonfig));

        const numOr = (value, fallback) => {
            const parsed = parseFloat(value);
            return Number.isFinite(parsed) ? parsed : fallback;
        };

        konfig.carportModus = false;
        konfig.carportSegmente = [];
        konfig.breite = numOr(segment?.breite, konfig.breite);
        konfig.tiefe = Math.max(0.5, numOr(segment?.tiefe, konfig.tiefe) - 0.08);
        konfig.hoehe = numOr(segment?.hoehe, konfig.hoehe);
        konfig.neigung = Math.max(0, Math.min(5, numOr(segment?.neigung, konfig.neigung)));

        // Optionale Parameter
        konfig.regenwasserAbfluss = segment?.regenwasserAbfluss ?? konfig.regenwasserAbfluss;
        konfig.dachTyp = segment?.dachTyp ?? konfig.dachTyp;
        konfig.dach = segment?.dach ?? konfig.dach;
        konfig.glasTyp = segment?.glasTyp ?? konfig.glasTyp;
        konfig.glasFarbe = segment?.glasFarbe ?? konfig.glasFarbe;
        konfig.epdmFarbe = segment?.epdmFarbe ?? konfig.epdmFarbe;
        konfig.zwischenpfostenBreite = !!segment?.zwischenpfostenBreite;
        konfig.zwischenpfostenTiefe = !!segment?.zwischenpfostenTiefe;

        if (segment?.zwischenpfostenProfil) {
            konfig.zwischenpfostenProfil = segment.zwischenpfostenProfil;
        }

        // Neigung für Glas/EPDM im Carport auf 0 setzen
        if (konfig.dachTyp === "glas" || konfig.dachTyp === "epdm") {
            konfig.neigung = 0;
        }

        this.logger.debug("[RENDER] erzeugeSegmentKonfiguration", {
            originalNeigung: basisKonfig.neigung,
            originalDachTyp: basisKonfig.dachTyp,
            segmentInput: { id: segment?.id, neigung: segment?.neigung, dachTyp: segment?.dachTyp },
            resultNeigung: konfig.neigung,
            resultDachTyp: konfig.dachTyp
        });

        // Individuelle Pfosten-Einstellungen
        const hatWerte = (obj) => obj && Object.keys(obj).length > 0;
        const setzeIndividuell = (key, werte) => {
            if (!konfig[key]) konfig[key] = {};
            if (hatWerte(werte)) {
                konfig[key] = {
                    ...konfig[key],
                    individuell: { ...werte }
                };
            } else if (konfig[key]?.individuell) {
                delete konfig[key].individuell;
            }
        };

        setzeIndividuell("pfostenVersaetze", segment.pfostenVersaetze);
        setzeIndividuell("pfostenKuerzung", segment.pfostenKuerzung);
        setzeIndividuell("pfostenAktiv", segment.pfostenAktiv);

        return konfig;
    }

    /**
     * Aktualisiert die Pergola
     * @param {object} neueKonfiguration - Neue Konfiguration
     */
    aktualisierePergola(neueKonfiguration) {
        if (!this.pergola) {
            this.logger.warn("Keine Pergola-Instanz vorhanden");
            return;
        }

        try {
            this.pergola.aktualisiereKonfigurationen(neueKonfiguration);
            this.erstellePergolaStruktur();

            if (this.bemassung) {
                this.bemassung.erstelleBemassung(this.pergola.gibKonfiguration());
            }
        } catch (error) {
            this.logger.error("Fehler beim Aktualisieren der Pergola:", error);
        }
    }

    // ========================================================================
    // FENSTER-GRÖßE
    // ========================================================================

    /**
     * Behandelt Fenstergrößenänderung
     */
    aufFensterGroesseAendern() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        // Kamera-Aspect aktualisieren
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Kamera-Ansicht aktualisieren
        if (this.pergola?.gib3DGruppe()) {
            this.setzeKameraStandardAnsicht(this.pergola.gib3DGruppe());
        } else {
            this.positioniereKamera();
        }

        // Renderer-Größe
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Post-Processing aktualisieren
        const pixelRatio = this.renderer.getPixelRatio();
        if (this.postProcessPipeline) {
            this.postProcessPipeline.setzeGroesse(width, height);
        }

        // Legacy-Fallback für direkten composer-Zugriff
        if (this.composer && !this.postProcessPipeline) {
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
    // EVENT-HANDLING
    // ========================================================================

    /**
     * Initialisiert Event-Listener
     */
    initEventListener() {
        window.addEventListener("resize", () => this.aufFensterGroesseAendern());

        document.addEventListener("pergolaStrukturAktualisiert", (event) => {
            this.logger.debug("Pergola-Update empfangen:", event.detail);
            this.aktualisierBemassung();
        });

        this.canvas.addEventListener("click", (event) => this.handleCanvasClick(event));
    }

    /**
     * Behandelt Canvas-Klicks (Segment-Auswahl)
     * @param {MouseEvent} event - Klick-Event
     */
    handleCanvasClick(event) {
        if (!this.pergola) return;

        const config = this.pergola.gibKonfiguration?.();
        if (!config?.carportModus) return;

        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = 2 * (event.clientX - rect.left) / rect.width - 1;
        this.pointer.y = 1 - 2 * (event.clientY - rect.top) / rect.height;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        const hit = intersects.find(intersection => {
            let obj = intersection.object;
            while (obj) {
                if (typeof obj.name === "string" && obj.name.startsWith("CarportSegment_")) {
                    return true;
                }
                obj = obj.parent;
            }
            return false;
        });

        if (hit) {
            let obj = hit.object;
            while (obj) {
                if (typeof obj.name === "string" && obj.name.startsWith("CarportSegment_")) {
                    const match = obj.name.match(/CarportSegment_(\d+)/);
                    const segmentId = match ? parseInt(match[1], 10) : null;

                    if (segmentId) {
                        document.dispatchEvent(new CustomEvent("carportSegmentSelected", {
                            detail: { segmentId }
                        }));
                    }
                    break;
                }
                obj = obj.parent;
            }
        }
    }

    // ========================================================================
    // KOORDINATEN-ANZEIGE
    // ========================================================================

    /**
     * Aktualisiert die Koordinatenanzeige
     */
    aktualisiereKoordinatenAnzeige() {
        if (!this.pergola || !this.koordinatenAnzeige) return;

        const koordinatenSystem = this.pergola.gibKoordinatenSystem();

        const daten = {
            pfostenOberkanten: koordinatenSystem.gibReferenzpunkt("pfostenOberkanten") || {},
            quertraegerPositionen: koordinatenSystem.gibReferenzpunkt("quertraegerReferenz") || [],
            laengstraeger: {},
            statistiken: this.pergola.berechneStatistiken()
        };

        this.koordinatenAnzeige.zeigeKoordinaten(daten);
    }

    /**
     * Toggle Koordinatenanzeige
     * @returns {boolean}
     */
    toggleKoordinatenAnzeige() {
        if (!this.koordinatenAnzeige) return false;
        return this.koordinatenAnzeige.toggleSichtbarkeit();
    }

    /**
     * Setzt Koordinaten-Sichtbarkeit
     * @param {boolean} sichtbar - Sichtbar oder nicht
     */
    setzeKoordinatenSichtbarkeit(sichtbar) {
        if (this.koordinatenAnzeige) {
            this.koordinatenAnzeige.setzeSichtbarkeit(sichtbar);
        }
    }

    /**
     * Gibt Koordinatenanzeige zurück
     * @returns {KoordinatenAnzeige}
     */
    gibKoordinatenAnzeige() {
        return this.koordinatenAnzeige;
    }

    // ========================================================================
    // BEMASSUNG
    // ========================================================================

    /**
     * Toggle Bemaßung
     * @returns {boolean}
     */
    toggleBemassung() {
        if (!this.bemassung) return false;

        const neuerStatus = !this.bemassung.istBemassungSichtbar();
        this.bemassung.setzeVisibility(neuerStatus);

        if (neuerStatus) {
            this.bemassung.erstelleBemassung(this.pergola.gibKonfiguration());
        }

        return neuerStatus;
    }

    /**
     * Prüft ob Bemaßung aktiv
     * @returns {boolean}
     */
    istBemassungAktiv() {
        return this.bemassung?.istBemassungSichtbar() || false;
    }

    /**
     * Aktualisiert Bemaßung
     */
    aktualisierBemassung() {
        if (this.bemassung?.istBemassungSichtbar()) {
            this.bemassung.aktualisieren(this.pergola.gibKonfiguration());
        }
    }

    // ========================================================================
    // OVERLAY-SYSTEM
    // ========================================================================

    /**
     * Registriert einen Overlay-Updater
     * @param {Function} updater - Update-Funktion
     * @returns {Function} - Unsubscribe-Funktion
     */
    registriereOverlayUpdater(updater) {
        if (typeof updater !== "function") {
            return () => {};
        }

        this.overlayUpdaters.push(updater);

        return () => {
            this.overlayUpdaters = this.overlayUpdaters.filter(u => u !== updater);
        };
    }

    // ========================================================================
    // GETTER
    // ========================================================================

    /**
     * Gibt die Pergola zurück
     * @returns {Pergola}
     */
    gibPergola() {
        return this.pergola;
    }

    /**
     * Gibt die Szene zurück
     * @returns {THREE.Scene}
     */
    gibSzene() {
        return this.scene;
    }

    /**
     * Gibt den Renderer zurück
     * @returns {THREE.WebGLRenderer}
     */
    gibRenderer() {
        return this.renderer;
    }

    // ========================================================================
    // DEBUG
    // ========================================================================

    /**
     * Debug-Ausgabe
     */
    debugRenderEngine() {
        this.logger.group("RENDER-ENGINE DEBUG");
        this.logger.info("Initialisiert:", this.istInitialisiert);
        this.logger.info("Szenen-Objekte:", this.scene.children.length);
        this.logger.info("Kamera-Position:", this.camera.position);
        this.logger.info("Renderer-Größe:", this.renderer.getSize(new THREE.Vector2()));

        if (this.pergola) {
            this.logger.info("Pergola-Status:", this.pergola.berechneStatistiken());
        }

        this.logger.groupEnd();
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Räumt alle Ressourcen auf
     */
    dispose() {
        // Animation stoppen
        this.stoppeAnimation();

        // Event-Listener entfernen
        window.removeEventListener("resize", this.aufFensterGroesseAendern);

        // Komponenten aufräumen
        if (this.koordinatenAnzeige) {
            this.koordinatenAnzeige.dispose();
        }

        if (this.pergola) {
            this.pergola.dispose();
        }

        // Module aufräumen
        if (this.postProcessPipeline) {
            this.postProcessPipeline.dispose();
        }

        if (this.lightingSystem) {
            this.lightingSystem.dispose();
        }

        if (this.cameraController) {
            this.cameraController.dispose();
        }

        // Legacy-Cleanup
        if (this.bokehPass?.dispose) {
            this.bokehPass.dispose();
        }
        if (this.bloomPass?.dispose) {
            this.bloomPass.dispose();
        }
        if (this.composer?.dispose) {
            this.composer.dispose();
        }

        // Szene aufräumen
        this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });

        // Renderer aufräumen
        this.renderer.dispose();
    }
}
