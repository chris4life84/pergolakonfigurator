export class Terrassenplatten{
    constructor(e, t){
        this.koordinatenSystem=e,
        this.konfiguration=t,
        this.terrassenplattenGruppe=new THREE.Group,
        this.terrassenplattenGruppe.name="Terrassenplatten",
        this.plattenKonfiguration={
            groesse:.6,
            dicke:.04,
            "fugenhöhe":.003,
            erweiterungsFaktor:1.5,
            versatz:.1
        },
        this.materialien={},
        this.noiseTexture=null,
        this.platten=[]
    }
    erstelleTerrassenplatten(){
        console.group("🏠 ERSTELLE TERRASSENPLATTEN");
        try{
            this.entfernePlatten();
            const e=this.konfiguration.gibAktuelleKonfiguration(),
            t=(this.konfiguration.berechneAbhaengigeWerte(), this.berechneTerrassenBereich(e));
            this.erstelleMaterialien(),
            this.erstellePlattenGrid(t),
            console.log(`✅ ${this.platten.length} Terrassenplatten erstellt`)
        }
        catch(e){
            console.error("❌ Fehler beim Erstellen der Terrassenplatten:", e)
        }
        return console.groupEnd(),
        this.terrassenplattenGruppe
    }
    berechneTerrassenBereich(e){
        const t=this.plattenKonfiguration.erweiterungsFaktor,
        r=(this.plattenKonfiguration.versatz, e.breite*t),
        a=e.tiefe*t;
        return{
            startX:(e.breite-r)/2,
            startZ:(e.tiefe-a)/2,
            breite:r,
            tiefe:a,
            hoehe:this.plattenKonfiguration.dicke/2,
            pergolaBreite:e.breite,
            pergolaTiefe:e.tiefe
        }
    }
    erstelleMaterialien(){
        console.log("🎨 Erzeuge graue Terrassenplatten mit subtiler Textur...");

        this.noiseTexture=this.erzeugeNoiseTextur(512);
        const hauptFarbe = new THREE.Color("#4a4a4a");  // Sattes Dunkelgrau
        this.materialien.hauptPlatte = new THREE.MeshStandardMaterial({
            color: hauptFarbe,
            roughness: 0.78,
            metalness: 0.01,
            envMapIntensity: 0.1,
            emissive: new THREE.Color("#2a2a2a"),  // Sehr dunkles Emissive
            emissiveIntensity: 0.015,
            map: this.noiseTexture,
            toneMapped: true,
            flatShading: false
        });
        this.materialien.hauptPlatte.receiveShadow = true;
        this.materialien.hauptPlatte.castShadow = true;
        this.materialien.hauptPlattenVarianten = [this.materialien.hauptPlatte];

        console.log("🎨 Platten-Material Farbe:", this.materialien.hauptPlatte.color.getStyle(), "Emissive:", this.materialien.hauptPlatte.emissive.getStyle());

        // Randstein-Material (etwas dunklerer Grauton)
        this.materialien.randstein = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#3f3f3f"),  // Noch dunkler
            roughness: 0.8,
            metalness: 0.01,
            envMapIntensity: 0.08,
            emissive: new THREE.Color("#222222"),
            emissiveIntensity: 0.01,
            map: this.noiseTexture,
            toneMapped: true
        });
        this.materialien.randstein.receiveShadow = true;
        this.materialien.randstein.castShadow = true;
    }
    erzeugeNoiseTextur(size=512){
        const canvas=document.createElement("canvas");
        canvas.width=size;
        canvas.height=size;
        const ctx=canvas.getContext("2d");
        ctx.fillStyle="#bfbfbf";
        ctx.fillRect(0,0,size,size);
        ctx.globalAlpha=0.06;
        ctx.fillStyle="#ffffff";
        for(let x=0;x<size;x++){
            for(let y=0;y<size;y++){
                if(Math.random()<0.12){
                    ctx.fillRect(x,y,1,1);
                }
            }
        }
        ctx.globalAlpha=1;
        const tex=new THREE.CanvasTexture(canvas);
        tex.colorSpace=THREE.SRGBColorSpace;
        tex.wrapS=THREE.RepeatWrapping;
        tex.wrapT=THREE.RepeatWrapping;
        tex.repeat.set(2,2);
        tex.needsUpdate=true;
        return tex;
    }
    erstellePlattenGrid(e){
        const t=this.plattenKonfiguration.groesse,
        r=this.plattenKonfiguration.fugenhöhe,
        a=this.plattenKonfiguration.dicke,
        s=Math.floor(e.breite/(t+r)),
        n=Math.floor(e.tiefe/(t+r)),
        i=s*(t+r)-r,
        l=n*(t+r)-r,
        o=e.startX+(e.breite-i)/2,
        h=e.startZ+(e.tiefe-l)/2,
        p=new THREE.BoxGeometry(t, a, t);
        
        // UV2 für AO Map setzen (kopiere UV1)
        p.setAttribute('uv2', new THREE.BufferAttribute(p.attributes.uv.array, 2));
        
        for(let a=0;
        a<s;
        a++)for(let s=0;
        s<n;
        s++){
            const n=o+a*(t+r)+t/2,
            i=h+s*(t+r)+t/2,
            l=.002*(Math.random()-.5),
            c=new THREE.Mesh(p, this.holePlattenMaterial());
            c.position.set(n, e.hoehe+l, i),
            c.castShadow=!0,
            c.receiveShadow=!0,
            c.name=`Terrassenplatte_${a}_${s}`,
            this.terrassenplattenGruppe.add(c),
            this.platten.push(c)
        }
        console.log(`📐 Grid erstellt: ${s}x${n} = ${s*n} Platten`)
    }
    holePlattenMaterial(){
        if(this.materialien.hauptPlattenVarianten && this.materialien.hauptPlattenVarianten.length>0){
            return this.materialien.hauptPlattenVarianten[0];
        }
        return this.materialien.hauptPlatte || new THREE.MeshStandardMaterial({
            color:new THREE.Color("#f5f5dc"),
            roughness:0.82,
            metalness:0.02
        });
    }
    erstelleRandsteine(e){
        const t=.08,
        r=new THREE.BoxGeometry(.1, .05, t);
        [{
            seite:"vorne",
            start:{
                x:e.startX,
                z:e.startZ-.04
            },
            ende:{
                x:e.startX+e.breite,
                z:e.startZ-.04
            },
            richtung:"x"
        },
        {
            seite:"hinten",
            start:{
                x:e.startX,
                z:e.startZ+e.tiefe+.04
            },
            ende:{
                x:e.startX+e.breite,
                z:e.startZ+e.tiefe+.04
            },
            richtung:"x"
        },
        {
            seite:"links",
            start:{
                x:e.startX-.04,
                z:e.startZ
            },
            ende:{
                x:e.startX-.04,
                z:e.startZ+e.tiefe
            },
            richtung:"z"
        },
        {
            seite:"rechts",
            start:{
                x:e.startX+e.breite+.04,
                z:e.startZ
            },
            ende:{
                x:e.startX+e.breite+.04,
                z:e.startZ+e.tiefe
            },
            richtung:"z"
        }
        ].forEach(t=>{
            this.erstelleRandsteinSeite(t, r, .05, e)
        })
    }
    erstelleRandsteinSeite(e, t, r, a){
        let s=0;
        s="x"===e.richtung?Math.abs(e.ende.x-e.start.x):Math.abs(e.ende.z-e.start.z);
        const n=Math.floor(s/.15),
        i=s/n;
        for(let s=0;
        s<n;
        s++){
            let n,
            l;
            "x"===e.richtung?(n=e.start.x+s*i+i/2, l=e.start.z):(n=e.start.x, l=e.start.z+s*i+i/2);
            const o=new THREE.Mesh(t, this.materialien.randstein);
            o.position.set(n, a.hoehe+r/2, l),
            o.castShadow=!0,
            o.receiveShadow=!0,
            o.name=`Randstein_${e.seite}_${s}`,
            this.terrassenplattenGruppe.add(o),
            this.platten.push(o)
        }
    }
    entfernePlatten(){
        for(;
        this.terrassenplattenGruppe.children.length>0;){
            const e=this.terrassenplattenGruppe.children[0];
            this.terrassenplattenGruppe.remove(e),
            e.geometry&&e.geometry.dispose(),
            e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())
        }
        this.platten=[]
    }
    gibAllePlatten(){
        return[...this.platten]
    }
    gib3DGruppe(){
        return this.terrassenplattenGruppe
    }
    debugTerrassenplatten(){
        console.group("🏠 TERRASSENPLATTEN DEBUG"),
        console.log("Anzahl Platten:", this.platten.length),
        console.log("Konfiguration:", this.plattenKonfiguration),
        console.log("Materialien:", Object.keys(this.materialien)),
        console.groupEnd()
    }
    dispose(){
        this.entfernePlatten(),
        Object.values(this.materialien).forEach(e=>{
            const materialList=Array.isArray(e)?e:[e];
            materialList.forEach(m=>{
                if(!m||typeof m.dispose!=="function") return;
                m.map&&m.map.dispose();
                m.normalMap&&m.normalMap.dispose();
                m.roughnessMap&&m.roughnessMap.dispose();
                m.aoMap&&m.aoMap.dispose();
                m.dispose();
            });
        }),
        this.materialien={}
    }
}
