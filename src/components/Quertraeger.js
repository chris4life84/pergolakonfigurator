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
    createSmoothBoxGeometry
}
from"../utils/geometry.js";
export class Quertraeger{
    constructor(e, t, r, n){
        this.koordinatenSystem=e,
        this.konfiguration=t,
        this.pfostenInstanz=r,
        this.laengstraegerInstanz=n,
        this.profileKonfig=new ProfileKonfiguration,
        this.quertraegerListe=[],
        this.quertraegerGruppe=new THREE.Group,
        this.quertraegerGruppe.name="QuertraegerGruppe"
    }
    erstelleQuertraeger(){
        this.entferneQuertraeger();
        const e=this.konfiguration.gibAktuelleKonfiguration(),
        t=this.koordinatenSystem.gibReferenzpunkt("quertraegerReferenz");
        return t&&0!==t.length?(t.forEach((t, r)=>{
            const n=this.erstelleEinzelnenQuertraeger(t, e, r);
            n&&(this.quertraegerListe.push(n), this.quertraegerGruppe.add(n.mesh))
        }), this.quertraegerGruppe):(console.warn("Keine Querträger-Referenzpunkte gefunden"), this.quertraegerGruppe)
    }
    erstelleEinzelnenQuertraeger(e, t, r){
        const n=this.berechneAuflagepunkteAufLaengstraegern(e, t);
        if(!n)return console.warn(`Keine gültigen Auflagepunkte für Querträger ${e.position}`),
        null;
        const s="string"==typeof e.position&&!["vorne",
        "hinten"].includes(e.position.toLowerCase()),
        i="epdm"===t.dachTyp&&s?.02:0,
        a=this.profileKonfig.gibMitteltraegerProfil(t),
        o=s&&a?a:this.profileKonfig.gibAktuellesProfil(),
        u=o?.abmessungen||{},
        g=u.tiefe||0,
        l=u.breite||0,
        h=this.pfostenInstanz?.profileKonfig?.gibAktuellesProfil?.()||null,
        c=h?.abmessungen?.breite||0,
        f=this.laengstraegerInstanz?.profileKonfig?.gibAktuellesProfil?.()||null,
        p=f?.abmessungen?.tiefe||0,
        m=!1!==t.individuellerPfostenStand?.hinten_links&&!1!==t.individuellerPfostenStand?.hinten_rechts,
        d="hinten"===e.position,
        b=new THREE.Vector3(n.rechts.x-n.links.x, n.rechts.y-n.links.y, n.rechts.z-n.links.z),
        k=b.length();
        let E=k,
        z=0;
        if(s){
            const e=p;
            E=Math.max(.05, k-e),
            z=e
        }
        else if(d&&!m){
            const e=2*p;
            E=Math.max(.05, k-e),
            z=e,
            console.log(`🔧 WANDMONTAGE: Hinterer Querträger gekürzt von ${k.toFixed(3)}m auf ${E.toFixed(3)}m (Kürzung: ${e.toFixed(3)}m)`)
        }
        else if(c>0&&void 0!==e.links?.x&&void 0!==e.rechts?.x){
            const t=e.links.x-c/2,
            r=e.rechts.x+c/2;
            E=Math.max(k, r-t)
        }
        else E+=p;
        const y=this.erstelleQuertraegerMaterial(t);
        let x,
        M;
        if("rinne"===t.regenwasserAbfluss&&"vorne"===e.position){
            const quertraegerZ = e.z;
            const quertraegerX = (n.links.x+n.rechts.x)/2;  // X-Position der Rinne
            const wandstaerke = o?.abmessungen?.wandstaerke||.1*l,
            r=this.erzeugeRinnenQuertraeger(E, l, g, wandstaerke, y, t, quertraegerZ, quertraegerX);
            x=r.mesh,
            M=r.geometrien
        }
        else{
            const r=createSmoothBoxGeometry(E, l, g);
            if("glasueberstand"===t.regenwasserAbfluss&&"vorne"===e.position&&this.passeOberkanteFuerGlasUeberstandAn(r, l, g, e.neigungswinkel||0), "hinten"===e.position&&this.passeOberkanteFuerHinterenQuertraegerAn(r, l, g, e.neigungswinkel||0), x=new THREE.Mesh(r, y), M=[r], "hinten"===e.position){
                const blendblech=this.erzeugeBlendblech(E, l, g, e.neigungswinkel||0, y, n, e.z);
                blendblech&&(x.add(blendblech.mesh), M.push(blendblech.geometrie));
                
                // L-Schienen für hinteren Querträger (nur bei Pultdach mit Glas)
                const lSchienen = this.erzeugeLFoermigeSchieneFuerHinterenQuertraeger(t, n, g);
                lSchienen.forEach(schiene => {
                    x.add(schiene);
                });
            }
        }
        const w=new THREE.Vector3((n.links.x+n.rechts.x)/2, (n.links.y+n.rechts.y)/2, e.z);
        if(d&&!m&&Number.isFinite(g)){
            const e=.001;
            w.z-=g/2+e
        }
        let Q=null;
        if(s){
            const t=this.berechneAuflageHoeheFuerMittlerenQuertraeger(e.z, n);
            Number.isFinite(t)&&(Q=t)
        }
        else{
            const t=this.laengstraegerInstanz?.gibLaengstraeger?.("links"),
            r=this.laengstraegerInstanz?.gibLaengstraeger?.("rechts"),
            s=[t?this.berechneLaengstraegerOberkanteBeiZ(t, n.links?.z??e.z):null,
            r?this.berechneLaengstraegerOberkanteBeiZ(r, n.rechts?.z??e.z):null].filter(e=>Number.isFinite(e));
            s.length&&(Q=s.reduce((e, t)=>e+t, 0)/s.length)
        }
        const A={
            x:b.x,
            y:b.y,
            z:b.z
        };
        let H=0;
        (Math.abs(A.y)>.001||Math.abs(A.z)>.001)&&(H=Math.atan2(A.y, A.x));
        let R=e.neigungswinkel||0;

        // Bei Flachdach+Glas: Neigung direkt von den inneren Längsträgern ableiten (inkl. 8mm-Absenkung hinten)
        if(s && "glas"===t.dachTyp && Math.abs(t.neigung||0)<=1e-6){
            const mitteltraeger = this.laengstraegerInstanz?.gibAlleLaengstraeger?.().find(o=>"string"==typeof o.name&&o.name.startsWith("mitte"));
            const start = mitteltraeger?.referenzpunkte?.start;
            const ende = mitteltraeger?.referenzpunkte?.ende;
            const hoehe = mitteltraeger?.abmessungen?.hoehe||0;
            if(start&&ende){
                let startTop = start.y + hoehe;
                let endeTop = ende.y + hoehe;
                const hintenIstStart = start.z>ende.z;
                // Geometrie: hintere Kante 8mm abgesenkt
                hintenIstStart?startTop-=.008:endeTop-=.008;
                const deltaZ = ende.z-start.z;
                const effektiveTiefe = Math.abs(deltaZ)>1e-6?deltaZ:t.tiefe||1;
                R=Math.atan2(endeTop-startTop, effektiveTiefe);
                console.log(`🔧 Querträger ${e.position} Neigung aus Mittelträger:`, {
                    startTop,
                    endeTop,
                    deltaZ: effektiveTiefe,
                    winkelGrad:(R*180/Math.PI).toFixed(3)
                });
            }else{
                const absenkungHinten=.008;
                R=Math.atan2(absenkungHinten, t.tiefe||1);
                console.log(`⚠️ Querträger ${e.position}: Nutze Fallback-Neigung`, {
                    absenkung:absenkungHinten,
                    tiefe:t.tiefe||1,
                    winkelGrad:(R*180/Math.PI).toFixed(3)
                });
            }
        }

        const T="string"==typeof e.position&&e.position.startsWith("mitte")?new THREE.Euler(-R, 0, H, "XYZ"):new THREE.Euler(0, 0, H, "XYZ");
        x.rotation.copy(T);
        const S=new THREE.Vector3(0, l/2, 0).applyEuler(T),
        q=S.clone().negate();
        if(Number.isFinite(Q)){
            // Bei Flachdach+Glas: Innere Querträger leicht absenken für Bündigkeit mit Längsträgern
            if(s && "glas"===t.dachTyp && Math.abs(t.neigung||0)<=1e-6){
                // Kleine Absenkung von 4mm (halbe der 8mm-Absenkung der Längsträger)
                Q -= 0.004;
            }
            s||(Q-=1e-5);
            const e=new THREE.Vector3(w.x, Q, w.z).clone().add(q);
            w.copy(e).sub(S),
            w.y=Math.min(w.y, Q-1e-6)
        }
        const F=new THREE.Vector3(1, 0, 0).applyEuler(T).multiplyScalar(1e-4),
        L=w.clone().add(S).add(F);
        if(L.y-=i, x.position.copy(L), d&&!m&&Number.isFinite(g)){
            const e=.001;
            x.position.z=t.tiefe-g/2-e
        }
        x.traverse?.(e=>{
            e.isMesh&&(e.castShadow=!0, e.receiveShadow=!0)
        }),
        x.traverse||(x.castShadow=!0, x.receiveShadow=!0),
        x.name=`Quertraeger_${e.position}_${r}`;
        return{
            name:`${e.position}_${r}`,
            position:e.position,
            mesh:x,
            geometrie:M,
            material:y,
            auflagepunkte:{
                links:{
                    ...n.links
                },
                rechts:{
                    ...n.rechts
                },
                mittelpunkt:{
                    x:L.x,
                    y:L.y,
                    z:L.z
                }
            },
            abmessungen:{
                laenge:E,
                breite:g,
                hoehe:l
            },
            eigenschaften:{
                zPosition:e.z,
                index:r,
                typ:this.bestimmeQuertraegerTyp(e.position)
            }
        }
    }
    erzeugeRinnenQuertraeger(e, t, r, n, s, config, quertraegerZ, quertraegerX){
        const i=new THREE.Group,
        a=createSmoothBoxGeometry(e, n, r),
        o=new THREE.Mesh(a, s);
        o.position.y=-t/2+n/2;

        // Bei Flachdach mit EPDM-Folie: Innenseite verlängern, um bündig zu sein
        const istFlachdach = config?.neigung === 0;
        const istEPDM = config?.dachTyp === "epdm";

        const u=createSmoothBoxGeometry(e, t, n),
        g=u.clone(),
        l=createSmoothBoxGeometry(n, t, r),
        h=l.clone(),
        c=new THREE.Mesh(u, s);
        c.position.z=-r/2+n/2;

        // Innenseite (hintere Seite des U-Profils)
        let innenseiteHoehe = t;
        let innenseiteYOffset = 0;

        if(istFlachdach && istEPDM) {
            // Bei EPDM: Verlängere die Innenseite um 0.02m, um bündig mit der EPDM-Folie zu sein
            const epdmOffset = -0.05; // EPDM-Folie ist 2cm höher (siehe Zeile 43)

            // Verlängere die Innenseite um den EPDM-Offset
            innenseiteHoehe = t + epdmOffset;
            // Halte die Unterkante an derselben Position, Top wird angehoben
            innenseiteYOffset = epdmOffset / 2;

            console.log("🏗️ Flachdach mit EPDM - Rinnen-Innenseite verlängert:", {
                epdmOffset,
                originalHoehe: t,
                neueHoehe: innenseiteHoehe,
                yOffset: innenseiteYOffset
            });
        } else if(istFlachdach) {
            // Bei Flachdach ohne EPDM: Innenseite kürzen (ursprünglicher Code)
            const rahmenProfilHoehe = this.profileKonfig?.gibAktuellesProfil?.()?.abmessungen?.breite ?? t;
            const mittelProfilHoehe = this.profileKonfig?.gibMitteltraegerProfil?.(config)?.abmessungen?.breite ?? rahmenProfilHoehe;
            const profilDifferenz = Math.max(rahmenProfilHoehe - mittelProfilHoehe, 0);

            if(profilDifferenz > 0) {
                // Kürze die Innenseite um die Differenz der Profilhöhen
                innenseiteHoehe = Math.max(t - profilDifferenz, n);
                // Halte die Unterkante an derselben Position, Top wird abgesenkt
                innenseiteYOffset = -profilDifferenz / 2;

                console.log("🏗️ Flachdach Rinnen-Innenseite (Profil-Differenz):", {
                    rahmenProfilHoehe,
                    mittelProfilHoehe,
                    profilDifferenz,
                    originalHoehe: t,
                    neueHoehe: innenseiteHoehe,
                    yOffset: innenseiteYOffset
                });
            }
        }

        // Erstelle angepasste Innenseite
        const innenseiteGeometrie = innenseiteHoehe !== t ?
            createSmoothBoxGeometry(e, innenseiteHoehe, n) : g;
        const f=new THREE.Mesh(innenseiteGeometrie, s);
        f.position.z=r/2-n/2;

        // Position anpassen wenn Höhe geändert wurde
        if(innenseiteHoehe !== t) {
            f.position.y = innenseiteYOffset;
        }

        const p=new THREE.Mesh(l, s);
        p.position.x=-e/2+n/2;
        const m=new THREE.Mesh(h, s);
        m.position.x=e/2-n/2;
        
        // Erstelle Blockelemente an den Positionen der inneren Längsträger
        const innenseiteTop = (innenseiteYOffset ?? 0) + (innenseiteHoehe/2);
        const blockelemente = this.erzeugeRinnenBlockelemente(e, t, r, n, s, config, quertraegerZ, quertraegerX, innenseiteHoehe, innenseiteTop);
        
        const alleMeshes = [o, c, f, p, m, ...blockelemente];
        const alleGeometrien = [a, u, innenseiteGeometrie, l, h, ...blockelemente.map(b => b.geometry)];
        
        alleMeshes.forEach(mesh=>{
            mesh.castShadow=!0;
            mesh.receiveShadow=!0;
            i.add(mesh);
        });
        
        return {
            mesh:i,
            geometrien:alleGeometrien
        };
    }
    erzeugeRinnenBlockelemente(rinnenBreite, rinnenHoehe, rinnenTiefe, wandstaerke, material, config, quertraegerZ, quertraegerX, innenseiteHoehe = rinnenHoehe, innenseiteTop = rinnenHoehe/2){
        const blockelemente = [];
        
        // Hole die Positionen der inneren Längsträger
        if(!this.laengstraegerInstanz) return blockelemente;
        
        const alleLaengstraeger = this.laengstraegerInstanz.gibAlleLaengstraeger?.();
        if(!alleLaengstraeger) return blockelemente;
        
        // Filtere nur die inneren Längsträger (Mittelträger)
        const mitteltraeger = alleLaengstraeger.filter(lt => 
            lt.name && typeof lt.name === 'string' && lt.name.startsWith('mitte')
        );
        
        if(mitteltraeger.length === 0) return blockelemente;
        
        // Bestimme Mittelträger-Profil
        const mittelProfil = this.profileKonfig?.gibMitteltraegerProfil?.(config);
        if(!mittelProfil) return blockelemente;
        
        const mittelProfilBreite = mittelProfil.abmessungen?.breite || 0.1;  // z.B. 100mm, 120mm, 160mm
        const mittelProfilTiefe = mittelProfil.abmessungen?.tiefe || 0.08;   // immer 80mm
        const effektiveWandstaerke = Number.isFinite(wandstaerke) ? wandstaerke : 0;
        
        // Blockelement-Dimensionen:
        // Breite (X) = halbe Profiltiefe (80mm -> 40mm)
        // Höhe (Y) = Mittelträger-Höhe - 20mm
        // Tiefe (Z) = Innenbreite der Rinne (z.B. 80mm - 2*4mm = 72mm)
        const blockBreite = mittelProfilTiefe / 2;  // 40mm (X-Richtung, quer zur Rinne)
        const maxInnenHoehe = Math.max(Math.min(innenseiteHoehe, rinnenHoehe - 2 * effektiveWandstaerke), 0.001);
        const blockHoehe = Math.min(Math.max(mittelProfilBreite - 0.020, 0.060), maxInnenHoehe);  // -20mm, min 60mm, innen gecappt (Y-Richtung)
        const blockTiefe = Math.max(rinnenTiefe - 2 * effektiveWandstaerke, 0.001);  // Innenbreite (Z-Richtung)
        
        console.log('🔧 Rinnen-Blockelemente:', {
            mittelProfilBreite: (mittelProfilBreite * 1000).toFixed(0) + 'mm',
            mittelProfilTiefe: (mittelProfilTiefe * 1000).toFixed(0) + 'mm',
            blockBreite: (blockBreite * 1000).toFixed(0) + 'mm (X)',
            blockHoehe: (blockHoehe * 1000).toFixed(0) + 'mm (Y)',
            blockTiefe: (blockTiefe * 1000).toFixed(0) + 'mm (Z) (Innenbreite Rinne)',
            rinnenBreite: (rinnenBreite * 1000).toFixed(0) + 'mm',
            rinnenTiefe: (rinnenTiefe * 1000).toFixed(0) + 'mm',
            innenseiteHoehe: (innenseiteHoehe * 1000).toFixed(0) + 'mm',
            innenseiteTop: (innenseiteTop * 1000).toFixed(1) + 'mm',
            anzahlMitteltraeger: mitteltraeger.length
        });
        
        mitteltraeger.forEach((mt, index) => {
            // X-Position des Mittelträgers
            const xPos = mt.referenzpunkte?.start?.x || mt.abmessungen?.xPosition || 0;
            
            // Z-Position des Mittelträgers (Startpunkt)
            const zPos = mt.referenzpunkte?.start?.z || 0;
            
            // Breite des Mittelträgers (z.B. 100mm, 120mm, 160mm)
            const mitteltraegerBreite = mt.abmessungen?.breite || mittelProfilBreite;
            
            // Erstelle Blockelement
            const blockGeom = new THREE.BoxGeometry(blockBreite, blockHoehe, blockTiefe);
            const blockMesh = new THREE.Mesh(blockGeom, material.clone());
            
            // Position RELATIV zur Rinnengruppe:
            // X: exakt mittig unter dem inneren Längsträger (Center-Alignment)
            // Y: Auf dem Boden der Rinne sitzend
            // Z: innerhalb der Rinne, auf Position des inneren Längsträgers gecappt
            const blockX = (xPos - quertraegerX);  // Center auf Mittelträger
            const blockY = innenseiteTop - blockHoehe/2 - 1e-5;  // bündig an Innenoberkante der inneren Rinnenseite

            // Kappe Z so, dass das Blockelement vollständig in der Rinne bleibt
            const innenHalbeTiefe = Math.max((rinnenTiefe/2) - effektiveWandstaerke, 0);
            const maxZOffset = Math.max(innenHalbeTiefe - blockTiefe/2, 0);
            const rawBlockZ = zPos - quertraegerZ;  // Z relativ zur Rinne (Mittelträger-Z minus Querträger-Z)
            const blockZ = Math.max(Math.min(rawBlockZ, maxZOffset), -maxZOffset);
            
            blockMesh.position.set(blockX, blockY, blockZ);
            blockMesh.name = `RinnenBlock_${index}`;
            
            console.log(`  Block ${index}: x=${blockX.toFixed(3)}, y=${blockY.toFixed(3)}, z=${blockZ.toFixed(3)}, mtX=${xPos.toFixed(3)}, mtBreite=${(mitteltraegerBreite*1000).toFixed(0)}mm, mtZ=${zPos.toFixed(3)}, quertraegerZ=${quertraegerZ.toFixed(3)}`);
            
            blockelemente.push(blockMesh);
        });
        
        return blockelemente;
    }
    berechneAuflageHoeheFuerMittlerenQuertraeger(e, t){
        if(!this.laengstraegerInstanz)return null;
        const r=this.laengstraegerInstanz.gibAlleLaengstraeger?.().find(e=>"string"==typeof e.name&&e.name.startsWith("mitte")),
        n=r?this.berechneLaengstraegerOberkanteBeiZ(r, e):null;
        if(Number.isFinite(n))return n;
        const s=[],
        i=this.laengstraegerInstanz.gibLaengstraeger?.("links");
        if(i&&void 0!==t?.links?.y){
            const e=t.links.y+(i.abmessungen?.hoehe||0);
            Number.isFinite(e)&&s.push(e)
        }
        const a=this.laengstraegerInstanz.gibLaengstraeger?.("rechts");
        if(a&&void 0!==t?.rechts?.y){
            const e=t.rechts.y+(a.abmessungen?.hoehe||0);
            Number.isFinite(e)&&s.push(e)
        }
        return s.length?Math.max(...s):null
    }
    erzeugeLFoermigeSchieneFuerHinterenQuertraeger(config, auflagepunkte, quertraegerTiefe){
        // Nur für hinteren Querträger bei Pultdach mit Glas
        if(config.neigung === 0 || config.dachTyp === "epdm"){
            return [];
        }

        const schienen = [];
        
        // Dimensionen der L-Schiene (identisch zu Längsträger-L-Schienen)
        const schienenBreite = 0.070;  // 70mm breit (horizontaler Teil auf Glas)
        const schienenHoehe = 0.010;   // 10mm dick
        const vertikalerSchenkel = 0.008;  // 20mm hoch - länger als bei Längsträgern für bessere Sichtbarkeit
        const glasDicke = 0.008;
        
        // Berechne Länge des Querträgers zwischen den Auflagepunkten
        const quertraegerLaenge = Math.sqrt(
            Math.pow(auflagepunkte.rechts.x - auflagepunkte.links.x, 2) +
            Math.pow(auflagepunkte.rechts.y - auflagepunkte.links.y, 2) +
            Math.pow(auflagepunkte.rechts.z - auflagepunkte.links.z, 2)
        );
        
        // Verlängere die Schiene an beiden Seiten, um bündig mit Längsträger-Schienen zu sein
        // Die Längsträger-Schienen haben schienenBreite (70mm), wir müssen auf jeder Seite 35mm hinzufügen
        const seitlicheVerlaengerung = schienenBreite;  // Auf jeder Seite 70mm (halbe Breite links + halbe Breite rechts)
        const schienenLaenge = quertraegerLaenge + seitlicheVerlaengerung;

        const direction = new THREE.Vector3(
            auflagepunkte.rechts.x - auflagepunkte.links.x,
            auflagepunkte.rechts.y - auflagepunkte.links.y,
            auflagepunkte.rechts.z - auflagepunkte.links.z
        ).normalize();
        
        const centerX = (auflagepunkte.links.x + auflagepunkte.rechts.x) / 2;
        const centerY = (auflagepunkte.links.y + auflagepunkte.rechts.y) / 2;
        const centerZ = (auflagepunkte.links.z + auflagepunkte.rechts.z) / 2;
        
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);

