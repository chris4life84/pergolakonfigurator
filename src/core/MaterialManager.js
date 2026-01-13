const MATERIAL_CACHE=new Map,
FARBPALETTE={
    ral7016:"#1f1f22",
    ral9006:"#a0a0a0",
    ral9016:"#ffffff",
    ral6005:"#2f4538",
    ral3004:"#722f37",
    ral9005:"#0a0a0a",
    ral7035:"#d7d7d7",
    ral8017:"#45241c",
    ral5010:"#0e4c8c",
    "ncs-s0500-n":"#E6E8E8",
    "ncs-s2005-g":"#B9C1BC",
    "ncs-s3020-b":"#3F5E74",
    "ncs-s2050-y80r":"#B74E2E",
    "ncs-s3060-g10y":"#2F7040",
    "ncs-s8500-n":"#1b1b1b",
    "ncs-s7020-b":"#1a3a52",
    "ncs-s3030-y20r":"#d68c3a",
    "ncs-s8505-y20r":"#2d2520",
    "ncs-s4050-g":"#00794d",
    default:"#a0a0a0"
},
MATERIAL_PARAMETER={
    aluminium:{
        roughness:.35,
        metalness:.4,
        envMapIntensity:.75
    },
    holz:{
        roughness:.85,
        metalness:.04,
        envMapIntensity:0
    },
    default:{
        roughness:.4,
        metalness:.3,
        envMapIntensity:.6
    }
};
function cacheKey(e, a, t){
    return`${e?e.toLowerCase():"struktur"}|${a}|${t}`
}
function ermittleFarbe(e){
    if(!e)return FARBPALETTE.default;
    const a=e.toLowerCase();
    return FARBPALETTE[a]||FARBPALETTE.default
}
function ermittleParameter(e){
    if(!e)return MATERIAL_PARAMETER.default;
    const a=e.toLowerCase();
    return MATERIAL_PARAMETER[a]||MATERIAL_PARAMETER.default
}
export class MaterialManager{
    static gibStrukturMaterial({
        teil:e="struktur", config:a={}, overlayFarbe:t=null
    }
    ={}){
        const s=(a.material||"default").toLowerCase(),
        r=cacheKey(e, t?t.toLowerCase():a.farbe?a.farbe.toLowerCase():"default", s);
        if(MATERIAL_CACHE.has(r))return MATERIAL_CACHE.get(r);
        const n=new THREE.Color(t||ermittleFarbe(a.farbe)),
        E=ermittleParameter(s),
        l=new THREE.MeshStandardMaterial({
            color:n, roughness:E.roughness??.5, metalness:E.metalness??.2, flatShading:!0
        });
        void 0!==E.envMapIntensity&&(l.envMapIntensity=E.envMapIntensity);
        return.299*n.r+.587*n.g+.114*n.b<.6&&(l.sheen=new THREE.Color("#1a1a1a"), l.sheenRoughness=.7),
        l.dithering=!1,
        l.needsUpdate=!0,
        l.side=THREE.DoubleSide,
        l.userData.managedMaterial=!0,
        l.userData.materialKey=r,
        l.userData.baseColor=n.getHexString(),
        MATERIAL_CACHE.set(r, l),
        l
    }
    static disposeAll(){
        MATERIAL_CACHE.forEach(e=>{
            e?.dispose&&e.dispose()
        }),
        MATERIAL_CACHE.clear()
    }
}
