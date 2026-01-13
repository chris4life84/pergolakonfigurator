const STANDARD_OPTIONEN={
    color:"#f2f2f2",
    opacity:.9,
    thresholdAngle:20
};
function istEdgeHighlight(e){
    return!0===e?.userData?.isEdgeHighlight
}
export function addEdgeHighlight(e, t={}){
    if(!e)return;
    const i={
        ...STANDARD_OPTIONEN,
        ...t
    },
    r=e.isObject3D?e:null;
    if(!r)return;
    const s=e=>{
        if(!e.geometry)return;
        const t=new THREE.EdgesGeometry(e.geometry, i.thresholdAngle),
        r=new THREE.LineBasicMaterial({
            color:i.color, transparent:i.opacity<1, opacity:i.opacity, depthWrite:!1
        }),
        s=new THREE.LineSegments(t, r);
        s.userData.isEdgeHighlight=!0,
        s.renderOrder=10,
        e.add(s),
        e.userData.edgeHighlights||(e.userData.edgeHighlights=[]),
        e.userData.edgeHighlights.push(s)
    },
    g=r.traverse?r.traverse.bind(r):null;
    g?g(e=>{
        e.isMesh&&s(e)
    }):r.isMesh&&s(r)
}
export function disposeEdgeHighlights(e){
    if(!e)return;
    const t=e=>{
        const t=e.userData?.edgeHighlights;
        Array.isArray(t)&&(t.forEach(e=>{
            e&&(e.parent&&e.parent.remove(e), e.geometry?.dispose?.(), e.material?.dispose?.())
        }), e.userData.edgeHighlights=[])
    };
    e.traverse?e.traverse(e=>{
        e.isMesh&&t(e)
    }):e.isMesh&&t(e)
}
export function isEdgeHighlight(e){
    return istEdgeHighlight(e)
}