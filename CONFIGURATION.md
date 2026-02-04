# Konfigurationssystem

Diese Dokumentation beschreibt das Konfigurationssystem des Pergola-Konfigurators.

## 📋 Übersicht

Das Konfigurationssystem besteht aus drei Hauptklassen:

1. **PergolaKonfiguration** - Zentrale Konfigurationsverwaltung
2. **ProfileKonfiguration** - Profil-Management und -Optimierung
3. **SpannweitenKonfiguration** - Zulässige Spannweiten pro Profil

## 🏗️ PergolaKonfiguration

**Datei**: `src/config/PergolaKonfiguration.js`

### Verantwortung

- Verwaltet alle Konfigurationsparameter
- Validiert Eingaben
- Benachrichtigt über Änderungen
- Stellt Standard-Werte bereit

### Standard-Konfiguration

```javascript
gibStandardKonfiguration() {
    return {
        // Abmessungen
        breite: 4,                    // Meter
        tiefe: 3,                     // Meter
        hoehe: 2.7,                   // Meter
        neigung: 3,                   // Grad

        // Typ & Material
        typ: "freistehend",           // oder "wandanbau"
        material: "aluminium",        // oder "holz", "stahl"
        farbe: "ral7016",            // RAL-Farbe
        ncsFarbe: null,              // Optional: NCS-Farbe

        // Dach
        dach: "glas",                // Legacy
        dachTyp: "glas",             // "glas", "epdm", "polycarbonat"
        dachForm: "pultdach",        // "pultdach", "flachdach"
        epdmFarbe: "schwarz",        // EPDM-Farbe
        glasTyp: "klar",             // Legacy
        glasFarbe: "klar",           // "klar", "grau", "bronze", "milchig"

        // Seiten
        seiten: "keine",             // "keine", "links", "rechts", "beide"

        // Features
        beleuchtung: false,
        heizung: false,
        sensoren: false,

        // Terrassenplatten
        terrassenplatten: true,
        terrassenplattenTyp: "naturstein",
        terrassenplattenTextur: "stein",
        terrassenplattenGroesse: 0.6,      // Meter
        terrassenplattenErweiterung: 1.5,  // Meter über Pergola hinaus

        // Outdoor-Möbel
        outdoorMoebel: false,

        // Carport-Modus
        carportModus: false,
        carportSegmente: [],

        // Regenwasser
        regenwasserAbfluss: "rinne",  // "rinne", "fallrohr"

        // Pfosten-Konfiguration
        pfostenVersaetze: {
            vorne: 0,                // Meter
            hinten: 0                // Meter
        },
        pfostenKuerzung: {
            vorne: 0,                // Meter
            hinten: 0,               // Meter
            mitte: 0                 // Meter
        },
        pfostenAktiv: {
            vorne: true,
            hinten: true
        },
        zentralerMittelpfosten: false,
        zwischenpfostenBreite: false,
        zwischenpfostenTiefe: false,
        zwischenpfostenProfil: "120x80x4_mittel",

        // Kopfbänder
        kopfbaenderAktiv: false,
        kopfbaenderPosition: "ecken",  // "ecken", "alle"
        kopfbaenderWinkel: 45,         // Grad

        // Befestigung
        befestigung: "ankerplatte",    // "ankerplatte", "pfostenschuh"

        // Profile
        pfostenProfil: "160x80x4",
        profilKonfiguration: {
            standardProfile: true,
            profilTyp: "standard"
        }
    };
}
```

### API

#### Konfiguration abrufen

```javascript
const config = konfiguration.gibAktuelleKonfiguration();
```

#### Konfiguration aktualisieren

```javascript
konfiguration.aktualisiereKonfiguration({
    breite: 5,
    tiefe: 4,
    zentralerMittelpfosten: true
});
```

#### Einzelwerte abrufen

```javascript
const breite = konfiguration.gibBreite();
const tiefe = konfiguration.gibTiefe();
const hoehe = konfiguration.gibHoehe();
const farbe = konfiguration.gibFarbe();
```

#### Standard wiederherstellen

```javascript
konfiguration.setzeStandard();
```

### Validierung

Die `validiereKonfiguration()` Methode prüft und sanitisiert alle Eingaben:

#### Zahlen-Validierung

```javascript
parseNumber(value) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
}

clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
```

#### Dimensionen

