# 3D-Komponenten

Diese Dokumentation beschreibt alle 3D-Komponenten des Pergola-Konfigurators und die `Component3D` Basis-Klasse.

## 📦 Component3D Basis-Klasse

Alle 3D-Komponenten erben von der abstrakten `Component3D` Basisklasse, die ein einheitliches Interface und gemeinsame Funktionalität bereitstellt.

### Basis-Interface

```javascript
// src/core/Component3D.js
export class Component3D {
    constructor(name, koordinatenSystem, konfiguration) {
        this.name = name;                      // Komponenten-Name
        this.koordinatenSystem = koordinatenSystem;  // Referenz zu KoordinatenSystem
        this.konfiguration = konfiguration;     // Referenz zu PergolaKonfiguration
        this.gruppe = new THREE.Group();        // THREE.Group für Meshes
        this.elemente = [];                     // Array aller Elemente
        this.materialien = new Map();           // Material-Cache
        this.logger = createLogger(name);       // Logger-Instanz
        this.isDisposed = false;                // Disposed-Status
    }

    // Abstrakte Methode (muss implementiert werden)
    create() {
        throw new Error(`${this.name}: create() muss implementiert werden`);
    }
}
```

### Gemeinsame Methoden

#### Element-Verwaltung

```javascript
// Element hinzufügen
addElement(element, metadata = {})
// Gibt: Das hinzugefügte Element zurück

// Element entfernen
removeElement(elementOrName)
// Gibt: true wenn erfolgreich entfernt

// Element abrufen
get(name)
// Gibt: Element oder null

// Alle Elemente abrufen
getAll()
// Gibt: Array aller Elemente

// Anzahl der Elemente
getCount()
// Gibt: number

// Prüfen ob Elemente existieren
hasElements()
// Gibt: boolean
```

#### Konfiguration & Gruppe

```javascript
// Konfiguration abrufen
getConfig()
// Gibt: Aktuelle Konfiguration

// THREE.Group abrufen
getGroup()
// Gibt: THREE.Group
```

#### Cleanup

```javascript
// Alle Elemente entfernen
clear()

// Komponente aufräumen
dispose()

// THREE.Object3D disposen
disposeObject3D(obj)
```

#### Material-Management

```javascript
// Material erstellen/cachen
createMaterial(key, options)
// Gibt: THREE.Material

// Farbe aktualisieren
updateColor(color)

// Transparenz setzen
updateOpacity(opacity)

// Material-Properties aktualisieren
updateMaterialProperties(properties)
```

### Neue Komponente erstellen

```javascript
import { Component3D } from '../core/Component3D.js';

export class MeineKomponente extends Component3D {
    constructor(koordinatenSystem, konfiguration) {
        super('MeineKomponente', koordinatenSystem, konfiguration);
        
        // Zusätzliche Initialisierung
        this.spezifischeDaten = [];
    }

    /**
     * Erstellt die Komponente
     * @returns {THREE.Group}
     */
    create() {
        // Vorherige Elemente entfernen
        this.clear();

        const config = this.getConfig();
        
        // Elemente erstellen
        const mesh = this.erstelleMeinMesh();
        
        // Element hinzufügen
        this.addElement({
            name: 'mein_element',
            mesh: mesh,
            typ: 'custom'
        }, {
            // Optionale Metadaten
            kategorie: 'special',
            sichtbar: true
        });

        return this.getGroup();
    }

    /**
     * Hilfsmethode zum Erstellen eines Meshes
     */
    erstelleMeinMesh() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = this.createMaterial('mein_material', {
            color: 0x00ff00,
            metalness: 0.5,
            roughness: 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'MeinMesh';
        
        return mesh;
    }

    /**
     * Dispose-Methode überschreiben für spezifisches Cleanup
     */
    dispose() {
        // Spezifisches Cleanup
        this.spezifischeDaten = [];
        
        // Basis-Cleanup
        super.dispose();
    }
}
```

## 🏗️ Komponenten-Übersicht

### Strukturelle Komponenten

#### 1. Pfosten (Posts)

**Datei**: `src/components/Pfosten.js`

**Verantwortung**: Vertikale Stützelemente der Pergola

**Features**:
- Vordere, hintere und zentrale Mittelpfosten
- Individuelle Verschiebung und Kürzung
- Unterschiedliche Profile (160×80, 200×120)
- Aktivierung/Deaktivierung einzelner Pfosten

