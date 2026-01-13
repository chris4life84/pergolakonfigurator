import{
    ProfileKonfiguration
}
from"../config/ProfileKonfiguration.js";
import{
    MaterialManager
}
from"../core/MaterialManager.js";
import{
    disposeEdgeHighlights
}
from"../utils/edgeHighlight.js";
import{
    createSmoothBoxGeometry,
    createWedgeGeometry
}
from"../utils/geometry.js";
import StaticsCheck from"../core/StaticsCheck.js";
export class Pfosten{
    constructor(e, t){
        this.koordinatenSystem=e,
        this.konfiguration=t,
        this.profileKonfig=new ProfileKonfiguration,
        this.pfostenListe=[],
        this.pfostenGruppe=new THREE.Group,
        this.pfostenGruppe.name="PfostenGruppe"
    }
    normalisierePfostenId(e){
        return"string"!=typeof e?"":e.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_").toLowerCase()
    }
    ermittleEindeutigePfostenInfos(e, t){
        if(!e||"object"!=typeof e)return[];
        const s=[],
        n=new Set;
        return Object.keys(e).forEach(i=>{
            const r=this.normalisierePfostenId(i);
            if("function"==typeof t&&!t(r, i))return;
            if(!r||n.has(r))return;
            const o=e[r]||e[i];
            o&&(s.push({
                name:r, position:o, rotationY:o.rotationY??e[i]?.rotationY??0
            }), n.add(r))
        }),
        s
    }
    clampVersatzX(e, t){
        return this.normalisierePfostenId(e).includes("mitte")?Math.max(-1.5, Math.min(1.5, t)):Math.max(0, Math.min(1.5, t))
    }
    clampVersatzZ(e){
        return Math.max(-1.5, Math.min(1.5, e))
    }
    ermittlePfostenVersatz(e, t="x"){
        const s=this.konfiguration.gibAktuelleKonfiguration(),
        n=this.normalisierePfostenId(e),
        i=s.pfostenVersaetze?.individuell||{},
        r=(e=>{
            if("number"==typeof e)return{
                achse:"x", wert:Number(e)
            };
            if("object"==typeof e&&null!==e){
                const t="string"==typeof e.achse?e.achse:"string"==typeof e.axis?e.axis:"x", s=Number(e.wert??e.value??0);
                if(Number.isFinite(s))return{
                    achse:t, wert:s
                }
            }
            return null
        })(i[n]??i[e]);
        if(r&&r.achse===t)return"z"===t?this.clampVersatzZ(r.wert):this.clampVersatzX(e, r.wert);
        if("x"===t){
            if(n.startsWith("vorne"))return this.clampVersatzX(e, Number(s.pfostenVersaetze?.vorne||0));
            if(n.startsWith("hinten"))return this.clampVersatzX(e, Number(s.pfostenVersaetze?.hinten||0))
        }
        return 0
    }
    clampTiefe(e, t){
        const s=Number(t?.tiefe)||0;
        return Math.max(0, Math.min(s, e))
    }
    erstellePfosten(){
        this.entfernePfosten();
        const e=this.konfiguration.gibAktuelleKonfiguration(),
        t=this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen");
        return"freistehend"===e.typ?this.erstelleFreistehendenPfosten(t, e):this.erstelleWandanschlussPfosten(t, e),
        this.erstelleZwischenpfostenFallsNoetig(e),
        this.pfostenGruppe
    }
    erstelleZwischenpfostenFallsNoetig(e){
        console.log("🔍 Zwischenpfosten-Prüfung: Manuell gesteuert");
        const t=!0===e.zwischenpfostenBreite,
        s=!0===e.zwischenpfostenTiefe;
        if(console.log("   Zwischenpfosten Breite (Querträger): "+(t?"✅ AKTIV":"⚪ inaktiv")), console.log("   Zwischenpfosten Tiefe (Längsträgern): "+(s?"✅ AKTIV":"⚪ inaktiv")), !t&&!s)return console.log("   ⚠️ Keine Zwischenpfosten aktiviert"),
        void this.erstelleZentralenMittelpfosten(e);
        const n=this.bestimmeZwischenpfostenProfil();
        t&&s?(console.log("   → BEIDE aktiviert → Erstelle komplettes Raster"), this.erstelleZwischenpfostenRaster(e, n)):t?(console.log("   → Breite aktiviert → Zwischenpfosten unter Querträgern"), this.erstelleZwischenpfostenFuerBreite(e, n)):s&&(console.log("   → Tiefe aktiviert → Zwischenpfosten unter Längsträgern"), this.erstelleZwischenpfostenFuerTiefe(e, n)),
        this.erstelleZentralenMittelpfosten(e)
    }
    bestimmeZwischenpfostenProfil(){
        const konfig=this.konfiguration.gibAktuelleKonfiguration(),
        overrideId=konfig?.zwischenpfostenProfil;
        if(overrideId){
            const prof=this.profileKonfig.gibProfil?.(overrideId);
            if(prof?.id){
                return prof.id
            }
        }
        const e=this.profileKonfig.gibMitteltraegerProfil(konfig);
        if(e?.id)return e.id;
        const t=this.profileKonfig.gibAktuellesProfil(),
        s=t?.id;
        return{
            "160x80x4":"100x80x4",
            "200x120x4":"100x80x4"
        }
        [s]||"100x80x4"
    }
    bestimmeRotationFuerZwischenpfosten(e, t, s=0){
        const n=t?.pfostenProfil,
        i=this.profileKonfig.gibAktuellesProfil(),
        r="200x120x4"===(n||i?.id),
        o="string"==typeof e&&(e.includes("mitte")||e.includes("zwischen"));
        if(!r||!o)return s;
        return["vorne",
        "hinten"].some(t=>e.startsWith(t))&&e.includes("mitte")?0:s
    }
    erstelleZwischenpfostenFuerBreite(e, t){
        const s=this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen"),
        n=e.breite/2;
        if(s.vorneLinks&&s.vorneRechts&&this.istPfostenAktiv("vorne_mitte", e)){
            const r=n+this.ermittlePfostenVersatz("vorne_mitte", "x", e),
            i=this.erstelleZwischenpfosten("vorne_mitte", r, this.clampTiefe(s.vorneLinks.boden.z, e), s.vorneLinks, s.vorneRechts, e, t, 0);
            i&&(this.pfostenListe.push(i), this.pfostenGruppe.add(i.mesh), this.fuegeMaueransatzHinzu(i))
        }
        if(s.hintenLinks&&s.hintenRechts&&this.istPfostenAktiv("hinten_mitte", e)){
            const r=n+this.ermittlePfostenVersatz("hinten_mitte", "x", e),
            i=this.erstelleZwischenpfosten("hinten_mitte", r, this.clampTiefe(s.hintenLinks.boden.z, e), s.hintenLinks, s.hintenRechts, e, t, 0);
            i&&(this.pfostenListe.push(i), this.pfostenGruppe.add(i.mesh), this.fuegeMaueransatzHinzu(i))
        }
    }
    erstelleZwischenpfostenFuerTiefe(e, t){
        const s=this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen"),
        n=this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz"),
        i=e.tiefe/2;
        if(s.vorneLinks&&s.hintenLinks&&n?.links&&this.istPfostenAktiv("mitte_links", e)){
            const r=n.links.start.x,
            o=this.erstelleZwischenpfosten("mitte_links", r, this.clampTiefe(i+this.ermittlePfostenVersatz("mitte_links", "z"), e), s.vorneLinks, s.hintenLinks, e, t, Math.PI/2);
            o&&(this.pfostenListe.push(o), this.pfostenGruppe.add(o.mesh), this.fuegeMaueransatzHinzu(o))
        }
        if(s.vorneRechts&&s.hintenRechts&&n?.rechts&&this.istPfostenAktiv("mitte_rechts", e)){
            const r=n.rechts.start.x,
            o=this.erstelleZwischenpfosten("mitte_rechts", r, this.clampTiefe(i+this.ermittlePfostenVersatz("mitte_rechts", "z"), e), s.vorneRechts, s.hintenRechts, e, t, Math.PI/2);
            o&&(this.pfostenListe.push(o), this.pfostenGruppe.add(o.mesh), this.fuegeMaueransatzHinzu(o))
        }
    }
    erstelleZwischenpfostenRaster(e, t){
        const s=this.koordinatenSystem.gibReferenzpunkt("pfostenPositionen"),
        n=e.breite/2,
        i=e.tiefe/2;
        if(this.istPfostenAktiv("mitte_zentral", e)){
            const r=n+this.ermittlePfostenVersatz("mitte_zentral", "x", e),
            o=this.erstelleZwischenpfosten("mitte_zentral", r, this.clampTiefe(i, e), s.vorneLinks, s.hintenRechts, e, t, 0);
            o&&(this.pfostenListe.push(o), this.pfostenGruppe.add(o.mesh), this.fuegeMaueransatzHinzu(o), console.log("   ✅ Zentraler Zwischenpfosten erstellt"))
        }
        if(s.vorneLinks&&s.vorneRechts&&this.istPfostenAktiv("vorne_mitte", e)){
            const r=n+this.ermittlePfostenVersatz("vorne_mitte", "x", e),
            i=this.erstelleZwischenpfosten("vorne_mitte", r, this.clampTiefe(s.vorneLinks.boden.z, e), s.vorneLinks, s.vorneRechts, e, t, 0);
            i&&(this.pfostenListe.push(i), this.pfostenGruppe.add(i.mesh), this.fuegeMaueransatzHinzu(i))
        }
        if(s.hintenLinks&&s.hintenRechts&&this.istPfostenAktiv("hinten_mitte", e)){
            const r=n+this.ermittlePfostenVersatz("hinten_mitte", "x", e),
            i=this.erstelleZwischenpfosten("hinten_mitte", r, this.clampTiefe(s.hintenLinks.boden.z, e), s.hintenLinks, s.hintenRechts, e, t, 0);
            i&&(this.pfostenListe.push(i), this.pfostenGruppe.add(i.mesh), this.fuegeMaueransatzHinzu(i))
        }
        const r=this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz");
        if(s.vorneLinks&&s.hintenLinks&&r?.links&&this.istPfostenAktiv("mitte_links", e)){
            const n=r.links.start.x,
            o=this.erstelleZwischenpfosten("mitte_links", n, this.clampTiefe(i+this.ermittlePfostenVersatz("mitte_links", "z"), e), s.vorneLinks, s.hintenLinks, e, t, Math.PI/2);
            o&&(this.pfostenListe.push(o), this.pfostenGruppe.add(o.mesh), this.fuegeMaueransatzHinzu(o))
        }
        if(s.vorneRechts&&s.hintenRechts&&r?.rechts&&this.istPfostenAktiv("mitte_rechts", e)){
            const n=r.rechts.start.x,
            o=this.erstelleZwischenpfosten("mitte_rechts", n, this.clampTiefe(i+this.ermittlePfostenVersatz("mitte_rechts", "z"), e), s.vorneRechts, s.hintenRechts, e, t, Math.PI/2);
            o&&(this.pfostenListe.push(o), this.pfostenGruppe.add(o.mesh), this.fuegeMaueransatzHinzu(o))
        }
        console.log(`   ✅ Zwischenpfosten-Raster erstellt: ${this.pfostenListe.length} Pfosten gesamt`)
    }
    erstelleZentralenMittelpfosten(e){
        if(!e?.zentralerMittelpfosten)return;
        if("freistehend"!==e.typ)return;
        if(!this.istPfostenAktiv("mitte_zentral", e))return;
        const t=this.konfiguration.berechneAbhaengigeWerte(),
        s=this.ermittlePfostenVersatz("mitte_zentral", "x"),
        n=this.ermittlePfostenVersatz("mitte_zentral", "z"),
        i=this.profileKonfig?.gibAktuellesProfil?.(),
        r=i?.abmessungen?.breite?i.abmessungen.breite/2:0;
        let o=e.breite/2+s;
        o=Math.max(r, Math.min(e.breite-r, o));
        let a=this.clampTiefe(e.tiefe/2+n, e);
        const h=e.tiefe>0?a/e.tiefe:0,
        f=this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz");
        let l,
        u=null;
        if(f){
            const e=[];
            Array.isArray(f.zwischen)&&f.zwischen.forEach(t=>e.push({
                ref:t, typ:"zwischen"
            })),
            f.links&&e.push({
                ref:f.links, typ:"links"
            }),
            f.rechts&&e.push({
                ref:f.rechts, typ:"rechts"
            }),
            u=e.reduce((e, t)=>{
                const s=t.ref;
                if(!s?.start||!s?.ende)return e;
                const n=Math.abs(s.start.x-o);
                return!e||n<e.dist?{
                    dist:n, ref:s, typ:t.typ
                }
                :e
            }, null)
        }
        if(u?.ref?.start&&u.ref.ende){
            const{
                ref:t,
                typ:s
            }
            =u,
            n=t.ende.z-t.start.z,
            i=0!==n?(a-t.start.z)/n:0,
            r=Math.max(0, Math.min(1, i));
            l=t.start.y+(t.ende.y-t.start.y)*r-("epdm"===e.dachTyp&&"zwischen"===s?.02:0)
        }
        else{
            const s="epdm"===e.dachTyp?.02:0;
            l=t.vordereHoehe+t.hoehenDifferenz*h-s
        }
        const p={
            x:o,
            y:0,
            z:a
        },
        c={
            x:o,
            y:l,
            z:a
        },
        m=this.bestimmeRotationFuerZwischenpfosten("mitte_zentral", e, 0),
        konfig=this.konfiguration.gibAktuelleKonfiguration(),
        g=this.profileKonfig.gibMitteltraegerProfil(konfig),
        z=this.erstelleEinzelnenPfosten("mitte_zentral", p, c, e, this.pfostenListe.length, m, g),
        d=this.erstellePfostenKopfKeil(z, u, e);
        d&&(z.mesh.add(d.mesh), z.kopfkeil=d),
        this.pfostenListe.push(z),
        this.pfostenGruppe.add(z.mesh),
        this.fuegeMaueransatzHinzu(z)
    }
    erstelleZwischenpfosten(e, t, s, n, i, r, o, a=0){
        const h=n?.boden?.z??0,
        f=(i?.boden?.z??0)-h;
        let l=0;
        Math.abs(f)>1e-6&&(l=(s-h)/f),
        l=Math.max(0, Math.min(1, l));
        const u=n?.boden?.y??0,
        p=i?.boden?.y??0,
        c=n?.oberkante?.y??0,
        m={
            x:t,
            y:u+(p-u)*l,
            z:s
        },
        g={
            x:t,
            y:c+((i?.oberkante?.y??0)-c)*l,
            z:s
        },
        z=this.bestimmeRotationFuerZwischenpfosten(e, r, a),
        d=this.profileKonfig.gibProfil(o)||this.profileKonfig.gibAktuellesProfil();
        return this.erstelleEinzelnenPfosten(e, m, g, r, 999, z, d)
    }
    fuegeMaueransatzHinzu(e){
        const t=e?.maueransatz?.mesh;
        t&&!this.pfostenGruppe.children.includes(t)&&this.pfostenGruppe.add(t)
    }
    erstellePfostenKopfKeil(e, t, s){
        if(!e||!this.sollPfostenObenAngeschraegt(e?.name))return null;
        const n=e.abmessungen||{},
        i=n.breite||0,
        r=n.tiefe||0;
        if(i<=0||r<=0)return null;
        const o=e.positionen?.oberkante?.y;
        if(!Number.isFinite(o))return null;
        const a=r/2,
        h=e.positionen?.mittelpunkt?.z??0,
        f=this.konfiguration?.berechneAbhaengigeWerte?.(),
        l=s?.tiefe?(f?.hoehenDifferenz||0)/s.tiefe:0,
        u=t?.ref,
        p=t?.typ,
        c=e=>{
            if(u?.start&&u?.ende){
                const t=u.ende.z-u.start.z;
                let n=0!==t?(h+e-u.start.z)/t:0;
                n=Math.max(0, Math.min(1, n));
                return u.start.y+(u.ende.y-u.start.y)*n-("epdm"===s.dachTyp&&"zwischen"===p?.02:0)
            }
            return o+l*e
        },
        m=c(a)-o,
        g=c(-a)-o;
        if(Math.abs(m)<1e-5&&Math.abs(g)<1e-5)return null;
        const z=createWedgeGeometry(i, r, g, m),
        d=new THREE.Mesh(z, e.material);
        return d.position.set(0, n.hoehe/2, 0),
        {
            mesh:d,
            geometrie:z
        }
    }
    sollPfostenObenAngeschraegt(e){
        if("string"!=typeof e)return!1;
        const t=e.toLowerCase();
        return!t.includes("vorne")&&!t.includes("hinten")&&(t.includes("mitte")||t.includes("zwischen"))
    }
    erstelleFreistehendenPfosten(e, t){
        this.ermittleEindeutigePfostenInfos(e, e=>!e.startsWith("wand")).forEach(({
            name:e, position:s, rotationY:n
        }, i)=>{
            if(!s)return;
            if(!this.istPfostenAktiv(e, t))return;
            const r=this.bestimmeRotationFuerZwischenpfosten(e, t, n||0), o=this.erstelleEinzelnenPfosten(e, s.boden, s.oberkante, t, i, r);
            this.pfostenListe.push(o), this.pfostenGruppe.add(o.mesh), this.fuegeMaueransatzHinzu(o)
        })
    }
    erstelleWandanschlussPfosten(e, t){
        this.ermittleEindeutigePfostenInfos(e, e=>e.startsWith("vorne")||e.startsWith("mitte")).forEach(({
            name:e, position:s, rotationY:n
        }, i)=>{
            if(!s)return;
            if(!this.istPfostenAktiv(e, t))return;
            const r=this.bestimmeRotationFuerZwischenpfosten(e, t, n||0), o=this.erstelleEinzelnenPfosten(e, s.boden, s.oberkante, t, i, r);
            this.pfostenListe.push(o), this.pfostenGruppe.add(o.mesh), this.fuegeMaueransatzHinzu(o)
        })
    }
    erstelleEinzelnenPfosten(e, t, s, n, i, r=0, o=null){
        const a=this.berechneKuerzungFuerPfosten(e, n, t),
        h=Math.max(0, a),
        f="ankerplatte"===n?.befestigung?.06:0,
        l="einbetonieren"===n?.befestigung?.7:0,
        u={
            x:t.x,
            y:t.y+h+f-l,
            z:t.z
        },
        p=s.y-u.y,
        c=o||this.profileKonfig.gibAktuellesProfil(),
        m=c.abmessungen.breite,
        g=c.abmessungen.tiefe,
        z=createSmoothBoxGeometry(m, p, g),
        d=this.erstellePfostenMaterial(n),
        k=new THREE.Mesh(z, d),
        b={
            x:(u.x+s.x)/2,
            y:(u.y+s.y)/2,
            z:(u.z+s.z)/2
        };
        k.position.set(b.x, b.y, b.z);
        const P=Math.atan2(s.z-u.z, s.y-u.y);
        k.rotation.x=P,
        k.rotation.y=r,
        k.castShadow=!0,
        k.receiveShadow=!0,
        k.name=`Pfosten_${e}`;
        const y={
            name:e,
            mesh:k,
            geometrie:z,
            material:d,
            positionen:{
                boden:{
                    ...t
                },
                angepassteBoden:{
                    ...u
                },
                oberkante:{
                    ...s
                },
                mittelpunkt:{
                    ...b
                }
            },
            abmessungen:{
                breite:m,
                tiefe:g,
                hoehe:p
            },
            eigenschaften:{
                typ:n.typ,
                material:n.material,
                farbe:n.farbe,
                profil:c.id,
                profilName:c.name,
                rotationY:r,
                rotationYGrad:180*r/Math.PI,
                kuerzung:h,
                kuerzungOriginal:a
            }
        };
        if(h>1e-6){
            const e=this.erstelleMaueransatz(u, h, m, g, r, n);
            e&&(y.maueransatz=e)
        }
        return y
    }
    istPfostenAktiv(e, t){
        const s=this.normalisierePfostenId(e);
        if(!t?.pfostenAktiv)return!0;
        if("mitte_zentral"===s||"mitte_zentral"===e)return!0===t.zentralerMittelpfosten;
        const n=t.pfostenAktiv.individuell||{};
        return void 0!==n[s]?!0===n[s]:e!==s&&void 0!==n[e]?!0===n[e]:s.startsWith("vorne")?!1!==t.pfostenAktiv.vorne:s.startsWith("hinten")?!1!==t.pfostenAktiv.hinten:!s.startsWith("mitte")||!1!==t.pfostenAktiv.vorne&&!1!==t.pfostenAktiv.hinten
    }
    berechneKuerzungFuerPfosten(e, t, s=null){
        if(!t?.pfostenKuerzung)return 0;
        const n=this.normalisierePfostenId(e),
        i="string"==typeof n?n:"",
        r=t.pfostenKuerzung.individuell||{};
        if(void 0!==r[i])return Number(r[i])||0;
        if(e!==i&&void 0!==r[e])return Number(r[e])||0;
        const o=Number(t.pfostenKuerzung.vorne)||0,
        a=Number(t.pfostenKuerzung.hinten)||0,
        h=Number(t.pfostenKuerzung.mitte)||0;
        if(i.includes("mitte")||i.includes("zwischen"))return h;
        if(i.startsWith("vorne")||i.includes("front"))return o;
        if(i.startsWith("hinten")||i.includes("rear"))return a;
        const f=s?.z,
        l=parseFloat(String(t.tiefe??0).toString().replace(",", "."))||0;
        if("number"==typeof f&&l>0){
            return o+(a-o)*Math.min(Math.max(f/l, 0), 1)
        }
        return h
    }
    erstelleMaueransatz(e, t, s, n, i, r){
        const o=1.2*s,
        a=1.2*n,
        h="ankerplatte"===r?.befestigung,
        f=Math.max(t, 0),
        l=h?e.y-.02:e.y,
        u=h?.04:Math.max(l-f, 0),
        p=Math.max(l-u, 0);
        if(p<=0)return null;
        const c=new THREE.BoxGeometry(o, p, a),
        m=new THREE.MeshPhongMaterial({
            color:"#999999", shininess:5, specular:"#222222", transparent:!0, opacity:.25, wireframe:!1
        }),
        g=new THREE.Mesh(c, m),
        z={
            x:e.x,
            y:u+p/2,
            z:e.z
        };
        return g.position.set(z.x, z.y, z.z),
        g.rotation.y=i,
        g.castShadow=!0,
        g.receiveShadow=!0,
        g.name=`Maueransatz_${e.x}_${e.z}`,
        {
            mesh:g,
            geometrie:c,
            material:m,
            hoehe:f
        }
    }
    erstellePfostenMaterial(e){
        return MaterialManager.gibStrukturMaterial({
            teil:"pfosten", config:e
        })
    }
    entfernePfosten(){
        for(this.pfostenListe.forEach(e=>{
            disposeEdgeHighlights(e.mesh), e.geometrie.dispose();
            const t=e.material, s=t?.userData?.managedMaterial;
            t?.dispose&&!s&&t.dispose(), e.maueransatz&&(e.maueransatz.geometrie.dispose(), e.maueransatz.material.dispose&&e.maueransatz.material.dispose()), e.kopfkeil&&(e.kopfkeil.mesh?.parent&&e.kopfkeil.mesh.parent.remove(e.kopfkeil.mesh), e.kopfkeil.geometrie?.dispose())
        });
        this.pfostenGruppe.children.length>0;)this.pfostenGruppe.remove(this.pfostenGruppe.children[0]);
        this.pfostenListe=[]
    }
    gibPfosten(e){
        return this.pfostenListe.find(t=>t.name===e)||null
    }
    gibAllePfosten(){
        return[...this.pfostenListe]
    }
    aktualisierePfosten(){
        return this.erstellePfosten()
    }
    setzeProfil(e){
        return!!this.profileKonfig.setzeAktuellesProfil(e)&&(this.koordinatenSystem?.setzeProfil&&this.koordinatenSystem.setzeProfil(e), this.erstellePfosten())
    }
    debugPfosten(){
        console.group("🏗️ PFOSTEN-INFORMATIONEN"),
        this.pfostenListe.forEach(e=>{
            console.group(`Pfosten: ${e.name}`), console.log("Positionen:", e.positionen), console.log("Abmessungen:", e.abmessungen), console.log("Eigenschaften:", e.eigenschaften), console.groupEnd()
        }),
        console.groupEnd()
    }
    dispose(){
        this.entfernePfosten()
    }
}
