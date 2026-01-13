export class IndividualPostController{
    constructor(e, t){
        this.uiController=e,
        this.renderEngine=t,
        this.postDefinitions={
            corner:[{
                id:"vorne_links",
                label:"Vorne Links",
            icon:"📌",
            hasOffset:!0,
            offsetAxis:"x",
            offsetRange:{
                min:0,
                max:1.5
            }
        },
        {
            id:"vorne_rechts",
            label:"Vorne Rechts",
            icon:"📌",
            hasOffset:!0,
            offsetAxis:"x",
            offsetRange:{
                min:0,
                max:1.5
            }
        },
        {
            id:"hinten_links",
            label:"Hinten Links",
            icon:"📌",
            hasOffset:!0,
            offsetAxis:"x",
            offsetRange:{
                min:0,
                max:1.5
            }
        },
        {
            id:"hinten_rechts",
            label:"Hinten Rechts",
            icon:"📌",
            hasOffset:!0,
            offsetAxis:"x",
            offsetRange:{
                min:0,
                max:1.5
            }
        }
        ],
        intermediate:[{
            id:"vorne_mitte",
            label:"Vorne Mitte",
            icon:"🔷",
            condition:"breite",
            threshold:4,
            hasOffset:!0,
            offsetAxis:"x",
            offsetRange:{
                min:-1.5,
                max:1.5
            }
        },
        {
            id:"hinten_mitte",
            label:"Hinten Mitte",
            icon:"🔷",
            condition:"breite",
            threshold:4,
            hasOffset:!0,
            offsetAxis:"x",
            offsetRange:{
                min:-1.5,
                max:1.5
            }
        },
            {
                id:"mitte_links",
                label:"Mitte Links",
                icon:"🔷",
                condition:"tiefe",
                threshold:4,
                hasOffset:!0,
                offsetAxis:"z",
                offsetRange:{
                    min:-1.5,
                    max:1.5
                }
            },
            {
                id:"mitte_rechts",
                label:"Mitte Rechts",
                icon:"🔷",
                condition:"tiefe",
                threshold:4,
                hasOffset:!0,
                offsetAxis:"z",
                offsetRange:{
                    min:-1.5,
                    max:1.5
                }
            }
            ],
            center:[{
                id:"mitte_zentral",
                label:"Mittelpfosten Zentral",
                icon:"🎯",
                condition:"centerPost",
                hasOffset:!0,
                offsetAxis:"x",
                offsetRange:{
                    min:-1.5,
                    max:1.5
                }
            }
            ]
        },
        this.individualMode=!1,
        this.postValues={},
        this.accordionState={},
        this.pendingRenderTimeout=null,
        this.lastAppliedConfig=null,
        this.isInteracting=!1,
        console.log("🔧 Individueller Pfosten-Controller initialisiert")
    }
    initialize(){
        this.initializePostValues(),
        this.setupToggle(),
        this.updateVisiblePosts()
    }
    initializePostValues(){
        [...this.postDefinitions.corner,
        ...this.postDefinitions.intermediate,
        ...this.postDefinitions.center].forEach(e=>{
            this.postValues[e.id]={
                offset:0, shorten:0, active:!0, offsetAxis:e.offsetAxis||"x", offsetMin:e.offsetRange?.min??0, offsetMax:e.offsetRange?.max??.5, offsetStep:e.offsetRange?.step??.01
            }
        }),
        this.ladeBestehendePostWerte()
    }
    parseVersatzKonfig(e){
        if(void 0===e)return null;
        if("number"==typeof e)return{
            achse:"x",
            wert:Number(e)
        };
        if("object"==typeof e&&null!==e){
            const t="string"==typeof e.achse?e.achse:"string"==typeof e.axis?e.axis:"x",
            s=Number(e.wert??e.value??0);
            if(Number.isFinite(s))return{
                achse:t,
                wert:s
            }
        }
        return null
    }
    ladeBestehendePostWerte(){
        const e=this.uiController?.aktuelleKonfiguration;
        if(!e)return;
        const t=e.pfostenVersaetze?.individuell||{},
        s=e.pfostenKuerzung?.individuell||{},
        i=e.pfostenAktiv?.individuell||{};
        Object.keys(this.postValues).forEach(e=>{
            const n=this.postValues[e], o=this.parseVersatzKonfig(t[e]);
            if(o){
                const e=n.offsetAxis||"x";
                let t=o.achse||e;
                "x"===e?t="x":"z"===e&&(t="z"), n.offsetAxis=t;
                const s=n.offsetMin??0, i=n.offsetMax??.5;
                n.offset=Math.max(s, Math.min(i, o.wert))
            }
            if(void 0!==s[e]){
                const t=Number(s[e]);
                Number.isFinite(t)&&(n.shorten=Math.max(0, t))
            }
            void 0!==i[e]&&(n.active=Boolean(i[e]))
        })
    }
    setupToggle(){
        const e=document.getElementById("toggle-individual-control"),
        t=document.getElementById("individual-post-controls"),
        s=document.getElementById("group-post-controls");
        e&&t&&s?e.addEventListener("change", e=>{
            if(this.individualMode=e.target.checked, this.individualMode)console.log("🔧 Wechsel zu Individual-Modus"), t.style.display="block", s.style.display="none", this.updateVisiblePosts(), this.setupIndividualControls(), this.applyChanges();
            else{
                console.log("🔧 Wechsel zu Gruppen-Modus"), t.style.display="none", s.style.display="block";
                const e=this.uiController.aktuelleKonfiguration;
                e.pfostenVersaetze&&delete e.pfostenVersaetze.individuell, e.pfostenKuerzung&&delete e.pfostenKuerzung.individuell, e.pfostenAktiv&&delete e.pfostenAktiv.individuell, this.renderEngine.aktualisierePergola(e)
            }
            console.log("✅ Modus geändert: "+(this.individualMode?"Individuell":"Gruppe"))
        }):console.warn("⚠️ Individual Post Control elements nicht gefunden")
    }
    updateVisiblePosts(){
        if(!this.individualMode)return;
        const e=this.uiController.aktuelleKonfiguration,
        t=document.getElementById("intermediate-posts-section"),
        n=!!e.zwischenpfostenBreite||!!e.zwischenpfostenTiefe,
        s=n||Number(e.breite)>4||Number(e.tiefe)>4;
        t&&(t.style.display=s?"block":"none");
        const i=document.getElementById("center-post-section");
        i&&(i.style.display=e.zentralerMittelpfosten?"block":"none"),
        this.generateCornerPosts(e),
        this.generateIntermediatePosts(e)
    }
    generateCornerPosts(e){
        const t=document.getElementById("corner-posts-container");
        if(!t)return;
        if(this.isInteracting){
            console.log("⏸️ Überspringe Corner-Post Regenerierung - Benutzer interagiert mit Slider");
            return;
        }
        t.innerHTML="";
        this.postDefinitions.corner.forEach(s=>{
            if(!this.postValues[s.id]){
                this.postValues[s.id]={
                    offset:0, shorten:0, active:!0, offsetAxis:s.offsetAxis||"x", offsetMin:s.offsetRange?.min??0, offsetMax:s.offsetRange?.max??.5, offsetStep:s.offsetRange?.step??.01
                };
            }
            const accordionItem=this.createPostAccordionItem(s);
            t.appendChild(accordionItem);
            this.setupPostElementListeners(s.id);
        });
    }
    generateIntermediatePosts(e){
        const t=document.getElementById("intermediate-posts-container");
        t&&(this.isInteracting?console.log("⏸️ Überspringe Regenerierung - Benutzer interagiert mit Slider"):(t.innerHTML="", this.postDefinitions.intermediate.forEach(s=>{
            if(this.shouldShowPost(s, e)){
                this.postValues[s.id]?(this.postValues[s.id].offsetAxis=s.offsetAxis||this.postValues[s.id].offsetAxis||"x", this.postValues[s.id].offsetMin=s.offsetRange?.min??this.postValues[s.id].offsetMin??0, this.postValues[s.id].offsetMax=s.offsetRange?.max??this.postValues[s.id].offsetMax??.5, this.postValues[s.id].offsetStep=s.offsetRange?.step??this.postValues[s.id].offsetStep??.01):this.postValues[s.id]={
                    offset:0, shorten:0, active:!0, offsetAxis:s.offsetAxis||"x", offsetMin:s.offsetRange?.min??0, offsetMax:s.offsetRange?.max??.5, offsetStep:s.offsetRange?.step??.01
                };
                const e=this.createPostAccordionItem(s);
                t.appendChild(e), this.setupPostElementListeners(s.id)
            }
        })))
    }
    shouldShowPost(e, t){
        if(!e.condition)return!0;
        const s=Number(t.breite)||0,
        i=Number(t.tiefe)||0,
        n=!!t.zwischenpfostenBreite,
        o=!!t.zwischenpfostenTiefe;
        switch(e.condition){
        case"breite":
            return n||s>(e.threshold||0);
        case"tiefe":
            return o||i>(e.threshold||0);
        case"centerPost":
            return!0===t.zentralerMittelpfosten;
        default:
            return!0
        }
    }
    createPostAccordionItem(e){
        const t=document.createElement("div");
        t.className="post-accordion-item",
        t.dataset.post=e.id;
        const s=this.postValues[e.id]||{},
        i=Number.isFinite(s.offsetMin)?s.offsetMin:e.offsetRange?.min??0,
        n=Number.isFinite(s.offsetMax)?s.offsetMax:e.offsetRange?.max??.5,
        o=Number.isFinite(s.offsetStep)?s.offsetStep:e.offsetRange?.step??.01,
        a=s.offsetAxis||e.offsetAxis||"x",
        l="z"===a?" (Tiefe)":" (Breite)",
        r=this.getMaxShorten();
        if(e.hasOffset){
            const t=Number(s.offset)||0,
            o=Math.max(Math.min(n, t), i);
            this.postValues[e.id].offset=o
        }
        const d=Number(s.shorten)||0,
        f=Math.min(d, r);
        d!==f&&(this.postValues[e.id].shorten=f);
        const u=e.hasOffset?`<small style="color: #666;">Versatzachse: ${a.toUpperCase()}${"z"===a?" (entlang Längsträger)":" (seitlich)"} · Bereich ${i.toFixed(2)}m bis ${n.toFixed(2)}m</small>`:'<small style="color: #666;">Hinweis: Kein individueller Versatz verfügbar</small>';
        return t.innerHTML=`\n            <div class="post-accordion-header" style="cursor: pointer;">\n                <span class="post-icon">${e.icon}</span>\n                <span class="post-label">${e.label}</span>\n                <span class="post-chevron">▼</span>\n            </div>\n            <div class="post-accordion-content">\n                ${e.hasOffset?`\n                <div class="post-control">\n                    <label>Versatz${
            l
        }
         (m)</label>\n                    <div class="range-container range-with-input">\n                        <input type="range" class="post-offset-slider" data-post="${e.id}" min="${i}" max="${n}" step="${o}" value="${this.postValues[e.id]?.offset||0}">\n                        <input type="number" class="post-offset-input" data-post="${e.id}" min="${i}" max="${n}" step="${o}" value="${(this.postValues[e.id]?.offset||0).toFixed(2)}">\n                    </div>\n                </div>\n                `:""}\n                <div class="post-control">\n                    <label>Kürzung (m)</label>\n                    <div class="range-container range-with-input">\n                        <input type="range" class="post-shorten-slider" data-post="${e.id}" min="0" max="${r.toFixed(2)}" step="0.01" value="${f}">\n                        <input type="number" class="post-shorten-input" data-post="${e.id}" min="0" max="${r.toFixed(2)}" step="0.01" value="${f.toFixed(2)}">\n                    </div>\n                    <small style="color: #999; font-size: 0.85em;">Max. Kürzung: ${r.toFixed(2)}m (Höhe - 3cm)</small>\n                </div>\n                ${e.hasOffset?"":'<small style="color: #666;">Hinweis: Mittelpfosten haben keinen Versatz</small>'}\n                <button class="post-deactivate-btn" data-post="${e.id}">\n                    ${this.postValues[e.id]?.active?"🚫 Pfosten entfernen":"✅ Pfosten aktivieren"}\n                </button>\n                ${u}\n            </div>\n        `,
        this.accordionState[e.id]&&t.classList.add("active"),
        t
    }
    setupIndividualControls(){
        console.log("🎛️ Setup individuelle Controls..."),
        this.postDefinitions.corner.forEach(e=>{
            this.setupPostElementListeners(e.id)
        }),
        this.postDefinitions.center.forEach(e=>{
            this.setupPostElementListeners(e.id)
        }),
        console.log("✅ Individuelle Controls setup abgeschlossen")
    }
    getMaxShorten(){
        const e=this.uiController?.aktuelleKonfiguration,
        t=e?.hoehe||2.5;
        return Math.max(0, t-.03)
    }
    setupPostElementListeners(e){
        const t=document.querySelector(`.post-accordion-item[data-post="${e}"]`);
        if(!t){
            console.warn(`⚠️ Accordion-Item für ${e} nicht gefunden`);
            return;
        }
        const s=t.querySelector(".post-accordion-header");
        if(s&&!s.dataset.listenerAttached){
            console.log(`🎯 Registriere Accordion-Header-Listener für ${e}`);
            s.addEventListener("click", ()=>{
                t.classList.toggle("active");
                this.accordionState[e]=t.classList.contains("active");
                console.log(`📂 Accordion ${e} ${t.classList.contains("active")?"geöffnet":"geschlossen"}`);
            });
            s.dataset.listenerAttached="true";
        }
        const i=t.querySelector(".post-offset-slider"),
        n=t.querySelector(".post-offset-input");
        i&&!i.dataset.listenerAttached?(console.log(`🎯 Registriere Offset-Listener für ${e}`), ["pointerdown", "mousedown", "touchstart", "click"].forEach(e=>{
            i.addEventListener(e, e=>e.stopPropagation())
        }), i.addEventListener("mousedown", ()=>{
            this.isInteracting=!0, console.log("🔒 Slider-Interaktion gestartet")
        }), i.addEventListener("touchstart", ()=>{
            this.isInteracting=!0, console.log("🔒 Slider-Interaktion gestartet (Touch)")
        }), i.addEventListener("input", t=>{
            console.log(`🔄 Offset Input Event für ${e}:`, t.target.value);
            const s=parseFloat(t.target.value), i=this.postValues[e]?.offsetMin??0, o=this.postValues[e]?.offsetMax??.5, a=Math.max(i, Math.min(o, s));
            n&&(n.value=a.toFixed(2)), this.postValues[e].offset=a, this.applyChanges()
        }), i.addEventListener("change", t=>{
            const s=parseFloat(t.target.value), i=this.postValues[e]?.offsetMin??0, n=this.postValues[e]?.offsetMax??.5, o=Math.max(i, Math.min(n, s));
            t.target.value=o, this.postValues[e].offset=o, console.log(`📏 Versatz ${e}: ${o}m`), this.applyChanges(), this.isInteracting=!1, console.log("🔓 Slider-Interaktion beendet")
        }), i.addEventListener("mouseup", ()=>{
            setTimeout(()=>{
                this.isInteracting=!1, console.log("🔓 Slider-Interaktion beendet (mouseup)")
            }, 100)
        }), i.addEventListener("touchend", ()=>{
            setTimeout(()=>{
                this.isInteracting=!1, console.log("🔓 Slider-Interaktion beendet (touchend)")
            }, 100)
        }), i.dataset.listenerAttached="true"):console.log(`⚠️ Offset-Slider für ${e} nicht gefunden oder bereits attached:`, {
            exists:!!i, alreadyAttached:i?.dataset?.listenerAttached
        }),
        n&&!n.dataset.listenerAttached&&(["pointerdown", "mousedown", "touchstart", "click"].forEach(e=>{
            n.addEventListener(e, e=>e.stopPropagation())
        }), n.addEventListener("input", t=>{
            const s=parseFloat(t.target.value);
            if(!isNaN(s)){
                const t=this.postValues[e]?.offsetMin??0, n=this.postValues[e]?.offsetMax??.5, o=Math.max(t, Math.min(n, s));
                i&&(i.value=o), this.postValues[e].offset=o
            }
        }), n.addEventListener("blur", t=>{
            const s=parseFloat(t.target.value);
            if(!isNaN(s)){
                const i=this.postValues[e]?.offsetMin??0, n=this.postValues[e]?.offsetMax??.5, o=Math.max(i, Math.min(n, s));
                t.target.value=o.toFixed(2), this.postValues[e].offset=o, console.log(`📏 Versatz ${e}: ${o}m (Input)`), this.applyChanges()
            }
        }), n.addEventListener("keydown", e=>{
            "Enter"===e.key&&e.target.blur()
        }), n.dataset.listenerAttached="true");
        const o=t.querySelector(".post-shorten-slider"),
        a=t.querySelector(".post-shorten-input");
        o&&!o.dataset.listenerAttached?(console.log(`🎯 Registriere Shorten-Listener für ${e}`), ["pointerdown", "mousedown", "touchstart", "click"].forEach(e=>{
            o.addEventListener(e, e=>e.stopPropagation())
        }), o.addEventListener("mousedown", ()=>{
            this.isInteracting=!0, console.log("🔒 Slider-Interaktion gestartet (Shorten)")
        }), o.addEventListener("touchstart", ()=>{
            this.isInteracting=!0, console.log("🔒 Slider-Interaktion gestartet (Shorten Touch)")
        }), o.addEventListener("input", t=>{
            console.log(`🔄 Shorten Input Event für ${e}:`, t.target.value);
            const s=this.getMaxShorten(), i=Math.min(parseFloat(t.target.value), s);
            a&&(a.value=i.toFixed(2)), this.postValues[e].shorten=i, t.target.max=s.toFixed(2), this.applyChanges()
        }), o.addEventListener("change", t=>{
            const s=this.getMaxShorten(), i=Math.min(parseFloat(t.target.value), s);
            t.target.value=i, t.target.max=s.toFixed(2), this.postValues[e].shorten=i, console.log(`✂️ Kürzung ${e}: ${i}m (max: ${s}m)`), this.applyChanges(), this.isInteracting=!1, console.log("🔓 Slider-Interaktion beendet (Shorten)")
        }), o.addEventListener("mouseup", ()=>{
            setTimeout(()=>{
                this.isInteracting=!1, console.log("🔓 Slider-Interaktion beendet (Shorten mouseup)")
            }, 100)
        }), o.addEventListener("touchend", ()=>{
            setTimeout(()=>{
                this.isInteracting=!1, console.log("🔓 Slider-Interaktion beendet (Shorten touchend)")
            }, 100)
        }), o.dataset.listenerAttached="true"):console.log(`⚠️ Shorten-Slider für ${e} nicht gefunden oder bereits attached:`, {
            exists:!!o, alreadyAttached:o?.dataset?.listenerAttached
        }),
        a&&!a.dataset.listenerAttached&&(["pointerdown", "mousedown", "touchstart", "click"].forEach(e=>{
            a.addEventListener(e, e=>e.stopPropagation())
        }), a.addEventListener("input", t=>{
            const s=this.getMaxShorten(), i=parseFloat(t.target.value);
            if(!isNaN(i)){
                const t=Math.min(Math.max(0, i), s);
                o&&(o.value=t, o.max=s.toFixed(2)), this.postValues[e].shorten=t
            }
        }), a.addEventListener("blur", t=>{
            const s=this.getMaxShorten(), i=parseFloat(t.target.value);
            if(!isNaN(i)){
                const n=Math.min(Math.max(0, i), s);
                t.target.value=n.toFixed(2), t.target.max=s.toFixed(2), this.postValues[e].shorten=n, i>s&&console.warn(`⚠️ Kürzung von ${i}m überschreitet Maximum von ${s}m (Höhe - 3cm). Auf ${n}m reduziert.`), console.log(`✂️ Kürzung ${e}: ${n}m (Input, max: ${s}m)`), this.applyChanges()
            }
        }), a.addEventListener("keydown", e=>{
            "Enter"===e.key&&e.target.blur()
        }), a.dataset.listenerAttached="true");
        const l=t.querySelector(".post-deactivate-btn");
        l&&!l.dataset.listenerAttached&&(l.addEventListener("click", ()=>{
            this.postValues[e].active=!this.postValues[e].active, l.textContent=this.postValues[e].active?"🚫 Pfosten entfernen":"✅ Pfosten aktivieren", console.log(`${this.postValues[e].active?"✅":"❌"} Pfosten ${e} ${this.postValues[e].active?"aktiviert":"deaktiviert"}`), this.applyChanges()
        }), l.dataset.listenerAttached="true"),
        this.accordionState[e]=t.classList.contains("active")
    }
    applyChanges(){
        if(!this.individualMode||!this.renderEngine)return void console.log("❌ applyChanges abgebrochen - Modus:", this.individualMode, "RenderEngine:", !!this.renderEngine);
        const e=this.uiController.aktuelleKonfiguration;
        e.pfostenVersaetze||(e.pfostenVersaetze={}),
        e.pfostenVersaetze.individuell||(e.pfostenVersaetze.individuell={}),
        e.pfostenKuerzung||(e.pfostenKuerzung={}),
        e.pfostenKuerzung.individuell||(e.pfostenKuerzung.individuell={}),
        e.pfostenAktiv||(e.pfostenAktiv={}),
        e.pfostenAktiv.individuell||(e.pfostenAktiv.individuell={}),
        Object.keys(this.postValues).forEach(t=>{
            const s=this.postValues[t], i=s.offsetMin??0, n=s.offsetMax??.5, o=s.offsetAxis||"x", a=Math.max(i, Math.min(n, Number(s.offset)||0));
            e.pfostenVersaetze.individuell[t]="x"===o?a:{
                achse:o, wert:a
            }, e.pfostenKuerzung.individuell[t]=s.shorten, e.pfostenAktiv.individuell[t]=s.active
        }),
        "function"==typeof this.uiController.onKonfigurationGeaendert?(this.pendingRenderTimeout&&clearTimeout(this.pendingRenderTimeout), this.pendingRenderTimeout=setTimeout(()=>{
            this.pendingRenderTimeout=null, this.uiController.onKonfigurationGeaendert(), this.lastAppliedConfig=JSON.stringify(e), console.log("✅ Individuelle Pfostenwerte angewendet und UI aktualisiert")
        }, 50)):this.renderEngine?.aktualisierePergola&&(this.renderEngine.aktualisierePergola(e), console.log("✅ Individuelle Pfostenwerte angewendet (Fallback)"))
    }
    getPostValues(){
        return this.postValues
    }
    isIndividualMode(){
        return this.individualMode
    }
}
