import{
    ProfileKonfiguration
}
from"../config/ProfileKonfiguration.js";
export class KoordinatenSystem{
    constructor(e){
        this.konfiguration=e,
        this.referenzpunkte=new Map,
        this.profileKonfig=new ProfileKonfiguration,
        this.berechneReferenzpunkte()
    }
    normalisierePfostenId(e){
        return"string"!=typeof e?"":e.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_").toLowerCase()
    }
    berechneReferenzpunkte(){
        const e=this.konfiguration.gibAktuelleKonfiguration(),
        n=this.konfiguration.berechneAbhaengigeWerte();
        this.referenzpunkte.set("bodenEcken", {
            vorneLinks:{
                x:0, y:0, z:0
            }, vorneRechts:{
                x:e.breite, y:0, z:0
            }, hintenLinks:{
                x:0, y:0, z:e.tiefe
            }, hintenRechts:{
                x:e.breite, y:0, z:e.tiefe
            }
        }),
        this.referenzpunkte.set("pfostenPositionen", this.berechnePfostenPositionen(e, n)),
        this.referenzpunkte.set("laengstraegerReferenz", this.berechneLaengstraegerReferenz(e, n)),
        this.referenzpunkte.set("quertraegerReferenz", this.berechneQuertraegerReferenz(e, n))
    }
    berechnePfostenPositionen(e, n){
        const t=this.profileKonfig.gibAktuellesProfil(),
        r=t?.abmessungen?.breite?t.abmessungen.breite/2:0,
        i=Math.max(0, e.breite/2-r),
        s=e=>{
            const n=Number.parseFloat(e),
            t=Number.isFinite(n)?n:0;
            return Math.max(0, Math.min(i, t))
        },
        o=e.pfostenVersaetze?.individuell||{},
        a=e=>{
            if("number"==typeof e)return{
                achse:"x",
                wert:Number(e)
            };
            if("object"==typeof e&&null!==e){
                const n="string"==typeof e.achse?e.achse:"string"==typeof e.axis?e.axis:"x",
                t=Number(e.wert??e.value??0);
                if(Number.isFinite(t))return{
                    achse:n,
                    wert:t
                }
            }
            return null
        },
        h=s(e.pfostenVersaetze?.vorne),
        l=s(e.pfostenVersaetze?.hinten),
        g=(e, n)=>{
            const t=this.normalisierePfostenId(e),
            r=o[t]??o[e],
            i=a(r);
            return i&&"x"===i.achse?s(i.wert):n
        },
        f=e=>{
            const n=this.normalisierePfostenId(e),
            t=o[n]??o[e],
            r=a(t);
            if(r&&"z"===r.achse){
                const e=Number(r.wert)||0;
                return Math.max(-.5, Math.min(.5, e))
            }
            return 0
        },
        c=(n, t)=>{
            const r=n+t;
            return Math.max(0, Math.min(e.tiefe, r))
        },
        u=g("vorne_links", h),
        b=g("vorne_rechts", h),
        z=g("hinten_links", l),
        k=g("hinten_rechts", l),
        p=f("vorne_links"),
        d=f("vorne_rechts"),
        x=f("hinten_links"),
        m=f("hinten_rechts"),
        P={};
        return"freistehend"===e.typ?(P.vorne_links={
            boden:{
                x:u+r, y:0, z:c(0, p)
            }, oberkante:{
                x:u+r, y:n.vordereHoehe, z:c(0, p)
            }
        }, P.vorne_rechts={
            boden:{
                x:e.breite-b-r, y:0, z:c(0, d)
            }, oberkante:{
                x:e.breite-b-r, y:n.vordereHoehe, z:c(0, d)
            }
        }, P.hinten_links={
            boden:{
                x:z+r, y:0, z:c(e.tiefe, x)
            }, oberkante:{
                x:z+r, y:n.hintereHoehe, z:c(e.tiefe, x)
            }
        }, P.hinten_rechts={
            boden:{
                x:e.breite-k-r, y:0, z:c(e.tiefe, m)
            }, oberkante:{
                x:e.breite-k-r, y:n.hintereHoehe, z:c(e.tiefe, m)
            }
        }, P.vorneLinks=P.vorne_links, P.vorneRechts=P.vorne_rechts, P.hintenLinks=P.hinten_links, P.hintenRechts=P.hinten_rechts):(P.vorne_links={
            boden:{
                x:u+r, y:0, z:c(0, p)
            }, oberkante:{
                x:u+r, y:n.vordereHoehe, z:c(0, p)
            }
        }, P.vorne_rechts={
            boden:{
                x:e.breite-b-r, y:0, z:c(0, d)
            }, oberkante:{
                x:e.breite-b-r, y:n.vordereHoehe, z:c(0, d)
            }
        }, P.vorneLinks=P.vorne_links, P.vorneRechts=P.vorne_rechts, P.wandLinks={
            boden:{
                x:r, y:0, z:e.tiefe
            }, oberkante:{
                x:r, y:n.hintereHoehe, z:e.tiefe
            }
        }, P.wandRechts={
            boden:{
                x:e.breite-r, y:0, z:e.tiefe
            }, oberkante:{
                x:e.breite-r, y:n.hintereHoehe, z:e.tiefe
            }
        }),
        P
    }
    berechneGlaslaengenUndQuertraeger(e){
        const n=.02,
        t=.06,
        r=this.konfiguration.gibAktuelleKonfiguration().neigung*Math.PI/180,
        i=1/Math.cos(r),
        s=e-.12,
        o=s*i;
        let a=1,
        h=o,
        l=1/0;
        const g=Math.max(Math.ceil(o/3), e>=3?2:1);
        if(Math.abs(e-6)<=.05){
            const n=(o-.005*i+.04)/2,
            r=t+s/2;
            return{
                glasLaengen:[n,
                n],
                traegerPositionen:[r],
                abstaende:[r,
                e-r],
                anzahlGlaeser:2,
                anzahlMitteltraeger:1
            }
        }
        for(let e=g;
        e<=20;
        e++){
            const t=(o+2*(e-1)*n)/e;
            if(t<=3){
                let n;
                n=t>=2&&t<=2.8?Math.abs(t-2.4):t<2?5*(2-t):2*(t-2.8),
                n+=.1*(e-g),
                n<l&&(l=n, a=e, h=t)
            }
        }
        const f=[],
        c=[],
        u=[],
        b=h/i;
        let z=t;
        for(let e=0;
        e<a;
        e++){
            if(f.push(h), e<a-1){
                const t=z+b-n;
                if(c.push(t), 0===e)u.push(t);
                else{
                    const e=t-c[c.length-2];
                    u.push(e)
                }
            }
            z+=b-.04
        }
        if(c.length>0){
            const n=e-c[c.length-1];
            u.push(n)
        }
        return{
            glasLaengen:f,
            traegerPositionen:c,
            abstaende:u,
            anzahlGlaeser:a,
            anzahlMitteltraeger:c.length
        }
    }
    berechneGlasbreitenUndTraeger(e){
        const n=e-.12;
        let t=1,
        r=1/0,
        i=n;
        for(let e=1;
        e<=20;
        e++){
            const s=(n-.02*(e-1))/e;
            if(s>=.7&&s<=.85){
                const n=(.7+.85)/2,
                o=Math.abs(s-n);
                o<r&&(r=o, t=e, i=s)
            }
        }
        const s=[],
        o=[],
        a=[];
        let h=.06;
        for(let e=0;
        e<t;
        e++){
            const n=i;
            if(s.push(n), e<t-1){
                const t=h+n+.02;
                if(o.push(t), 0===e)a.push(t);
                else{
                    const e=t-o[o.length-2];
                    a.push(e)
                }
            }
            h+=n+.02
        }
        if(o.length>0){
            const n=e-o[o.length-1];
            a.push(n)
        }
        return{
            glasBreiten:s,
            traegerPositionen:o,
            lichtabstaende:a,
            anzahlGlaeser:t,
            anzahlMitteltraeger:o.length
        }
    }
    berechneGlasbreitenUndTraegerNeu(e){
        console.log("🚀🚀🚀 berechneGlasbreitenUndTraegerNeu AUFGERUFEN mit innereLichtBreite:", e);
        const n=e>=1.92&&e<=2;
        const istSchmalePergola=(this.konfiguration?.gibAktuelleKonfiguration?.()?.breite??e)<=2.05;
        console.log("🔍 Spezialbereich-Prüfung:", {
            innereLichtBreite:e.toFixed(3), min:1.92, max:2, istSpezialbereich:n, istSchmalePergola
        });
        const t=istSchmalePergola?0.6:.7-.06,
        r=istSchmalePergola?0.95:.85+.06,
        i=this.profileKonfig.gibAktuellesProfil(),
        s=(i?.id||"").startsWith("200x120")?.08:.04,
        aktuelleKonfig=this.konfiguration.gibAktuelleKonfiguration(),
        o=this.profileKonfig.gibMitteltraegerProfil(aktuelleKonfig)||i,
        a=o?.abmessungen?.tiefe||.08;
        let h={
            glasBreiten:[],
            traegerPositionen:[],
            lichtabstaende:[],
            anzahlGlaeser:0,
            anzahlMitteltraeger:0
        };
        if(n){
            const n=2,
            t=(e-1*a)/n,
            r=s+t+.03;
            return h={
                glasBreiten:[r,
                r],
                traegerPositionen:[e/2],
                lichtabstaende:[t,
                t],
                anzahlGlaeser:n,
                anzahlMitteltraeger:1
            },
            console.log("🔧 SPEZIALFALL 2,00-2,05m: 2 Gläser mit je", (1e3*r).toFixed(0), "mm Breite (1 Mittelträger in der Mitte, Toleranz!)"),
            h
        }
        for(let n=2;
        n<=20;
        n++){
            const i=n-1,
            o=e-i*a;
            if(o<=0)continue;
            const l=o/n,
            g=.03,
            f=s+l+g,
            c=g+l+g;
            if(f<t||f>r)continue;
            if(n>2&&(c<t||c>r))continue;
            const u=[],
            b=[],
            z=[];
            for(let e=0;
            e<n;
            e++)0===e||e===n-1?u.push(f):u.push(c),
            b.push(l);
            for(let e=0;
            e<i;
            e++){
                const n=(e+1)*l+e*a+a/2;
                z.push(n)
            }
            h={
                glasBreiten:u,
                traegerPositionen:z,
                lichtabstaende:b,
                anzahlGlaeser:n,
                anzahlMitteltraeger:z.length
            };
            break
        }
        if(istSchmalePergola&&0===h.anzahlGlaeser){
            // Fallback für exakt 2,0m Außenbreite: 2 Scheiben mit reduzierter Mindestbreite zulassen
            const n=2,
            t=(e-a)/n,
            r=s+t+Math.max(.02, .03);
            h={
                glasBreiten:[r, r],
                traegerPositionen:[e/2],
                lichtabstaende:[t, t],
                anzahlGlaeser:n,
                anzahlMitteltraeger:1
            };
            console.log("✅ Fallback für schmale Pergola aktiviert:", h);
        }
        return h
    }
    berechneLaengstraegerReferenz(e, n){
        const t={
            ...e,
            pfostenVersaetze:{
                vorne:0,
                hinten:0
            }
        },
        r=this.berechnePfostenPositionen(t, n),
        i=this.profileKonfig.gibAktuellesProfil(),
        s=i?.abmessungen?.breite?i.abmessungen.breite/2:0,
        o=i?.abmessungen?.tiefe?i.abmessungen.tiefe/2:0,
        a=o,
        h=(e, n, t)=>{
            if(!e)return null;
            const r="links"===n?-s+a:s-a,
            i="start"===t?e.z+o:e.z-o;
            return{
                x:e.x+r,
                y:e.y,
                z:i
            }
        },
        l={
            start:h(r.vorneLinks?.oberkante, "links", "start"),
            ende:"freistehend"===e.typ?h(r.hintenLinks?.oberkante, "links", "ende"):h(r.wandLinks?.oberkante, "links", "ende"),
            neigungswinkel:Math.atan2(n.hoehenDifferenz, e.tiefe)
        },
        g={
            start:h(r.vorneRechts?.oberkante, "rechts", "start"),
            ende:"freistehend"===e.typ?h(r.hintenRechts?.oberkante, "rechts", "ende"):h(r.wandRechts?.oberkante, "rechts", "ende"),
            neigungswinkel:Math.atan2(n.hoehenDifferenz, e.tiefe)
        },
        f=[],
        c=this.profileKonfig.gibAktuellesProfil(),
        aktKonfig=this.konfiguration.gibAktuelleKonfiguration(),
        u=this.profileKonfig.gibMitteltraegerProfil(aktKonfig)||c,
        b=c?.abmessungen?.breite||0,
        z=u?.abmessungen?.breite||0,
        k=Math.max(b-z, 0);
        if(l.start&&g.start){
            const t=this.profileKonfig.gibAktuellesProfil(),
            r=t?.abmessungen?.tiefe||0,
            i=l.start.x+r/2,
            s=g.start.x-r/2,
            o=Math.max(0, s-i);
            let a=this.berechneGlasbreitenUndTraegerNeu(o);
            const h=1.92,
            c=2;
            if(console.log("🚨🚨🚨 CACHE TEST - Checking Spezialfall:", o, "zwischen", h, "und", c), o>=h&&o<=c){
                console.log("🔧🔧🔧 SPEZIALFALL 2,00-2,05m aktiviert! Innere Breite:", o.toFixed(3));
                const konfig=this.konfiguration.gibAktuelleKonfiguration(),
                mittelProfil=this.profileKonfig.gibMitteltraegerProfil(konfig)||this.profileKonfig.gibAktuellesProfil(),
                n=mittelProfil?.abmessungen?.tiefe||.08,
                t=this.profileKonfig.gibAktuellesProfil(),
                r=(o-n)/2,
                i=(t?.id?.startsWith("200x120")?.08:.04)+r+.03;
                a={
                    glasBreiten:[i,
                    i],
                    traegerPositionen:[o/2],
                    lichtabstaende:[r,
                    r],
                    anzahlGlaeser:2,
                    anzahlMitteltraeger:1
                },
                console.log("✅ Spezialfall-Glasberechnung:", a)
            }
            if(e.neigung===0&&Array.isArray(a.glasBreiten)&&a.glasBreiten.length>1){
                const t=.04;
                a.glasBreiten[0]=Math.max(a.glasBreiten[0]-t, .05);
                a.glasBreiten[a.glasBreiten.length-1]=Math.max(a.glasBreiten[a.glasBreiten.length-1]-t, .05)
            }
            this.glasBerechnung=a,
            console.log("✅ Glasberechnung (Breiten) gespeichert:", {
                anzahlGlaeser:a.anzahlGlaeser, glasBreiten:a.glasBreiten, anzahlMitteltraeger:a.anzahlMitteltraeger
            }),
            a.traegerPositionen.forEach((t, r)=>{
                const s=i+t;
                f.push({
                    position:`zwischen_${r+1}`, start:{
                        x:s, y:n.vordereHoehe+k, z:l.start.z
                    }, ende:{
                        x:s, y:n.hintereHoehe+k, z:l.ende.z
                    }, neigungswinkel:Math.atan2(n.hoehenDifferenz, e.tiefe), glasBreite:a.glasBreiten[r], lichtabstand:a.lichtabstaende[r]
                })
            })
        }
        return{
            links:l,
            rechts:g,
            zwischen:f
        }
    }
    berechneQuertraegerReferenz(e, n){
        const t={
            ...e,
            pfostenVersaetze:{
                vorne:0,
                hinten:0
            }
        },
        r=this.berechnePfostenPositionen(t, n),
        i=this.profileKonfig.gibAktuellesProfil(),
        s=i?.abmessungen?.breite?i.abmessungen.breite/2:0,
        o=r.vorneLinks?.oberkante?.x??s,
        a=r.vorneRechts?.oberkante?.x??e.breite-s,
        h=Math.atan2(n.hoehenDifferenz, e.tiefe),
        l=this.berechneGlaslaengenUndQuertraeger(e.tiefe);
        this.glasLaengenBerechnung=l;
        const g=[];
        return g.push({
            position:"vorne", z:0, hoehe:n.vordereHoehe, links:{
                x:o, y:n.vordereHoehe, z:0
            }, rechts:{
                x:a, y:n.vordereHoehe, z:0
            }, neigungswinkel:h, glasLaenge:l.glasLaengen[0]
        }),
        l.traegerPositionen.forEach((t, r)=>{
            const i=this.interpoliereHoehe(0, n.vordereHoehe, e.tiefe, n.hintereHoehe, t);
            g.push({
                position:`mitte_${r+1}`, z:t, hoehe:i, links:{
                    x:o, y:i, z:t
                }, rechts:{
                    x:a, y:i, z:t
                }, neigungswinkel:h, glasLaenge:l.glasLaengen[r+1], abstand:l.abstaende[r]
            })
        }),
        g.push({
            position:"hinten", z:e.tiefe, hoehe:n.hintereHoehe, links:{
                x:o, y:n.hintereHoehe, z:e.tiefe
            }, rechts:{
                x:a, y:n.hintereHoehe, z:e.tiefe
            }, neigungswinkel:h, glasLaenge:l.glasLaengen[l.glasLaengen.length-1]
        }),
        g
    }
    interpoliereHoehe(e, n, t, r, i){
        return n+(r-n)*((i-e)/(t-e))
    }
    gibReferenzpunkt(e, n=null){
        const t=this.referenzpunkte.get(e);
        return t?n?t[n]||null:t:null
    }
    aktualisiereReferenzpunkte(){
        this.berechneReferenzpunkte()
    }
    setzeProfil(e){
        return!!this.profileKonfig.setzeAktuellesProfil(e)&&(this.aktualisiereReferenzpunkte(), !0)
    }
    debugReferenzpunkte(){
        console.group("📐 PERGOLA REFERENZPUNKTE");
        for(const[e, n]of this.referenzpunkte.entries())console.group(`${e}:`),
        console.log(n),
        console.groupEnd();
        console.groupEnd()
    }
}
