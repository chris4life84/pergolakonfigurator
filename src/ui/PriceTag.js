import{
    PRICE_TABLE,
    EXTRA_POSITIONS,
    VAT_RATE
}
from"../data/pricing.js";
const currencyFormatter=new Intl.NumberFormat("de-DE", {
    style:"currency", currency:"EUR", minimumFractionDigits:2
}),
numberFormatter=new Intl.NumberFormat("de-DE", {
    minimumFractionDigits:2, maximumFractionDigits:2
});
export class PriceTag{
    constructor(e={}){
        this.uiController=e.uiController,
        this.container=document.getElementById("price-tag"),
        this.container||(this.container=this.erzeugeContainer()),
        this.container.querySelector(".price-tag__title")||(this.container.innerHTML=this.erzeugeMarkup()),
        this.titleElement=this.container.querySelector(".price-tag__title"),
        this.totalElement=this.container.querySelector(".price-tag__total-amount"),
        this.netElement=this.container.querySelector(".price-tag__net-amount"),
        this.listElement=this.container.querySelector(".price-tag__list"),
        this.stateElement=this.container.querySelector(".price-tag__timestamp"),
        this.footerNote=this.container.querySelector(".price-tag__footer"),
        this.unmatched=[],
        this.letztePreisdaten=null,
        this.letzteKonfiguration=null,
        this.setupAnfrageButton()
    }
    
    setupAnfrageButton(){
        // Event-Delegation: Klick auf Container abfangen
        this.container.addEventListener("click", (e) => {
            if(e.target){
                if(e.target.id === "anfrageWeiterButton"){
                    e.preventDefault();
                    e.stopPropagation();
                    const isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
                    if(isMobile){
                        // Mobile: direkt Anfrage absenden (ohne Pop-up)
                        this.exportiereAnfrage();
                    }else{
                        this.showAnfrageModal();
                    }
                }else if(e.target.id === "anfrageButton"){
                    e.preventDefault();
                    e.stopPropagation();
                    this.exportiereAnfrage();
                }
            }
        });
    }

