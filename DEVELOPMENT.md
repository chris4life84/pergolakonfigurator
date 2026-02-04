# Entwickler-Dokumentation

Diese Dokumentation enthält wichtige Informationen für Entwickler des Pergola-Konfigurators.

## 🚀 Getting Started

### Entwicklungsumgebung einrichten

1. **Repository klonen**
   ```bash
   git clone [repository-url]
   cd pergolakonfigurator
   ```

2. **Lokalen Server starten**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (http-server)
   npx http-server -p 8000
   ```

3. **Browser öffnen**
   ```
   http://localhost:8000
   ```

4. **Debug-Modus aktivieren**
   ```javascript
   // In Browser-Console
   localStorage.setItem('pergola_debug', 'true');
   location.reload();
   ```

### Entwickler-Tools

- **Browser DevTools** - Chrome/Firefox/Edge Developer Tools
- **Three.js Inspector** - Browser-Extension für Three.js-Debugging
- **VS Code** mit empfohlenen Extensions:
  - ESLint
  - Prettier
  - JavaScript (ES6) code snippets
  - Live Server

## 🔍 Logger-System

### Logger verwenden

Das Logger-System bietet strukturierte Logging-Funktionen:

```javascript
import { createLogger } from './src/utils/Logger.js';

const logger = createLogger('MeinModul');

// Log-Levels
logger.debug('Debug-Information');     // Nur im Debug-Modus
logger.info('Informative Nachricht');  // Immer sichtbar
logger.warn('Warnung');                // Gelb markiert
logger.error('Fehler', errorObject);   // Rot markiert

// Gruppierte Logs
logger.group('Gruppen-Name');
logger.info('Inhalt 1');
logger.info('Inhalt 2');
logger.groupEnd();

// Performance-Messung
logger.time('Operation');
// ... Code ...
logger.timeEnd('Operation'); // Zeigt: Operation: 123.45ms
```

### Logger-Konfiguration

```javascript
// src/utils/Logger.js
export class Logger {
    constructor(moduleName) {
        this.moduleName = moduleName;
        this.prefix = `[${moduleName}]`;
    }

    debug(message, ...args) {
        if (isDebug()) {
            console.log(`${this.prefix} 🔍`, message, ...args);
        }
    }

    info(message, ...args) {
        console.log(`${this.prefix} ℹ️`, message, ...args);
    }

    warn(message, ...args) {
        console.warn(`${this.prefix} ⚠️`, message, ...args);
    }

    error(message, ...args) {
        console.error(`${this.prefix} ❌`, message, ...args);
    }
}
```

### Debug-Modus aktivieren

```javascript
// Option 1: localStorage
localStorage.setItem('pergola_debug', 'true');

// Option 2: Programmatisch
import { setDebugMode } from './src/utils/Logger.js';
setDebugMode(true);

// Option 3: StorageService
import { setDebugEnabled } from './src/utils/StorageService.js';
setDebugEnabled(true);

// Debug-Status prüfen
import { isDebug } from './src/utils/Logger.js';
if (isDebug()) {
    console.log('Debug-Modus ist aktiv');
}
```

### Best Practices

```javascript
// ✅ Richtig: Kontext-relevante Informationen
logger.debug('Erstelle Pfosten', { position: 'vorne_links', profil: '160x80x4' });

// ✅ Richtig: Fehler mit Stack-Trace
try {
    // Code
} catch (error) {
    logger.error('Fehler beim Erstellen der Komponente:', error);
}

// ✅ Richtig: Performance-Messung
logger.time('PergolaErstellung');
pergola.erstellePergola();
logger.timeEnd('PergolaErstellung');

// ❌ Falsch: Zu viele Debug-Logs
for (let i = 0; i < 1000; i++) {
    logger.debug('Iteration', i); // Performance-Problem!
}

// ❌ Falsch: Sensitive Daten loggen
logger.debug('User-Token:', userToken); // Sicherheitsrisiko!
```

## 💾 StorageService

### LocalStorage-Verwaltung

```javascript
import StorageService, { STORAGE_KEYS } from './src/utils/StorageService.js';

// Konfiguration speichern
StorageService.set(STORAGE_KEYS.LAST_CONFIG, config);

// Konfiguration laden
const config = StorageService.get(STORAGE_KEYS.LAST_CONFIG, defaultConfig);

// Boolean speichern
StorageService.setBoolean(STORAGE_KEYS.DEBUG, true);

