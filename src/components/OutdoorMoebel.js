export class OutdoorMoebel {
    constructor(koordinatenSystem, konfiguration) {
        this.koordinatenSystem = koordinatenSystem;
        this.konfiguration = konfiguration;
        this.moebelGruppe = new THREE.Group();
        this.moebelGruppe.name = "OutdoorDekoration";
        this.materialien = {};
        this.moebel = [];
    }

    erstelleOutdoorMoebel() {
        console.group("🌿 ERSTELLE OUTDOOR-DEKORATION (PFLANZEN)");
        
        try {
            this.entferneMoebel();
            
            const config = this.konfiguration.gibAktuelleKonfiguration();
            
            // Deaktiviert - keine Pflanzen anzeigen
            console.log("ℹ️ Outdoor-Dekoration temporär deaktiviert");
            console.groupEnd();
            return this.moebelGruppe;
            
            /*
            // Nur erstellen, wenn aktiviert
            if (!config.outdoorMoebel) {
                console.log("ℹ️ Outdoor-Dekoration deaktiviert");
                console.groupEnd();
                return this.moebelGruppe;
            }
            
            this.erstelleMaterialien();
            this.erstellePflanzen();
            
            console.log(`✅ ${this.moebel.length} Pflanzen erstellt`);
            */
        } catch (err) {
            console.error("❌ Fehler beim Erstellen der Outdoor-Dekoration:", err);
        }
        
        console.groupEnd();
        return this.moebelGruppe;
    }

    erstelleMaterialien() {
        const textureLoader = new THREE.TextureLoader();
        const basePath = 'textures/deco/';
        const resolution = '4k';
        
        console.log("🎨 Lade Pflanzen-Texturen...");
        
        // PFLANZEN Material (Anthurium)
        this.materialien.pflanze = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xffffff),
            roughness: 0.7,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        
        // Pflanzen Diffuse
        const plantDiffuse = textureLoader.load(
            `${basePath}anthurium_botany_01_diff_${resolution}.jpg`,
            () => console.log("✅ Pflanzen Diffuse Map geladen"),
            undefined,
            () => console.warn("⚠️ Pflanzen Diffuse Map nicht gefunden")
        );
        plantDiffuse.colorSpace = THREE.SRGBColorSpace;
        this.materialien.pflanze.map = plantDiffuse;
        
        // Pflanzen Normal
        const plantNormal = textureLoader.load(
            `${basePath}anthurium_botany_01_nor_gl_${resolution}.jpg`,
            () => this.materialien.pflanze.needsUpdate = true
        );
        this.materialien.pflanze.normalMap = plantNormal;
        this.materialien.pflanze.normalScale = new THREE.Vector2(1.5, 1.5);
        
        // Pflanzen ARM (AO + Roughness + Metalness)
        const plantARM = textureLoader.load(
            `${basePath}anthurium_botany_01_arm_${resolution}.jpg`,
            () => this.materialien.pflanze.needsUpdate = true
        );
        this.materialien.pflanze.aoMap = plantARM;
        this.materialien.pflanze.roughnessMap = plantARM;
        this.materialien.pflanze.metalnessMap = plantARM;
        
        console.log("✅ Pflanzen-Material erstellt (Anthurium)");
    }

    erstellePflanzen() {
        const config = this.konfiguration.gibAktuelleKonfiguration();
        
        // Hole Pfosten-Referenzpunkte für die Pergola-Ränder
        const pfostenReferenz = this.koordinatenSystem.gibReferenzpunkt('pfostenReferenz');
        
        if (!pfostenReferenz || pfostenReferenz.length === 0) {
            console.warn("⚠️ Keine Pfosten-Referenzen gefunden");
            return;
        }
        
        // Erstelle Pflanzen um jeden Pfosten herum (außerhalb der Pergola)
        pfostenReferenz.forEach((pfosten, i) => {
            const pfostenX = pfosten.x || 0;
            const pfostenZ = pfosten.z || 0;
            
            // Platziere Pflanze außerhalb der Pergola (0.5m vom Pfosten entfernt)
            const abstand = 0.5;
            
            // Bestimme Richtung nach außen (vom Zentrum weg)
            const mittePosX = config.breite / 2;
            const mittePosZ = config.tiefe / 2;
            
            const richtungX = pfostenX - mittePosX;
            const richtungZ = pfostenZ - mittePosZ;
            const laenge = Math.sqrt(richtungX * richtungX + richtungZ * richtungZ);
            
            if (laenge > 0) {
                const normX = richtungX / laenge;
                const normZ = richtungZ / laenge;
                
                const pflanzeX = pfostenX + normX * abstand;
                const pflanzeZ = pfostenZ + normZ * abstand;
                
                const pflanze = this.erstellePflanze();
                pflanze.position.set(pflanzeX, 0, pflanzeZ);
                pflanze.name = `Pflanze_Pfosten_${i + 1}`;
                this.moebelGruppe.add(pflanze);
                this.moebel.push(pflanze);
                
                console.log(`� Pflanze ${i + 1} bei Pfosten erstellt: x=${pflanzeX.toFixed(2)}, z=${pflanzeZ.toFixed(2)}`);
            }
        });
        
        console.log(`✅ ${pfostenReferenz.length} Pflanzen um die Pergola herum erstellt`);
    }

    erstellePflanze() {
        const pflanzenGruppe = new THREE.Group();
        
        // Einfache Pflanzen-Geometrie mit Blättern
        const anzahlBlaetter = 6;
        const blattBreite = 0.25;
        const blattHoehe = 0.35;
        
        for (let i = 0; i < anzahlBlaetter; i++) {
            const winkel = (Math.PI * 2 / anzahlBlaetter) * i + (Math.random() - 0.5) * 0.5;
            const neigung = 0.3 + Math.random() * 0.4;
            const hoehe = 0.3 + Math.random() * 0.15;
            
            // Blatt (Plane mit Textur)
            const blattGeo = new THREE.PlaneGeometry(blattBreite, blattHoehe, 8, 8);
            
            // Leichte Wölbung für 3D-Effekt
            const positions = blattGeo.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const x = positions.getX(j);
                const y = positions.getY(j);
                const normX = x / (blattBreite / 2);
                const normY = y / (blattHoehe / 2);
                
                const distFromCenter = Math.sqrt(normX * normX + normY * normY);
                const woelbung = Math.max(0, 1 - distFromCenter) * 0.03;
                positions.setZ(j, woelbung);
            }
            positions.needsUpdate = true;
            blattGeo.computeVertexNormals();
            
            const blatt = new THREE.Mesh(blattGeo, this.materialien.pflanze);
            
            // Positionierung
            const radius = 0.15;
            const blattX = Math.cos(winkel) * radius;
            const blattZ = Math.sin(winkel) * radius;
            
            blatt.position.set(blattX, hoehe, blattZ);
            blatt.rotation.y = winkel + Math.PI / 2;
            blatt.rotation.x = -neigung;
            blatt.rotation.z = (Math.random() - 0.5) * 0.3;
            
            blatt.castShadow = true;
            blatt.receiveShadow = true;
            pflanzenGruppe.add(blatt);
        }
        
        return pflanzenGruppe;
    }

    entferneMoebel() {
        while (this.moebelGruppe.children.length > 0) {
            const obj = this.moebelGruppe.children[0];
            this.moebelGruppe.remove(obj);
            
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        }
        this.moebel = [];
    }

    gib3DGruppe() {
        return this.moebelGruppe;
    }

    dispose() {
        this.entferneMoebel();
        Object.values(this.materialien).forEach(mat => {
            if (mat.map) mat.map.dispose();
            if (mat.normalMap) mat.normalMap.dispose();
            if (mat.roughnessMap) mat.roughnessMap.dispose();
            if (mat.metalnessMap) mat.metalnessMap.dispose();
            mat.dispose();
        });
        this.materialien = {};
    }
}