    showAnfrageModal(){
        let overlay=document.getElementById("anfrage-modal-overlay");
        if(!overlay){
            overlay=document.createElement("div");
            overlay.id="anfrage-modal-overlay";
            overlay.style.cssText="position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:9999;";
            const box=document.createElement("div");
            box.style.cssText="background:#fff; padding:1.8rem; border-radius:12px; max-width:620px; width:92%; box-shadow:0 16px 40px rgba(0,0,0,0.25); border:1px solid rgba(0,0,0,0.05);";
            box.innerHTML=`
                <h3 style="margin-top:0; margin-bottom:1rem; font-size:1.25rem; color:#1a1a1a;">Ihre Konfiguration ist fertig!</h3>
                <p style="margin:0 0 0.85rem 0; line-height:1.6; font-size:1rem; color:#374151;">
                    Im nächsten Schritt können Sie eine unverbindliche Anfrage senden.
                </p>
                <p style="margin:0 0 0.95rem 0; line-height:1.6; font-size:1rem; color:#374151;">
                    Wir führen derzeit eine Vorort-Prüfung in Berlin/Brandenburg durch, um die optimale Umsetzung Ihrer Pergola zu gewährleisten.
                    Nach Prüfung Ihrer Konfiguration melden wir uns zeitnah bei Ihnen zurück.
                </p>
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.4rem;">
                    <button id="anfrage-modal-cancel" style="padding:0.55rem 1rem; border:none; background:#e5e7eb; border-radius:6px; cursor:pointer; font-weight:600; color:#374151;">Abbrechen</button>
                    <button id="anfrage-modal-confirm" style="padding:0.55rem 1rem; border:none; background:#2563eb; color:#fff; border-radius:6px; cursor:pointer; font-weight:700; box-shadow:0 8px 18px rgba(37,99,235,0.25); position:relative; overflow:hidden;">Anfrage zu dieser Konfiguration</button>
                </div>
            `;
            overlay.appendChild(box);
            document.body.appendChild(overlay);

            box.querySelector("#anfrage-modal-cancel").addEventListener("click", ()=>overlay.remove());
            box.querySelector("#anfrage-modal-confirm").addEventListener("click", ()=>{
                const btn=box.querySelector("#anfrage-modal-confirm");
                if(btn){
                    btn.disabled=true;
                    this.zeigeMiniLoader(btn);
                }
                // Kleiner Hinweis während Weiterleitung
                this.zeigeAnfrageHint();
                setTimeout(()=>{
                    overlay.remove();
                    this.exportiereAnfrage();
                }, 1680);
            });
        }else{
            document.body.appendChild(overlay);
        }
    }
    zeigeMiniLoader(button){
        if(!button)return;
        setTimeout(()=>{
            const loader=document.createElement("span");
            loader.style.cssText="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none;";
            loader.innerHTML=`<span style="width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.45);border-top-color:#fff;display:inline-block;animation:spin 0.9s linear infinite;"></span>`;
            if(!document.getElementById("mini-loader-spin-style")){
                const style=document.createElement("style");
                style.id="mini-loader-spin-style";
                style.innerHTML="@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}";
                document.head.appendChild(style);
            }
            button.appendChild(loader);
        },130);
    }
    zeigeAnfrageHint(){
        const hint=document.createElement("div");
        hint.style.cssText=`
            position:fixed; 
            bottom:50%; 
            left:50%; 
            transform:translate(-50%, 50%);
            background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
            color:#fff; 
            padding:18px 36px; 
            border-radius:12px; 
            font-size:1.15rem; 
            font-weight:600;
            z-index:10000; 
            box-shadow:0 12px 32px rgba(37,99,235,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset;
            animation:pulseScale 1.5s ease-in-out infinite;
        `;
        hint.textContent="Wird bearbeitet...";
        
        // Animation hinzufügen
        if(!document.getElementById("pulse-scale-animation")){
            const style=document.createElement("style");
            style.id="pulse-scale-animation";
            style.innerHTML=`
                @keyframes pulseScale{
                    0%, 100%{transform:translate(-50%, 50%) scale(1);}
                    50%{transform:translate(-50%, 50%) scale(1.05);}
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(hint);
        setTimeout(()=>hint.remove(), 1800);
    }
    
    async exportiereAnfrage(){
        if(!this.letzteKonfiguration || !this.letztePreisdaten){
            alert("Keine Konfiguration verfügbar. Bitte zuerst Pergola konfigurieren.");
            return;
        }
        
        // Hole canvas-compact-info
        const compactInfo = document.getElementById("canvas-compact-info")?.innerText || "";
        
        // Screenshot erstellen (optimiert: 800x600 JPEG mit 70% Qualität)
        console.log("🔍 Versuche Screenshot zu erstellen...");
        const screenshot = await this.captureScreenshot();
        console.log("📸 Screenshot erstellt:", screenshot ? `${screenshot.substring(0, 50)}... (${screenshot.length} Zeichen)` : "FEHLER: Kein Screenshot");
        
        const config = this.letzteKonfiguration;
        // Tiefenkopie, damit spätere Mutationen (Share-Metadaten) den Live-State nicht beeinflussen
        const rawConfig = JSON.parse(JSON.stringify(config));
        let anfrageData;
        
        // Unterschiedliche Struktur je nach Modus
        if(config.carportModus && Array.isArray(config.carportSegmente) && config.carportSegmente.length > 0){
            // CARPORT-MODUS: Jedes Segment einzeln auflisten
            const pergolas = config.carportSegmente.map((segment, index) => {
                // Berechne Durchgangshöhen für dieses Segment
                const segmentHoehe = segment.hoehe || config.hoehe || 0;
                const segmentNeigung = segment.neigung || config.neigung || 0;
                const segmentTiefe = segment.tiefe || 0;
                
                const kuerzungVorne = Math.max(
                    segment.pfostenKuerzung?.vorne_links || 0,
                    segment.pfostenKuerzung?.vorne_rechts || 0
                );
                const kuerzungHinten = Math.max(
                    segment.pfostenKuerzung?.hinten_links || 0,
                    segment.pfostenKuerzung?.hinten_rechts || 0
                );
                
                const durchgangshoeheVorne = segmentHoehe - 0.16 - kuerzungVorne;
                const durchgangshoeheMitte = segmentHoehe - 0.16 + (segmentTiefe / 2) * Math.tan(segmentNeigung * Math.PI / 180);
                const durchgangshoeheHinten = segmentHoehe - 0.16 - kuerzungHinten + segmentTiefe * Math.tan(segmentNeigung * Math.PI / 180);
                
                return {
                    pergola: index + 1,
                    positionX: segment.x || 0,
                    positionZ: segment.z || 0,
                    rotation: segment.rotation || 0,
                    breite: segment.breite || 0,
                    tiefe: segmentTiefe,
                    hoehe: segmentHoehe,
                    typ: segment.typ || config.typ || "freistehend",
                    neigung: segmentNeigung,
                    regenwasserAbfluss: segment.regenwasserAbfluss || config.regenwasserAbfluss || "rinne",
                    pfostenVersaetze: {
                        vorne_links: segment.pfostenVersaetze?.vorne_links || 0,
                        vorne_rechts: segment.pfostenVersaetze?.vorne_rechts || 0,
                        hinten_links: segment.pfostenVersaetze?.hinten_links || 0,
                        hinten_rechts: segment.pfostenVersaetze?.hinten_rechts || 0
                    },
                    pfostenKuerzung: {
                        vorne_links: segment.pfostenKuerzung?.vorne_links || 0,
                        vorne_rechts: segment.pfostenKuerzung?.vorne_rechts || 0,
                        hinten_links: segment.pfostenKuerzung?.hinten_links || 0,
                        hinten_rechts: segment.pfostenKuerzung?.hinten_rechts || 0
                    },
                    pfostenAktiv: {
                        vorne_links: segment.pfostenAktiv?.vorne_links !== false,
                        vorne_rechts: segment.pfostenAktiv?.vorne_rechts !== false,
                        hinten_links: segment.pfostenAktiv?.hinten_links !== false,
                        hinten_rechts: segment.pfostenAktiv?.hinten_rechts !== false
                    },
                    durchgangshoeheVorne: Math.round(durchgangshoeheVorne * 100) / 100,
                    durchgangshoeheMitte: Math.round(durchgangshoeheMitte * 100) / 100,
                    durchgangshoeheHinten: Math.round(durchgangshoeheHinten * 100) / 100,
                    statikStatus: segment.statikStatus || "green",
                    statikHinweis: segment.statikHinweis || null
                };
            });
            
            // Berechne Gesamtboundingbox
            let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxH = -Infinity;
            config.carportSegmente.forEach(seg => {
                const x = seg.x || 0;
                const z = seg.z || 0;
                const breite = seg.breite || 0;
                const tiefe = seg.tiefe || 0;
                const hoehe = seg.hoehe || config.hoehe || 0;
                const rotation = seg.rotation || 0;
                
                const swapAxes = rotation === 90 || rotation === 270;
                const extentX = swapAxes ? tiefe : breite;
                const extentZ = swapAxes ? breite : tiefe;
                
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x + extentX);
                minZ = Math.min(minZ, z);
                maxZ = Math.max(maxZ, z + extentZ);
                maxH = Math.max(maxH, hoehe);
            });
            
            anfrageData = {
                type: "carport",
                timestamp: new Date().toISOString(),
                config: compactInfo,
                screenshot: screenshot,
                screenshotNote: screenshot ? 'PNG Base64 Data URL' : 'Screenshot nicht verfügbar',
                price: {
                    gross: this.letztePreisdaten.brutto,
                    net: this.letztePreisdaten.netto,
                    vatRate: VAT_RATE
                },
                material: config.material || "aluminium",
                farbe: config.farbe || "ral7016",
                ncsFarbe: config.ncsFarbe || null,
                pfostenProfil: config.pfostenProfil || "160x80x4",
                laengstraegerProfil: config.laengstraegerProfil || "80x40x3",
                quertraegerProfil: config.quertraegerProfil || "80x40x3",
                befestigung: config.befestigung || "ankerplatte",
                dachTyp: config.dachTyp || "glas",
                epdmFarbe: config.epdmFarbe || null,
                glasTyp: config.dachTyp==="epdm"?null:(config.glasTyp || null),
                glasFarbe: config.dachTyp==="epdm"?null:(config.glasFarbe || null),
                gesamtBoundingBox: {
                    minX: Math.round(minX * 100) / 100,
                    maxX: Math.round(maxX * 100) / 100,
                    minZ: Math.round(minZ * 100) / 100,
                    maxZ: Math.round(maxZ * 100) / 100,
                    breiteGesamt: Math.round((maxX - minX) * 100) / 100,
                    tiefeGesamt: Math.round((maxZ - minZ) * 100) / 100,
                    hoeheMax: Math.round(maxH * 100) / 100
                },
                segmentAnzahl: config.carportSegmente.length,
                pergolas: pergolas
            };
        } else {
            // NORMALER PERGOLA-MODUS
            // Berechne Durchgangshöhen
            const hoehe = config.hoehe || 0;
            const neigung = config.neigung || 0;
            const tiefe = config.tiefe || 0;
            
            const kuerzungVorne = config.pfostenKuerzung?.vorne || 0;
            const kuerzungHinten = config.pfostenKuerzung?.hinten || 0;
            const kuerzungMitte = config.pfostenKuerzung?.mitte || 0;
            
            const durchgangshoeheVorne = hoehe - 0.16 - kuerzungVorne;
            const durchgangshoeheMitte = hoehe - 0.16 - kuerzungMitte + (tiefe / 2) * Math.tan(neigung * Math.PI / 180);
            const durchgangshoeheHinten = hoehe - 0.16 - kuerzungHinten + tiefe * Math.tan(neigung * Math.PI / 180);
            
            // Sammle Eckpfosten-Daten (falls individuelle Steuerung aktiv)
            const eckpfosten = config.individuellePfostenSteuerung ? {
                vorne_links: {
                    versatz: config.eckpfosten?.vorne_links?.versatz || config.pfostenVersaetze?.vorne || 0,
                    kuerzung: config.eckpfosten?.vorne_links?.kuerzung || config.pfostenKuerzung?.vorne || 0,
                    aktiv: config.eckpfosten?.vorne_links?.aktiv !== false
                },
                vorne_rechts: {
                    versatz: config.eckpfosten?.vorne_rechts?.versatz || config.pfostenVersaetze?.vorne || 0,
                    kuerzung: config.eckpfosten?.vorne_rechts?.kuerzung || config.pfostenKuerzung?.vorne || 0,
                    aktiv: config.eckpfosten?.vorne_rechts?.aktiv !== false
                },
                hinten_links: {
                    versatz: config.eckpfosten?.hinten_links?.versatz || config.pfostenVersaetze?.hinten || 0,
                    kuerzung: config.eckpfosten?.hinten_links?.kuerzung || config.pfostenKuerzung?.hinten || 0,
                    aktiv: config.eckpfosten?.hinten_links?.aktiv !== false
                },
                hinten_rechts: {
                    versatz: config.eckpfosten?.hinten_rechts?.versatz || config.pfostenVersaetze?.hinten || 0,
                    kuerzung: config.eckpfosten?.hinten_rechts?.kuerzung || config.pfostenKuerzung?.hinten || 0,
                    aktiv: config.eckpfosten?.hinten_rechts?.aktiv !== false
                }
            } : null;
            
            // Ermittle verwendete Profile aus der aktuellen Pergola-Instanz (falls verfügbar)
            const pergolaInst=this.uiController?.renderEngine?.gibPergola?.();
            const resolveProfileId = prof => prof?.id || null;
            const getProfileIds=inst=>{
                if(!inst?.profileKonfig)return {frame:null, mid:null};
                const pk=inst.profileKonfig;
                const frameId = pk.aktuellesProfil || resolveProfileId(pk.gibAktuellesProfil?.());
                const midOverride = pk.mitteltraegerOverride || null;
                const midProf = midOverride ? pk.gibProfil?.(midOverride) : pk.gibMitteltraegerProfil?.(config);
                const midId = midOverride || resolveProfileId(midProf) || frameId;
                return {frame: frameId, mid: midId};
            };
            const laengIds=getProfileIds(pergolaInst?.laengstraeger);
            const querIds=getProfileIds(pergolaInst?.quertraeger);

            anfrageData = {
                type: "pergola",
                timestamp: new Date().toISOString(),
                config: compactInfo,
                screenshot: screenshot,
                screenshotNote: screenshot ? 'PNG Base64 Data URL' : 'Screenshot nicht verfügbar',
                price: {
                    gross: this.letztePreisdaten.brutto,
                    net: this.letztePreisdaten.netto,
                    vatRate: VAT_RATE
                },
                details: {
                    breite: config.breite || 0,
                    tiefe: tiefe,
                    hoehe: hoehe,
                    neigung: neigung,
                    typ: config.typ || "freistehend",
                    material: config.material || "aluminium",
                    farbe: config.farbe || "ral7016",
                    ncsFarbe: config.ncsFarbe || null,
                    pfostenProfil: config.pfostenProfil || "160x80x4",
                    rahmenprofil: config.pfostenProfil || "160x80x4", // Äußere Rahmenträger (Längs + Quer) = Pfostenprofil
                    laengstraegerProfil: laengIds.frame || config.laengstraegerProfil || "80x40x3",
                    quertraegerProfil: querIds.frame || config.quertraegerProfil || "80x40x3",
                    laengstraegerMittelProfil: laengIds.mid || laengIds.frame || null,
                    quertraegerMittelProfil: querIds.mid || querIds.frame || null,
                    zwischenpfostenBreite: config.zwischenpfostenBreite || false,
                    zwischenpfostenTiefe: config.zwischenpfostenTiefe || false,
                    pfostenVersaetze: {
                        vorne: config.pfostenVersaetze?.vorne || 0,
                        hinten: config.pfostenVersaetze?.hinten || 0
                    },
                    pfostenKuerzung: {
                        vorne: kuerzungVorne,
                        hinten: kuerzungHinten,
                        mitte: kuerzungMitte
                    },
                    pfostenAktiv: {
                        vorne: config.pfostenAktiv?.vorne !== false,
                        hinten: config.pfostenAktiv?.hinten !== false
                    },
                    zentralerMittelpfosten: config.zentralerMittelpfosten || false,
                    befestigung: config.befestigung || "ankerplatte",
                    regenwasserAbfluss: config.regenwasserAbfluss || "rinne",
                    dachTyp: config.dachTyp || "glas",
                    epdmFarbe: config.epdmFarbe || null,
                    glasTyp: (config.dachTyp||"").toLowerCase()==="epdm" ? null : (config.glasTyp || "klar"),
                    glasFarbe: (config.dachTyp||"").toLowerCase()==="epdm" ? null : (config.glasFarbe || "klar"),
                    individuellePfostenSteuerung: config.individuellePfostenSteuerung || false,
                    eckpfosten: eckpfosten,
                    durchgangshoeheVorne: Math.round(durchgangshoeheVorne * 100) / 100,
                    durchgangshoeheMitte: Math.round(durchgangshoeheMitte * 100) / 100,
                    durchgangshoeheHinten: Math.round(durchgangshoeheHinten * 100) / 100,
                    statikStatus: config.statikStatus || "green",
                    statikNachweise: config.statikNachweise || null
                }
            };
        }

        // Rohkonfiguration beilegen, damit Links den Zustand 1:1 rekonstruieren können
        anfrageData.originalConfig = rawConfig;
        
        // Debug-Ausgabe der Profilwahl
        try{
            console.log("📤 Anfrage-Export Profile:", {
                dachTyp: anfrageData?.details?.dachTyp || anfrageData?.dachTyp,
                laengstraegerProfil: anfrageData?.details?.laengstraegerProfil || anfrageData?.laengstraegerProfil,
                quertraegerProfil: anfrageData?.details?.quertraegerProfil || anfrageData?.quertraegerProfil,
                laengstraegerMittelProfil: anfrageData?.details?.laengstraegerMittelProfil,
                quertraegerMittelProfil: anfrageData?.details?.quertraegerMittelProfil,
                pfostenProfil: anfrageData?.details?.pfostenProfil || anfrageData?.pfostenProfil,
                glasTyp: anfrageData?.details?.glasTyp,
                glasFarbe: anfrageData?.details?.glasFarbe
            });
        }catch(err){
            console.warn("Profil-Debug konnte nicht geloggt werden:", err);
        }

        // Serverseitigen Snapshot ablegen und Share-Link erhalten
        const shareResult = await this.speichereSnapshotServerseitig(anfrageData);
        const shareInfo = shareResult?.primary || null;
        const shareIntern = shareResult?.intern || null;

        if(shareInfo?.viewUrl){
            anfrageData.share = {
                id: shareInfo.id,
                viewUrl: shareInfo.viewUrl,
                rawUrl: shareInfo.rawUrl,
                storedAt: shareInfo.storedAt || new Date().toISOString()
            };
            console.log("🔗 Share-Link erzeugt:", shareInfo.viewUrl);
        } else {
            // Client-seitiger Fallback (Base64 im Hash), falls Server-Snapshot fehlschlägt
            const fallbackShare = this.erzeugeClientShareLink(anfrageData);
            anfrageData.share = {
                id: fallbackShare.id,
                viewUrl: fallbackShare.viewUrl,
                rawUrl: fallbackShare.rawUrl,
                error: "snapshot_failed_or_disabled_client_fallback"
            };
            console.warn("⚠️ Snapshot/Share konnte nicht serverseitig gespeichert werden – nutze clientseitigen Fallback-Link.");
        }

        // Zweiter Link für /intern
        if(shareIntern?.viewUrl){
            anfrageData.share_intern = {
                id: shareIntern.id,
                viewUrl: shareIntern.viewUrl,
                rawUrl: shareIntern.rawUrl,
                storedAt: shareIntern.storedAt || new Date().toISOString()
            };
            console.log("🔗 Share-Intern-Link erzeugt:", shareIntern.viewUrl);
        }

        // Erstelle JSON-String
        const jsonString = JSON.stringify(anfrageData, null, 2);

        console.log("📊 JSON-Größe:", jsonString.length, "Zeichen");
        console.log("📊 Screenshot im JSON:", anfrageData.screenshot ? "JA" : "NEIN");
        if(anfrageData.screenshot) {
            console.log("📊 Screenshot-Länge:", anfrageData.screenshot.length, "Zeichen");
        }

        // JSON (inkl. Screenshot) in Formular schreiben
        const configInput = document.getElementById("config_json");
        const configForm = document.getElementById("configForm");

        if(configInput && configForm){
            configInput.value = jsonString;
            // Sicherheitsnetz: Ziel-URL fest auf produktive Anfrage-Seite setzen
            configForm.action = "https://modul-garten.de/anfrage/";

            console.log("📋 Anfrage wird gesendet (JSON mit Screenshot):", anfrageData);
            configForm.submit();
        } else {
            console.error("❌ Formular nicht gefunden!");
            alert("Fehler: Formular konnte nicht gefunden werden.");
        }
    }

    async speichereSnapshotServerseitig(payload){
        try{
            const endpoints=this.resolveSnapshotEndpoints();
            const qs=new URLSearchParams(window.location.search);
            const forceIntern=qs.get("target")==="intern";

            const primaryEndpoint=forceIntern?endpoints.intern:endpoints.s;
            const secondaryEndpoint=endpoints.intern; // für share_intern

            const primaryResult=await this.postSnapshot(primaryEndpoint, payload);
            let internResult=null;
            try{
                internResult=await this.postSnapshot(secondaryEndpoint, payload);
            }catch(e){
                console.warn("⚠️ Intern-Snapshot fehlgeschlagen:", e);
            }
            return {primary: primaryResult, intern: internResult};
        }catch(err){
            console.warn("⚠️ Snapshot konnte nicht serverseitig gespeichert werden:", err);
            return null;
        }
    }

    resolveSnapshotEndpoints(){
        const origin=window.location.origin;
        const path=window.location.pathname||"/";
        const baseDir=new URL(".", window.location.href).pathname; // aktuelles Verzeichnis mit /
        const isInIntern=/\/intern\/$/.test(baseDir);
        const isInS=/\/s\/$/.test(baseDir);

        const sBase=isInS?baseDir:baseDir+"s/";
        const internBase=isInIntern?baseDir:baseDir+"intern/";

        return {
            s:`${origin}${sBase}index.php`,
            intern:`${origin}${internBase}index.php`
        };
    }

    async postSnapshot(endpoint, payload){
        const response=await fetch(endpoint, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({payload})
        });
        if(!response.ok){
            throw new Error(`HTTP ${response.status} @ ${endpoint}`);
        }
        return response.json();
    }

    erzeugeClientShareLink(payload){
        try{
            const json=JSON.stringify(payload);
            const base64=btoa(unescape(encodeURIComponent(json)));
            const viewUrl=`${window.location.origin}${window.location.pathname}#config=${base64}`;
            const rawUrl=`data:application/json;base64,${base64}`;
            return {id:"client-fallback", viewUrl, rawUrl};
        }catch(err){
            console.warn("⚠️ Client-Fallback-Link konnte nicht erzeugt werden:", err);
            return {id:null, viewUrl:null, rawUrl:null};
        }
    }