// Boolean laden
const debugEnabled = StorageService.getBoolean(STORAGE_KEYS.DEBUG, false);

// Alle Einträge mit Präfix löschen
StorageService.clearByPrefix('pergola_');

// Speicher-Nutzung prüfen
const usage = StorageService.getStorageInfo();
console.log(`Verwendet: ${usage.used} / ${usage.total}`);
```

### Storage-Keys

```javascript
// src/utils/StorageService.js
export const STORAGE_KEYS = {
    DEBUG: 'pergola_debug',
    LAST_CONFIG: 'pergola_last_config',
    USER_PREFERENCES: 'pergola_user_prefs',
    CAMERA_POSITION: 'pergola_camera_pos',
    UI_STATE: 'pergola_ui_state'
};
```

### Helper-Funktionen

```javascript
// Debug-Modus
import { isDebugEnabled, setDebugEnabled } from './src/utils/StorageService.js';

if (isDebugEnabled()) {
    console.log('Debug aktiv');
}

setDebugEnabled(false);

// Letzte Konfiguration
import { saveLastConfig, loadLastConfig } from './src/utils/StorageService.js';

saveLastConfig(config);
const lastConfig = loadLastConfig();
```

## 🔗 ShareLink

### URL-basiertes Teilen

```javascript
import { ShareLink } from './src/utils/ShareLink.js';

const shareLink = new ShareLink();

// Share-Link generieren
const url = shareLink.generateShareLink(config);
console.log('Share-URL:', url);
// Ergebnis: https://example.com/?config=eyJicmVpdGUiOjUsInRpZWZlIjo0fQ

// Konfiguration aus URL laden
const urlConfig = shareLink.parseUrlConfig();
if (urlConfig) {
    konfiguration.aktualisiereKonfiguration(urlConfig);
}

// Prüfen ob URL-Config existiert
if (shareLink.hasUrlConfig()) {
    console.log('URL enthält Konfiguration');
}
```

### URL-Encoding

Die Konfiguration wird als Base64-kodiertes JSON in der URL gespeichert:

```javascript
// Beispiel-Konfiguration
const config = {
    breite: 5,
    tiefe: 4,
    hoehe: 2.8,
    farbe: 'ral7016'
};

// Kodierung
const json = JSON.stringify(config);
const base64 = btoa(json);
const url = `?config=${encodeURIComponent(base64)}`;