        // Material (identisch zu Längsträger-L-Schienen)
        const material = new THREE.MeshStandardMaterial({
            color: 0xc8c8c8,
            metalness: 0.9,
            roughness: 0.15,
            envMapIntensity: 0.8,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });

        // Horizontaler Schenkel (auf dem Glas, läuft quer über die gesamte Breite)
        const horizontalGeom = new THREE.BoxGeometry(schienenLaenge, schienenHoehe, schienenBreite);
        const horizontalMesh = new THREE.Mesh(horizontalGeom, material.clone());
        
        // WICHTIG: Die Schiene wird als Child des Querträgers hinzugefügt
        // Daher sind die Positionen RELATIV zum Querträger-Mesh
        // Der Querträger hat seine Position bereits gesetzt
        // Wir brauchen nur die Höhe relativ zur Querträger-Oberkante
        const quertraegerProfil = this.profileKonfig.gibAktuellesProfil();
        const quertraegerHoehe = quertraegerProfil?.abmessungen?.breite || 0.1;
        
        // Relative Position: von Mitte des Querträgers zur Oberkante + Glas + Offset (tiefer)
        const relativY = (quertraegerHoehe / 2) + glasDicke + 0.002 + (schienenHoehe / 2);
        
        // Position: weiter nach VORNE versetzt (zur Terrassenseite)
        const tiefenOffset = schienenBreite / 2 + -0.04;  // 15mm weiter nach vorne
        
