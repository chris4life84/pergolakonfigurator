export class DimensionHandles{
    constructor(renderEngine, uiController){
        this.renderEngine=renderEngine;
        this.ui=uiController;
        this.handleSets=[];
        this.dragState=null;
        this.cleanupFn=null;
        this.container=null;
        this.placementOverlay=null;
        this.placementLines=[];
        this.placementCandidates=[];
        this.placementActive=!1;
        this.handlesVisible=!0;
        this.init();
    }

    init(){
        const canvasContainer=document.querySelector(".canvas-container");
        const canvas=this.renderEngine?.canvas;
        if(!canvas||!canvasContainer)return;

        this.container=document.createElement("div");
        this.container.className="dimension-handle-overlay";
        canvasContainer.style.position=canvasContainer.style.position||"relative";
        this.container.style.width="100%";
        this.container.style.height="100%";
        canvasContainer.appendChild(this.container);
        this.createPlacementOverlay();

        this.cleanupFn=this.renderEngine?.registriereOverlayUpdater?.(()=>this.update());
        window.addEventListener("resize", ()=>this.update(), {passive:!0});
    }

    dispose(){
        this.cleanupFn&&this.cleanupFn();
        this.container?.remove();
        this.dragState=null;
    }

    createHandleSet(){
        const btn=document.createElement("button");
        btn.type="button";
        btn.className="dimension-handle move-handle";
        btn.setAttribute("data-axis", "move");
        btn.setAttribute("aria-label", "Segment verschieben");
        btn.innerHTML=`<span class="dimension-handle-letter">M</span><span class="dimension-handle-icon move">✋</span>`;
        btn.addEventListener("pointerenter", ()=>this.onHandleHover("move", btn._groupRef||null));
        btn.addEventListener("pointerleave", ()=>this.onHandleLeave());
        btn.addEventListener("pointerdown", e=>this.onPointerDown(e, "move", btn._groupRef||null));
        this.container.appendChild(btn);
        return{
            move:btn,
            group:null
        };
    }

    onPointerDown(event, axis, group){
        if(!this.renderEngine?.camera||!this.renderEngine?.canvas)return;
        const cfg=this.ui?.aktuelleKonfiguration||this.renderEngine?.pergola?.gibKonfiguration?.();
        if(!cfg)return;

        const segmentId=this.getSegmentIdFromGroup(group);
        if(!segmentId)return;

        // Nur Placement-Modus
        this.startPlacementMode(event, group, segmentId, cfg);
    }

    onPointerUp(event, moveHandler, upHandler){
        window.removeEventListener("pointermove", moveHandler);
        window.removeEventListener("pointerup", upHandler);
        window.removeEventListener("pointercancel", upHandler);
        this.renderEngine.controls&&(this.renderEngine.controls.enabled=!0);
        if(this.dragState?.mode==="placement"){
            this.commitPlacement();
            this.dragState=null;
            this.hidePlacementOverlay();
            this.update();
            return;
        }
        this.dragState=null;
        this.hidePlacementOverlay();
        this.update();
    }

    getAxisData(axis, cfg, targetGroup){
        const group=targetGroup||this.renderEngine?.pergola?.gib3DGruppe?.();
        if(!group)return null;

        const roofParts=[];
        group.traverse(obj=>{
            if(!obj?.isMesh)return;
            const name=(obj.name||"").toLowerCase();
            if(name.includes("glas")||name.includes("dach"))roofParts.push(obj);
        });

        const box=new THREE.Box3();
        if(roofParts.length){
            roofParts.forEach(obj=>box.expandByObject(obj));
        }else{
            box.setFromObject(group);
        }
        if(box.isEmpty())return null;
        const {min,max}=box;

        // Nur noch für "move" - Button mittig oben auf der Pergola
        const mid=new THREE.Vector3((min.x+max.x)/2, max.y, (min.z+max.z)/2);
        return{mid};
    }

    projectPoint(vec3){
        if(!vec3||!this.renderEngine?.camera||!this.renderEngine?.canvas)return null;
        const v=vec3.clone().project(this.renderEngine.camera);
        if(!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.z>1.2)return null;
        const canvas=this.renderEngine.canvas;
        const x=(v.x*0.5+0.5)*canvas.clientWidth;
        const y=(-v.y*0.5+0.5)*canvas.clientHeight;
        return{x,y};
    }

    update(){
        if(!this.handlesVisible){
            this.hideHandles();
            return;
        }
        const cfg=this.ui?.aktuelleKonfiguration||this.renderEngine?.pergola?.gibKonfiguration?.();
        if(!cfg)return this.hideHandles();

        const pergolaGroups=(this.renderEngine?.scene?.children||[]).filter(child=>{
            return child?.name&&(child.name.startsWith("PergolaHauptgruppe")||child.name.startsWith("CarportSegment"));
        });

        while(this.handleSets.length<pergolaGroups.length){
            const set=this.createHandleSet();
            this.handleSets.push(set);
        }
        while(this.handleSets.length>pergolaGroups.length){
            const set=this.handleSets.pop();
            set.move?.remove();
        }

        this.handleSets.forEach((set, idx)=>{
            const group=pergolaGroups[idx];
            set.group=group;
            set.move._groupRef=group;
            set.move._segmentId=this.getSegmentIdFromGroup(group);

            const axisData=this.getAxisData("move", cfg, group);
            const segId=set.move._segmentId;
            if(!axisData||!segId){
                set.move.style.display="none";
                return;
            }
            const screen=this.projectPoint(axisData.mid);
            if(!screen){
                set.move.style.display="none";
                return;
            }
            set.move.style.display="flex";
            set.move.style.transform=`translate(${screen.x}px, ${screen.y}px) translate(-50%, -50%)`;
        });
    }

    hideHandles(){
        this.handleSets.forEach(set=>{
            if(set.move)set.move.style.display="none";
        });
        this.hidePlacementOverlay();
        if(this.container)this.container.style.display="none";
    }

    setHandlesVisible(flag){
        this.handlesVisible=!!flag;
        if(this.container)this.container.style.display=this.handlesVisible?"block":"none";
        if(!this.handlesVisible)this.hidePlacementOverlay();
        this.handlesVisible&&this.update();
    }

    getSegmentIdFromGroup(group){
        if(!group?.name)return null;
        const match=group.name.match(/CarportSegment_(\d+)/i);
        return match?match[1]:null;
    }

    getSegmentPosition(segmentId){
        const xInput=document.querySelector(`.segment-x[data-id="${segmentId}"]`);
        const zInput=document.querySelector(`.segment-z[data-id="${segmentId}"]`);
        return{
            x:parseFloat(xInput?.value)||0,
            z:parseFloat(zInput?.value)||0
        };
    }

    applyMove(segmentId, x, z){
        const xInput=document.querySelector(`.segment-x[data-id="${segmentId}"]`);
        const zInput=document.querySelector(`.segment-z[data-id="${segmentId}"]`);
        const xRange=document.querySelector(`.segment-x-range[data-id="${segmentId}"]`);
        const zRange=document.querySelector(`.segment-z-range[data-id="${segmentId}"]`);
        if(xInput){ xInput.value=x.toFixed(3); xInput.dispatchEvent(new Event("input",{bubbles:!0})); }
        if(zInput){ zInput.value=z.toFixed(3); zInput.dispatchEvent(new Event("input",{bubbles:!0})); }
        if(xRange){ xRange.value=x; xRange.dispatchEvent(new Event("input",{bubbles:!0})); }
        if(zRange){ zRange.value=z; zRange.dispatchEvent(new Event("input",{bubbles:!0})); }
    }

    getScreenScale(group){
        const box=new THREE.Box3().setFromObject(group);
        const center=box.getCenter(new THREE.Vector3());
        const x1=center.clone();
        const x2=center.clone().add(new THREE.Vector3(1,0,0));
        const z2=center.clone().add(new THREE.Vector3(0,0,1));
        const s1=this.projectPoint(x1);
        const s2=this.projectPoint(x2);
        const s3=this.projectPoint(z2);
        const scaleX=(s1&&s2)?Math.max(1,Math.hypot(s2.x-s1.x, s2.y-s1.y)):100;
        const scaleZ=(s1&&s3)?Math.max(1,Math.hypot(s3.x-s1.x, s3.y-s1.y)):100;
        return {x:scaleX, z:scaleZ};
    }

    snapToGrid(value, step){
        return Math.round(value/step)*step;
    }

    snapToNeighbors(x, z, segmentId){
        const segments=this.getAllSegmentsFromDOM();
        const current=segments.find(s=>s.id===Number(segmentId));
        if(!current||segments.length<=1)return{x,z};
        const candidatesX=[];
        const candidatesZ=[];
        segments.forEach(s=>{
            if(s.id===current.id)return;
            const clearance=this.collisionClearance;
            candidatesX.push(s.x - s.width/2 - current.width/2 - clearance);
            candidatesX.push(s.x + s.width/2 + current.width/2 + clearance);
            candidatesZ.push(s.z - s.depth/2 - current.depth/2 - clearance);
            candidatesZ.push(s.z + s.depth/2 + current.depth/2 + clearance);
        });
        const snapThreshold=0.3; // nur snappen, wenn wir nah genug dran sind
        const snapVal=(val, list)=>{
            if(!list.length)return val;
            let best=val;
            let bestDist=Infinity;
            list.forEach(c=>{
                const d=Math.abs(c-val);
                if(d<bestDist){
                    bestDist=d;
                    best=c;
                }
            });
            return bestDist<=snapThreshold?best:val;
        };
        return{
            x:snapVal(x, candidatesX),
            z:snapVal(z, candidatesZ)
        };
    }

    resolveCollisions(x, z, current, segments){
        let safeX=x;
        let safeZ=z;
        const clearance=this.collisionClearance;
        segments.forEach(s=>{
            if(s.id===current.id)return;
            const halfW=(current.width/2 + s.width/2) + clearance;
            const halfD=(current.depth/2 + s.depth/2) + clearance;
            const dx=safeX - s.x;
            const dz=safeZ - s.z;
            const overlapX=halfW - Math.abs(dx);
            const overlapZ=halfD - Math.abs(dz);
            if(overlapX>0 && overlapZ>0){
                // schiebe entlang der kleineren Überschneidung weg
                if(overlapX<overlapZ){
                    const dir=Math.sign(dx)||1;
                    safeX=s.x + dir*halfW;
                }else{
                    const dir=Math.sign(dz)||1;
                    safeZ=s.z + dir*halfD;
                }
            }
        });
        return{x:safeX, z:safeZ};
    }

    getAllSegmentsFromDOM(){
        const arr=[];
        document.querySelectorAll('[id^="segment-"]').forEach(div=>{
            const idNum=parseInt(div.id.replace("segment-",""),10);
            if(!Number.isFinite(idNum))return;
            const w=parseFloat(div.querySelector('.segment-width')?.value)||4;
            const d=parseFloat(div.querySelector('.segment-depth')?.value)||4;
            const x=parseFloat(div.querySelector('.segment-x')?.value)||0;
            const z=parseFloat(div.querySelector('.segment-z')?.value)||0;
            arr.push({id:idNum,width:w,depth:d,x,z});
        });
        return arr;
    }

    getLeftBeamCenter(group){
        if(!group)return null;
        const beams=[];
        group.traverse(child=>{
            if(!child?.name||!/l[äa]ngstraeger|longitudinal|beam|querträger|quertraeger/i.test(child.name))return;
            const bbox=new THREE.Box3().setFromObject(child);
            if(bbox.isEmpty())return;
            beams.push({
                x:(bbox.min.x+bbox.max.x)/2,
                y:(bbox.min.y+bbox.max.y)/2,
                z:(bbox.min.z+bbox.max.z)/2,
                minX:bbox.min.x,
                maxX:bbox.max.x,
                minY:bbox.min.y,
                maxY:bbox.max.y
            });
        });
        if(!beams.length)return null;
        beams.sort((a,b)=>a.minX-b.minX);
        return beams[0];
    }

    getLeftBeamAnchor(group, box){
        const beam=this.getLeftBeamCenter(group);
        if(beam){
            const y=beam.minY + 0.01;
            const z=beam.z;
            const x=beam.minX + 0;
            return{x, y, z};
        }
        const x=box.min.x;
        const z=(box.min.z+box.max.z)/2;
        const y=box.min.y + 0.01;
        return{x,y,z};
    }

    getFrontBeamCenter(group){
        if(!group)return null;
        const beams=[];
        group.traverse(child=>{
            if(!child?.name||!/querträger|quertraeger|beam|traverse|front/i.test(child.name))return;
            const bbox=new THREE.Box3().setFromObject(child);
            if(bbox.isEmpty())return;
            beams.push({
                minZ:bbox.min.z,
                maxZ:bbox.max.z,
                minX:bbox.min.x,
                maxX:bbox.max.x,
                minY:bbox.min.y,
                maxY:bbox.max.y
            });
        });
        if(!beams.length)return null;
        beams.sort((a,b)=>a.minZ-b.minZ);
        return beams[0];
    }

    getFrontBeamAnchor(group, box){
        const beam=this.getFrontBeamCenter(group);
        if(beam){
            const y=beam.minY + 0.01;
            const z=beam.minZ+0.02;
            return{xMin:beam.minX+0.02, xMax:beam.maxX-0.02, y, z};
        }
        const y=box.min.y + 0.01;
        const z=box.min.z+0.02;
        return{xMin:box.min.x+0.1, xMax:box.max.x-0.1, y, z};
    }

    createPlacementOverlay(){
        this.placementOverlay=document.createElement("div");
        this.placementOverlay.className="placement-overlay";
        this.placementOverlay.style.display="none";
        this.container?.appendChild(this.placementOverlay);
    }

    showPlacementOverlay(currentGroup){
        if(!this.placementOverlay)return;
        const sceneGroups=(this.renderEngine?.scene?.children||[]).filter(child=>{
            return child?.name&&(child.name.startsWith("PergolaHauptgruppe")||child.name.startsWith("CarportSegment"));
        });
        const targets=sceneGroups.filter(g=>g!==currentGroup);
        if(!targets.length)return;
        this.clearPlacementLines();
        const candidates=this.buildPlacementCandidates(currentGroup, targets);
        this.placementCandidates=candidates;
        candidates.forEach(cand=>{
            const line=this.createPlacementLine(cand);
            this.placementOverlay.appendChild(line);
            this.placementLines.push({line,candidate:cand});
        });
        this.placementOverlay.style.display="block";
    }

    createPlacementLine(cand){
        const line=document.createElement("div");
        line.className=`placement-line dir-${cand.dir}`;
        // Dezente Linie am Rand der Ziel-Pergola
        const startPt=this.projectPoint(new THREE.Vector3(cand.edgeStart.x, cand.edgeStart.y, cand.edgeStart.z));
        const endPt=this.projectPoint(new THREE.Vector3(cand.edgeEnd.x, cand.edgeEnd.y, cand.edgeEnd.z));

        if(startPt && endPt){
            const dx=endPt.x - startPt.x;
            const dy=endPt.y - startPt.y;
            const length=Math.hypot(dx, dy);
            const angle=Math.atan2(dy, dx) * (180/Math.PI);
            const midX=(startPt.x + endPt.x)/2;
            const midY=(startPt.y + endPt.y)/2;

            line.style.width=`${length}px`;
            line.style.height="12px";
            line.style.transform=`translate(${midX}px, ${midY}px) translate(-50%, -50%) rotate(${angle}deg)`;
            line.style.display="block";
        }else{
            line.style.display="none";
        }
        const arrow=document.createElement("div");
        arrow.className="placement-arrow";
        line.appendChild(arrow);
        return line;
    }

    buildPlacementCandidates(currentGroup, otherGroups){
        const segments=this.getAllSegmentsFromDOM();
        const currentSegId=this.getSegmentIdFromGroup(currentGroup);
        const currentSeg=segments.find(s=>s.id===Number(currentSegId));
        const myWidth=currentSeg?.width||4;
        const myDepth=currentSeg?.depth||4;
        const candidates=[];

        otherGroups.forEach(group=>{
            const box=new THREE.Box3().setFromObject(group);
            if(box.isEmpty())return;

            // Ziel-Segment aus DOM holen für exakte Koordinaten
            const targetSegId=this.getSegmentIdFromGroup(group);
            const targetSeg=segments.find(s=>s.id===Number(targetSegId));
            if(!targetSeg)return;

            const targetX=targetSeg.x;
            const targetZ=targetSeg.z;
            const targetWidth=targetSeg.width;
            const targetDepth=targetSeg.depth;

            const y=(box.min.y+box.max.y)/2;
            const bottomY=box.min.y;

            // Links von Ziel: neue Pergola links bündig anlegen
            // X der neuen = Ziel.X - Ziel.Breite (bündig am linken Rand)
            candidates.push({
                dir:"left",
                x:targetX - targetWidth,
                z:targetZ,
                y,
                segmentId:currentSegId,
                targetGroup:group,
                targetSegId,
                edgeStart:{x:box.min.x, y:bottomY, z:box.min.z},
                edgeEnd:{x:box.min.x, y:bottomY, z:box.max.z},
                hit:{x:box.min.x, y:bottomY, z:(box.min.z+box.max.z)/2}
            });
            // Rechts von Ziel: bündig am rechten Rand
            // X der neuen = Ziel.X + Ziel.Breite
            candidates.push({
                dir:"right",
                x:targetX + targetWidth,
                z:targetZ,
                y,
                segmentId:currentSegId,
                targetGroup:group,
                targetSegId,
                edgeStart:{x:box.max.x, y:bottomY, z:box.min.z},
                edgeEnd:{x:box.max.x, y:bottomY, z:box.max.z},
                hit:{x:box.max.x, y:bottomY, z:(box.min.z+box.max.z)/2}
            });
            // Vorne (kleinere Z): bündig an Vorderseite
            // Z der neuen = Ziel.Z - Ziel.Tiefe
            candidates.push({
                dir:"front",
                x:targetX,
                z:targetZ - targetDepth,
                y,
                segmentId:currentSegId,
                targetGroup:group,
                targetSegId,
                edgeStart:{x:box.min.x, y:bottomY, z:box.min.z},
                edgeEnd:{x:box.max.x, y:bottomY, z:box.min.z},
                hit:{x:(box.min.x+box.max.x)/2, y:bottomY, z:box.min.z}
            });
            // Hinten (größere Z): bündig an Rückseite
            // Z der neuen = Ziel.Z + Ziel.Tiefe
            candidates.push({
                dir:"back",
                x:targetX,
                z:targetZ + targetDepth,
                y,
                segmentId:currentSegId,
                targetGroup:group,
                targetSegId,
                edgeStart:{x:box.min.x, y:bottomY, z:box.max.z},
                edgeEnd:{x:box.max.x, y:bottomY, z:box.max.z},
                hit:{x:(box.min.x+box.max.x)/2, y:bottomY, z:box.max.z}
            });
        });
        return candidates;
    }

    hidePlacementOverlay(){
        if(!this.placementOverlay)return;
        this.placementOverlay.style.display="none";
        this.clearPlacementLines();
        this.placementCandidates=[];
        this.placementActive=!1;
    }

    onHandleHover(axis, group){
        const cfg=this.ui?.aktuelleKonfiguration||this.renderEngine?.pergola?.gibKonfiguration?.();
        const isCarportMode=!!cfg?.carportModus;
        if(isCarportMode && axis==="move"){
            this.showPlacementOverlay(group||this.renderEngine?.pergola?.gib3DGruppe?.());
        }
    }

    onHandleLeave(){
        if(this.placementActive)return;
        this.hidePlacementOverlay();
    }

    startPlacementMode(event, group, segmentId, cfg){
        const sceneGroups=(this.renderEngine?.scene?.children||[]).filter(child=>{
            return child?.name&&(child.name.startsWith("PergolaHauptgruppe")||child.name.startsWith("CarportSegment"));
        });
        const targets=sceneGroups.filter(g=>g!==group);
        if(!targets.length)return;
        this.showPlacementOverlay(group);
        this.placementActive=!0;
        this.dragState={
            mode:"placement",
            segmentId,
            candidates:this.placementCandidates,
            pointer:{x:event.clientX, y:event.clientY}
        };
        this.renderEngine.controls&&(this.renderEngine.controls.enabled=!1);
        const moveHandler=e=>this.onPlacementPointerMove(e);
        const upHandler=e=>this.onPointerUp(e, moveHandler, upHandler);
        window.addEventListener("pointermove", moveHandler);
        window.addEventListener("pointerup", upHandler, {once:!0});
        window.addEventListener("pointercancel", upHandler, {once:!0});
    }

    onPlacementPointerMove(event){
        if(!this.dragState||"placement"!==this.dragState.mode)return;
        this.dragState.pointer={x:event.clientX, y:event.clientY};
        this.updatePlacementHighlight();
    }

    commitPlacement(){
        if(!this.dragState||"placement"!==this.dragState.mode)return;
        const {segmentId}=this.dragState;
        if(!segmentId)return;
        if(!this.placementCandidates.length)return;

        const pointer={x:this.dragState.pointer?.x||0, y:this.dragState.pointer?.y||0};
        let best=this.dragState.bestCandidate;

        if(!best){
            let bestDist=Infinity;
            this.placementCandidates.forEach(c=>{
                const hit=c.hit||{x:c.x, y:c.y, z:c.z};
                const screen=this.projectPoint(new THREE.Vector3(hit.x, hit.y, hit.z));
                if(!screen)return;
                const d=Math.hypot(screen.x-pointer.x, screen.y-pointer.y);
                if(d<bestDist){
                    bestDist=d;
                    best=c;
                }
            });
        }

        if(best){
            // Direkte Übernahme der exakten bündigen Koordinaten
            // Kein Grid-Snap, keine Kollisionsauflösung - die Position ist bereits korrekt berechnet
            this.applyMove(segmentId, best.x, best.z);
        }
    }

    clearPlacementLines(){
        if(!this.placementOverlay)return;
        this.placementLines.forEach(l=>l.line.remove());
        this.placementLines=[];
    }

    updatePlacementHighlight(){
        if(!this.dragState||"placement"!==this.dragState.mode)return;
        const pointer=this.dragState.pointer||{x:0,y:0};
        let best=null;
        let bestDist=Infinity;
        this.placementLines.forEach(entry=>{
            const hit=entry.candidate.hit||{x:entry.candidate.x, y:entry.candidate.y, z:entry.candidate.z};
            const screen=this.projectPoint(new THREE.Vector3(hit.x, hit.y, hit.z));
            if(!screen)return;
            const d=Math.hypot(screen.x-pointer.x, screen.y-pointer.y);
            if(d<bestDist){
                bestDist=d;
                best=entry.candidate;
            }
        });
        this.dragState.bestCandidate=best;
        this.placementLines.forEach(entry=>{
            entry.line.classList.toggle("selected", entry.candidate===best);
        });
    }

    getFrontLeftPost(group){
        if(!group)return null;
        const posts=[];
        group.traverse(child=>{
            if(!child?.name||!/pfosten/i.test(child.name))return;
            const bbox=new THREE.Box3().setFromObject(child);
            if(bbox.isEmpty())return;
            posts.push({
                x:(bbox.min.x+bbox.max.x)/2,
                z:(bbox.min.z+bbox.max.z)/2,
                minY:bbox.min.y,
                maxY:bbox.max.y
            });
        });
        if(!posts.length)return null;
        posts.sort((a,b)=>{
            if(a.x!==b.x)return a.x-b.x;
            return a.z-b.z;
        });
        return posts[0];
    }
}