// Dekodierung
const encoded = new URLSearchParams(window.location.search).get('config');
const decoded = atob(decodeURIComponent(encoded));
const parsedConfig = JSON.parse(decoded);
```

### URL-Config automatisch laden

```javascript
// In main.js oder UIController
class PergolaKonfigurator {
    async initialisieren() {
        // ...
        
        // URL-Config laden
        const shareLink = new ShareLink();
        const urlConfig = shareLink.parseUrlConfig();
        
        if (urlConfig) {
            logger.info('Lade Konfiguration aus URL...');
            this.konfiguration.aktualisiereKonfiguration(urlConfig);
        }
        
        // ...
    }
}
```

## 🧪 Testing & Debugging

### Manual Testing

```javascript
// Im Debug-Modus: Test-Funktionen exponieren
if (isDebug()) {
    window.pergolaDebug = {
        // Konfigurator-Referenz
        konfigurator: getKonfigurator(),
        renderEngine: getRenderEngine(),
        uiController: getUIController(),
        
        // Test-Funktionen
        setzeTestKonfiguration: () => {
            getKonfigurator().konfiguration.aktualisiereKonfiguration({
                breite: 6,
                tiefe: 5,
                hoehe: 3,
                zentralerMittelpfosten: true
            });
        },
        
        // Performance-Test
        performanceTest: () => {
            const start = performance.now();
            for (let i = 0; i < 100; i++) {
                getRenderEngine().gibPergola().erstellePergola();
            }
            const end = performance.now();
            console.log(`100 Iterationen: ${end - start}ms`);
        },
        
        // Memory-Check
        checkMemory: () => {
            if (performance.memory) {
                console.log('Memory:', {
                    used: `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
                    total: `${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
                    limit: `${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
                });
            }
        }
    };
}
```

### Three.js-Debugging

```javascript
// Scene-Graph ausgeben
function printSceneGraph(obj, indent = 0) {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}${obj.name || obj.type} (${obj.children.length} children)`);
    obj.children.forEach(child => printSceneGraph(child, indent + 1));
}

printSceneGraph(scene);

// Geometrie-/Material-Statistik
function analyzeScene(scene) {
    const stats = {
        meshes: 0,
        geometries: 0,
        materials: 0,
        vertices: 0
    };
    
    scene.traverse((obj) => {
        if (obj.isMesh) {
            stats.meshes++;
            if (obj.geometry) {
                stats.geometries++;
                stats.vertices += obj.geometry.attributes.position?.count || 0;
            }
            if (obj.material) {
                stats.materials++;
            }
        }
    });
    
    console.log('Scene-Statistik:', stats);
}

analyzeScene(scene);
```

### Performance-Profiling

```javascript
// Performance-Messung für kritische Operationen
class PerformanceProfiler {
    constructor() {
        this.measurements = {};
    }

    start(name) {
        this.measurements[name] = performance.now();
    }

    end(name) {
        if (this.measurements[name]) {
            const duration = performance.now() - this.measurements[name];
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
            delete this.measurements[name];
            return duration;
        }
    }

    measure(name, fn) {
        this.start(name);
        const result = fn();
        this.end(name);
        return result;
    }

    async measureAsync(name, fn) {
        this.start(name);
        const result = await fn();
        this.end(name);
        return result;
    }
}

// Verwendung
const profiler = new PerformanceProfiler();

profiler.measure('PergolaErstellung', () => {
    pergola.erstellePergola();
});

await profiler.measureAsync('HDRLoading', async () => {
    await hdriLoader.load('environment.hdr');
});
```

## 🎨 Code-Konventionen

### Naming Conventions

```javascript
// Klassen: PascalCase
class PergolaKonfigurator { }
class UIController { }

// Funktionen/Methoden: camelCase
function erstellePergola() { }
function aktualisiereKonfiguration() { }

// Konstanten: UPPER_SNAKE_CASE
const MAX_BREITE = 10;
const STORAGE_KEYS = { ... };

// Variablen: camelCase
const aktuelleKonfiguration = { };
let istInitialisiert = false;

// Private-ähnlich: _prefixed (Legacy, vermeiden)
this._internalState = { };

// Dateinamen: PascalCase für Klassen, camelCase für Utils
Pergola.js
UIController.js
berechnePfostenHoehen.js
```

### Kommentare & JSDoc

```javascript
/**
 * Erstellt eine neue Pergola-Komponente
 * 
 * @param {KoordinatenSystem} koordinatenSystem - Das Koordinatensystem
 * @param {PergolaKonfiguration} konfiguration - Die Konfiguration
 * @returns {THREE.Group} Die erstellte Gruppe
 * @throws {Error} Wenn Parameter ungültig
 */
function erstelleKomponente(koordinatenSystem, konfiguration) {
    // Implementierung
}

// Inline-Kommentare für komplexe Logik
if (breite > 4.5 || tiefe > 4.5) {
    // Mittelpfosten erforderlich wegen Spannweite > 4.5m
    // Profile: 200×120 (Rahmen) + 160×80 (Mittelträger)
    zentralerMittelpfosten = true;
}

// TODO: Kommentare für zukünftige Arbeit
// TODO: Profil-Optimierung für Holz implementieren

// FIXME: Kommentare für Bugs
// FIXME: Memory-Leak bei wiederholtem erstellePergola()

// HACK: Kommentare für temporäre Lösungen
// HACK: Workaround für Safari-Rendering-Bug
```

### Fehlerbehandlung

```javascript
// ✅ Richtig: Spezifische Fehlerbehandlung
try {
    const config = JSON.parse(configString);
    konfiguration.aktualisiereKonfiguration(config);
} catch (error) {
    if (error instanceof SyntaxError) {
        logger.error('Ungültiges JSON:', error);
        // Fallback auf Standard-Konfiguration
        konfiguration.setzeStandard();
    } else {
        logger.error('Unerwarteter Fehler:', error);
        throw error; // Re-throw unerwartete Fehler
    }
}

// ✅ Richtig: Validierung vor Verwendung
function setzeBreite(breite) {
    if (typeof breite !== 'number' || !isFinite(breite)) {
        throw new TypeError('Breite muss eine gültige Zahl sein');
    }
    if (breite < 2.5 || breite > 10) {
        throw new RangeError('Breite muss zwischen 2.5 und 10 liegen');
    }
    this.breite = breite;
}

// ❌ Falsch: Fehler ignorieren
try {
    riskanterCode();
} catch (e) {
    // Leer - Fehler wird ignoriert!
}

// ❌ Falsch: Zu allgemeine Fehlerbehandlung
try {
    vielCode();
} catch (e) {
    console.log('Irgendwas ist schiefgegangen');
    // Keine Details, schwer zu debuggen
}
```

### ES6+ Features

```javascript
// Destructuring
const { breite, tiefe, hoehe } = config;
const [x, y, z] = position;

// Spread Operator
const newConfig = { ...oldConfig, breite: 5 };
const allElemente = [...elemente1, ...elemente2];

// Template Literals
const message = `Pergola: ${breite}×${tiefe}m`;
const multiline = `
    Zeile 1
    Zeile 2
`;

// Arrow Functions
const doubled = numbers.map(n => n * 2);
const filtered = items.filter(item => item.aktiv);

// Optional Chaining
const profil = config?.pfostenProfil?.bezeichnung ?? 'Standard';

// Nullish Coalescing
const hoehe = config.hoehe ?? 2.7; // Nur null/undefined, nicht 0/''
```

## 🔧 Häufige Aufgaben

### Neue Komponente hinzufügen

1. **Datei erstellen**: `src/components/MeineKomponente.js`
2. **Von Component3D erben**:
   ```javascript
   import { Component3D } from '../core/Component3D.js';
   
   export class MeineKomponente extends Component3D {
       constructor(koordinatenSystem, konfiguration) {
           super('MeineKomponente', koordinatenSystem, konfiguration);
       }
       
       create() {
           this.clear();
           // Implementierung
           return this.getGroup();
       }
   }
   ```
3. **In Pergola.js integrieren**:
   ```javascript
   import { MeineKomponente } from '../components/MeineKomponente.js';
   
   constructor() {
       // ...
       this.meineKomponente = new MeineKomponente(this.koordinatenSystem, this.konfiguration);
   }
   
   erstellePergola() {
       // ...
       const gruppe = this.meineKomponente.create();
       this.pergolaGruppe.add(gruppe);
   }
   ```

### Neue Konfigurationsoption hinzufügen

1. **In PergolaKonfiguration.js**:
   ```javascript
   gibStandardKonfiguration() {
       return {
           // ...
           meineOption: 'standard',
       };
   }
   
   validiereKonfiguration(updates) {
       // ...
       if ('meineOption' in updates) {
           const valid = ['standard', 'custom', 'premium'];
           if (valid.includes(updates.meineOption)) {
               validated.meineOption = updates.meineOption;
           }
       }
   }
   ```

2. **UI hinzufügen** in `index.html`:
   ```html
   <select id="meine-option-select" data-config-key="meineOption">
       <option value="standard">Standard</option>
       <option value="custom">Custom</option>
       <option value="premium">Premium</option>
   </select>
   ```

3. **Event-Handler** in UIController:
   ```javascript
   initSelects() {
       // ...
       this.elemente.meineOptionSelect.addEventListener('change', (e) => {
           this.aktualisiereWert('meineOption', e.target.value);
       });
   }
   ```

### Event hinzufügen

1. **In EventBus.js**:
   ```javascript
   export const EventTypes = {
       // ...
       MEIN_EVENT: 'meinEvent',
   };
   ```

2. **Event emittieren**:
   ```javascript
   import EventBus, { EventTypes } from './src/core/EventBus.js';
   
   EventBus.emit(EventTypes.MEIN_EVENT, { data: 'value' });
   ```

3. **Event empfangen**:
   ```javascript
   EventBus.on(EventTypes.MEIN_EVENT, (data) => {
       console.log('Event empfangen:', data);
   });
   ```

## 📚 Nützliche Ressourcen

### Three.js

- [Three.js Dokumentation](https://threejs.org/docs/)
- [Three.js Beispiele](https://threejs.org/examples/)
- [Three.js Forum](https://discourse.threejs.org/)

### JavaScript/ES6+

- [MDN JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [ES6 Features](http://es6-features.org/)
- [JavaScript.info](https://javascript.info/)

### Tools

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Three.js Inspector](https://chrome.google.com/webstore/detail/threejs-inspector/...)
- [VS Code](https://code.visualstudio.com/)

---

**Nächste Schritte**: Siehe [CHANGELOG.md](./CHANGELOG.md) für Änderungshistorie.
