import{
    Pergola
}
from"./Pergola.js";
import{
    KoordinatenAnzeige
}
from"../components/KoordinatenAnzeige.js";
import{
    Bemassung
}
from"../components/Bemassung.js";
import{
    HDRILoader
}
from"../loaders/EXRLoader.js";
import{
    RGBELoader
}
from"../loaders/RGBELoader.js";
export class RenderEngine{
    constructor(e){
        if(this.canvas=document.getElementById(e), !this.canvas)throw new Error(`Canvas mit ID '${e}' nicht gefunden`);
        this.scene=new THREE.Scene,
        this.camera=new THREE.PerspectiveCamera(75, this.canvas.clientWidth/this.canvas.clientHeight, .1, 1e3),
        this.renderer=new THREE.WebGLRenderer({
            canvas:this.canvas, 
            antialias:!0,
            preserveDrawingBuffer:true  // WICHTIG für Screenshots!
        }),
        this.controls=null,
        this.pergola=null,
        this.koordinatenAnzeige=new KoordinatenAnzeige,
        this.bemassung=new Bemassung,
        this.hdriLoader=new HDRILoader,
        this.rgbeLoader=new RGBELoader,
        this.composer=null,
        this.renderPass=null,
        this.bloomPass=null,
        this.bokehPass=null,
        this.colorGradePass=null,
        this.fxaaPass=null,
        this.fillLight=null,
        this.overlayUpdaters=[],
        this.raycaster=new THREE.Raycaster,
        this.pointer=new THREE.Vector2,
        this.umgebung={
            beleuchtung:new THREE.Group,
            boden:null,
            hintergrund:null,
            hdriTexture:null
        },
        this.istInitialisiert=!1,
        this.animationId=null,
        this.scene.fog=null,
        this.initEventListener()
    }
    async initialisieren(){
        console.group("🎬 INITIALISIERE RENDER-ENGINE");
        try{
            this.konfigurierRenderer(),
            this.positioniereKamera(),
            await this.ladeHDRI(),
            this.erstelleBeleuchtung(),
            this.erstelleUmgebung(),
            this.erstelleSteuerung(),
            this.pergola=new Pergola,
            this.erstellePergolaStruktur(),
            this.setzeKameraStandardAnsicht(this.scene),
            this.koordinatenAnzeige.initialisieren(this.scene),
            this.aktualisiereKoordinatenAnzeige(),
            this.scene.add(this.bemassung.gibGruppe()),
            this.bemassung.erstelleBemassung(this.pergola.gibKonfiguration()),
            this.bemassung.setzeVisibility(!1),
            this.initialisierePostprocessing(),
            this.starteAnimation(),
            this.istInitialisiert=!0,
            console.log("✅ Render-Engine erfolgreich initialisiert")
        }
        catch(e){
            throw console.error("❌ Fehler bei der Initialisierung:", e),
            e
        }
        console.groupEnd()
    }
    async ladeHDRI(){
        // Verwende einfachen hellen Hintergrund statt HDRI
        console.log("🎨 Erstelle hellen Hintergrund...");
        this.erstelleHellenHintergrund();
        console.log("✅ Heller Hintergrund erstellt");
    }
    
