// --- CONFIGURACIÓN DE FIREBASE ---
var firebaseConfig = {
    apiKey: "AIzaSyCJqRYt4lbsb3bOnmnDc5H6W6oJmjr1Bnc",
    authDomain: "rutawaterplus.netlify.app",
    projectId: "rutawater",
    storageBucket: "rutawater.firebasestorage.app",
    messagingSenderId: "882759838026",
    appId: "1:882759838026:web:d37117edceed063880f9b3",
    measurementId: "G-DFLM3JFKZF"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
var db = firebase.firestore();
var auth = firebase.auth();
var googleProvider = new firebase.auth.GoogleAuthProvider();

// --- PERSISTENCIA OFFLINE: datos instantáneos al recargar ---
db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
    if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
        console.error('Persistence error:', err);
    }
});

// --- CONSTANTES ---
// Productos por defecto (mismos ids/orden que la app nativa). El catálogo real
// se reconstruye desde el documento `settings` con buildProductsFromSettings().
var DEFAULT_PRODUCTS = [
    { id: 'b20', label: 'Bidón 20L', icon: '💧', short: '20L' },
    { id: 'b12', label: 'Bidón 12L', icon: '💧', short: '12L' },
    { id: 'b6', label: 'Bidón 6L', icon: '💧', short: '6L' },
    { id: 'soda', label: 'Sifón Soda', icon: '🥤', short: 'Soda' },
    { id: 'bombita', label: 'Bombita', icon: '🧴', short: 'Bomb' },
    { id: 'disp_elec_new', label: 'Disp. Elec Nuevo', icon: '🔌', short: 'ElecN' },
    { id: 'disp_elec_chg', label: 'Disp. Elec Cambio', icon: '🔌', short: 'ElecC' },
    { id: 'disp_nat', label: 'Disp. Natural', icon: '🌿', short: 'Nat' },
];
// PRODUCTS es la lista viva (built-in + custom, con renombres/emojis aplicados).
// Arranca con los defaults y se reemplaza al cargar el catálogo de Firestore.
var PRODUCTS = DEFAULT_PRODUCTS.slice();

// Stickers disponibles (mismos ids que la app nativa; imágenes en stickers/<id>.png).
var STICKER_IDS = ['bidon_foto', 'bidon_6l', 'disp_electrico', 'bombita', 'disp', 'sifon', 'guarana', 'lima', 'naranja', 'pomelo', 'uva', 'bidon', 'bidon_mini', 'dispenser', 'bottle', 'droplet', 'drop_plus', 'ice', 'soda', 'juice', 'truck', 'box', 'cart', 'leaf', 'home', 'star'];

// Relaciones familiares entre clientes (mismo formato/inversos que la app nativa).
// Se guardan en client.relationships = { [otroClienteId]: tipo }, bidireccional.
var RELATIONSHIP_TYPES = ['conyuge', 'padre_madre', 'hijo_a', 'hermano_a', 'suegro_a', 'yerno_nuera', 'abuelo_a', 'nieto_a', 'tio_a', 'sobrino_a', 'primo_a', 'cunado_a', 'otro'];
var RELATIONSHIP_LABELS = { conyuge: 'Cónyuge', padre_madre: 'Padre/Madre', hijo_a: 'Hijo/a', hermano_a: 'Hermano/a', suegro_a: 'Suegro/a', yerno_nuera: 'Yerno/Nuera', abuelo_a: 'Abuelo/a', nieto_a: 'Nieto/a', tio_a: 'Tío/a', sobrino_a: 'Sobrino/a', primo_a: 'Primo/a', cunado_a: 'Cuñado/a', otro: 'Otro' };
var RELATIONSHIP_INVERSE = { conyuge: 'conyuge', padre_madre: 'hijo_a', hijo_a: 'padre_madre', hermano_a: 'hermano_a', suegro_a: 'yerno_nuera', yerno_nuera: 'suegro_a', abuelo_a: 'nieto_a', nieto_a: 'abuelo_a', tio_a: 'sobrino_a', sobrino_a: 'tio_a', primo_a: 'primo_a', cunado_a: 'cunado_a', otro: 'otro' };

// Reconstruye PRODUCTS desde el doc `settings` (mismos campos que la nativa:
// productNames, productEmojis, customProducts, productOrder).
function buildProductsFromSettings(data) {
    data = data || {};
    var names = (data.productNames && typeof data.productNames === 'object') ? data.productNames : {};
    var emojis = (data.productEmojis && typeof data.productEmojis === 'object') ? data.productEmojis : {};
    var custom = Array.isArray(data.customProducts) ? data.customProducts : [];
    var order = Array.isArray(data.productOrder) ? data.productOrder : [];

    // El ícono puede ser un emoji directo o "sticker:<id>" (placeholder 📦 hasta implementar stickers).
    var resolveGlyph = function(val) {
        if (typeof val === 'string' && val.indexOf('sticker:') === 0) {
            return { icon: '📦', sticker: val.slice('sticker:'.length) };
        }
        return { icon: val, sticker: null };
    };

    var base = DEFAULT_PRODUCTS.map(function(p) { return { id: p.id, label: p.label, baseEmoji: p.icon, short: p.short }; })
        .concat(custom.filter(function(cp) { return cp && cp.id; }).map(function(cp) {
            return { id: cp.id, label: cp.label || '', baseEmoji: (cp.emoji || cp.icon || '📦'), short: cp.short || (cp.label || '').slice(0, 12) };
        }));

    var withOverrides = base.map(function(p) {
        var label = (names[p.id] != null) ? names[p.id] : p.label;
        var rawEmoji = (emojis[p.id] != null) ? emojis[p.id] : p.baseEmoji;
        var g = resolveGlyph(rawEmoji);
        return { id: p.id, label: label, icon: g.icon, sticker: g.sticker, short: p.short };
    });

    var ranked = order.map(function(id) { return withOverrides.filter(function(p) { return p.id === id; })[0]; }).filter(Boolean);
    var rest = withOverrides.filter(function(p) { return order.indexOf(p.id) === -1; });
    PRODUCTS = ranked.concat(rest);
}