```javascript
// Breite: 2.5m - 10m
if ('breite' in updates) {
    const breite = parseNumber(updates.breite);
    if (breite !== null) {
        validated.breite = clamp(breite, 2.5, 10);
    }
}

// Tiefe: 2m - 8m
if ('tiefe' in updates) {
    const tiefe = parseNumber(updates.tiefe);
    if (tiefe !== null) {
        validated.tiefe = clamp(tiefe, 2, 8);
    }
}

// Höhe: 2m - 4m
if ('hoehe' in updates) {
    const hoehe = parseNumber(updates.hoehe);
    if (hoehe !== null) {
        validated.hoehe = clamp(hoehe, 2, 4);
    }
}

// Neigung: 0° - 15°
if ('neigung' in updates) {
    const neigung = parseNumber(updates.neigung);
    if (neigung !== null) {
        validated.neigung = clamp(neigung, 0, 15);
    }
}
```

#### Pfosten-Versätze

```javascript
// Pfosten-Versätze validieren
if ('pfostenVersaetze' in updates) {
    validated.pfostenVersaetze = sanitizeVersatz(updates.pfostenVersaetze);
}

function sanitizeVersatz(versatz) {
    const result = {};
    
    Object.entries(versatz).forEach(([pfostenId, data]) => {
        const normalized = normalizePostId(pfostenId);
        const isCenter = normalized.includes('mitte');
        
        // Mittelpfosten: -1.5m bis +1.5m
        // Andere: 0m bis +1.5m
        const minDefault = isCenter ? -1.5 : 0;
        const maxDefault = 1.5;
        
        if (typeof data === 'object') {
            const achse = data.achse || 'x';
            const wert = parseNumber(data.wert);
            if (wert !== null) {
                result[pfostenId] = {
                    achse: achse,
                    wert: clamp(wert, minDefault, maxDefault)
                };
            }
        } else {
            const wert = parseNumber(data);
            if (wert !== null) {
                result[pfostenId] = clamp(wert, minDefault, maxDefault);
            }
        }
    });
    
    return result;
}
```

#### Pfosten-Kürzung

```javascript
// Pfosten-Kürzung validieren
if ('pfostenKuerzung' in updates) {
    const config = this.gibAktuelleKonfiguration();
    const maxKuerzung = config.hoehe * 0.5; // Max 50% der Höhe
    
    validated.pfostenKuerzung = {
        vorne: clamp(updates.pfostenKuerzung.vorne || 0, 0, maxKuerzung),
        hinten: clamp(updates.pfostenKuerzung.hinten || 0, 0, maxKuerzung),
        mitte: clamp(updates.pfostenKuerzung.mitte || 0, 0, maxKuerzung)
    };
}
```

#### Enum-Validierung

```javascript
const VALID_TYPEN = ['freistehend', 'wandanbau'];
const VALID_MATERIALIEN = ['aluminium', 'holz', 'stahl'];
const VALID_DACHTYPEN = ['glas', 'epdm', 'polycarbonat', 'keine'];
const VALID_GLASFARBEN = ['klar', 'grau', 'bronze', 'milchig'];
const VALID_BEFESTIGUNGEN = ['ankerplatte', 'pfostenschuh', 'bodenverankerung'];

if ('typ' in updates && VALID_TYPEN.includes(updates.typ)) {
    validated.typ = updates.typ;
}

if ('dachTyp' in updates && VALID_DACHTYPEN.includes(updates.dachTyp)) {
    validated.dachTyp = updates.dachTyp;
}
```

### Change Notification

Nach erfolgreicher Validierung wird ein Event emittiert:

```javascript
benachrichtigeAenderung() {
    // Custom Event
    const event = new CustomEvent('pergolaKonfigurationGeaendert', {
        detail: this.aktuelleKonfiguration
    });
    document.dispatchEvent(event);

    // EventBus (moderne Variante)
    EventBus.emit(EventTypes.CONFIG_CHANGED, this.aktuelleKonfiguration);
}
```

## 🎯 ProfileKonfiguration

**Datei**: `src/config/ProfileKonfiguration.js`

### Verantwortung

- Verwaltet verfügbare Aluminiumprofile
- Optimiert Profile basierend auf Statik
- Stellt Profil-Informationen bereit

### Profil-Bibliothek

```javascript
PROFILE = {
    // Pfosten-Profile
    '160x80x4': {
        bezeichnung: '160x80x4mm',
        breite: 0.16,
        hoehe: 0.08,
        wandstaerke: 0.004,
        typ: 'pfosten',
        kategorie: 'standard',
        maxSpannweite: 4.5,
        gewicht: 5.2  // kg/m
    },
    '200x120x6': {
        bezeichnung: '200x120x6mm',
        breite: 0.20,
        hoehe: 0.12,
        wandstaerke: 0.006,
        typ: 'pfosten',
        kategorie: 'verstärkt',
        maxSpannweite: 6.0,
        gewicht: 9.8  // kg/m
    },

    // Träger-Profile
    '120x80x4_mittel': {
        bezeichnung: '120x80x4mm',
        breite: 0.12,
        hoehe: 0.08,
        wandstaerke: 0.004,
        typ: 'traeger',
        kategorie: 'mittel',
        maxSpannweite: 3.5,
        gewicht: 3.8  // kg/m
    },
    
    // Weitere Profile...
};
```

