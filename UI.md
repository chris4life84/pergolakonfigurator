# UI-System

Diese Dokumentation beschreibt das UI-System des Pergola-Konfigurators.

## 📋 Übersicht

Das UI-System besteht aus einem hierarchischen Controller-System:

```
UIController (Haupt-Controller)
    ├── SliderController (Slider-Inputs)
    ├── PostController (Pfosten-Steuerung)
    ├── OptionCardController (Karten-basierte Optionen)
    ├── IndividualPostController (Einzelne Pfosten)
    ├── DimensionHandles (3D-Interaktive Griffe)
    ├── Infobox (Debug-Informationen)
    ├── PriceTag (Preis-Anzeige)
    └── ShareLink (URL-Sharing)
```

## 🎛️ UIController

**Datei**: `src/ui/UIController.js`

### Verantwortung

- Zentrale UI-Verwaltung
- DOM-Element-Management
- Event-Koordination
- Sub-Controller-Orchestrierung

### Initialisierung

```javascript
export class UIController {
    constructor(renderEngine) {
        this.renderEngine = renderEngine;
        this.elemente = {};
        this.aktuelleKonfiguration = {};
        this.logger = new Logger('UIController');
        
        // Sub-Controller
        this.sliderController = null;
        this.postController = null;
        this.optionCardController = null;
        this.individualPostController = null;
        this.dimensionHandles = null;
        this.infobox = null;
        this.priceTag = null;
        this.shareLink = null;
    }

    initialisieren() {
        this.sammleDOMElemente();
        this.erstelleSubController();
        this.initAccordion();
        
        // Sub-Controller initialisieren
        this.sliderController.initialisieren();
        this.postController.initialisieren();
        this.optionCardController.initialisieren();
        
        // Weitere Initialisierung...
        this.initSelects();
        this.initInfobox();
        this.initPriceTag();
        this.initShareButton();
        
        // Events
        this.initEventListener();
        
        // Initial-Update
        this.onKonfigurationGeaendert();
    }

    sammleDOMElemente() {
        this.elemente = {
            // Slider
            breitenSlider: document.getElementById('width-slider'),
            tiefenSlider: document.getElementById('depth-slider'),
            hoehenSlider: document.getElementById('height-slider'),
            neigungSlider: document.getElementById('pitch-slider'),
            
            // Selects
            typSelect: document.getElementById('type-select'),
            materialSelect: document.getElementById('material-select'),
            colorSelect: document.getElementById('color-select'),
            
            // Buttons
            shareButton: document.getElementById('share-button'),
            resetButton: document.getElementById('reset-button'),
            
            // Displays
            priceDisplay: document.getElementById('price-display'),
            statusDisplay: document.getElementById('status-display'),
            
            // Container
            configPanel: document.getElementById('config-panel'),
            debugPanel: document.getElementById('debug-panel')
        };
    }

    erstelleSubController() {
        this.sliderController = new SliderController(this);
        this.postController = new PostController(this);
        this.optionCardController = new OptionCardController(this);
        this.individualPostController = new IndividualPostController(this);
        this.dimensionHandles = new DimensionHandles(this.renderEngine, this);
        this.infobox = new Infobox();
        this.priceTag = new PriceTag();
        this.shareLink = new ShareLink();
    }
}
```

### Event-Handling

```javascript
initEventListener() {
    // Konfigurationsänderungen
    EventBus.on(EventTypes.CONFIG_CHANGED, (config) => {
        this.onKonfigurationGeaendert(config);
    });

    // Statik-Aktionen
    EventBus.on(EventTypes.STATICS_ACTION, (action) => {
        this.applyStaticsAction(action);
    });

    // Profil-Änderungen
    EventBus.on(EventTypes.PROFILE_CHANGED, (profile) => {
        this.wendeProfilkonfigurationAn(profile);
    });
}

onKonfigurationGeaendert(config) {
    // UI aktualisieren
    this.aktuelleKonfiguration = config || this.getConfig();
    
    // Sub-Controller benachrichtigen
    this.sliderController.aktualisiereWerte();
    this.postController.aktualisiereAnzeige();
    this.optionCardController.aktualisiereAuswahl();
    
    // Preise aktualisieren
    this.priceTag.aktualisiere(this.aktuelleKonfiguration);
    
    // Status aktualisieren
    this.updateStatus('Konfiguration aktualisiert', 'success');
}
```

### Konfigurations-Updates

