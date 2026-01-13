import{
    ProfileKonfiguration
}
from"../config/ProfileKonfiguration.js";
import{
    createSmoothBoxGeometry
}
from"../utils/geometry.js";
import{
    MaterialManager
}
from"../core/MaterialManager.js";
export class Glaeser{
    constructor(e, t, r){
        this.koordinatenSystem=e,
        this.konfiguration=t,
        this.laengstraegerInstanz=r,
        this.profileKonfig=new ProfileKonfiguration,
        this.MIN_GLAS_BREITE=.7,
        this.MAX_GLAS_BREITE=.85,
        this.GAP_BREITE=.02,
        this.MAX_LAENGE=3,
        this.GAP_TIEFE=.005,
        this.DICKE=.008
    }
    erzeugeGlasMaterial(e){
        const t={
            klar:{
                baseColor:15134710,
                attenuationColor:16252415,
                attenuationDistance:2.8,
                transmission:.36,
                roughness:.84,
                thickness:.055,
                ior:1,
                specularIntensity:.018
            },
            matt:{
                baseColor:14345698,
                attenuationColor:15267569,
                attenuationDistance:2.2,
                transmission:.3,
                roughness:.86,
                thickness:.095,
                ior:1,
                specularIntensity:.015
            },
            grau:{
                baseColor:12765391,
                attenuationColor:12307416,
                attenuationDistance:2.1,
                transmission:.32,
                roughness:.84,
                thickness:.07,
                ior:1,
                specularIntensity:.018
            },
            bronze:{
                baseColor:14273449,
                attenuationColor:14732967,
                attenuationDistance:2.3,
                transmission:.31,
                roughness:.85,
                thickness:.078,
                ior:1,
                specularIntensity:.018
            }
        },
        n=t[e]||t.klar,
        s=new THREE.MeshPhysicalMaterial({
            color:new THREE.Color(n.baseColor), transparent:!0, opacity:.3, roughness:n.roughness, metalness:0, transmission:n.transmission, thickness:n.thickness, attenuationColor:new THREE.Color(n.attenuationColor), attenuationDistance:n.attenuationDistance, ior:n.ior, specularIntensity:n.specularIntensity, specularColor:new THREE.Color(16777215), side:THREE.DoubleSide, dithering:!1, reflectivity:.5
        });
        return s.clearcoat=.35,
        s.clearcoatRoughness=.28,
        s.sheen=0,
        s.envMapIntensity=.45,
        s.toneMapped=!0,
        s
    }
    berechneBreiten(e, t, n){
        const s=this.MIN_GLAS_BREITE,
        i=this.MAX_GLAS_BREITE,
        r=this.GAP_BREITE,
        a=s-2*n,
        o=i-2*n,
        l=s-(t+n+r/2),
        h=i-(t+n+r/2);
        for(let g=2;
        g<=20;
        g++){
            const u=e-2*t-(g-1)*(2*n+r)-r;
            if(u<=0)continue;
            const c=(s+i)/2;
            let f=Math.min(Math.max(c-2*n, a), o),
            E=(u-(g-2)*f)/2,
            p=E+t+n+r/2;
            p<s&&(E=l, f=(u-2*E)/(g-2)),
            p>i&&(E=h, f=(u-2*E)/(g-2));
            const b=f+2*n;
            p=E+t+n+r/2;
            if(!(b>=s-1e-6&&b<=i+1e-6&&p>=s-1e-6&&p<=i+1e-6))continue;
            const m=[],
            d=[];
            for(let e=0;
            e<g;
            e++)0===e||e===g-1?m.push(p):m.push(b);
            d.push(E);
            for(let e=0;
            e<Math.max(0, g-3);
            e++)d.push(f);
            return{
                n:g,
                glasBreiten:m,
                lichtabstaende:d,
                innerClear:f,
                outerClear:E
            }
        }
        return{
            n:0,
            glasBreiten:[],
            lichtabstaende:[]
        }
    }
    berechneLaengen(e, t){
        const n=t.neigung*Math.PI/180,
        s=1/Math.cos(n),
        i=this.MAX_LAENGE/s;
        let r=Math.max(1, Math.ceil(e/i));
        Math.abs(e-6)<=.05&&(r=2);
        const a=(r-1)*this.GAP_TIEFE,
        o="glasueberstand"===t.regenwasserAbfluss?.1:0,
        l=(e-a)/r,
        h=l*s;
        return console.log("🔍 DEBUG berechneLaengen:", {
            gesamttiefe:e, reihen:r, gesamtGaps:a, horizontaleLaenge:l, laenge:h, neigung:t.neigung, neigungsFaktor:s.toFixed(4), glasUeberstand:o, regenwasserAbfluss:t.regenwasserAbfluss
        }),
        {
            reihen:r,
            laenge:h,
            ueberstand:o
        }
    }
    berechneLaengstraegerOberkanteBeiZ(e, t){
        const r=e?.referenzpunkte;
        if(!r?.start||!r?.ende)return null;
        const n=r.start.z,
        s=r.ende.z-n,
        i=0!==s?(t-n)/s:0;
        var a,
        o;
        return(a=r.start.y, o=r.ende.y, a+(o-a)*i)+(e.abmessungen?.hoehe||0)
    }
    erstelleGlaeser(){
        const e=this.konfiguration.gibAktuelleKonfiguration(),
        t=new THREE.Group;
        t.name="Glaeser";
        const nurAuflagerBeiEPDM="epdm"===e.dachTyp&&Math.abs(e.neigung)<=1e-6;
        if("epdm"===e.dachTyp&&!nurAuflagerBeiEPDM)return t;
        const n=this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz"),
        s=this.koordinatenSystem.gibReferenzpunkt("quertraegerReferenz");
        if(!n||!s)return t;
        const i=n.links?.start?.x??0,
        r=n.rechts?.start?.x??e.breite,
        a=this.profileKonfig.gibAktuellesProfil(),
        o=a?.abmessungen?.tiefe||.08,
        l=(a?.id||"").startsWith("200x120")?.08:.04,
        h=i-o/2+o,
        g=r+o/2-o,
        u=Math.max(0, g-h),
        c=this.profileKonfig.gibMitteltraegerProfil(e),
        f=c?.abmessungen?.tiefe||.08,
        E=Math.max(.03, (f-this.GAP_BREITE)/2),
        p=this.koordinatenSystem.glasBerechnung;
        const hatGlasBerechnung=p&&p.anzahlGlaeser>0;
        if(!hatGlasBerechnung)console.warn("⚠️ Keine Glasberechnung vorhanden! Gläser können nicht erstellt werden."),
        console.warn("⚠️ Hinweis: Seitliche Auflager werden dennoch versucht (sofern Flachdach)");
        const b=hatGlasBerechnung?p.anzahlGlaeser:0,
        m=hatGlasBerechnung?p.glasBreiten:[],
        d=n.zwischen?.map(e=>e.start.x)||[],
        panelSpans=[];
        hatGlasBerechnung&&console.log("✅ Verwende Glasberechnung aus KoordinatenSystem:", {
            anzahlGlaeser:b, glasBreiten:m, lichtabstaende:p.lichtabstaende, mitteltraegerPositionen:d
        });
        const{
            reihen:rowsCount,
            laenge:k,
            ueberstand:A
        }
        =this.berechneLaengen(e.tiefe, e),
        R=this.profileKonfig.gibAktuellesProfil()?.abmessungen?.breite||0,
        seitenProfilBreite=.04,
        istFlachdach=e.neigung===0,
        istGlasdach="glas"===e.dachTyp,
        mittelProfilHoehe=this.profileKonfig.gibMitteltraegerProfil(e)?.abmessungen?.breite||R,
        glasAuflageHoehe=istFlachdach?mittelProfilHoehe:R,
        M=t=>{
            const n=this.konfiguration.berechneAbhaengigeWerte();
            return this.koordinatenSystem.interpoliereHoehe(0, n.vordereHoehe, e.tiefe, n.hintereHoehe, t)
        },
        profilId=((a?.id||e.pfostenProfil||"")+""),
        isProfil200x100Profil=profilId.startsWith("200x100"),
        mitteltraeger=this.laengstraegerInstanz?.gibAlleLaengstraeger?.().find(t=>"string"==typeof t.name&&t.name.startsWith("mitte")),
        mtStart=mitteltraeger?.referenzpunkte?.start,
        mtEnde=mitteltraeger?.referenzpunkte?.ende,
        glasOberkanteMitteltraeger=t=>{
            if(!mtStart||!mtEnde)return null;
            const hoehe=mitteltraeger?.abmessungen?.hoehe||0;
            const hintenIstStart=mtStart.z>mtEnde.z;
            let startTop=mtStart.y+hoehe;
            let endeTop=mtEnde.y+hoehe;
            if(istFlachdach){
                hintenIstStart?startTop-=.008:endeTop-=.008
            }
            const deltaZ=mtEnde.z-mtStart.z;
            if(Math.abs(deltaZ)<1e-6)return startTop;
            const faktor=(t-mtStart.z)/deltaZ;
            return startTop+(endeTop-startTop)*faktor
        },
        mitteltraegerNeigungswinkel=istFlachdach&&mtStart&&mtEnde?Math.atan2((glasOberkanteMitteltraeger(mtEnde.z)||mtEnde.y)-(glasOberkanteMitteltraeger(mtStart.z)||mtStart.y), mtEnde.z-mtStart.z||1e-6):null,
        I=null!=mitteltraegerNeigungswinkel?mitteltraegerNeigungswinkel:n.links?.neigungswinkel||0,
        glasAuflageY=t=>{
            if(istFlachdach&&mitteltraeger){
                const n=glasOberkanteMitteltraeger(t);
                if(Number.isFinite(n))return n
            }
            return M(t)+glasAuflageHoehe
        };
        let B=-A;
        console.log("DEBUG Glas-Berechnung:", {
            innereLichtBreite:u, spalten:b, glasBreiten:m, outerSupport:l, middleSupport:E, mitteltraegerX:d, innenkanteLinks:h, innenkanteRechts:g, glasLaenge:k, ueberstandVorne:A, reihen:rowsCount, startFront:B
        });
        const y=this.erzeugeGlasMaterial(e.glasFarbe);
        y.depthWrite=!1,
        y.depthTest=!0,
        y.alphaHash=!1,
        y.needsUpdate=!0,
        y.polygonOffset=!0,
        y.polygonOffsetFactor=-.5,
        y.polygonOffsetUnits=-.5;
        const fuegeSeitlicheAuflagerHinzu=()=>{
            if(Math.abs(e.neigung)>1e-6||!("glas"===e.dachTyp||"epdm"===e.dachTyp))return;
            const breiteProfil=.04,
            hoeheProfil=.04,
            materiale=MaterialManager.gibStrukturMaterial({
                teil:"seitlicheGlasauflage",
                config:e
            }),
            erstelleAuflager=(t, r)=>{
                const n=t?.start?.z,
                s=t?.ende?.z;
                if(!Number.isFinite(n)||!Number.isFinite(s))return null;
                const zMin=Math.min(n, s),
                zMax=Math.max(n, s),
                effektiveLaenge=Math.max(0.05, zMax - zMin),
                centerZ=(zMin + zMax)/2,
                o=createSmoothBoxGeometry(breiteProfil, hoeheProfil, effektiveLaenge),
                l=new THREE.Mesh(o, materiale),
                h=r,
                // bündig auf Mittelträger: kein Versenken mehr
                versenkSeite=0,
                g=glasAuflageY(zMin)+versenkSeite,
                u=glasAuflageY(zMax)+versenkSeite,
                f=(g+u)/2-hoeheProfil/2,
                E=-I;
                return l.position.set(h, f, centerZ),
                l.rotation.x=E,
                l.castShadow=!0,
                l.receiveShadow=!0,
                l.name="SeitlicheGlasauflage",
                l
            },
            linkeX=h+breiteProfil/2,
            rechteX=g-breiteProfil/2,
            linkesAuflager=erstelleAuflager(n.links, linkeX),
            rechtesAuflager=erstelleAuflager(n.rechts, rechteX);
            linkesAuflager&&t.add(linkesAuflager),
            rechtesAuflager&&t.add(rechtesAuflager)
        };
        for(let n=0;
        n<rowsCount&&hatGlasBerechnung&&!nurAuflagerBeiEPDM;
        n++){
            const s=0===n?A:0,
            i=0===n&&"rinne"===e.regenwasserAbfluss?.03:0,
            r=k+s-i,
            startZ=B+i;
            for(let e=0;
            e<b;
            e++){
                let i,
                o,
                u,
                c;
                1===b?(i=h-l, o=g+l, c=o-i, u=(i+o)/2):0===e?(i=h-l, o=d.length>0?d[0]-this.GAP_BREITE/2:h-l+m[e], c=o-i, u=(i+o)/2):e===b-1?(i=d.length>0?d[d.length-1]+this.GAP_BREITE/2:g+l-m[e], o=g+l, c=o-i, u=(i+o)/2):(i=d[e-1]+this.GAP_BREITE/2, o=d[e]-this.GAP_BREITE/2, c=o-i, u=(i+o)/2);
                if(istFlachdach){
                    if(0===e){
                        i+=seitenProfilBreite;
                        c=o-i;
                        u=(i+o)/2
                    }
                    else if(e===b-1){
                        o-=seitenProfilBreite;
                        c=o-i;
                        u=(i+o)/2
                    }
                }
                if(!panelSpans[e])panelSpans[e]=[i,o];
                // Bei 200x100: Kürzung auf ca. 3.5cm, damit die fehlenden ~6cm wieder angefügt werden
                const trimBack=istFlachdach&&istGlasdach&&n===rowsCount-1?(isProfil200x100Profil?0.05:0.04):0;
                const effectiveLen=Math.max(0.05, r - trimBack);
                const geom=createSmoothBoxGeometry(c, this.DICKE, effectiveLen),
                p=new THREE.Mesh(geom, y),
                zPos=startZ+effectiveLen/2,
                kontaktOffset=0;

                // glasAuflageY() berechnet bereits die korrekte Y-Position basierend auf den inneren Längsträgern
                // Bei Flachdach+Glas sind diese bereits um 8mm abgesenkt, daher keine zusätzliche Korrektur nötig
                const B=glasAuflageY(zPos)+this.DICKE/2+kontaktOffset;
                p.position.set(u, B, zPos),
                p.rotation.x=-I,
                p.castShadow=!1,
                p.receiveShadow=!1,
                p.renderOrder=5,
                p.name=`Glas_r${n+1}_c${e+1}`,
                t.add(p),
                console.log(`🔍 DEBUG Glas ${p.name}:`, {
                    position:{
                        x:u, y:B, z:zPos
                    }, dimensionen:{
                        breite:c, dicke:this.DICKE, laenge:f
                    }, z0:a, ueberstand:s, glasLaengeBasis:k, tatsaechlicheGlasLaenge:f
                })
            }
            B+=k+this.GAP_TIEFE+s
        }
        // Hintere Auflager-Profile 40x40 pro Lichtabstand (nur Flachdach)
        if(istFlachdach&&panelSpans.length){
            const materiale=MaterialManager.gibStrukturMaterial({
                teil:"seitlicheGlasauflageHinten",
                config:e
            }),
            profilBreite=.04,
            profilHoehe=.04,
            backZ=e.tiefe - 0.04; // hinten 40mm kürzen
            panelSpans.forEach(span=>{
                if(!span||span.length<2)return;
                const xs=span[0], xe=span[1];
                if(!Number.isFinite(xs)||!Number.isFinite(xe)||xe<=xs)return;
                const breite=Math.max(0, xe-xs),
                tiefe=profilBreite,
                geo=createSmoothBoxGeometry(breite, profilHoehe, tiefe),
                mesh=new THREE.Mesh(geo, materiale),
                zPos=backZ-tiefe/2,
                // Bündig auf die Mittelträger setzen: Oberkante = glasAuflageY(backZ)
                yPos=glasAuflageY(backZ) - profilHoehe/2;
                mesh.position.set((xs+xe)/2, yPos, zPos),
                mesh.rotation.x=-I,
                mesh.castShadow=!0,
                mesh.receiveShadow=!0,
                mesh.name="SeitlicheGlasauflageHinten",
                t.add(mesh)
            })
        }
        return fuegeSeitlicheAuflagerHinzu(),
        t
    }
}
