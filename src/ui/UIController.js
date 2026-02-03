import{
    ProfileKonfiguration
}
from"../config/ProfileKonfiguration.js";
import{
    Infobox
}
from"./Infobox.js";
import{
    IndividualPostController
}
from"./IndividualPostController.js";
import{
    PriceTag
}
from"./PriceTag.js";
import { DimensionHandles } from "./DimensionHandles.js";
import StaticsCheck from"../core/StaticsCheck.js";
import { ShareLink } from "../utils/ShareLink.js";
import { SliderController } from "./SliderController.js";
import { PostController } from "./PostController.js";
import { OptionCardController } from "./OptionCardController.js";
import { Logger } from "../utils/Logger.js";
export class UIController{
    constructor(e){
        this.renderEngine=e,
        this.elemente={},
        this.profileKonfig=new ProfileKonfiguration,
        this.infobox=null,
        this.individualPostController=null,
        this.priceTag=null,
        this.optionCardGroups={},
        this.shareLink=new ShareLink(),
        this.aktuelleKonfiguration={
            breite:4,
            tiefe:3,
            hoehe:2.5,
            neigung:3,
            typ:"freistehend",
            material:"aluminium",
            farbe:"ral7016",
            ncsFarbe:null,
            pfostenProfil:"160x80x4",
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
            befestigung:"ankerplatte",
            regenwasserAbfluss:"rinne",
            dachTyp:"glas",
            dachForm:"pultdach",
            epdmFarbe:"schwarz",
            glasTyp:"klar",
            glasFarbe:"klar",
            carportModus:!1,
            carportSegmente:[]
        },
        this.selectPropertyMap={
            type:"typ",
            material:"material",
            color:"farbe",
            drainage:"regenwasserAbfluss",
            roofType:"dachTyp",
            dachTyp:"dachForm",
            epdmColor:"epdmFarbe",
            fasteningType:"befestigung",
            pfostenProfil:"pfostenProfil",
            ncsColor:"ncsFarbe",
            intermediatePostsProfile:"zwischenpfostenProfil"
        },
        this.dragHandlesVisible=!0,
        this.logger=new Logger("UIController"),
        this.sliderController=null,
        this.postController=null,
        this.optionCardController=null,
        this.logger.debug("UI-Controller initialisiert")
    }
    initialisieren(){
        this.logger.debug("Initialisiere UI-Controller..."),
        this.sammleDOMElemente(),
        this.erstelleSubController(),
        this.initAccordion(),
        this.sliderController.initialisieren(),
        this.sliderController.onHeightUpdate(()=>{
            this.updateHoehenInfo(),
            this.updatePfostenKuerzungMaxWerte()
        }),
        this.postController.initialisieren(),
        this.initKopfbaender(),
        this.initCarportModus(),
        this.initSelects(),
        this.optionCardController.initialisieren(),
        this.initGlassColorOptions(),
        this.updateDrainageVerfuegbarkeit(),
        this.initProfilauswahl(),
        this.initKoordinatenToggle(),
        this.initConfigToggle(),
        this.initInfobox(),
        this.initPriceTag(),
        this.initIndividualPostController(),
        this.initBemassungToggle(),
        this.initDragHandlesToggle(),
        this.initShareButton(),
        this.dimensionHandles=new DimensionHandles(this.renderEngine, this),
        this.updateStatus("UI-Controller erfolgreich initialisiert", "success"),
        this.sliderController.aktualisiereWerte(),
        this.updateHoehenInfo(),
        this.updatePfostenKuerzungMaxWerte(),
        this.onKonfigurationGeaendert(),
        this.aktualisiereProfilauswahl("green"),
        this.loadConfigFromUrl(),
        this.logger.debug("UI-Controller bereit"),
        document.addEventListener("staticsAction", e=>{
            try{
                this.applyStaticsAction(e.detail||{})
            }
            catch(e){
                console.warn("Statik-Aktion fehlgeschlagen:", e)
            }
        }),
        document.addEventListener("profilAenderung", e=>{
            try{
                this.wendeProfilkonfigurationAn(e.detail)
            }
            catch(e){
                console.warn("Profiländerung fehlgeschlagen:", e)
            }
        }),
        document.addEventListener("mitteltraegerAenderung", e=>{
            try{
                this.wendeMitteltraegerAn(e.detail)
            }
            catch(e){
                console.warn("Mittelträger-Änderung fehlgeschlagen:", e)
            }
        })
    }
    sammleDOMElemente(){
        this.elemente={
            debugContent:document.getElementById("debug-content"),
            coordinatesContent:document.getElementById("coordinates-content"),
            statsContent:document.getElementById("stats-content"),
            width:document.getElementById("width"),
            depth:document.getElementById("depth"),
            height:document.getElementById("height"),
            slope:document.getElementById("slope"),
            slopeGroup:document.getElementById("roof-slope-group"),
            widthInput:document.getElementById("width-input"),
            depthInput:document.getElementById("depth-input"),
            heightInput:document.getElementById("height-input"),
            slopeInput:document.getElementById("slope-input"),
            postOffsetFrontRange:document.getElementById("post-offset-front"),
            postOffsetFrontInput:document.getElementById("post-offset-front-input"),
            postOffsetRearRange:document.getElementById("post-offset-rear"),
            postOffsetRearInput:document.getElementById("post-offset-rear-input"),
            postShortenFrontRange:document.getElementById("post-shorten-front"),
            postShortenFrontInput:document.getElementById("post-shorten-front-input"),
            postShortenRearRange:document.getElementById("post-shorten-rear"),
            postShortenRearInput:document.getElementById("post-shorten-rear-input"),
            postShortenMiddleRange:document.getElementById("post-shorten-middle"),
            postShortenMiddleInput:document.getElementById("post-shorten-middle-input"),
            noPostsFrontButton:document.getElementById("no-posts-front"),
            noPostsRearButton:document.getElementById("no-posts-rear"),
            centerPostToggle:document.getElementById("center-post-toggle"),
            intermediatePostsWidthToggle:document.getElementById("intermediate-posts-width-toggle"),
            intermediatePostsDepthToggle:document.getElementById("intermediate-posts-depth-toggle"),
            intermediatePostsProfile:document.getElementById("zwischenpfosten-profil"),
            intermediatePostsWidthBtn:document.getElementById("intermediate-posts-width-btn"),
            intermediatePostsDepthBtn:document.getElementById("intermediate-posts-depth-btn"),
            kopfbaenderToggle:document.getElementById("kopfbaender-toggle"),
            kopfbaenderSettings:document.getElementById("kopfbaender-settings"),
            kopfbaenderPosition:document.getElementById("kopfbaender-position"),
            kopfbaenderWinkel:document.getElementById("kopfbaender-winkel"),
            kopfbaenderWinkelInput:document.getElementById("kopfbaender-winkel-input"),
            carportModeToggle:document.getElementById("carport-mode-toggle"),
            carportSettings:document.getElementById("carport-settings"),
            carportCount:document.getElementById("carport-count"),
            carportSpacing:document.getElementById("carport-spacing"),
            carportSpacingInput:document.getElementById("carport-spacing-input"),
            pergola2Settings:document.getElementById("pergola2-settings"),
            pergola2Width:document.getElementById("pergola2-width"),
            pergola2Depth:document.getElementById("pergola2-depth"),
            pergola2Height:document.getElementById("pergola2-height"),
            pergola3Settings:document.getElementById("pergola3-settings"),
            pergola3Width:document.getElementById("pergola3-width"),
            pergola3Depth:document.getElementById("pergola3-depth"),
            pergola3Height:document.getElementById("pergola3-height"),
            pergola4Settings:document.getElementById("pergola4-settings"),
            pergola4Width:document.getElementById("pergola4-width"),
            pergola4Depth:document.getElementById("pergola4-depth"),
            pergola4Height:document.getElementById("pergola4-height"),
            fasteningType:document.getElementById("fastening-type"),
            type:document.getElementById("type"),
            material:document.getElementById("material"),
            color:document.getElementById("color"),
            drainage:document.getElementById("drainage"),
            roofType:document.getElementById("roof-type"),
            dachTyp:document.getElementById("dach-typ"),
            epdmColor:document.getElementById("epdm-color"),
            epdmColorGroup:document.getElementById("epdm-color-group"),
            glassColorGroup:document.getElementById("glass-color-group"),
            glassColorOptions:document.querySelectorAll(".glass-color-option"),
            typeOptionCards:document.querySelectorAll("#type-option-cards .option-card"),
            roofTypeOptionCards:document.querySelectorAll("#roof-type-cards .option-card"),
            dachTypOptionCards:document.querySelectorAll("#dach-typ-cards .option-card"),
            drainageOptionCards:document.querySelectorAll("#drainage-cards .option-card"),
            materialOptionCards:document.querySelectorAll("#material-cards .option-card"),
            colorOptionCards:document.querySelectorAll("#color-cards .option-card"),
            ncsColorCards:document.querySelectorAll("#ncs-color-cards .option-card"),
            profileOptionCards:document.querySelectorAll("#profile-cards .option-card"),
            pfostenProfil:document.getElementById("pfosten-profil"),
            profileInfo:document.getElementById("profile-info"),
            koordinatenToggle:document.getElementById("toggle-koordinaten")
        },
        Object.entries(this.elemente).forEach(([e, t])=>{})
    }
    erstelleSubController(){
        const onChangeCallback=()=>this.onKonfigurationGeaendert();
        this.sliderController=new SliderController(
            this.elemente,
            this.aktuelleKonfiguration,
            onChangeCallback
        );
        this.postController=new PostController(
            this.elemente,
            this.aktuelleKonfiguration,
            onChangeCallback
        );
        this.optionCardController=new OptionCardController(
            this.elemente,
            this.aktuelleKonfiguration,
            this.selectPropertyMap,
            onChangeCallback
        );
        this.logger.debug("Sub-Controller erstellt");
    }
    initSlider(){
        // Delegiert an SliderController
        this.sliderController?.initialisieren();
    }
    initPfostenVersatzSteuerung(){
        // Wird nun von PostController.initialisieren() übernommen
    }
    initPfostenKuerzungSteuerung(){
        // Wird nun von PostController.initialisieren() übernommen
    }
    initCenterPostToggle(){
        // Wird nun von PostController.initialisieren() übernommen
        this.updateMittelpfostenHinweis();
    }
    initIntermediatePostsToggle(){
        // Wird nun von PostController.initialisieren() übernommen
    }
    updateMittelpfostenHinweis(){
        const e=this.aktuelleKonfiguration.breite||4,
        t=this.aktuelleKonfiguration.tiefe||3,
        n=e>4.5||t>4.5;
        let i=document.getElementById("mittelpfosten-option-hinweis");
        if(!i&&n){
            const n=this.elemente.centerPostToggle;
            if(!n)return;
            const o=n.closest(".control-group");
            if(!o)return;
            i=document.createElement("div"),
            i.id="mittelpfosten-option-hinweis",
            i.style.cssText="margin-top: 0.75rem; padding: 0.75rem; background: #f0f8ff; border-left: 3px solid #2196F3; border-radius: 4px;";
            const r=Math.max(e, t).toFixed(1);
            i.innerHTML=`\n                <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #1976D2;">Profil-Optionen für große Pergolen (>${r}m):</p>\n                <p style="margin: 0.25rem 0; color: #2e7d32;">\n                    <strong>Mit Mittelpfosten (empfohlen):</strong><br>\n                    <span style="margin-left: 1.5rem; font-size: 0.9em;">160×80 Mittelträger (günstiger, statisch optimal)</span>\n                </p>\n                <p style="margin: 0.25rem 0; color: #d32f2f;">\n                    <strong>Ohne Mittelpfosten:</strong><br>\n                    <span style="margin-left: 1.5rem; font-size: 0.9em;">200×120 Mittelträger erforderlich (teurer + 0mm Abstand zum Rahmen)</span>\n                </p>\n            `,
            o.appendChild(i)
        }
        if(i&&(i.style.display=n?"block":"none", n)){
            const n=Math.max(e, t).toFixed(1),
            o=i.querySelector("p:first-child");
            o&&(o.innerHTML=`Profil-Optionen für große Pergolen (>${n}m):`);
            const r=i.querySelector("p:nth-child(2)"),
            s=i.querySelector("p:nth-child(3)"),
            a=!!this.aktuelleKonfiguration.zentralerMittelpfosten;
            r&&s&&(a?(r.style.background="#e8f5e9", r.style.padding="0.5rem", r.style.borderRadius="4px", s.style.background="transparent", s.style.padding="0"):(s.style.background="#ffebee", s.style.padding="0.5rem", s.style.borderRadius="4px", r.style.background="transparent", r.style.padding="0"))
        }
    }
    initKopfbaender(){
        const e=this.elemente.kopfbaenderToggle,
        t=this.elemente.kopfbaenderSettings,
        n=this.elemente.kopfbaenderPosition,
        i=this.elemente.kopfbaenderWinkel,
        o=this.elemente.kopfbaenderWinkelInput;
        if(e){
            if(e.checked=!!this.aktuelleKonfiguration.kopfbaenderAktiv, t&&(t.style.display=e.checked?"block":"none"), e.addEventListener("change", e=>{
                const n=e.target.checked;
                this.aktuelleKonfiguration.kopfbaenderAktiv=n, t&&(t.style.display=n?"block":"none"), console.log("🔺 Kopfbänder "+(n?"aktiviert":"deaktiviert")), this.onKonfigurationGeaendert()
            }), n&&(n.value=this.aktuelleKonfiguration.kopfbaenderPosition||"ecken", n.addEventListener("change", e=>{
                this.aktuelleKonfiguration.kopfbaenderPosition=e.target.value, console.log(`🔺 Kopfbänder-Position: ${e.target.value}`), this.onKonfigurationGeaendert()
            })), i&&o){
                const e=this.aktuelleKonfiguration.kopfbaenderWinkel||45;
                i.value=e,
                o.value=e;
                const t=e=>{
                    i.value=e,
                    o.value=e,
                    this.aktuelleKonfiguration.kopfbaenderWinkel=parseFloat(e),
                    console.log(`🔺 Kopfbänder-Winkel: ${e}°`),
                    this.onKonfigurationGeaendert()
                };
                i.addEventListener("input", e=>t(e.target.value)),
                o.addEventListener("change", e=>{
                    const n=Math.max(30, Math.min(60, parseFloat(e.target.value)||45));
                    t(n)
                })
            }
        }
        else console.warn("Kopfbänder-Toggle nicht gefunden")
    }
    initKeinePfostenButtons(){
        // Wird nun von PostController.initialisieren() übernommen
    }
    togglePfostenAktiv(e){
        this.postController?.togglePfostenAktiv(e);
    }
    updateKeinePfostenButtonStatus(){
        this.postController?.updateKeinePfostenButtonStatus();
    }
    clampPfostenVersatz(e, t=0){
        return this.postController?.clampVersatz(e, t) ?? t;
    }
    berechneMaxPfostenKuerzung(){
        return this.postController?.berechneMaxKuerzung() ?? 2.47;
    }
    updatePfostenKuerzungMaxWerte(){
        this.postController?.aktualisiereKuerzungMaxWerte();
    }
    clampPfostenKuerzung(e, t=0){
        return this.postController?.clampKuerzung(e, t) ?? t
    }
    aktualisierePfostenVersatz(e, t, n=!0){
        this.postController?.aktualisierePfostenVersatz(e, t, n);
    }
    aktualisierePfostenKuerzung(e, t, n=!0){
        this.postController?.aktualisierePfostenKuerzung(e, t, n);
    }
    initSelects(){
        ["type",
        "material",
        "color",
        "drainage",
        "roofType",
        "epdmColor",
        "fasteningType",
        "intermediatePostsProfile"].forEach(e=>{
            const t=this.elemente[e];
            t&&t.addEventListener("change", t=>{
                const n=this.selectPropertyMap[e];
                n&&(this.aktuelleKonfiguration[n]=t.target.value), this.updateOptionCardState(e, t.target.value), "roofType"===e&&(this.updateEpdmColorVisibility(), this.updateDrainageVerfuegbarkeit(), this.updateGlassColorVisibility(), this.updateRoofHints()), "drainage"===e&&(this.pruefeDrainageEinschraenkung(), this.updateDrainageHints()), "type"===e&&this.updateTypeHints(), "fasteningType"===e&&this.updateFasteningHints(), "color"===e&&(this.aktuelleKonfiguration.ncsFarbe=null, this.updateOptionCardState("ncsColor", null)), this.onKonfigurationGeaendert()
            })
        }),
        this.updateEpdmColorVisibility(),
        this.updateDrainageVerfuegbarkeit(),
        this.updateGlassColorVisibility(),
        this.updateDachformVerfuegbarkeit(),
        this.updateNeigungsSteuerung(),
        this.updateSelectHints()
    }
    initOptionCardGroups(){
        // Wird nun von OptionCardController.initialisieren() übernommen
        // Behalte optionCardGroups für Rückwärtskompatibilität
        this.optionCardGroups = this.optionCardController?.cardGroups || {};
    }
    handleOptionCardSelection(e, t){
        // Delegiert an OptionCardController
        this.optionCardController?.handleSelection(e, t);

        // UIController-spezifische Nachbearbeitung
        if("dachTyp"===e){
            this.updateDrainageVerfuegbarkeit();
        }
        if("pfostenProfil"===e){
            this.updateProfilInfo(t);
        }
        if("ncsColor"===e){
            this.updateStatus(`NCS-Farbe gewählt: ${t.toUpperCase()}`, "success");
        }
    }
    updateOptionCardState(e, t){
        this.optionCardController?.updateState(e, t);
    }
    initGlassColorOptions(){
        const e=Array.from(this.elemente.glassColorOptions||[]);
        0!==e.length?(e.forEach(e=>{
            e.addEventListener("click", ()=>{
                const t=e.dataset.glassColor;
                t&&this.aktuelleKonfiguration.glasFarbe!==t?(this.aktuelleKonfiguration.glasFarbe=t, this.aktuelleKonfiguration.glasTyp=t, this.setActiveGlassColorOption(t), this.updateStatus(`Glasfarbe geändert zu: ${e.dataset.label||t}`, "success"), this.onKonfigurationGeaendert()):this.setActiveGlassColorOption(t)
            })
        }), this.setActiveGlassColorOption(this.aktuelleKonfiguration.glasFarbe), this.updateGlassColorVisibility()):this.updateGlassColorVisibility()
    }
    setActiveGlassColorOption(e){
        Array.from(this.elemente.glassColorOptions||[]).forEach(t=>{
            const n=t.dataset.glassColor===e;
            t.classList.toggle("active", n), t.setAttribute("aria-pressed", n?"true":"false")
        })
    }
    updateEpdmColorVisibility(){
        const e=this.elemente.epdmColorGroup;
        e&&("epdm"===this.aktuelleKonfiguration.dachTyp?e.style.display="block":e.style.display="none")
    }
    updateGlassColorVisibility(){
        const e=this.elemente.glassColorGroup,
        t="glas"===this.aktuelleKonfiguration.dachTyp;
        e&&(e.style.display=t?"block":"none");
        Array.from(this.elemente.glassColorOptions||[]).forEach(e=>{
            e.disabled=!t, e.setAttribute("tabindex", t?"0":"-1")
        })
    }
    updateDrainageVerfuegbarkeit(){
        const e=this.elemente.drainage;
        if(!e)return;
        const n=this.aktuelleKonfiguration.carportModus;
        const istEpdm = this.aktuelleKonfiguration.dachTyp === 'epdm';
        const istFlachdachForm = this.aktuelleKonfiguration.dachForm === 'flachdach';
        const istFlachdach = istFlachdachForm || Math.abs(this.aktuelleKonfiguration.neigung) <= 1e-6;
        const istPultdach = this.aktuelleKonfiguration.dachForm === 'pultdach';

        console.log('🔍 updateDrainageVerfuegbarkeit:', {
            dachForm: this.aktuelleKonfiguration.dachForm,
            dachTyp: this.aktuelleKonfiguration.dachTyp,
            istPultdach: istPultdach
        });

        // Flachdach: immer Mit Rinne erzwingen
        if(istFlachdach && this.aktuelleKonfiguration.regenwasserAbfluss!=="rinne"){
            this.aktuelleKonfiguration.regenwasserAbfluss="rinne";
            e.value="rinne";
            this.updateOptionCardState("drainage", "rinne");
        }

        // DIREKT: Glasüberstand-Button finden und ausblenden
        // Glasüberstand nur verfügbar bei Glas-Pultdach, NICHT bei EPDM/Carport/Flachdach
        const glasueberstandBtn = document.querySelector('[data-value="glasueberstand"]');
        if(glasueberstandBtn){
            const hideGlasUeberstand = istEpdm || n || istFlachdach;
            glasueberstandBtn.style.display = hideGlasUeberstand ? "none" : "";
            glasueberstandBtn.disabled = hideGlasUeberstand;
            hideGlasUeberstand && console.log("✅ Glasüberstand ausgeblendet (EPDM/Carport)");
            !hideGlasUeberstand && console.log("✅ Glasüberstand verfügbar (Glas-Pultdach)");
        }else{
            console.warn("⚠️ Glasüberstand-Button nicht gefunden!");
        }

        // Select-Option deaktivieren (Glasüberstand nur bei EPDM/Carport) + Pultdach: keine Vollprofil
        const t=Array.from(e.options||[]);
        t.forEach(opt=>{
            if(opt.value==="glasueberstand"){
                opt.disabled = (istEpdm || n || istFlachdach);
            } else if(opt.value==="vollprofil"){
                opt.disabled = istFlachdach || istPultdach;
            }
        });

        // Falls aktuell verbotene Auswahl aktiv, auf Rinne setzen
        const verboteneAuswahl = (e.value==="glasueberstand" && (istEpdm||n||istFlachdach)) || (e.value==="vollprofil" && (istFlachdach||istPultdach));
        if(verboteneAuswahl){
            e.value="rinne";
            this.aktuelleKonfiguration.regenwasserAbfluss="rinne";
            this.updateOptionCardState("drainage", "rinne");
        }

        // Pultdach: "Ohne Rinne" (vollprofil) ausblenden
        const vollprofilBtn = document.querySelector('[data-value="vollprofil"]');
        if(vollprofilBtn){
            const hideVollprofil = istPultdach;
            vollprofilBtn.style.display = hideVollprofil ? "none" : "";
            vollprofilBtn.disabled = hideVollprofil;
            hideVollprofil && console.log("✅ Vollprofil (Ohne Rinne) ausgeblendet (Pultdach)");
        }

        // Drainage-Optionen basierend auf Dachtyp und -form
        const drainageCards = Array.from(document.querySelectorAll('#drainage-cards .option-card')) || [];
        
        // Alle Optionen erst mal sichtbar machen, dann einzeln prüfen
        drainageCards.forEach(btn=>{
            const val = btn.dataset.value;
            let hide = false;
            
            // Glasüberstand: nur bei Glas-Pultdach, nicht bei EPDM/Carport/Flachdach
            if(val === "glasueberstand"){
                hide = istEpdm || n || istFlachdach;
            }
            // Vollprofil: nicht bei Pultdach oder Flachdach
            else if(val === "vollprofil"){
                hide = istPultdach || istFlachdach;
            }
            
            btn.style.display = hide ? "none" : "";
            btn.disabled = hide;
            btn.setAttribute("aria-disabled", hide ? "true" : "false");
        });
        
        // Wenn aktuelle Auswahl versteckt ist, auf Rinne zurücksetzen
        const activeHidden = drainageCards.find(btn => btn.dataset.value === e.value && btn.style.display === "none");
        if(activeHidden){
            e.value = "rinne";
            this.aktuelleKonfiguration.regenwasserAbfluss = "rinne";
            this.updateOptionCardState("drainage", "rinne");
        }
    }
    updateDachformVerfuegbarkeit(){
        const carportAktiv=!!this.aktuelleKonfiguration.carportModus;
        const dachFormSelect=this.elemente.dachTyp||document.getElementById("dach-typ");
        const pultdachBtn=document.querySelector('#dach-typ-cards .option-card[data-value="pultdach"]');

        if(dachFormSelect){
            Array.from(dachFormSelect.options||[]).forEach(opt=>{
                if(opt.value==="pultdach"){
                    opt.disabled=carportAktiv;
                }
            });
        }
        if(pultdachBtn){
            pultdachBtn.disabled=carportAktiv;
            pultdachBtn.setAttribute("aria-disabled", carportAktiv?"true":"false");
            if(!carportAktiv){
                pultdachBtn.removeAttribute("disabled");
            }
        }

        if(carportAktiv && this.aktuelleKonfiguration.dachForm==="pultdach"){
            this.aktuelleKonfiguration.dachForm="flachdach";
            this.aktuelleKonfiguration.neigung=0;
            dachFormSelect&&(dachFormSelect.value="flachdach");
            this.updateOptionCardState("dachTyp", "flachdach");
            const slopeInput=this.elemente.slopeInput;
            const slopeRange=this.elemente.slope;
            slopeInput&&(slopeInput.value="0.0");
            slopeRange&&(slopeRange.value="0");
            console.log("🚫 Pultdach im Carport-Modus deaktiviert – Flachdach gesetzt");
        }
    }
    updateNeigungsSteuerung(){
        const istFlachdach=this.aktuelleKonfiguration.dachForm==="flachdach";
        const istCarport=!!this.aktuelleKonfiguration.carportModus;
        this.sliderController?.aktualisiereNeigungsSteuerung(istFlachdach,istCarport);
    }
    updateTypeVerfuegbarkeit(){
        const carportAktiv = this.aktuelleKonfiguration.carportModus;

        // DIREKT: Wandmontiert-Button finden und ausblenden
        const wandanschlussBtn = document.querySelector('[data-value="wandanschluss"]');
        if(wandanschlussBtn){
            if(carportAktiv){
                wandanschlussBtn.style.display = "none";
                console.log("✅ Wandmontiert ausgeblendet im Carport-Modus");
            }else{
                wandanschlussBtn.style.display = "";
                console.log("✅ Wandmontiert eingeblendet im Pergola-Modus");
            }
        }

        // Falls Wandanschluss aktiv war, zu Freistehend wechseln
        const typeSelect = this.elemente.type || document.getElementById("type");
        if(carportAktiv && typeSelect && "wandanschluss"===typeSelect.value){
            typeSelect.value="freistehend";
            this.aktuelleKonfiguration.typ="freistehend";
            this.updateOptionCardState("type", "freistehend");
        }
    }
    pruefeDrainageEinschraenkung(){
        // ENTFERNT: Carportmodus erlaubt jetzt beide Optionen (Mit Rinne / Ohne Rinne)
        // Keine Einschränkung mehr erforderlich
        return;
    }
    initProfilauswahl(){
        const e=this.elemente.pfostenProfil;
        this.elemente.profileInfo;
        e&&(e.value!==this.aktuelleKonfiguration.pfostenProfil&&(e.value=this.aktuelleKonfiguration.pfostenProfil), this.updateOptionCardState("pfostenProfil", e.value), e.addEventListener("change", e=>{
            const t=e.target.value;
            this.profileKonfig.setzeAktuellesProfil(t)&&(this.aktuelleKonfiguration.pfostenProfil=t, this.updateProfilInfo(t), this.onKonfigurationGeaendert(), this.updateStatus(`Profil geändert zu: ${this.profileKonfig.gibProfil(t).name}`, "success"), this.updateOptionCardState("pfostenProfil", t))
        }), this.updateProfilInfo(this.aktuelleKonfiguration.pfostenProfil))
    }
    updateProfilInfo(e){
        const t=this.elemente.profileInfo;
        if(!t)return;
        const n=this.profileKonfig.gibProfil(e);
        if(n){
            const i=n.abmessungen;
            let o=`<small>${Math.round(1e3*i.breite)}×${Math.round(1e3*i.tiefe)}mm, Wandstärke ${Math.round(1e3*i.wandstaerke)}mm`;
            const konfig=this.pergola?.konfiguration?.gibAktuelleKonfiguration(),
            r=this.profileKonfig.gibMitteltraegerProfil(konfig);
            if(r&&r.id!==e){
                const e=r.abmessungen;
                o+=`<br>Mittelträger: ${Math.round(1e3*e.breite)}×${Math.round(1e3*e.tiefe)}mm`
            }
            o+="</small>",
            t.innerHTML=o
        }
        this.updateHoehenInfo()
    }
    updateHoehenInfo(){
        const e=document.querySelector(".height-info small");
        if(!e)return;
        const t=this.aktuelleKonfiguration.hoehe,
        n=this.profileKonfig.gibAktuellesProfil();
        if(n){
            const i=t-n.abmessungen.breite,
            o=Math.round(100*i),
            r=Math.round(100*t);
            e.innerHTML=`Höhe von Boden bis Oberkante Querträger<br>\n                Durchgangshöhe: ~${o}cm (bei ${r}cm Gesamthöhe)`
        }
    }
    initKoordinatenToggle(){
        const e=this.elemente.koordinatenToggle;
        e&&e.addEventListener("change", e=>{
            const t=e.target.checked;
            if(this.renderEngine){
                this.renderEngine.setzeKoordinatenSichtbarkeit(t);
                const e=t?"Koordinaten angezeigt":"Koordinaten ausgeblendet";
                console.log(e)
            }
        })
    }
    initCarportModus(){
        console.log("🚗 Carport-Modus: Segment-Management aktiv (siehe HTML-Script)");
        document.addEventListener('carportModeChanged', e => {
            const aktiv = Boolean(e.detail?.aktiv);
            this.updateDachformVerfuegbarkeit();
            if(!aktiv)return;
            
            // Carportmodus: Flachdach und Rinne erzwingen
            this.aktuelleKonfiguration.dachForm = 'flachdach';
            this.aktuelleKonfiguration.neigung = 0;
            this.aktuelleKonfiguration.regenwasserAbfluss = 'rinne';
            
            this.updateDrainageVerfuegbarkeit();
            this.updateNeigungsSteuerung();
            this.pruefeDrainageEinschraenkung();
            this.onKonfigurationGeaendert();
        });
    }
    initAccordion(){
        document.querySelectorAll(".accordion-header").forEach(e=>{
            e.addEventListener("click", ()=>{
                const t=e.dataset.section, n=document.getElementById(`accordion-${t}`);
                e.classList.contains("active")?(e.classList.remove("active"), n.classList.remove("open")):(e.classList.add("active"), n.classList.add("open"))
            })
        })
    }
    initConfigToggle(){
        const e=document.getElementById("config-toggle"),
        t=document.getElementById("sidebar");
        e&&t&&e.addEventListener("click", ()=>{
            t.classList.toggle("open");
            t.classList.contains("open");
            e.querySelector("span").textContent="⚙️ Konfiguration"
        })
    }
    syncCenterPostToggle(){
        this.postController?.syncCenterPostToggle();
    }
    updateSelectHints(){
        this.updateTypeHints(),
        this.updateRoofHints(),
        this.updateDrainageHints(),
        this.updateFasteningHints()
    }
    toggleHint(e, t){
        const n=document.getElementById(e);
        n&&(n.style.display=t?"block":"none")
    }
    updateTypeHints(){
        const e="wandanschluss"===this.aktuelleKonfiguration.typ;
        this.toggleHint("hint-type-wandmontiert", e)
    }
    updateRoofHints(){
        const e=this.aktuelleKonfiguration.dachTyp;
        this.toggleHint("hint-roof-glas", "glas"===e),
        this.toggleHint("hint-roof-epdm", "epdm"===e)
    }
    updateDrainageHints(){
        const e=this.aktuelleKonfiguration.regenwasserAbfluss;
        this.toggleHint("hint-drainage-rinne", "rinne"===e),
        this.toggleHint("hint-drainage-glasueberstand", "glasueberstand"===e),
        this.toggleHint("hint-drainage-vollprofil", "vollprofil"===e)
    }
    updateFasteningHints(){
        const e=this.aktuelleKonfiguration.befestigung;
        this.toggleHint("hint-fastening-ankerplatte", "ankerplatte"===e),
        this.toggleHint("hint-fastening-einbetonieren", "einbetonieren"===e)
    }
    updateDragToggleVisibility(){
        const toggle=document.getElementById("drag-handles-toggle");
        if(!toggle)return;
        const carportAktiv=!!this.aktuelleKonfiguration.carportModus;
        toggle.style.display=carportAktiv?"":"none";
        toggle.hidden=!carportAktiv;
        if(!carportAktiv){
            this.dimensionHandles?.setHandlesVisible(!1);
        }else{
            this.dimensionHandles?.setHandlesVisible(this.dragHandlesVisible!==!1);
            this.updateDragToggleLabel();
        }
    }
    initDragHandlesToggle(){
        const toggle=document.getElementById("drag-handles-toggle");
        if(!toggle)return;
        this.updateDragToggleLabel();
        toggle.addEventListener("click", ()=>{
            this.dragHandlesVisible=!this.dragHandlesVisible;
            this.dimensionHandles?.setHandlesVisible(this.dragHandlesVisible);
            this.updateDragToggleLabel();
        });
    }
    updateDragToggleLabel(){
        const toggle=document.getElementById("drag-handles-toggle");
        if(!toggle)return;
        const active=this.dragHandlesVisible!==!1;
        toggle.setAttribute("aria-pressed", active?"true":"false");
        toggle.textContent=active?"👁️ Drag-Icons ausblenden":"👁️ Drag-Icons einblenden";
    }
    aktualisiereKonfiguration(e, t){
        this.logger.debug(`Aktualisiere ${e} = ${t}`),
        this.aktuelleKonfiguration[e]=t,
        this.onKonfigurationGeaendert()
    }
    onKonfigurationGeaendert(){
        if(this.logger.debug("Konfiguration geändert:", this.aktuelleKonfiguration), this.updateDachformVerfuegbarkeit(), this.updateNeigungsSteuerung(), this.updateDragToggleVisibility(), this.syncCenterPostToggle(), this.updateMittelpfostenHinweis(), this.updateSelectHints(), this.individualPostController&&this.individualPostController.updateVisiblePosts(), this.renderEngine&&this.renderEngine.gibPergola()){
            const e=this.renderEngine.gibPergola();
            this.aktuelleKonfiguration.pfostenProfil&&e.setzeAktivesProfil(this.aktuelleKonfiguration.pfostenProfil),
            e.aktualisiereKonfigurationen(this.aktuelleKonfiguration),
            this.renderEngine.aktualisierePergola(this.aktuelleKonfiguration),
            this.renderEngine.aktualisiereKoordinatenAnzeige(),
            this.updateStats(e.berechneStatistiken());

            if(this.infobox&&this.infobox.aktualisiereInhalte){
                this.infobox.aktualisiereInhalte();
            }
            if(this.priceTag&&this.infobox){
                // Warte kurz, damit Infobox die Materialien aktualisiert hat
                const runPriceUpdate=()=>{
                    const materialien = this.infobox.gibLetzteMaterialien();
                    console.log("💰 PriceTag Update mit Materialien:", materialien);
                    this.priceTag.update(materialien, this.aktuelleKonfiguration);
                };
                if("function"==typeof queueMicrotask)queueMicrotask(runPriceUpdate);
                else if("function"==typeof Promise)Promise.resolve().then(runPriceUpdate).catch(()=>setTimeout(runPriceUpdate,0));
                else setTimeout(runPriceUpdate,0);
            }
        }
        this.updateStatus("Pergola aktualisiert", "success");
        try{
            const e=document.getElementById("static-compact-indicator"),
            t=document.getElementById("static-compact-note");
        const staticsCardIndicator=document.getElementById("statics-card-indicator"),
        staticsCardText=document.getElementById("statics-card-text"),
        staticsCardNote=document.getElementById("statics-card-note");
        if(e||staticsCardIndicator){
                const n=this.renderEngine?.gibPergola?.()?.laengstraeger?.profileKonfig?.mitteltraegerOverride||void 0,
                i=this.renderEngine?.gibPergola?.()?.quertraeger?.profileKonfig?.mitteltraegerOverride||void 0,
                o=StaticsCheck.compute(this.aktuelleKonfiguration, {
                    midLongOverride:n, midTransOverride:i
                }),
                r="green"===o.status?"🟢":"yellow"===o.status?"🟡":"🔴";
                if(e&&(e.textContent=r, t)){
                    const e=o.messages?.[0]||"Alle Nachweise erfüllt.",
                    n="green"===o.status?"maßgebend":"kritisch";
                    t.textContent=`${e}${o.limiting_element?` · ${
                        n
                    }
                    : ${
                        o.limiting_element
                    }
                    `:""}`
                }
                if(staticsCardIndicator&&(staticsCardIndicator.textContent=r, staticsCardText&&staticsCardNote)){
                    if("green"===o.status) staticsCardText.textContent="Statik OK", staticsCardText.style.color="#2e7d32", staticsCardNote.textContent="Alle Nachweise erfüllt", staticsCardNote.style.color="#666";
                    else if("yellow"===o.status) staticsCardText.textContent="Grenzwertig", staticsCardText.style.color="#f57c00", staticsCardNote.textContent="Optimierung empfohlen", staticsCardNote.style.color="#e65100";
                    else staticsCardText.textContent="Kritisch!", staticsCardText.style.color="#c62828", staticsCardNote.textContent="Anpassung erforderlich. Alternativen finden Sie im Punkt 'Konstruktion'", staticsCardNote.style.color="#b71c1c"
                }
                this.aktualisiereProfilauswahl(o.status);
                this.aktualisiereCarportHinweis(o.status)
            }
        }
        catch(e){}
    }
    ladeExterneKonfiguration(e={}){
        if(!e||"object"!=typeof e)return;
        const t={
            ...this.aktuelleKonfiguration,
            ...e,
            pfostenVersaetze:{
                ...this.aktuelleKonfiguration.pfostenVersaetze,
                ...(e.pfostenVersaetze||{})
            },
            pfostenKuerzung:{
                ...this.aktuelleKonfiguration.pfostenKuerzung,
                ...(e.pfostenKuerzung||{})
            },
            pfostenAktiv:{
                ...this.aktuelleKonfiguration.pfostenAktiv,
                ...(e.pfostenAktiv||{})
            }
        };
        this.aktuelleKonfiguration=t,
        this.updateSliderValues();
        Object.entries(this.selectPropertyMap||{}).forEach(([e,n])=>{
            const i=this.elemente[e],
            r=t?.[n];
            void 0!==r&&i&&(i.value=r, this.updateOptionCardState(e, r))
        }),
        this.elemente.centerPostToggle&&(this.elemente.centerPostToggle.checked=!!t.zentralerMittelpfosten),
        this.elemente.intermediatePostsToggle&&(this.elemente.intermediatePostsToggle.checked=!!(t.zwischenpfostenBreite||t.zwischenpfostenTiefe)),
        this.elemente.carportToggle&&(this.elemente.carportToggle.checked=!!t.carportModus),
        this.updateDrainageVerfuegbarkeit(),
        this.updateHoehenInfo(),
        this.updatePfostenKuerzungMaxWerte(),
        this.onKonfigurationGeaendert(),
        this.updateStatus("Geteilte Konfiguration angewendet", "success")
    }
    aktualisiereProfilauswahl(e="green"){
        const t=document.getElementById("profil-auswahl-container");
        if(!t)return;
        const n=this.aktuelleKonfiguration.pfostenProfil||"160x80x4",
        i=this.renderEngine?.gibPergola?.()?.laengstraeger?.profileKonfig?.mitteltraegerOverride||"100x80x4",
        istEpdmFlachdach=this.aktuelleKonfiguration.dachTyp==="epdm"&&("flachdach"===this.aktuelleKonfiguration.dachForm||Math.abs(this.aktuelleKonfiguration.neigung)<=1e-6),
        o=[{
            id:"120x80x4",
            label:"120×80×4",
            mittel:"80x60x4",
            mittelLabel:"80×60mm"
        },
        {
            id:"160x80x4",
            label:"160×80×4",
            mittel:["100x80x4",
            "120x80x4_mittel"],
            mittelLabels:["100×80mm",
            "120×80mm"]
        },
        {
            id:"200x100x4",
            label:"200×100×4",
            mittel:"160x80x4_mittel",
            mittelLabel:"160×80mm"
        }
        ].map(e=>{
            const istDeaktiviert=istEpdmFlachdach&&"120x80x4"===e.id,
            t=e.id===n?"background: #404040; color: #ffffff; border: 2px solid #7cb899;":"background: #353535; color: #ffffff; border: 1px solid #555555;",
            disabledStyle=istDeaktiviert?"opacity: 0.5; cursor: not-allowed; filter: grayscale(0.2);":"",
            disabledAttr=istDeaktiviert?'disabled aria-disabled="true" title="Bei Flachdach + EPDM nicht verfügbar"':"";
            return`\n                <button \n                    type="button" \n                    class="profil-btn-main" \n                    data-profil="${e.id}"\n                    style="padding: 0.75rem 1.5rem; margin: 0.25rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.95em; ${t} ${disabledStyle}" ${disabledAttr}\n                >\n                    ${e.label}\n                </button>\n            `
        }).join("");
        let r="";
        if("160x80x4"===n){
            const e="100x80x4"===i,
            t="120x80x4_mittel"===i;
            r=`\n                <div style="margin-top: 0.75rem; color: #ffffff; font-size: 0.9em;"><strong>Mittelträger:</strong></div>\n                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">\n                    <button \n                        type="button" \n                        class="mitteltraeger-btn-main" \n                        data-mittel="100x80x4"\n                        style="flex: 1; padding: 0.6rem; border-radius: 8px; cursor: pointer; font-weight: 600; \n                               background: ${e?"#404040":"#353535"}; \n                               color: #ffffff; \n                               border: ${e?"2px solid #7cb899":"1px solid #555555"};"\n                    >\n                        100×80mm\n                    </button>\n                    <button \n                        type="button" \n                        class="mitteltraeger-btn-main" \n                        data-mittel="120x80x4_mittel"\n                        style="flex: 1; padding: 0.6rem; border-radius: 8px; cursor: pointer; font-weight: 600; \n                               background: ${t?"#404040":"#353535"}; \n                               color: #ffffff; \n                               border: ${t?"2px solid #7cb899":"1px solid #555555"};"\n                    >\n                        120×80mm\n                    </button>\n                </div>\n            `
        }
        else{
            let e="";
            "120x80x4"===n?e="80×60mm":"200x100x4"===n&&(e="160×80mm"),
            e&&(r=`\n                    <div style="margin-top: 0.5rem; padding: 0.5rem; background: #f0f8ff; border-radius: 4px; color: #1976d2; font-size: 0.85em;">\n                        <strong>Mittelträger:</strong> ${e}\n                    </div>\n                `)
        }
        let s="";
        const ampelFarbe="green"===e?"🟢":"yellow"===e?"🟡":"🔴";
        const ampelText="green"===e?"Statik OK":"yellow"===e?"Grenzwertig":"Statik nicht ausreichend";
        const ampelColor="green"===e?"#2e7d32":"yellow"===e?"#f57c00":"#c62828";
        
        if("green"===e){
            s=`
                <div style="padding: 0.75rem; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="font-size: 2em; line-height: 1;">${ampelFarbe}</div>
                        <div>
                            <div style="font-weight: bold; color: ${ampelColor}; margin-bottom: 0.25rem;">✅ ${ampelText}</div>
                            <small style="color: #666;">Alle Nachweise erfüllt</small>
                        </div>
                    </div>
                </div>
            `;
        } else if("red"===e||"yellow"===e){
            s=`
                <div style="padding: 0.75rem; background: ${
                    "red"===e?"#ffebee":"#fff3e0"
                }; border-left: 4px solid ${
                    "red"===e?"#f44336":"#ff9800"
                }; border-radius: 4px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                        <div style="font-weight: bold; color: ${ampelColor};">⚠️ ${ampelText}</div>
                        <div style="font-size: 2em; line-height: 1;">${ampelFarbe}</div>
                    </div>
                    <div style="font-size: 0.85em; color: #666; margin-top: 0.5rem;">
                        <strong>Alternativen:</strong><br>
                        → Stärkere Profilstärke wählen (Mitte)<br>
                        → Zwischenpfosten hinzufügen (rechts)<br>
                        → Längs-/Querträger reduzieren
                    </div>
                </div>
            `;
        }
        
        // Statik-Warnung in separaten Container rendern
        const statikContainer=document.getElementById("statik-warning-container");
        if(statikContainer){
            statikContainer.innerHTML=s;
        }
        
        t.innerHTML=`
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                ${o}
            </div>
            ${r}
            ${
                istEpdmFlachdach?'<div style="margin-top:0.35rem;font-size:0.85em;color:#c62828;">Profil 120×80 ist bei Flachdach mit EPDM nicht verfügbar.</div>':""
            }
        `,
        t.querySelectorAll(".profil-btn-main").forEach(e=>{
            e.addEventListener("click", ()=>{
                if(e.disabled||e.getAttribute("aria-disabled")==="true")return;
                const t=e.getAttribute("data-profil");
                this.wendeProfilkonfigurationAn({
                    pfostenProfil:t, mitteltraegerProfil:this.ermittleStandardMitteltraeger(t)
                })
            })
        }),
        t.querySelectorAll(".mitteltraeger-btn-main").forEach(e=>{
            e.addEventListener("click", ()=>{
                const t=e.getAttribute("data-mittel");
                this.wendeMitteltraegerAn({
                    mitteltraegerProfil:t
                })
            })
        })
    }
    aktualisiereCarportHinweis(e="green"){
        const statikContainer=document.getElementById("statik-warning-container");
        if(!statikContainer)return;
        let i=document.getElementById("carport-modus-hinweis");
        if("red"===e||"yellow"===e){
            if(!i){
                i=document.createElement("div"),
                i.id="carport-modus-hinweis",
                i.style.cssText="margin-top: 0.75rem; padding: 0.5rem 0.6rem; background: #f3f4f6; border-left: 3px solid #9ca3af; border-radius: 4px; font-size: 0.8rem; color: #6b7280;",
                i.innerHTML="<em>💡 Tipp: Der Carportmodus ermöglicht flexible Erweiterungen</em>",
                statikContainer.appendChild(i)
            }
            i.style.display="block"
        }
        else if(i){
            i.style.display="none"
        }
    }
    ermittleStandardMitteltraeger(e){
        return{
            "120x80x4":"80x60x4",
            "160x80x4":"100x80x4",
            "200x100x4":"160x80x4_mittel"
        }
        [e]||"100x80x4"
    }
    initInfobox(){
        if(this.renderEngine&&this.renderEngine.gibPergola()){
            const e=this.renderEngine.gibPergola();
            this.infobox=new Infobox(e.konfiguration, e.pfosten, e.laengstraeger, e.quertraeger, e.koordinatenSystem),
            this.logger.debug("Infobox initialisiert")
        }
    }
    initPriceTag(){
        if(this.renderEngine&&this.renderEngine.gibPergola()){
            this.priceTag=new PriceTag({
                uiController:this
            });
            if(this.infobox){
                const initialUpdate=()=>this.priceTag.update(this.infobox.gibLetzteMaterialien(), this.aktuelleKonfiguration);
                if("function"==typeof queueMicrotask)queueMicrotask(initialUpdate);
                else setTimeout(initialUpdate,0);
            }
        }
    }
    updateStatus(e, t="loading"){
        if(this.elemente.debugContent){
            const t=(new Date).toLocaleTimeString();
            this.elemente.debugContent.innerHTML=`${t}: ${e}`
        }
        console.log(`[${t.toUpperCase()}] ${e}`)
    }
    applyStaticsAction(e={}){
        const t=this.renderEngine?.gibPergola?.();
        if(t)switch(e.type){
            case"add_center_post":this.aktuelleKonfiguration.zentralerMittelpfosten||(this.aktuelleKonfiguration.zentralerMittelpfosten=!0),
            this.onKonfigurationGeaendert(),
            this.updateStatus("Zentraler Mittelpfosten hinzugefügt", "success");
            break;
            case"ensure_mid_trans":this.onKonfigurationGeaendert(),
            this.updateStatus("Mittlerer Querträger sichergestellt", "success");
            break;
            case"add_second_mid_trans":this.updateStatus("Hinweis: Zwei mittlere Querträger werden konstruktiv vorbereitet (abhängig von Glasaufteilung).", "loading"),
            this.onKonfigurationGeaendert();
            break;
            case"upgrade_mid_trans_profile":{
                const n=e.newProfileId;
                t.quertraeger?.profileKonfig?.setzeMitteltraegerOverride?.(n),
                t.koordinatenSystem?.profileKonfig?.setzeMitteltraegerOverride?.(n),
                this.onKonfigurationGeaendert(),
                this.updateStatus(`Mittel-Quergsträger auf ${n} gesetzt`, "success");
                break
            }
            case"upgrade_mid_both_profiles":{
                const n=e.newProfileId;
                t.quertraeger?.profileKonfig?.setzeMitteltraegerOverride?.(n),
                t.laengstraeger?.profileKonfig?.setzeMitteltraegerOverride?.(n),
                t.koordinatenSystem?.profileKonfig?.setzeMitteltraegerOverride?.(n),
                this.onKonfigurationGeaendert(),
                this.updateStatus(`Mittel-Quer- und Längsträger auf ${n} gesetzt`, "success");
                break
            }
            case"apply_mittelpfosten_choice":{
                const e=document.querySelector('input[name="mittelpfosten_wahl"]:checked');
                if(!e)return void this.updateStatus("Keine Option ausgewählt", "error");
                const n=e.value,
                i=e.dataset.profile,
                o="true"===e.dataset.mittelpfosten;
                if(console.log("💡 Mittelpfosten-Wahl:", {
                    wahl:n, profilId:i, mitMittelpfosten:o
                }), this.aktuelleKonfiguration.zentralerMittelpfosten=o, i&&(this.aktuelleKonfiguration.pfostenProfil=i, t.pfosten?.profileKonfig?.setzeAktuellesProfil?.(i), t.laengstraeger?.profileKonfig?.setzeAktuellesProfil?.(i), t.quertraeger?.profileKonfig?.setzeAktuellesProfil?.(i)), o)t.laengstraeger?.profileKonfig?.optimiereProfileFuerGroesse?.(this.aktuelleKonfiguration.breite, this.aktuelleKonfiguration.tiefe, !0),
                t.quertraeger?.profileKonfig?.optimiereProfileFuerGroesse?.(this.aktuelleKonfiguration.breite, this.aktuelleKonfiguration.tiefe, !0);
                else{
                    const e=t.pfosten?.profileKonfig?.gibAktuellesProfil?.(),
                    n=e?.abmessungen?.tiefe||.12,
                    i=e?.abmessungen?.tiefe||.12;
                    1e3*Math.abs(n-i)<40&&(console.warn("⚠️ KONSTRUKTIV PROBLEMATISCH: 0mm Abstand zwischen Rahmen und Mittelträger!"), this.updateStatus("⚠️ Warnung: 0mm Abstand zwischen Rahmen und Mittelträger (konstruktiv problematisch)", "warning")),
                    t.laengstraeger?.profileKonfig?.optimiereProfileFuerGroesse?.(this.aktuelleKonfiguration.breite, this.aktuelleKonfiguration.tiefe, !1),
                    t.quertraeger?.profileKonfig?.optimiereProfileFuerGroesse?.(this.aktuelleKonfiguration.breite, this.aktuelleKonfiguration.tiefe, !1)
                }
                this.onKonfigurationGeaendert();
                const r=o?`✅ Alternative aktiviert: ${i} Profile mit Mittelpfosten`:`✅ Standard aktiviert: ${i} Profile ohne Mittelpfosten`;
                this.updateStatus(r, "success");
                break
            }
            default:console.warn("Unbekannte Statik-Aktion:", e)
        }
    }
    wendeProfilkonfigurationAn(e){
        const{
            pfostenProfil:t,
            mitteltraegerProfil:n
        }
        =e,
        i=this.renderEngine?.gibPergola?.();
        i&&(console.log(`🔧 Wende Profilkonfiguration an: Rahmen=${t}, Mittel=${n}`), this.aktuelleKonfiguration.pfostenProfil=t, i.pfosten?.profileKonfig?.setzeAktuellesProfil?.(t), i.laengstraeger?.profileKonfig?.setzeAktuellesProfil?.(t), i.quertraeger?.profileKonfig?.setzeAktuellesProfil?.(t), i.koordinatenSystem?.setzeProfil?.(t), i.laengstraeger?.profileKonfig?.setzeMitteltraegerOverride?.(n), i.quertraeger?.profileKonfig?.setzeMitteltraegerOverride?.(n), i.koordinatenSystem?.profileKonfig?.setzeMitteltraegerOverride?.(n), this.onKonfigurationGeaendert(), this.updateStatus(`✅ Profil geändert: ${t} mit Mittelträger ${n}`, "success"))
    }
    wendeMitteltraegerAn(e){
        const{
            mitteltraegerProfil:t
        }
        =e,
        n=this.renderEngine?.gibPergola?.();
        n&&(console.log(`🔧 Wende Mittelträger an: ${t}`), n.laengstraeger?.profileKonfig?.setzeMitteltraegerOverride?.(t), n.quertraeger?.profileKonfig?.setzeMitteltraegerOverride?.(t), n.koordinatenSystem?.profileKonfig?.setzeMitteltraegerOverride?.(t), this.onKonfigurationGeaendert(), this.updateStatus(`✅ Mittelträger geändert: ${t}`, "success"))
    }
    updateStats(e){
        if(!this.elemente.statsContent||!e)return;
        let t="";
        e.grundmasse&&(t+=`\n                <div class="stats-row">\n                    <span class="stats-label">Grundfläche:</span>\n                    <span class="stats-value">${(e.grundmasse.breite*e.grundmasse.tiefe).toFixed(1)} m²</span>\n                </div>\n                <div class="stats-row">\n                    <span class="stats-label">Abmessungen:</span>\n                    <span class="stats-value">${e.grundmasse.breite}×${e.grundmasse.tiefe}m</span>\n                </div>\n                <div class="stats-row">\n                    <span class="stats-label">Höhe:</span>\n                    <span class="stats-value">${e.grundmasse.hoehe}m</span>\n                </div>\n                <div class="stats-row">\n                    <span class="stats-label">Neigung:</span>\n                    <span class="stats-value">${e.grundmasse.neigung}°</span>\n                </div>\n            `),
        e.komponenten&&(t+=`\n                <div class="stats-row">\n                    <span class="stats-label">Pfosten:</span>\n                    <span class="stats-value">${e.komponenten.anzahlPfosten}</span>\n                </div>\n                <div class="stats-row">\n                    <span class="stats-label">Längsträger:</span>\n                    <span class="stats-value">${e.komponenten.anzahlLaengstraeger}</span>\n                </div>\n                <div class="stats-row">\n                    <span class="stats-label">Querträger:</span>\n                    <span class="stats-value">${e.komponenten.anzahlQuertraeger}</span>\n                </div>\n            `),
        e.status&&(t+=`\n                <div class="stats-row">\n                    <span class="stats-label">Status:</span>\n                    <span class="stats-value">${e.status.istErstellt?"✅":"⏳"}</span>\n                </div>\n            `),
        this.elemente.statsContent&&(this.elemente.statsContent.innerHTML=t)
    }
    updateCoordinates(e){
        if(!this.elemente.coordinatesContent||!e)return;
        let t='<div style="margin-bottom: 0.8rem;"><strong>Referenzpunkte:</strong></div>';
        e.pfostenOberkanten&&Object.entries(e.pfostenOberkanten).forEach(([e, n])=>{
            e.startsWith("wand")||(t+=`<div class="coord-item">${e}: (${n.x}, ${n.y?.toFixed(2)||n.y}, ${n.z})</div>`)
        }),
        e.quertraegerPositionen&&e.quertraegerPositionen.length>0&&(t+='<div style="margin: 0.8rem 0 0.5rem 0;"><strong>Querträger-Positionen:</strong></div>', e.quertraegerPositionen.forEach(e=>{
            e&&"object"==typeof e&&(t+=`<div class="coord-item">${e.name||"QT"}: Z=${(e.z||0).toFixed(1)}m, H=${(e.hoehe||0).toFixed(2)}m</div>`)
        })),
        this.elemente.coordinatesContent.innerHTML=t
    }
    updateSliderValues(){
        this.sliderController?.aktualisiereWerte();
        this.elemente.drainage&&(this.elemente.drainage.value=this.aktuelleKonfiguration.regenwasserAbfluss);
        this.aktuelleKonfiguration.pfostenVersaetze&&(this.aktualisierePfostenVersatz("vorne", this.aktuelleKonfiguration.pfostenVersaetze.vorne??0, !1), this.aktualisierePfostenVersatz("hinten", this.aktuelleKonfiguration.pfostenVersaetze.hinten??0, !1));
        this.aktuelleKonfiguration.pfostenKuerzung&&(this.aktualisierePfostenKuerzung("vorne", this.aktuelleKonfiguration.pfostenKuerzung.vorne??0, !1), this.aktualisierePfostenKuerzung("hinten", this.aktuelleKonfiguration.pfostenKuerzung.hinten??0, !1), this.aktualisierePfostenKuerzung("mitte", this.aktuelleKonfiguration.pfostenKuerzung.mitte??0, !1));
    }
    gibKonfiguration(){
        return{
            ...this.aktuelleKonfiguration
        }
    }
    setzeUIAktiv(e){
        ["width",
        "depth",
        "height",
        "slope",
        "type",
        "material",
        "color",
        "drainage"].forEach(t=>{
            const n=this.elemente[t];
            n&&(n.disabled=!e)
        }),
        this.elemente.koordinatenToggle&&(this.elemente.koordinatenToggle.disabled=!e);
        [this.elemente.postOffsetFrontRange,
        this.elemente.postOffsetFrontInput,
        this.elemente.postOffsetRearRange,
        this.elemente.postOffsetRearInput,
        this.elemente.postShortenFrontRange,
        this.elemente.postShortenFrontInput,
        this.elemente.postShortenRearRange,
        this.elemente.postShortenRearInput,
        this.elemente.postShortenMiddleRange,
        this.elemente.postShortenMiddleInput,
        this.elemente.noPostsFrontButton,
        this.elemente.noPostsRearButton].forEach(t=>{
            t&&(t.disabled=!e)
        })
    }
    debug(){
        console.group("🎨 UI-CONTROLLER DEBUG"),
        console.log("Konfiguration:", this.aktuelleKonfiguration),
        console.log("DOM-Elemente:", Object.keys(this.elemente).filter(e=>this.elemente[e])),
        console.log("Fehlende Elemente:", Object.keys(this.elemente).filter(e=>!this.elemente[e])),
        console.groupEnd()
    }
    initIndividualPostController(){
        try{
            this.individualPostController=new IndividualPostController(this, this.renderEngine),
            this.individualPostController.initialize(),
            console.log("🔧 Individual Post Controller erfolgreich initialisiert")
        }
        catch(e){
            console.warn("⚠️ Individual Post Controller konnte nicht initialisiert werden:", e)
        }
    }
    initBemassungToggle(){
        const e=document.getElementById("bemassung-toggle");
        e?(e.addEventListener("click", ()=>{
            this.renderEngine.toggleBemassung()?(e.classList.add("active"), console.log("📏 Bemaßung eingeblendet")):(e.classList.remove("active"), console.log("📏 Bemaßung ausgeblendet"))
        }), console.log("📏 Bemaßungs-Toggle erfolgreich initialisiert")):console.warn("⚠️ Bemaßungs-Toggle Button nicht gefunden")
    }
    initShareButton(){
        const shareBtn = document.getElementById("share-config-btn");
        const modal = document.getElementById("share-modal");
        const closeBtn = modal?.querySelector(".share-modal-close");
        const overlay = modal?.querySelector(".share-modal-overlay");
        const copyBtn = document.getElementById("copy-share-link-btn");
        const linkInput = document.getElementById("share-link-input");
        const successMsg = document.getElementById("copy-success-message");

        if (!shareBtn || !modal) {
            console.warn("⚠️ Share-Button oder Modal nicht gefunden");
            return;
        }

        // Share-Button Klick
        shareBtn.addEventListener("click", () => {
            // Aktuelle Profilkonfiguration aus RenderEngine holen
            const pergola = this.renderEngine?.gibPergola?.();
            if (pergola) {
                const mitteltraegerOverride = pergola.laengstraeger?.profileKonfig?.mitteltraegerOverride || 
                                              pergola.quertraeger?.profileKonfig?.mitteltraegerOverride || 
                                              null;
                // Konfiguration mit Profilinfos aktualisieren
                if (mitteltraegerOverride) {
                    this.aktuelleKonfiguration.mitteltraegerOverride = mitteltraegerOverride;
                }
            }
            
            const shareUrl = this.shareLink.createShareUrl(this.aktuelleKonfiguration);
            if (shareUrl) {
                linkInput.value = shareUrl;
                modal.style.display = "flex";
                linkInput.select();
                console.log("🔗 Share-Modal geöffnet mit Profil:", this.aktuelleKonfiguration.pfostenProfil, "Mittel:", this.aktuelleKonfiguration.mitteltraegerOverride);
            } else {
                console.error("❌ Fehler beim Erstellen des Share-Links");
            }
        });

        // Modal schließen
        const closeModal = () => {
            modal.style.display = "none";
            successMsg.style.display = "none";
        };

        closeBtn?.addEventListener("click", closeModal);
        overlay?.addEventListener("click", closeModal);

        // ESC-Taste zum Schließen
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.style.display === "flex") {
                closeModal();
            }
        });

        // Link kopieren
        copyBtn?.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(linkInput.value);
                successMsg.style.display = "block";
                console.log("✅ Link in Zwischenablage kopiert");
                
                setTimeout(() => {
                    successMsg.style.display = "none";
                }, 3000);
            } catch (error) {
                console.error("❌ Fehler beim Kopieren:", error);
                // Fallback für ältere Browser
                linkInput.select();
                document.execCommand("copy");
                successMsg.style.display = "block";
                setTimeout(() => {
                    successMsg.style.display = "none";
                }, 3000);
            }
        });

        console.log("🔗 Share-Button erfolgreich initialisiert");
    }
    loadConfigFromUrl(){
        const config = this.shareLink.loadFromUrl();
        if (config) {
            console.log("🔗 Lade Konfiguration aus URL...", config);
            
            // Konfiguration übernehmen
            this.aktuelleKonfiguration = { ...this.aktuelleKonfiguration, ...config };
            
            // Profilkonfiguration anwenden (wichtig für Statik!)
            const pergola = this.renderEngine?.gibPergola?.();
            if (pergola && config.pfostenProfil) {
                pergola.pfosten?.profileKonfig?.setzeAktuellesProfil?.(config.pfostenProfil);
                pergola.laengstraeger?.profileKonfig?.setzeAktuellesProfil?.(config.pfostenProfil);
                pergola.quertraeger?.profileKonfig?.setzeAktuellesProfil?.(config.pfostenProfil);
                pergola.koordinatenSystem?.setzeProfil?.(config.pfostenProfil);
                
                // Mittelträger-Override setzen
                if (config.mitteltraegerOverride) {
                    pergola.laengstraeger?.profileKonfig?.setzeMitteltraegerOverride?.(config.mitteltraegerOverride);
                    pergola.quertraeger?.profileKonfig?.setzeMitteltraegerOverride?.(config.mitteltraegerOverride);
                    pergola.koordinatenSystem?.profileKonfig?.setzeMitteltraegerOverride?.(config.mitteltraegerOverride);
                }
            }
            
            // UI aktualisieren
            this.updateSliderValues();
            this.updateAllSelectsFromConfig();
            
            // Pfosten-Versatz aktualisieren
            if (config.pfostenVersaetze) {
                this.aktualisierePfostenVersatz("vorne", config.pfostenVersaetze.vorne || 0, false);
                this.aktualisierePfostenVersatz("hinten", config.pfostenVersaetze.hinten || 0, false);
            }
            
            // Pfosten-Kürzung aktualisieren
            if (config.pfostenKuerzung) {
                this.aktualisierePfostenKuerzung("vorne", config.pfostenKuerzung.vorne || 0, false);
                this.aktualisierePfostenKuerzung("hinten", config.pfostenKuerzung.hinten || 0, false);
                this.aktualisierePfostenKuerzung("mitte", config.pfostenKuerzung.mitte || 0, false);
            }
            
            // Zentraler Mittelpfosten
            this.syncCenterPostToggle();
            
            // Zwischenpfosten
            const btnWidth = document.getElementById("intermediate-posts-width-btn");
            const btnDepth = document.getElementById("intermediate-posts-depth-btn");
            if (btnWidth) btnWidth.classList.toggle("active", !!config.zwischenpfostenBreite);
            if (btnDepth) btnDepth.classList.toggle("active", !!config.zwischenpfostenTiefe);
            
            // Render-Engine und 3D-Szene aktualisieren
            this.onKonfigurationGeaendert();
            
            // Profilauswahl neu berechnen (wichtig für Statik!)
            setTimeout(() => {
                this.aktualisiereProfilauswahl("green");
            }, 100);
            
            // URL bereinigen (Parameter entfernen, damit die URL nicht zu lang bleibt)
            if (window.history && window.history.replaceState) {
                const url = new URL(window.location.href);
                url.searchParams.delete('config');
                window.history.replaceState({}, document.title, url.toString());
            }
            
            console.log("✅ Konfiguration erfolgreich aus URL geladen");
        }
    }
    updateAllSelectsFromConfig(){
        // Material
        const materialSelect = document.getElementById("material");
        if (materialSelect) materialSelect.value = this.aktuelleKonfiguration.material;
        
        // Farbe
        const colorSelect = document.getElementById("color");
        if (colorSelect) colorSelect.value = this.aktuelleKonfiguration.farbe;
        
        // Typ
        const typeCards = document.querySelectorAll('[data-group="type"] .option-card');
        typeCards.forEach(card => {
            card.classList.toggle("active", card.dataset.value === this.aktuelleKonfiguration.typ);
        });
        
        // Dachtyp
        const roofTypeCards = document.querySelectorAll('[data-group="roofType"] .option-card');
        roofTypeCards.forEach(card => {
            card.classList.toggle("active", card.dataset.value === this.aktuelleKonfiguration.dachTyp);
        });
        
        // Weitere Selects nach Bedarf...
    }
}