```javascript
aktualisiereWert(key, value) {
    this.logger.debug(`Aktualisiere ${key} = ${value}`);
    
    // Konfiguration aktualisieren
    const config = this.renderEngine.gibPergola().gibKonfiguration();
    config.aktualisiereKonfiguration({ [key]: value });
    
    // UI aktualisieren
    this.aktuelleKonfiguration[key] = value;
}

getConfig() {
    return this.renderEngine?.gibPergola()?.gibKonfiguration()?.gibAktuelleKonfiguration() || {};
}
```

## 🎚️ SliderController

**Datei**: `src/ui/SliderController.js`

### Verantwortung

- Verwaltung aller Slider-Inputs
- Wert-Updates
- Anzeige-Synchronisation

### Slider-Typen

```javascript
SLIDER_CONFIG = {
    breite: {
        id: 'width-slider',
        displayId: 'width-display',
        key: 'breite',
        unit: 'm',
        min: 2.5,
        max: 10,
        step: 0.1
    },
    tiefe: {
        id: 'depth-slider',
        displayId: 'depth-display',
        key: 'tiefe',
        unit: 'm',
        min: 2,
        max: 8,
        step: 0.1
    },
    hoehe: {
        id: 'height-slider',
        displayId: 'height-display',
        key: 'hoehe',
        unit: 'm',
        min: 2,
        max: 4,
        step: 0.1
    },
    neigung: {
        id: 'pitch-slider',
        displayId: 'pitch-display',
        key: 'neigung',
        unit: '°',
        min: 0,
        max: 15,
        step: 1
    }
};
```

### API

```javascript
export class SliderController {
    constructor(uiController) {
        this.uiController = uiController;
        this.sliders = {};
        this.displays = {};
    }

    initialisieren() {
        // Slider registrieren
        Object.entries(SLIDER_CONFIG).forEach(([name, config]) => {
            this.registriereSlider(name, config);
        });

        // Initial-Werte setzen
        this.aktualisiereWerte();
    }

    registriereSlider(name, config) {
        const slider = document.getElementById(config.id);
        const display = document.getElementById(config.displayId);
        
        if (!slider || !display) return;

        this.sliders[name] = slider;
        this.displays[name] = display;

        // Event-Listener
        slider.addEventListener('input', (e) => {
            this.onSliderChange(name, config, e.target.value);
        });
    }

    onSliderChange(name, config, value) {
        const numValue = parseFloat(value);
        
        // Display aktualisieren
        this.aktualiereDisplay(name, numValue, config.unit);
        
        // Konfiguration aktualisieren
        this.uiController.aktualisiereWert(config.key, numValue);
    }

    aktualisiereWerte() {
        const config = this.uiController.getConfig();
        
        Object.entries(SLIDER_CONFIG).forEach(([name, sliderConfig]) => {
            const value = config[sliderConfig.key];
            if (value !== undefined) {
                this.setzeWert(name, value);
            }
        });
    }

    setzeWert(name, value) {
        const slider = this.sliders[name];
        const config = SLIDER_CONFIG[name];
        
        if (slider) {
            slider.value = value;
            this.aktualiereDisplay(name, value, config.unit);
        }
    }

    aktualiereDisplay(name, value, unit) {
        const display = this.displays[name];
        if (display) {
            display.textContent = `${value.toFixed(1)}${unit}`;
        }
    }

    // Callbacks registrieren
    onHeightUpdate(callback) {
        this.heightUpdateCallback = callback;
    }
}
```

## 🏗️ PostController

**Datei**: `src/ui/PostController.js`

### Verantwortung

- Pfosten-Verschiebung
- Pfosten-Kürzung
- Pfosten-Aktivierung/Deaktivierung
- Mittelpfosten-Toggle

### API