    erstelleHellenHintergrund(){
        // Helles Beige für warmen, natürlichen Look
        this.scene.background = new THREE.Color(0xe8dcc8);
        
        // Environment für Reflexionen (dunkel für satte Materialfarben)
        const envCanvas = document.createElement("canvas");
        envCanvas.width = 512;
        envCanvas.height = 512;
        const envCtx = envCanvas.getContext("2d");
        envCtx.fillStyle = "#808080";  // Neutralgrau statt Weiß
        envCtx.fillRect(0, 0, 512, 512);
        
        const n = new THREE.CanvasTexture(envCanvas);
        n.mapping = THREE.EquirectangularReflectionMapping;
        n.colorSpace = THREE.SRGBColorSpace;
        n.needsUpdate = true;
        
        // Setze Environment und Background
        this.scene.environment = n;
        this.umgebung.hdriTexture = n;
        this.umgebung.hintergrund = this.scene.background;
    }
    konfigurierRenderer(){
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight),
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)),
        this.renderer.shadowMap.enabled=!0,
        this.renderer.shadowMap.type=THREE.PCFSoftShadowMap,
        this.renderer.shadowMap.autoUpdate=!0,
        this.renderer.physicallyCorrectLights=!1,
        this.renderer.outputColorSpace=THREE.SRGBColorSpace,
        this.renderer.toneMapping=THREE.LinearToneMapping,
        this.renderer.toneMappingExposure=1.6
    }
    positioniereKamera(){
        window.innerWidth<=768?(this.camera.fov=88, this.camera.position.set(2.2, .8, 2.2), this.camera.lookAt(1.8, 1.8, .2)):(this.camera.fov=75, this.camera.position.set(1.35, .45, 1.35), this.camera.lookAt(1.8, 1.85, 0)),
        this.camera.updateProjectionMatrix()
    }
    initialisierePostprocessing(){
        if(!THREE.EffectComposer||!THREE.RenderPass){
            console.warn("Post-Processing nicht verfügbar (EffectComposer fehlt)");
            return
        }
        const e=new THREE.Vector2(this.canvas.clientWidth, this.canvas.clientHeight),
        i=this.renderer.getPixelRatio(),
        r=new THREE.WebGLRenderTarget(e.x, e.y,{
            samples:this.renderer.capabilities.isWebGL2?2:0
        });
        this.composer=new THREE.EffectComposer(this.renderer, r),
        this.composer.setPixelRatio(i),
        this.renderPass=new THREE.RenderPass(this.scene, this.camera),
        this.composer.addPass(this.renderPass),
        THREE.UnrealBloomPass?(this.bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(e.x, e.y), .15, .4, .95), this.bloomPass.threshold=.95, this.bloomPass.strength=.15, this.bloomPass.radius=.25, this.composer.addPass(this.bloomPass)):console.warn("UnrealBloomPass nicht verfügbar - Bloom deaktiviert"),
        THREE.BokehPass?(this.bokehPass=new THREE.BokehPass(this.scene, this.camera,{
            focus:this.camera.position.distanceTo(this.controls?.target||new THREE.Vector3)||2.8,
            aperture:.00018,
            maxblur:.007,
            width:e.x,
            height:e.y
        }), this.composer.addPass(this.bokehPass)):console.warn("BokehPass nicht verfügbar - Depth of Field deaktiviert"),
        THREE.ColorGradeShader&&THREE.ShaderPass?(this.colorGradePass=new THREE.ShaderPass(THREE.ColorGradeShader), this.colorGradePass.uniforms.exposure.value=1.3, this.colorGradePass.uniforms.temperature.value=0, this.colorGradePass.uniforms.contrast.value=1.18, this.colorGradePass.uniforms.saturation.value=1.05, this.composer.addPass(this.colorGradePass)):console.warn("ColorGradeShader nicht verfügbar - Farbkorrektur deaktiviert"),
        THREE.FXAAShader&&THREE.ShaderPass?(this.fxaaPass=new THREE.ShaderPass(THREE.FXAAShader), this.fxaaPass.renderToScreen=!0, this.aktualisiereFXAAAufloesung(e.x, e.y, i), this.composer.addPass(this.fxaaPass)):(this.composer.passes.length>0&&(this.composer.passes[this.composer.passes.length-1].renderToScreen=!0), console.warn("FXAA Shader nicht verfügbar - nutze Renderer AA")),
        console.log("🎞️ Post-Processing aktiviert")
    }
    aktualisiereFXAAAufloesung(e, i, r){
        this.fxaaPass&&this.fxaaPass.material&&this.fxaaPass.material.uniforms&&this.fxaaPass.material.uniforms.resolution&&this.fxaaPass.material.uniforms.resolution.value.set(1/(e*r), 1/(i*r))
    }
    aktualisiereDofFokus(){
        if(!this.bokehPass)return;
        const e=this.controls?.target||new THREE.Vector3;
        this.bokehPass.uniforms.focus.value=this.camera.position.distanceTo(e),
        this.bokehPass.uniforms.aspect.value=this.camera.aspect
    }
    aktualisiereBelichtungUndFill(){
        const e=this.controls?.target||new THREE.Vector3;
        const t=this.camera.position.distanceTo(e);
        const i=Math.max(0, 3-t)*0.05;
        const r=THREE.MathUtils.clamp(1.5+i, 1.5, 1.8);
        this.renderer.toneMappingExposure=r;
        this.colorGradePass&&this.colorGradePass.uniforms?.exposure&&(this.colorGradePass.uniforms.exposure.value=Math.max(1.25, r*1.05));
        if(this.fillLight){
            this.fillLight.position.copy(this.camera.position);
            this.fillLight.position.add(new THREE.Vector3(.4,.8,.4));
            this.fillLight.target&&this.fillLight.target.position&&this.fillLight.target.position.copy(e)
        }
    }
    setzeKameraStandardAnsicht(e){
        if(!e)return;
        const t=(new THREE.Box3).setFromObject(e);
        if(t.isEmpty())return;
        const i=new THREE.Vector3,
        n=new THREE.Vector3;
        t.getCenter(i),
        t.getSize(n);
        const s=window.innerWidth<=768;
        this.camera.fov=s?88:70,
        s?this.camera.position.set(i.x+3.75, i.y-5, i.z+2.5):this.camera.position.set(i.x+3.75, i.y-5, i.z-2.5);
        const r=new THREE.Vector3(i.x+.5, i.y+-.1*n.y, i.z);
        this.camera.lookAt(r),
        this.camera.updateProjectionMatrix(),
        this.controls&&(this.controls.target.copy(r), this.controls.update())
    }
    erstelleBeleuchtung(){
        const e=new THREE.AmbientLight(16777215, 0.4);
        this.umgebung.beleuchtung.add(e);
        const t=new THREE.DirectionalLight(16777215, 0.8);
        t.position.set(25, 25, 55),
        t.castShadow=!0,
        t.shadow.mapSize.width=4096,
        t.shadow.mapSize.height=4096,
        t.shadow.camera.near=1,
        t.shadow.camera.far=80,
        t.shadow.camera.left=-15,
        t.shadow.camera.right=15,
        t.shadow.camera.top=15,
        t.shadow.camera.bottom=-15,
        t.shadow.bias=-.0008,
        t.shadow.normalBias=.01,
        t.shadow.radius=1,
        this.umgebung.beleuchtung.add(t);
        const i=new THREE.DirectionalLight(16777215, 0.8);
        i.position.set(-25, 12, 0),
        this.umgebung.beleuchtung.add(i);
        const n=new THREE.DirectionalLight(16777215, 0.6);
        n.position.set(0, 8, 25),
        this.umgebung.beleuchtung.add(n);
        const s=new THREE.DirectionalLight(16777215, 0.5);
        s.position.set(0, 8, -25),
        this.umgebung.beleuchtung.add(s);
        this.fillLight=new THREE.DirectionalLight(16777215, .4),
        this.fillLight.position.set(2,2,2),
        this.fillLight.castShadow=!1,
        this.fillLight.target.position.set(0,0,0),
        this.umgebung.beleuchtung.add(this.fillLight),
        this.scene.add(this.umgebung.beleuchtung),
        console.log("💡 Professionelle Beleuchtung mit verbesserten Schatten aktiviert")
    }
    erstelleHintergrund(){
        // Einfache weiße Farbe statt Verlauf - keine Streifen
        this.scene.background=new THREE.Color(16777215),
        this.umgebung.hintergrund=this.scene.background
    }
    erstelleUmgebung(){
        const e=new THREE.CircleGeometry(40, 64),
        t=new THREE.MeshStandardMaterial({
            color:new THREE.Color("#ffffff"), 
            roughness:.95, 
            metalness:.0, 
            transparent:!0, 
            opacity:.08,  // Fast unsichtbar
            envMapIntensity:.1
        });
        this.umgebung.boden=new THREE.Mesh(e, t),
        this.umgebung.boden.rotation.x=-Math.PI/2,
        this.umgebung.boden.position.y=-.08,
        this.umgebung.boden.receiveShadow=!0,
        this.umgebung.boden.name="Hintergrund-Boden",
        this.scene.add(this.umgebung.boden)
    }
    erstelleSteuerung(){
        window.THREE&&window.THREE.OrbitControls?(
            this.controls=new THREE.OrbitControls(this.camera, this.renderer.domElement), 
            // Premium Kamera-Einstellungen für geschmeidige Steuerung
            this.controls.enableDamping=!0, 
            this.controls.dampingFactor=0.12,  // Höhere Dämpfung für sanfteres Auslaufen
            this.controls.minDistance=3, 
            this.controls.maxDistance=25,  // Mehr Zoom-Freiheit (war 20)
            this.controls.maxPolarAngle=Math.PI/2.1,  // Leicht mehr Winkel
            this.controls.enablePan=!0, 
            this.controls.panSpeed=0.28,  // Noch ruhigeres Panning
            this.controls.enableZoom=!0, 
            this.controls.zoomSpeed=0.48,  // Deutlich entschleunigtes Zoomen
            this.controls.rotateSpeed=0.26,  // Sanftere Rotation
            this.controls.autoRotate=!1,
            this.controls.screenSpacePanning=!0,  // Besseres Pan-Verhalten
            this.controls.mouseButtons={
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            },
            this.controls.touches={
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            },
            this.controls.update()
        ):console.warn("OrbitControls nicht verfügbar - Kamera-Steuerung deaktiviert")
    }
    starteAnimation(){
        const e=()=>{
            this.animationId=requestAnimationFrame(e),
            this.controls&&this.controls.update(),
            this.overlayUpdaters.forEach(t=>{
                try{
                    t()
                }
                catch(e){
                    console.warn("Overlay-Update Fehler:", e)
                }
            }),
            this.aktualisiereDofFokus(),
            this.aktualisiereBelichtungUndFill(),
            this.composer?this.composer.render():this.renderer.render(this.scene, this.camera)
        };
        e()
    }
    stoppeAnimation(){
        this.animationId&&(cancelAnimationFrame(this.animationId), this.animationId=null)
    }
    erstellePergolaStruktur(){
        // Entferne alte Pergolas
        this.scene.children.filter(e=>e.name&&(e.name.startsWith("PergolaHauptgruppe")||"PergolaHauptgruppe"===e.name||e.name.startsWith("CarportSegment"))).forEach(e=>this.scene.remove(e));

        const e=this.pergola.gibKonfiguration(),
        t=e.carportModus||!1,
        carportSegmente=e.carportSegmente||[];

        // SEGMENT-BASIERTER CARPORT-MODUS
        if(t && carportSegmente.length > 0){
            console.log(`🏗️ Segment-basierter Carport: Erstelle ${carportSegmente.length} Segment(e)`);

            const originalKonfig = JSON.parse(JSON.stringify(e||{}));
            let masterGlasBerechnung=null;

            carportSegmente.forEach((segment, idx) => {
                console.log(`  → Segment ${idx+1}: ${segment.breite}×${segment.tiefe}m bei (${segment.x}, ${segment.z}), Rotation: ${segment.rotation}°`);
                try{
                    const segmentKonfig = this.erzeugeSegmentKonfiguration(originalKonfig, segment);
                    console.log("[RENDER] baue Segment", {
                        idx,
                        x: Number(segment.x)||0,
                        z: Number(segment.z)||0,
                        rotation: Number(segment.rotation)||0,
                        neigung: segmentKonfig.neigung,
                        dachTyp: segmentKonfig.dachTyp
                    });
                    this.pergola.aktualisiereKonfigurationen(segmentKonfig);
                    // Falls ein Master-Glasraster existiert, auf Folgesegmente anwenden (nach Konfig-Update)
                    if(idx>0 && masterGlasBerechnung){
                        this.pergola.koordinatenSystem.glasBerechnung=JSON.parse(JSON.stringify(masterGlasBerechnung));
                    }
                    const segmentBasis = this.pergola.erstellePergola();
                    // Erstes Segment definiert das Glasraster für alle weiteren
                    if(idx===0){
                        masterGlasBerechnung=JSON.parse(JSON.stringify(this.pergola?.koordinatenSystem?.glasBerechnung||null));
                    }
                    const segmentPergola = this.klonePergola(segmentBasis);

                    // Positioniere und rotiere das Segment
                    const posX = Number(segment.x)||0;
                    const posZ = Number(segment.z)||0;
                    const rotation = Number(segment.rotation)||0;
                    segmentPergola.position.set(posX, 0, posZ);
                    segmentPergola.rotation.y = rotation*Math.PI/180;
                    segmentPergola.name = `CarportSegment_${idx+1}`;

                    this.scene.add(segmentPergola);
                    console.log(`  ✅ Segment ${idx+1} gerendert (Pfosten individuell: ${segment?.pfostenVersaetze?Object.keys(segment.pfostenVersaetze).length:0})`);
                }
                catch(error){
                    console.error(`❌ Segment ${idx+1} konnte nicht erstellt werden:`, error);
                }
            });

            // Stelle ursprüngliche Konfiguration wieder her, damit Statistiken & UI konsistent bleiben
            this.pergola.aktualisiereKonfigurationen(originalKonfig);

            console.log(`✅ Carport mit ${carportSegmente.length} Segment(en) erstellt`);
        }
        // ALTER CARPORT-MODUS (für Rückwärtskompatibilität)
        else if(t){
            console.log("⚠️ Carport-Modus aktiv, aber keine Segmente definiert - erstelle einzelne Pergola");
            const pergola = this.pergola.erstellePergola();
            pergola.position.set(0, 0, 0);
            this.scene.add(pergola);
        }
        // NORMALER PERGOLA-MODUS
        else{
            console.log("🏗️ Normaler Modus: Erstelle einzelne Pergola");
            const pergola=this.pergola.erstellePergola();
            pergola.position.set(0, 0, 0);
            this.scene.add(pergola);
            console.log("✅ Einzelne Pergola erstellt");
        }
    }
    klonePergola(e){
        const t=e.clone(!0);
        return t.traverse(e=>{
            e.isMesh&&e.material&&(Array.isArray(e.material)?e.material=e.material.map(e=>e.clone()):e.material=e.material.clone())
        }),
        t
    }
    erzeugeSegmentKonfiguration(e={}, t={}){
        const n=JSON.parse(JSON.stringify(e));
        const numOr=(v,f)=>{
            const p=parseFloat(v);
            return Number.isFinite(p)?p:f;
        };
        n.carportModus=!1,
        n.carportSegmente=[],
        n.breite=numOr(t?.breite, n.breite),
        // Bei Carport-Segmenten wurde bisher das Innenmaß verwendet; ziehe Rahmenzuschlag ab, damit die Außenmaße dem Eingabewert entsprechen
        n.tiefe=Math.max(.5, numOr(t?.tiefe, n.tiefe)-.08),
        n.hoehe=numOr(t?.hoehe, n.hoehe),
        n.neigung=Math.max(0, Math.min(5, numOr(t?.neigung, n.neigung))),
        n.regenwasserAbfluss=t?.regenwasserAbfluss??n.regenwasserAbfluss,
        n.dachTyp=t?.dachTyp??n.dachTyp,
        n.dach=t?.dach??n.dach,
        n.glasTyp=t?.glasTyp??n.glasTyp,
        n.glasFarbe=t?.glasFarbe??n.glasFarbe,
        n.epdmFarbe=t?.epdmFarbe??n.epdmFarbe,
        n.zwischenpfostenBreite=!!t?.zwischenpfostenBreite,
        n.zwischenpfostenTiefe=!!t?.zwischenpfostenTiefe,
        t?.zwischenpfostenProfil&&(n.zwischenpfostenProfil=t.zwischenpfostenProfil);

        // Flachdach erzwingen, wenn Dachtyp Glas und/oder Segment-Neigung fehlt
        const segNeigungRaw = t?.neigung;
        const segNeigungNum = Number.isFinite(parseFloat(segNeigungRaw)) ? parseFloat(segNeigungRaw) : null;
        // Für Glas und EPDM im Carport-Modus Neigung hart auf 0 setzen
        if("glas"===n.dachTyp || "epdm"===n.dachTyp){
            n.neigung = 0;
        }
        console.log("[RENDER] erzeugeSegmentKonfiguration", {
            originalNeigung: e.neigung,
            originalDachTyp: e.dachTyp,
            segmentInput: { id: t?.id, neigung: t?.neigung, dachTyp: t?.dachTyp },
            resultNeigung: n.neigung,
            resultDachTyp: n.dachTyp
        });
        const i=r=>r&&Object.keys(r).length>0;
        const o=(e,r)=>{
            if(!n[e])n[e]={};
            if(i(r)){
                n[e]={
                    ...n[e],
                    individuell:{
                        ...r
                    }
                }
            }
            else n[e]&&n[e].individuell&&delete n[e].individuell
        };
        o("pfostenVersaetze", t.pfostenVersaetze),
        o("pfostenKuerzung", t.pfostenKuerzung),
        o("pfostenAktiv", t.pfostenAktiv);
        return n
    }
    aktualisierePergola(e){
        if(this.pergola)try{
            this.pergola.aktualisiereKonfigurationen(e),
            this.erstellePergolaStruktur(),
            this.bemassung&&this.bemassung.erstelleBemassung(this.pergola.gibKonfiguration())
        }
        catch(e){
            console.error("Fehler beim Aktualisieren der Pergola:", e)
        }
        else console.warn("Keine Pergola-Instanz vorhanden")
    }
    aufFensterGroesseAendern(){
        const e=this.canvas.clientWidth,
        t=this.canvas.clientHeight;
        this.camera.aspect=e/t,
        this.camera.updateProjectionMatrix(),
        this.pergola&&this.pergola.gib3DGruppe()?this.setzeKameraStandardAnsicht(this.pergola.gib3DGruppe()):this.positioniereKamera(),
        this.renderer.setSize(e, t),
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const i=this.renderer.getPixelRatio();
        this.composer&&(this.composer.setSize(e, t), this.composer.setPixelRatio(i)),
        this.bloomPass&&this.bloomPass.setSize(e, t),
        this.bokehPass&&this.bokehPass.setSize(e, t),
        this.aktualisiereFXAAAufloesung(e, t, i)
    }
    initEventListener(){
        window.addEventListener("resize", ()=>this.aufFensterGroesseAendern()),
        document.addEventListener("pergolaStrukturAktualisiert", e=>{
            console.log("📡 Pergola-Update empfangen:", e.detail), this.aktualisierBemassung()
        }),
        this.canvas.addEventListener("click", e=>this.handleCanvasClick(e))
    }
    handleCanvasClick(e){
        if(!this.pergola)return;
        const cfg=this.pergola.gibKonfiguration?.();
        if(!cfg?.carportModus)return;
        const rect=this.canvas.getBoundingClientRect();
        this.pointer.x=2*(e.clientX-rect.left)/rect.width-1,
        this.pointer.y=1-2*(e.clientY-rect.top)/rect.height,
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects=this.raycaster.intersectObjects(this.scene.children, !0);
        const hit=intersects.find(i=>{
            let o=i.object;
            while(o){
                if("string"==typeof o.name&&o.name.startsWith("CarportSegment_"))return!0;
                o=o.parent
            }
            return!1
        });
        if(hit){
            let o=hit.object;
            while(o){
                if("string"==typeof o.name&&o.name.startsWith("CarportSegment_")){
                    const match=o.name.match(/CarportSegment_(\d+)/);
                    const segmentId=match?parseInt(match[1],10):null;
                    segmentId&&document.dispatchEvent(new CustomEvent("carportSegmentSelected",{detail:{segmentId}}));
                    break
                }
                o=o.parent
            }
        }
    }
    gibPergola(){
        return this.pergola
    }
    gibSzene(){
        return this.scene
    }
    gibRenderer(){
        return this.renderer
    }
    debugRenderEngine(){
        console.group("🎬 RENDER-ENGINE DEBUG"),
        console.log("Initialisiert:", this.istInitialisiert),
        console.log("Szenen-Objekte:", this.scene.children.length),
        console.log("Kamera-Position:", this.camera.position),
        console.log("Renderer-Größe:", this.renderer.getSize(new THREE.Vector2)),
        this.pergola&&console.log("Pergola-Status:", this.pergola.berechneStatistiken()),
        console.groupEnd()
    }
    aktualisiereKoordinatenAnzeige(){
        if(this.pergola&&this.koordinatenAnzeige){
            const e=this.pergola.gibKoordinatenSystem(),
            t={
                pfostenOberkanten:e.gibReferenzpunkt("pfostenOberkanten")||{},
                quertraegerPositionen:e.gibReferenzpunkt("quertraegerReferenz")||[],
                laengstraeger:{},
                statistiken:this.pergola.berechneStatistiken()
            };
            this.koordinatenAnzeige.zeigeKoordinaten(t)
        }
    }
    toggleKoordinatenAnzeige(){
        return!!this.koordinatenAnzeige&&this.koordinatenAnzeige.toggleSichtbarkeit()
    }
    setzeKoordinatenSichtbarkeit(e){
        this.koordinatenAnzeige&&this.koordinatenAnzeige.setzeSichtbarkeit(e)
    }
    gibKoordinatenAnzeige(){
        return this.koordinatenAnzeige
    }
    registriereOverlayUpdater(e){
        if("function"!=typeof e)return()=>{};
        return this.overlayUpdaters.push(e),
        ()=>{
            this.overlayUpdaters=this.overlayUpdaters.filter(t=>t!==e)
        }
    }
    dispose(){
        this.stoppeAnimation(),
        window.removeEventListener("resize", this.aufFensterGroesseAendern),
        this.koordinatenAnzeige&&this.koordinatenAnzeige.dispose(),
        this.pergola&&this.pergola.dispose(),
        this.bokehPass&&this.bokehPass.dispose&&this.bokehPass.dispose(),
        this.bloomPass&&this.bloomPass.dispose&&this.bloomPass.dispose(),
        this.composer&&this.composer.dispose&&this.composer.dispose(),
        this.scene.traverse(e=>{
            e.geometry&&e.geometry.dispose(), e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())
        }),
        this.renderer.dispose()
    }
    toggleBemassung(){
        if(!this.bemassung)return;
        const e=!this.bemassung.istBemassungSichtbar();
        return this.bemassung.setzeVisibility(e),
        e&&this.bemassung.erstelleBemassung(this.pergola.gibKonfiguration()),
        e
    }
    istBemassungAktiv(){
        return!!this.bemassung&&this.bemassung.istBemassungSichtbar()
    }
    aktualisierBemassung(){
        this.bemassung&&this.bemassung.istBemassungSichtbar()&&this.bemassung.aktualisieren(this.pergola.gibKonfiguration())
    }
}
