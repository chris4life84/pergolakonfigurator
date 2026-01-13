import{
    RenderEngine
}
from"./src/core/RenderEngine.js";
import{
    PergolaKonfiguration
}
from"./src/config/PergolaKonfiguration.js";
import{
    UIController
}
from"./src/ui/UIController.js";
import{
    StaticsCheck
}
from"./src/core/StaticsCheck.js";
import{
    initializeTerraceTextureControls,
    initializeOutdoorFurnitureControls
}
from"./src/ui/TerraceAndFurnitureControls.js";

// StaticsCheck global verfügbar machen für Carport-Segment-Checks
window.StaticsCheck = StaticsCheck;

class PergolaKonfigurator{
    constructor(){
        this.renderEngine=null,
        this.konfiguration=null,
        this.uiController=null,
        this.istInitialisiert=!1,
        console.log("🏗️ Pergola Konfigurator gestartet (Neue Architektur)")
    }
    async initialisieren(){
        try{
            console.group("🚀 INITIALISIERE PERGOLA KONFIGURATOR"),
            await this.warteDOMBereit(),
            console.log("🎬 Initialisiere Render-Engine..."),
            this.renderEngine=new RenderEngine("pergola-canvas"),
            await this.renderEngine.initialisieren(),
            console.log("🎨 Initialisiere UI-Controller..."),
            this.uiController=new UIController(this.renderEngine),
            window.uiController=this.uiController,
            this.uiController.initialisieren(),
            this.konfiguration=this.renderEngine.gibPergola().gibKonfiguration(),
            this.initEventSystem(),
            // Initialisiere neue UI-Controls
            setTimeout(() => {
                initializeTerraceTextureControls();
                initializeOutdoorFurnitureControls();
            }, 500),
            this.istInitialisiert=!0,
            console.log("✅ Pergola Konfigurator erfolgreich initialisiert"),
            this.istDebugModus()&&this.debugKonfigurator()
        }
        catch(e){
            console.error("❌ Fehler bei der Initialisierung:", e),
            this.zeigeFehlermeldung("Initialisierung fehlgeschlagen", e.message)
        }
        console.groupEnd()
    }
    warteDOMBereit(){
        return new Promise(e=>{
            "loading"===document.readyState?document.addEventListener("DOMContentLoaded", e):e()
        })
    }
    initUIIntegration(){
        console.log("🎨 UI-Integration: Verwende Übergangs-Setup..."),
        window.ConfigPanel&&(console.log("🔧 Integriere altes ConfigPanel..."), this.integriereAltesConfigPanel()),
        window.MaterialList&&(console.log("📋 Integriere alte MaterialList..."), this.integriereAlteMaterialList())
    }
    integriereAltesConfigPanel(){
        try{
            const e=new window.ConfigPanel(this.renderEngine);
            document.addEventListener("pergolaKonfigurationGeaendert", e=>{
                this.renderEngine&&this.renderEngine.gibPergola()&&console.log("🔄 Konfiguration geändert:", e.detail)
            }),
            this.uiElemente.konfigurationspanel=e
        }
        catch(e){
            console.warn("Altes ConfigPanel konnte nicht integriert werden:", e)
        }
    }
    integriereAlteMaterialList(){
        try{
            const e=new window.MaterialList;
            document.addEventListener("pergolaStrukturAktualisiert", n=>{
                if(e&&e.updateMaterials){
                    const i=n.detail.pergola;
                    i.gibKonfiguration();
                    e.updateMaterials(this.berechneNeueMateriealien(i))
                }
            }),
            this.uiElemente.materialliste=e
        }
        catch(e){
            console.warn("Alte MaterialList konnte nicht integriert werden:", e)
        }
    }
    berechneNeueMateriealien(e){
        const n=e.gibKonfiguration(),
        i=e.berechneStatistiken(),
        r=e.gibKomponente("pfosten").gibAllePfosten(),
        t=e.gibKomponente("laengstraeger").gibAlleLaengstraeger(),
        o=e.gibKomponente("quertraeger").gibAlleQuertraeger();
        return{
            pfosten:{
                anzahl:r.length,
                einzelhoehe:r[0]?.abmessungen?.hoehe||0,
                gesamtlaenge:r.reduce((e, n)=>e+n.abmessungen.hoehe, 0),
                profil:"100x100mm Aluprofil"
            },
            laengstraeger:{
                anzahl:t.length,
                einzellaenge:t[0]?.abmessungen?.laenge||0,
                gesamtlaenge:t.reduce((e, n)=>e+n.abmessungen.laenge, 0),
                profil:"160x80mm Aluprofil"
            },
            quertraeger:{
                anzahl:o.length,
                einzellaenge:o[0]?.abmessungen?.laenge||0,
                gesamtlaenge:o.reduce((e, n)=>e+n.abmessungen.laenge, 0),
                profil:"80x160mm Aluprofil"
            },
            konfiguration:n,
            statistiken:i
        }
    }
    initEventSystem(){
        document.addEventListener("keydown", e=>{
            if(e.ctrlKey||e.metaKey)switch(e.key){
                case"d":e.preventDefault(), this.toggleDebugModus();
                break;
                case"r":e.preventDefault(), this.neuErstellen()
            }
        }),
        window.addEventListener("resize", ()=>{
            this.renderEngine&&this.renderEngine.aufFensterGroesseAendern()
        }),
        this.registriereConsoleBefehle()
    }
    registriereConsoleBefehle(){
        window.PergolaKonfigurator=this,
        window.debugPergola=()=>{
            this.renderEngine&&this.renderEngine.gibPergola()&&this.renderEngine.gibPergola().debugPergola()
        },
        window.debugRenderEngine=()=>{
            this.renderEngine&&this.renderEngine.debugRenderEngine()
        },
        window.neuerstellen=()=>{
            this.neuErstellen()
        },
        console.log("🔧 Console-Befehle registriert: debugPergola(), debugRenderEngine(), neuerstellen()")
    }
    neuErstellen(){
        if(this.renderEngine&&this.renderEngine.gibPergola()){
            console.log("🔄 Erstelle Pergola neu...");
            this.renderEngine.gibPergola().erstellePergola()
        }
    }
    toggleDebugModus(){
        const e=!("true"===localStorage.getItem("pergolaDebug"));
        localStorage.setItem("pergolaDebug", e.toString()),
        console.log("🔍 Debug-Modus "+(e?"aktiviert":"deaktiviert")),
        e&&this.renderEngine&&this.renderEngine.gibPergola()&&this.renderEngine.gibPergola().debugPergola()
    }
    istDebugModus(){
        return"true"===localStorage.getItem("pergolaDebug")||"1"===new URLSearchParams(window.location.search).get("debug")
    }
    debugKonfigurator(){
        console.group("🔍 PERGOLA KONFIGURATOR DEBUG"),
        console.log("Initialisiert:", this.istInitialisiert),
        console.log("Render-Engine:", !!this.renderEngine),
        console.log("UI-Elemente:", this.uiElemente),
        this.renderEngine&&this.renderEngine.debugRenderEngine(),
        console.groupEnd()
    }
    zeigeFehlermeldung(e, n){
        console.error(`❌ ${e}: ${n}`);
        const i=document.getElementById("error-container");
        i&&(i.innerHTML=`\n                <div class="error-message">\n                    <h3>${e}</h3>\n                    <p>${n}</p>\n                </div>\n            `, i.style.display="block")
    }
    dispose(){
        this.renderEngine&&this.renderEngine.dispose(),
        document.removeEventListener("keydown", this.initEventSystem),
        window.removeEventListener("resize", this.initEventSystem),
        console.log("🧹 Pergola Konfigurator beendet")
    }
}

