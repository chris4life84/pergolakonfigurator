# System-Architektur

Diese Dokumentation beschreibt die Architektur des Pergola-Konfigurators nach dem Refactoring.

## 🏗️ Architektur-Überblick

Der Konfigurator folgt einer **modularen, event-driven Architektur** mit Dependency Injection:

```
┌─────────────────────────────────────────────────────────┐
│                     main.js                             │
│              (PergolaKonfigurator)                      │
└────────────┬──────────────────────────────┬─────────────┘
             │                              │
             ▼                              ▼
    ┌────────────────┐            ┌─────────────────┐
    │ RenderEngine   │            │  UIController   │
    │  (3D-Logik)    │◄───────────┤  (UI-Logik)     │
    └────────┬───────┘            └────────┬────────┘
             │                             │
             ▼                             ▼
    ┌────────────────┐            ┌─────────────────┐
    │   Pergola      │            │  Sub-Controller │
    │  (Components)  │            │  (Slider, Post) │
    └────────────────┘            └─────────────────┘
             │
             ▼
    ┌────────────────────────────────────────┐
    │        Component3D-Hierarchie          │
    │  (Pfosten, Träger, Gläser, etc.)      │
    └────────────────────────────────────────┘
```

## 🎯 Design Patterns

### 1. Service Registry Pattern

**Problem**: Globale `window`-Variablen führen zu tight coupling und sind schwer testbar.

**Lösung**: Zentrale Service-Registry für Dependency Injection.

#### Implementierung

```javascript
// src/core/ServiceRegistry.js
class ServiceRegistryClass {
    constructor() {
        this.services = new Map();
    }

    register(name, service) {
        this.services.set(name, service);
        return this;
    }

    get(name) {
        return this.services.get(name);
    }
}

const ServiceRegistry = new ServiceRegistryClass();
export default ServiceRegistry;
```

#### Verwendung

```javascript
// Registrieren
import { registerRenderEngine } from './src/core/ServiceRegistry.js';
registerRenderEngine(renderEngine);

// Abrufen
import { getRenderEngine } from './src/core/ServiceRegistry.js';
const engine = getRenderEngine();
```

#### Vorteile
- ✅ Keine globalen Variablen
- ✅ Einfaches Testen (Mock-Services)
- ✅ Lazy Loading möglich
- ✅ Lifecycle-Management

### 2. Component3D Basis-Klasse

**Problem**: Code-Duplikate in allen 3D-Komponenten.

**Lösung**: Abstrakte Basisklasse mit gemeinsamen Methoden.

#### Basis-Interface

```javascript
// src/core/Component3D.js
export class Component3D {
    constructor(name, koordinatenSystem, konfiguration) {
        this.name = name;
        this.koordinatenSystem = koordinatenSystem;
        this.konfiguration = konfiguration;
        this.gruppe = new THREE.Group();
        this.elemente = [];
        this.logger = createLogger(name);
    }

    // Abstrakte Methode (muss implementiert werden)
    create() {
        throw new Error(`${this.name}: create() muss implementiert werden`);
    }

    // Gemeinsame Methoden
    addElement(element, metadata) { /* ... */ }
    clear() { /* ... */ }
    dispose() { /* ... */ }
    getConfig() { /* ... */ }
}
```

#### Verwendung in Komponenten

```javascript
// src/components/Pfosten.js
export class Pfosten extends Component3D {
    constructor(koordinatenSystem, konfiguration) {
        super('Pfosten', koordinatenSystem, konfiguration);
        // Spezifische Initialisierung
    }

    create() {
        this.clear(); // Von Component3D
        // Pfosten-spezifische Logik
        const pfostenMesh = this.createPfostenMesh();
        this.addElement({ mesh: pfostenMesh, name: 'pfosten_1' });
        return this.gruppe;
    }
}
```

