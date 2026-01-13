import{
    PergolaKonfiguration
}
from"../config/PergolaKonfiguration.js";
import{
    KoordinatenSystem
}
from"./KoordinatenSystem.js";
import{
    Pfosten
}
from"../components/Pfosten.js";
import{
    Laengstraeger
}
from"../components/Laengstraeger.js";
import{
    Quertraeger
}
from"../components/Quertraeger.js";
import{
    Glaeser
}
from"../components/Glaeser.js";
import{
    Terrassenplatten
}
from"../components/Terrassenplatten.js";
import{
    Befestigung
}
from"../components/Befestigung.js";
import{
    Kopfbaender
}
from"../components/Kopfbaender.js";
import{
    OutdoorMoebel
}
from"../components/OutdoorMoebel.js";
export class Pergola{
    constructor(){
        this.konfiguration=new PergolaKonfiguration,
        this.koordinatenSystem=new KoordinatenSystem(this.konfiguration),
        this.pfosten=new Pfosten(this.koordinatenSystem, this.konfiguration),
        this.laengstraeger=new Laengstraeger(this.koordinatenSystem, this.konfiguration, this.pfosten),
        this.quertraeger=new Quertraeger(this.koordinatenSystem, this.konfiguration, this.pfosten, this.laengstraeger),
        this.glaeser=new Glaeser(this.koordinatenSystem, this.konfiguration, this.laengstraeger),
        this.terrassenplatten=new Terrassenplatten(this.koordinatenSystem, this.konfiguration),
        this.befestigung=new Befestigung(this.koordinatenSystem, this.konfiguration, this.pfosten),
        this.kopfbaender=new Kopfbaender(this.koordinatenSystem, this.konfiguration),
        this.outdoorMoebel=new OutdoorMoebel(this.koordinatenSystem, this.konfiguration),
        this.pergolaGruppe=new THREE.Group,
        this.pergolaGruppe.name="PergolaHauptgruppe",
        this.istErstellt=!1,
        this.letzteAenderung=Date.now(),
        this.initEventListener()
    }
    initEventListener(){
        document.addEventListener("pergolaKonfigurationGeaendert", e=>{
            this.aufKonfigurationsAenderungReagieren(e.detail)
        })
    }
    setzeAktivesProfil(e){
        e&&(this.pfosten?.profileKonfig?.setzeAktuellesProfil?.(e), this.laengstraeger?.profileKonfig?.setzeAktuellesProfil?.(e), this.quertraeger?.profileKonfig?.setzeAktuellesProfil?.(e), this.glaeser?.profileKonfig?.setzeAktuellesProfil?.(e), this.koordinatenSystem?.setzeProfil?.(e))
    }
    erstellePergola(){
        console.group("🏗️ ERSTELLE PERGOLA"),
        console.time("PergolaErstellung");
        try{
            this.entfernePergola();
            const e=this.konfiguration.gibAktuelleKonfiguration(),
            t=e.breite,
            r=e.tiefe;
            if(console.log(`🔍 Optimiere Profile für ${t}×${r}m Pergola...`), t>4.5||r>4.5){
                !1!==e.zentralerMittelpfosten?(e.zentralerMittelpfosten=!0, console.log(`✅ Mittelpfosten automatisch aktiviert (Größe: ${t}×${r}m)`), console.log("   → Profile: 200×120 (Rahmen) + 160×80 (Mittelträger)")):(console.warn("⚠️ HINWEIS: Mittelpfosten deaktiviert durch Benutzer"), console.warn("   → 200×120 Mittelträger erforderlich (konstruktiv problematisch: 0mm Abstand)"))
            }
            else!0===e.zentralerMittelpfosten&&console.log(`ℹ️  Mittelpfosten gesetzt (optional bei ${t}×${r}m)`);
            this.konfiguration.aktualisiereKonfiguration({
                zentralerMittelpfosten:e.zentralerMittelpfosten
            }),
            this.pfosten&&this.pfosten.profileKonfig&&this.pfosten.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten),
            this.laengstraeger&&this.laengstraeger.profileKonfig&&this.laengstraeger.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten),
            this.quertraeger&&this.quertraeger.profileKonfig&&this.quertraeger.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten),
            this.koordinatenSystem&&this.koordinatenSystem.profileKonfig&&this.koordinatenSystem.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten),
            this.glaeser&&this.glaeser.profileKonfig&&this.glaeser.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten),
            console.log("📐 Aktualisiere Koordinatensystem..."),
            this.koordinatenSystem.aktualisiereReferenzpunkte(),
            console.log("🏗️ Erstelle Pfosten...");
            const n=this.pfosten.erstellePfosten();
            this.pergolaGruppe.add(n),
            console.log("🔗 Erstelle Längsträger...");
            const s=this.laengstraeger.erstelleLaengstraeger();
            this.pergolaGruppe.add(s),
            console.log("⚡ Erstelle Querträger...");
            const i=this.quertraeger.erstelleQuertraeger();
            this.pergolaGruppe.add(i),
            console.log("🏠 Erstelle Terrassenplatten...");
            const o=this.terrassenplatten.erstelleTerrassenplatten();
            this.pergolaGruppe.add(o),
            console.log("🔧 Erstelle Befestigung...");
            const l=this.befestigung.erstelleBefestigung();
            if(this.pergolaGruppe.add(l), e.kopfbaenderAktiv){
                console.log("🔺 Erstelle Kopfbänder...");
                const e=this.kopfbaender.erstelleKopfbaender();
                this.pergolaGruppe.add(e)
            }
            return this.erstelleZusaetzlicheElemente(),
            this.istErstellt=!0,
            this.letzteAenderung=Date.now(),
            console.log("✅ Pergola erfolgreich erstellt"),
            console.timeEnd("PergolaErstellung"),
            console.groupEnd(),
            this.istDebugModus()&&this.debugPergola(),
            this.pergolaGruppe
        }
        catch(e){
            throw console.error("❌ Fehler beim Erstellen der Pergola:", e),
            console.timeEnd("PergolaErstellung"),
            console.groupEnd(),
            e
        }
    }
    erstelleZusaetzlicheElemente(){
        const e=this.konfiguration.gibAktuelleKonfiguration();
        if("wandanschluss"===e.typ){
            console.log("🧱 Erstelle Wand...");
            const t=this.erstelleWand(e);
            this.pergolaGruppe.add(t)
        }
        if("epdm"===e.dachTyp){
            console.log("🏠 Erstelle EPDM-Dachfolie...");
            const t=this.erstelleEPDMDachfolie(e);
            this.pergolaGruppe.add(t);
            // Seitliche Auflager auch bei EPDM (Flachdach) erzeugen
            try{
                const r=this.glaeser?.erstelleGlaeser?.();
                r&&this.pergolaGruppe.add(r)
            }
            catch(t){
                console.warn("EPDM-Auflager-Erstellung fehlgeschlagen:", t)
            }
        }
        if("glas"===e.dachTyp||"glas"===e.dach)try{
            const e=this.glaeser&&"function"==typeof this.glaeser.erstelleGlaeser?this.glaeser.erstelleGlaeser():null;
            e&&this.pergolaGruppe.add(e)
        }
        catch(e){
            console.warn("Glas-Erstellung fehlgeschlagen:", e)
        }
        if(e.outdoorMoebel){
            console.log("🌿 Erstelle Pflanzen...");
            const t=this.outdoorMoebel.erstelleOutdoorMoebel();
            this.pergolaGruppe.add(t)
        }
    }
    erstelleEPDMDachfolie(e){
        const t=new THREE.Group;
        t.name="EPDMDachfolie",
        console.log("🔍 DEBUG: Starte EPDM-Erstellung, dachTyp:", e.dachTyp);
        const r=this.koordinatenSystem.gibReferenzpunkt("quertraegerReferenz");
        if(console.log("🔍 DEBUG: Alle Querträger:", r?.length||0), !r||r.length<2)return console.warn("Nicht genug Querträger für EPDM-Dachfolie"),
        t;
        const n=r.filter(e=>{
            const t="string"==typeof e.position?e.position.toLowerCase():"";
            return!["vorne", "hinten"].includes(t)
        });
        if(console.log("🔍 DEBUG: Mittlere Querträger gefunden:", n.length), n.length<2){
            console.warn("Nicht genug mittlere Querträger für EPDM-Dachfolie - versuche Fallback über mittlere Längsträger");
            const r=(this.laengstraeger?.gibAlleLaengstraeger?.()||[]).filter(e=>"string"==typeof e.name&&e.name.startsWith("mitte"));
            if(r.length>=1){
                let n=1/0,
                s=-1/0;
                if(r.forEach(e=>{
                    const t=e.referenzpunkte||e.referenzpunkte||{}, r=t.start?.z??e.referenzpunkte?.start?.z??null, i=t.ende?.z??e.referenzpunkte?.ende?.z??null;
                    Number.isFinite(r)&&(n=Math.min(n, r)), Number.isFinite(i)&&(s=Math.max(s, i))
                }), !isFinite(n)||!isFinite(s)){
                    const e=this.konfiguration.gibAktuelleKonfiguration();
                    n=0,
                    s=e.tiefe||s
                }
                const i={
                    z:n,
                    hoehe:0,
                    position:"mittlereLaeng_start"
                },
                o={
                    z:s,
                    hoehe:0,
                    position:"mittlereLaeng_ende"
                },
                l=this.erstelleEPDMGesamtFlaeche(i, o, e);
                return l&&t.add(l),
                t
            }
            return console.warn("Keine mittleren Längsträger für Fallback gefunden - EPDM wird nicht erstellt"),
            t
        }
        const s=[...n].sort((e, t)=>e.z-t.z),
        i=s[0],
        o=s[s.length-1],
        l=this.erstelleEPDMGesamtFlaeche(i, o, e);
        return l&&t.add(l),
        t
    }
    erstelleWand(e){
        console.log("🧱 ERSTELLE WAND - Start");
        const t=new THREE.Group;
        t.name="Wandanschluss";
        const r=e.breite+1,
        n=(e.hoehe||2.5)+.5,
        s=e.tiefe;
        
        console.log("📐 Wand-Dimensionen:", {breite: r, hoehe: n, tiefe: s});
        
        // TextureLoader für PBR-Texturen (Poly Haven Format)
        const textureLoader = new THREE.TextureLoader();
        
        // PBR Texture Set (kannst du von Poly Haven laden)
        // Format: wall_brick_diff_1k.jpg, wall_brick_nor_gl_1k.jpg, wall_brick_rough_1k.jpg
        const textureName = e.wandTextur || 'white_sandstone_bricks_03'; // Basis-Name ohne Suffix
        const resolution = e.wandTexturAufloesung || '4k'; // 1k, 2k, 4k
        
        console.log("🖼️ Lade PBR-Texturen für:", textureName, "Resolution:", resolution);
        
        // Erstelle PBR Material
        const wandMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xffffff), // Weiß für unverfälschte Texturfarbe
            roughness: 0.85,
            metalness: 0.02,
            side: THREE.DoubleSide
        });
        
        // DIFFUSE/COLOR Map (Haupttextur) - SYNCHRON laden, sofort zuweisen
        const diffuseTexture = textureLoader.load(
            `textures/${textureName}_diff_${resolution}.jpg`,
            (texture) => {
                console.log("✅ Diffuse Map erfolgreich geladen:", `textures/${textureName}_diff_${resolution}.jpg`);
                wandMaterial.needsUpdate = true;
            },
            undefined,
            (err) => {
                console.error("❌ Fehler beim Laden der Diffuse Map:", err);
                console.warn("⚠️ Verwende Fallback-Farbe statt Textur");
                wandMaterial.color = new THREE.Color(0xe8dcd0);
            }
        );
        diffuseTexture.wrapS = THREE.RepeatWrapping;
        diffuseTexture.wrapT = THREE.RepeatWrapping;
        diffuseTexture.repeat.set(r * 1.5, n * 1.5);
        diffuseTexture.colorSpace = THREE.SRGBColorSpace;
        wandMaterial.map = diffuseTexture;
        
        // NORMAL Map (für 3D-Details) - SYNCHRON laden, sofort zuweisen
        const normalTexture = textureLoader.load(
            `textures/${textureName}_nor_gl_${resolution}.jpg`,
            (texture) => {
                console.log("✅ Normal Map erfolgreich geladen");
                wandMaterial.needsUpdate = true;
            },
            undefined,
            (err) => {
                console.log("ℹ️ Normal Map optional - nicht gefunden");
            }
        );
        normalTexture.wrapS = THREE.RepeatWrapping;
        normalTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.repeat.set(r * 1.5, n * 1.5);
        wandMaterial.normalMap = normalTexture;
        wandMaterial.normalScale = new THREE.Vector2(0.5, 0.5);
        
        // ROUGHNESS Map (für realistische Oberfläche) - SYNCHRON laden, sofort zuweisen
        const roughnessTexture = textureLoader.load(
            `textures/${textureName}_rough_${resolution}.jpg`,
            (texture) => {
                console.log("✅ Roughness Map erfolgreich geladen");
                wandMaterial.needsUpdate = true;
            },
            undefined,
            (err) => {
                console.log("ℹ️ Roughness Map optional - nicht gefunden");
            }
        );
        roughnessTexture.wrapS = THREE.RepeatWrapping;
        roughnessTexture.wrapT = THREE.RepeatWrapping;
        roughnessTexture.repeat.set(r * 1.5, n * 1.5);
        wandMaterial.roughnessMap = roughnessTexture;
        
        const u=new THREE.BoxGeometry(r, n, .2),
        f=new THREE.Mesh(u, wandMaterial);
        f.position.set(e.breite/2, n/2, s+.1+.04),
        f.receiveShadow=!0,
        f.castShadow=!0,
        f.name="Hauptwand",
        t.add(f);
        
        console.log("✅ Wand-Mesh erstellt an Position:", f.position);
        console.log("🧱 ERSTELLE WAND - Fertig");
        
        return t;
    }
    
    ladePBRTextur(pfade, loader, onSuccess, onError){
        // Versuche Texturen in Reihenfolge zu laden
        let index = 0;
        
        const tryNext = () => {
            if (index >= pfade.length) {
                console.warn("❌ Alle Pfade fehlgeschlagen:", pfade);
                onError();
                return;
            }
            
            const pfad = pfade[index];
            console.log(`  → Versuche ${index + 1}/${pfade.length}: ${pfad}`);
            
            loader.load(
                pfad,
                (texture) => {
                    console.log(`  ✅ ERFOLG: ${pfad}`);
                    onSuccess(texture);
                },
                undefined,
                (err) => {
                    console.log(`  ✗ Fehlgeschlagen: ${pfad}`);
                    index++;
                    tryNext();
                }
            );
        };
        
        tryNext();
    }
    
    erstelleBetonTextur(){
        // Fallback: Prozeduraler Beton mit mehr Detail
        const i=document.createElement("canvas");
        i.width=512;
        i.height=512;
        const o=i.getContext("2d");
        o.fillStyle="#c9c9c9";
        o.fillRect(0, 0, 512, 512);
        const l=o.getImageData(0, 0, 512, 512),
        a=l.data;
        for(let e=0; e<a.length; e+=4){
            const t=10*(Math.random()-.5);
            a[e]=Math.min(255, Math.max(0, a[e]+t));
            a[e+1]=Math.min(255, Math.max(0, a[e+1]+t));
            a[e+2]=Math.min(255, Math.max(0, a[e+2]+t));
        }
        o.putImageData(l, 0, 0);
        const g=new THREE.CanvasTexture(i);
        g.colorSpace = THREE.SRGBColorSpace;
        return g;
    }
    erstelleEPDMGesamtFlaeche(e, t, r){
        let n;
        switch(r.epdmFarbe){
            case"schwarz":default:n="#1a1a1a";
            break;
            case"grau":n="#666666"
        }
        const s=this.laengstraeger?.gibAlleLaengstraeger?.()||[],
        i=s.filter(e=>"string"==typeof e.name&&e.name.startsWith("mitte"));
        if(0===i.length)return console.warn("Keine mittleren Längsträger gefunden - EPDM wird nicht erstellt"),
        null;
        const o=i[0],
        l=o.referenzpunkte||{};
        if(!l.start||!l.ende)return console.warn("Längsträger-Referenzpunkte fehlen"),
        null;
        const a="number"==typeof r.neigung?r.neigung:0,
        g=0===a&&o?.referenzpunkte?.start&&o?.referenzpunkte?.ende?(o.referenzpunkte.start.y+(o.abmessungen?.hoehe||0)):(()=>{
            const e=s.map(e=>{
                const t=e.referenzpunkte||{}, r=t.start;
                if(!r)return null;
                const n=e.abmessungen?.hoehe||0;
                return r.y+n
            }).filter(e=>Number.isFinite(e));
            return e.length?Math.max(...e):(o.referenzpunkte.start.y+(o.abmessungen?.hoehe||0))
        })(),
        h=0===a&&o?.referenzpunkte?.start&&o?.referenzpunkte?.ende?(o.referenzpunkte.ende.y+(o.abmessungen?.hoehe||0)):(()=>{
            const e=s.map(e=>{
                const t=e.referenzpunkte||{}, r=t.ende;
                if(!r)return null;
                const n=e.abmessungen?.hoehe||0;
                return r.y+n
            }).filter(e=>Number.isFinite(e));
            return e.length?Math.max(...e):(o.referenzpunkte.ende.y+(o.abmessungen?.hoehe||0))
        })(),
        u=s.find(e=>"string"==typeof e.name&&e.name.includes("links")),
        f=s.find(e=>"string"==typeof e.name&&e.name.includes("rechts"));
        if(!u||!f)return console.warn("Äußere Längsträger nicht gefunden - EPDM wird nicht erstellt"),
        null;
        const p=u.referenzpunkte?.start?.x||0,
        c=f.referenzpunkte?.start?.x||0,
        d=u.abmessungen?.breite||0,
        m=p+d/2,
        k=c-(f.abmessungen?.breite||d)/2;
        let E,
        b=k-m;
        b<=0?(b=Math.abs(c-p), E=(c+p)/2):E=(m+k)/2;
        const P=Math.abs(l.ende.z-l.start.z),
        T=Math.abs(h-g),
        epdmTiefe=Math.sqrt(P*P+T*T);
        if(b<.001||epdmTiefe<.001)return console.warn("EPDM: berechnete Breite/Tiefe zu klein", {
            breite:b, tiefe:epdmTiefe
        }),
        null;

        // Flachdach + EPDM: Folie vorne bündig mit Rinnen-Innenseite
        const istFlachdach = a === 0;
        const istPultdach = r.dachForm === "pultdach";
        const istRinne = r.regenwasserAbfluss === "rinne";
        const quertraegerProfil = this.profileKonfig?.gibAktuellesProfil?.();
        const quertraegerTiefe = quertraegerProfil?.abmessungen?.tiefe || 0.08;
        const wandstaerke = quertraegerProfil?.abmessungen?.wandstaerke || (0.1 * (quertraegerProfil?.abmessungen?.breite || 0.16));

        // Verschiebung der EPDM-Folie nach hinten bei Flachdach + Rinne
        const epdmVerschiebung = (istFlachdach && istRinne) ? (quertraegerTiefe/2 - wandstaerke) : 0;
        // Bei Pultdach nicht nach vorne ziehen – sonst steht die Folie über
        const epdmFrontOffset = istPultdach ? 0 : -0.025;

        const z=new THREE.BoxGeometry(b, .01, epdmTiefe);
        z.translate(0, -.005, 0);
        const K=new THREE.MeshPhysicalMaterial({
            color:n, roughness:.3, metalness:.2, clearcoat:.6, clearcoatRoughness:.2, reflectivity:.4, side:THREE.DoubleSide, transparent:!1
        });
        K.polygonOffset=!0,
        K.polygonOffsetFactor=-1,
        K.polygonOffsetUnits=-2;
        const M=new THREE.Mesh(z, K),
        w=(l.start.z+l.ende.z)/2 + epdmVerschiebung + epdmFrontOffset,
        G=(g+h)/2+5e-4,
        y=h-g,
        S=l.ende.z-l.start.z,
        A=-Math.atan2(y, S);
        return M.rotation.x=A,
        M.position.set(E, G, w),
        M.renderOrder=999,
        M.castShadow=!0,
        M.receiveShadow=!0,
        M.name="EPDM_Gesamt",
        console.log("EPDM:", {
            breite:b, tiefe:epdmTiefe, lauflaenge:P, hoehenDifferenz:T, xPos:E, yPos:G, zPos:w, yVorne:g, yHinten:h, neigungswinkel:180*A/Math.PI, epdmVerschiebung:epdmVerschiebung, istFlachdach:istFlachdach, istRinne:istRinne
        }),
        M
    }
    aufKonfigurationsAenderungReagieren(e){
        if(this.istErstellt){
            console.group("🔄 KONFIGURATION GEÄNDERT"),
            console.log("Neue Konfiguration:", e);
            try{
                this.erstellePergola(),
                document.dispatchEvent(new CustomEvent("pergolaStrukturAktualisiert", {
                    detail:{
                        pergola:this, konfiguration:e, zeitstempel:Date.now()
                    }
                })),
                console.log("✅ Pergola erfolgreich aktualisiert")
            }
            catch(e){
                console.error("❌ Fehler beim Aktualisieren der Pergola:", e)
            }
            console.groupEnd()
        }
    }
    aktualisiereKonfiguration(e, t){
        ({
            ...this.konfiguration.gibAktuelleKonfiguration()
        })[e]=t,
        this.konfiguration.aktualisiereKonfiguration({
            [e]:t
        })
    }
    aktualisiereKonfigurationen(e){
        if(this.konfiguration.aktualisiereKonfiguration(e), void 0!==e.breite||void 0!==e.tiefe){
            const e=this.konfiguration.gibAktuelleKonfiguration(),
            t=e.breite,
            r=e.tiefe;
            console.log(`🔍 Größenänderung erkannt: ${t}×${r}m - Optimiere Profile...`),
            this.pfosten&&this.pfosten.profileKonfig&&this.pfosten.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten),
            this.laengstraeger&&this.laengstraeger.profileKonfig&&this.laengstraeger.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten),
            this.quertraeger&&this.quertraeger.profileKonfig&&this.quertraeger.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten),
            this.koordinatenSystem&&this.koordinatenSystem.profileKonfig&&this.koordinatenSystem.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten),
            this.glaeser&&this.glaeser.profileKonfig&&this.glaeser.profileKonfig.optimiereProfileFuerGroesse(t, r, e.zentralerMittelpfosten)
        }
    }
    entfernePergola(){
        for(this.quertraeger&&this.quertraeger.dispose(), this.laengstraeger&&this.laengstraeger.dispose(), this.pfosten&&this.pfosten.dispose(), this.terrassenplatten&&this.terrassenplatten.dispose(), this.befestigung&&this.befestigung.dispose();
        this.pergolaGruppe.children.length>0;)this.pergolaGruppe.remove(this.pergolaGruppe.children[0]);
        this.istErstellt=!1
    }
    gibKonfiguration(){
        return this.konfiguration.gibAktuelleKonfiguration()
    }
    gibKoordinatenSystem(){
        return this.koordinatenSystem
    }
    gibKomponente(e){
        switch(e.toLowerCase()){
            case"pfosten":return this.pfosten;
            case"laengstraeger":case"längsträger":return this.laengstraeger;
            case"quertraeger":case"querträger":return this.quertraeger;
            default:return null
        }
    }
    gib3DGruppe(){
        return this.pergolaGruppe
    }
    berechneStatistiken(){
        const e=this.konfiguration.gibAktuelleKonfiguration(),
        t=this.konfiguration.berechneAbhaengigeWerte();
        return{
            grundmasse:{
                breite:e.breite,
                tiefe:e.tiefe,
                hoehe:e.hoehe,
                neigung:e.neigung
            },
            berechneteWerte:t,
            komponenten:{
                anzahlPfosten:this.pfosten.gibAllePfosten().length,
                anzahlLaengstraeger:this.laengstraeger.gibAlleLaengstraeger().length,
                anzahlQuertraeger:this.quertraeger.gibAlleQuertraeger().length,
                anzahlTerrassenplatten:this.terrassenplatten.gibAllePlatten().length,
                anzahlBefestigungsElemente:this.befestigung.gibAlleBefestigungsElemente().length
            },
            flaechen:{
                grundflaeche:e.breite*e.tiefe,
                dachflaeche:t.glasflaeche||e.breite*e.tiefe
            },
            status:{
                istErstellt:this.istErstellt,
                letzteAenderung:new Date(this.letzteAenderung).toLocaleString()
            }
        }
    }
    validiereStruktur(){
        const e=[],
        t=[];
        try{
            0===this.pfosten.gibAllePfosten().length&&e.push("Keine Pfosten vorhanden");
            0===this.laengstraeger.gibAlleLaengstraeger().length&&e.push("Keine Längsträger vorhanden");
            this.quertraeger.gibAlleQuertraeger().length<2&&t.push("Weniger als 2 Querträger - Struktur möglicherweise instabil");
            const r=this.konfiguration.gibAktuelleKonfiguration();
            r.breite>8&&t.push("Breite über 8m - zusätzliche Stützen empfohlen"),
            r.tiefe>6&&t.push("Tiefe über 6m - zusätzliche Querträger empfohlen")
        }
        catch(t){
            e.push(`Validierungsfehler: ${t.message}`)
        }
        return{
            gueltig:0===e.length,
            fehler:e,
            warnungen:t
        }
    }
    istDebugModus(){
        return"true"===localStorage.getItem("pergolaDebug")||"1"===new URLSearchParams(window.location.search).get("debug")
    }
    debugPergola(){
        console.group("🔍 PERGOLA DEBUG-INFORMATIONEN"),
        console.group("📋 Allgemeine Informationen"),
        console.log("Konfiguration:", this.konfiguration.gibAktuelleKonfiguration()),
        console.log("Statistiken:", this.berechneStatistiken()),
        console.log("Validierung:", this.validiereStruktur()),
        console.groupEnd(),
        this.koordinatenSystem.debugReferenzpunkte(),
        this.pfosten.debugPfosten(),
        this.laengstraeger.debugLaengstraeger(),
        this.quertraeger.debugQuertraeger(),
        this.terrassenplatten.debugTerrassenplatten(),
        this.befestigung.debugBefestigung(),
        console.groupEnd()
    }
    dispose(){
        document.removeEventListener("pergolaKonfigurationGeaendert", this.aufKonfigurationsAenderungReagieren),
        this.entfernePergola(),
        this.quertraeger&&this.quertraeger.dispose(),
        this.laengstraeger&&this.laengstraeger.dispose(),
        this.pfosten&&this.pfosten.dispose(),
        this.terrassenplatten&&this.terrassenplatten.dispose(),
        this.befestigung&&this.befestigung.dispose()
    }
}