function ermittleShareId(){
    const params=new URLSearchParams(window.location.search);
    const fromQuery=params.get("share");
    if(fromQuery)return fromQuery;
    const pathMatch=window.location.pathname.match(/\/s\/([^/]+)\.json$/i);
    return pathMatch?pathMatch[1]:null
}

async function ladeGeteilteKonfiguration(konfigurator){
    const shareId=ermittleShareId();
    if(!shareId||!konfigurator?.uiController)return;
    const params=new URLSearchParams(window.location.search);
    const targetIntern=params.get("target")==="intern"||/\/intern\//.test(window.location.pathname);
    try{
        const baseDir=targetIntern?"./intern/":"./s/";
        const shareUrl=new URL(`${baseDir}${encodeURIComponent(shareId)}.json`, window.location.href).toString();
        console.log("🔗 Lade geteilte Konfiguration:", shareUrl);
        const response=await fetch(shareUrl, {cache:"no-store"});
        if(!response.ok)throw new Error(`Snapshot ${shareId} nicht gefunden (HTTP ${response.status})`);
        const snapshot=await response.json();
        const cfg=snapshot?.originalConfig||snapshot?.details||snapshot?.config;
        if(!cfg){
            console.warn("⚠️ Snapshot enthält keine rekonstruierbare Konfiguration");
            return;
        }
        konfigurator.uiController.ladeExterneKonfiguration(cfg);
        console.log("✅ Snapshot angewendet:", shareId);
        if(snapshot?.share?.viewUrl){
            console.log("🔗 Link:", snapshot.share.viewUrl);
        }
    }catch(err){
        console.warn("⚠️ Geteilte Konfiguration konnte nicht geladen werden:", err);
    }
}

async function starteAnwendung(){
    try{
        console.log("🚀 Starte Pergola Konfigurator (Neue Architektur)...");
        const e=new PergolaKonfigurator;
        await e.initialisieren(),
        window.konfigurator=e,
        await ladeGeteilteKonfiguration(e),
        console.log("✅ Anwendung erfolgreich gestartet"),
        console.log("💡 Debug-Modus: Strg+D | Neu erstellen: Strg+R")
    }
    catch(e){
        console.error("❌ Fehler beim Starten der Anwendung:", e)
    }
}
"loading"===document.readyState?document.addEventListener("DOMContentLoaded", starteAnwendung):starteAnwendung();
export{
    PergolaKonfigurator
};
