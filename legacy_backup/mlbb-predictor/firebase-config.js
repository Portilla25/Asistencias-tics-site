// ----------------------------------------------------
// Configuración de Firebase
// ----------------------------------------------------
// TODO: Reemplaza este objeto con la configuración real de tu proyecto de Firebase
// Ve a la Consola de Firebase > Configuración del Proyecto > General > Tus aplicaciones
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "TUS_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase inicializado correctamente.");
    
    // Test simple de conexión
    /*
    db.collection("test").get().then(() => {
        document.querySelector('.db-status').innerHTML = '<span class="status-dot"></span> Firebase Conectado';
        document.querySelector('.db-status').classList.add('online');
    }).catch(err => {
        console.error("Error conectando a Firebase:", err);
        document.querySelector('.db-status').innerHTML = '<span class="status-dot" style="background:red;box-shadow:none;"></span> Firebase Error';
    });
    */
} catch (error) {
    console.warn("No se pudo inicializar Firebase. Asegúrate de configurar firebase-config.js", error);
    document.querySelector('.db-status').innerHTML = '<span class="status-dot" style="background:red;box-shadow:none;"></span> Configura Firebase en JS';
}