#### Vorteile
- ✅ DRY (Don't Repeat Yourself)
- ✅ Konsistentes API
- ✅ Einfache Erweiterbarkeit
- ✅ Memory-Management einheitlich

### 3. EventBus (Publish/Subscribe)

**Problem**: Direkte Kopplung zwischen Komponenten durch `document.dispatchEvent`.

**Lösung**: Zentraler, typisierter EventBus.

#### EventBus-API

```javascript
// src/core/EventBus.js
class EventBusClass {
    on(event, callback, options) { /* ... */ }
    once(event, callback) { /* ... */ }
    off(event, callback) { /* ... */ }
    emit(event, data) { /* ... */ }
    dispose() { /* ... */ }
}

export const EventTypes = {
    CONFIG_CHANGED: 'pergolaKonfigurationGeaendert',
    DIMENSION_CHANGED: 'dimensionChange',
    PROFILE_CHANGED: 'profilAenderung',
    // ...
};
```

#### Verwendung

```javascript
import EventBus, { EventTypes } from './src/core/EventBus.js';

// Listener registrieren
const unsubscribe = EventBus.on(EventTypes.CONFIG_CHANGED, (data) => {
    console.log('Konfiguration geändert:', data);
});

// Event emittieren
EventBus.emit(EventTypes.CONFIG_CHANGED, {
    breite: 4,
    tiefe: 3
});

// Listener entfernen
unsubscribe();
```

#### Event-Bridges

Für Legacy-Kompatibilität existieren Bridges zu `document.addEventListener`:

```javascript
// src/core/EventBus.js
export function initializeEventBridges() {
    // Legacy DOM Event → EventBus
    document.addEventListener('pergolaKonfigurationGeaendert', (e) => {
        EventBus.emit(EventTypes.CONFIG_CHANGED, e.detail);
    });

    // EventBus → Legacy DOM Event
    EventBus.on(EventTypes.CONFIG_CHANGED, (data) => {
        document.dispatchEvent(new CustomEvent('pergolaKonfigurationGeaendert', {
            detail: data
        }));
    });
}
```

#### Vorteile
- ✅ Typisierte Events
- ✅ Einfaches Unsubscribe
- ✅ Debug-Modus mit History
- ✅ Memory-Leak Prävention

## 📊 Datenfluss

### Konfigurationsänderung

```
User Interaction (UI)
        │
        ▼
UIController.aktualisiereWert()
        │
        ▼
PergolaKonfiguration.aktualisiereKonfiguration()
        │
        ├─► Validierung
        │
        ├─► benachrichtigeAenderung()
        │
        ▼
EventBus.emit(CONFIG_CHANGED)
        │
        ├──► UIController.onKonfigurationGeaendert()
        │    └─► UI aktualisieren
        │
        ├──► Pergola.aufKonfigurationsAenderungReagieren()
        │    └─► 3D-Szene neu erstellen
        │
        └──► RenderEngine.aktualisiereSzene()
             └─► Render-Loop
```

### Profil-Optimierung

```
Dimension Change
        │
        ▼
StaticsCheck.pruefeStatik(breite, tiefe)
        │
        ├─► Berechne Spannweiten
        │
        ├─► Ermittle erforderliche Profile
        │
        ▼
EventBus.emit(PROFILE_CHANGED)
        │
        ├──► ProfileKonfiguration.optimiereProfileFuerGroesse()
        │
        ├──► Pfosten.setzeAktivesProfil()
        ├──► Laengstraeger.setzeAktivesProfil()
        ├──► Quertraeger.setzeAktivesProfil()
        │
        ▼
Pergola.erstellePergola()
        │
        └─► 3D-Szene mit optimierten Profilen
```

## 🏛️ Modul-Struktur

### Core-Module

#### `main.js` - PergolaKonfigurator
- **Verantwortung**: Haupteinstiegspunkt, Orchestrierung
- **Dependencies**: RenderEngine, UIController, ServiceRegistry
- **Lifecycle**: Initialisierung, Event-Setup, Legacy-Kompatibilität

#### `RenderEngine.js`
- **Verantwortung**: 3D-Rendering-Pipeline
- **Komponenten**: 
  - Scene, Renderer, Camera
  - CameraController (OrbitControls)
  - LightingSystem
  - PostProcessPipeline
- **API**: `initialisieren()`, `render()`, `gibPergola()`

#### `Pergola.js`
- **Verantwortung**: Pergola-Struktur-Management
- **Komponenten**: Alle 3D-Components koordinieren
- **API**: `erstellePergola()`, `entfernePergola()`, `setzeAktivesProfil()`

#### `ServiceRegistry.js`
- **Verantwortung**: Zentrale Service-Verwaltung
- **Pattern**: Singleton mit Dependency Injection
- **Services**: 
  - Konfigurator
  - RenderEngine
  - UIController
  - StaticsCheck

#### `EventBus.js`
- **Verantwortung**: Event-Management
- **Pattern**: Publish/Subscribe
- **Features**: 
  - Typisierte Events
  - History (Debug)
  - Memory-Leak Prevention

### Konfigurations-Module

#### `PergolaKonfiguration.js`
- **Verantwortung**: Zentrale Konfigurationsverwaltung
- **Features**:
  - Standard-Konfiguration
  - Validierung
  - Change-Notification
- **API**: 
  - `gibAktuelleKonfiguration()`
  - `aktualisiereKonfiguration(updates)`
  - `gibStandardKonfiguration()`

#### `ProfileKonfiguration.js`
- **Verantwortung**: Profil-Management für Aluminiumprofile
- **Features**:
  - Profil-Bibliothek
  - Statik-basierte Optimierung
  - Spannweiten-Prüfung

#### `SpannweitenKonfiguration.js`
- **Verantwortung**: Zulässige Spannweiten pro Profil
- **Datenstruktur**: 
  ```javascript
  {
      '160x80x4': { max: 4500, mitMittelpfosten: 7000 },
      '200x120x6': { max: 6000, mitMittelpfosten: 9000 }
  }
  ```

### UI-Module

#### `UIController.js`
- **Verantwortung**: Haupt-UI-Controller
- **Sub-Controller**:
  - SliderController
  - PostController
  - OptionCardController
- **Features**:
  - DOM-Element-Management
  - Event-Binding
  - Konfigurations-Updates

#### Sub-Controller
- **SliderController**: Slider-Inputs (Breite, Tiefe, Höhe, Neigung)
- **PostController**: Pfosten-Verschiebung, -Kürzung, -Aktivierung
- **OptionCardController**: Karten-basierte Optionen (Dachtyp, Material, etc.)
- **IndividualPostController**: Individuelle Pfosten-Bearbeitung

### Component-Module

Alle Components erben von `Component3D`:

- **Pfosten**: Vertikale Stützen
- **Laengstraeger**: Längsträger (parallel zur Tiefe)
- **Quertraeger**: Querträger (parallel zur Breite)
- **Glaeser**: Glaselemente im Dach
- **Kopfbaender**: Diagonale Verstärkungen
- **Befestigung**: Ankerplatten, Pfostenschuhe
- **Terrassenplatten**: Bodenplatten
- **OutdoorMoebel**: Möbel-Modelle
- **Bemassung**: Maßlinien und -texte
- **KoordinatenAnzeige**: Achsen-Darstellung

## 🔄 Lifecycle

### Initialisierung

```javascript
// 1. PergolaKonfigurator erstellen
const konfigurator = new PergolaKonfigurator();

// 2. Initialisieren
await konfigurator.initialisieren();
    │
    ├─► DOM-Ready warten
    │
    ├─► EventBridges initialisieren
    │
    ├─► RenderEngine erstellen und initialisieren
    │   ├─► Three.js Setup
    │   ├─► Kamera und Controls
    │   ├─► Beleuchtung
    │   └─► Post-Processing
    │
    ├─► UIController erstellen und initialisieren
    │   ├─► DOM-Elemente sammeln
    │   ├─► Sub-Controller erstellen
    │   └─► Event-Listener binden
    │
    ├─► Pergola erstellen
    │   └─► Alle Components initialisieren
    │
    └─► APP_INITIALIZED Event emittieren
```

### Aktualisierung

```javascript
// Konfiguration ändern
konfiguration.aktualisiereKonfiguration({ breite: 5 });
    │
    ├─► Validierung
    │
    ├─► CONFIG_CHANGED Event
    │
    ├─► Pergola.aufKonfigurationsAenderungReagieren()
    │   └─► erstellePergola()
    │       ├─► entfernePergola() (cleanup)
    │       ├─► Profil-Optimierung
    │       ├─► Components erstellen
    │       └─► Scene aktualisieren
    │
    └─► RenderEngine.render()
```

### Cleanup

```javascript
// Komponente entfernen
component.dispose();
    │
    ├─► clear() - Alle Elemente entfernen
    │   ├─► Meshes aus Gruppe entfernen
    │   ├─► Geometrien disposen
    │   └─► Materialien disposen
    │
    └─► Event-Listener entfernen

// Gesamte App cleanup
ServiceRegistry.dispose();
EventBus.dispose();
```

## 🔌 Dependency Injection

### Problem
Tight Coupling durch direkte Instanziierung:
```javascript
// ❌ Alt (Tight Coupling)
class UIController {
    constructor() {
        this.renderEngine = window.renderEngine; // Globale Variable
    }
}
```

### Lösung
Constructor Injection + Service Registry:
```javascript
// ✅ Neu (Loose Coupling)
class UIController {
    constructor(renderEngine) {
        this.renderEngine = renderEngine; // Injected
    }
}

// In main.js
const renderEngine = new RenderEngine('canvas');
const uiController = new UIController(renderEngine);

// Registrieren
registerRenderEngine(renderEngine);
registerUIController(uiController);
```

### Vorteile
- ✅ Testbarkeit (Mock-Services)
- ✅ Flexibilität (Services austauschbar)
- ✅ Keine globalen Variablen
- ✅ Klare Dependencies

## 🎨 Rendering-Pipeline

```
Frame Start
    │
    ▼
requestAnimationFrame()
    │
    ▼
RenderEngine.render()
    │
    ├─► OrbitControls.update()
    │
    ├─► Render mit Post-Processing?
    │   ├─── Ja → Composer.render()
    │   │        ├─► RenderPass
    │   │        ├─► UnrealBloomPass (optional)
    │   │        ├─► OutlinePass (Highlights)
    │   │        ├─► SMAAPass (Anti-Aliasing)
    │   │        └─► OutputPass
    │   │
    │   └─── Nein → Renderer.render(scene, camera)
    │
    ├─► FPS-Counter aktualisieren
    │
    └─► Next Frame
```

## 📦 Module Loading

ES6-Module mit relativen Pfaden:

```javascript
// main.js
import { RenderEngine } from "./src/core/RenderEngine.js";
import { UIController } from "./src/ui/UIController.js";
import EventBus, { EventTypes } from "./src/core/EventBus.js";

// Keine Bundler erforderlich
// Browser lädt Module nativ
```

## 🧪 Testing-Strategie

### Unit Tests (geplant)
```javascript
// ServiceRegistry testen
import ServiceRegistry from './ServiceRegistry.js';

test('register and get service', () => {
    const mockService = { name: 'test' };
    ServiceRegistry.register('test', mockService);
    expect(ServiceRegistry.get('test')).toBe(mockService);
});
```

### Integration Tests
- UI-Interaktionen testen
- Konfigurationsänderungen prüfen
- 3D-Szene-Updates validieren

### E2E Tests
- Komplette User-Flows
- Screenshot-Vergleiche
- Performance-Metriken

## 📈 Performance-Optimierung

### Lazy Component Creation
```javascript
// Components erst bei Bedarf erstellen
if (config.terrassenplatten) {
    this.terrassenplatten.erstelleTerrassenplatten();
}
```

### Geometry Instancing
```javascript
// Wiederverwendbare Geometrien
const geometry = new THREE.BoxGeometry(w, h, d);
for (let i = 0; i < count; i++) {
    const mesh = new InstancedMesh(geometry, material, count);
}
```

### Material Sharing
```javascript
// Materialien wiederverwenden
this.materialien.set('alu_ral7016', material);
const sharedMaterial = this.materialien.get('alu_ral7016');
```

### Object Pooling
```javascript
// Objekte wiederverwenden statt neu erstellen
this.meshPool = [];
const mesh = this.meshPool.pop() || this.createMesh();
```

## 🔐 Best Practices

1. **Dependency Injection verwenden**
   - Services über Constructor injizieren
   - ServiceRegistry für globalen Zugriff

2. **Events über EventBus**
   - Typisierte EventTypes verwenden
   - Listener aufräumen (unsubscribe)

3. **Component3D erweitern**
   - Alle 3D-Components von Component3D ableiten
   - `create()` Methode implementieren

4. **Logger verwenden**
   ```javascript
   const logger = createLogger('MyModule');
   logger.debug('Debug-Info');
   logger.error('Fehler:', error);
   ```

5. **Memory-Management**
   - `dispose()` Methoden implementieren
   - Geometrien und Materialien aufräumen
   - Event-Listener entfernen

---

**Nächste Schritte**: Siehe [COMPONENTS.md](./COMPONENTS.md) für Details zu 3D-Komponenten.
