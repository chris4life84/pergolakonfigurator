/**
 * ShareLink - Kodiert und dekodiert Konfigurationen in URL-Parameter
 */
export class ShareLink {
    constructor() {
        this.VERSION = '1'; // Version für zukünftige Kompatibilität
    }

    /**
     * Kodiert die Konfiguration in einen komprimierten Base64-String
     */
    encodeConfig(config) {
        try {
            // Nur relevante Felder extrahieren
            const essentialConfig = {
                v: this.VERSION,
                b: config.breite,
                t: config.tiefe,
                h: config.hoehe,
                n: config.neigung,
                typ: config.typ,
                mat: config.material,
                farbe: config.farbe,
                ncs: config.ncsFarbe,
                pp: config.pfostenProfil,
                pv: config.pfostenVersaetze,
                pk: config.pfostenKuerzung,
                pa: config.pfostenAktiv,
                zmp: config.zentralerMittelpfosten ? 1 : 0,
                zpb: config.zwischenpfostenBreite ? 1 : 0,
                zpt: config.zwischenpfostenTiefe ? 1 : 0,
                bef: config.befestigung,
                rwa: config.regenwasserAbfluss,
                dt: config.dachTyp,
                df: config.dachForm,
                ef: config.epdmFarbe,
                gt: config.glasTyp,
                gf: config.glasFarbe,
                cm: config.carportModus ? 1 : 0
            };

            // Carport-Segmente hinzufügen, falls vorhanden
            if (config.carportModus && config.carportSegmente && config.carportSegmente.length > 0) {
                essentialConfig.cs = config.carportSegmente.map(seg => ({
                    i: seg.id,
                    b: seg.breite,
                    t: seg.tiefe,
                    h: seg.hoehe,
                    x: seg.x,
                    z: seg.z,
                    r: seg.rotation,
                    n: seg.neigung,
                    zpb: seg.zwischenpfostenBreite ? 1 : 0,
                    zpt: seg.zwischenpfostenTiefe ? 1 : 0
                }));
            }

            // JSON zu String und dann Base64
            const jsonStr = JSON.stringify(essentialConfig);
            const base64 = btoa(encodeURIComponent(jsonStr));
            
            return base64;
        } catch (error) {
            console.error('Fehler beim Kodieren der Konfiguration:', error);
            return null;
        }
    }

    /**
     * Dekodiert einen Base64-String zurück zur Konfiguration
     */
    decodeConfig(base64String) {
        try {
            const jsonStr = decodeURIComponent(atob(base64String));
            const compressed = JSON.parse(jsonStr);

            // Zurück zu Langform expandieren
            const config = {
                breite: compressed.b || 4,
                tiefe: compressed.t || 3,
                hoehe: compressed.h || 2.5,
                neigung: compressed.n || 3,
                typ: compressed.typ || 'freistehend',
                material: compressed.mat || 'aluminium',
                farbe: compressed.farbe || 'ral7016',
                ncsFarbe: compressed.ncs || null,
                pfostenProfil: compressed.pp || '160x80x4',
                pfostenVersaetze: compressed.pv || { vorne: 0, hinten: 0 },
                pfostenKuerzung: compressed.pk || { vorne: 0, hinten: 0, mitte: 0 },
                pfostenAktiv: compressed.pa || { vorne: true, hinten: true },
                zentralerMittelpfosten: compressed.zmp === 1,
                zwischenpfostenBreite: compressed.zpb === 1,
                zwischenpfostenTiefe: compressed.zpt === 1,
                befestigung: compressed.bef || 'ankerplatte',
                regenwasserAbfluss: compressed.rwa || 'rinne',
                dachTyp: compressed.dt || 'glas',
                dachForm: compressed.df || 'pultdach',
                epdmFarbe: compressed.ef || 'schwarz',
                glasTyp: compressed.gt || 'klar',
                glasFarbe: compressed.gf || 'klar',
                carportModus: compressed.cm === 1,
                carportSegmente: []
            };

            // Carport-Segmente expandieren
            if (compressed.cs && Array.isArray(compressed.cs)) {
                config.carportSegmente = compressed.cs.map(seg => ({
                    id: seg.i,
                    breite: seg.b,
                    tiefe: seg.t,
                    hoehe: seg.h,
                    x: seg.x,
                    z: seg.z,
                    rotation: seg.r,
                    neigung: seg.n,
                    zwischenpfostenBreite: seg.zpb === 1,
                    zwischenpfostenTiefe: seg.zpt === 1
                }));
            }

            return config;
        } catch (error) {
            console.error('Fehler beim Dekodieren der Konfiguration:', error);
            return null;
        }
    }

    /**
     * Erstellt eine vollständige Share-URL
     */
    createShareUrl(config) {
        const encoded = this.encodeConfig(config);
        if (!encoded) return null;

        const url = new URL(window.location.href);
        url.searchParams.set('config', encoded);
        return url.toString();
    }

    /**
     * Liest Konfiguration aus URL-Parametern
     */
    loadFromUrl() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const configParam = urlParams.get('config');
            
            if (!configParam) return null;

            return this.decodeConfig(configParam);
        } catch (error) {
            console.error('Fehler beim Laden der Konfiguration aus URL:', error);
            return null;
        }
    }
}