    async captureScreenshot() {
        const canvas = document.getElementById('pergola-canvas');
        console.log("🔍 Canvas gefunden:", !!canvas);
        if (!canvas) {
            console.error("❌ Canvas 'pergola-canvas' nicht gefunden!");
            return null;
        }
        
        try {
            // Kurze Wartezeit damit sicher gerendert ist
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log("📸 Mache jetzt Screenshot vom Canvas...");
            
            // OPTIMIERUNG: Screenshot verkleinern und als JPEG komprimieren
            const maxWidth = 1200;  // Maximale Breite
            const maxHeight = 900; // Maximale Höhe
            const quality = 0.8;   // JPEG-Qualität
            
            // Erstelle temporären Canvas für Verkleinerung
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            
            // Berechne Zielgröße (behält Seitenverhältnis bei)
            let width = canvas.width;
            let height = canvas.height;
            console.log("📐 Original Canvas-Größe:", width, "x", height);
            
            const aspectRatio = width / height;
            
            if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
            }
            if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
            }
            
            tempCanvas.width = width;
            tempCanvas.height = height;
            
            // Zeichne verkleinertes Bild
            ctx.drawImage(canvas, 0, 0, width, height);
            
            // Konvertiere zu JPEG mit Kompression
            const dataURL = tempCanvas.toDataURL('image/jpeg', quality);
            
