export class HDRILoader{
    constructor(){
        this.loader=null,
        this.pmremGenerator=null,
        console.log("🎨 HDRI Loader initialisiert")
    }
    initialisieren(e){
        if(!window.THREE||!window.THREE.EXRLoader)throw console.error("❌ THREE.EXRLoader nicht verfügbar. Bitte EXRLoader.js einbinden!"),
        new Error("EXRLoader nicht verfügbar");
        this.loader=new THREE.EXRLoader,
        this.pmremGenerator=new THREE.PMREMGenerator(e),
        this.pmremGenerator.compileEquirectangularShader(),
        console.log("✅ EXR Loader bereit")
    }
    ladeHDRI(e){
        return new Promise((r, o)=>{
            this.loader?(console.log("🔄 Lade HDRI:", e), this.loader.load(e, e=>{
                console.log("✅ HDRI geladen");
                const o=this.pmremGenerator.fromEquirectangular(e).texture;
                e.dispose(), console.log("✅ Environment Map erstellt"), r(o)
            }, e=>{
                const r=(e.loaded/e.total*100).toFixed(1);
                console.log(`⏳ HDRI Ladefortschritt: ${r}%`)
            }, e=>{
                console.error("❌ Fehler beim Laden der HDRI:", e), o(e)
            })):o(new Error("Loader nicht initialisiert. Bitte initialisieren() aufrufen."))
        })
    }
    dispose(){
        this.pmremGenerator&&(this.pmremGenerator.dispose(), this.pmremGenerator=null),
        this.loader=null
    }
}