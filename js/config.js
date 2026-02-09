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

// --- PERSISTENCIA OFFLINE ---
db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
    if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
        console.error('Persistence error:', err);
    }
});

// --- SERVICIOS POR DEFECTO ---
var DEFAULT_SERVICES = [
    { id: 'esculpidas', nombre: 'Uñas Esculpidas', duracion: 120, precio: 15000, color: '#e91e63', activo: true },
    { id: 'capping', nombre: 'Capping', duracion: 90, precio: 12000, color: '#9c27b0', activo: true },
    { id: 'softgel', nombre: 'Soft Gel', duracion: 90, precio: 13000, color: '#f06292', activo: true },
];

// --- HORARIO SEMANAL POR DEFECTO (0=Dom, 1=Lun, ... 6=Sáb) ---
var DEFAULT_SCHEDULE = {
    0: { habilitado: false, inicio: '09:00', fin: '18:00' },
    1: { habilitado: true,  inicio: '09:00', fin: '18:00' },
    2: { habilitado: true,  inicio: '09:00', fin: '18:00' },
    3: { habilitado: true,  inicio: '09:00', fin: '18:00' },
    4: { habilitado: true,  inicio: '09:00', fin: '18:00' },
    5: { habilitado: true,  inicio: '09:00', fin: '18:00' },
    6: { habilitado: true,  inicio: '09:00', fin: '13:00' },
};

var DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
var DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
var MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// --- COLECCIÓN DE FIRESTORE ---
var COL_APPOINTMENTS = 'appointments';
var COL_SERVICES = 'services';
var COL_TIMEOFF = 'timeoff';
var DOC_SCHEDULE = 'config/schedule';
var DOC_SETTINGS = 'config/settings';

// --- ADMIN EMAIL (se configura al primer login) ---
var ADMIN_EMAIL = null;
