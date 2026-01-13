export const RAHMEN_PROFILE={
    "160x80x4":{
        id:"160x80x4",
        name:"Standard 160×80×4",
        beschreibung:"Standardprofil für normale Pergolas mit 100×80 Mittelträgern",
        abmessungen:{
            breite:.16,
            tiefe:.08,
            wandstaerke:.004
        },
        material:{
            typ:"aluminium",
            gewichtProMeter:1.67,
            tragfaehigkeit:"hoch"
        },
        eigenschaften:{
            standard:!0,
            empfohlenFuer:["pergola",
            "terrassendach",
            "carport"],
            maxSpannweite:6,
            maxHoehe:4,
            mitteltraegerProfil:"100x80x4"
        },
        kosten:{
            kategorie:"standard",
            relativerPreis:1
        }
    },
    "200x100x4":{
        id:"200x100x4",
        name:"Verstärkt 200×100×4",
        beschreibung:"Verstärktes Profil für größere Konstruktionen",
        abmessungen:{
            breite:.2,
            tiefe:.1,
            wandstaerke:.004
        },
        material:{
            typ:"aluminium",
            gewichtProMeter:2.35,
            tragfaehigkeit:"sehr_hoch"
        },
        eigenschaften:{
            standard:!0,
            empfohlenFuer:["grosse_pergola",
            "gewerblich",
            "windlast_hoch"],
            maxSpannweite:8,
            maxHoehe:5,
            mitteltraegerProfil:"120x80x4"
        },
        kosten:{
            kategorie:"premium",
            relativerPreis:1.5
        }
    },
    "100x80x4":{
        id:"100x80x4",
        name:"Mittelträger 100×80×4",
        beschreibung:"Spezialprofil für mittlere Quer- und Längsträger",
        abmessungen:{
            breite:.1,
            tiefe:.08,
            wandstaerke:.004
        },
        material:{
            typ:"aluminium",
            gewichtProMeter:1.2,
            tragfaehigkeit:"mittel"
        },
        eigenschaften:{
            standard:!1,
            empfohlenFuer:["mitteltraeger",
            "pergola"],
            maxSpannweite:5,
            maxHoehe:4
        },
        kosten:{
            kategorie:"standard",
            relativerPreis:.8
        }
    },
    "120x80x4":{
        id:"120x80x4",
        name:"Kompakt 120×80×4",
        beschreibung:"Kompaktprofil für Pfosten und Rahmenträger mit 80×40 Mittelträgern",
        abmessungen:{
            breite:.12,
            tiefe:.08,
            wandstaerke:.004
        },
        material:{
            typ:"aluminium",
            gewichtProMeter:1.43,
            tragfaehigkeit:"mittel-hoch"
        },
        eigenschaften:{
            standard:!0,
            empfohlenFuer:["pergola",
            "terrassendach",
            "kleine_konstruktion"],
            maxSpannweite:5.5,
            maxHoehe:4,
            mitteltraegerProfil:"80x40x4"
        },
        kosten:{
            kategorie:"economy",
            relativerPreis:.85
        }
    },
    "80x40x4":{
        id:"80x40x4",
        name:"Mittelträger 80×40×4",
        beschreibung:"Spezialprofil für mittlere Quer- und Längsträger bei 120×80 Rahmen",
        abmessungen:{
            breite:.08,
            tiefe:.04,
            wandstaerke:.004
        },
        material:{
            typ:"aluminium",
            gewichtProMeter:.91,
            tragfaehigkeit:"mittel"
        },
        eigenschaften:{
            standard:!1,
            empfohlenFuer:["mitteltraeger",
            "pergola"],
            maxSpannweite:4.5,
            maxHoehe:4
        },
        kosten:{
            kategorie:"economy",
            relativerPreis:.65
        }
    },
    "80x60x4":{
        id:"80x60x4",
        name:"Mittelträger 80×60×4",
        beschreibung:"Kompaktes Mittelträger-Profil für 120×80 Rahmenprofil",
        abmessungen:{
            breite:.08,
            tiefe:.06,
            wandstaerke:.004
        },
        material:{
            typ:"aluminium",
            gewichtProMeter:1.05,
            tragfaehigkeit:"mittel"
        },
        eigenschaften:{
            standard:!1,
            empfohlenFuer:["mitteltraeger",
            "pergola"],
            maxSpannweite:4.5,
            maxHoehe:4
        },
        kosten:{
            kategorie:"standard",
            relativerPreis:.75
        }
    },
    "120x80x4_mittel":{
        id:"120x80x4_mittel",
        name:"Mittelträger 120×80×4",
        beschreibung:"Verstärktes Mittelträger-Profil für 160×80 Rahmenprofil",
        abmessungen:{
            breite:.12,
            tiefe:.08,
            wandstaerke:.004
        },
        material:{
            typ:"aluminium",
            gewichtProMeter:1.43,
            tragfaehigkeit:"mittel-hoch"
        },
        eigenschaften:{
            standard:!1,
            empfohlenFuer:["mitteltraeger",
            "pergola"],
            maxSpannweite:5.5,
            maxHoehe:4
        },
        kosten:{
            kategorie:"standard",
            relativerPreis:.85
        }
    },
    "160x80x4_mittel":{
        id:"160x80x4_mittel",
        name:"Mittelträger 160×80×4",
        beschreibung:"Großes Mittelträger-Profil für 200×100 Rahmenprofil",
        abmessungen:{
            breite:.16,
            tiefe:.08,
            wandstaerke:.004
        },
        material:{
            typ:"aluminium",
            gewichtProMeter:1.67,
            tragfaehigkeit:"hoch"
        },
        eigenschaften:{
            standard:!1,
            empfohlenFuer:["mitteltraeger",
            "pergola"],
            maxSpannweite:6,
            maxHoehe:4
        },
        kosten:{
            kategorie:"premium",
            relativerPreis:1
        }
    },
    "200x120x4_mittel":{
        id:"200x120x4_mittel",
        name:"Mittelträger 200×120×4",
        beschreibung:"Schweres Mittel-/Zwischenpfosten-Profil für hohe Lasten",
        abmessungen:{
            breite:.2,
            tiefe:.12,
            wandstaerke:.004
        },
        material:{
            typ:"aluminium",
            gewichtProMeter:3.1,
            tragfaehigkeit:"sehr_hoch"
        },
        eigenschaften:{
            standard:!1,
            empfohlenFuer:["mitteltraeger",
            "pergola",
            "schwerlast"],
            maxSpannweite:8,
            maxHoehe:5
        },
        kosten:{
            kategorie:"premium",
            relativerPreis:2
        }
    }
};
export class ProfileKonfiguration{
    constructor(){
        this.verfügbareProfile={
            ...RAHMEN_PROFILE
        },
        this.aktuellesProfil="160x80x4",
        this.mitteltraegerOverride="120x80x4_mittel",
        this.pergolaGroesse={
            breite:4,
            tiefe:4
        }
    }
    getFesteProfilkombinationen(){
        return[{
            id:"config_1",
            name:"120×80 / 80×60",
            rahmen:"120x80x4",
            mittel:"80x60x4",
            beschreibung:"Kompakte Konfiguration für kleine Pergolas"
        },
        {
            id:"config_2",
            name:"160×80 / 100×80 ⭐",
            rahmen:"160x80x4",
            mittel:"100x80x4",
            beschreibung:"Standard-Konfiguration (empfohlen für 4×4m)"
        },
        {
            id:"config_3",
            name:"160×80 / 120×80",
            rahmen:"160x80x4",
            mittel:"120x80x4_mittel",
            beschreibung:"Verstärkte Mittelträger bei 160×80 Rahmen"
        },
        {
            id:"config_4",
            name:"200×100 / 120×80",
            rahmen:"200x100x4",
            mittel:"120x80x4_mittel",
            beschreibung:"Großer Rahmen mit kompakten Mittelträgern"
        },
        {
            id:"config_5",
            name:"200×100 / 160×80",
            rahmen:"200x100x4",
            mittel:"160x80x4_mittel",
            beschreibung:"Maximum-Konfiguration für große Pergolas"
        }
        ]
    }
    wendeFesteKonfigurationAn(e){
        const r=this.getFesteProfilkombinationen().find(r=>r.id===e);
        return r?(this.aktuellesProfil=r.rahmen, this.mitteltraegerOverride=r.mittel, console.log(`✅ Feste Konfiguration angewendet: ${r.name}`), console.log(`   Rahmenprofil: ${r.rahmen}`), console.log(`   Mittelträger: ${r.mittel}`), !0):(console.warn(`❌ Unbekannte Konfiguration: ${e}`), !1)
    }
    optimiereProfileFuerGroesse(e, r, t=!1){
        return this.pergolaGroesse={
            breite:e,
            tiefe:r
        },
        console.log(`ℹ️ Pergola-Größe registriert: ${e}×${r}m${t?" (mit Mittenpfosten)":""}`),
        console.log(`   Aktuelle Profile: Rahmen=${this.aktuellesProfil}, Mittel=${this.mitteltraegerOverride}`),
        {
            rahmen:this.aktuellesProfil,
            mittel:this.mitteltraegerOverride
        }
    }
    gibAlleProfile(){
        return{
            ...this.verfügbareProfile
        }
    }
    gibProfil(e){
        return this.verfügbareProfile[e]||null
    }
    gibAktuellesProfil(){
        return this.gibProfil(this.aktuellesProfil)
    }
    gibMitteltraegerProfil(konfiguration){
        const e=this.gibAktuellesProfil();
        if(!e)return null;

        // Spezialfall: Flachdach mit EPDM-Folie
        // - bei 200×100 Rahmenprofil auf 120×80 Mittelträger wechseln
        // - ansonsten 100×80 Mittelträger nutzen
        // Wichtig: Override NICHT persistent überschreiben, damit Pergola-Modus unverändert bleibt
        if(konfiguration && konfiguration.neigung === 0 && konfiguration.dachTyp === "epdm") {
            const zielMitteltraeger = e.id === "200x100x4" ? "120x80x4_mittel" : "100x80x4";
            console.log(`🏗️ Flachdach + EPDM: Verwende ${zielMitteltraeger} Mittelträger (Override ignoriert)`);
            return this.gibProfil(zielMitteltraeger);
        }

        const r=this.mitteltraegerOverride;
        if(r&&this.verfügbareProfile[r])return this.gibProfil(r);
        const t=e.eigenschaften?.mitteltraegerProfil;
        return t?this.gibProfil(t):this.gibProfil("100x80x4")
    }
    setzeMitteltraegerOverride(e){
        return null==e||""===e?(this.mitteltraegerOverride=null, console.log("🔄 Mittelträger-Override entfernt"), !0):this.verfügbareProfile[e]?(this.mitteltraegerOverride=e, console.log(`🔧 Mittelträger-Override gesetzt: ${e}`), !0):(console.warn("❌ Unbekanntes Mittelträger-Profil für Override:", e), !1)
    }
    setzeAktuellesProfil(e){
        return this.verfügbareProfile[e]?(this.aktuellesProfil=e, console.log(`📐 Profil geändert zu: ${this.gibProfil(e).name}`), !0):(console.warn(`❌ Unbekanntes Profil: ${e}`), !1)
    }
    fuegeProfilHinzu(e, r){
        return this.verfügbareProfile[e]&&console.warn(`⚠️ Profil ${e} existiert bereits und wird überschrieben`),
        this.validiereProfilDaten(r)?(this.verfügbareProfile[e]={
            id:e, ...r
        }, console.log(`✅ Neues Profil hinzugefügt: ${e}`), !0):(console.error(`❌ Ungültige Profil-Daten für ${e}`), !1)
    }
    validiereProfilDaten(e){
        const r=["name",
        "abmessungen"];
        for(const t of r)if(!e[t])return console.error(`❌ Fehlendes Feld: ${t}`),
        !1;
        const t=e.abmessungen;
        return!(!t.breite||!t.tiefe)||(console.error("❌ Fehlende Abmessungen (breite, tiefe)"), !1)
    }
    gibProfileNachKategorie(e){
        return Object.values(this.verfügbareProfile).filter(r=>r.kosten?.kategorie===e)
    }
    gibStandardProfile(){
        return Object.values(this.verfügbareProfile).filter(e=>!0===e.eigenschaften?.standard)
    }
    berechneMaterial(e=3){
        const r=this.gibAktuellesProfil();
        if(!r)return null;
        const t=r.material.gewichtProMeter*e;
        return{
            profilId:r.id,
            profilName:r.name,
            hoehe:e,
            gewichtProPfosten:t,
            abmessungen:r.abmessungen,
            empfohleneAnwendung:r.eigenschaften.empfohlenFuer
        }
    }
    gibUIOptionen(){
        return Object.values(this.verfügbareProfile).map(e=>({
            value:e.id, label:e.name, description:e.beschreibung, kategorie:e.kosten?.kategorie||"standard"
        }))
    }
    debug(){
        console.group("📐 PROFIL-KONFIGURATION DEBUG"),
        console.log("Verfügbare Profile:", Object.keys(this.verfügbareProfile)),
        console.log("Aktuelles Profil:", this.aktuellesProfil),
        console.log("Profil-Details:", this.gibAktuellesProfil()),
        console.log("Material für 3m Höhe:", this.berechneMaterial(3)),
        console.groupEnd()
    }
}
