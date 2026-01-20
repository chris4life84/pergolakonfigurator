export const MAX_SPANNWEITEN={
    "120x80x4":{
        ohneMittelpfosten:3.5,
        mitMittelpfosten:5,
        beschreibung:"Kompakt-Profil",
        tragheitsmoment:533e-8,
        hinweis:"Für Spannweiten >3,5m: Statiker konsultieren"
    },
    "160x80x4":{
        ohneMittelpfosten:4.5,
        mitMittelpfosten:6.5,
        beschreibung:"Standard-Profil",
        tragheitsmoment:273e-7,
        hinweis:"Standard-Profil für normale Spannweiten"
    },
    "200x120x4":{
        ohneMittelpfosten:5.5,
        mitMittelpfosten:10,
        beschreibung:"Verstärkt-Profil",
        tragheitsmoment:96e-6,
        hinweis:"Verstärktes Profil für große Spannweiten bis 10m mit Mittelpfosten"
    },
    "200x100x4":{
        ohneMittelpfosten:5,
        mitMittelpfosten:7.5,
        beschreibung:"Verstärkt-Profil (schmal)",
        tragheitsmoment:667e-7,
        hinweis:"Verstärkt, aber schmaler als 200x120"
    }
};
export function berechneZwischenpfostenBedarf(e, t, n=!1){
    const i=MAX_SPANNWEITEN[t]||{
        ohneMittelpfosten:4,
        mitMittelpfosten:6
    },
    o=n?i.mitMittelpfosten:i.ohneMittelpfosten,
    r=e>o;
    let s="";
    if(r){
        const t=(100*(e/o-1)).toFixed(1);
        s=`Spannweite ${e.toFixed(2)}m überschreitet Maximum von ${o}m um ${t}%`
    }
    return{
        benoetigt:r,
        maxSpannweite:o,
        aktuelleSpannweite:e,
        grund:s,
        profilInfo:i.beschreibung||"Unbekannt"
    }
}
export function gibSpannweitenEmpfehlungen(e, t){
    const n=[];
    for(const[i, o]of Object.entries(MAX_SPANNWEITEN))i!==t&&e<=o.ohneMittelpfosten&&n.push({
        typ:"profil_upgrade", profilId:i, beschreibung:`Upgrade auf ${i} (${o.beschreibung})`, maxSpannweite:o.ohneMittelpfosten, prioritaet:1
    });
    const i=MAX_SPANNWEITEN[t];
    return i&&e<=i.mitMittelpfosten&&n.push({
        typ:"mittelpfosten", beschreibung:"Mittelpfosten hinzufügen", maxSpannweite:i.mitMittelpfosten, prioritaet:2
    }),
    n.sort((e, t)=>e.prioritaet-t.prioritaet)
}