        horizontalMesh.position.set(0, relativY, tiefenOffset);
        
        // WICHTIG: Rotation für die Neigung des Pultdachs
        // Die Schiene muss sich mit der Dachneigung mitneigen (X-Achsen-Rotation)
        const neigungsWinkel = -(config.neigung * Math.PI / 180);  // Negativ, weil Dach nach hinten abfällt
        horizontalMesh.rotation.x = neigungsWinkel;
        
        horizontalMesh.castShadow = true;
        horizontalMesh.receiveShadow = true;
        horizontalMesh.renderOrder = 10;
        horizontalMesh.name = "L-Schiene-Horizontal_HintererQuertraeger";
        
        // Vertikaler Schenkel (an der Vorderseite, nach unten zeigend - 180° gedreht)
        const vertikalGeom = new THREE.BoxGeometry(schienenLaenge, vertikalerSchenkel, schienenHoehe);
        const vertikalMesh = new THREE.Mesh(vertikalGeom, material.clone());
        
        // Vertikaler Teil: Oberkante direkt an Unterkante des horizontalen Teils
        // Verschiebe höher, um die Lücke zu schließen
        const vertikalY = relativY + (schienenHoehe / 2) - 0.0125;  // Starte von Oberkante horizontal, gehe nach unten (kleinerer Versatz => höher)
        const vertikalZ = tiefenOffset + schienenBreite / 2 - schienenHoehe / 2;
        
