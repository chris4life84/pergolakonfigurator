export class KoordinatenAnzeige{
    constructor(){
        this.anzeigeGruppe=new THREE.Group,
        this.anzeigeGruppe.name="KoordinatenAnzeige",
        this.istSichtbar=!1, // standardmäßig ausblenden
        this.referenzpunkte=[],
        console.log("🎯 KoordinatenAnzeige-Modul initialisiert")
    }
    initialisieren(e){
        e.add(this.anzeigeGruppe),
        this.anzeigeGruppe.visible=this.istSichtbar,
        console.log("🎯 KoordinatenAnzeige zur Szene hinzugefügt")
    }
    zeigeKoordinaten(e){
        if(console.log("🎯 Erstelle 3D-Koordinaten-Anzeige..."), this.entferneAlleReferenzpunkte(), e){
            if(e.statistiken&&e.statistiken.grundmasse){
                const t=e.statistiken.grundmasse,
                i=t.breite||4,
                n=t.tiefe||3;
                this.erstelleBodenLabel({
                    x:.5, y:.01, z:-.3
                }, "X", .2),
                this.erstelleBodenLabel({
                    x:-.3, y:.01, z:.5
                }, "Z", .2),
                this.erstelleBodenLabel({
                    x:-.3, y:.5, z:-.3
                }, "Y", .2),
                this.erstelleBodenLabel({
                    x:i/2, y:.01, z:-.5
                }, "vorne", .15),
                this.erstelleBodenLabel({
                    x:i/2, y:.01, z:n+.5
                }, "hinten", .15),
                this.erstelleBodenLabel({
                    x:-.5, y:.01, z:n/2
                }, "links", .15),
                this.erstelleBodenLabel({
                    x:i+.5, y:.01, z:n/2
                }, "rechts", .15)
            }
            console.log("🎯 Bodenbeschriftungen erstellt")
        }
        else console.warn("Keine Koordinaten-Daten verfügbar")
    }
    erstelleBodenLabel(e, t, i=.15){
        const n=document.createElement("canvas"),
        r=n.getContext("2d");
        n.width=256,
        n.height=128,
        r.font="bold 32px Arial",
        r.fillStyle="rgba(255, 255, 255, 0.6)",
        r.strokeStyle="rgba(0, 0, 0, 0.3)",
        r.lineWidth=2,
        r.textAlign="center",
        r.textBaseline="middle",
        r.strokeText(t, 128, 64),
        r.fillText(t, 128, 64);
        const s=new THREE.CanvasTexture(n),
        a=new THREE.SpriteMaterial({
            map:s, transparent:!0, opacity:.7, depthTest:!1
        }),
        o=new THREE.Sprite(a);
        o.position.set(e.x, e.y, e.z),
        o.scale.set(2*i, i, 1),
        o.name=`BodenLabel_${t}`,
        this.anzeigeGruppe.add(o),
        this.referenzpunkte.push({
            name:t, typ:"bodenlabel", position:{
                ...e
            }, gruppe:o
        })
    }
    entferneAlleReferenzpunkte(){
        for(this.referenzpunkte.forEach(e=>{
            e.gruppe.traverse?e.gruppe.traverse(e=>{
                e.geometry&&e.geometry.dispose(), e.material&&(e.material.map&&e.material.map.dispose(), Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())
            }):e.gruppe.material&&(e.gruppe.material.map&&e.gruppe.material.map.dispose(), e.gruppe.material.dispose())
        });
        this.anzeigeGruppe.children.length>0;)this.anzeigeGruppe.remove(this.anzeigeGruppe.children[0]);
        this.referenzpunkte=[]
    }
    toggleSichtbarkeit(){
        return this.istSichtbar=!this.istSichtbar,
        this.anzeigeGruppe.visible=this.istSichtbar,
        console.log("🎯 Koordinaten-Anzeige "+(this.istSichtbar?"aktiviert":"deaktiviert")),
        this.istSichtbar
    }
    setzeSichtbarkeit(e){
        this.istSichtbar=e,
        this.anzeigeGruppe.visible=e
    }
    gibReferenzpunkteNachTyp(e){
        return this.referenzpunkte.filter(t=>t.typ===e)
    }
    dispose(){
        this.entferneAlleReferenzpunkte()
    }
    debug(){
        console.group("🎯 KOORDINATEN-ANZEIGE DEBUG"),
        console.log("Sichtbar:", this.istSichtbar),
        console.log("Anzahl Referenzpunkte:", this.referenzpunkte.length),
        console.log("Referenzpunkte:", this.referenzpunkte.map(e=>({
            name:e.name, typ:e.typ, position:e.position
        }))),
        console.groupEnd()
    }
}
