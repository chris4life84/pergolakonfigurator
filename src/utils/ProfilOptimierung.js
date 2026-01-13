class ProfilOptimierung{
    constructor(){
        this.verfuegbareProfile=[{
            name:"80x40",
            h:80,
            b:40,
            stufe:1
        },
        {
            name:"100x80",
            h:100,
            b:80,
            stufe:2
        },
        {
            name:"120x80",
            h:120,
            b:80,
            stufe:3
        },
        {
            name:"160x80",
            h:160,
            b:80,
            stufe:4
        },
        {
            name:"200x120",
            h:200,
            b:120,
            stufe:5
        }
        ],
        this.statikTabelle=[{
            breite:3,
            tiefe:3,
            rahmen:"120x80",
            mittelLaengs:"100x80",
            mittelQuer:"100x80",
            status:"gruen",
            auslastung:7,
            hinweis:"Mittelträger aufgerüstet von 80×40 auf 100×80"
        },
        {
            breite:3,
            tiefe:4,
            rahmen:"120x80",
            mittelLaengs:"100x80",
            mittelQuer:"100x80",
            status:"gruen",
            auslastung:9,
            hinweis:"Mittelträger aufgerüstet von 80×40 auf 100×80"
        },
        {
            breite:3,
            tiefe:5,
            rahmen:"120x80",
            mittelLaengs:"160x80",
            mittelQuer:"160x80",
            status:"gelb",
            auslastung:12,
            hinweis:"Mittelträger vereinheitlicht auf 160×80"
        },
        {
            breite:4,
            tiefe:4,
            rahmen:"160x80",
            mittelLaengs:"100x80",
            mittelQuer:"160x80",
            status:"gruen",
            auslastung:15,
            hinweis:"Querträger Mitte vereinheitlicht auf 160×80"
        },
        {
            breite:4,
            tiefe:5,
            rahmen:"160x80",
            mittelLaengs:"100x80",
            mittelQuer:"160x80",
            status:"gruen",
            auslastung:18,
            hinweis:"Effizienteste Kombination: Querträger vereinheitlicht"
        },
        {
            breite:4,
            tiefe:6,
            rahmen:"160x80",
            mittelLaengs:"160x80",
            mittelQuer:"200x120",
            status:"gelb",
            auslastung:22,
            hinweis:"Mittlerer Querträger muss auf 200×120 erhöht werden"
        },
        {
            breite:5,
            tiefe:5,
            rahmen:"200x120",
            mittelLaengs:"160x80",
            mittelQuer:"160x80",
            status:"gelb",
            auslastung:25,
            hinweis:"Alle Rahmenträger auf 200×120, Mittelträger auf 160×80"
        },
        {
            breite:5,
            tiefe:6,
            rahmen:"200x120",
            mittelLaengs:"200x120",
            mittelQuer:"200x120",
            status:"gelb",
            auslastung:28,
            hinweis:"Alle Profile auf 200×120 erhöht"
        },
        {
            breite:6,
            tiefe:6,
            rahmen:"200x120",
            mittelLaengs:"200x120",
            mittelQuer:"200x120",
            status:"gelb",
            auslastung:35,
            hinweis:"Maximale Profile notwendig"
        }
        ],
        this.MINDESTABSTAND_MM=40
    }
    getProfil(e){
        return this.verfuegbareProfile.find(t=>t.name===e)
    }
    pruefeAbstand(e, t){
        const n=e.h-t.h;
        return{
            zulaessig:n>=this.MINDESTABSTAND_MM,
            differenz:n,
            erforderlich:this.MINDESTABSTAND_MM
        }
    }
    getNaechstgroessereProfil(e){
        const t=this.verfuegbareProfile.findIndex(t=>t.name===e.name);
        return t<this.verfuegbareProfile.length-1?this.verfuegbareProfile[t+1]:null
    }
    getKleineresStufe(e){
        const t=this.verfuegbareProfile.findIndex(t=>t.name===e.name);
        return t>0?this.verfuegbareProfile[t-1]:e
    }
    findeStatikEintrag(e, t){
        let n=this.statikTabelle.find(n=>n.breite===e&&n.tiefe===t);
        if(!n){
            const s=e*t;
            n=this.statikTabelle.filter(e=>e.breite*e.tiefe>=s).sort((e, t)=>e.breite*e.tiefe-t.breite*t.tiefe)[0]
        }
        return n
    }
    optimiereProfile(e, t, n={}){
        const s=[],
        i=[];
        s.push(`🔍 Optimiere Profile für ${e}×${t}m Pergola`),
        s.push("");
        const r=this.findeStatikEintrag(e, t);
        if(!r)return i.push("⚠️ WARNUNG: Keine passende Konfiguration in Statik-Tabelle gefunden!"),
        i.push("Diese Größe überschreitet die getesteten Dimensionen."),
        {
            erfolg:!1,
            warnungen:i,
            log:s
        };
        s.push("📊 Statik-Tabelle Eintrag gefunden:"),
        s.push(`   Größe: ${r.breite}×${r.tiefe}m`),
        s.push(`   Rahmen: ${r.rahmen}`),
        s.push(`   Mittel Längs: ${r.mittelLaengs}`),
        s.push(`   Mittel Quer: ${r.mittelQuer}`),
        s.push(`   Status: ${r.status.toUpperCase()} (${r.auslastung}% Auslastung)`),
        s.push(`   Hinweis: ${r.hinweis}`),
        s.push("");
        let u=this.getProfil(r.rahmen),
        a=this.getProfil(r.mittelLaengs),
        h=this.getProfil(r.mittelQuer);
        s.push("🔧 Prüfe konstruktive Regeln:"),
        s.push("");
        const l=this.pruefeAbstand(u, a);
        if(s.push(`   Regel 1: Abstand Rahmen (${u.name}) - Mittel Längs (${a.name})`), s.push(`            Differenz: ${l.differenz}mm (mind. ${l.erforderlich}mm)`), l.zulaessig)s.push("            ✅ OK");
        else{
            s.push("            ❌ NICHT ZULÄSSIG - Rahmen wird vergrößert");
            let e=0;
            const t=5;
            for(;
            !l.zulaessig&&e<t;){
                const t=this.getNaechstgroessereProfil(u);
                if(!t){
                    i.push("⚠️ KRITISCH: Kein größeres Rahmenprofil verfügbar!");
                    break
                }
                u=t;
                const n=this.pruefeAbstand(u, a);
                s.push(`            Anpassung ${e+1}: Rahmen → ${u.name} (Differenz: ${n.differenz}mm)`),
                n.zulaessig&&(s.push("            ✅ OK nach Anpassung"), l.zulaessig=!0, l.differenz=n.differenz),
                e++
            }
        }
        s.push("");
        const f=this.pruefeAbstand(u, h);
        if(s.push(`   Regel 2: Abstand Rahmen (${u.name}) - Mittel Quer (${h.name})`), s.push(`            Differenz: ${f.differenz}mm (mind. ${f.erforderlich}mm)`), f.zulaessig)s.push("            ✅ OK");
        else{
            s.push("            ❌ NICHT ZULÄSSIG - Rahmen wird vergrößert");
            let e=0;
            const t=5;
            for(;
            !f.zulaessig&&e<t;){
                const t=this.getNaechstgroessereProfil(u);
                if(!t){
                    i.push("⚠️ KRITISCH: Kein größeres Rahmenprofil verfügbar!");
                    break
                }
                u=t;
                const n=this.pruefeAbstand(u, h);
                s.push(`            Anpassung ${e+1}: Rahmen → ${u.name} (Differenz: ${n.differenz}mm)`),
                n.zulaessig&&(s.push("            ✅ OK nach Anpassung"), f.zulaessig=!0, f.differenz=n.differenz),
                e++
            }
        }
        s.push(""),
        s.push("   Regel 3: Hierarchie - Mittelträger dürfen nicht größer sein als Rahmen");
        let g=!0;
        a.stufe>u.stufe&&(s.push(`            ❌ Mittel Längs (${a.name}) > Rahmen (${u.name})`), g=!1),
        h.stufe>u.stufe&&(s.push(`            ❌ Mittel Quer (${h.name}) > Rahmen (${u.name})`), g=!1),
        g?s.push("            ✅ OK - Hierarchie eingehalten"):(i.push("⚠️ WARNUNG: Mittelträger größer als Rahmen - Konfiguration ungültig!"), s.push("            → Rahmen muss mindestens so groß sein wie größter Mittelträger")),
        s.push(""),
        a.name!==u.name&&h.name!==u.name||(s.push("   ⚠️  SPEZIALFALL: Mittelträger = Rahmenprofil erkannt"), s.push("       Dies tritt bei sehr großen Pergolen auf (z.B. 4×6m, 6×6m)"), s.push(""), s.push("   💡 EMPFEHLUNG: Zusätzliche Stützpfosten verwenden"), s.push("       → Durch Stützpfosten können kleinere Mittelträger verwendet werden"), s.push("       → Dies stellt den erforderlichen 40mm Abstand sicher"), s.push("       → Beispiel: Bei 6×6m → 2 Stützpfosten → Mittel auf 160×80 reduzierbar"), s.push(""), i.push("💡 HINWEIS: Bei dieser Größe werden zusätzliche Stützpfosten empfohlen"), i.push("   → Dadurch können kleinere Mittelträger verwendet werden (Kosteneinsparung)"), i.push("   → Konstruktiv sauberer (40mm Abstand eingehalten)")),
        "100x80"!==a.name&&"100x80"!==h.name||(s.push("   Regel 4: Vereinheitlichung - Bei 100×80 Mittelträgern"), a.name!==h.name?(s.push("            ℹ️  Hinweis: Aktuell unterschiedliche Mittelträger"), s.push(`               Längs: ${a.name}, Quer: ${h.name}`), s.push("            ℹ️  Empfehlung: Einheitlich verwenden für einfachere Bestellung")):s.push(`            ✅ Bereits einheitlich: ${a.name}`), s.push(""));
        const m=this.getKleineresStufe(u);
        s.push("   Regel 5: Mittelpfosten = Eine Stufe kleiner als Außenpfosten"),
        s.push(`            Außenpfosten: ${u.name}`),
        s.push(`            → Mittelpfosten: ${m.name}`),
        s.push("");
        const p={
            aussenpfosten:u.name,
            mittelpfosten:m.name,
            rahmentraeger:u.name,
            mitteltraegerLaengs:a.name,
            mitteltraegerQuer:h.name,
            statikStatus:r.status,
            auslastung:r.auslastung,
            hinweis:r.hinweis
        };
        return s.push(""),
        s.push("✅ FINALE KONFIGURATION:"),
        s.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"),
        s.push(`   Außenpfosten:      ${p.aussenpfosten}`),
        s.push(`   Mittenpfosten:     ${p.mittelpfosten}`),
        s.push(`   Rahmenträger:      ${p.rahmentraeger}`),
        s.push(`   Mittelträger Längs: ${p.mitteltraegerLaengs}`),
        s.push(`   Mittelträger Quer:  ${p.mitteltraegerQuer}`),
        s.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"),
        s.push(`   Statik-Status:     ${p.statikStatus.toUpperCase()}`),
        s.push(`   Auslastung:        ${p.auslastung}%`),
        s.push(`   Hinweis:           ${p.hinweis}`),
        s.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"),
        {
            erfolg:0===i.length||i.every(e=>e.startsWith("⚠️ Hinweis")),
            konfiguration:p,
            warnungen:i,
            log:s,
            abstaende:{
                rahmenMittelLaengs:l.differenz,
                rahmenMittelQuer:f.differenz
            }
        }
    }
    generiereReport(e, t){
        const n=this.optimiereProfile(e, t);
        let s="\n";
        return s+="═══════════════════════════════════════════════════════\n",
        s+=`  PROFIL-OPTIMIERUNG: ${e}×${t}m PERGOLA\n`,
        s+="═══════════════════════════════════════════════════════\n\n",
        n.log.forEach(e=>s+=e+"\n"),
        n.warnungen.length>0&&(s+="\n", s+="⚠️  WARNUNGEN:\n", s+="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", n.warnungen.forEach(e=>s+=e+"\n")),
        s+="\n",
        s+="═══════════════════════════════════════════════════════\n",
        s
    }
}
"undefined"!=typeof module&&module.exports&&(module.exports=ProfilOptimierung);