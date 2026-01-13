export class Bemassung{
    constructor(){
        this.gruppe=new THREE.Group,
        this.gruppe.name="Bemaßung",
        this.istSichtbar=!1,
        this.styles={
            linienfarbe:16711680,
            textfarbe:"#000000",
            linienbreite:2,
            pfeilgroesse:.08,
            textgroesse:.15,
            abstand:.3
        }
    }
    erstelleBemassung(e){
        this.entferneAlleBemassung();
        const t=e.breite,
        s=e.tiefe,
        i=e.hoehe;
        e.typ;
        this.erstelleBreitenBemassung(t, s, i),
        this.erstelleTiefenBemassung(t, s, i),
        this.erstelleHoehenBemassung(t, s, i),
        this.erstellePfostenHoehenBemassung(e),
        console.log("✅ Bemaßungen erstellt")
    }
    erstelleBreitenBemassung(e, t, s){
        const i=this.styles.abstand,
        n=-i,
        l=-i,
        r=new THREE.Vector3(0, n, l),
        o=new THREE.Vector3(e, n, l);
        this.erstelleMasslinie(r, o, `${e.toFixed(2)}m`, "horizontal")
    }
    erstelleTiefenBemassung(e, t, s){
        const i=this.styles.abstand,
        n=-i,
        l=-i,
        r=new THREE.Vector3(n, l, 0),
        o=new THREE.Vector3(n, l, t);
        this.erstelleMasslinie(r, o, `${t.toFixed(2)}m`, "horizontal")
    }
    erstelleHoehenBemassung(e, t, s){
        const i=e+this.styles.abstand,
        n=new THREE.Vector3(i, 0, 0),
        l=new THREE.Vector3(i, s, 0);
        this.erstelleMasslinie(n, l, `${s.toFixed(2)}m`, "vertikal")
    }
    erstellePfostenHoehenBemassung(e){
        const t=e.breite,
        s=e.tiefe,
        i=e.hoehe,
        n=(e.neigung||2)*Math.PI/180,
        l=i+Math.tan(n)*s;
        this.erstellePfostenHoeheMasslinie(t, s, l, "Hinten", .2, -.2)
    }
    erstellePfostenAbstaende(e){
        const t=e.breite,
        s=(e.tiefe, [0]);
        if(t>4){
            const e=Math.ceil(t/2),
            i=t/e;
            for(let t=1;
            t<e;
            t++)s.push(t*i)
        }
        if(e.zentralerMittelpfosten){
            const e=t/2;
            s.includes(e)||s.push(e)
        }
        s.push(t),
        s.sort((e, t)=>e-t);
        for(let e=0;
        e<s.length-1;
        e++){
            const t=s[e],
            i=s[e+1],
            n=i-t,
            l=new THREE.Vector3(t, .05, .3),
            r=new THREE.Vector3(i, .05, .3);
            this.erstelleMasslinie(l, r, `${n.toFixed(2)}m`, "horizontal", .1)
        }
    }
    erstellePfostenHoeheMasslinie(e, t, s, i, n, l){
        const r=new THREE.Vector3(e+n, 0, t+l),
        o=new THREE.Vector3(e+n, s, t+l);
        this.erstelleMasslinie(r, o, `${s.toFixed(2)}m`, "vertikal", .1)
    }
    erstelleMasslinie(e, t, s, i, n=null){
        const l=new THREE.Group,
        r=new THREE.LineBasicMaterial({
            color:this.styles.linienfarbe, linewidth:this.styles.linienbreite
        }),
        o=(new THREE.BufferGeometry).setFromPoints([e, t]),
        a=new THREE.Line(o, r);
        l.add(a);
        const h=(new THREE.Vector3).subVectors(t, e);
        h.length();
        h.normalize(),
        this.erstelleHilfslinie(e, h, i, l),
        this.erstelleHilfslinie(t, h, i, l),
        this.erstellePfeil(e, h.clone().negate(), l),
        this.erstellePfeil(t, h, l);
        const c=(new THREE.Vector3).addVectors(e, t).multiplyScalar(.5);
        this.erstelleText(c, s, i, n, l),
        this.gruppe.add(l)
    }
    erstelleHilfslinie(e, t, s, i){
        let n;
        n="vertikal"===s?new THREE.Vector3(0, 0, 1):new THREE.Vector3(0, 1, 0);
        const l=e.clone().add(n.clone().multiplyScalar(-.075)),
        r=e.clone().add(n.clone().multiplyScalar(.075)),
        o=(new THREE.BufferGeometry).setFromPoints([l, r]),
        a=new THREE.LineBasicMaterial({
            color:this.styles.linienfarbe, linewidth:1
        }),
        h=new THREE.Line(o, a);
        i.add(h)
    }
    erstellePfeil(e, t, s){
        const i=this.styles.pfeilgroesse,
        n=.4*this.styles.pfeilgroesse,
        l=new THREE.ConeGeometry(n, i, 8),
        r=new THREE.MeshBasicMaterial({
            color:this.styles.linienfarbe, depthTest:!1, depthWrite:!1
        }),
        o=new THREE.Mesh(l, r);
        o.position.copy(e);
        const a=new THREE.Quaternion,
        h=new THREE.Vector3(0, 1, 0);
        a.setFromUnitVectors(h, t),
        o.quaternion.copy(a),
        o.renderOrder=999,
        s.add(o)
    }
    erstelleText(e, t, s, i=null, n){
        const l=i||this.styles.textgroesse,
        r=document.createElement("canvas"),
        o=r.getContext("2d");
        r.width=512,
        r.height=128,
        o.fillStyle="#ffffff",
        o.fillRect(0, 0, r.width, r.height),
        o.font="Bold 60px Arial",
        o.fillStyle=this.styles.textfarbe,
        o.textAlign="center",
        o.textBaseline="middle",
        o.fillText(t, r.width/2, r.height/2);
        const a=new THREE.CanvasTexture(r);
        a.needsUpdate=!0;
        const h=new THREE.SpriteMaterial({
            map:a, transparent:!0, depthTest:!1, depthWrite:!1
        }),
        c=new THREE.Sprite(h);
        c.position.copy(e),
        c.position.y+=.1,
        c.scale.set(4*l, l, 1),
        n.add(c)
    }
    entferneAlleBemassung(){
        for(;
        this.gruppe.children.length>0;){
            const e=this.gruppe.children[0];
            e.geometry&&e.geometry.dispose(),
            e.material&&(e.material.map&&e.material.map.dispose(), e.material.dispose()),
            this.gruppe.remove(e)
        }
    }
    setzeVisibility(e){
        this.istSichtbar=e,
        this.gruppe.visible=e,
        console.log("📏 Bemaßung "+(e?"eingeblendet":"ausgeblendet"))
    }
    gibGruppe(){
        return this.gruppe
    }
    istBemassungSichtbar(){
        return this.istSichtbar
    }
    aktualisieren(e){
        this.istSichtbar&&this.erstelleBemassung(e)
    }
    dispose(){
        this.entferneAlleBemassung(),
        console.log("🧹 Bemaßung aufgeräumt")
    }
}