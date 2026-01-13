import{
    ProfileKonfiguration
}
from"../config/ProfileKonfiguration.js";
import{
    MaterialManager
}
from"../core/MaterialManager.js";
export class Kopfbaender{
    constructor(e, n){
        this.koordinatenSystem=e,
        this.konfiguration=n,
        this.profileKonfig=new ProfileKonfiguration,
        this.materialManager=new MaterialManager,
        this.kopfbaenderGruppe=new THREE.Group,
        this.kopfbaenderGruppe.name="Kopfbänder"
    }
    erstelleKopfbaender(){
        this.entferneKopfbaender();
        const e=this.konfiguration.gibAktuelleKonfiguration();
        if(!e.kopfbaenderAktiv)return this.kopfbaenderGruppe;
        console.log("🔺 Erstelle Kopfbänder...");
        try{
            const n=this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen");
            if(!n)return console.warn("⚠️ Keine Pfosten-Positionen verfügbar für Kopfbänder"),
            this.kopfbaenderGruppe;
            const r=this.bestimmeKopfbandProfil(e);
            switch(e.kopfbaenderPosition||"ecken"){
                case"ecken":this.erstelleEckKopfbaender(n, e, r);
                break;
                case"alle":this.erstelleAlleKopfbaender(n, e, r);
                break;
                case"vorne":this.erstelleVordereKopfbaender(n, e, r);
                break;
                case"hinten":this.erstelleHintereKopfbaender(n, e, r)
            }
            console.log(`✅ ${this.kopfbaenderGruppe.children.length} Kopfbänder erstellt`)
        }
        catch(e){
            console.error("❌ Fehler beim Erstellen der Kopfbänder:", e),
            console.error("   Kopfbänder werden übersprungen, Pergola wird ohne Kopfbänder erstellt")
        }
        return this.kopfbaenderGruppe
    }
    erstelleEckKopfbaender(e, n, r){
        console.log("🔺 Erstelle Eck-Kopfbänder..."),
        console.log("   Verfügbare Pfosten-Positionen:", Object.keys(e));
        [{
            pfosten:e.vorne_links,
            richtung:"vorne_links"
        },
        {
            pfosten:e.vorne_rechts,
            richtung:"vorne_rechts"
        },
        {
            pfosten:e.hinten_links,
            richtung:"hinten_links"
        },
        {
            pfosten:e.hinten_rechts,
            richtung:"hinten_rechts"
        }
        ].forEach(e=>{
            e.pfosten?(console.log(`   → Verarbeite Ecke: ${e.richtung}`, e.pfosten), this.erstelleEinzelnesKopfband(e.pfosten, e.richtung, n, r)):console.warn(`   ⚠️ Keine Position für ${e.richtung}`)
        })
    }
    erstelleAlleKopfbaender(e, n, r){
        this.erstelleEckKopfbaender(e, n, r),
        e.mitte&&n.mittelpfostenAktiv&&this.erstelleEinzelnesKopfband(e.mitte, "mitte", n, r)
    }
    erstelleVordereKopfbaender(e, n, r){
        e.vorne_links&&this.erstelleEinzelnesKopfband(e.vorne_links, "vorne_links", n, r),
        e.vorne_rechts&&this.erstelleEinzelnesKopfband(e.vorne_rechts, "vorne_rechts", n, r)
    }
    erstelleHintereKopfbaender(e, n, r){
        e.hinten_links&&this.erstelleEinzelnesKopfband(e.hinten_links, "hinten_links", n, r),
        e.hinten_rechts&&this.erstelleEinzelnesKopfband(e.hinten_rechts, "hinten_rechts", n, r)
    }
    erstelleEinzelnesKopfband(e, n, r, o){
        try{
            if(!e)return void console.warn(`⚠️ Keine Pfosten-Position für ${n}`);
            r.kopfbaenderWinkel,
            Math.PI;
            const t=o?.abmessungen?.breite||.08,
            i=o?.abmessungen?.hoehe||.04,
            s=e.oberkante||e,
            l=e.boden||e,
            a=s.y||e.hoehe||e.y||r.gesamthoehe||2.5,
            f=l.x||e.x||0,
            p=l.z||e.z||0;
            console.log(`🔺 Erstelle Kopfband ${n}: Start bei Pfosten (${f.toFixed(2)}, ${a.toFixed(2)}, ${p.toFixed(2)})`);
            const h=.8;
            let c=f,
            d=p,
            b=a;
            n.includes("links")?c+=h:n.includes("rechts")&&(c-=h),
            n.includes("vorne")?d+=h:n.includes("hinten")&&(d-=h),
            b=a-.4,
            console.log(`   → Ende bei Träger (${c.toFixed(2)}, ${b.toFixed(2)}, ${d.toFixed(2)})`);
            const g=c-f,
            k=b-a,
            u=d-p,
            K=Math.sqrt(g*g+k*k+u*u);
            if(K<.1)return void console.warn(`⚠️ Kopfband ${n} zu kurz (${K.toFixed(2)}m)`);
            const m=new THREE.BoxGeometry(t, i, K),
            x=MaterialManager.gibStrukturMaterial({
                teil:"kopfband", config:r
            }),
            E=new THREE.Mesh(m, x);
            E.position.set((f+c)/2, (a+b)/2, (p+d)/2);
            const P=new THREE.Vector3(g, k, u).normalize(),
            _=new THREE.Vector3(0, 0, 1),
            v=new THREE.Quaternion;
            v.setFromUnitVectors(_, P),
            E.quaternion.copy(v),
            E.name=`Kopfband_${n}`,
            this.kopfbaenderGruppe.add(E);
            const $=Math.abs(180*Math.atan2(k, Math.sqrt(g*g+u*u))/Math.PI);
            console.log(`   ✅ Kopfband ${n} erstellt (Länge: ${K.toFixed(2)}m, Winkel: ${$.toFixed(1)}°)`)
        }
        catch(e){
            console.error(`❌ Fehler beim Erstellen von Kopfband ${n}:`, e)
        }
    }
    bestimmeKopfbandProfil(e){
        const n={
            "200x120x4":"160x80x4",
            "200x100x4":"120x80x4",
            "160x80x4":"120x80x4",
            "120x80x4":"100x60x3"
        }
        [e.pfostenProfil||"160x80x4"]||"120x80x4";
        return this.profileKonfig.gibProfil(n)||this.profileKonfig.gibAktuellesProfil()
    }
    entferneKopfbaender(){
        for(;
        this.kopfbaenderGruppe.children.length>0;){
            const e=this.kopfbaenderGruppe.children[0];
            e.geometry&&e.geometry.dispose(),
            e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose()),
            this.kopfbaenderGruppe.remove(e)
        }
    }
    static gibVerbesserungsFaktor(){
        return 1.3
    }
}