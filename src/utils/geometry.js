export const createSmoothBoxGeometry=(e, t, o)=>{
    const r=new THREE.BoxGeometry(e, t, o),
    n=r.attributes.position,
    u=r.attributes.normal;
    for(let e=0;
    e<n.count;
    e+=3){
        const t=(new THREE.Vector3).fromBufferAttribute(n, e),
        o=(new THREE.Vector3).fromBufferAttribute(n, e+1),
        r=(new THREE.Vector3).fromBufferAttribute(n, e+2),
        c=(new THREE.Vector3).subVectors(o, t),
        s=(new THREE.Vector3).subVectors(r, t),
        a=(new THREE.Vector3).crossVectors(c, s).normalize();
        u.setXYZ(e, a.x, a.y, a.z),
        u.setXYZ(e+1, a.x, a.y, a.z),
        u.setXYZ(e+2, a.x, a.y, a.z)
    }
    return u.needsUpdate=!0,
    r
};
export const createWedgeGeometry=(e, t, o, r)=>{
    const n=e/2,
    u=t/2,
    c=new Float32Array([-n, 0, -u, n, 0, -u, n, 0, u, -n, 0, -u, n, 0, u, -n, 0, u, -n, o, -u, n, o, -u, n, r, u, -n, o, -u, n, r, u, -n, r, u, -n, 0, u, n, 0, u, n, r, u, -n, 0, u, n, r, u, -n, r, u, -n, 0, -u, -n, o, -u, n, o, -u, -n, 0, -u, n, o, -u, n, 0, -u, -n, 0, -u, -n, 0, u, -n, r, u, -n, 0, -u, -n, r, u, -n, o, -u, n, 0, -u, n, o, -u, n, r, u, n, 0, -u, n, r, u, n, 0, u]),
    s=new THREE.BufferGeometry;
    return s.setAttribute("position", new THREE.BufferAttribute(c, 3)),
    s.computeVertexNormals(),
    s.computeBoundingBox(),
    s.computeBoundingSphere(),
    s
};
export const createRoundedBoxGeometry=(e, t, o, r=.01, n=4)=>{
    const u=e/2,
    c=o/2,
    s=Math.min(r, u, c),
    a=new THREE.Shape;
    a.moveTo(-u+s, -c),
    a.lineTo(u-s, -c),
    a.quadraticCurveTo(u, -c, u, -c+s),
    a.lineTo(u, c-s),
    a.quadraticCurveTo(u, c, u-s, c),
    a.lineTo(-u+s, c),
    a.quadraticCurveTo(-u, c, -u, c-s),
    a.lineTo(-u, -c+s),
    a.quadraticCurveTo(-u, -c, -u+s, -c);
    const i={
        depth:t,
        bevelEnabled:!1,
        steps:1,
        curveSegments:Math.max(4, 2*n)
    },
    m=new THREE.ExtrudeGeometry(a, i);
    return m.rotateX(Math.PI/2),
    m.translate(0, -t/2, 0),
    m.computeVertexNormals(),
    m.computeBoundingBox(),
    m.computeBoundingSphere(),
    m
};