### Profil-Optimierung

Die `optimiereProfileFuerGroesse()` Methode wählt automatisch die optimalen Profile basierend auf den Abmessungen:

```javascript
optimiereProfileFuerGroesse(breite, tiefe, mittelpfosten = false) {
    const maxSpannweite = Math.max(breite, tiefe);
    
    // Logik-Tabelle
    if (maxSpannweite <= 4.5) {
        // Kleine Pergola
        if (!mittelpfosten) {
            return {
                pfosten: '160x80x4',
                laengstraeger: '160x80x4',
                quertraeger: '160x80x4',
                mittelpfosten: null
            };
        } else {
            return {
                pfosten: '160x80x4',
                laengstraeger: '160x80x4',
                quertraeger: '160x80x4',
                mittelpfosten: '120x80x4_mittel'
            };
        }
    } else if (maxSpannweite <= 6.0) {
        // Mittlere Pergola
        if (!mittelpfosten) {
            // WARNUNG: Konstruktiv problematisch!
            return {
                pfosten: '200x120x6',
                laengstraeger: '200x120x6',
                quertraeger: '200x120x6',
                mittelpfosten: null
            };
        } else {
            return {
                pfosten: '200x120x6',
                laengstraeger: '200x120x6',
                quertraeger: '160x80x4',
                mittelpfosten: '160x80x4'
            };
        }
    } else {
        // Große Pergola
        return {
            pfosten: '200x120x6',
            laengstraeger: '200x120x6',
            quertraeger: '200x120x6',
            mittelpfosten: '200x120x6'
        };
    }
}
```

### Profil-Informationen

```javascript
// Profil-Objekt abrufen
const profil = profileKonfig.gibProfil('160x80x4');

// Dimensionen
const breite = profileKonfig.gibProfilBreite('160x80x4');
const hoehe = profileKonfig.gibProfilHoehe('160x80x4');
const wandstaerke = profileKonfig.gibProfilWandstaerke('160x80x4');

// Spannweite
const maxSpannweite = profileKonfig.gibMaxSpannweite('160x80x4');

// Gewicht
const gewicht = profileKonfig.gibProfilGewicht('160x80x4');
```

### Aktuelles Profil setzen

```javascript
// Profil für alle Komponenten setzen
profileKonfig.setzeAktuellesProfil('200x120x6');

// Aktuelles Profil abrufen
const aktuellesProfil = profileKonfig.gibAktuellesProfil();
```

## 📏 SpannweitenKonfiguration

**Datei**: `src/config/SpannweitenKonfiguration.js`

### Verantwortung

- Definiert zulässige Spannweiten pro Profil
- Berücksichtigt Mittelpfosten
- Prüft statische Zulässigkeit

### Spannweiten-Tabelle

```javascript
SPANNWEITEN = {
    '160x80x4': {
        max: 4.5,              // Meter ohne Mittelpfosten
        mitMittelpfosten: 7.0, // Meter mit Mittelpfosten
        empfohlen: 4.0         // Empfohlene max. Spannweite
    },
    '200x120x6': {
        max: 6.0,
        mitMittelpfosten: 9.0,
        empfohlen: 5.5
    },
    '120x80x4_mittel': {
        max: 3.5,
        mitMittelpfosten: 5.0,
        empfohlen: 3.0
    }
};
```

### API

```javascript
// Maximale Spannweite prüfen
const istZulaessig = spannweitenKonfig.istSpannweiteZulaessig(
    '160x80x4',
    4.5,
    false  // mit Mittelpfosten
);

// Empfohlene Spannweite
const empfohlen = spannweitenKonfig.gibEmpfohleneSpannweite('160x80x4');

// Benötigt Mittelpfosten?
const brauchtMittelpfosten = spannweitenKonfig.benoetigtMittelpfosten(
    '160x80x4',
    5.0
);
```

## 🔄 Konfigurations-Updates

### Ablauf

```
User Input (UI)
    │
    ▼
UIController.aktualisiereWert(key, value)
    │
    ▼
PergolaKonfiguration.aktualisiereKonfiguration({ key: value })
    │
    ├─► validiereKonfiguration()
    │   ├─► Zahlen parsen
    │   ├─► Grenzen prüfen
    │   ├─► Enums validieren
    │   └─► Sanitisieren
    │
    ├─► this.aktuelleKonfiguration = { ...old, ...validated }
    │
    └─► benachrichtigeAenderung()
        ├─► document.dispatchEvent('pergolaKonfigurationGeaendert')
        └─► EventBus.emit(CONFIG_CHANGED)
```

### Event-Handler