```javascript
export class PostController {
    constructor(uiController) {
        this.uiController = uiController;
        this.pfostenControls = {
            versatz: {},
            kuerzung: {},
            aktiv: {}
        };
    }

    initialisieren() {
        this.initVerschiebung();
        this.initKuerzung();
        this.initAktivierung();
        this.initMittelpfosten();
    }

    // Verschiebung
    initVerschiebung() {
        ['vorne', 'hinten', 'mitte'].forEach(position => {
            const slider = document.getElementById(`post-offset-${position}`);
            if (!slider) return;

            slider.addEventListener('input', (e) => {
                this.onVersatzChange(position, parseFloat(e.target.value));
            });
        });
    }

    onVersatzChange(position, wert) {
        const config = this.uiController.getConfig();
        const pfostenVersaetze = { ...config.pfostenVersaetze };
        pfostenVersaetze[position] = wert;
        
        this.uiController.aktualisiereWert('pfostenVersaetze', pfostenVersaetze);
    }

    // Kürzung
    initKuerzung() {
        ['vorne', 'hinten', 'mitte'].forEach(position => {
            const slider = document.getElementById(`post-shorten-${position}`);
            if (!slider) return;

            slider.addEventListener('input', (e) => {
                this.onKuerzungChange(position, parseFloat(e.target.value));
            });
        });
    }

    onKuerzungChange(position, wert) {
        const config = this.uiController.getConfig();
        const pfostenKuerzung = { ...config.pfostenKuerzung };
        pfostenKuerzung[position] = wert;
        
        this.uiController.aktualisiereWert('pfostenKuerzung', pfostenKuerzung);
    }

    // Aktivierung
    initAktivierung() {
        ['vorne', 'hinten'].forEach(position => {
            const checkbox = document.getElementById(`post-active-${position}`);
            if (!checkbox) return;

            checkbox.addEventListener('change', (e) => {
                this.onAktivChange(position, e.target.checked);
            });
        });
    }

    onAktivChange(position, aktiv) {
        const config = this.uiController.getConfig();
        const pfostenAktiv = { ...config.pfostenAktiv };
        pfostenAktiv[position] = aktiv;
        
        this.uiController.aktualisiereWert('pfostenAktiv', pfostenAktiv);
    }

    // Mittelpfosten
    initMittelpfosten() {
        const toggle = document.getElementById('central-post-toggle');
        if (!toggle) return;

        toggle.addEventListener('change', (e) => {
            this.uiController.aktualisiereWert('zentralerMittelpfosten', e.target.checked);
        });
    }

    aktualisiereAnzeige() {
        const config = this.uiController.getConfig();
        
        // Versätze aktualisieren
        Object.entries(config.pfostenVersaetze || {}).forEach(([pos, wert]) => {
            this.setzeVersatzDisplay(pos, wert);
        });
        
        // Kürzungen aktualisieren
        Object.entries(config.pfostenKuerzung || {}).forEach(([pos, wert]) => {
            this.setzeKuerzungDisplay(pos, wert);
        });
        
        // Aktivierung aktualisieren
        Object.entries(config.pfostenAktiv || {}).forEach(([pos, aktiv]) => {
            this.setzeAktivDisplay(pos, aktiv);
        });
    }
}
```

## 🎴 OptionCardController

**Datei**: `src/ui/OptionCardController.js`

### Verantwortung

- Karten-basierte Optionen (Dachtyp, Material, etc.)
- Radio-Button-Gruppen
- Visuelle Feedback

### Option-Card-Struktur

```html
<div class="option-card-group" data-config-key="dachTyp">
    <div class="option-card" data-value="glas">
        <div class="card-icon">🏠</div>
        <div class="card-title">Glas</div>
    </div>
    <div class="option-card" data-value="epdm">
        <div class="card-icon">🏗️</div>
        <div class="card-title">EPDM</div>
    </div>
    <div class="option-card" data-value="polycarbonat">
        <div class="card-icon">🔲</div>
        <div class="card-title">Polycarbonat</div>
    </div>
</div>
```

### API