            console.log("✅ Screenshot erstellt:", dataURL.substring(0, 50) + "...");
            console.log("📊 Screenshot-Größe:", dataURL.length, "Zeichen");
            console.log("📐 Screenshot-Dimensionen:", Math.round(width) + "x" + Math.round(height));
            
            return dataURL;
        } catch (error) {
            console.error('❌ Screenshot konnte nicht erstellt werden:', error);
            return null;
        }
    }
    
    erzeugeContainer(){
        const e=document.createElement("div");
        return e.id="price-tag",
        e.className="price-tag hidden",
        e.innerHTML=this.erzeugeMarkup(),
        document.body.appendChild(e),
        e
    }
    renderDisplay(positionen=[], netto=0, brutto=0){
        // Summen
        if(this.totalElement) this.totalElement.textContent=currencyFormatter.format(brutto);
        if(this.netElement) this.netElement.textContent=currencyFormatter.format(netto);
        if(this.stateElement){
            const e=new Date;
            this.stateElement.textContent=`Stand: ${e.toLocaleDateString("de-DE")} ${e.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}`
        }
        // Liste
        const s=(positionen||[]).map(e=>`\n                <li class="price-tag__item">\n                    <div>\n                        <span class="price-tag__item-label">${e.label||""}</span>\n                        <span class="price-tag__item-detail">${e.detail||""}</span>\n                    </div>\n                    <span class="price-tag__item-price">${currencyFormatter.format(e.netto||0)}</span>\n                </li>\n            `).join("");
        this.listElement.innerHTML=s;
        this.container.classList.remove("hidden");
    }
    erzeugeMarkup(){
        return`\n            <div class="price-tag__header">\n                <div class="price-tag__title">Preisübersicht für Fertigung und Montage</div>\n                <div class="price-tag__timestamp"></div>\n            </div>\n            <div class="price-tag__total">\n                <span class="price-tag__total-label">Gesamtpreis</span>\n                <span class="price-tag__total-amount">0,00 €</span>\n                <span class="price-tag__total-note">inkl. ${Math.round(100*VAT_RATE)} % MwSt.</span>\n                <span class="price-tag__net">Netto: <span class="price-tag__net-amount">0,00 €</span></span>\n            </div>\n            <ul class="price-tag__list"></ul>\n            <button id="anfrageWeiterButton" type="button" class="price-tag__anfrage-btn" style="width: 100%; padding: 0.75rem; margin-top: 1rem; background: #2196f3; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1rem;">\n                Weiter zu Anfrage\n            </button>\n        `
    }
    update(e, t){
        // Wenn keine Materialliste vorliegt:
        if(!e){
            // Carport-Modus: zeige ggf. letzte Preisdaten statt zu verstecken
            if(t?.carportModus && this.letztePreisdaten){
                this.renderDisplay(this.letztePreisdaten.positionen||[], this.letztePreisdaten.netto||0, this.letztePreisdaten.brutto||0);
                this.container.classList.remove("hidden");
                return;
            }
            // Normaler Modus ohne Daten -> ausblenden
            return void this.container.classList.add("hidden");
        }
        e = e || {}; // Fallback für carportModus ohne Materialdaten

        const segmentList=Array.isArray(t?.carportSegmente)?t.carportSegmente:[],
        segmentCount=segmentList.length||0,
        hasSegments=!!t?.carportModus&&segmentCount>0,
        normalizeNumber=e=>{
            const t=Number(e);
            return Number.isFinite(t)?t:0
        },
        fallbackHoehe=normalizeNumber(t?.hoehe);

        const montageSum=hasSegments?segmentList.reduce((e, n)=>{
            const i=normalizeNumber(n?.breite),
            r=normalizeNumber(n?.tiefe),
            l=normalizeNumber(n?.hoehe)||fallbackHoehe;
            return e+i+r+l
        }, 0):0;
        const carportMultiplier=hasSegments?segmentCount:Math.max(1, t?.carportModus?Number(t?.carportAnzahl)||0:0);
        const montageOverride=montageSum>0?montageSum:carportMultiplier>1?carportMultiplier*((normalizeNumber(t?.breite))+(normalizeNumber(t?.tiefe))+(normalizeNumber(t?.hoehe)||fallbackHoehe)):null;

        // DEBUG-LOG für Preisberechnung
        console.log("💰 PriceTag Berechnung:", {
            carportModus: t?.carportModus,
            segmentCount: segmentList.length,
            hasSegments,
            materialienLaengstraeger: e?.laengstraeger,
            materialienPfosten: e?.pfosten
        });
        
        const i=[...this.berechnePositionen(e),
        ...this.berechneZusatzpositionen(e, t, {
            montageLaenge:montageOverride
        }),
        ...this.berechneExtras(e, t)],
        r=i.reduce((e, t)=>e+t.netto, 0),
        a=r*(1+VAT_RATE);
        this.renderDisplay(i, r, a);
        // Speichere Preisdaten für Anfrage-Export
        this.letztePreisdaten = {
            netto: r,
            brutto: a,
            positionen: i
        };
        this.letzteKonfiguration = t;
        
        this.unmatched.length&&this.unmatched
    }
    berechnePositionen(e){
        const t=new Map;
        this.unmatched=[];
        const processItem=item=>{
            if(!item||!item.preisInfo)return;
            const info=item.preisInfo;
            if(!info.kategorie||!Number.isFinite(info.menge))return;
            const priceConfig=this.findePreis(info.kategorie, info.schluessel);
            if(!priceConfig){
                return void this.unmatched.push({
                    kategorie:info.kategorie,
                    schluessel:info.schluessel,
                    menge:info.menge,
                    displayName:item.bezeichnung||info.displayName||""
                });
            }
            const key=this.erzeugePositionsSchluessel(info, item);
            if(!t.has(key)){
                t.set(key,{
                    label:item.bezeichnung||info.displayName||`${info.kategorie} ${info.schluessel}`,
                    menge:0,
                    anzahl:0,
                    einheit:info.einheit||priceConfig.unit,
                    unitPrice:priceConfig.price||0,
                    kategorie:info.kategorie,
                    schluessel:info.schluessel,
                    weightPerMeter:priceConfig.weightPerMeter||0,
                    pricePerKg:priceConfig.pricePerKg||0,
                    typ:info.typ
                });
            }
            const entry=t.get(key);
            entry.menge+=Number(info.menge)||0;
            entry.anzahl+=Number(info.anzahl)||0;
        };
        // Preisrelevante Kategorien (inkl. neuer Aluschienen)
        ["pfosten","laengstraeger","quertraeger","glas","aluschienen","aluprofile","seitenprofile"].forEach(kategorie=>{
            (e[kategorie]||[]).forEach(processItem);
        });
        return Array.from(t.values()).map(e=>{
            let nettoPrice, detailText;
            // Kilogramm-basierte Berechnung für Konstruktionsprofile (Pfosten, Träger)
            if ((e.kategorie === 'pfosten' || e.kategorie === 'laengstraeger' || e.kategorie === 'quertraeger') && e.weightPerMeter > 0 && e.pricePerKg > 0) {
                const totalWeight = e.menge * e.weightPerMeter;
                nettoPrice = totalWeight * e.pricePerKg;
                detailText = `${numberFormatter.format(e.menge)} m × ${numberFormatter.format(e.weightPerMeter)} kg/m = ${numberFormatter.format(totalWeight)} kg × ${currencyFormatter.format(e.pricePerKg)}/kg`;
            } else if (e.unitPrice > 0) {
                // Meterpreis für Aluprofile, Glas, EPDM etc.
                nettoPrice = e.menge * e.unitPrice;
                detailText = `${numberFormatter.format(e.menge)} ${e.einheit||""} × ${currencyFormatter.format(e.unitPrice)}`;
            } else {
                // Fallback wenn keine Preisdaten vorhanden
                nettoPrice = 0;
                detailText = `${numberFormatter.format(e.menge)} ${e.einheit||"m"} (Preis nicht verfügbar)`;
            }
            return{
                label:e.label, detail:detailText, netto:nettoPrice
            }
        }).sort((e, t)=>t.netto-e.netto)
    }
    erzeugePositionsSchluessel(info={}, item={}){
        const norm=e=>String(e??"").trim().toLowerCase();
        return[
            norm(info.kategorie),
            norm(info.schluessel),
            norm(info.displayName),
            norm(item.bezeichnung),
            norm(item.profil),
            norm(item.laenge)
        ].join("|")
    }
    berechneZusatzpositionen(e, t, options={}){
        const zusatzpos=[];
        const montageOverride=Number.isFinite(options?.montageLaenge)?options.montageLaenge:null;
        
        // Berechne Gesamt-Alumeter für Vorbehandlung (ohne Aluprofile für Glashalterung)
        let gesamtAlumeter=Number(e?.gesamtAlumeterMeter)||0;
        if(!gesamtAlumeter){
            ["pfosten","laengstraeger","quertraeger"].forEach(kategorie=>{
                const items=e[kategorie]||[];
                items.forEach(item=>{
                    if(item.preisInfo&&item.preisInfo.menge){
                        gesamtAlumeter+=item.preisInfo.menge;
                    }
                });
            });
        }
        
        console.log("🔧 Zusatzpositionen-Berechnung:", {
            gesamtAlumeter,
            pfostenItems: e?.pfosten?.length,
            laengstraegerItems: e?.laengstraeger?.length,
            quertraegerItems: e?.quertraeger?.length,
            gesamtAluFlaeche: e?.gesamtAlu
        });
        
        // Vorbehandlung
        if(gesamtAlumeter>0){
            const vorbehandlungPreis=this.findePreis("vorbehandlung","alumeter");
            if(vorbehandlungPreis){
                const preis=gesamtAlumeter*vorbehandlungPreis.price;
                zusatzpos.push({
                    label:"Vorbehandlung",
                    detail:`${numberFormatter.format(gesamtAlumeter)} m × ${currencyFormatter.format(vorbehandlungPreis.price)}/m`,
                    netto:preis
                });
            }
        }
        
        // Oberflächenbehandlung
        const aluFlaeche=e.gesamtAlu||0;
        if(aluFlaeche>0){
            const oberflaechenPreis=this.findePreis("oberflaechenbehandlung","sichtbar");
            if(oberflaechenPreis){
                const preis=aluFlaeche*oberflaechenPreis.price;
                zusatzpos.push({
                    label:"Oberflächenbehandlung",
                    detail:`${numberFormatter.format(aluFlaeche)} m² × ${currencyFormatter.format(oberflaechenPreis.price)}/m²`,
                    netto:preis
                });
            }
        }
        if(t){
            const basisLaenge=(t.breite||0)+(t.tiefe||0)+(t.hoehe||0),
            gesamtLaenge=montageOverride&&montageOverride>0?montageOverride:basisLaenge;
            if(gesamtLaenge>0){
                const montagePreis=this.findePreis("montage","gesamt");
                if(montagePreis){
                    const preis=gesamtLaenge*montagePreis.price;
                    zusatzpos.push({
                        label:"Montage (B+T+H)",
                        detail:`${numberFormatter.format(gesamtLaenge)} m × ${currencyFormatter.format(montagePreis.price)}/m`,
                        netto:preis
                    });
                }
            }
        }
        return zusatzpos;
    }
    berechneExtras(){
        return EXTRA_POSITIONS.filter(e=>e.price>0).map(e=>({
            label:e.label, detail:"fixed"===e.unit?"Pauschal":"", netto:e.price
        }))
    }
    findePreis(e, t=""){
        const n=PRICE_TABLE[e];
        if(!n)return null;
        return n[(t||"").toLowerCase()]||n[t]||n.default||null
    }
}