```javascript
// Listener registrieren
EventBus.on(EventTypes.CONFIG_CHANGED, (config) => {
    console.log('Konfiguration geändert:', config);
    
    // UI aktualisieren
    uiController.onKonfigurationGeaendert();
    
    // 3D-Szene aktualisieren
    pergola.aufKonfigurationsAenderungReagieren(config);
});
```

## 💾 Persistenz

### LocalStorage

```javascript
// Konfiguration speichern
StorageService.saveConfig(config);

// Konfiguration laden
const savedConfig = StorageService.loadConfig();

// Auf Konfiguration anwenden
if (savedConfig) {
    konfiguration.aktualisiereKonfiguration(savedConfig);
}
```

### URL-Parameter

```javascript
// In URL kodieren
const shareLink = new ShareLink();
const url = shareLink.generateShareLink(config);
// Ergebnis: ?config=eyJicmVpdGUiOjUsInRpZWZlIjo0fQ

// Aus URL laden
const configFromUrl = shareLink.parseUrlConfig();
if (configFromUrl) {
    konfiguration.aktualisiereKonfiguration(configFromUrl);
}
```

## 🎛️ Default-Werte

### Standard-Werte wiederherstellen

```javascript
// Alle Werte zurücksetzen
konfiguration.setzeStandard();

// Einzelnen Wert zurücksetzen
konfiguration.aktualisiereKonfiguration({
    breite: konfiguration.gibStandardKonfiguration().breite
});
```

### Bedingte Defaults

Einige Defaults hängen von anderen Werten ab:

```javascript
// Mittelpfosten automatisch aktivieren bei großer Pergola
if (breite > 4.5 || tiefe > 4.5) {
    konfiguration.aktualisiereKonfiguration({
        zentralerMittelpfosten: true
    });
}

// Zwischenpfosten deaktivieren bei Carport
if (carportModus) {
    konfiguration.aktualisiereKonfiguration({
        zwischenpfostenBreite: false,
        zwischenpfostenTiefe: false
    });
}
```

## 🔒 Validierungs-Regeln

### Dimensionen

| Parameter | Min | Max | Standard | Einheit |
|-----------|-----|-----|----------|---------|
| breite | 2.5 | 10 | 4 | m |
| tiefe | 2 | 8 | 3 | m |
| hoehe | 2 | 4 | 2.7 | m |
| neigung | 0 | 15 | 3 | ° |

### Pfosten-Versätze

| Parameter | Min | Max | Standard | Einheit |
|-----------|-----|-----|----------|---------|
| vorne | 0 | 1.5 | 0 | m |
| hinten | 0 | 1.5 | 0 | m |
| mitte | -1.5 | 1.5 | 0 | m |

### Pfosten-Kürzung

| Parameter | Min | Max | Einheit |
|-----------|-----|-----|---------|
| vorne | 0 | hoehe × 0.5 | m |
| hinten | 0 | hoehe × 0.5 | m |
| mitte | 0 | hoehe × 0.5 | m |

### Terrassenplatten

| Parameter | Min | Max | Standard | Einheit |
|-----------|-----|-----|----------|---------|
| groesse | 0.3 | 1.2 | 0.6 | m |
| erweiterung | 0 | 3 | 1.5 | m |

## 🧪 Beispiele

### Einfache Pergola

```javascript
konfiguration.aktualisiereKonfiguration({
    breite: 4,
    tiefe: 3,
    hoehe: 2.7,
    typ: 'freistehend',
    material: 'aluminium',
    farbe: 'ral7016',
    dachTyp: 'glas',
    glasFarbe: 'klar',
    zentralerMittelpfosten: false
});
```

### Große Pergola mit Mittelpfosten

```javascript
konfiguration.aktualisiereKonfiguration({
    breite: 6,
    tiefe: 5,
    hoehe: 2.8,
    zentralerMittelpfosten: true,
    pfostenProfil: '200x120x6',
    kopfbaenderAktiv: true,
    kopfbaenderPosition: 'alle'
});
```

### Carport-Konfiguration

```javascript
konfiguration.aktualisiereKonfiguration({
    breite: 5,
    tiefe: 6,
    carportModus: true,
    dachTyp: 'epdm',
    epdmFarbe: 'schwarz',
    terrassenplatten: false,
    befestigung: 'bodenverankerung'
});
```

### Wandanbau

```javascript
konfiguration.aktualisiereKonfiguration({
    breite: 4,
    tiefe: 2.5,
    typ: 'wandanbau',
    pfostenAktiv: {
        vorne: true,
        hinten: false  // Keine hinteren Pfosten bei Wandanbau
    },
    regenwasserAbfluss: 'rinne'
});
```

---

**Nächste Schritte**: Siehe [UI.md](./UI.md) für UI-Controller und Event-System.