```javascript
export class Pfosten extends Component3D {
    create() {
        // Erstellt alle Pfosten basierend auf Konfiguration
    }

    erstellePfosten() {
        // Hauptmethode: Erstellt vorne, hinten, mittel
        return this.getGroup();
    }

    erstelleVorderePfosten() { /* ... */ }
    erstelleHinterePfosten() { /* ... */ }
    erstelleMittelpfosten() { /* ... */ }
    
    // Pfosten-spezifische Methoden
    verschiebenMittelpfosten(versatz) { /* ... */ }
    kuerzePfosten(kuerzung) { /* ... */ }
}
```

**Element-Struktur**:
```javascript
{
    name: 'pfosten_vorne_links',
    mesh: THREE.Mesh,
    typ: 'pfosten',
    position: 'vorne_links',
    profil: '160x80x4',
    hoehe: 2.7,
    versatz: 0,
    kuerzung: 0,
    aktiv: true
}
```

#### 2. Längsträger (Longitudinal Beams)

**Datei**: `src/components/Laengstraeger.js`

**Verantwortung**: Träger parallel zur Tiefe der Pergola

**Features**:
- Rahmen-Längsträger (links/rechts)
- Mittel-Längsträger (bei Mittelpfosten)
- Profil-Optimierung basierend auf Spannweite
- Verbindung zu Pfosten

```javascript
export class Laengstraeger extends Component3D {
    create() {
        return this.erstelleLaengstraeger();
    }

    erstelleLaengstraeger() {
        this.erstelleRahmenLaengstraeger();
        if (config.zentralerMittelpfosten) {
            this.erstelleMittelLaengstraeger();
        }
        return this.getGroup();
    }

    erstelleRahmenLaengstraeger() { /* ... */ }
    erstelleMittelLaengstraeger() { /* ... */ }
}
```

**Element-Struktur**:
```javascript
{
    name: 'laengstraeger_links',
    mesh: THREE.Mesh,
    typ: 'laengstraeger',
    position: 'links',
    profil: '200x120x6',
    laenge: 4.5,
    kategorie: 'rahmen' // oder 'mittel'
}
```

#### 3. Querträger (Cross Beams)

**Datei**: `src/components/Quertraeger.js`

**Verantwortung**: Träger parallel zur Breite der Pergola

**Features**:
- Rahmen-Querträger (vorne/hinten)
- Mittel-Querträger (bei Mittelpfosten)
- Automatische Positionierung auf Längsträger
- Dachneigung berücksichtigen

```javascript
export class Quertraeger extends Component3D {
    create() {
        return this.erstelleQuertraeger();
    }

    erstelleQuertraeger() {
        this.erstelleRahmenQuertraeger();
        if (config.zentralerMittelpfosten) {
            this.erstelleMittelQuertraeger();
        }
        return this.getGroup();
    }

    berechneHoeheAnPosition(position) {
        // Berücksichtigt Dachneigung
    }
}
```

#### 4. Kopfbänder (Braces)

**Datei**: `src/components/Kopfbaender.js`

**Verantwortung**: Diagonale Verstärkungen an den Ecken

**Features**:
- 45° oder 60° Winkel
- Positionierung: Nur Ecken oder alle Pfosten
- Optionale Aktivierung

```javascript
export class Kopfbaender extends Component3D {
    create() {
        return this.erstelleKopfbaender();
    }

    erstelleKopfbaender() {
        const config = this.getConfig();
        if (!config.kopfbaenderAktiv) return this.getGroup();

        switch (config.kopfbaenderPosition) {
            case 'ecken':
                this.erstelleEckenKopfbaender();
                break;
            case 'alle':
                this.erstelleAlleKopfbaender();
                break;
        }
        return this.getGroup();
    }
}
```

#### 5. Befestigung (Mounting)

**Datei**: `src/components/Befestigung.js`

**Verantwortung**: Pfosten-Befestigungselemente

**Features**:
- Ankerplatten
- Pfostenschuhe
- Bodenverankerung

```javascript
export class Befestigung extends Component3D {
    create() {
        return this.erstelleBefestigung();
    }

    erstelleBefestigung() {
        const config = this.getConfig();
        
        switch (config.befestigung) {
            case 'ankerplatte':
                this.erstelleAnkerplatten();
                break;
            case 'pfostenschuh':
                this.erstellePfostenschuhe();
                break;
            case 'bodenverankerung':
                this.erstelleBodenverankerung();
                break;
        }
        return this.getGroup();
    }
}
```

### Dach-Komponenten

#### 6. Gläser (Glass Panels)

**Datei**: `src/components/Glaeser.js`

**Verantwortung**: Glaselemente im Dach

