# Pergola Konfigurator

Ein interaktiver 3D-Konfigurator für Pergola- und Carport-Strukturen mit Echtzeit-Visualisierung und Statik-Prüfung.

## 🎯 Projektübersicht

Der Pergola Konfigurator ermöglicht es Benutzern, maßgeschneiderte Pergola- und Carport-Konstruktionen zu planen und zu visualisieren. Die Anwendung bietet:

- **3D-Echtzeit-Rendering** mit Three.js
- **Interaktive Konfiguration** von Abmessungen, Materialien und Farben
- **Automatische Statik-Prüfung** und Profil-Optimierung
- **Visuelle Bemaßung** und Koordinatensystem
- **Preisberechnung** in Echtzeit
- **URL-basiertes Teilen** von Konfigurationen
- **Responsive Design** für Desktop und Mobile

## 🚀 Quick Start

### Installation

1. Repository klonen:
```bash
git clone [repository-url]
cd pergolakonfigurator
```

2. Lokalen Server starten:
```bash
python -m http.server 8000
```

3. Browser öffnen:
```
http://localhost:8000
```

### Verwendung

1. Öffnen Sie die Anwendung im Browser
2. Konfigurieren Sie die Pergola über die UI-Controls:
   - Abmessungen (Breite, Tiefe, Höhe)
   - Material und Farbe
   - Dachtyp und -form
   - Zusätzliche Features (Terrassenplatten, Möbel, etc.)
3. Die 3D-Ansicht aktualisiert sich automatisch
4. Teilen Sie Ihre Konfiguration über den Share-Button

## 🛠️ Technologie-Stack

- **Three.js** - 3D-Rendering Engine
- **Vanilla JavaScript** (ES6+ Module)
- **HTML5 Canvas** für Rendering
- **CSS3** für UI-Styling
- **localStorage** für Persistenz

### Kern-Libraries

- `three.min.js` - 3D-Grafik-Engine
- `OrbitControls.js` - Kamera-Steuerung
- `GLTFLoader.js` - 3D-Modell-Loader
- `RGBELoader.js` / `EXRLoader.js` - HDR-Environment-Maps

## 📁 Projektstruktur

```
pergolakonfigurator/
├── index.html              # Haupt-HTML-Datei
├── main.js                 # Einstiegspunkt
├── css/                    # Stylesheets
├── src/
│   ├── components/         # 3D-Komponenten (Pfosten, Träger, etc.)
│   ├── config/            # Konfigurationsklassen
│   ├── core/              # Kern-System (Rendering, Events, Services)
│   ├── data/              # Daten (Preise, etc.)
│   ├── loaders/           # Asset-Loader
│   ├── shaders/           # Custom Shader
│   ├── ui/                # UI-Controller
│   └── utils/             # Hilfsfunktionen
└── textures/              # Texturen und Assets
```

## 📚 Dokumentation

Detaillierte Dokumentation zu spezifischen Aspekten:

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - System-Architektur, Patterns und Datenfluss
- [**COMPONENTS.md**](./COMPONENTS.md) - 3D-Komponenten und Component3D API
- [**CONFIGURATION.md**](./CONFIGURATION.md) - Konfigurationssystem und Validierung
- [**UI.md**](./UI.md) - UI-Controller und Event-System
- [**DEVELOPMENT.md**](./DEVELOPMENT.md) - Entwickler-Guide und Best Practices
- [**CHANGELOG.md**](./CHANGELOG.md) - Änderungshistorie und Migrationshinweise

## 🔑 Key Features

### Service Registry Pattern
Zentrale Verwaltung aller Services ohne globale Variablen:
```javascript
import { getKonfigurator, getRenderEngine } from './src/core/ServiceRegistry.js';

const konfigurator = getKonfigurator();
const renderEngine = getRenderEngine();
```

### Event-Driven Architecture
Typisiertes Event-System für lose Kopplung:
```javascript
import EventBus, { EventTypes } from './src/core/EventBus.js';

EventBus.on(EventTypes.CONFIG_CHANGED, (data) => {
    // Handle configuration change
});
```

### Component3D Base Class
Gemeinsame Basis für alle 3D-Komponenten mit standardisiertem API:
```javascript
class MyComponent extends Component3D {
    create() {
        // Implementierung
    }
}
```

### Profil-Optimierung
Automatische Auswahl der optimalen Profile basierend auf Statik:
```javascript
profileKonfig.optimiereProfileFuerGroesse(breite, tiefe, mittelpfosten);
```

## 🐛 Debug-Modus

Debug-Modus aktivieren für detaillierte Logs:
```javascript
localStorage.setItem('pergola_debug', 'true');
// Oder in der Console:
window.setDebugMode(true);
```

## 🤝 Beitragen

Siehe [DEVELOPMENT.md](./DEVELOPMENT.md) für Code-Konventionen und Entwickler-Richtlinien.

## 📄 Lizenz

[Lizenz-Information hier einfügen]

## 📧 Kontakt

[Kontakt-Information hier einfügen]

---

**Version**: 2.0 (Refactored)  
**Letzte Aktualisierung**: Februar 2026
