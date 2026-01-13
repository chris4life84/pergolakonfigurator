/**
 * SegmentPostController - Individuelle Pfostensteuerung für Carport-Segmente
 * Unterstützt Eck- und Zwischenpfosten (Versatz, Kürzung, Aktiv/Inaktiv)
 */
export class SegmentPostController{
    constructor(){
        this.segmentPostValues={};
        this.postDefinitions=[
            {id:"vorne_links",label:"Vorne Links",icon:"📌",hasOffset:!0,offsetAxis:"x",offsetRange:{min:0,max:1.5,step:.01}},
            {id:"vorne_rechts",label:"Vorne Rechts",icon:"📌",hasOffset:!0,offsetAxis:"x",offsetRange:{min:0,max:1.5,step:.01}},
            {id:"hinten_links",label:"Hinten Links",icon:"📌",hasOffset:!0,offsetAxis:"x",offsetRange:{min:0,max:1.5,step:.01}},
            {id:"hinten_rechts",label:"Hinten Rechts",icon:"📌",hasOffset:!0,offsetAxis:"x",offsetRange:{min:0,max:1.5,step:.01}},
            {id:"vorne_mitte",label:"Vorne Mitte",icon:"🔷",hasOffset:!0,offsetAxis:"x",offsetRange:{min:-1.5,max:1.5,step:.01},condition:"breite",threshold:4},
            {id:"hinten_mitte",label:"Hinten Mitte",icon:"🔷",hasOffset:!0,offsetAxis:"x",offsetRange:{min:-1.5,max:1.5,step:.01},condition:"breite",threshold:4},
            {id:"mitte_links",label:"Mitte Links",icon:"🔷",hasOffset:!0,offsetAxis:"z",offsetRange:{min:-1.5,max:1.5,step:.01},condition:"tiefe",threshold:4},
            {id:"mitte_rechts",label:"Mitte Rechts",icon:"🔷",hasOffset:!0,offsetAxis:"z",offsetRange:{min:-1.5,max:1.5,step:.01},condition:"tiefe",threshold:4}
        ];
        console.log("🔧 Segment Post Controller initialisiert")
    }
    initializeSegmentPosts(e){
        if(!this.segmentPostValues[e]){
            this.segmentPostValues[e]={},
            this.postDefinitions.forEach(t=>{
                this.segmentPostValues[e][t.id]={offset:0, shorten:0, active:!0, offsetAxis:t.offsetAxis||"x"}
            }),
            console.log(`✅ Pfosten für Segment ${e} initialisiert`)
        }
        return this.segmentPostValues[e]
    }
    createSegmentPostUI(e, t=2.7, s={}){
        this.initializeSegmentPosts(e);
        const i={
            breite:Number(s.breite)||0,
            tiefe:Number(s.tiefe)||0,
            zwischenpfostenBreite:!!s.zwischenpfostenBreite,
            zwischenpfostenTiefe:!!s.zwischenpfostenTiefe
        },
        n=Math.max(0, t-.03),
        o=this.postDefinitions.filter(t=>this.shouldShowPost(t, i)).map(t=>this.buildPostSection(t, e, n)).join("");
        return`
            <div class="segment-post-controls" data-segment="${e}" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #e0e0e0;">
                <h5 style="margin: 0 0 0.6rem 0; color: #555; font-size: 0.85rem; font-weight: 600;">
                    🔧 Individuelle Pfostensteuerung
                </h5>
                <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.75rem;">
                    <p style="margin: 0; font-size: 0.8rem; color: #666;">
                        Steuern Sie jeden Pfosten einzeln. Änderungen werden sofort angewendet.
                    </p>
                </div>
                ${o||'<div style="color:#888;font-size:0.9rem;">Keine Pfosten verfügbar.</div>'}
            </div>
        `
    }
    rerenderSegmentPostUI(e, t={}, s){
        const i=document.getElementById(`segment-post-controls-${e}`);
        if(!i)return;
        const n=t.hoehe||t.maxHoehe||2.7;
        i.innerHTML=this.createSegmentPostUI(e, n, t),
        this.setupSegmentPostListeners(e, s)
    }
    setupSegmentPostListeners(e, t){
        const s=document.querySelector(`.segment-post-controls[data-segment="${e}"]`);
        if(!s)return void console.warn(`⚠️ Segment Post Controls für Segment ${e} nicht gefunden`);
        this.initializeSegmentPosts(e);
        const i=Object.keys(this.segmentPostValues[e]||{});
        i.forEach(i=>{
            const n=s.querySelector(`input.post-offset-slider[data-post="${i}"]`),
            o=s.querySelector(`input.post-offset-input[data-post="${i}"]`);
            n&&o&&(n.addEventListener("input", s=>{
                const n=parseFloat(s.target.value);
                o.value=n.toFixed(2),
                this.segmentPostValues[e][i].offset=n,
                t&&t(e)
            }), o.addEventListener("input", s=>{
                const o=parseFloat(s.target.value);
                n&&(n.value=o),
                this.segmentPostValues[e][i].offset=o,
                t&&t(e)
            }));
            const r=s.querySelector(`input.post-shorten-slider[data-post="${i}"]`),
            a=s.querySelector(`input.post-shorten-input[data-post="${i}"]`);
            r&&a&&(r.addEventListener("input", s=>{
                const n=parseFloat(s.target.value);
                a.value=n.toFixed(2),
                this.segmentPostValues[e][i].shorten=n,
                t&&t(e)
            }), a.addEventListener("input", s=>{
                const n=parseFloat(s.target.value);
                r&&(r.value=n),
                this.segmentPostValues[e][i].shorten=n,
                t&&t(e)
            }));
            const l=s.querySelector(`button.toggle-post-btn[data-post="${i}"]`);
            l&&l.addEventListener("click", ()=>{
                const s=this.segmentPostValues[e][i].active;
                this.segmentPostValues[e][i].active=!s,
                this.segmentPostValues[e][i].active?(l.style.background="#28a745", l.textContent="✓ Aktiv"):(l.style.background="#dc3545", l.textContent="✗ Inaktiv"),
                t&&t(e),
                console.log(`🔧 Pfosten ${i} in Segment ${e}: ${this.segmentPostValues[e][i].active?"Aktiv":"Inaktiv"}`)
            });
            const d=s.querySelectorAll(`button.post-stepper-inc[data-target="offset"][data-post="${i}"], button.post-stepper-dec[data-target="offset"][data-post="${i}"]`);
            d.forEach(s=>{
                s.addEventListener("click", s=>{
                    if(s.preventDefault(), !o)return;
                    const l=parseFloat(o.min)||0,
                    d=parseFloat(o.max)||.5,
                    c=parseFloat(o.step)||.01,
                    p=s.target.classList.contains("post-stepper-inc")?1:-1,
                    u=parseFloat(String(o.value).replace(",", "."))||0;
                    let f=u+p*c;
                    f=Math.max(l, Math.min(d, f)),
                    f=parseFloat(f.toFixed(2)),
                    o.value=f.toFixed(2),
                    n&&(n.value=f),
                    this.segmentPostValues[e][i].offset=f,
                    t&&t(e)
                })
            });
            const c=s.querySelectorAll(`button.post-stepper-inc[data-target="shorten"][data-post="${i}"], button.post-stepper-dec[data-target="shorten"][data-post="${i}"]`);
            c.forEach(s=>{
                s.addEventListener("click", s=>{
                    if(s.preventDefault(), !a)return;
                    const l=parseFloat(a.min)||0,
                    d=parseFloat(a.max)||2.67,
                    c=parseFloat(a.step)||.01,
                    p=s.target.classList.contains("post-stepper-inc")?1:-1,
                    u=parseFloat(String(a.value).replace(",", "."))||0;
                    let f=u+p*c;
                    f=Math.max(l, Math.min(d, f)),
                    f=parseFloat(f.toFixed(2)),
                    a.value=f.toFixed(2),
                    r&&(r.value=f),
                    this.segmentPostValues[e][i].shorten=f,
                    t&&t(e)
                })
            }),
            o&&o.addEventListener("keydown", s=>{
                if("Enter"===s.key){
                    s.preventDefault();
                    const t=parseFloat(o.min)||0,
                    r=parseFloat(o.max)||.5;
                    let a=parseFloat(String(o.value).replace(",", "."));
                    a=Math.max(t, Math.min(r, a)),
                    a=parseFloat(a.toFixed(2)),
                    o.value=a.toFixed(2),
                    n&&(n.value=a),
                    this.segmentPostValues[e][i].offset=a
                }
            }),
            a&&a.addEventListener("keydown", s=>{
                if("Enter"===s.key){
                    s.preventDefault();
                    const t=parseFloat(a.min)||0,
                    n=parseFloat(a.max)||2.67;
                    let o=parseFloat(String(a.value).replace(",", "."));
                    o=Math.max(t, Math.min(n, o)),
                    o=parseFloat(o.toFixed(2)),
                    a.value=o.toFixed(2),
                    r&&(r.value=o),
                    this.segmentPostValues[e][i].shorten=o
                }
            })
        }),
        console.log(`✅ Event-Listener für Segment ${e} eingerichtet`)
    }
    getSegmentPostValues(e){
        return this.segmentPostValues[e]||null
    }
    getAllSegmentPostValues(){
        return this.segmentPostValues
    }
    setSegmentPostValues(e, t){
        this.segmentPostValues[e]=t||{};
        Object.entries(this.segmentPostValues[e]).forEach(([t,s])=>{
            if(!s.offsetAxis){
                const i=this.postDefinitions.find(e=>e.id===t);
                s.offsetAxis=i?.offsetAxis||"x"
            }
        }),
        console.log(`🔧 Pfostenwerte für Segment ${e} gesetzt:`, t)
    }
    updateMaxShorten(e, t){
        const s=Math.max(0, t-.03),
        i=document.querySelector(`.segment-post-controls[data-segment="${e}"]`);
        i&&(i.querySelectorAll("input.post-shorten-slider").forEach(e=>{
            e.max=s.toFixed(2)
        }), i.querySelectorAll("input.post-shorten-input").forEach(e=>{
            e.max=s.toFixed(2)
        }), console.log(`✅ Max. Kürzung für Segment ${e} auf ${s.toFixed(2)}m aktualisiert`))
    }
    removeSegment(e){
        this.segmentPostValues[e]&&(delete this.segmentPostValues[e], console.log(`🗑️ Pfostenwerte für Segment ${e} entfernt`))
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
        default:
            return!0
        }
    }
    buildPostSection(e, t, s){
        const i=this.segmentPostValues[t]?.[e.id]||{offset:0, shorten:0, active:!0, offsetAxis:e.offsetAxis||"x"},
        n=Number.isFinite(e.offsetRange?.min)?e.offsetRange.min:0,
        o=Number.isFinite(e.offsetRange?.max)?e.offsetRange.max:.5,
        r=Number.isFinite(e.offsetRange?.step)?e.offsetRange.step:.01,
        a=Math.max(n, Math.min(o, Number(i.offset)||0)),
        l=Math.max(0, Math.min(s, Number(i.shorten)||0)),
        d=!!e.hasOffset,
        c=!!i.active,
        h=i.offsetAxis||e.offsetAxis||"x",
        p="z"===h?" (Tiefe)":" (Breite)",
        u=c?"#28a745":"#dc3545",
        f=c?"✓ Aktiv":"✗ Inaktiv",
        m=d?`
            <div class="dimension-column">
                <div class="dimension-row">
                    <div class="dimension-label">
                        Versatz${p} (m)
                        <small>${n.toFixed(2)}–${o.toFixed(2)} m</small>
                    </div>
                    <div class="dimension-input-group">
                        <input type="range" class="post-offset-slider dimension-hidden-range" data-segment="${t}" data-post="${e.id}"
                               min="${n}" max="${o}" step="${r}" value="${a}">
                        <input type="text" inputmode="decimal" class="post-offset-input" data-segment="${t}" data-post="${e.id}"
                               min="${n}" max="${o}" step="${r}" value="${a.toFixed(2)}" style="field-sizing: content; min-width: 35px; min-height: 35px; text-align: center;">
                        <div class="dimension-stepper">
                            <button type="button" class="dimension-btn post-stepper-dec" data-target="offset" data-segment="${t}" data-post="${e.id}">−</button>
                            <button type="button" class="dimension-btn post-stepper-inc" data-target="offset" data-segment="${t}" data-post="${e.id}">+</button>
                        </div>
                    </div>
                </div>
            </div>`:`
            <div class="dimension-column">
                <div class="dimension-row">
                    <div class="dimension-label">
                        Versatz
                        <small>Kein individueller Versatz verfügbar</small>
                    </div>
                </div>
            </div>`;
        return`
        <div class="post-item" style="margin-bottom: 0.75rem; padding: 0.75rem; background: white; border: 1px solid #e0e0e0; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong style="font-size: 0.85rem; color: #007bff;">${e.icon} ${e.label}</strong>
                <button type="button" class="toggle-post-btn" data-segment="${t}" data-post="${e.id}"
                        style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border: none; border-radius: 3px; cursor: pointer; background: ${u}; color: white; font-weight: 600;">
                    ${f}
                </button>
            </div>
            <div class="dimension-columns">
                ${m}
                <div class="dimension-column" style="margin-left: 5px;">
                    <div class="dimension-row">
                        <div class="dimension-label">
                            Kürzung (m)
                            <small>0,00–${s.toFixed(2)} m</small>
                        </div>
                        <div class="dimension-input-group">
                            <input type="range" class="post-shorten-slider dimension-hidden-range" data-segment="${t}" data-post="${e.id}"
                                   min="0" max="${s.toFixed(2)}" step="0.01" value="${l}">
                            <input type="text" inputmode="decimal" class="post-shorten-input" data-segment="${t}" data-post="${e.id}"
                                   min="0" max="${s.toFixed(2)}" step="0.01" value="${l.toFixed(2)}" style="field-sizing: content; min-width: 35px; min-height: 35px; text-align: center;">
                            <div class="dimension-stepper">
                                <button type="button" class="dimension-btn post-stepper-dec" data-target="shorten" data-segment="${t}" data-post="${e.id}">−</button>
                                <button type="button" class="dimension-btn post-stepper-inc" data-target="shorten" data-segment="${t}" data-post="${e.id}">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`
    }
}