**Features**:
- VSG-Glas (Verbund-Sicherheitsglas)
- Verschiedene Farben (klar, grau, bronze, milchig)
- Transparenz und Reflexionen
- Anordnung zwischen Längsträger

```javascript
export class Glaeser extends Component3D {
    create() {
        return this.erstelleGlaeser();
    }

    erstelleGlaeser() {
        const config = this.getConfig();
        if (config.dachTyp !== 'glas') return this.getGroup();

        const anzahl = this.berechneGlasAnzahl();
        for (let i = 0; i < anzahl; i++) {
            this.erstelleEinzelglas(i);
        }
        return this.getGroup();
    }

    erstelleGlasMaterial(farbe) {
        return this.createMaterial(`glas_${farbe}`, {
            color: this.getGlasfarbe(farbe),
            transparent: true,
            opacity: 0.3,
            metalness: 0.1,
            roughness: 0.1,
            envMapIntensity: 1.0
        });
    }
}
```

**Glasfarben**:
```javascript
GLASFARBEN = {
    'klar': 0xffffff,      // Transparent
    'grau': 0x808080,      // Grau getönt
    'bronze': 0xCD7F32,    // Bronze getönt
    'milchig': 0xf5f5f5    // Milchglas
}
```

### Umgebungs-Komponenten

#### 7. Terrassenplatten (Terrace Tiles)

**Datei**: `src/components/Terrassenplatten.js`

**Verantwortung**: Bodenplatten unter der Pergola

**Features**:
- Verschiedene Texturen (Stein, Holz, Beton)
- Konfigurierbare Plattengröße
- Erweiterung über Pergola hinaus

```javascript
export class Terrassenplatten extends Component3D {
    create() {
        return this.erstelleTerrassenplatten();
    }

    erstelleTerrassenplatten() {
        const config = this.getConfig();
        if (!config.terrassenplatten) return this.getGroup();

        const breite = config.breite + config.terrassenplattenErweiterung * 2;
        const tiefe = config.tiefe + config.terrassenplattenErweiterung * 2;

        const geometry = new THREE.PlaneGeometry(breite, tiefe);
        const material = this.erstelleTerrassenmaterial();
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.01; // Leicht über Boden

        this.addElement({ name: 'terrassenplatten', mesh });
        return this.getGroup();
    }

    erstelleTerrassenmaterial() {
        const config = this.getConfig();
        const textur = this.ladeTextur(config.terrassenplattenTextur);
        
        return this.createMaterial('terrasse', {
            map: textur,
            roughness: 0.8,
            metalness: 0.1
        });
    }
}
```

#### 8. Outdoor-Möbel (Outdoor Furniture)

**Datei**: `src/components/OutdoorMoebel.js`

**Verantwortung**: Möbel-Modelle (Tisch, Stühle, etc.)

**Features**:
- GLTF-Modell-Loading
- Platzierung innerhalb der Pergola
- Verschiedene Möbel-Sets

```javascript
export class OutdoorMoebel extends Component3D {
    create() {
        return this.erstelleMoebel();
    }

    async erstelleMoebel() {
        const config = this.getConfig();
        if (!config.outdoorMoebel) return this.getGroup();

        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync('models/outdoor-set.glb');
        
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(0.01, 0.01, 0.01);

        this.addElement({ name: 'moebel_set', mesh: model });
        return this.getGroup();
    }
}
```

#### 9. Glaswände (Glass Side Walls)

**Datei**: `src/components/Glaswaende.js`

**Verantwortung**: Optionale Glas-Seitenwände für alle vier Seiten der Pergola

**Features**:
- Festglas oder Schiebetüren pro Seite
- Automatische Panel-Berechnung (~1.2m Breite pro Panel)
- Unterstützung für Pultdach (Trapezform) und Flachdach
- Tür-Option mit größerem Griff
- Wandanbau-Modus (hintere Seite automatisch deaktiviert)
- Verschiedene Glasfarben (klar, matt, grau, bronze)
- Bodenschienen für Schiebetüren

