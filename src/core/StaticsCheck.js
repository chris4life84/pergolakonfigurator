import{
    ProfileKonfiguration
}
from"../config/ProfileKonfiguration.js";
export class StaticsCheck{
    static compute(e={}, t={}){
        const n={
            sk:.85,
            g_glass:.2,
            g_epdm:.015,
            g_aluminium:.05,
            includeAlu:!0,
            E:7e10,
            deflectionLimitGlas:300,
            deflectionLimitStandard:250,
            designTables:defaultDesignTables(),
            midTransOverride:void 0,
            midLongOverride:void 0,
            ...t
        },
        i=new ProfileKonfiguration;
        e.pfostenProfil&&i.setzeAktuellesProfil(e.pfostenProfil);
        const l=i.gibAktuellesProfil(),
        s=i.gibMitteltraegerProfil(e)||l,
        o=n.midLongOverride&&i.gibProfil(n.midLongOverride)||s,
        r=n.midTransOverride&&i.gibProfil(n.midTransOverride)||s,
        a=l?.id?.startsWith("200x120")?.08:.04,
        u=Math.max(.03, ((o?.abmessungen?.tiefe||.08)-.02)/2),
        m=Number(e.breite)||0,
        g=Number(e.tiefe)||0;
        Number(e.neigung);
        console.log(`📊 StaticsCheck für ${m}×${g}m:`),
        console.log(`   Rahmenprofil: ${l?.id} (${l?.label})`),
        console.log(`   Mittelträger Längs: ${o?.id} (${o?.label})`),
        console.log(`   Mittelträger Quer: ${r?.id} (${r?.label})`);
        const f=e.dachTyp||"glas",
        p="epdm"===f?n.g_epdm:n.g_glass,
        d=n.sk+p+(n.includeAlu?n.g_aluminium:0);
        console.log(`   🏗️ Dachtyp: ${f.toUpperCase()}`),
        console.log(`   📦 Dachlast: ${p.toFixed(3)} kN/m² (${"epdm"===f?"EPDM-Folie ~1.5 kg/m²":"VSG-Glas ~20 kg/m²"})`),
        console.log(`   ❄️ Schneelast: ${n.sk.toFixed(3)} kN/m²`),
        console.log(`   🔩 Aluminium: ${(n.includeAlu?n.g_aluminium:0).toFixed(3)} kN/m²`),
        console.log(`   📊 Gesamtlast q: ${d.toFixed(3)} kN/m²`);
        const c=bestGlassLayout(Math.max(0, m-2*(l?.abmessungen?.tiefe||0)), a, u, .02).n,
        h=Math.max(0, c-1),
        b=h+2,
        x=g>=2.99, // vorher 3.01 – jetzt mittlerer Querträger ab ca. 3m zulassen
        _=2+(x?1:0),
        $=b>1?m/(b-1):m,
        M=$/2,
        w=$,
        z=x?g/2:g,
        k=x?g/2:0,
        v=rectangleI(l?.abmessungen?.tiefe||.08, l?.abmessungen?.breite||.16),
        L=rectangleI(o?.abmessungen?.tiefe||.08, o?.abmessungen?.breite||.1),
        G=rectangleI(r?.abmessungen?.tiefe||.08, r?.abmessungen?.breite||.1),
        F=(l?.abmessungen?.breite||.16)/2,
        P=(o?.abmessungen?.breite||.1)/2,
        y=(r?.abmessungen?.breite||.1)/2,
        A=n.E,
        N=!0===e.zentralerMittelpfosten,
        Q=!0===e.zwischenpfostenTiefe;
        let S=g;
        (N||Q)&&(S=g/2, console.log(`   ✅ Zwischenpfosten Tiefe aktiv → Längsträgern-Spannweite: ${g}m → ${S}m`));
        const T=S/n.deflectionLimitGlas;
        N&&console.log(`✅ Mittelpfosten erkannt - Längsträger-Spannweite halbiert: ${g}m → ${S}m`);
        const B=[];
        for(let e=0;
        e<2;
        e++){
            const e=d*M,
            t=beamResults(e, S, v, F, A);
            B.push({
                type:"outer", w:e, L:S, ...t
            })
        }
        for(let e=0;
        e<h;
        e++){
            const e=d*w,
            t=beamResults(e, S, L, P, A);
            B.push({
                type:"inner", w:e, L:S, ...t
            })
        }
        let E=m;
        !0===e.zwischenpfostenBreite&&(E=m/2, console.log(`   ✅ Zwischenpfosten Breite aktiv → Querträger-Spannweite: ${m}m → ${E}m`));
        const I=E/n.deflectionLimitGlas,
        D=[];
        for(let e=0;
        e<2;
        e++){
            const t=d*z,
            n=beamResults(t, E, v, F, A);
            D.push({
                position:0===e?"vorne":"hinten", w:t, L:E, ...n
            })
        }
        if(x){
            const e=d*k,
            t=beamResults(e, E, G, y, A);
            D.push({
                position:"mitte", w:e, L:E, ...t
            })
        }
        (x?[g/2, g/2]:[g]).some(e=>e>3.000001)&&(C.push("Glaslänge über 3,0 m – füge einen mittleren Querträger hinzu oder reduziere Tiefe."), updateUtil(Z, 1.05, "Querträger"));
        const K=m*g;
        let O=4;
        (e.zentralerMittelpfosten||m>4||g>4)&&(O+=1);
        const R=d*K/Math.max(1, O),
        U=resolveAllows(n.designTables, l?.id, r?.id||o?.id),
        Z={
            max:0,
            reason:null
        },
        C=[],
        W=[];
        B.forEach((e, t)=>{
            const n="inner"===e.type, i=n?U.mid.sigma_b_allow:U.frame.sigma_b_allow, l=T, s=e.sigma_max/i, o=e.delta/l;
            e.util_sigma=s, e.util_defl=o, updateUtil(Z, Math.max(s, o), "Längsträger "+(n?"innen":"außen")), o>1&&C.push(`Durchbiegung Längsträger ${n?"innen":"außen"} überschreitet L/300.`), s>1&&C.push(`Biegespannung Längsträger ${n?"innen":"außen"} überschreitet zulässigen Wert.`)
        }),
        D.forEach(e=>{
            const t="mitte"===e.position?U.mid.sigma_b_allow:U.frame.sigma_b_allow, n=I, i=e.sigma_max/t, l=e.delta/n;
            e.util_sigma=i, e.util_defl=l, updateUtil(Z, Math.max(i, l), `Querträger ${e.position}`), l>1&&C.push(`Durchbiegung Querträger ${e.position} überschreitet L/300.`), i>1&&C.push(`Biegespannung Querträger ${e.position} überschreitet zulässigen Wert.`)
        });
        const V=U.frame.N_allow,
        j=R/V,
        q={
            N_per_post_kN:R,
            N_allow:V,
            util:j,
            nPosts:O
        };
        updateUtil(Z, j, "Pfosten"),
        j>1&&C.push("Pfostenlast überschreitet zulässige Druckkraft je Pfosten.");
        let H="green";
        if(Z.max>1)H="red";
        else{
            [...B,
            ...D].some(e=>e.util_defl>.95)&&(H="yellow")
        }
        console.log(`   📊 Gesamtausnutzung: ${(100*Z.max).toFixed(1)}% (${Z.reason})`),
        console.log(`   ${"green"===H?"🟢":"yellow"===H?"🟡":"🔴"} Status: ${H.toUpperCase()}`),
        "green"!==H&&console.log(`   ⚠️ Kritisch: ${Z.reason} mit ${(100*Z.max).toFixed(1)}% Ausnutzung`);
        const J=[];
        if("green"!==H){
            if(Z.reason?.includes("Längsträger")&&(W.push("Füge einen zusätzlichen mittleren Längsträger hinzu (schmalere Glasfelder)."), W.push("Verwende stärkeres Rahmenprofil (z. B. 160×80 statt 120×80).")), Z.reason?.includes("Querträger")){
                !x&&g>3&&(W.push("Füge einen mittleren Querträger hinzu (ab 3,01 m Tiefe Pflicht)."), J.push({
                    type:"ensure_mid_trans", label:"Mittleren Querträger hinzufügen"
                }));
                const e=D.find(e=>"mitte"===e.position)||D[0],
                t=I;
                if(e&&Number.isFinite(e.delta)){
                    const n=e.delta;
                    if(m>0){
                        const e=n*Math.pow(.5, 4);
                        W.push(`Mittelstütze unter dem Querträger (Zentralpfosten): δ≈${(1e3*e).toFixed(1)} mm (Grenze ${(1e3*t).toFixed(1)} mm) – ${e<=t?"Grün":"Gelb"}.`),
                        J.push({
                            type:"add_center_post", label:"Zentralen Mittelpfosten hinzufügen"
                        })
                    }
                    const i=G,
                    l=r?.id||"unknown",
                    s={
                        "100x80x4":1,
                        "120x80x4":2,
                        "160x80x4":3,
                        "200x120x4":4
                    }
                    [l]||0,
                    o=[{
                        id:"160x80x4",
                        b:.08,
                        h:.16,
                        label:"160×80",
                        level:3
                    },
                    {
                        id:"200x120x4",
                        b:.12,
                        h:.2,
                        label:"200×120",
                        level:4
                    }
                    ].filter(e=>e.level>s);
                    if(o.length>0?o.forEach(e=>{
                        const l=rectangleI(e.b, e.h), s=n*(i>0?i/l:1), o=s<=t?"Grün":s<=1.1*t?"Gelb":"Rot";
                        W.push(`Option A: Querträger auf ${e.label} aufrüsten: δ≈${(1e3*s).toFixed(1)} mm (Grenze ${(1e3*t).toFixed(1)} mm) – ${o}`), J.push({
                            type:"upgrade_mid_trans_profile", label:`Mittel-Querträger → ${e.label}`, newProfileId:e.id
                        }), J.push({
                            type:"upgrade_mid_both_profiles", label:`Mittel-Quer+Längs → ${e.label}`, newProfileId:e.id
                        })
                    }):s>=3&&W.push(`ℹ️  Aktuelles Profil (${r?.name||l}) ist bereits hochwertig. Alternative: Mittelpfosten hinzufügen (reduziert Spannweite).`), !N&&g>4){
                        const e=n*Math.pow(.5, 4);
                        W.push(`Option B (effizienter): Mittelpfosten + aktuelles Profil beibehalten: δ≈${(1e3*e).toFixed(1)} mm – `+(e<=t?"Grün":"Gelb")+" (spart Kosten!)")
                    }
                    if(g>=4.5){
                        const e=n*Math.pow(1/3, 4);
                        W.push(`Konstruktiv: zwei mittlere Querträger (3 Felder): δ≈${(1e3*e).toFixed(1)} mm – `+(e<=t?"Grün":"Gelb")+" (abhängig vom Aufbau)."),
                        J.push({
                            type:"add_second_mid_trans", label:"Zweiten mittleren Querträger ergänzen"
                        })
                    }
                }
            }
            "Pfosten"===Z.reason&&(e.zentralerMittelpfosten||m>4||g>4||(W.push("Füge einen zentralen Mittelpfosten hinzu."), J.push({
                type:"add_center_post", label:"Zentralen Mittelpfosten hinzufügen"
            })), W.push("Wechsle auf größeres Pfostenprofil."))
        }
        const X=l?.id||"unknown",
        Y={
            "100x80x4":1,
            "120x80x4":2,
            "160x80x4":3,
            "200x120x4":4
        }
        [X]||0,
        ee=m>=5.01||g>=5.01,
        te=4===Y,
        ne=3===Y,
        ie=!0===e.zentralerMittelpfosten;
        if(ee&&!ie){
            const e={
                b:.08,
                h:.16
            },
            t=rectangleI(e.b, e.h),
            i=g/2,
            l=1e3*(d*w)*5*Math.pow(i, 4)/(384*n.E*t),
            s=i/n.deflectionLimitGlas,
            o=1e3*(d*(g/Math.max(2, _)))*5*Math.pow(m, 4)/(384*n.E*t),
            r=m/n.deflectionLimitGlas,
            a=.85;
            if(l<=s*a&&o<=r*a){
                const e=te?"200x120x4":ne?"160x80x4":X,
                t=te?"200×120":ne?"160×80":"Aktuell";
                J.push({
                    type:"toggle_mittelpfosten_alternative", label:"⚡ Alternative verfügbar: 160×80 + Mittelpfosten", description:`${t} ohne Mittelpfosten | Alternative: 160×80 + Mittelpfosten`, current:"ohne_mittelpfosten", options:[{
                        value:"ohne_mittelpfosten", label:`Standard: ${t} ohne Mittelpfosten`, profile:e, mittelpfosten:!1, info:"Aktuelle Konfiguration - optimal gewählt"
                    }, {
                        value:"mit_mittelpfosten", label:"Alternative: 160×80 mit Mittelpfosten ⭐", profile:"160x80x4", mittelpfosten:!0, info:`Kleineres Profil - δ(Längs)=${(1e3*l).toFixed(1)}mm/${(1e3*s).toFixed(1)}mm, δ(Quer)=${(1e3*o).toFixed(1)}mm/${(1e3*r).toFixed(1)}mm ✅`
                    }
                    ]
                })
            }
        }
        else if(ee&&ne&&ie){
            const e={
                b:.12,
                h:.2
            },
            t=rectangleI(e.b, e.h),
            i=1e3*(d*w)*5*Math.pow(g, 4)/(384*n.E*t),
            l=g/n.deflectionLimitGlas;
            i<=l&&J.push({
                type:"toggle_mittelpfosten_alternative", label:"⚡ Alternative: 200×120 Profile ohne Mittelpfosten", description:"Standard: 160×80 + Mittelpfosten (aktuell) | Alternative: 200×120 ohne Mittelpfosten", current:"mit_mittelpfosten", options:[{
                    value:"mit_mittelpfosten", label:"Standard: 160×80 mit Mittelpfosten ⭐", profile:"160x80x4", mittelpfosten:!0, info:"Aktuelle Konfiguration - kostengünstig und bewährt"
                }, {
                    value:"ohne_mittelpfosten", label:"Alternative: 200×120 ohne Mittelpfosten", profile:"200x120x4", mittelpfosten:!1, info:`Ohne Mittelpfosten - Durchbiegung: ${(1e3*i).toFixed(1)}mm (Grenze: ${(1e3*l).toFixed(1)}mm) ✅`
                }
                ]
            })
        }
        const le=J.find(e=>"toggle_mittelpfosten_alternative"===e.type);
        m>6&&!N&&"green"!==H&&!le&&(W.push(`💡 Bei ${m.toFixed(2)}m Breite: Mittelpfosten empfohlen (halbiert Querträger-Spannweite)`), J.find(e=>"add_center_post"===e.type)||J.push({
            type:"add_center_post", label:"Zentralen Mittelpfosten hinzufügen"
        }));
        const se=[];
        [...B,
        ...D].forEach(e=>{
            if((e.util_defl||0)>=.8||(e.util_sigma||0)>=.8){
                const t=e.type?`Längsträger ${e.type}`:`Querträger ${e.position}`;
                se.push(`Gelb: ${t} nahe Grenzwert – erwäge stärkeres Profil oder zusätzliche Stütze.`)
            }
        });
        return{
            status:H,
            messages:C,
            limiting_element:Z.reason,
            calculated_values:{
                loads:{
                    q_kNm2:d,
                    area_m2:K
                },
                layout:{
                    nColumns:c,
                    nInnerLong:h,
                    nLongTotal:b,
                    nTrans:_,
                    hasMidTrans:x
                },
                long_beams:B,
                trans_beams:D,
                posts:q,
                limits:{
                    deflection_long:T,
                    deflection_trans:I
                }
            },
            suggestions:W,
            actions:J,
            advisories:se
        }
    }
}
function rectangleI(e, t){
    return e*Math.pow(t, 3)/12
}
function beamResults(e, t, n, i, l){
    const s=t||0,
    o=n||1e-9,
    r=i||.05,
    a=l||7e10,
    u=e*s*s/8;
    return{
        M_kNm:u,
        V_kN:e*s/2,
        delta:5*(1e3*(e||0))*Math.pow(s, 4)/(384*a*o),
        sigma_max:1e3*u*r/o
    }
}
function bestGlassLayout(e, t, n, i){
    for(let l=1;
    l<=20;
    l++){
        const s=e-2*t-(l-1)*(2*n+i);
        if(s<=0)continue;
        const o=s/l,
        r=o+2*n;
        if(r>=.75&&r<=.85)return{
            n:l,
            clear:o,
            glassBreite:r
        };
        if(!(r>.85&&1===l)&&r<.75)return{
            n:Math.max(1, l-1),
            clear:o,
            glassBreite:r
        }
    }
    const l=Math.max(1, Math.round(e/.8)),
    s=e-2*t-(l-1)*(2*n+i),
    o=Math.max(.8, s/Math.max(1, l));
    return{
        n:Math.max(1, l),
        clear:o,
        glassBreite:o+2*n
    }
}
function defaultDesignTables(){
    return{
        bending_allow:{
            "120x80x4":85e6,
            "160x80x4":95e6,
            "200x120x4":105e6,
            "100x80x4":9e7,
            "80x40x4":8e7
        },
        post_allow_NkN:{
            "120x80x4":35,
            "160x80x4":55,
            "200x120x4":85
        }
    }
}
function resolveAllows(e, t="", n=""){
    const i=e.bending_allow||{},
    l=e.post_allow_NkN||{},
    s=i[t]||9e7,
    o=i[n]||s;
    return{
        frame:{
            sigma_b_allow:s,
            N_allow:l[t]||40
        },
        mid:{
            sigma_b_allow:o
        }
    }
}
function updateUtil(e, t, n){
    Number.isFinite(t)&&t>e.max&&(e.max=t, e.reason=n)
}
export default StaticsCheck;
