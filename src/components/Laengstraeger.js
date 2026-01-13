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
export class Laengstraeger{
    constructor(e, t, r){
        this.koordinatenSystem=e,
        this.konfiguration=t,
        this.pfostenInstanz=r,
        this.profileKonfig=new ProfileKonfiguration,
        this.laengstraegerListe=[],
        this.laengstraegerGruppe=new THREE.Group,
        this.laengstraegerGruppe.name="LaengstraegerGruppe"
    }
    erstelleLaengstraeger(){
        this.entferneLaengstraeger();
        const e=this.konfiguration.gibAktuelleKonfiguration(),
        t=this.koordinatenSystem.gibReferenzpunkt("laengstraegerReferenz");
        if(!t)return console.warn("Keine Längsträger-Referenzpunkte gefunden"),
        this.laengstraegerGruppe;
        const r=[];
        return t.links&&r.push({
            name:"links", daten:t.links
        }),
        Array.isArray(t.zwischen)&&t.zwischen.forEach((e, t)=>{
            r.push({
                name:`mitte_${t+1}`, daten:e
            })
        }),
        t.rechts&&r.push({
            name:"rechts", daten:t.rechts
        }),
        r.forEach(t=>{
            const r=this.erstelleEinzelnenLaengstraeger(t.name, t.daten, e);
            r&&(this.laengstraegerListe.push(r), this.laengstraegerGruppe.add(r.mesh), r.glasSchienen && this.laengstraegerGruppe.add(r.glasSchienen))
        }),
        this.laengstraegerGruppe
    }
    erstelleEinzelnenLaengstraeger(e, t, r){
        if(!t?.start||!t?.ende)return console.warn(`Unvollständige Referenzpunkte für Längsträger (${e}).`),
        null;
        const n=Math.sqrt(Math.pow(t.ende.x-t.start.x, 2)+Math.pow(t.ende.y-t.start.y, 2)+Math.pow(t.ende.z-t.start.z, 2)),
        s="string"==typeof e&&!["links",
        "rechts"].includes(e.toLowerCase()),
        i="epdm"===r.dachTyp&&s?.02:0,
        a=this.profileKonfig.gibMitteltraegerProfil(r),
        g=s&&a?a:this.profileKonfig.gibAktuellesProfil(),
        o=g?.abmessungen||{},
        l=o.tiefe||0,
        h=o.breite||0;

        // Flachdach-Neigung für mittlere Träger
        let modStart = {...t.start};
        let modEnde = {...t.ende};

        // Flachdach erkennen: neigung === 0
        const istFlachdach = r.neigung === 0;

        // Debug: Prüfe Bedingungen
        console.log(`🔍 DEBUG Längsträger ${e}:`, {
            dachTyp: r.dachTyp,
            neigung: r.neigung,
            istFlachdach: istFlachdach,
            istMitteltraeger: s,
            name: e,
            bedingungErfuellt: istFlachdach && s
        });

        if(istFlachdach && s){
            // Der Querträger hat die gleiche Höhe wie der Hauptrahmen
            const quertraegerProfil = this.profileKonfig.gibAktuellesProfil();
            const quertraegerHoehe = quertraegerProfil?.abmessungen?.breite || 0;
            const istEPDM = r.dachTyp === "epdm";
            const istProfil200x100 = r?.pfostenProfil === "200x100x4" || quertraegerProfil?.id === "200x100x4";

            if(istEPDM) {
                if(istProfil200x100){
                    // Speziell für 200×100 + EPDM: Vorderkante absenken, um Folie/Mittelträger nach vorne zu senken
                    const absenkung = Math.max(quertraegerHoehe - h, 0);
                    if(t.start.z > t.ende.z) {
                        modEnde.y = t.ende.y - absenkung;
                        console.log(`✅ 🏗️ Flachdach-EPDM-Mittelträger ${e} (200×100): start=hinten, ende=vorne (ABSENKUNG vorne)`);
                    } else {
                        modStart.y = t.start.y - absenkung + 0.04;
                        console.log(`✅ 🏗️ Flachdach-EPDM-Mittelträger ${e} (200×100): start=vorne, ende=hinten (ABSENKUNG vorne)`);
                    }
                    console.log(`🏗️ Flachdach-EPDM-Mittelträger ${e} (200×100):`, {
                        startY: modStart.y,
                        endeY: modEnde.y,
                        startZ: t.start.z,
                        endeZ: t.ende.z,
                        hoehendifferenz: Math.abs(modStart.y - modEnde.y),
                        mitteltraegerHoehe: h,
                        quertraegerHoehe: quertraegerHoehe,
                        absenkung: absenkung,
                        istEPDM: true,
                        istProfil200x100
                    });
                } else {
                    // Bei EPDM-Folie (andere Profile): Mittelträger vorne HÖHER (bündig mit Unterkante Querträger)
                    const anhebung = quertraegerHoehe - h;

                    // Prüfe, welcher Punkt hinten (größeres Z) und welcher vorne (kleineres Z) ist
                    if(t.start.z > t.ende.z) {
                        modEnde.y = t.ende.y + anhebung;
                        console.log(`✅ 🏗️ Flachdach-EPDM-Mittelträger ${e}: start=hinten, ende=vorne (ANHEBUNG vorne)`);
                    } else {
                        modStart.y = t.start.y + anhebung - 0.1;
                        console.log(`✅ 🏗️ Flachdach-EPDM-Mittelträger ${e}: start=vorne, ende=hinten (ANHEBUNG vorne)`);
                    }

                    console.log(`🏗️ Flachdach-EPDM-Mittelträger ${e}:`, {
                        startY: modStart.y,
                        endeY: modEnde.y,
                        startZ: t.start.z,
                        endeZ: t.ende.z,
                        hoehendifferenz: Math.abs(modStart.y - modEnde.y),
                        mitteltraegerHoehe: h,
                        quertraegerHoehe: quertraegerHoehe,
                        anhebung: anhebung,
                        istEPDM: true
                    });
                }
            } else {
                // Bei Glas: Mittelträger neigen sich von hinten nach vorne (ABSENKEN)
                // Hinten (größeres Z): Oberkante Mittelträger = Oberkante Querträger (keine Änderung)
                // Vorne (kleineres Z): Unterkante Mittelträger = Unterkante Querträger
                const absenkung = quertraegerHoehe - h;

                // Prüfe, welcher Punkt hinten (größeres Z) und welcher vorne (kleineres Z) ist
                if(t.start.z > t.ende.z) {
                    // start ist hinten, ende ist vorne
                    // Vorne absenken
                    modEnde.y = t.ende.y - absenkung;
                    console.log(`✅ 🏗️ Flachdach-Glas-Mittelträger ${e}: start=hinten, ende=vorne (ABSENKUNG vorne)`);
                } else {
                    // ende ist hinten, start ist vorne
                    // Vorne absenken
                    modStart.y = t.start.y - absenkung;
                    console.log(`✅ 🏗️ Flachdach-Glas-Mittelträger ${e}: start=vorne, ende=hinten (ABSENKUNG vorne)`);
                }

                console.log(`🏗️ Flachdach-Glas-Mittelträger ${e}:`, {
                    startY: modStart.y,
                    endeY: modEnde.y,
                    startZ: t.start.z,
                    endeZ: t.ende.z,
                    hoehendifferenz: Math.abs(modStart.y - modEnde.y),
                    mitteltraegerHoehe: h,
                    quertraegerHoehe: quertraegerHoehe,
                    absenkung: absenkung,
                    istEPDM: false
                });
            }
        }

        const {
            geometrie:u,
            center:f
        }
        =this.erzeugeLaengstraegerGeometrie(modStart, modEnde, l, h),
        p=this.erstelleLaengstraegerMaterial(r),
        c=new THREE.Mesh(u, p);
        c.position.set(f.x, f.y-i, f.z),
        c.castShadow=!0,
        c.receiveShadow=!0,
        c.name=`Laengstraeger_${e}`;

        // Glasführungsschienen (Aluprofile) für innere Längsträger bei Glas-Dächern
        const glasSchienen = this.erzeugeGlasfuehrungsschienen(e, s, modStart, modEnde, r);
        
        // L-förmige Schienen für äußere Längsträger (nur bei Pultdach)
        const istRahmen = ["links", "rechts"].includes(e.toLowerCase());
        const lSchienen = this.erzeugeLFoermigeSchienen(e, istRahmen, modStart, modEnde, r);
        
        const schienenGruppe = new THREE.Group();
        schienenGruppe.name = `Glasschienen_${e}`;
        if(glasSchienen && glasSchienen.length > 0){
            glasSchienen.forEach(schiene => schienenGruppe.add(schiene));
        }
        if(lSchienen && lSchienen.length > 0){
            lSchienen.forEach(schiene => schienenGruppe.add(schiene));
        }

        // Flachdach: Nur innere Längsträger hinten um 8mm absenken (Mesh-Geometrie, Referenzpunkte bleiben unverändert)
        if(istFlachdach && s){
            const posAttr = u.attributes.position;
            if(posAttr?.array){
                const arr = posAttr.array;
                // Finde das hintere Ende (größeres Z in lokalen Koordinaten relativ zum Center)
                const zielZ = Math.max(modStart.z, modEnde.z);
                const lokalZielZ = zielZ - f.z; // Umrechnung in lokale Geometrie-Koordinaten

                console.log(`🔧 Absenkung Längsträger ${e}:`, {
                    istFlachdach,
                    istMitteltraeger: s,
                    weltZielZ: zielZ,
                    lokalZielZ: lokalZielZ,
                    centerZ: f.z
                });

                let verticesGefunden = 0;
                for(let idx=0; idx<arr.length; idx+=3){
                    const lokalZ = arr[idx+2]; // Z in lokalen Geometrie-Koordinaten
                    // Prüfe ob dieser Vertex am hinteren Ende ist (mit größerer Toleranz)
                    if(Math.abs(lokalZ - lokalZielZ) < 0.01){
                        arr[idx+1] -= 0.008; // 8mm nach unten
                        verticesGefunden++;
                    }
                }
                console.log(`  ✅ ${verticesGefunden} Vertices am hinteren Ende um 8mm abgesenkt`);

                posAttr.needsUpdate=!0;
                u.computeVertexNormals();
            }
        }

        return{
            name:e,
            mesh:c,
            glasSchienen:schienenGruppe,
            geometrie:u,
            material:p,
            referenzpunkte:{
                start:{
                    ...modStart
                },
                ende:{
                    ...modEnde
                },
                mittelpunkt:{
                    ...f
                }
            },
            abmessungen:{
                laenge:n,
                breite:l,
                hoehe:h
            },
            eigenschaften:{
                neigungswinkel:t.neigungswinkel,
                neigungGrad:180*t.neigungswinkel/Math.PI,
                seite:e
            }
        }
    }
    erstelleInnerenLaengstraeger(e){
        const t=this.konfiguration.berechneAbhaengigeWerte(),
        r=this.profileKonfig.gibAktuellesProfil(),
        n=this.profileKonfig.gibMitteltraegerProfil(e)||r,
        s=r?.abmessungen?.tiefe?r.abmessungen.tiefe/2:0,
        i=r?.abmessungen?.breite||0,
        a=n?.abmessungen?.breite||0,
        g=Math.max(i-a, 0),
        o=e.breite/2,
        l={
            start:{
                x:o,
                y:t.vordereHoehe+g,
                z:s
            },
            ende:{
                x:o,
                y:t.hintereHoehe+g,
                z:e.tiefe-s
            },
            neigungswinkel:Math.atan2(t.hoehenDifferenz, e.tiefe)
        };
        return this.erstelleEinzelnenLaengstraeger("mitte", l, e)
    }
    erzeugeGlasfuehrungsschienen(traegerName, istMitteltraeger, startPunkt, endPunkt, config){
        // Nur für innere Längsträger (Mittelträger) und nur bei Glas-Dächern
        if(!istMitteltraeger || config.dachTyp === "epdm"){
            return [];
        }

        console.log(`✅ Erstelle Glasführungsschienen für ${traegerName}`);
        const schienen = [];
        
        // Dimensionen der Glasführungsschiene - gut sichtbar
        const schienenBreite = 0.070;  // 70mm breit
        const schienenHoehe = 0.01;   // 10mm (1cm) dick
        const glasDicke = 0.008;       // 8mm Glasdicke
        
        // Berechne Schienenlänge = Länge der Gläser
        // Gläser gehen von vorne (mit Überstand) bis zum hinteren Querträger
        const profilTiefe = this.profileKonfig.gibAktuellesProfil()?.abmessungen?.tiefe || 0.08;
        const glasUeberstand = config.regenwasserAbfluss === "glasueberstand" ? 0.10 : -0.03;  // 10cm bei Glasüberstand, 5cm bei Rinne
        
        // Glaslänge = Tiefe - halbes Profil vorne + Überstand
        // Bei "Mit Rinne": Glas geht von Querträger-Mitte (0.04m) bis ganz hinten
        // Bei "Glasüberstand": zusätzlich +10cm nach vorne
        const glasLaengeOhneUeberstand = config.tiefe - profilTiefe / 2;
        let verlängerungVorne = profilTiefe / 2 + glasUeberstand;
        if(config.neigung > 0 && config.regenwasserAbfluss === "glasueberstand"){
            const rahmenBreite = this.profileKonfig.gibAktuellesProfil()?.abmessungen?.breite || 0.16;
            if (Math.abs(rahmenBreite - 0.12) < 0.002) {
                verlängerungVorne += 0; // 35mm nach vorn für 120×80
            } else if (Math.abs(rahmenBreite - 0.16) < 0.002) {
                verlängerungVorne += 0.; // 50mm nach vorn für 160×80
            } else if (Math.abs(rahmenBreite - 0.20) < 0.002) {
                verlängerungVorne += 0.00; // 70mm nach vorn für 200×100
            } else {
                verlängerungVorne += 0.035; // Standardzuschlag
            }
        }
        
        // Original Längsträger-Länge
        const laengstraegerLaenge = Math.sqrt(
            Math.pow(endPunkt.x - startPunkt.x, 2) +
            Math.pow(endPunkt.y - startPunkt.y, 2) +
            Math.pow(endPunkt.z - startPunkt.z, 2)
        );
        
        // Profil-spezifische Verlängerung für Pultdach (200×100 Profile brauchen längere Schienen)
        let zusaetzlicheVerlaengerung = 0; // symmetrische Verlängerung aktuell nicht nötig
        
        // Schienen-Tiefe = Längsträger + Verlängerung vorne + profil-spezifische Verlängerung
        const schienenTiefe = laengstraegerLaenge + verlängerungVorne + zusaetzlicheVerlaengerung;

        // Richtungsvektor
        const direction = new THREE.Vector3(
            endPunkt.x - startPunkt.x,
            endPunkt.y - startPunkt.y,
            endPunkt.z - startPunkt.z
        ).normalize();
        
        // Bestimme welcher Punkt vorne ist (kleineres Z)
        const istStartVorne = startPunkt.z < endPunkt.z;
        const vordererPunkt = istStartVorne ? startPunkt : endPunkt;
        const hintererPunkt = istStartVorne ? endPunkt : startPunkt;
        
        // Verlängere den vorderen Punkt nach vorne
        const verlängerterVorderpunkt = {
            x: vordererPunkt.x + (istStartVorne ? -direction.x : direction.x) * verlängerungVorne,
            y: vordererPunkt.y + (istStartVorne ? -direction.y : direction.y) * verlängerungVorne,
            z: vordererPunkt.z + (istStartVorne ? -direction.z : direction.z) * verlängerungVorne
        };
        
        // Bei Flachdach mit Glas: Hinterer Punkt 8mm absenken (genau wie bei den Gläsern)
        const hintererPunktAdjusted = {...hintererPunkt};
        if(config.neigung === 0 && config.dachTyp === "glas") {
            hintererPunktAdjusted.y -= 0.008;  // 8mm Absenkung hinten
        }

        // Mittelpunkt zwischen verlängertem Vorderpunkt und (ggf. abgesenktem) hinterem Punkt
        const centerX = (verlängerterVorderpunkt.x + hintererPunktAdjusted.x) / 2;
        const centerY = (verlängerterVorderpunkt.y + hintererPunktAdjusted.y) / 2;
        const centerZ = (verlängerterVorderpunkt.z + hintererPunktAdjusted.z) / 2;
        
        // Richtung NEU berechnen mit abgesenkten Y-Werten für korrekte Rotation
        const actualDirection = new THREE.Vector3(
            hintererPunktAdjusted.x - verlängerterVorderpunkt.x,
            hintererPunktAdjusted.y - verlängerterVorderpunkt.y,
            hintererPunktAdjusted.z - verlängerterVorderpunkt.z
        ).normalize();
        
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), actualDirection);

        // Hauptkörper der Schiene - gut sichtbar
        const schieneGeometry = new THREE.BoxGeometry(schienenBreite, schienenHoehe, schienenTiefe);
        const schieneMaterial = new THREE.MeshStandardMaterial({
            color: 0xc8c8c8,  // Mittelgraues Aluminium für guten Kontrast
            metalness: 0.9,
            roughness: 0.15,
            envMapIntensity: 0.8,
            // Polygon Offset um Z-Fighting zu vermeiden
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });

        const schieneMesh = new THREE.Mesh(schieneGeometry, schieneMaterial);
        
        // Positionierung: AUF der Glasoberfläche
        // WICHTIG: Bei unterschiedlichen Profilhöhen muss die Schiene angepasst werden
        
        const rahmenProfil = this.profileKonfig.gibAktuellesProfil();
        const laengstraegerProfil = this.profileKonfig.gibMitteltraegerProfil(config) || rahmenProfil;
        const rahmenHoehe = rahmenProfil?.abmessungen?.breite || 0.16;
        const laengstraegerHoehe = laengstraegerProfil?.abmessungen?.breite || 0.1;
        
        // Berechne die Profil-Differenz
        const profilDifferenz = rahmenHoehe - laengstraegerHoehe;
        
        // Oberkante des Mittelträgers
        const laengstraegerOberkante = centerY + (laengstraegerHoehe / 2);
        
        // Spezialfall: Flachdach + Glas + spezifische Profilkombinationen
        let zusaetzlicheAbsenkung = 0;
        if(config.neigung === 0 && config.dachTyp === "glas") {
            // NUR für 160x80 Rahmenprofil + 100x80 Mittelträger
            if(rahmenHoehe >= 0.159 && rahmenHoehe <= 0.161 && profilDifferenz >= 0.059) {
                zusaetzlicheAbsenkung = 0.010;  // 10mm zusätzlich absenken
            }
            // NUR für 120x80 Rahmenprofil (unabhängig vom Mittelträger)
            else if(rahmenHoehe >= 0.119 && rahmenHoehe <= 0.121) {
                zusaetzlicheAbsenkung = 0.020;  // 20mm zusätzlich absenken
            }
            // NUR für 200x100 Rahmenprofil -> weiter nach unten
            else if(rahmenHoehe >= 0.199 && rahmenHoehe <= 0.201) {
                zusaetzlicheAbsenkung = -0.02;  // 30mm zusätzlich absenken
            }
        }
        
        // Pultdach: Profil-spezifische Anpassungen für korrekte Glasauflage
        let pultdachOffset = 0.061;  // Standard-Offset
        if(config.neigung > 0) {  // Nur bei Pultdach
            if(Math.abs(laengstraegerHoehe - 0.12) < 0.001) {
                // 120×80 Mittelträger (160×80→120×80): RICHTIG - als Referenz
                pultdachOffset = 0.060;  // <<<< HIER ÄNDERN für 120×80
            } else if(Math.abs(laengstraegerHoehe - 0.10) < 0.001) {
                // 100×80 Mittelträger (160×80→100×80): zu hoch
                pultdachOffset = 0.050;  // <<<< HIER ÄNDERN für 100×80 (etwas tiefer als 120x80)
            } else if(Math.abs(laengstraegerHoehe - 0.08) < 0.001) {
                // 80×60 Mittelträger (120×80 Standard): zu hoch
                pultdachOffset = 0.040;  // <<<< HIER ÄNDERN für 80×60
            } else {
                // Andere Profile (z.B. 200×100)
                pultdachOffset = 0.080;  // <<<< HIER ÄNDERN für andere (höher)
            }
        }
        
        const basisOffset = config.neigung > 0 ? pultdachOffset : 0.061;
        const glasOberkanteY = laengstraegerOberkante + glasDicke + basisOffset - zusaetzlicheAbsenkung;
        const schienenCenterY = glasOberkanteY + (schienenHoehe / 2);

        schieneMesh.position.set(centerX, schienenCenterY, centerZ);
        schieneMesh.quaternion.copy(quaternion);
        schieneMesh.castShadow = true;
        schieneMesh.receiveShadow = true;
        schieneMesh.name = `Glasfuehrungsschiene_${traegerName}`;
        
        // Z-Fighting vermeiden: Schiene muss ÜBER dem Glas gerendert werden
        schieneMesh.renderOrder = 10;  // Höher als Glas (Glas hat renderOrder = 5)
        schieneMaterial.depthWrite = true;
        schieneMaterial.depthTest = true;

        // Dezente Nuten/Kanäle hinzufügen (simuliert die Rillen im Profil)
        const nutBreite = 0.008;  // 8mm
        const nutHoehe = 0.002;   // 2mm tief
        const nutAbstand = 0.018; // 18mm zwischen den Nuten
        
        for(let i = -1; i <= 1; i++){
            const nutGeometry = new THREE.BoxGeometry(nutBreite, nutHoehe, schienenTiefe * 0.98);
            const nutMaterial = new THREE.MeshStandardMaterial({
                color: 0x808080,
                metalness: 0.5,
                roughness: 0.6
            });
            const nut = new THREE.Mesh(nutGeometry, nutMaterial);
            
            // Position relativ zur Schiene (lokale Koordinaten)
            const lokalX = i * nutAbstand;
            const lokalY = schienenHoehe / 2 - nutHoehe / 2;  // Auf der Oberseite
            
            // Weltkoordinaten unter Berücksichtigung der Rotation
            const lokalPos = new THREE.Vector3(lokalX, lokalY, 0);
            lokalPos.applyQuaternion(quaternion);
            
            nut.position.set(
                centerX + lokalPos.x,
                schienenCenterY + lokalPos.y,
                centerZ + lokalPos.z
            );
            nut.quaternion.copy(quaternion);
            nut.castShadow = false;
            nut.receiveShadow = true;
            nut.name = `Nut_${traegerName}_${i}`;
            nut.renderOrder = 11;  // Noch höher als die Hauptschiene
            
            schienen.push(nut);
        }

        schienen.unshift(schieneMesh); // Hauptschiene an den Anfang
        
        return schienen;
    }
    erzeugeLFoermigeSchienen(traegerName, istRahmen, startPunkt, endPunkt, config){
        // Nur für äußere Längsträger (links/rechts) und nur bei Pultdach mit Glas
        if(!istRahmen || config.neigung === 0 || config.dachTyp === "epdm"){
            return [];
        }

        const schienen = [];
        
        // Dimensionen der L-Schiene
        const schienenBreite = 0.070;  // 70mm breit (horizontaler Teil auf Glas)
        const schienenHoehe = 0.010;   // 10mm dick
        const vertikalerSchenkel = 0.008;  // 8mm hoch - wie Glasdicke, bündig mit Oberseite
        const glasDicke = 0.008;
        
        // Berechne Länge wie bei den inneren Schienen
        const profilTiefe = this.profileKonfig.gibAktuellesProfil()?.abmessungen?.tiefe || 0.08;
        // ANPASSUNG: Bei "Mit Rinne" muss glasUeberstand negativ sein, damit Schienen gleich lang wie innere sind
        const glasUeberstand = config.regenwasserAbfluss === "glasueberstand" ? 0.10 : -0.03;  // -30mm bei Rinne (wie innere Schienen)
        let verlängerungVorne = profilTiefe / 2 + glasUeberstand;
        if(config.neigung > 0 && config.regenwasserAbfluss === "glasueberstand"){
            const rahmenBreite = this.profileKonfig.gibAktuellesProfil()?.abmessungen?.breite || 0.16;
            if (Math.abs(rahmenBreite - 0.12) < 0.002) {
                verlängerungVorne += 0.0; // 35mm nach vorn für 120×80
            } else if (Math.abs(rahmenBreite - 0.16) < 0.002) {
                verlängerungVorne += 0.00; // 50mm nach vorn für 160×80
            } else if (Math.abs(rahmenBreite - 0.20) < 0.002) {
                verlängerungVorne += 0.00; // 70mm nach vorn für 200×100
            } else {
                verlängerungVorne += 0.; // Standardzuschlag
            }
        }
        
        // Verlängerung nach hinten, um die Lücke mit der Querträger-L-Schiene zu schließen
        const verlängerungHinten = 0.070;  // 70mm nach hinten verlängern (Breite der Querträger-L-Schiene)
        
        const laengstraegerLaenge = Math.sqrt(
            Math.pow(endPunkt.x - startPunkt.x, 2) +
            Math.pow(endPunkt.y - startPunkt.y, 2) +
            Math.pow(endPunkt.z - startPunkt.z, 2)
        );
        
        const schienenTiefe = laengstraegerLaenge + verlängerungVorne + verlängerungHinten;

        const direction = new THREE.Vector3(
            endPunkt.x - startPunkt.x,
            endPunkt.y - startPunkt.y,
            endPunkt.z - startPunkt.z
        ).normalize();
        
        const istStartVorne = startPunkt.z < endPunkt.z;
        const vordererPunkt = istStartVorne ? startPunkt : endPunkt;
        const hintererPunkt = istStartVorne ? endPunkt : startPunkt;
        
        const verlängerterVorderpunkt = {
            x: vordererPunkt.x + (istStartVorne ? -direction.x : direction.x) * verlängerungVorne,
            y: vordererPunkt.y + (istStartVorne ? -direction.y : direction.y) * verlängerungVorne,
            z: vordererPunkt.z + (istStartVorne ? -direction.z : direction.z) * verlängerungVorne
        };
        
        // Verlängere auch nach hinten
        const verlängerterHinterpunkt = {
            x: hintererPunkt.x + (istStartVorne ? direction.x : -direction.x) * verlängerungHinten,
            y: hintererPunkt.y + (istStartVorne ? direction.y : -direction.y) * verlängerungHinten,
            z: hintererPunkt.z + (istStartVorne ? direction.z : -direction.z) * verlängerungHinten
        };
        
        // Bei Flachdach mit Glas: Hinterer Punkt 8mm absenken (wie bei den Gläsern)
        if(config.neigung === 0 && config.dachTyp === "glas") {
            verlängerterHinterpunkt.y -= 0.008;
        }

        const centerX = (verlängerterVorderpunkt.x + verlängerterHinterpunkt.x) / 2;
        const centerY = (verlängerterVorderpunkt.y + verlängerterHinterpunkt.y) / 2;
        const centerZ = (verlängerterVorderpunkt.z + verlängerterHinterpunkt.z) / 2;
        
        // WICHTIG: Bei Flachdach direction NEU berechnen mit den abgesenkten Y-Werten
        const actualDirection = new THREE.Vector3(
            verlängerterHinterpunkt.x - verlängerterVorderpunkt.x,
            verlängerterHinterpunkt.y - verlängerterVorderpunkt.y,
            verlängerterHinterpunkt.z - verlängerterVorderpunkt.z
        ).normalize();
        
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), actualDirection);
        
        // Bei Flachdach: Berechne die tatsächliche Neigung der Gläser (8mm Absenkung hinten)
        // NICHT MEHR NÖTIG - die Rotation ist bereits in actualDirection/quaternion enthalten
        let zusaetzlicherNeigungswinkel = 0;
        /*
        if(config.neigung === 0 && config.dachTyp === "glas") {
            // Flachdach mit Glas hat eine leichte Neigung: 8mm Absenkung hinten
            const absenkungHinten = 0.008;
            const effektiveTiefe = laengstraegerLaenge;
            zusaetzlicherNeigungswinkel = Math.atan2(absenkungHinten, effektiveTiefe);
            console.log(`🔧 Flachdach L-Schiene ${traegerName}: Zusätzliche Neigung ${(zusaetzlicherNeigungswinkel * 180 / Math.PI).toFixed(3)}°`);
        }
        */

        // L-Form aus zwei Teilen: horizontaler + vertikaler Schenkel
        const material = new THREE.MeshStandardMaterial({
            color: 0xc8c8c8,
            metalness: 0.9,
            roughness: 0.15,
            envMapIntensity: 0.8,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });

        // Horizontaler Schenkel (auf dem Glas)
        const horizontalGeom = new THREE.BoxGeometry(schienenBreite, schienenHoehe, schienenTiefe);
        const horizontalMesh = new THREE.Mesh(horizontalGeom, material.clone());
        
        const laengstraegerProfil = this.profileKonfig.gibAktuellesProfil();
        const laengstraegerHoehe = laengstraegerProfil?.abmessungen?.breite || 0.1;
        
        // Profil-spezifische Offsets NUR für Pultdach (Flachdach bleibt unverändert)
        let pultdachOffset = 0.08;  // Standard-Offset (aktuell für Flachdach)
        
        if (config.neigung > 0) {  // Nur bei Pultdach (neigung > 0)
            // Bei Pultdach: Profil-abhängige Offsets für korrekte Glasauflage
            if (Math.abs(laengstraegerHoehe - 0.12) < 0.001) {
                // 120×80 Profil (160×80→120×80 Mittelträger): RICHTIG - als Referenz
                pultdachOffset = 0.06;  // 15mm tiefer als Basis
            } else if (Math.abs(laengstraegerHoehe - 0.10) < 0.001) {
                // 100×80 Profil (160×80→100×80 Mittelträger): zu hoch
                pultdachOffset = -0.035;  // 35mm tiefer als Basis
            } else if (Math.abs(laengstraegerHoehe - 0.08) < 0.001) {
                // 80×60 Profil (120×80 Standard): zu hoch
                pultdachOffset = -0.015;  // 15mm tiefer als Basis
            } else if (Math.abs(laengstraegerHoehe) < 0.001) {
                // 160×80 Profil (äußere Rahmen): Anpassung
                pultdachOffset = -0.015;  // 15mm tiefer als Basis
            } else if (Math.abs(laengstraegerHoehe - 0.20) < 0.001) {
                // 200×100 Profil: zu niedrig
                pultdachOffset = 0.1;  // 5mm höher als Basis
            }
        }
        
        // Berechne Y-Position einheitlich - die 8mm Absenkung ist bereits in centerY eingerechnet
        const laengstraegerOberkante = centerY + (laengstraegerHoehe / 2);
        const basisY = laengstraegerOberkante + glasDicke + pultdachOffset + (schienenHoehe / 2);
        
        // Position: zur Seite versetzt (links oder rechts)
        const istLinks = traegerName === "links";
        const seitlicherOffset = istLinks ? -schienenBreite / 2 : schienenBreite / 2;
        
        horizontalMesh.position.set(centerX, basisY, centerZ);
        horizontalMesh.quaternion.copy(quaternion);
        
        // NICHT MEHR NÖTIG - Rotation bereits in quaternion enthalten
        /*
        // Bei Flachdach: Zusätzliche X-Rotation für die Neigung der Gläser
        if(zusaetzlicherNeigungswinkel !== 0) {
            const currentRotation = new THREE.Euler().setFromQuaternion(horizontalMesh.quaternion);
            currentRotation.x += zusaetzlicherNeigungswinkel;
            horizontalMesh.quaternion.setFromEuler(currentRotation);
        }
        */
        
        horizontalMesh.castShadow = true;
        horizontalMesh.receiveShadow = true;
        horizontalMesh.renderOrder = 10;
        horizontalMesh.name = `L-Schiene-Horizontal_${traegerName}`;
        
        // Vertikaler Schenkel (an der Seite, nach unten zeigend wie echtes L-Profil)
        const vertikalGeom = new THREE.BoxGeometry(schienenHoehe, vertikalerSchenkel, schienenTiefe);
        const vertikalMesh = new THREE.Mesh(vertikalGeom, material.clone());
        
        // Vertikaler Teil: Nach UNTEN vom horizontalen Teil (echte L-Form)
        // Y-Position: Unterseite des horizontalen Teils - halbe Höhe des vertikalen Teils
        const vertikalY = (basisY - schienenHoehe / 2) - vertikalerSchenkel / 2;
        const vertikalX = centerX + (istLinks ? -schienenBreite / 2 + schienenHoehe / 2 : schienenBreite / 2 - schienenHoehe / 2);
        
        vertikalMesh.position.set(vertikalX, vertikalY, centerZ);
        vertikalMesh.quaternion.copy(quaternion);
        
        // NICHT MEHR NÖTIG - Rotation bereits in quaternion enthalten
        /*
        // Bei Flachdach: Zusätzliche X-Rotation für die Neigung der Gläser (gleich wie horizontal)
        if(zusaetzlicherNeigungswinkel !== 0) {
            const currentRotation = new THREE.Euler().setFromQuaternion(vertikalMesh.quaternion);
            currentRotation.x += zusaetzlicherNeigungswinkel;
            vertikalMesh.quaternion.setFromEuler(currentRotation);
        }
        */
        vertikalMesh.castShadow = true;
        vertikalMesh.receiveShadow = true;
        vertikalMesh.renderOrder = 10;
        vertikalMesh.name = `L-Schiene-Vertikal_${traegerName}`;
        
        schienen.push(horizontalMesh, vertikalMesh);
        
        return schienen;
    }
    erzeugeLaengstraegerGeometrie(e, t, r, n){
        const s=e.y,
        i=t.y,
        a=s+n,
        g=i+n,
        o=e.x-r/2,
        l=e.x+r/2,
        h=t.x-r/2,
        u=t.x+r/2,
        f=1e-4,
        p=e.z-f,
        c=t.z+f,
        m=[o,
        s,
        p,
        l,
        s,
        p,
        l,
        a,
        p,
        o,
        a,
        p,
        h,
        i,
        c,
        u,
        i,
        c,
        u,
        g,
        c,
        h,
        g,
        c],
        d=[],
        k=[],
        z=[];
        for(let e=0;
        e<m.length;
        e+=3)d.push(m[e]),
        k.push(m[e+1]),
        z.push(m[e+2]);
        const b={
            x:(Math.min(...d)+Math.max(...d))/2,
            y:(Math.min(...k)+Math.max(...k))/2,
            z:(Math.min(...z)+Math.max(...z))/2
        },
        L=new Float32Array(m.length);
        for(let e=0;
        e<m.length;
        e+=3)L[e]=m[e]-b.x,
        L[e+1]=m[e+1]-b.y,
        L[e+2]=m[e+2]-b.z;
        const M=new THREE.BufferGeometry;
        return M.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 3, 2, 6, 3, 6, 7, 0, 5, 1, 0, 4, 5, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2]),
        M.setAttribute("position", new THREE.Float32BufferAttribute(L, 3)),
        M.computeVertexNormals(),
        M.computeBoundingBox(),
        M.computeBoundingSphere(),
        {
            geometrie:M,
            center:b
        }
    }
    erstelleLaengstraegerMaterial(e){
        return MaterialManager.gibStrukturMaterial({
            teil:"laengstraeger", config:e
        })
    }
    berechneQuertraegerAuflagepunkte(){
        this.konfiguration.gibAktuelleKonfiguration();
        const e=this.koordinatenSystem.gibReferenzpunkt("quertraegerReferenz"),
        t=[];
        return e?(e.forEach(e=>{
            const r=this.berechneQuertraegerKontaktZ(e), n=this.berechneAuflagepunktAufLaengstraeger("links", r), s=this.berechneAuflagepunktAufLaengstraeger("rechts", r);
            n&&s&&t.push({
                position:e.position, z:e.z, links:n, rechts:s, hoehe:e.hoehe
            })
        }), t):t
    }
    berechneQuertraegerKontaktZ(e){
        const t=this.profileKonfig.gibAktuellesProfil(),
        r=t?.abmessungen?.tiefe?t.abmessungen.tiefe/2:0;
        return"vorne"===e.position?e.z+r:"hinten"===e.position?e.z-r:e.z
    }
    berechneAuflagepunktAufLaengstraeger(e, t){
        const r=this.gibLaengstraeger(e);
        if(!r)return null;
        const n=r.referenzpunkte;
        if(!n?.start||!n?.ende)return null;
        const s=n.start.z,
        i=n.ende.z-s,
        a=0!==i?(t-s)/i:0,
        g=(e, t)=>e+(t-e)*a;
        return{
            x:g(n.start.x, n.ende.x),
            y:g(n.start.y, n.ende.y),
            z:t
        }
    }
    entferneLaengstraeger(){
        for(this.laengstraegerListe.forEach(e=>{
            disposeEdgeHighlights(e.mesh), e.geometrie.dispose();
            const t=e.material, r=t?.userData?.managedMaterial;
            t?.dispose&&!r&&t.dispose();
            
            // Glasführungsschienen entfernen
            if(e.glasSchienen){
                e.glasSchienen.traverse(child => {
                    if(child.geometry) child.geometry.dispose();
                    if(child.material) child.material.dispose();
                });
            }
        });
        this.laengstraegerGruppe.children.length>0;)this.laengstraegerGruppe.remove(this.laengstraegerGruppe.children[0]);
        this.laengstraegerListe=[]
    }
    gibLaengstraeger(e){
        return this.laengstraegerListe.find(t=>t.name===e)||null
    }
    gibAlleLaengstraeger(){
        return[...this.laengstraegerListe]
    }
    aktualisiereLaengstraeger(){
        return this.erstelleLaengstraeger()
    }
    setzeProfil(e){
        return!!this.profileKonfig.setzeAktuellesProfil(e)&&(this.koordinatenSystem?.setzeProfil&&this.koordinatenSystem.setzeProfil(e), this.erstelleLaengstraeger())
    }
    debugLaengstraeger(){
        console.group("🏗️ LÄNGSTRÄGER-INFORMATIONEN"),
        this.laengstraegerListe.forEach(e=>{
            console.group(`Längsträger: ${e.name}`), console.log("Referenzpunkte:", e.referenzpunkte), console.log("Abmessungen:", e.abmessungen), console.log("Eigenschaften:", e.eigenschaften), console.groupEnd()
        }),
        console.groupEnd()
    }
    dispose(){
        this.entferneLaengstraeger()
    }
}
