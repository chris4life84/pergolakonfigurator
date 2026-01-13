export class PergolaKonfiguration{
    constructor(){
        this.standardKonfiguration=this.gibStandardKonfiguration(),
        this.aktuelleKonfiguration={
            ...this.standardKonfiguration
        }
    }
    gibStandardKonfiguration(){
        return{
            breite:4,
            tiefe:3,
            hoehe:2.7,
            typ:"freistehend",
            material:"aluminium",
            farbe:"ral7016",
            ncsFarbe:null,
            dach:"glas",
            dachTyp:"glas",
            dachForm:"pultdach",
            epdmFarbe:"schwarz",
            glasTyp:"klar",
            glasFarbe:"klar",
            seiten:"keine",
            beleuchtung:!1,
            heizung:!1,
            sensoren:!1,
            terrassenplatten:!0,
            terrassenplattenTyp:"naturstein",
            terrassenplattenTextur:"stein",
            terrassenplattenGroesse:.6,
            terrassenplattenErweiterung:1.5,
            outdoorMoebel:!1,
            carportModus:!1,
            carportSegmente:[],
            neigung:3,
            regenwasserAbfluss:"rinne",
            pfostenVersaetze:{
                vorne:0,
                hinten:0
            },
            pfostenKuerzung:{
                vorne:0,
                hinten:0,
                mitte:0
            },
            pfostenAktiv:{
                vorne:!0,
                hinten:!0
            },
            zentralerMittelpfosten:!1,
            zwischenpfostenBreite:!1,
            zwischenpfostenTiefe:!1,
            zwischenpfostenProfil:"120x80x4_mittel",
            kopfbaenderAktiv:!1,
            kopfbaenderPosition:"ecken",
            kopfbaenderWinkel:45,
            befestigung:"ankerplatte",
            pfostenProfil:"160x80x4",
            profilKonfiguration:{
                standardProfile:!0,
                profilTyp:"standard"
            }
        }
    }
    aktualisiereKonfiguration(e){
        const n=this.validiereKonfiguration(e);
        this.aktuelleKonfiguration={
            ...this.aktuelleKonfiguration,
            ...n
        },
        this.benachrichtigeAenderung()
    }
    validiereKonfiguration(e){
        const n={};
        const parseNumber=e=>{
            const n=Number.parseFloat(e);
            return Number.isFinite(n)?n:null
        };
        const clamp=(e,n,t)=>Math.max(n, Math.min(t, e));
        const normalizePostId=e=>"string"==typeof e?e.toLowerCase():String(e||"").toLowerCase();
        const sanitizeVersatz=e=>{
            const n={};
            if(!e||"object"!=typeof e)return n;
            return Object.entries(e).forEach(([e,t])=>{
                const o=normalizePostId(e),
                isCenter=o.includes("mitte")||o.includes("zwischen");
                const minDefault=isCenter?-1.5:0,
                maxDefault=1.5;
                if("object"==typeof t&&null!==t){
                    const eAxis="string"==typeof t.achse?t.achse:"string"==typeof t.axis?t.axis:"x",
                    val=parseNumber(t.wert??t.value);
                    if(null===val)return;
                    const min="z"===eAxis?minDefault:minDefault,
                    max=maxDefault;
                    const clamped=clamp(val, min, max);
                    n[e]={achse:eAxis, wert:clamped}
                }
                else{
                    const r=parseNumber(t);
                    if(null===r)return;
                    const min=isCenter?minDefault:0,
                    max=maxDefault;
                    n[e]=clamp(r, min, max)
                }
            }),
            n
        };
        const sanitizeKuerzung=(e,n)=>{
            const t={};
            if(!e||"object"!=typeof e)return t;
            return Object.entries(e).forEach(([e,r])=>{
                const o=parseNumber(r);
                null!==o&&(t[e]=clamp(o, 0, n))
            }),
            t
        };
        const sanitizeAktiv=e=>{
            const n={};
            if(!e||"object"!=typeof e)return n;
            return Object.entries(e).forEach(([e,t])=>{
                n[e]=!1!==t
            }),
            n
        };
        if(void 0!==e.breite&&(n.breite=Math.max(2, Math.min(8, e.breite))), void 0!==e.tiefe&&(n.tiefe=Math.max(2, Math.min(6, e.tiefe))), void 0!==e.hoehe&&(n.hoehe=Math.max(2.4, Math.min(4, e.hoehe))), void 0!==e.neigung&&(n.neigung=Math.max(0, Math.min(5, e.neigung))), void 0!==e.regenwasserAbfluss){
            ["rinne",
            "glasueberstand",
            "vollprofil"].includes(e.regenwasserAbfluss)&&(n.regenwasserAbfluss=e.regenwasserAbfluss)
        }
        if(void 0!==e.ncsFarbe){
            const t=["ncs-s0500-n",
            "ncs-s2005-g",
            "ncs-s3020-b",
            "ncs-s2050-y80r",
            "ncs-s3060-g10y",
            "ncs-s8500-n"];
            (null===e.ncsFarbe||t.includes(e.ncsFarbe))&&(n.ncsFarbe=e.ncsFarbe)
        }
        if(void 0!==e.glasFarbe){
            ["klar",
            "matt",
            "grau",
            "bronze"].includes(e.glasFarbe)&&(n.glasFarbe=e.glasFarbe, n.glasTyp=e.glasFarbe)
        }
        if(void 0!==e.pfostenVersaetze){
            const t=this.aktuelleKonfiguration?.pfostenVersaetze||{
                vorne:0,
                hinten:0
            },
            i=(e, n)=>{
                const t=Number.parseFloat(e),
                i=Number.isFinite(t)?t:n;
                return Math.max(0, Math.min(.5, i))
            },
            r=e.pfostenVersaetze||{};
            n.pfostenVersaetze={
                vorne:i(r.vorne, t.vorne??0),
                hinten:i(r.hinten, t.hinten??0),
                ...r.individuell&&{
                    individuell:r.individuell
                }
            }
        }
        if(void 0!==e.pfostenKuerzung){
            const t=this.aktuelleKonfiguration?.pfostenKuerzung||{
                vorne:0,
                hinten:0,
                mitte:0
            },
            i=n.hoehe??this.aktuelleKonfiguration?.hoehe??2.7,
            r=Math.max(0, i-.05),
            a=(e, n)=>{
                const t=Number.parseFloat(e),
                i=Number.isFinite(t)?t:n;
                return Math.max(0, Math.min(r, i))
            },
            s=e.pfostenKuerzung||{};
            n.pfostenKuerzung={
                vorne:a(s.vorne, t.vorne??0),
                hinten:a(s.hinten, t.hinten??0),
                mitte:a(s.mitte, t.mitte??0),
                ...s.individuell&&{
                    individuell:s.individuell
                }
            }
        }
        if(void 0!==e.zwischenpfostenProfil){
            const erlaubte=["120x80x4_mittel","160x80x4_mittel","200x120x4_mittel"];
            erlaubte.includes(e.zwischenpfostenProfil)&&(n.zwischenpfostenProfil=e.zwischenpfostenProfil)
        }
        if(void 0!==e.pfostenAktiv){
            const t=e.pfostenAktiv||{};
            n.pfostenAktiv={
                vorne:!1!==t.vorne,
                hinten:!1!==t.hinten,
                ...t.individuell&&{
                    individuell:t.individuell
                }
            }
        }
        if(void 0!==e.carportSegmente&&Array.isArray(e.carportSegmente)){
            n.carportSegmente=e.carportSegmente.map(seg=>{
                const t={
                    id:seg.id||0,
                    breite:Math.max(2, Math.min(8, seg.breite||4)),
                    tiefe:Math.max(2, Math.min(6, seg.tiefe||4)),
                    hoehe:Math.max(2.4, Math.min(4, seg.hoehe||2.7)),
                    x:Math.max(-20, Math.min(20, seg.x||0)),
                    z:Math.max(-20, Math.min(20, seg.z||0)),
                    rotation:seg.rotation||0,
                    neigung:Math.max(0, Math.min(5, seg.neigung||2)),
                    zwischenpfostenBreite:!!seg.zwischenpfostenBreite,
                    zwischenpfostenTiefe:!!seg.zwischenpfostenTiefe
                };
                seg.zwischenpfostenProfil&&(t.zwischenpfostenProfil=seg.zwischenpfostenProfil);
                // Validiere und übernehme regenwasserAbfluss für Segment
                if(void 0!==seg.regenwasserAbfluss&&["rinne","glasueberstand","vollprofil"].includes(seg.regenwasserAbfluss)){
                    t.regenwasserAbfluss=seg.regenwasserAbfluss
                }
                const r=Math.max(0, t.hoehe-.03),
                o=sanitizeVersatz(seg.pfostenVersaetze),
                a=sanitizeKuerzung(seg.pfostenKuerzung, r),
                s=sanitizeAktiv(seg.pfostenAktiv);
                return Object.keys(o).length>0&&(t.pfostenVersaetze=o),
                Object.keys(a).length>0&&(t.pfostenKuerzung=a),
                Object.keys(s).length>0&&(t.pfostenAktiv=s),
                t
            })
        }
        return void 0!==e.zentralerMittelpfosten&&(n.zentralerMittelpfosten=!0===e.zentralerMittelpfosten),
        void 0!==e.zwischenpfostenBreite&&(n.zwischenpfostenBreite=!0===e.zwischenpfostenBreite),
        void 0!==e.zwischenpfostenTiefe&&(n.zwischenpfostenTiefe=!0===e.zwischenpfostenTiefe),
        Object.keys(e).forEach(t=>{
            if(void 0===n[t])if("befestigung"===t){
                ["ankerplatte", "einbetonieren"].includes(e[t])&&(n[t]=e[t])
            }
            else n[t]=e[t]
        }),
        n
    }
    berechneAbhaengigeWerte(){
        const e=this.aktuelleKonfiguration;
        return{
            hoehenDifferenz:Math.tan(e.neigung*Math.PI/180)*e.tiefe,
            vordereHoehe:e.hoehe,
            hintereHoehe:e.hoehe+Math.tan(e.neigung*Math.PI/180)*e.tiefe,
            durchgangsHoehe:e.hoehe-.16,
            anzahlEckpfosten:"freistehend"===e.typ?4:2,
            glasflaeche:"glas"===e.dach?e.breite*e.tiefe:0
        }
    }
    gibAktuelleKonfiguration(){
        return{
            ...this.aktuelleKonfiguration
        }
    }
    aufStandardZuruecksetzen(){
        this.aktuelleKonfiguration={
            ...this.standardKonfiguration
        },
        this.benachrichtigeAenderung()
    }
    benachrichtigeAenderung(){
        document.dispatchEvent(new CustomEvent("pergolaKonfigurationGeaendert", {
            detail:this.aktuelleKonfiguration
        }))
    }
}
