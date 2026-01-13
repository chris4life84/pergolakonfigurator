export function berechnePfostenHoehen(e, n, o, r=8, t=6){
    const s=[e,
    n,
    o,
    r,
    t].map(e=>Number(e));
    if(s.some(e=>!Number.isFinite(e)))throw new TypeError("Alle Parameter müssen gültige Zahlen sein.");
    const[h,
    i,
    m,
    c,
    g]=s,
    u=i/100*m,
    a=h+c+g;
    return{
        pfostenHoeheVorne:a,
        pfostenHoeheHinten:a+u,
        neigungCm:u,
        lichteDurchgangshoehe:h
    }
}