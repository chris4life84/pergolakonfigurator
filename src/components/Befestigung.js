export class Befestigung{
    constructor(e, n, t){
        this.koordinatenSystem=e,
        this.konfiguration=n,
        this.pfosten=t,
        this.befestigungGruppe=new THREE.Group,
        this.befestigungGruppe.name="Befestigung",
        this.befestigungsKonfiguration={
            ankerplatte:{
                breite:.25,
                hoehe:.02,
                tiefe:.25,
                offset:.05
            },
            betonblock:{
                breiteExtra:.05,
                hoehe:1,
                tiefeExtra:.05,
                offset:-.02
            }
        },
        this.materialien={},
        this.befestigungsElemente=[]
    }
    normalisierePfostenId(e){
        return"string"!=typeof e?"":e.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_").toLowerCase()
    }
    erstelleBefestigung(){
        console.group("🔧 ERSTELLE BEFESTIGUNG"),
        console.log("🔍 DEBUG: Befestigung wird erstellt...");
        try{
            this.entferneBefestigung();
            const e=this.konfiguration.gibAktuelleKonfiguration();
            console.log("🔍 DEBUG: Befestigungs-Konfiguration:", e.befestigung),
            this.erstelleMaterialien(e);
            const n=this.pfosten.gibAllePfosten();
            if(console.log("🔍 DEBUG: Gefundene Pfosten:", n.length), 0===n.length)return console.warn("Keine Pfosten gefunden - keine Befestigung erstellt"),
            this.befestigungGruppe;
            n.forEach((e, n)=>{
                console.log(`🔍 DEBUG: Pfosten ${n+1}:`, {
                    position:e.position, abmessungen:e.abmessungen, name:e.name
                })
            }),
            "ankerplatte"===e.befestigung?(console.log("🔍 DEBUG: Erstelle Ankerplatten..."), this.erstelleAnkerplatten(n)):"einbetonieren"===e.befestigung&&(console.log("🔍 DEBUG: Erstelle Betonblöcke..."), this.erstelleBetonbloecke(n, e)),
            console.log(`✅ ${this.befestigungsElemente.length} Befestigungselemente erstellt (${e.befestigung})`)
        }
        catch(e){
            console.error("❌ Fehler beim Erstellen der Befestigung:", e)
        }
        return console.groupEnd(),
        this.befestigungGruppe
    }
    erstelleMaterialien(e){
        const n=this.gibPergolaFarbe(e.farbe);
        this.materialien.ankerplatte=new THREE.MeshStandardMaterial({
            color:new THREE.Color(n), roughness:.4, metalness:.3, envMapIntensity:.6
        }),
        this.materialien.beton=new THREE.MeshStandardMaterial({
            color:new THREE.Color("#555555"),  // Sattes Betongrau
            roughness:.8,
            metalness:.03,
            envMapIntensity:.25
        }),
        Object.values(this.materialien).forEach(e=>{
            e.receiveShadow=!0, e.castShadow=!0
        })
    }
    gibPergolaFarbe(e){
        return{
            ral7016:3685954,
            ral9016:16185078,
            ral6005:3097912,
            ral3004:7673118,
            "ncs-s0500-n":14672353,
            "ncs-s2005-g":11450034,
            "ncs-s3020-b":3822695,
            "ncs-s2050-y80r":10765099,
            "ncs-s3060-g10y":2777141,
            "ncs-s8500-n":1710618
        }
        [e]||3685954
    }
    berechneKuerzungFuerPfosten(e, n, t=null){
        if(!n?.pfostenKuerzung)return 0;
        const s=this.normalisierePfostenId(e),
        i="string"==typeof s?s:"",
        o=n.pfostenKuerzung.individuell||{};
        if(void 0!==o[i])return Number(o[i])||0;
        if(e!==i&&void 0!==o[e])return Number(o[e])||0;
        const r=Number(n.pfostenKuerzung.vorne)||0,
        l=Number(n.pfostenKuerzung.hinten)||0,
        g=Number(n.pfostenKuerzung.mitte)||0;
        if(i.includes("mitte")||i.includes("zwischen"))return g;
        if(i.includes("vorne")||i.includes("front"))return r;
        if(i.includes("hinten")||i.includes("rear"))return l;
        const a=t?.z,
        u=parseFloat(String(n.tiefe??0).toString().replace(",", "."))||0;
        if("number"==typeof a&&u>0){
            return r+(l-r)*Math.min(Math.max(a/u, 0), 1)
        }
        return g
    }
    erstelleAnkerplatten(e){
        const n=this.befestigungsKonfiguration.ankerplatte;
        this.konfiguration.gibAktuelleKonfiguration();
        console.log(`🔧 DEBUG: erstelleAnkerplatten() aufgerufen mit ${e.length} Pfosten`),
        console.log(`🔧 DEBUG: Aktuelle befestigungGruppe.children.length = ${this.befestigungGruppe.children.length}`),
        e.forEach((e, t)=>{
            const s=e.positionen?.boden, i=e.positionen?.angepassteBoden;
            if(!i&&!s)return void console.warn(`Pfosten ${t+1} hat keine Position - überspringe Ankerplatte`);
            const o=e.name||`pfosten_${t+1}`;
            console.log(`🔍 DEBUG: Erstelle Ankerplatte für Pfosten ${o}`, {
                bodenOriginal:s, bodenAngepasst:i
            });
            const r=new THREE.BoxGeometry(n.breite, n.hoehe, n.tiefe), l=new THREE.Mesh(r, this.materialien.ankerplatte), g=(i?.y||s.y)-.01;
            l.position.set(i?.x||s.x, g, i?.z||s.z), l.name=`Ankerplatte_${o}`, this.befestigungGruppe.add(l), this.befestigungsElemente.push(l), console.log(`✅ Ankerplatte ${l.name} erstellt an Y-Position:`, l.position.y, `(PfostenY: ${i?.y||s.y})`), this.erstelleBefestigungsschrauben(l, i||s)
        })
    }
    erstelleBefestigungsschrauben(e, n){
        const t=new THREE.MeshStandardMaterial({
            color:new THREE.Color(2894892), roughness:.4, metalness:.3
        }),
        s=new THREE.CylinderGeometry(.005, .005, .008, 8);
        [{
            x:-.08,
            z:-.08
        },
        {
            x:.08,
            z:-.08
        },
        {
            x:-.08,
            z:.08
        },
        {
            x:.08,
            z:.08
        }
        ].forEach((i, o)=>{
            const r=new THREE.Mesh(s, t), l=e.position.y+.01+.004;
            r.position.set(n.x+i.x, l, n.z+i.z), r.name=`Schraube_${e.name}_${o+1}`, this.befestigungGruppe.add(r), this.befestigungsElemente.push(r), console.log(`✅ Schraube ${r.name} erstellt an Position:`, r.position)
        })
    }
    erstelleBetonbloecke(e, n){
        const t=this.befestigungsKonfiguration.betonblock;
        e.forEach((e, n)=>{
            const s=e.positionen?.boden||e.positionen?.mittelpunkt, i=e.abmessungen;
            if(!s||!i)return void console.warn(`Pfosten ${n+1} hat keine Position/Abmessungen - überspringe Betonblock`);
            console.log(`🔍 DEBUG: Erstelle Betonblock für Pfosten ${n+1}:`, {
                position:s, abmessungen:i
            });
            const o=i.breite+2*t.breiteExtra, r=i.tiefe+2*t.tiefeExtra, l=new THREE.BoxGeometry(o, t.hoehe, r), g=new THREE.Mesh(l, this.materialien.beton);
            g.position.set(s.x, t.offset-t.hoehe/2, s.z), g.name=`Betonblock_${n+1}`, this.befestigungGruppe.add(g), this.befestigungsElemente.push(g), console.log(`✅ Betonblock ${g.name} erstellt:`, {
                position:g.position, dimensionen:{
                    breite:o, hoehe:t.hoehe, tiefe:r
                }
            })
        })
    }
    entferneBefestigung(){
        for(console.log(`🗑️ DEBUG: entferneBefestigung() aufgerufen - ${this.befestigungGruppe.children.length} Children zu löschen`);
        this.befestigungGruppe.children.length>0;){
            const e=this.befestigungGruppe.children[0];
            console.log(`🗑️ DEBUG: Lösche Child: ${e.name}`),
            this.befestigungGruppe.remove(e),
            e.geometry&&e.geometry.dispose(),
            e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())
        }
        this.befestigungsElemente=[],
        console.log("🗑️ DEBUG: entferneBefestigung() abgeschlossen")
    }
    gibAlleBefestigungsElemente(){
        return[...this.befestigungsElemente]
    }
    gib3DGruppe(){
        return this.befestigungGruppe
    }
    debugBefestigung(){
        console.group("🔧 BEFESTIGUNG DEBUG"),
        console.log("Anzahl Elemente:", this.befestigungsElemente.length),
        console.log("Materialien:", Object.keys(this.materialien)),
        console.log("Konfiguration:", this.befestigungsKonfiguration),
        console.groupEnd()
    }
    dispose(){
        this.entferneBefestigung(),
        Object.values(this.materialien).forEach(e=>{
            e.dispose()
        }),
        this.materialien={}
    }
}