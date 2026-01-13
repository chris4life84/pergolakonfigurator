export class StatikEntscheidung{
    constructor(){
        this.GRENZWERT_L_DIV_300=300,
        this.SCHNEELAST=.85,
        this.GLAS_GEWICHT=.2,
        this.ALU_ZUSCHLAG=.05,
        this.E_MODUL=7e10
    }
    berechneTragheitsmoment(e, t){
        return e*Math.pow(t, 3)/12
    }
    berechneDurchbiegung(e, t, n, i=this.E_MODUL){
        const r=t;
        return 5*(1e3*e)*Math.pow(r, 4)/(384*i*n)
    }
    entscheideKonfiguration(e, t){
        const n=this.SCHNEELAST+this.GLAS_GEWICHT+this.ALU_ZUSCHLAG,
        i={
            "160x80":{
                b:.08,
                h:.16,
                I:this.berechneTragheitsmoment(.08, .16)
            },
            "200x120":{
                b:.12,
                h:.2,
                I:this.berechneTragheitsmoment(.12, .2)
            }
        },
        r=[],
        s=t/2,
        h=e/2,
        m=2*n,
        o=n*(t/2),
        u=this.berechneDurchbiegung(m, s, i["160x80"].I),
        a=this.berechneDurchbiegung(o, h, i["160x80"].I),
        g=s/this.GRENZWERT_L_DIV_300,
        _=h/this.GRENZWERT_L_DIV_300,
        c=u<=g,
        l=a<=_;
        r.push({
            name:"Variante A: 160×80 + Mittelpfosten", rahmen:"200x120", mittel:"160x80", mittelpfosten:!0, mittelpfostenProfil:"160x80", statisch_ok:c&&l, durchbiegung_laengs_mm:(1e3*u).toFixed(1), durchbiegung_quer_mm:(1e3*a).toFixed(1), grenzwert_laengs_mm:(1e3*g).toFixed(1), grenzwert_quer_mm:(1e3*_).toFixed(1), kosten:"Niedrig", empfohlen:c&&l, hinweis:c&&l?"Effizient & ausreichend ⭐":"Nicht ausreichend"
        });
        const f=this.berechneDurchbiegung(m, t, i["200x120"].I),
        d=this.berechneDurchbiegung(2*o, e, i["200x120"].I),
        b=t/this.GRENZWERT_L_DIV_300,
        p=e/this.GRENZWERT_L_DIV_300,
        x=f<=b,
        k=d<=p,
        E=!1;
        r.push({
            name:"Variante B: 200×120 ohne Mittelpfosten", rahmen:"200x120", mittel:"200x120", mittelpfosten:!1, mittelpfostenProfil:null, statisch_ok:x&&k, konstruktiv_ok:E, durchbiegung_laengs_mm:(1e3*f).toFixed(1), durchbiegung_quer_mm:(1e3*d).toFixed(1), grenzwert_laengs_mm:(1e3*b).toFixed(1), grenzwert_quer_mm:(1e3*p).toFixed(1), kosten:"Hoch", empfohlen:!1, hinweis:"⚠️ Konstruktiv problematisch (0mm Abstand Rahmen-Mittel!)"
        });
        const I=this.berechneDurchbiegung(m, s, i["200x120"].I),
        w=this.berechneDurchbiegung(o, h, i["200x120"].I);
        r.push({
            name:"Variante C: 200×120 + Mittelpfosten (Maximum)", rahmen:"200x120", mittel:"200x120", mittelpfosten:!0, mittelpfostenProfil:"160x80", statisch_ok:!0, konstruktiv_ok:!1, durchbiegung_laengs_mm:(1e3*I).toFixed(1), durchbiegung_quer_mm:(1e3*w).toFixed(1), grenzwert_laengs_mm:(1e3*g).toFixed(1), grenzwert_quer_mm:(1e3*_).toFixed(1), kosten:"Sehr hoch", empfohlen:!1, hinweis:"⚠️ Konstruktiv problematisch (0mm Abstand) - Überdimensioniert"
        });
        let $=null,
        z=!1;
        return r[0].statisch_ok?$=r[0]:(z=!0, $={
            name:"⚠️ KRITISCH: Keine Standardlösung ausreichend", rahmen:"200x120", mittel:"160x80", mittelpfosten:!0, mittelpfostenProfil:"160x80", statisch_ok:!0, hinweis:"Bei dieser Größe sind zusätzliche konstruktive Maßnahmen erforderlich (z.B. mehrere Mittelpfosten, verstärkte Profile mit >200×120)", kosten:"Sehr hoch", empfohlen:!0, zwingend:!0
        }, r.push($)),
        {
            breite:e,
            tiefe:t,
            varianten:r,
            empfohlen:$,
            zwingend:z,
            zusammenfassung:this.generiereZusammenfassung(e, t, r, $)
        }
    }
    generiereZusammenfassung(e, t, n, i){
        let r=`\n📊 STATIK-ENTSCHEIDUNG: ${e}×${t}m Pergola\n`;
        return r+="═".repeat(60)+"\n\n",
        n.forEach((e, t)=>{
            const n=e.statisch_ok?"✅":"❌", i=!1===e.konstruktiv_ok?" ⚠️ Konstruktiv problematisch":"", s=e.empfohlen?" ⭐":"";
            r+=`${t+1}. ${e.name}${s}\n`, r+=`   Rahmen: ${e.rahmen}, Mittel: ${e.mittel}\n`, r+=`   Mittelpfosten: ${e.mittelpfosten?`Ja (${
                e.mittelpfostenProfil
            })`:"Nein"}\n`, r+=`   Status: ${n} ${e.hinweis}${i}\n`, e.durchbiegung_laengs_mm&&(r+=`   Durchbiegung Längs: ${e.durchbiegung_laengs_mm}mm (Grenze: ${e.grenzwert_laengs_mm}mm)\n`, r+=`   Durchbiegung Quer: ${e.durchbiegung_quer_mm}mm (Grenze: ${e.grenzwert_quer_mm}mm)\n`), r+=`   Kosten: ${e.kosten}\n\n`
        }),
        r+="═".repeat(60)+"\n",
        r+=`⭐ EMPFEHLUNG: ${i.name}\n`,
        r+="═".repeat(60)+"\n",
        r
    }
}
export function pruefeOptimaleKonfiguration(e, t){
    return(new StatikEntscheidung).entscheideKonfiguration(e, t)
}