```javascript
export class OptionCardController {
    constructor(uiController) {
        this.uiController = uiController;
        this.cardGroups = {};
    }

    initialisieren() {
        // Alle Card-Gruppen finden
        const groups = document.querySelectorAll('.option-card-group');
        
        groups.forEach(group => {
            const key = group.dataset.configKey;
            if (!key) return;

            this.registriereCardGroup(key, group);
        });

        // Initial-Auswahl setzen
        this.aktualisiereAuswahl();
    }

    registriereCardGroup(key, group) {
        this.cardGroups[key] = group;

        // Alle Cards in der Gruppe
        const cards = group.querySelectorAll('.option-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                this.onCardClick(key, card);
            });
        });
    }

    onCardClick(key, card) {
        const value = card.dataset.value;
        
        // Visuelle Auswahl
        this.setzeAktiveCard(key, value);
        
        // Konfiguration aktualisieren
        this.uiController.aktualisiereWert(key, value);
    }

    setzeAktiveCard(key, value) {
        const group = this.cardGroups[key];
        if (!group) return;

        // Alle Cards deselektieren
        group.querySelectorAll('.option-card').forEach(card => {
            card.classList.remove('active');
        });

        // Ausgewählte Card markieren
        const activeCard = group.querySelector(`[data-value="${value}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        }
    }

    aktualisiereAuswahl() {
        const config = this.uiController.getConfig();
        
        Object.keys(this.cardGroups).forEach(key => {
            const value = config[key];
            if (value !== undefined) {
                this.setzeAktiveCard(key, value);
            }
        });
    }
}
```

## 🎯 DimensionHandles

**Datei**: `src/ui/DimensionHandles.js`

### Verantwortung

- 3D-interaktive Griffe zum Ändern von Dimensionen
- Visuelles Feedback
- Raycasting für Interaktion

### Implementierung

```javascript
export class DimensionHandles {
    constructor(renderEngine, uiController) {
        this.renderEngine = renderEngine;
        this.uiController = uiController;
        this.handles = [];
        this.isDragging = false;
        this.activeHandle = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    erstelle() {
        const config = this.uiController.getConfig();
        
        // Breiten-Handles (links/rechts)
        this.erstelleBreitenHandles(config.breite, config.tiefe);
        
        // Tiefen-Handles (vorne/hinten)
        this.erstelleTiefenHandles(config.breite, config.tiefe);
        
        // Event-Listener
        this.initEventListener();
    }

    erstelleBreitenHandles(breite, tiefe) {
        // Linker Handle
        const leftHandle = this.erstelleHandle(
            new THREE.Vector3(-breite / 2, 0, 0),
            0xff0000,
            'breite',
            'links'
        );
        this.handles.push(leftHandle);

        // Rechter Handle
        const rightHandle = this.erstelleHandle(
            new THREE.Vector3(breite / 2, 0, 0),
            0xff0000,
            'breite',
            'rechts'
        );
        this.handles.push(rightHandle);
    }

    erstelleHandle(position, color, typ, richtung) {
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.userData = { typ, richtung };
        
        this.renderEngine.gibSzene().add(mesh);
        
        return mesh;
    }

    initEventListener() {
        const canvas = this.renderEngine.gibCanvas();

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    onMouseDown(event) {
        this.updateMouse(event);
        
        // Raycasting
        this.raycaster.setFromCamera(this.mouse, this.renderEngine.gibKamera());
        const intersects = this.raycaster.intersectObjects(this.handles);
        
        if (intersects.length > 0) {
            this.isDragging = true;
            this.activeHandle = intersects[0].object;
            this.renderEngine.gibControls().enabled = false; // OrbitControls deaktivieren
        }
    }

    onMouseMove(event) {
        if (!this.isDragging || !this.activeHandle) return;
        
        this.updateMouse(event);
        
        // Neue Position berechnen
        const typ = this.activeHandle.userData.typ;
        const delta = this.berechneDelta(typ);
        
        // Dimension aktualisieren
        this.aktualisiereDimension(typ, delta);
    }

    onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.activeHandle = null;
            this.renderEngine.gibControls().enabled = true; // OrbitControls aktivieren
        }
    }

    aktualisiereDimension(typ, delta) {
        const config = this.uiController.getConfig();
        
        if (typ === 'breite') {
            const neueBreite = Math.max(2.5, Math.min(10, config.breite + delta));
            this.uiController.aktualisiereWert('breite', neueBreite);
        } else if (typ === 'tiefe') {
            const neueTiefe = Math.max(2, Math.min(8, config.tiefe + delta));
            this.uiController.aktualisiereWert('tiefe', neueTiefe);
        }
    }

    updateMouse(event) {
        const canvas = this.renderEngine.gibCanvas();
        const rect = canvas.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    dispose() {
        this.handles.forEach(handle => {
            this.renderEngine.gibSzene().remove(handle);
            handle.geometry.dispose();
            handle.material.dispose();
        });
        this.handles = [];
    }
}
```

## 📊 IndividualPostController

**Datei**: `src/ui/IndividualPostController.js`

### Verantwortung

- Individuelle Bearbeitung einzelner Pfosten
- 3D-Selektion
- Property-Panel

### Workflow

```
1. Pfosten in 3D-Szene klicken
    ↓
2. Raycasting → Pfosten selektiert
    ↓
3. Property-Panel anzeigen
    ↓
4. Eigenschaften bearbeiten:
   - Position (X, Y, Z)
   - Verschiebung
   - Kürzung
   - Aktivierung
    ↓
5. Änderungen anwenden
```

### API

```javascript
export class IndividualPostController {
    constructor(uiController) {
        this.uiController = uiController;
        this.selectedPost = null;
        this.propertyPanel = null;
    }

    initialisieren() {
        this.propertyPanel = document.getElementById('post-property-panel');
        this.init3DSelection();
        this.initPropertyInputs();
    }