        vertikalMesh.position.set(0, vertikalY, vertikalZ);
        vertikalMesh.rotation.x = neigungsWinkel;  // Gleiche Neigung wie horizontaler Teil
        vertikalMesh.castShadow = true;
        vertikalMesh.receiveShadow = true;
        vertikalMesh.renderOrder = 10;
        vertikalMesh.name = "L-Schiene-Vertikal_HintererQuertraeger";
        
        schienen.push(horizontalMesh, vertikalMesh);
        
        console.log("🔧 L-Schiene für hinteren Querträger erstellt:", {
            länge: schienenLaenge.toFixed(3),
            relativY: relativY.toFixed(3),
            vertikalY: vertikalY.toFixed(3),
            quertraegerHoehe: quertraegerHoehe.toFixed(3)
        });
        
        return schienen;
    }
    passeOberkanteFuerHinterenQuertraegerAn(e, t, r, n){
        if(!e||!e.attributes?.position)return;
        const s=e.attributes.position,
        i=t/2,
        a=Math.tan(n)*r;
        for(let e=0;
        e<s.count;
        e++){
            if(s.getY(e)<=0)continue;
            const t=s.getZ(e)<0,
            r=t?i-(t?a:0):i;
            s.setY(e, Math.max(r, -i))
        }
        s.needsUpdate=!0,
        e.computeVertexNormals(),
        e.computeBoundingBox(),
        e.computeBoundingSphere()
    }
    berechneQuertraegerOberkanteFuerZ(e, t, r, n){
        const s=e/2,
        i=Math.tan(r),
        a=n<0;
        return a?s-(a?i*t:0):s
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
    passeOberkanteFuerGlasUeberstandAn(e, t, r, n){
        if(!e||!e.attributes?.position)return;
        const s=e.attributes.position,
        i=t/2,
        a=r/2,
        o=Math.tan(n);
        for(let e=0;
        e<s.count;
        e++){
            if(s.getY(e)<=0)continue;
            const t=s.getZ(e),
            n=Math.max(0, a-t),
            u=i-o*Math.min(r, n);
            s.setY(e, Math.max(u, -i))
        }
        s.needsUpdate=!0,
        e.computeVertexNormals(),
        e.computeBoundingBox(),
        e.computeBoundingSphere()
    }
    erzeugeBlendblech(e, t, r, n, s, i, a){
        if(!Number.isFinite(n)||Math.abs(n)<1e-6)return null;
        const o=Math.tan(n),
        u=r,
        g=Math.abs(o*u);
        if(g<=.001)return null;
        const l=-r/2,
        h=r/2,
        c=t/2,
        f=c+g,
        p=-t/2,
        m=new Float32Array([-e/2, p, l, e/2, p, l, -e/2, p, h, e/2, p, h, -e/2, c, l, e/2, c, l, -e/2, f, h, e/2, f, h]),
        d=new THREE.BufferGeometry;
        d.setIndex([4, 5, 6, 5, 7, 6, 0, 2, 1, 1, 2, 3, 0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7, 0, 4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5]),
        d.setAttribute("position", new THREE.Float32BufferAttribute(m, 3)),
        d.computeVertexNormals();
        const b=s?.userData?.managedMaterial?s:MaterialManager.gibStrukturMaterial({
            teil:"quertraeger", config:this.konfiguration.gibAktuelleKonfiguration()
        }),
        k=new THREE.Mesh(d, b);
        return k.castShadow=!0,
        k.receiveShadow=!0,
        k.name="Keilstueck_hintererQuertraeger",
        {
            mesh:k,
            geometrie:d
        }
    }
    fuegeDebugLabelsHinzu(e, t){
        const r=(e, t, r="#ffffff")=>{
            const n=document.createElement("canvas"),
            s=n.getContext("2d");
            n.width=512,
            n.height=128,
            s.fillStyle=r,
            s.font="Bold 48px Arial",
            s.textAlign="center",
            s.fillText(e, 256, 80);
            const i=new THREE.CanvasTexture(n),
            a=new THREE.SpriteMaterial({
                map:i
            }),
            o=new THREE.Sprite(a);
            return o.position.copy(t),
            o.scale.set(.3, .075, 1),
            o
        };
        if(t.quertraegerOben){
            const n=r("Querträgeroberkante", t.quertraegerOben, "#ff0000");
            e.add(n)
        }
        if(t.laengstraegerOben){
            const n=r("Längsträgeroberkante", t.laengstraegerOben, "#00ff00");
            e.add(n)
        }
        if(t.keilHoehe){
            const n=r(`Keilhöhe: ${(1e3*t.keilHoehe).toFixed(1)}mm`, new THREE.Vector3(0, t.quertraegerOben.y+t.keilHoehe/2, 0), "#ffff00");
            e.add(n)
        }
    }
    berechneAuflagepunkteAufLaengstraegern(e, t){
        if(this.laengstraegerInstanz&&this.laengstraegerInstanz.berechneQuertraegerAuflagepunkte){
            const t=this.laengstraegerInstanz.berechneQuertraegerAuflagepunkte().find(t=>Math.abs(t.z-e.z)<.01);
            if(t)return{
                links:t.links,
                rechts:t.rechts
            }
        }
        return{
            links:e.links,
            rechts:e.rechts
        }
    }
    bestimmeQuertraegerTyp(e){
        return"vorne"===e?"vordererQuertraeger":"hinten"===e?"hintererQuertraeger":e.startsWith("zwischen")?"zwischenQuertraeger":"standardQuertraeger"
    }
    erstelleQuertraegerMaterial(e){
        return MaterialManager.gibStrukturMaterial({
            teil:"quertraeger", config:e
        })
    }
    berechneBefestigungspunkte(){
        const e=[];
        return this.quertraegerListe.forEach(t=>{
            const r=Math.ceil(t.abmessungen.laenge/1);
            for(let n=0;
            n<=r;
            n++){
                const s=r>0?n/r:0, i={
                    x:t.auflagepunkte.links.x+(t.auflagepunkte.rechts.x-t.auflagepunkte.links.x)*s, y:t.auflagepunkte.links.y+(t.auflagepunkte.rechts.y-t.auflagepunkte.links.y)*s+t.abmessungen.hoehe/2, z:t.auflagepunkte.links.z+(t.auflagepunkte.rechts.z-t.auflagepunkte.links.z)*s
                };
                e.push({
                    quertraeger:t.name, position:i, index:n, typ:"oberkante"
                })
            }
        }),
        e
    }
    entferneQuertraeger(){
        for(this.quertraegerListe.forEach(e=>{
            disposeEdgeHighlights(e.mesh);
            (Array.isArray(e.geometrie)?e.geometrie:[e.geometrie].filter(Boolean)).forEach(e=>{
                e?.dispose&&e.dispose()
            });
            const t=e.material, r=t?.userData?.managedMaterial;
            t?.dispose&&!r&&t.dispose()
        });
        this.quertraegerGruppe.children.length>0;)this.quertraegerGruppe.remove(this.quertraegerGruppe.children[0]);
        this.quertraegerListe=[]
    }
    gibQuertraeger(e){
        return this.quertraegerListe.find(t=>t.name===e)||null
    }
    gibQuertraegerNachPosition(e){
        return this.quertraegerListe.filter(t=>t.position===e||t.position.startsWith(e))
    }
    gibAlleQuertraeger(){
        return[...this.quertraegerListe]
    }
    aktualisiereQuertraeger(){
        return this.erstelleQuertraeger()
    }
    setzeProfil(e){
        return!!this.profileKonfig.setzeAktuellesProfil(e)&&(this.koordinatenSystem?.setzeProfil&&this.koordinatenSystem.setzeProfil(e), this.erstelleQuertraeger())
    }
    debugQuertraeger(){
        console.group("🏗️ QUERTRÄGER-INFORMATIONEN"),
        this.quertraegerListe.forEach(e=>{
            console.group(`Querträger: ${e.name}`), console.log("Position:", e.position), console.log("Auflagepunkte:", e.auflagepunkte), console.log("Abmessungen:", e.abmessungen), console.log("Eigenschaften:", e.eigenschaften), console.groupEnd()
        }),
        console.groupEnd()
    }
    dispose(){
        this.entferneQuertraeger()
    }
}
