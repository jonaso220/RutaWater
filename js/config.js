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
var PRODUCTS = [
    { id: 'b20', label: '20L', icon: '💧', short: '20L' },
    { id: 'b12', label: '12L', icon: '💧', short: '12L' },
    { id: 'b6', label: '6L', icon: '💧', short: '6L' },
    { id: 'soda', label: 'Soda', icon: '🍾', short: 'Soda' },
    { id: 'bombita', label: 'Bombita', icon: '🖐️', short: 'Bomb' },
    { id: 'disp_elec_new', label: 'Disp. Elec Nuevo', icon: '⚡', short: 'ElecN' },
    { id: 'disp_elec_chg', label: 'Disp. Elec Cambio', icon: '⚡', short: 'ElecC' },
    { id: 'disp_nat', label: 'Disp. Natural', icon: '🍃', short: 'Nat' },
];
