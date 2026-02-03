import StaticsCheck from"../core/StaticsCheck.js";
import{
    normalisierePfostenId as normalisierePfostenIdUtil,
    formatMillimeter as formatMillimeterUtil,
    formatMeter as formatMeterUtil,
    extractAnzahlSuffix as extractAnzahlSuffixUtil,
    ermittlePfostenLabel as ermittlePfostenLabelUtil,
    ermittleVersatzAnzeige as ermittleVersatzAnzeigeUtil,
    berechneAbhaengigeWerteFuerKonfiguration as berechneAbhaengigeWerteUtil,
    normalisiereProfil,
    erstelleProfilLabel
}from"../utils/InfoboxFormatters.js";
import{
    erstelleSegmentKonfiguration as erstelleSegmentKonfigurationUtil,
    kombiniereSegmentMaterialien as kombiniereSegmentMaterialienUtil,
    skaliereMaterialsammlung as skaliereMaterialsammlungUtil,
    multipliziereItem as multipliziereItemUtil,
    berechneAlumeterAusSammlung as berechneAlumeterAusSammlungUtil,
    leseIndividuellenVersatzEintrag as leseIndividuellenVersatzEintragUtil,
    lesePfostenVersatz as lesePfostenVersatzUtil,
    lesePfostenVersatzTiefe as lesePfostenVersatzTiefeUtil,
    segmenteSindIdentisch as segmenteSindIdentischUtil,
    segmentEntsprichtBasis as segmentEntsprichtBasisUtil,
    generiereStandardPfostenListe,
    erstelleProfilInfo
}from"../utils/InfoboxMaterialCalculator.js";
import{
    renderStatikMarkup as renderStatikMarkupUtil,
    renderProfilauswahl as renderProfilauswahlUtil,
    renderCarportHinweis
}from"../utils/InfoboxStatikRenderer.js";
import{
    berechnePreise as berechnePreiseUtil,
    renderPreisliste as renderPreislisteUtil
}from"../utils/InfoboxPreisRenderer.js";
import { Logger } from "../utils/Logger.js";
export class Infobox{
    constructor(e, t, n, i, r=null){
        this.konfiguration=e,
        this.pfostenInstanz=t,
        this.laengstraegerInstanz=n,
        this.quertraegerInstanz=i,
        this.koordinatenSystem=r,
        this.letzteMaterialien=null,
        this.letzteAlumeterSumme=0,
        this.toggle=document.getElementById("infobox-toggle"),
        this.panel=document.getElementById("infobox-panel"),
        this.closeBtn=document.getElementById("infobox-close"),
        this.tabButtons=document.querySelectorAll(".tab-button"),
        this.logger=new Logger("Infobox"),
        this.initializeEventListeners()
    }
    // Delegate to extracted utility functions
    normalisierePfostenId(e){
        return normalisierePfostenIdUtil(e)
    }
    formatMillimeter(e){
        return formatMillimeterUtil(e)
    }
    formatMeter(e, t=2){
        return formatMeterUtil(e, t)
    }
    extractAnzahlSuffix(e=""){
        return extractAnzahlSuffixUtil(e)
    }
    ermittlePfostenLabel(e){
        return ermittlePfostenLabelUtil(e)
    }
    ermittleVersatzAnzeige(e, t){
        return ermittleVersatzAnzeigeUtil(e, t)
    }
    berechneAbhaengigeWerteFuerKonfiguration(e){
        return berechneAbhaengigeWerteUtil(e)
    }
    erstelleSegmentKonfiguration(e, t={}){
        return erstelleSegmentKonfigurationUtil(e, t)
    }
    kombiniereSegmentMaterialien(segmentSammlungen=[]){
        return kombiniereSegmentMaterialienUtil(segmentSammlungen)
    }
    skaliereMaterialsammlung(e, t=1){
        return skaliereMaterialsammlungUtil(e, t)
    }
    initializeEventListeners(){
        this.toggle?.addEventListener("click", ()=>this.togglePanel()),
        this.closeBtn?.addEventListener("click", ()=>this.close()),
        this.tabButtons.forEach(e=>{
            e.addEventListener("click", e=>{
                const t=e.target.dataset.tab;
                this.switchTab(t)
            })
        }),
        document.addEventListener("click", e=>{
            const t=e.target;
            if(t&&t.classList&&t.classList.contains("profil-btn")){
                const e=t.getAttribute("data-profil");
                this.wendeProfilAn(e)
            }
            if(t&&t.classList&&t.classList.contains("mitteltraeger-btn")){
                const e=t.getAttribute("data-mittel");
                this.wendeMitteltraegerAn(e)
            }
            if(t&&t.classList&&t.classList.contains("statik-action-btn")){
                const e={
                    type:t.getAttribute("data-action-type"), newProfileId:t.getAttribute("data-profile-id")
                };
                document.dispatchEvent(new CustomEvent("staticsAction", {
                    detail:e
                }))
            }
        })
    }
    wendeProfilAn(e){
        let t;
        this.logger.debug(`Wende Profil an: ${e}`),
        "120x80x4"===e?t="80x60x4":"160x80x4"===e?t="100x80x4":"200x100x4"===e&&(t="160x80x4_mittel"),
        document.dispatchEvent(new CustomEvent("profilAenderung", {
            detail:{
                pfostenProfil:e, mitteltraegerProfil:t
            }
        })),
        setTimeout(()=>this.aktualisiereStatik(), 100)
    }
    wendeMitteltraegerAn(e){
        console.log(`🔧 Wende Mittelträger an: ${e}`),
        document.dispatchEvent(new CustomEvent("mitteltraegerAenderung", {
            detail:{
                mitteltraegerProfil:e
            }
        })),
        setTimeout(()=>this.aktualisiereStatik(), 100)
    }
    togglePanel(){
        this.panel?.classList.contains("open")?this.close():this.open()
    }
    open(){
        this.panel?.classList.add("open"),
        this.aktualisiereInhalte()
    }
    close(){
        this.panel?.classList.remove("open")
    }
    switchTab(e){
        document.querySelectorAll(".tab-button").forEach(e=>e.classList.remove("active")),
        document.querySelectorAll(".tab-content").forEach(e=>e.classList.remove("active")),
        document.querySelector(`[data-tab="${e}"]`)?.classList.add("active"),
        document.getElementById(`tab-${e}`)?.classList.add("active"),
        "materialliste"===e?this.aktualisiereMaterialliste():"konstruktion"===e?this.aktualisiereKonstruktionsdokumentation():"statik"===e?this.aktualisiereStatik():"preisliste"===e&&this.aktualisierePreisliste()
    }
    aktualisiereInhalte(){
        this.aktualisiereMaterialliste(),
        this.aktualisiereKonstruktionsdokumentation(),
        this.aktualisiereStatik(),
        this.aktualisierePreisliste()
    }
    aktualisiereStatik(){
        const e=document.getElementById("statik-content");
        if(e&&this.konfiguration)try{
            const t=this.konfiguration.gibAktuelleKonfiguration(),
            s=t.carportModus&&t.carportSegmente&&t.carportSegmente.length>0?t.carportSegmente.length:0;
            const n=this.laengstraegerInstanz?.profileKonfig?.mitteltraegerOverride||void 0,
            i=this.quertraegerInstanz?.profileKonfig?.mitteltraegerOverride||void 0,
            r=StaticsCheck.compute(t, {
                midLongOverride:n, midTransOverride:i
            });
            this.konfiguration&&r&&(this.konfiguration.letzteStatikPruefung=r);
            const pfostenProfil=(this.konfiguration?.gibAktuelleKonfiguration?.()||{}).pfostenProfil||"160x80x4",
            mitteltraegerOverride=this.laengstraegerInstanz?.profileKonfig?.mitteltraegerOverride||"100x80x4";
            e.innerHTML=renderCarportHinweis(s)+renderStatikMarkupUtil(r, pfostenProfil, mitteltraegerOverride)
        }
        catch(t){
            this.logger.error("Statik-Rendering fehlgeschlagen:", t),
            e.innerHTML='<div style="color:#f44336;">Statik-Modul konnte nicht geladen werden.</div>'
        }
    }
    renderStatikMarkup(e){
        const pfostenProfil=(this.konfiguration?.gibAktuelleKonfiguration?.()||{}).pfostenProfil||"160x80x4",
        mitteltraegerOverride=this.laengstraegerInstanz?.profileKonfig?.mitteltraegerOverride||"100x80x4";
        return renderStatikMarkupUtil(e, pfostenProfil, mitteltraegerOverride)
    }
    renderProfilauswahl(e, t){
        return renderProfilauswahlUtil(e, t)
    }
    aktualisiereMaterialliste(){
        if(!this.konfiguration)return void console.warn("📋 Infobox: Konfiguration nicht verfügbar");
        const e=this.konfiguration.gibAktuelleKonfiguration(),
        t=this.konfiguration.berechneAbhaengigeWerte(),
        n=document.getElementById("material-table-body"),
        i=document.getElementById("material-table-footer");
        if(!n||!i)return void console.warn("📋 Infobox: Tabellen-Elemente nicht gefunden");
        const runtimeConfig="undefined"!=typeof window?window.uiController?.aktuelleKonfiguration||null:null,
        baseConfig=runtimeConfig||e,
        liveSegments=runtimeConfig?.carportSegmente,
        runtimeSegmentsActive=!!runtimeConfig?.carportModus&&Array.isArray(liveSegments)&&liveSegments.length>0,
        fallbackSegments=Array.isArray(e.carportSegmente)?e.carportSegmente:[],
        r=runtimeSegmentsActive||!!(e.carportModus&&fallbackSegments.length>0),
        segmentSource=runtimeSegmentsActive?liveSegments:fallbackSegments,
        l=r?segmentSource.length:1;
        
        // DEBUG-LOG für Carport-Modus
        console.log("🔍 Infobox Material-Berechnung:", {
            carportModus: runtimeConfig?.carportModus || e.carportModus,
            segmentCount: segmentSource.length,
            runtimeSegmentsActive,
            segmentSource
        });
        
        let a="",
        s=1,
        o=null,
        basisMaterialien=null;
        const holeBasisMaterialien=()=>{
            if(basisMaterialien)return basisMaterialien;
            try{
                basisMaterialien=this.berechneMaterialien(e, t);
            }catch(err){
                console.error("📋 Infobox: Fehler beim Berechnen der Basis-Materialien:", err);
                throw err;
            }
            return basisMaterialien;
        };
        const holeBasisAlumeter=()=>{
            try{
                return this.berechneAlumeterAusSammlung(holeBasisMaterialien());
            }catch(err){
                console.warn("📏 Basis-Alumeter konnte nicht berechnet werden:", err);
                return 0;
            }
        };
        const carportModeActive=runtimeConfig?.carportModus??e.carportModus,
        fallbackMultiplier=carportModeActive&&!r&&Number(baseConfig?.carportAnzahl)>1?Number(baseConfig.carportAnzahl):1,
        m=Math.max(1, fallbackMultiplier),
        g=r?segmentSource.map((t,n)=>{
            const i=this.erstelleSegmentKonfiguration(baseConfig, t),
            r=this.berechneAbhaengigeWerteFuerKonfiguration(i),
            istBasisSegment=this.segmentEntsprichtBasis(i, baseConfig, t),
            l=istBasisSegment?JSON.parse(JSON.stringify(holeBasisMaterialien())):this.berechneMaterialien(i, r);
            
            console.log(`📊 Segment ${n+1} Materialien berechnet:`, {
                istBasisSegment,
                quertraeger: l.quertraeger?.length,
                quertraegerDetails: l.quertraeger
            });
            
            return{
                index:n+1,
                label:t.name||`Segment ${n+1}`,
                material:l
            }
        }):[];
        const h=e=>{
            ["pfosten",
            "laengstraeger",
            "quertraeger",
            "glas",
            "aluschienen"].forEach(t=>{
                (e[t]||[]).forEach(e=>{
                    const t={
                        ...e
                    };
                    a+=this.erstelleTabellenzeile(s++, t)
                })
            })
        },
        u=(e,t)=>["pfosten",
        "laengstraeger",
        "quertraeger",
        "glas",
        "aluschienen"].forEach(n=>{
            (e[n]||[]).forEach(e=>{
                const n={
                    ...e,
                    bezeichnung:`${e.bezeichnung} (${t})`
                };
                a+=this.erstelleTabellenzeile(s++, n)
            })
        });
        if(r){
            // Im Carport-Modus IMMER einzeln auflisten (wie bei Templates)
            a+=`<tr class="carport-hint-row">\n                <td colspan="7" style="padding: 0.75rem; background: #e8f5e9; color: #2e7d32; font-weight: 600;">\n                    🚗 Carport-Modus: ${l} Segment${l>1?"e":""} – Materialliste je Segment\n                </td>\n            </tr>`;
            g.forEach(e=>{
                a+=`<tr class="segment-divider">\n                    <td colspan="7" style="padding: 0.35rem 0.5rem; background: #f5f5f5; font-weight: 600;">📦 ${e.label}</td>\n                </tr>`;
                u(e.material, e.label);
            });
            o=this.kombiniereSegmentMaterialien(g.map(e=>e.material));
            
            // DEBUG: Prüfe ob Materialien korrekt kombiniert wurden
            console.log("🔍 Kombinierte Segment-Materialien:", {
                segmentCount: g.length,
                segmentMaterialien: g.map(s => ({
                    label: s.label,
                    laengstraeger: s.material.laengstraeger?.length,
                    laengstraegerItems: s.material.laengstraeger
                })),
                kombiniert: o,
                laengstraegerKombiniert: o?.laengstraeger,
                glasArrayLength: o?.glas?.length,
                pfostenArrayLength: o?.pfosten?.length
            });
        }
        else{
            try{
                const r=holeBasisMaterialien();
                o=m>1?this.skaliereMaterialsammlung(r, m):r
            }
            catch(e){
                return console.error("📋 Infobox: Fehler beim Berechnen der Materialien:", e),
                void(n.innerHTML='<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #f44336;">Fehler beim Laden der Materialliste. Bitte Konsole prüfen.</td></tr>')
            }
            m>1&&(a+=`<tr style="background: #e8f5e9; font-weight: bold;">\n                    <td colspan="7" style="text-align: center; padding: 0.75rem; color: #2e7d32;">\n                        🚗 Carport-Modus: ${m}× Pergola (Materialien multipliziert)\n                    </td>\n                </tr>`),
            h(o)
        }
        a||(a='<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #999;">Keine Materialien verfügbar. Bitte Pergola konfigurieren.</td></tr>');
        const segmentAluSummen=r?g.map(e=>this.berechneAlumeterAusSammlung(e.material)):[];
        const sumSegmentAlu=segmentAluSummen.reduce((e,t)=>e+(Number(t)||0), 0);
        const segmenteWieBasis=r&&segmentSource.length>0&&segmentSource.every(seg=>{
            if(!seg)return !1;
            const keys=["breite","tiefe","hoehe","neigung","dachTyp","regenwasserAbfluss","pfostenProfil"];
            return keys.every(key=>{
                const baseVal=baseConfig?.[key];
                const segVal=seg[key];
                if(["breite","tiefe","hoehe","neigung"].includes(key)){
                    const a=Number(segVal??baseVal??0);
                    const b=Number(baseVal??0);
                    return Math.abs(a-b)<1e-3;
                }
                return (segVal??baseVal)===(baseVal);
            });
        });
        let gesamtAlumeterWert;
        if(r){
            if(segmenteWieBasis&&segmentSource.length>0){
                const basisSum=holeBasisAlumeter();
                gesamtAlumeterWert=basisSum*segmentSource.length;
            }
            else if(sumSegmentAlu>0){
                gesamtAlumeterWert=sumSegmentAlu;
            }
            else{
                const basisSum=holeBasisAlumeter()||0;
                gesamtAlumeterWert=basisSum*Math.max(1, segmentSource.length||1);
            }
        }
        else gesamtAlumeterWert=this.berechneAlumeterAusSammlung(o);
        this.letzteAlumeterSumme=gesamtAlumeterWert,
        o&&(o.gesamtAlumeterMeter=gesamtAlumeterWert),
        this.letzteMaterialien=o,
        n.innerHTML=a;
        const d=o?.gesamtAlu||0,
        f=o?.gesamtGlas||0;
        const dachTyp=e.dachTyp||"glas";
        const dachLabel=dachTyp==="epdm"?"EPDM-Dachfläche":"Glas-Fläche";
        i.innerHTML=`\n            <tr>\n                <td colspan="5" style="text-align: right;"><strong>GESAMT-BEDARF</strong></td>\n                <td colspan="2"></td>\n            </tr>\n            <tr>\n                <td colspan="5" style="text-align: right;">Sichtbare Alu-Oberfläche (alle 4 Seiten)</td>\n                <td colspan="2"><strong>${d.toFixed(2)} m²</strong></td>\n            </tr>\n            <tr>\n                <td colspan="5" style="text-align: right;">${dachLabel}</td>\n                <td colspan="2"><strong>${f.toFixed(2)} m²</strong></td>\n            </tr>\n        `
    }
    erstelleTabellenzeile(e, t){
        return`\n            <tr>\n                <td>${String(e).padStart(1,"0")}</td>\n                <td>${t.bezeichnung}</td>\n                <td>${t.profil}</td>\n                <td>${t.laenge}</td>\n                <td>${t.anzahl}</td>\n                <td>${t.gesamtLaenge}</td>\n                <td>${t.material}</td>\n            </tr>\n        `
    }
    multipliziereItem(e, t){
        return multipliziereItemUtil(e, t)
    }
    gibLetzteMaterialien(){
        return this.letzteMaterialien
    }
    berechneAlumeterAusSammlung(e){
        return berechneAlumeterAusSammlungUtil(e)
    }
    berechneMaterialien(e, t, opts={}){
        const n=[],
        i=[],
        r=[],
        l=[],
        a=[],
        s=(e="")=>e.toLowerCase().replace(/[^0-9a-z×x]/g, "").replace(/×/g, "x"),
        forceFallback=!!opts.forceFallback,
        o=(forceFallback?[]:this.pfostenInstanz?.gibAllePfosten?.()||[]).slice(),
        m=["vorne_links",
        "vorne_rechts",
        "vorne_mitte",
        "mitte_links",
        "mitte_zentral",
        "mitte_rechts",
        "hinten_links",
        "hinten_rechts",
        "hinten_mitte"];
        o.sort((e, t)=>{
            const n=m.indexOf(this.normalisierePfostenId(e.name)), i=m.indexOf(this.normalisierePfostenId(t.name));
            return(-1===n?Number.MAX_SAFE_INTEGER:n)-(-1===i?Number.MAX_SAFE_INTEGER:i)
        });
        const iKuerzung=Number(e.pfostenKuerzung?.vorne||0),
        rKuerzung=Number(e.pfostenKuerzung?.hinten||0),
        mittlereKuerzung=Number(e.pfostenKuerzung?.mitte??(iKuerzung+rKuerzung)/2),
        fundamentAusgleich="einbetonieren"===e.befestigung?.toLowerCase?.()?0.07:0,
        quertraegerProfil=this.quertraegerInstanz?.profileKonfig?.gibAktuellesProfil?.(),
        quertraegerHoehe=Math.max(0, quertraegerProfil?.abmessungen?.breite||.16),
        berechneLaengeMm=(basisHoehe, kuerzung)=>{
            const nutzHoehe=Math.max(0, basisHoehe-quertraegerHoehe),
            n=1e3*(nutzHoehe+fundamentAusgleich-kuerzung);
            return Math.max(0, Math.round(n))
        },
        pfostenProfil=this.pfostenInstanz?.profileKonfig?.gibAktuellesProfil?.(),
        mittelPfostenProfil=e?.zwischenpfostenProfil?this.pfostenInstanz?.profileKonfig?.gibProfil?.(e.zwischenpfostenProfil):this.pfostenInstanz?.profileKonfig?.gibMitteltraegerProfil?.(e),
        profInfo=(profil)=>{
            const b=Math.round(1e3*(profil?.abmessungen?.breite||0)),
            t=Math.round(1e3*(profil?.abmessungen?.tiefe||0)),
            gueltig=b>0&&t>0,
            anzeigeBreite=gueltig?b:160,
            anzeigeTiefe=gueltig?t:80;
            return{
                label:gueltig?`${b} × ${t}mm`:`${anzeigeBreite} × ${anzeigeTiefe}mm`,
                key:gueltig?`${b}x${t}`:"pfostenprofil",
                anzeigeBreite,
                anzeigeTiefe
            }
        },
        defaultPfInfo=profInfo(pfostenProfil),
        mittelPfInfo=profInfo(mittelPfostenProfil),
        fuegePfostenEintragHinzu=(label, laengeMm, anzahl=1, profilInfo=defaultPfInfo)=>{
            if(laengeMm<=0)return;
            const gesamtLaengeMeter=laengeMm/1e3*anzahl;
            n.push({
                bezeichnung:label,
                profil:profilInfo.label,
                laenge:this.formatMillimeter(laengeMm),
                anzahl:`${anzahl} Stk`,
                gesamtLaenge:this.formatMeter(gesamtLaengeMeter),
                material:"Aluminium",
                preisInfo:{
                    kategorie:"pfosten",
                    schluessel:`${profilInfo.key}_${laengeMm}mm`,
                    typ:"meter",
                    menge:gesamtLaengeMeter,
                    anzahl:anzahl,
                    einheit:"m",
                    displayName:`Pfosten ${profilInfo.anzeigeBreite} × ${profilInfo.anzeigeTiefe}mm`
                }
            })
        },
        generiereStandardPfostenListe=()=>{
            const liste=["vorne_links","vorne_rechts","hinten_links","hinten_rechts"];
            e.breite>4&&(liste.push("vorne_mitte","hinten_mitte")),
            e.tiefe>4&&(liste.push("mitte_links","mitte_rechts")),
            e.zentralerMittelpfosten&&liste.push("mitte_zentral");
            return liste
        },
        pfostenAktivGrund={
            vorne:!1!==e.pfostenAktiv?.vorne,
            hinten:!1!==e.pfostenAktiv?.hinten
        },
        pfostenAktivIndividuell=e.pfostenAktiv?.individuell||{},
        pfostenKuerzungIndividuell=e.pfostenKuerzung?.individuell||{},
        pfostenIstAktiv=id=>{
            const norm=this.normalisierePfostenId(id);
            if(Object.prototype.hasOwnProperty.call(pfostenAktivIndividuell, norm))return !1!==pfostenAktivIndividuell[norm];
            if(Object.prototype.hasOwnProperty.call(pfostenAktivIndividuell, id))return !1!==pfostenAktivIndividuell[id];
            if(norm.includes("mitte")&&!norm.startsWith("vorne")&&!norm.startsWith("hinten"))return pfostenAktivGrund.vorne&&pfostenAktivGrund.hinten;
            if(norm.startsWith("hinten"))return pfostenAktivGrund.hinten;
            if(norm.startsWith("vorne"))return pfostenAktivGrund.vorne;
            return !0
        },
        ermittleKuerzung=id=>{
            const norm=this.normalisierePfostenId(id);
            if(Object.prototype.hasOwnProperty.call(pfostenKuerzungIndividuell, norm))return Number(pfostenKuerzungIndividuell[norm])||0;
            if(Object.prototype.hasOwnProperty.call(pfostenKuerzungIndividuell, id))return Number(pfostenKuerzungIndividuell[id])||0;
            if(norm.includes("mitte")&&!norm.startsWith("vorne")&&!norm.startsWith("hinten"))return mittlereKuerzung;
            if(norm.startsWith("hinten"))return rKuerzung;
            if(norm.startsWith("vorne"))return iKuerzung;
            return mittlereKuerzung
        },
        ermittleBasisHoehe=id=>{
            const norm=this.normalisierePfostenId(id);
            if(norm.startsWith("hinten"))return t.hintereHoehe;
            if(norm.startsWith("vorne"))return t.vordereHoehe;
            if(norm.includes("mitte")){
                if(norm.includes("hinten"))return t.hintereHoehe;
                if(norm.includes("vorne"))return t.vordereHoehe;
                return t.vordereHoehe+t.hoehenDifferenz/2
            }
            return t.vordereHoehe
        },
        pfostenEintraege=(forceFallback||0===o.length?generiereStandardPfostenListe():o.map(e=>e.name)).map(e=>({
            id:e,
            label:this.ermittlePfostenLabel(e)
        }));
        pfostenEintraege.forEach(pf=>{
            if(!pf.id||!pfostenIstAktiv(pf.id))return;
            const basisHoehe=ermittleBasisHoehe(pf.id),
            kuerzung=ermittleKuerzung(pf.id),
            laenge=berechneLaengeMm(basisHoehe, kuerzung),
            normId=this.normalisierePfostenId(pf.id),
            istZwischenpfosten=normId.includes("mitte")&&!normId.includes("zentral"),
            profilInfo=istZwischenpfosten?mittelPfInfo:defaultPfInfo;
            fuegePfostenEintragHinzu(`Pfosten ${pf.label}`, laenge, 1, profilInfo)
        });
        const g=this.pfostenInstanz?.profileKonfig?.gibAktuellesProfil?.(),
        h=Math.round(1e3*(g?.abmessungen?.breite||0)),
        u=Math.round(1e3*(g?.abmessungen?.tiefe||0)),
        d=h>0&&u>0?`${h} × ${u}mm`:"160 × 80mm",
        f=forceFallback?[]:this.laengstraegerInstanz?.gibAlleLaengstraeger?.()||[],
        c=f.filter(e=>{
            const t=(e.name||"").toLowerCase();
            return"links"===t||"rechts"===t
        }),
        p=f.filter(e=>{
            const t=(e.name||"").toLowerCase();
            return!("links"===t||"rechts"===t)
        }),
        aktKonfig=this.konfiguration?.gibAktuelleKonfiguration?.(),
        b=this.laengstraegerInstanz?.profileKonfig?.gibMitteltraegerProfil?.(aktKonfig),
        k=Math.round(1e3*(b?.abmessungen?.breite||.1)),
        $=Math.round(1e3*(b?.abmessungen?.tiefe||.08)),
        z=k>0&&$>0?`${k} × ${$}mm`:"100 × 80mm",
        M=this.quertraegerInstanz?.profileKonfig?.gibAktuellesProfil?.(),
        y=Math.round(1e3*(M?.abmessungen?.tiefe||.08)),
        v=this.quertraegerInstanz?.profileKonfig?.gibMitteltraegerProfil?.(aktKonfig),
        vHoeheMm=Math.round(1e3*(v?.abmessungen?.tiefe||0))||Math.round(1e3*(v?.abmessungen?.breite||0)),
        x=(Math.round(1e3*(v?.abmessungen?.tiefe||.08)), 1e3*e.tiefe),
        A=1e3*t.hoehenDifferenz,
        I=Math.sqrt(Math.pow(x, 2)+Math.pow(A, 2)),
        L=Math.max(0, I),
        innereLaengsAnzahl=p.length,
        innereLaengsLaengeMm=Math.round(Math.max(0, L-2*y)),
        q=forceFallback?[]:this.quertraegerInstanz?.gibAlleQuertraeger?.()||[],
        S=(e, t, n, o)=>{
            if(e<=0)return;
            const r=Math.round(o), l=r/1e3*e;
            i.push({
                bezeichnung:t, profil:n, laenge:this.formatMillimeter(r), anzahl:`${e} Stk`, gesamtLaenge:this.formatMeter(l), material:"Aluminium", preisInfo:{
                    kategorie:"laengstraeger", schluessel:s(n), typ:"meter", menge:l, anzahl:e, einheit:"m", displayName:`${t} (${n})`
                }
            })
        },
        w=this.koordinatenSystem||this.konfiguration.koordinatenSystem,
        P=w?.glasBerechnung||null,
        E=Math.max(0, L-2*y);
        const isFlachdachGlas200x100 = Math.abs(e.neigung||0)<=1e-6 && e.dachTyp==="glas" && ((e.pfostenProfil||"").startsWith("200x100") || (g?.id||"").startsWith("200x100"));
        const trimBackMaterial= isFlachdachGlas200x100 ? 0.035 : 0; // 35mm Rücksprung für hinterste Glasreihe/Seitenprofil
        const trimBackMaterialMm = Math.round(trimBackMaterial*1000);
        const extraBackOffsetMm = 40; // zusätzlicher Abzug hinten wegen Querträger-Seitenprofil
        S(c.length||2, "Längsträger Rahmen (außen)", d, E);
        
        // Berechne innere Längsträger - auch im Fallback-Modus
        let N=p.length;
        if(N===0 && forceFallback){
            // Fallback: Berechne Anzahl basierend auf Glasberechnung
            const anzahlMitteltraeger=P?.anzahlMitteltraeger||0;
            N=anzahlMitteltraeger;
        }
        
        if(N){
            S(N, "Innere Längsträger", z, Math.max(0, L-2*y))
        }
        const G=Math.round(1e3*e.breite),
        T=Math.max(2, q.length||2);
        let B=Math.max(0, T-2);
        if(B===0 && forceFallback){
            const fallbackInner=Number(P?.traegerPositionen?.length??P?.anzahlMitteltraeger??0);
            if(fallbackInner>0){
                B=fallbackInner;
            }else{
                const widthBased=Math.max(0, Math.round(e.breite/.5));
                B=widthBased;
            }
        }
        if(r.push({
            bezeichnung:"Querträger Rahmen", profil:d, laenge:this.formatMillimeter(G), anzahl:"2 Stk", gesamtLaenge:this.formatMeter(2*G/1e3), material:"Aluminium", preisInfo:{
                kategorie:"quertraeger", schluessel:s(d), typ:"meter", menge:2*G/1e3, anzahl:2, einheit:"m", displayName:`Querträger Rahmen (${d})`
            }
        }), B>0&&P?.lichtabstaende){
            const e=P.lichtabstaende.length,
            t=B*e,
            n=P.lichtabstaende.reduce((e, t)=>e+t, 0)/e,
            i=Math.round(1e3*n),
            l=z,
            a=`${k}x${$}`.toLowerCase();
            r.push({
                bezeichnung:"Innere Querträger", profil:l, laenge:this.formatMillimeter(i), anzahl:`${t} Stk`, gesamtLaenge:this.formatMeter(i*t/1e3), material:"Aluminium", preisInfo:{
                    kategorie:"quertraeger", schluessel:a, typ:"meter", menge:i*t/1e3, anzahl:t, einheit:"m", displayName:`Innere Querträger (${l})`
                }
            })
        }
        // Seitliche Glas-Auflager (40×40) bei Flachdach
        if(Math.abs(e.neigung)<=1e-6){
            const rahmenProfilTiefeMm = 1e3 * (this.laengstraegerInstanz?.profileKonfig?.gibAktuellesProfil?.()?.abmessungen?.tiefe || .08);
            const innenlängeMm = e.tiefe * 1000 - 2 * rahmenProfilTiefeMm;
            const mitteltraegerBreiteMm = vHoeheMm > 0 ? vHoeheMm : 80;

            const seitenprofilBreiteMm=40,
            seitenprofilTiefeMm=40,
            seitenprofilLabel=`${seitenprofilBreiteMm} × ${seitenprofilTiefeMm}mm`,
            seitenprofilSchluessel="40x40",
            // Vorderes Seitenprofil: innenlänge / 2 - mittelträgerBreite / 2
            segmentLaengeMm=Math.max(0, innenlängeMm / 2 - mitteltraegerBreiteMm / 2),
            seitenprofilLaengeMeterFront=segmentLaengeMm/1e3,
            // Hinteres Seitenprofil: segmentLaenge - 40mm Kürzung
            seitenprofilLaengeMeterHinten=Math.max(0, (segmentLaengeMm - extraBackOffsetMm)/1e3);
            const gesamtFront=2*seitenprofilLaengeMeterFront;
            const gesamtHinten=2*seitenprofilLaengeMeterHinten;
            r.push({
                bezeichnung:"Seitenprofile vorne",
                profil:seitenprofilLabel,
                laenge:this.formatMillimeter(Math.round(segmentLaengeMm)),
                anzahl:"2 Stk",
                gesamtLaenge:this.formatMeter(gesamtFront),
                material:"Aluminium",
                preisInfo:{
                    kategorie:"seitenprofile",
                    schluessel:seitenprofilSchluessel+"_front",
                    typ:"meter",
                    menge:gesamtFront,
                    anzahl:2,
                    einheit:"m",
                    displayName:"Seitenprofile vorne 40×40mm"
                }
            });
            r.push({
                bezeichnung:`Seitenprofile hinten (gekürzt um ${extraBackOffsetMm}mm)`,
                profil:seitenprofilLabel,
                laenge:this.formatMillimeter(Math.round(Math.max(0, segmentLaengeMm - extraBackOffsetMm))),
                anzahl:"2 Stk",
                gesamtLaenge:this.formatMeter(gesamtHinten),
                material:"Aluminium",
                preisInfo:{
                    kategorie:"seitenprofile",
                    schluessel:seitenprofilSchluessel+"_hinten",
                    typ:"meter",
                    menge:gesamtHinten,
                    anzahl:2,
                    einheit:"m",
                    displayName:"Seitenprofile hinten 40×40mm (gekürzt)"
                }
            })
        }
        // Seitenprofile Querträger hinten (40×40) – entlang der Lichtabstände
        if(Math.abs(e.neigung)<=1e-6 && P?.lichtabstaende?.length){
            const seitenprofilBreiteMm=40,
            seitenprofilTiefeMm=40,
            seitenprofilLabel=`${seitenprofilBreiteMm} × ${seitenprofilTiefeMm}mm`,
            seitenprofilSchluessel="40x40_qt_hinten";
            const gruppiert=new Map();
            P.lichtabstaende.forEach(dist=>{
                const mm=Math.round(1e3*dist);
                const entry=gruppiert.get(mm)||{breite:mm, anzahl:0};
                entry.anzahl+=1;
                gruppiert.set(mm, entry);
            });
            gruppiert.forEach(entry=>{
                const gesamtLaenge=entry.breite/1e3*entry.anzahl;
                r.push({
                    bezeichnung:"Seitenprofile Querträger hinten",
                    profil:seitenprofilLabel,
                    laenge:this.formatMillimeter(entry.breite),
                    anzahl:`${entry.anzahl} Stk`,
                    gesamtLaenge:this.formatMeter(gesamtLaenge),
                    material:"Aluminium",
                    preisInfo:{
                        kategorie:"seitenprofile",
                        schluessel:seitenprofilSchluessel,
                        typ:"meter",
                        menge:gesamtLaenge,
                        anzahl:entry.anzahl,
                        einheit:"m",
                        displayName:"Seitenprofile Querträger hinten 40×40mm"
                    }
                })
            })
        }
        else if(B>0&&Math.abs(e.neigung)<=1e-6){
            const e=z,
            t=`${k}x${$}`.toLowerCase();
            r.push({
                bezeichnung:"Innere Querträger", profil:e, laenge:this.formatMillimeter(G), anzahl:`${B} Stk`, gesamtLaenge:this.formatMeter(G*B/1e3), material:"Aluminium", preisInfo:{
                    kategorie:"quertraeger", schluessel:t, typ:"meter", menge:G*B/1e3, anzahl:B, einheit:"m", displayName:`Innere Querträger (${e})`
                }
            })
        }
        console.log("🔍 DEBUG Materialliste Glas:", {
            dachTyp:e.dachTyp, koordinatenSystem:w, glasBerechnung:P, glasBreiten:P?.glasBreiten, anzahlGlaeser:P?.anzahlGlaeser
        });
        const fuegeFallbackGlasEintragHinzu=()=>{
            const breite=Math.max(0, Number(e.breite)||0);
            const tiefe=Math.max(0, Number(e.tiefe)||0);
            const flaeche=breite*tiefe;
            if(flaeche<=0)return;
            const glasKey=(e.glasFarbe||e.glasTyp||"standard").toLowerCase();
            l.push({
                bezeichnung:"Glasfläche",
                profil:`${Math.round(1e3*breite)} × ${Math.round(1e3*tiefe)}mm`,
                laenge:"8mm stark",
                anzahl:"1 Set",
                gesamtLaenge:`${flaeche.toFixed(2)} m²`,
                material:"VSG-Glas",
                preisInfo:{
                    kategorie:"glas",
                    schluessel:glasKey,
                    typ:"qm",
                    menge:flaeche,
                    anzahl:1,
                    einheit:"m²",
                    displayName:"Glasfläche"
                }
            })
        };
        if("epdm"!==e.dachTyp)if(forceFallback)fuegeFallbackGlasEintragHinzu();
        else if(P&&P.glasBreiten&&P.glasBreiten.length>0){
            const i="rinne"===e.regenwasserAbfluss,
            r=this.pfostenInstanz?.profileKonfig?.gibAktuellesProfil?.(),
            a=1e3*(r?.abmessungen?.breite||.16);
            // Korrekte Berechnung basierend auf tatsächlicher Geometrie (immer, auch <3m Tiefe)
            const profilTiefe = 1e3 * (r?.abmessungen?.tiefe || .08); // Profiltiefe in mm (80mm für 160×80, 100mm für 200×100)
            const gapZwischenGlaesern = 5; // 5mm Gap

            const istFlachdach = Math.abs(e.neigung) <= 1e-6;
            const istPultdach = e.neigung > 0;
            const istGlasueberstand = e.regenwasserAbfluss === "glasueberstand" && istPultdach;
            const istMitRinne = e.regenwasserAbfluss === "rinne";

            let hinteresGlasMm, vorderesGlasMm;

            if (istGlasueberstand) {
                // Pultdach + Glasüberstand
                // GEOMETRIE: Mittelträger liegt exakt in der Mitte der Pergola-Tiefe
                // Gesamttiefe = hintere Trägeraußenseite bis vordere Trägeraußenseite
                const gesamtTiefeMm = e.tiefe * 1000;  // z.B. 3000mm
                const mitteltraegerPositionMm = gesamtTiefeMm / 2;  // z.B. 1500mm von hinten
                
                const glasUeberstandVorne = 50;  // 50mm Überstand über vorderen Träger
                const auflageHinten = 40;        // 40mm Auflage auf hinterem Träger
                const auflageVorne = profilTiefe; // 80mm (oder 100mm bei 200×100) volle Auflage vorne
                
                // Fuge liegt symmetrisch um Mittelposition: [Mitte - 2.5mm] bis [Mitte + 2.5mm]
                const fugeStart = mitteltraegerPositionMm - gapZwischenGlaesern / 2;  // z.B. 1497.5mm
                const fugeEnde = mitteltraegerPositionMm + gapZwischenGlaesern / 2;    // z.B. 1502.5mm
                
                // Hinteres Glas (waagerecht): von Auflage-Ende (40mm) bis Fugen-Start
                const hinteresGlasWaagerechtMm = fugeStart - auflageHinten;  // z.B. 1497.5 - 40 = 1457.5mm
                
                // Vorderes Glas (waagerecht): von Fugen-Ende bis Außenkante + Überstand
                const vorderesGlasWaagerechtMm = gesamtTiefeMm + glasUeberstandVorne - fugeEnde;  // z.B. 3050 - 1502.5 = 1547.5mm
                
                // Speichere waagerechte Längen (vor Neigung)
                hinteresGlasMm = hinteresGlasWaagerechtMm;
                vorderesGlasMm = vorderesGlasWaagerechtMm;
            } else if (istMitRinne && istFlachdach) {
                // Flachdach + Mit Rinne
                // GEOMETRIE: Mittelträger liegt exakt in der Mitte der Pergola-Tiefe
                const gesamtTiefeMm = e.tiefe * 1000;  // z.B. 3000mm
                const mitteltraegerPositionMm = gesamtTiefeMm / 2;  // z.B. 1500mm
                
                const auflageVorneInRinne = 10;  // 10mm Glas liegt innen in Rinne auf
                const abstandVorneZuRinne = profilTiefe - auflageVorneInRinne;  // 80 - 10 = 70mm
                const startHinteresTrägerprofil = profilTiefe;  // 80mm (hinterer Träger, Glas liegt nicht auf)
                
                // Fuge liegt symmetrisch um Mittelposition: [Mitte - 2.5mm] bis [Mitte + 2.5mm]
                const fugeStart = mitteltraegerPositionMm - gapZwischenGlaesern / 2;  // z.B. 1497.5mm
                const fugeEnde = mitteltraegerPositionMm + gapZwischenGlaesern / 2;    // z.B. 1502.5mm
                
                // Hinteres Glas (waagerecht): von Ende hinterer Träger (80mm) bis Fugen-Start
                const hinteresGlasWaagerechtMm = fugeStart - startHinteresTrägerprofil;  // 1497.5 - 80 = 1417.5mm
                
                // Vorderes Glas (waagerecht): von Fugen-Ende bis Glaskante vorne
                // Glaskante vorne = Gesamttiefe - Abstand zur Rinne
                const glaskanteVorneMm = gesamtTiefeMm - abstandVorneZuRinne;  // 3000 - 70 = 2930mm
                const vorderesGlasWaagerechtMm = glaskanteVorneMm - fugeEnde;  // 2930 - 1502.5 = 1427.5mm
                
                // Speichere waagerechte Längen (vor Neigung)
                hinteresGlasMm = hinteresGlasWaagerechtMm;
                vorderesGlasMm = vorderesGlasWaagerechtMm;
            } else if (istMitRinne && istPultdach) {
                // Pultdach + Mit Rinne
                // GEOMETRIE: Mittelträger liegt exakt in der Mitte der Pergola-Tiefe
                const gesamtTiefeMm = e.tiefe * 1000;  // z.B. 3000mm
                const mitteltraegerPositionMm = gesamtTiefeMm / 2;  // z.B. 1500mm
                
                const auflageHinten = 40;  // 40mm Glas liegt hinten auf
                const auflageVorneInRinne = 10;  // 10mm Glas liegt innen in Rinne auf
                const abstandVorneZuRinne = profilTiefe - auflageVorneInRinne;  // 80 - 10 = 70mm
                
                // Fuge liegt symmetrisch um Mittelposition: [Mitte - 2.5mm] bis [Mitte + 2.5mm]
                const fugeStart = mitteltraegerPositionMm - gapZwischenGlaesern / 2;  // z.B. 1497.5mm
                const fugeEnde = mitteltraegerPositionMm + gapZwischenGlaesern / 2;    // z.B. 1502.5mm
                
                // Hinteres Glas (waagerecht): von Auflage-Ende (40mm) bis Fugen-Start
                const hinteresGlasWaagerechtMm = fugeStart - auflageHinten;  // 1497.5 - 40 = 1457.5mm
                
                // Vorderes Glas (waagerecht): von Fugen-Ende bis Glaskante vorne
                // Glaskante vorne = Gesamttiefe - Abstand zur Rinne
                const glaskanteVorneMm = gesamtTiefeMm - abstandVorneZuRinne;  // 3000 - 70 = 2930mm
                const vorderesGlasWaagerechtMm = glaskanteVorneMm - fugeEnde;  // 2930 - 1502.5 = 1427.5mm
                
                // Speichere waagerechte Längen (vor Neigung)
                hinteresGlasMm = hinteresGlasWaagerechtMm;
                vorderesGlasMm = vorderesGlasWaagerechtMm;
            } else {
                // Vollprofil (Fallback)
                const innenlänge = e.tiefe * 1000 - profilTiefe;
                hinteresGlasMm = (innenlänge - gapZwischenGlaesern) / 2;
                vorderesGlasMm = hinteresGlasMm;
            }

            // Neigungsfaktor
            let neigungsFaktor = 1;
            if (istPultdach) {
                // Pultdach: volle Neigung
                const neigungRad = e.neigung * Math.PI / 180;
                neigungsFaktor = 1 / Math.cos(neigungRad);
            } else if (istFlachdach && istMitRinne) {
                // Flachdach + Rinne: Nur innere Längsträger neigen sich leicht (~1°, 8mm auf Tiefe)
                const absenkungHinten = 0.008; // 8mm
                const effektiveTiefe = e.tiefe;
                const leichteNeigung = Math.atan2(absenkungHinten, effektiveTiefe);
                neigungsFaktor = 1 / Math.cos(leichteNeigung);
            }

            // Finale Längen mit Neigungsfaktor
            const m=Math.round(vorderesGlasMm * neigungsFaktor),
            g=Math.round(hinteresGlasMm * neigungsFaktor),
            h=P.glasBreiten,
            u=h.length,
            d={};
            h.forEach((e, t)=>{
                const n=Math.round(1e3*e), i=0===t||t===u-1?"Rand":"Standard", r=`${n}_${i}`;
                d[r]||(d[r]={
                    breitemm:n, typ:i, anzahl:0
                }), d[r].anzahl++
            }),
            Object.values(d).forEach(e=>{
                const t=e.breitemm*m/1e6*e.anzahl, n=t.toFixed(2);
                let i="";
                e.breitemm<700&&e.breitemm>=640||e.breitemm>850&&e.breitemm<=910?i=" ⚠️ (Toleranz)":(e.breitemm<640||e.breitemm>910)&&(i=" ❌ (außerhalb)"), l.push({
                    bezeichnung:`Vordere ${e.typ}-Glaspaneele VSG${i}`, profil:`${e.breitemm} × ${m}mm`, laenge:"8mm stark", anzahl:`${e.anzahl} Stk`, gesamtLaenge:`${n} m²`, material:"VSG-Glas", preisInfo:{
                        kategorie:"glas", schluessel:e.typ.toLowerCase(), typ:"qm", menge:t, anzahl:e.anzahl, einheit:"m²", displayName:`Vordere ${e.typ}-Glaspaneele`
                    }
                })
            }),
            Object.values(d).forEach(e=>{
                const t=e.breitemm*g/1e6*e.anzahl, n=t.toFixed(2);
                let i="";
                e.breitemm<700&&e.breitemm>=640||e.breitemm>850&&e.breitemm<=910?i=" ⚠️ (Toleranz)":(e.breitemm<640||e.breitemm>910)&&(i=" ❌ (außerhalb)"), l.push({
                    bezeichnung:`Hintere ${e.typ}-Glaspaneele VSG${i}${trimBackMaterialMm>0?` (Tiefe -${trimBackMaterialMm}mm)`:``}`, profil:`${e.breitemm} × ${g}mm`, laenge:"8mm stark", anzahl:`${e.anzahl} Stk`, gesamtLaenge:`${n} m²`, material:"VSG-Glas", preisInfo:{
                        kategorie:"glas", schluessel:e.typ.toLowerCase(), typ:"qm", menge:t, anzahl:e.anzahl, einheit:"m²", displayName:`Hintere ${e.typ}-Glaspaneele`
                    }
                })
            })
        }
        else console.warn("⚠️ Materialliste: Keine glasBerechnung vorhanden oder leer!", {
            glasBerechnung:P, koordinatenSystem:w
        });
        else{
            const basisBreite=Math.max(0, Number(e.breite)||0),
            alleLaengstraeger=this.laengstraegerInstanz?.gibAlleLaengstraeger?.()||[],
            linksTraeger=alleLaengstraeger.find(t=>"string"==typeof t.name&&t.name.includes("links")),
            rechtsTraeger=alleLaengstraeger.find(t=>"string"==typeof t.name&&t.name.includes("rechts"));
            let breite=basisBreite;
            if(linksTraeger&&rechtsTraeger){
                const linksStart=linksTraeger.referenzpunkte?.start,
                rechtsStart=rechtsTraeger.referenzpunkte?.start,
                linksBreite=linksTraeger.abmessungen?.breite||0,
                rechtsBreite=rechtsTraeger.abmessungen?.breite||linksBreite,
                innenLinks=(linksStart?.x??0)+linksBreite/2,
                innenRechts=(rechtsStart?.x??basisBreite)-rechtsBreite/2,
                berechneteBreite=innenRechts-innenLinks,
                fallbackAbstand=(rechtsStart?.x??0)-(linksStart?.x??0);
                breite=Math.max(0, berechneteBreite>0?berechneteBreite:Math.abs(fallbackAbstand))
            }
            const tiefe=Math.max(0, Number(e.tiefe)||0),
            hoehenDiff=Math.max(0, Number(t.hoehenDifferenz)||0),
            dachLaenge=Math.sqrt(Math.pow(tiefe, 2)+Math.pow(hoehenDiff, 2)),
            flaeche=breite*dachLaenge,
            epdmLabel=e.epdmFarbe?`EPDM (${e.epdmFarbe})`:"EPDM-Folie";
            if(flaeche>0){
                l.push({
                    bezeichnung:"EPDM-Dachfolie", profil:`${Math.round(1e3*breite||1e3*basisBreite)} × ${Math.round(1e3*dachLaenge)}mm`, laenge:"1,5mm stark", anzahl:"1 Stk", gesamtLaenge:`${flaeche.toFixed(2)} m²`, material:epdmLabel, preisInfo:{
                        kategorie:"epdm", schluessel:"epdm_folie", typ:"qm", menge:flaeche, anzahl:1, einheit:"m²", displayName:"EPDM-Dachfolie"
                    }
                }),
                l.push({
                    bezeichnung:"Unterkonstruktion OSB", profil:`${Math.round(1e3*breite||1e3*basisBreite)} × ${Math.round(1e3*dachLaenge)}mm`, laenge:"18mm OSB-3", anzahl:"1 Stk", gesamtLaenge:`${flaeche.toFixed(2)} m²`, material:"OSB-Platten", preisInfo:{
                        kategorie:"epdm", schluessel:"osb", typ:"qm", menge:flaeche, anzahl:1, einheit:"m²", displayName:"Unterkonstruktion OSB"
                    }
                })
            }
        }
        // Aluschienen nur bei Glas-Dachtyp hinzufügen, nicht bei EPDM
        const istFlachdachGlas = Math.abs(e.neigung || 0) <= 1e-6 && e.dachTyp === "glas";
        const istPultdachMitRinne = Math.abs(e.neigung || 0) > 1e-6 && e.regenwasserAbfluss === "rinne";
        const istPultdachGlasueberstand = Math.abs(e.neigung || 0) > 1e-6 && e.regenwasserAbfluss === "glasueberstand";
        if("epdm"!==e.dachTyp){
            // Bei Flachdach + Glas: KEINE Aluschienen für Querträger und äußere Längsträger
            if (!istFlachdachGlas) {
                "rinne"===e.regenwasserAbfluss&&a.push({
                    bezeichnung:"Hinweis: Vorderer Querträger ist U-Profil (Rinne)", profil:"U-förmig", laenge:this.formatMillimeter(G), anzahl:"1 Stk", gesamtLaenge:"siehe Querträger", material:"Integriert"
                }),
                a.push({
                    bezeichnung:"Aluschiene hinterer Querträger (L-förmig, Glashalterung)", profil:"60 × 20 × 2mm", laenge:this.formatMillimeter(G), anzahl:"1 Stk", gesamtLaenge:this.formatMeter(G/1e3), material:"Aluminium", preisInfo:{
                        kategorie:"aluschiene", schluessel:"60x20", typ:"meter", menge:G/1e3, anzahl:1, einheit:"m", displayName:"Aluschiene hinterer Querträger"
                    }
                });
                // Äußere Längsträger: Aluschienen-Länge
                let aeussereAluprofilLaengeMm;
                if (istPultdachMitRinne) {
                    // Pultdach + Rinne: Schienen durchgezogen (keine Fuge)
                    // Geometrie: von 80mm bis 2930mm
                    const r = this.laengstraegerInstanz?.profileKonfig?.gibAktuellesProfil?.();
                    const profilTiefe = 1e3 * (r?.abmessungen?.tiefe || .08);
                    const startHinteresTrägerprofil = profilTiefe; // z.B. 80mm
                    const auflageVorneInRinne = 10;
                    const abstandVorneZuRinne = profilTiefe - auflageVorneInRinne;
                    const glaskanteVorneMm = e.tiefe * 1000 - abstandVorneZuRinne;
                    aeussereAluprofilLaengeMm = glaskanteVorneMm - startHinteresTrägerprofil; // z.B. 2930 - 80 = 2850mm
                } else if (istPultdachGlasueberstand) {
                    // Pultdach + Glasüberstand: Schienen durchgezogen (keine Fuge)
                    // Basis wie Pultdach+Rinne (2850mm), plus 70mm (voller Träger vorne) + 50mm Überstand = +120mm
                    const r = this.laengstraegerInstanz?.profileKonfig?.gibAktuellesProfil?.();
                    const profilTiefe = 1e3 * (r?.abmessungen?.tiefe || .08);
                    const startHinteresTrägerprofil = profilTiefe; // z.B. 80mm (wie bei Rinne)
                    const auflageVorneInRinne = 10; // Bei Rinne: 10mm Einzug
                    const abstandVorneZuRinne = profilTiefe - auflageVorneInRinne; // 70mm bei Rinne
                    const glasUeberstandVorne = 50; // 50mm Überstand bei Glasüberstand
                    const glaskanteVorneMm = e.tiefe * 1000 - abstandVorneZuRinne + abstandVorneZuRinne + glasUeberstandVorne; // 3000 - 70 + 70 + 50 = 3050mm
                    aeussereAluprofilLaengeMm = glaskanteVorneMm - startHinteresTrägerprofil; // z.B. 3050 - 80 = 2970mm
                } else {
                    // Alle anderen: vorderes Glas + Gap + hinteres Glas (mit Neigung)
                    const glasfuge = 5; // 5mm Fuge zwischen Gläsern
                    aeussereAluprofilLaengeMm = m + glasfuge + g;
                }
                a.push({
                    bezeichnung:"Aluschiene äußere Längsträger (L-förmig, Glashalterung)", profil:"60 × 20 × 2mm", laenge:this.formatMillimeter(aeussereAluprofilLaengeMm), anzahl:"2 Stk", gesamtLaenge:this.formatMeter(2*aeussereAluprofilLaengeMm/1e3), material:"Aluminium", preisInfo:{
                        kategorie:"aluschiene", schluessel:"60x20", typ:"meter", menge:2*aeussereAluprofilLaengeMm/1e3, anzahl:2, einheit:"m", displayName:"Aluschiene äußere Längsträger"
                    }
                });
            }

            // Innere Längsträger: Aluschienen-Länge
            if(N>0){
                let innereAluprofilLaengeMm;
                if (istFlachdachGlas) {
                    // Bei Flachdach+Glas: Länge = vorderes Glas + Gap + hinteres Glas
                    const profilTiefe = 1e3 * (this.laengstraegerInstanz?.profileKonfig?.gibAktuellesProfil?.()?.abmessungen?.tiefe || .08);
                    const innenlänge = e.tiefe * 1000 - 2 * profilTiefe;
                    const gapZwischenGlaesern = 5;
                    const glasUeberstandVorne = 10;
                    const hinteresGlasMm = (innenlänge - gapZwischenGlaesern) / 2;
                    const vorderesGlasMm = hinteresGlasMm + glasUeberstandVorne;
                    // Runde einzelne Gläser und summiere (wie in Materialliste)
                    innereAluprofilLaengeMm = Math.round(vorderesGlasMm) + gapZwischenGlaesern + Math.round(hinteresGlasMm);
                } else if (istPultdachMitRinne) {
                    // Pultdach + Rinne: Schienen durchgezogen (keine Fuge)
                    // Geometrie: von 80mm bis 2930mm
                    const r = this.laengstraegerInstanz?.profileKonfig?.gibAktuellesProfil?.();
                    const profilTiefe = 1e3 * (r?.abmessungen?.tiefe || .08);
                    const startHinteresTrägerprofil = profilTiefe; // z.B. 80mm
                    const auflageVorneInRinne = 10;
                    const abstandVorneZuRinne = profilTiefe - auflageVorneInRinne;
                    const glaskanteVorneMm = e.tiefe * 1000 - abstandVorneZuRinne;
                    innereAluprofilLaengeMm = glaskanteVorneMm - startHinteresTrägerprofil; // z.B. 2930 - 80 = 2850mm
                } else if (istPultdachGlasueberstand) {
                    // Pultdach + Glasüberstand: Schienen durchgezogen (keine Fuge)
                    // Basis wie Pultdach+Rinne (2850mm), plus 70mm (voller Träger vorne) + 50mm Überstand = +120mm
                    const r = this.laengstraegerInstanz?.profileKonfig?.gibAktuellesProfil?.();
                    const profilTiefe = 1e3 * (r?.abmessungen?.tiefe || .08);
                    const startHinteresTrägerprofil = profilTiefe; // z.B. 80mm (wie bei Rinne)
                    const auflageVorneInRinne = 10; // Bei Rinne: 10mm Einzug
                    const abstandVorneZuRinne = profilTiefe - auflageVorneInRinne; // 70mm bei Rinne
                    const glasUeberstandVorne = 50; // 50mm Überstand bei Glasüberstand
                    const glaskanteVorneMm = e.tiefe * 1000 - abstandVorneZuRinne + abstandVorneZuRinne + glasUeberstandVorne; // 3000 - 70 + 70 + 50 = 3050mm
                    innereAluprofilLaengeMm = glaskanteVorneMm - startHinteresTrägerprofil; // z.B. 3050 - 80 = 2970mm
                } else {
                    // Alle anderen Fälle: Verwende tatsächliche Glaslängen (m und g sind bereits mit Neigung berechnet)
                    // m = vorderes Glas mit Neigung, g = hinteres Glas mit Neigung
                    const glasfuge = 5; // 5mm Fuge zwischen Gläsern
                    innereAluprofilLaengeMm = m + glasfuge + g;
                }
                a.push({
                    bezeichnung:"Aluschiene innere Längsträger (T-förmig, Glasauflage)", profil:"60 × 20 × 2mm T-Form", laenge:this.formatMillimeter(innereAluprofilLaengeMm), anzahl:`${N} Stk`, gesamtLaenge:this.formatMeter(innereAluprofilLaengeMm*N/1e3), material:"Aluminium", preisInfo:{
                        kategorie:"aluschiene", schluessel:"60x20_t", typ:"meter", menge:innereAluprofilLaengeMm*N/1e3, anzahl:N, einheit:"m", displayName:"Aluschiene innere Längsträger (T-Form)"
                    }
                })
            }
        }
        const K=this.berechneAluFlaeche(),
        D=l.reduce((e, t)=>e+(parseFloat(t.gesamtLaenge)||0), 0);
        return{
            pfosten:n,
            laengstraeger:i,
            quertraeger:r,
            glas:l,
            aluschienen:a,
            gesamtAlu:K,
            gesamtGlas:D
        }
    }
    segmenteSindIdentisch(segmentList=[], referenzKonfiguration={}){
        return segmenteSindIdentischUtil(segmentList, referenzKonfiguration)
    }
    segmentEntsprichtBasis(segmentKonfig={}, basisKonfig={}, originalesSegment={}){
        return segmentEntsprichtBasisUtil(segmentKonfig, basisKonfig, originalesSegment)
    }
    leseIndividuellenVersatzEintrag(e){
        return leseIndividuellenVersatzEintragUtil(e)
    }
    lesePfostenVersatz(e, t, n){
        return lesePfostenVersatzUtil(e, t, n)
    }
    lesePfostenVersatzTiefe(e, t){
        return lesePfostenVersatzTiefeUtil(e, t)
    }
    erstelleVersatzSektion(e){
        const t=this.pfostenInstanz?.gibAllePfosten?.()||[];
        if(!t.length&&!e.pfostenVersaetze?.individuell)return"";
        return`\n            <div class="konstruktion-section">\n                <h5>📍 PFOSTENVERSÄTZE</h5>\n                <ul>\n                    ${t.map(t=>{const n=t.name,i=this.ermittlePfostenLabel(n),r=this.lesePfostenVersatz(e,n,"x"),l=this.lesePfostenVersatzTiefe(e,n),a=[];return Math.abs(r)>1e-4&&a.push(`seitlicher Versatz: ${
            this.ermittleVersatzAnzeige(r, "x")
        }
        `),Math.abs(l)>1e-4&&a.push(`Versatz entlang Tiefe: ${
            this.ermittleVersatzAnzeige(l, "z")
        }
        `),a.length||a.push("kein individueller Versatz"),`<li><strong>${
            i
        }
        :</strong> ${
            a.join(" | ")
        }
        </li>`}).join("")}\n                </ul>\n            </div>\n        `
    }
    berechneAluFlaeche(){
        const e=(e=0, t=0)=>2*(e+t);
        let t=0;
        (this.pfostenInstanz?.gibAllePfosten?.()||[]).forEach(n=>{
            const{
                breite:i=0, tiefe:r=0, hoehe:l=0
            }
            =n.abmessungen||{};
            i>0&&r>0&&l>0&&(t+=e(i, r)*l)
        });
        (this.laengstraegerInstanz?.gibAlleLaengstraeger?.()||[]).forEach(n=>{
            const{
                laenge:i=0, breite:r=0, hoehe:l=0
            }
            =n.abmessungen||{};
            i>0&&r>0&&l>0&&(t+=e(r, l)*i)
        });
        return(this.quertraegerInstanz?.gibAlleQuertraeger?.()||[]).forEach(n=>{
            const{
                laenge:i=0, breite:r=0, hoehe:l=0
            }
            =n.abmessungen||{};
            i>0&&r>0&&l>0&&(t+=e(r, l)*i)
        }),
        t
    }
    aktualisiereKonstruktionsdokumentation(){
        if(!this.konfiguration)return void console.warn("Konfiguration nicht verfügbar");
        const e=this.konfiguration.gibAktuelleKonfiguration(),
        t=this.konfiguration.berechneAbhaengigeWerte(),
        n=document.getElementById("konstruktion-content"),
        i=this.pfostenInstanz?.profileKonfig?.gibAktuellesProfil?.(),
        r=Math.round(1e3*(i?.abmessungen?.breite||0)),
        l=Math.round(1e3*(i?.abmessungen?.tiefe||0)),
        a=r>0&&l>0?`${r}×${l}mm`:"160×80mm";
        if(!n)return void console.warn("Konstruktion-Content nicht gefunden");
        const formatProfilLabel=profil=>{
            const b=Math.round(1e3*(profil?.abmessungen?.breite||0)),
            t=Math.round(1e3*(profil?.abmessungen?.tiefe||0));
            return b>0&&t>0?`${b}×${t}mm`:"–"
        };
        const laengsListe=this.laengstraegerInstanz?.gibAlleLaengstraeger?.()||[],
        innereLaengs=laengsListe.filter(l=>{
            const n=(l.name||"").toLowerCase();
            return!("links"===n||"rechts"===n)
        }),
        rahmenLaengProfil=this.laengstraegerInstanz?.profileKonfig?.gibAktuellesProfil?.(),
        innenLaengProfil=this.laengstraegerInstanz?.profileKonfig?.gibMitteltraegerProfil?.(e),
        rahmenQuerProfil=this.quertraegerInstanz?.profileKonfig?.gibAktuellesProfil?.(),
        innenQuerProfil=this.quertraegerInstanz?.profileKonfig?.gibMitteltraegerProfil?.(e),
        rahmenLaengLabel=formatProfilLabel(rahmenLaengProfil),
        innenLaengLabel=formatProfilLabel(innenLaengProfil),
        rahmenQuerLabel=formatProfilLabel(rahmenQuerProfil),
        innenQuerLabel=formatProfilLabel(innenQuerProfil),
        querProfilAktuell=this.quertraegerInstanz?.profileKonfig?.gibAktuellesProfil?.(),
        querProfilHoeheMm=Math.round(1e3*(querProfilAktuell?.abmessungen?.tiefe||.08)),
        effektiveInnereLaengeMm=Math.round(Math.max(0, Math.sqrt(Math.pow(1e3*e.tiefe,2)+Math.pow(1e3*t.hoehenDifferenz,2))-2*querProfilHoeheMm)),
        carportHinweis=e.carportModus&&Array.isArray(e.carportSegmente)&&e.carportSegmente.length>0?`
            <div style="padding: 0.75rem 1rem; margin-bottom: 0.75rem; border-left: 4px solid #2e7d32; background: #e8f5e9; color: #1b5e20;">
                🚗 Carport-Modus aktiv: Angaben beziehen sich auf die aktuell ausgewählte Basis-Pergola.
                Bitte prüfen Sie jedes Segment separat, falls Maße variieren.
            </div>
        `:"";
        let innereLaengsAnzahl=innereLaengs.length;
        const s=e.neigung,
        hatNeigung=Math.abs(s)>1e-6,
        o=Math.round(1e3*t.hoehenDifferenz),
        m=Number(e.pfostenKuerzung?.vorne||0),
        g=Number(e.pfostenKuerzung?.hinten||0),
        h="einbetonieren"===e.befestigung?.toLowerCase?.()?0.07:0,
        u=Math.max(0, Math.round(1e3*(t.vordereHoehe+h-m))),
        d=Math.max(0, Math.round(1e3*(t.hintereHoehe+h-g))),
        f=Math.round(1e3*t.durchgangsHoehe),
        c=this.koordinatenSystem||this.konfiguration.koordinatenSystem,
        p=c?.glasBerechnung||null,
        b=p?.glasBreiten?.length||0,
        k=p?.traegerPositionen?.length||0;
        if(innereLaengsAnzahl===0 && p?.anzahlMitteltraeger){
            innereLaengsAnzahl=p.anzahlMitteltraeger;
        }
        let $="";
        if(p){
            const istSchmalePergola=(e.breite||0)<=2.05,
            t=istSchmalePergola?650:700,
            n=istSchmalePergola?900:850,
            i=istSchmalePergola?600:640,
            r=istSchmalePergola?950:910,
            l=p.glasBreiten.map((e, l)=>{
                const a=Math.round(1e3*e), s=0===l||l===p.glasBreiten.length-1;
                let o="standard", m="";
                return a<t?a>=i?(o="toleranz", m=` ⚠️ <span style="color: #ff9800;">(${a-t}mm unter Standard)</span>`):(o="außerhalb", m=` ❌ <span style="color: #f44336;">(${i-a}mm unter Toleranz!)</span>`):a>n&&(a<=r?(o="toleranz", m=` ⚠️ <span style="color: #ff9800;">(${a-n}mm über Standard)</span>`):(o="außerhalb", m=` ❌ <span style="color: #f44336;">(${a-r}mm über Toleranz!)</span>`)), {
                    breitemm:a, typ:s?"Randglas":"Innenglas", status:o, warnung:m, index:l+1
                }
            });
            $=`\n                <div class="konstruktion-section">\n                    <h5>🔷 GLASVERTEILUNG</h5>\n                    <ul>\n                        <li>Glasfelder: ${b} Gläser - 8mm VSG</li>\n                        <li>Glasbreiten-Spezifikation:\n                            <ul style="margin-left: 1.5rem; margin-top: 0.3rem; font-size: 0.9em;">\n                                <li><strong>Standard-Bereich:</strong> ${t}-${n}mm</li>\n                                <li><strong>Toleranz-Bereich:</strong> ${i}-${r}mm${istSchmalePergola?" (erweitert für 2,0m-Breite)":""}</li>\n                                ${l.some(e=>"toleranz"===e.status)?'<li style="color: #ff9800;">⚠️ <strong>Hinweis:</strong> Einige Gläser liegen im erweiterten Toleranzbereich</li>':""}\n                                ${l.some(e=>"außerhalb"===e.status)?'<li style="color: #f44336;">❌ <strong>Warnung:</strong> Einige Gläser außerhalb Toleranzbereich!</li>':""}\n                            </ul>\n                        </li>\n                        <li>Glasbreiten (tatsächlich):\n                            <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                                ${l.map(e=>`<li>${
                "standard"===e.status?"✅":"toleranz"===e.status?"⚠️":"❌"
            }
             Glas ${
                e.index
            }
            : ${
                e.breitemm
            }
            mm (${
                e.typ
            })${
                e.warnung
            }
            </li>`).join("")}\n                            </ul>\n                        </li>\n                        <li>Glastiefe (schräg): ${Math.round(Math.sqrt(Math.pow(1e3*e.tiefe,2)+Math.pow(o,2)))}mm\n                            <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                                <li>Horizontale Projektion: ${Math.round(1e3*e.tiefe)}mm</li>\n                                <li>Höhendifferenz: ${o}mm</li>\n                                <li>Effektive Länge (Hypotenuse): ${Math.round(Math.sqrt(Math.pow(1e3*e.tiefe,2)+Math.pow(o,2)))}mm</li>\n                            </ul>\n                        </li>\n                    </ul>\n                </div>\n\n                <div class="konstruktion-section">\n                    <h5>📐 TRÄGER-KONFIGURATION</h5>\n                    <ul>\n                        <li>Querträger (Breite): ${this.quertraegerInstanz?.gibAlleQuertraeger?.()?.length||2} gesamt</li>\n                        <li>• Äußere Rahmen: 2× ${a}</li>\n                        <li>• Innere Träger: ${k}× 100×80mm</li>\n                        <li>Längsträger (Tiefe): ${this.laengstraegerInstanz?.gibAlleLaengstraeger?.()?.length||2} gesamt</li>\n                        <li>• Äußere Rahmen: 2× ${a}</li>\n                        <li>• Innere Träger: ${k>0?k:0}× 100×80mm</li>\n                    </ul>\n                </div>\n\n                <div class="konstruktion-section">\n                    <h5>📏 TRÄGER-ABSTÄNDE (${Math.round(1e3*e.breite)}mm Pergola-Breite)</h5>\n                    <ul>\n                        <li><strong>Berechnungsmethode:</strong> Gleichmäßige Lichtabstände</li>\n                        <li>Träger-Positionen (von linker Rahmen-Innenkante):\n                            <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                                ${p.traegerPositionen.map((e,t)=>`<li>Träger ${
                t+1
            }
            : ${
                Math.round(1e3*e)
            }
            mm</li>`).join("")}\n                            </ul>\n                        </li>\n                        <li>Lichte Abstände (Innenseite zu Innenseite):\n                            <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                                ${p.lichtabstaende.map((e,t)=>{const n=Math.round(1e3*e),i=p.lichtabstaende.every((e,t)=>Math.abs(e-p.lichtabstaende[0])<.001)?"✅":"";return 0===t?`<li>${
                i
            }
             Linker Rahmen → Träger 1: ${
                n
            }
            mm</li>`:t===p.lichtabstaende.length-1?`<li>${
                i
            }
             Träger ${
                t
            }
             → Rechter Rahmen: ${
                n
            }
            mm</li>`:`<li>${
                i
            }
             Träger ${
                t
            }
             → Träger ${
                t+1
            }
            : ${
                n
            }
            mm</li>`}).join("")}\n                                ${p.lichtabstaende.every((e,t)=>Math.abs(e-p.lichtabstaende[0])<.001)?'<li style="color: #4caf50; margin-top: 0.5rem;"><strong>✅ Alle Lichtabstände sind gleichmäßig!</strong></li>':""}\n                            </ul>\n                        </li>\n                        <li><strong>Auflagen:</strong>\n                            <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                                <li>Äußere Längsträger: 40mm Auflage</li>\n                                <li>Innere Längsträger: 30mm Auflage (fest)</li>\n                                <li>Luft zwischen Gläsern: 20mm (2cm Gap)</li>\n                            </ul>\n                        </li>\n                    </ul>\n                </div>\n            `
        }
        const z=this.erstelleVersatzSektion(e);

        // Berechne Mittelträger-Neigung bei Flachdach
        let mitteltraegerNeigungHinweis = "";
        const istFlachdach = s === 0;
        const istGlasOderEPDM = e.dachTyp === "glas" || e.dachTyp === "epdm";

        if(istFlachdach && istGlasOderEPDM) {
            const querProfilAktuell = this.quertraegerInstanz?.profileKonfig?.gibAktuellesProfil?.();
            const mittelProfilAktuell = this.laengstraegerInstanz?.profileKonfig?.gibMitteltraegerProfil?.(e);
            const quertraegerHoehe = querProfilAktuell?.abmessungen?.breite || 0;
            const mitteltraegerHoehe = mittelProfilAktuell?.abmessungen?.breite || 0;
            const hoehendifferenz = Math.abs(quertraegerHoehe - mitteltraegerHoehe);
            const pergolaLaenge = e.tiefe || 1;
            const neigungRad = Math.atan(hoehendifferenz / pergolaLaenge);
            const neigungGrad = (neigungRad * 180 / Math.PI).toFixed(1);

            if(hoehendifferenz > 0.001) {
                const istEPDM200x100 = e.dachTyp === "epdm" && (e?.pfostenProfil === "200x100x4" || querProfilAktuell?.id === "200x100x4");
                const richtung = (e.dachTyp === "epdm" && !istEPDM200x100) ? "von vorne nach hinten (ansteigend)" : "von hinten nach vorne (abfallend)";

                mitteltraegerNeigungHinweis = ` <span style="color: #2196F3;">(Mittelträger: ca. ${neigungGrad}° ${richtung})</span>`;
            }
        }

        // Kürzungen für hintere Glas-/Seitenprofile (Doku-Kontext)
        const isFlachdachGlas200x100_doc = Math.abs(e.neigung||0)<=1e-6 && e.dachTyp==="glas" && ((e.pfostenProfil||"").startsWith("200x100") || (rahmenLaengProfil?.id||"").startsWith("200x100"));
        const trimBackMaterial_doc = isFlachdachGlas200x100_doc ? 0.035 : 0;
        const trimBackMaterialMm = Math.round(trimBackMaterial_doc*1000);
        const extraBackOffsetMm = 40;

        // Seitenprofil-Hinweis (Doku)
        const diagLenMm=Math.round(Math.sqrt(Math.pow(1e3*e.tiefe,2)+Math.pow(o,2)));
        const seitenprofilFrontMm=Math.max(0, Math.round(diagLenMm-querProfilHoeheMm)/2);
        const seitenprofilBackMm=Math.max(0, seitenprofilFrontMm - trimBackMaterialMm - extraBackOffsetMm);
        const seitenprofilHinweis=`
            <div class="konstruktion-section">
                <h5>🧩 SEITENPROFILE & HINTERER RAHMEN</h5>
                <ul>
                    <li>Profil: 40×40mm auf den Längsträger-Rahmen.</li>
                    <li>Vorne: ca. ${seitenprofilFrontMm}mm je Seite (2×), bündig zu den mittleren Längsträgern.</li>
                    <li>Hinten: ca. ${seitenprofilBackMm}mm je Seite (2×)${trimBackMaterialMm>0||extraBackOffsetMm>0?` – gekürzt um ${trimBackMaterialMm+extraBackOffsetMm}mm (inkl. 40mm Querträger-Auflage${trimBackMaterialMm>0?", + Rücksprung für letzte Glasreihe":""}).`:"."}</li>
                    <li>Montage hinten: Enden auf Höhe des letzten Lichtabstands; an Mittelträger anschrauben, Auflagefläche für die gekürzte Glasreihe freihalten.</li>
                    <li>Seitliche Auflager am hinteren Querträger: nach Lichtabständen positionieren, bündig zur Glasauflage.</li>
                </ul>
            </div>
        `;

        n.innerHTML=`${carportHinweis}\n            <div class="konstruktion-section">\n                <h5>⭐ BASISKONFIGURATION</h5>\n                <ul>\n                    <li><strong>Abmessungen:</strong> ${Math.round(1e3*e.breite)}mm × ${Math.round(1e3*e.tiefe)}mm × ${Math.round(1e3*e.gesamthoehe)}mm</li>\n                    <li><strong>Neigung:</strong> ${s}° Gefälle${istFlachdach ? " (Flachdach)" : " (geneigt)"}${mitteltraegerNeigungHinweis}</li>\n                    <li><strong>Typ:</strong> ${"freistehend"===e.typ?"Freistehende Pergola":"Wandanschluss"}</li>\n                    <li><strong>Erstellt:</strong> ${(new Date).toLocaleDateString("de-DE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}</li>\n                </ul>\n            </div>\n\n            ${z}\n\n            <div class="konstruktion-section">\n                <h5>📏 NEIGUNG UND GRUNDMASSE</h5>\n                <ul>\n                    <li><strong>Neigung:</strong> ${s}° Gefälle</li>\n                    <li><strong>Höhendifferenz:</strong> ${o}mm über ${Math.round(1e3*e.tiefe)}mm horizontale Tiefe</li>\n                    <li><strong>Pfostenhöhen:</strong>\n                        <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                            <li>Vordere Pfosten: ${u}mm (Unterkante bis Oberkante Querträger)</li>\n                            <li>Hintere Pfosten: ${d}mm (Unterkante bis Oberkante Querträger)</li>\n                            <li>Differenz: ${Math.round(d-u)}mm</li>\n                        </ul>\n                    </li>\n                    <li><strong>Durchgangshöhe:</strong> ${f}mm (vorne, bei Standardkonfiguration)</li>\n                    <li><strong>Neigungsrichtung:</strong> Von Hinten (hoch) nach Vorne (tief) für Wasserabfluss</li>\n                    ${innereLaengsAnzahl>0?`<li><strong>Innere Längsträger:</strong> ${innereLaengsAnzahl} Stk, effektive Länge ${effektiveInnereLaengeMm}mm (${s}° Geneigung)</li>`:""}\n                </ul>\n            </div>\n\n            ${$}

            ${seitenprofilHinweis}

            ${hatNeigung?`<div class="konstruktion-highlight">
                <strong>⚠️ WICHTIG: Keilförmige Ausgleichselemente erforderlich!</strong><br>
                Zur Berücksichtigung der ${s}° Neigung müssen keilförmige Elemente
                auf den Längsträgern angebracht werden:<br><br>
                • <strong>Keilhöhe hinten:</strong> ${o}mm<br>
                • <strong>Keilhöhe vorne:</strong> 0mm (Nulllinie)<br>
                • <strong>Keilbreite:</strong> entsprechend Pergola-Breite (${Math.round(1e3*e.breite)}mm)<br>
                • <strong>Material:</strong> Druckfester Schaumstoff oder Aluminium-Keile<br><br>
                Diese Keile gewährleisten eine gleichmäßige Auflage der Glaselemente
                und kompensieren die Dachneigung für optimalen Wasserabflauf.
            </div>`:""}

            <div class="konstruktion-section">\n                <h5>🔧 MONTAGE-HINWEISE</h5>\n                <ul>\n                    <li><strong>Querträger:</strong>\n                        <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                            <li>Äußere Rahmen-Querträger: ${Math.round(1e3*e.breite)}mm (${rahmenQuerLabel} Profile)</li>\n                            <li>Innere Querträger: ${Math.round(1e3*e.breite)}mm (${innenQuerLabel} Profile)</li>\n                            <li>Montage: Stirnseitig an Pfosten geschweißt</li>\n                        </ul>\n                    </li>\n                    <li><strong>Längsträger:</strong>\n                        <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                            <li>Effektive Länge: ${Math.round(Math.sqrt(Math.pow(1e3*e.tiefe,2)+Math.pow(o,2)))}mm (schräg)</li>\n                            <li>Äußere Rahmen: ${rahmenLaengLabel} Profile</li>\n                            <li>Innere Träger: ${innenLaengLabel} Profile (falls vorhanden)</li>\n                            <li>Neigungswinkel: ${s}° zur Horizontalen</li>\n                        </ul>\n                    </li>\n                    <li><strong>Gehrungsschnitte:</strong> Trägerenden um ${s}° angeschrägt für saubere Anschlüsse</li>\n                    <li><strong>Mittelpfosten:</strong> Mittlere Pfosten – inklusive optionalem Zentralpfosten – oben entsprechend der Dachneigung angeschrägt für bündige Auflager.</li>\n                    <li><strong>Oberflächenschutz:</strong> Eloxierte oder pulverbeschichtete Alu-Profile (${e.farbe.toUpperCase()})</li>\n                    <li><strong>Entwässerung:</strong> ${"rinne"===e.regenwasserAbfluss?`${
            s
        }
        ° Gefälle, Regenrinne am vorderen Querträger (U-förmig)`:"Glasüberstand vorne für Tropfkante"}</li>\n                    <li><strong>Glasmontage mit Aluprofilen:</strong>\n                        <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                            <li><strong>Was sind Aluprofile?</strong> Aluminium-Halteprofile zwischen Glas und Träger</li>\n                            <li><strong>Funktion:</strong> Verhindern Metall-Glas-Kontakt, ermöglichen Abdichtung mit EPDM-Gummi</li>\n                            <li><strong>L-Profile (60×20mm):</strong> An äußeren Trägern (Rahmen), halten Glas seitlich</li>\n                            <li><strong>T-Profile (60×20mm):</strong> An inneren Längsträgern, für beidseitige Glasauflage</li>\n                            <li><strong>Bei Rinne:</strong> Vorderer Querträger ist U-förmig (kein separates Aluprofil)</li>\n                            <li><strong>Montage:</strong> Aluprofile mit Edelstahlschrauben auf Träger-Oberkante befestigt</li>\n                            <li><strong>Abdichtung:</strong> EPDM-Gummidichtungen zwischen Glas und Aluprofil</li>\n                        </ul>\n                    </li>\n                    <li><strong>Fundamentierung:</strong> ${"ankerplatte"===e.befestigung?"Ankerplatten auf Terrassenplatten":"Pfosten in Beton-Punktfundamente einbetoniert"}</li>\n                    <li><strong>Statik:</strong> Windlast-Nachweis durch Fachplaner erforderlich (örtliche Schneelastzone beachten)</li>\n                    <li><strong>Schweißarbeiten:</strong> Alle Verbindungen nach DIN EN 1090 ausführen</li>\n                </ul>\n            </div>\n\n            <div class="konstruktion-section">\n                <h5>🔧 GLASMONTAGE-SYSTEM (Aluprofile)</h5>\n                <ul>\n                    <li><strong>Aufbau von unten nach oben:</strong>\n                        <ol style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                            <li>Aluminium-Träger (${a} oder 100×80mm)</li>\n                            <li>Aluprofil (60×20mm L-förmig oder T-förmig)</li>\n                            <li>EPDM-Gummidichtung (5-6mm dick)</li>\n                            <li>VSG-Glas (8mm stark)</li>\n                            <li>EPDM-Gummidichtung (5-6mm dick)</li>\n                            <li>Edelstahl-Klemmschienen (optional, für zusätzliche Sicherheit)</li>\n                        </ol>\n                    </li>\n                    <li><strong>Montageschritte:</strong>\n                        <ul style="margin-left: 1.5rem; margin-top: 0.3rem;">\n                            <li>1. Aluprofile auf Träger-Oberkante befestigen (Edelstahlschrauben A4)</li>\n                            <li>2. EPDM-Gummidichtungen in Profile einlegen</li>\n                            <li>3. Gläser nacheinander einsetzen (von hinten nach vorne)</li>\n                            <li>4. Zweite EPDM-Dichtung auflegen</li>\n                            <li>5. Optional: Klemmschienen aufschrauben</li>\n                        </ul>\n                    </li>\n                    <li><strong>Glasabstände:</strong> 4mm Mindestspalt zwischen Gläsern (Wärmeausdehnung)</li>\n                    <li><strong>Toleranzen:</strong> Glas ±2mm, Träger ±1mm, Aluprofile ±0.5mm</li>\n                </ul>\n            </div>\n\n            <div class="konstruktion-section">\n                <h5>📋 NEIGUNGSAUSGLEICH</h5>\n                <ul>\n                    <li>• Glasverteilung: Optimiert für 750-850mm Glasbreite</li>\n                    <li>• Trägerabstände: Nach Glasraster berechnet (4mm Mindestspalt)</li>\n                    <li>• Neigungsberechnung: Höhenunterschied über Pergola-Tiefe</li>\n                    <li>• Profilauswahl: Standardprofile nach Belastung dimensioniert</li>\n                    <li>• Maßtoleranzen: ±2mm für Glas, ±1mm für Träger</li>\n                </ul>\n            </div>\n\n            <div class="konstruktion-section">\n                <h5>📐 STRUKTURNACHWEIS</h5>\n                <ul>\n                    <li>• Schneelast: Nach örtlicher Schneelastzone zu prüfen</li>\n                    <li>• Windlast: Statischer Nachweis durch Fachplaner erforderlich</li>\n                    <li>• Fundamentierung: Punktfundamente nach Bodengutachten</li>\n                    <li>• Verbindungen: Alle Schweißnähte nach DIN EN 1090</li>\n                    <li>• Glashalterung: VSG-Glas in Gummiprofilen gelagert</li>\n                </ul>\n            </div>\n        `
    }
    aktualisierePreisliste(){
        const container=document.getElementById("preisliste-content");
        if(!container||!this.konfiguration)return;
        const config=this.konfiguration.gibAktuelleKonfiguration();
        const materialien=this.letzteMaterialien||this.gibLetzteMaterialien();
        if(!materialien){
            container.innerHTML='<p style="text-align:center;color:#999;padding:2rem;">Bitte zuerst Materialliste generieren</p>';
            return;
        }
        const preisDetails=this.berechnePreise(materialien,config);
        container.innerHTML=this.renderPreisliste(preisDetails,config);
    }
    berechnePreise(materialien,config){
        return berechnePreiseUtil(materialien, config, this.letzteAlumeterSumme, (m) => this.berechneAlumeterAusSammlung(m));
    }
    renderPreisliste(preisDetails,config){
        return renderPreislisteUtil(preisDetails, config);
    }
}