```javascript
export class Glaswaende extends Component3D {
    constructor(koordinatenSystem, konfiguration, pfostenInstanz) {
        super('Glaswaende', koordinatenSystem, konfiguration);
        this.pfostenInstanz = pfostenInstanz;
        this.glasMaterialien = new Map();
        this.rahmenMaterialien = new Map();
    }

    create() {
        return this.erstelleGlaswaende();
    }

    erstelleGlaswaende() {
        const config = this.getConfig();
        const abhaengig = this.konfiguration.berechneAbhaengigeWerte(config);
        
        const seiten = ['links', 'rechts', 'vorne', 'hinten'];
        seiten.forEach(seite => {
            const seitenConfig = config.glaswaende?.[seite];
            if (seitenConfig?.typ !== 'keine') {
                const wand = this.erstelleGlaswandFuerSeite(seite, seitenConfig, config, abhaengig);
                this.gruppe.add(wand);
            }
        });
        
        return this.getGroup();
    }

    berechnePanelAnzahl(laenge) {
        const zielAnzahl = Math.round(laenge / 1.2); // ~1.2m pro Panel
        return Math.max(2, Math.min(6, zielAnzahl));
    }

    erstellePanel(breite, hoehe, glasMaterial, rahmenMaterial, istTuer, typ) {
        // Erstellt einzelnes Panel mit Rahmen, Glas und Griff
    }

    erstelleSchienen(laenge, hoehe, material) {
        // Erstellt Bodenschienen für Schiebetüren
    }
}
```

**Glaswand-Konfiguration**:
```javascript
GLASWAND_CONFIG = {
    PANEL_ZIEL_BREITE: 1.2,    // Meter pro Panel
    PANEL_MIN_ANZAHL: 2,
    PANEL_MAX_ANZAHL: 6,
    RAHMEN_BREITE: 0.04,       // 40mm
    GLAS_DICKE: 0.008,         // 8mm VSG
    GRIFF_HOEHE: 0.15,         // Standard 150mm
    GRIFF_HOEHE_TUER: 0.30     // Tür 300mm
}
```

**Glasfarben**:
```javascript
GLASWAND_MATERIALIEN = {
    klar: { transmission: 0.92, roughness: 0.05 },
    matt: { transmission: 0.7, roughness: 0.4 },
    grau: { transmission: 0.75, roughness: 0.1 },
    bronze: { transmission: 0.72, roughness: 0.12 }
}
```

**Element-Struktur**:
```javascript
{
    name: 'glaswand_links',
    gruppe: THREE.Group,
    typ: 'festglas',  // oder 'schiebewand'
    istTuer: false,
    panels: [
        { mesh: THREE.Group, index: 0 },
        { mesh: THREE.Group, index: 1 }
    ]
}
```

### Visualisierungs-Komponenten

#### 10. Bemaßung (Dimensions)

**Datei**: `src/components/Bemassung.js`

**Verantwortung**: Maßlinien und -texte in der 3D-Szene

**Features**:
- Breiten-, Tiefen-, Höhen-Bemaßung
- CSS2DRenderer für Text
- Automatische Positionierung

```javascript
export class Bemassung extends Component3D {
    constructor() {
        super('Bemassung', null, null);
        this.bemassungslinien = [];
        this.beschriftungen = [];
    }

    create() {
        return this.aktualisiereBemasung();
    }

    aktualisiereBemasung(breite, tiefe, hoehe) {
        this.clear();

        this.erstelleBreitenbemasung(breite);
        this.erstelleTiefenbemasung(tiefe);
        this.erstelleHoehenbemasung(hoehe);

        return this.getGroup();
    }

    erstelleBreitenbemasung(breite) {
        // Linie erstellen
        const line = this.erstelleLinie(startPoint, endPoint);
        this.gruppe.add(line);

        // Text erstellen
        const label = this.erstelleLabel(`${breite.toFixed(2)}m`);
        this.gruppe.add(label);
    }

    erstelleLinie(start, end) {
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });
        return new THREE.Line(geometry, material);
    }

    erstelleLabel(text) {
        const div = document.createElement('div');
        div.textContent = text;
        div.className = 'dimension-label';
        
        const label = new CSS2DObject(div);
        return label;
    }
}
```

#### 10. KoordinatenAnzeige (Coordinate System)

**Datei**: `src/components/KoordinatenAnzeige.js`

**Verantwortung**: Achsen-Darstellung (X, Y, Z)

```javascript
export class KoordinatenAnzeige extends Component3D {
    constructor() {
        super('KoordinatenAnzeige', null, null);
    }

    create() {
        return this.erstelleAchsen();
    }

    erstelleAchsen() {
        const achsenLaenge = 5;
        
        // X-Achse (rot)
        this.erstelleAchse([achsenLaenge, 0, 0], 0xff0000, 'X');
        
        // Y-Achse (grün)
        this.erstelleAchse([0, achsenLaenge, 0], 0x00ff00, 'Y');
        
        // Z-Achse (blau)
        this.erstelleAchse([0, 0, achsenLaenge], 0x0000ff, 'Z');

        return this.getGroup();
    }

    erstelleAchse(richtung, farbe, beschriftung) {
        const origin = new THREE.Vector3(0, 0, 0);
        const end = new THREE.Vector3(...richtung);
        
        const arrow = new THREE.ArrowHelper(
            end.normalize(),
            origin,
            end.length(),
            farbe
        );
        
        arrow.name = `achse_${beschriftung}`;
        this.gruppe.add(arrow);
    }
}
```

