/**
 * Zentrale Konstanten für den Pergola-Konfigurator
 * Eliminiert Magic Strings und Magic Numbers im gesamten Projekt
 */

// ============================================================================
// KONFIGURATION
// ============================================================================

export const CONFIG = {
    DEBUG_FLAG: 'pergolaDebug',
    DEBUG_URL_PARAM: 'debug',
    SHARE_URL_PARAM: 'share',
    TARGET_URL_PARAM: 'target',
    INITIALIZATION_DELAY: 500,
    TARGET_INTERN: 'intern'
};

// ============================================================================
// PROPERTY NAMES (Konfigurationseigenschaften)
// ============================================================================

export const PROPERTY_NAMES = {
    WIDTH: 'breite',
    DEPTH: 'tiefe',
    HEIGHT: 'hoehe',
    SLOPE: 'neigung',
    COLOR: 'farbe',
    MATERIAL: 'material',
    POST_PROFILE: 'pfostenProfil',
    ROOF_TYPE: 'dachTyp',
    TYPE: 'typ'
};

// ============================================================================
// COMPONENT NAMES
// ============================================================================

export const COMPONENT_NAMES = {
    PFOSTEN: 'pfosten',
    LAENGSTRAEGER: 'laengstraeger',
    QUERTRAEGER: 'quertraeger',
    KOPFBAENDER: 'kopfbaender',
    GLAESER: 'glaeser',
    BEFESTIGUNG: 'befestigung',
    BEMASSUNG: 'bemassung',
    TERRASSENPLATTEN: 'terrassenplatten',
    OUTDOOR_MOEBEL: 'outdoorMoebel'
};

// ============================================================================
// ROOF TYPES
// ============================================================================

export const ROOF_TYPES = {
    GLAS: 'glas',
    EPDM: 'epdm'
};

export const PERGOLA_TYPES = {
    FREISTEHEND: 'freistehend',
    WANDANSCHLUSS: 'wandanschluss'
};

// ============================================================================
// CSS CLASSES
// ============================================================================

export const CSS_CLASSES = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    DISABLED: 'disabled',
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
    SELECTED: 'selected',
    ERROR: 'error',
    WARNING: 'warning'
};

// ============================================================================
// DOM SELECTORS
// ============================================================================

export const DOM_SELECTORS = {
    CANVAS: 'pergola-canvas',
    ERROR_CONTAINER: 'error-container',
    WIDTH_INPUT: 'width',
    DEPTH_INPUT: 'depth',
    HEIGHT_INPUT: 'height',
    SLOPE_INPUT: 'slope'
};

// ============================================================================
// EVENTS
// ============================================================================

export const EVENTS = {
    CONFIGURATION_CHANGED: 'pergolaKonfigurationGeaendert',
    STRUCTURE_UPDATED: 'pergolaStrukturAktualisiert',
    STATICS_ACTION: 'staticsAction',
    PROFILE_CHANGE: 'profilAenderung',
    STEPPER_CHANGED: 'stepperChanged',
    COLOR_CHANGE: 'farbWechsel',
    DIMENSION_CHANGE: 'dimensionsAenderung'
};

// ============================================================================
// FARBPALETTE (aus MaterialManager extrahiert)
// ============================================================================

export const COLOR_PALETTE = {
    // RAL Farben
    ral7016: '#1f1f22',
    ral9006: '#a0a0a0',
    ral9016: '#ffffff',
    ral6005: '#2f4538',
    ral3004: '#722f37',
    ral9005: '#0a0a0a',
    ral7035: '#d7d7d7',
    ral8017: '#45241c',
    ral5010: '#0e4c8c',
    // NCS Farben
    'ncs-s0500-n': '#E6E8E8',
    'ncs-s2005-g': '#B9C1BC',
    'ncs-s3020-b': '#3F5E74',
    'ncs-s2050-y80r': '#B74E2E',
    'ncs-s3060-g10y': '#2F7040',
    'ncs-s8500-n': '#1b1b1b',
    'ncs-s7020-b': '#1a3a52',
    'ncs-s3030-y20r': '#d68c3a',
    'ncs-s8505-y20r': '#2d2520',
    'ncs-s4050-g': '#00794d',
    // Default
    default: '#a0a0a0'
};

// ============================================================================
// MATERIAL PARAMETER
// ============================================================================

export const MATERIAL_PARAMS = {
    aluminium: {
        roughness: 0.35,
        metalness: 0.4,
        envMapIntensity: 0.75
    },
    holz: {
        roughness: 0.85,
        metalness: 0.04,
        envMapIntensity: 0
    },
    default: {
        roughness: 0.4,
        metalness: 0.3,
        envMapIntensity: 0.6
    }
};

// ============================================================================
// PROFILE KONFIGURATION
// ============================================================================

export const PROFILE_DIMENSIONS = {
    '100x100x3': { width: 0.10, height: 0.10, thickness: 0.003 },
    '120x120x4': { width: 0.12, height: 0.12, thickness: 0.004 },
    '150x150x5': { width: 0.15, height: 0.15, thickness: 0.005 },
    '200x100x4': { width: 0.20, height: 0.10, thickness: 0.004 }
};

// ============================================================================
// RENDERING CONSTANTS
// ============================================================================

export const RENDER_CONFIG = {
    SHADOW_MAP_SIZE: 4096,
    SHADOW_BOUNDS: { left: -15, right: 15, top: 15, bottom: -15 },
    CAMERA: {
        MOBILE: { fov: 88, position: [2.2, 0.8, 2.2], lookAt: [1.8, 1.8, 0.2] },
        DESKTOP: { fov: 75, position: [1.35, 0.45, 1.35], lookAt: [1.8, 1.85, 0] }
    },
    MAIN_LIGHT: {
        position: [25, 25, 55],
        intensity: 1.0
    }
};

// ============================================================================
// GEOMETRY CONSTANTS
// ============================================================================

export const GEOMETRY = {
    EPSILON: 0.001,
    OFFSET_SMALL: 0.005,
    OFFSET_MEDIUM: 0.01,
    POLYGON_OFFSET_UNITS: 0.0005
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULTS = {
    WIDTH: 4,
    DEPTH: 3,
    HEIGHT: 2.5,
    SLOPE: 2,
    COLOR: 'ral7016',
    MATERIAL: 'aluminium'
};