    init3DSelection() {
        // Raycasting für Pfosten-Selektion
        const canvas = this.uiController.renderEngine.gibCanvas();
        
        canvas.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                this.selectPostAtMouse(e);
            }
        });
    }

    selectPostAtMouse(event) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Mouse-Position normalisieren
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting
        raycaster.setFromCamera(mouse, this.uiController.renderEngine.gibKamera());
        
        // Nur Pfosten testen
        const pfosten = this.getPfostenMeshes();
        const intersects = raycaster.intersectObjects(pfosten);
        
        if (intersects.length > 0) {
            this.selectPost(intersects[0].object);
        }
    }

    selectPost(mesh) {
        // Vorherige Selektion entfernen
        if (this.selectedPost) {
            this.deselectPost();
        }
        
        this.selectedPost = mesh;
        
        // Visuell hervorheben
        this.highlightPost(mesh);
        
        // Property-Panel anzeigen
        this.showPropertyPanel(mesh);
    }

    deselectPost() {
        if (this.selectedPost) {
            this.unhighlightPost(this.selectedPost);
            this.selectedPost = null;
            this.hidePropertyPanel();
        }
    }

    showPropertyPanel(mesh) {
        const userData = mesh.userData;
        
        // Panel füllen
        document.getElementById('post-id').textContent = userData.id;
        document.getElementById('post-position').value = userData.position;
        document.getElementById('post-offset-x').value = userData.versatz?.x || 0;
        document.getElementById('post-offset-z').value = userData.versatz?.z || 0;
        document.getElementById('post-shorten').value = userData.kuerzung || 0;
        
        // Panel anzeigen
        this.propertyPanel.style.display = 'block';
    }

    hidePropertyPanel() {
        this.propertyPanel.style.display = 'none';
    }
}
```

## 🔄 Event-Kommunikation: UI ↔ 3D

### UI → 3D

```
User Input (UI)
    ↓
UIController.aktualisiereWert()
    ↓
PergolaKonfiguration.aktualisiereKonfiguration()
    ↓
EventBus.emit(CONFIG_CHANGED)
    ↓
Pergola.aufKonfigurationsAenderungReagieren()
    ↓
Pergola.erstellePergola()
    ↓
3D-Szene aktualisiert
```

### 3D → UI

```
3D-Interaktion (Raycasting, Handles)
    ↓
DimensionHandles.aktualisiereDimension()
    ↓
UIController.aktualisiereWert()
    ↓
EventBus.emit(CONFIG_CHANGED)
    ↓
UI-Elemente aktualisiert
```

### Event-Bridge

```javascript
// Legacy DOM Events → EventBus
document.addEventListener('pergolaKonfigurationGeaendert', (e) => {
    EventBus.emit(EventTypes.CONFIG_CHANGED, e.detail);
});

// EventBus → Legacy DOM Events
EventBus.on(EventTypes.CONFIG_CHANGED, (data) => {
    document.dispatchEvent(new CustomEvent('pergolaKonfigurationGeaendert', {
        detail: data
    }));
});
```

## 🎨 Weitere UI-Komponenten

### Infobox

```javascript
// src/ui/Infobox.js
export class Infobox {
    aktualisiere(config) {
        document.getElementById('info-breite').textContent = config.breite;
        document.getElementById('info-tiefe').textContent = config.tiefe;
        document.getElementById('info-hoehe').textContent = config.hoehe;
        // ...
    }
}
```

### PriceTag

```javascript
// src/ui/PriceTag.js
export class PriceTag {
    aktualisiere(config) {
        const preis = this.berechnePreis(config);
        document.getElementById('price-display').textContent = 
            `${preis.toLocaleString('de-DE')} €`;
    }

    berechnePreis(config) {
        // Preisberechnung basierend auf Konfiguration
        return pricing.calculateTotal(config);
    }
}
```

### ShareLink

```javascript
// src/utils/ShareLink.js
export class ShareLink {
    generateShareLink(config) {
        const encoded = btoa(JSON.stringify(config));
        return `${window.location.origin}${window.location.pathname}?config=${encoded}`;
    }

    parseUrlConfig() {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('config');
        if (!encoded) return null;
        
        try {
            return JSON.parse(atob(encoded));
        } catch (e) {
            console.error('Fehler beim Parsen der URL-Konfiguration:', e);
            return null;
        }
    }
}
```

## 📱 Responsive Design

### Mobile-Optimierungen

```css
/* css/mobile-optimizations.css */
@media (max-width: 768px) {
    .config-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 50vh;
        overflow-y: auto;
    }

    .option-card {
        min-width: 100px;
        padding: 0.5rem;
    }

    .slider-control {
        flex-direction: column;
    }
}
```

### Touch-Interaktion

```javascript
// Touch-Events für mobile Geräte
canvas.addEventListener('touchstart', (e) => {
    this.handleTouch(e);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    this.handleTouchMove(e);
});
```

---

**Nächste Schritte**: Siehe [DEVELOPMENT.md](./DEVELOPMENT.md) für Entwickler-Guide.