## 🎨 Material-System

### Material-Erstellung

```javascript
// In Component3D
createMaterial(key, options) {
    // Prüfen ob Material bereits existiert
    if (this.materialien.has(key)) {
        return this.materialien.get(key);
    }

    // Neues Material erstellen
    const material = new THREE.MeshStandardMaterial(options);
    
    // Cachen
    this.materialien.set(key, material);
    
    return material;
}
```

### Material-Updates

```javascript
// Farbe ändern
updateColor(color) {
    this.materialien.forEach(material => {
        if (material.color) {
            material.color.setHex(color);
        }
    });
}

// Eigenschaften ändern
updateMaterialProperties(properties) {
    this.materialien.forEach(material => {
        Object.assign(material, properties);
        material.needsUpdate = true;
    });
}
```

### Standard-Materialien

```javascript
// Aluminium
const aluMaterial = this.createMaterial('alu', {
    color: 0x7f7f7f,
    metalness: 0.9,
    roughness: 0.2,
    envMapIntensity: 1.0
});

// Glas
const glasMaterial = this.createMaterial('glas', {
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    metalness: 0.1,
    roughness: 0.1
});

// Holz
const holzMaterial = this.createMaterial('holz', {
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.0
});
```

## 🔄 Component Lifecycle

### 1. Initialisierung

```javascript
const komponente = new Pfosten(koordinatenSystem, konfiguration);
```

### 2. Erstellung

```javascript
const gruppe = komponente.create();
scene.add(gruppe);
```

### 3. Update

```javascript
// Bei Konfigurationsänderung
komponente.create(); // Erstellt neu
```

### 4. Cleanup

```javascript
komponente.dispose();
```

## 📊 Component-Datenstruktur

### Element-Objekt

Jedes Element in `this.elemente` hat folgende Struktur:

```javascript
{
    // Pflicht-Felder
    name: string,              // Eindeutiger Name
    mesh: THREE.Object3D,      // 3D-Objekt
    typ: string,               // 'pfosten', 'traeger', etc.
    
    // Optionale Felder
    position?: string,         // 'vorne_links', 'hinten_rechts', etc.
    profil?: string,          // '160x80x4', '200x120x6', etc.
    hoehe?: number,           // Höhe in Metern
    breite?: number,          // Breite in Metern
    tiefe?: number,           // Tiefe in Metern
    kategorie?: string,       // 'rahmen', 'mittel', etc.
    
    // Metadaten
    metadata?: {
        sichtbar: boolean,
        selectable: boolean,
        interactive: boolean,
        // Beliebige weitere Daten
    }
}
```

## 🔧 Best Practices

### 1. Component3D erweitern

```javascript
// ✅ Richtig
export class MeineKomponente extends Component3D {
    constructor(koordinatenSystem, konfiguration) {
        super('MeineKomponente', koordinatenSystem, konfiguration);
    }
    
    create() {
        this.clear(); // Alte Elemente entfernen
        // Neue Elemente erstellen
        return this.getGroup();
    }
}
```

### 2. Elemente hinzufügen

```javascript
// ✅ Richtig - Mit addElement
const mesh = new THREE.Mesh(geometry, material);
this.addElement({
    name: 'element_1',
    mesh: mesh,
    typ: 'custom'
});

// ❌ Falsch - Direkt zur Gruppe
this.gruppe.add(mesh); // Nicht getrackt in this.elemente
```

### 3. Cleanup implementieren

```javascript
dispose() {
    // Spezifisches Cleanup
    this.spezifischeReferenzen = null;
    
    // Basis-Cleanup (wichtig!)
    super.dispose();
}
```

### 4. Konfiguration abrufen

```javascript
// ✅ Richtig
const config = this.getConfig();

// ❌ Falsch
const config = this.konfiguration.gibAktuelleKonfiguration();
```

### 5. Logger verwenden

```javascript
// Logger ist bereits in Component3D
this.logger.debug('Creating elements...');
this.logger.warn('Invalid configuration');
this.logger.error('Failed to create mesh:', error);
```

---

**Nächste Schritte**: Siehe [CONFIGURATION.md](./CONFIGURATION.md) für Konfigurationssystem.
