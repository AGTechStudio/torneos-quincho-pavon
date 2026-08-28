// ⚠️ COMPLETAR con los datos de TU proyecto de Firebase.
//
// Cómo conseguirlos: en la consola de Firebase, entrá a tu proyecto >
// ícono de engranaje (Configuración del proyecto) > bajá hasta "Tus apps" >
// tocá el ícono "</>" (Web) para agregar una app web (o abrí la que ya
// tengas) > Firebase te muestra un objeto firebaseConfig, copialo
// completo acá abajo, reemplazando el de ejemplo.

const firebaseConfig = {
  apiKey: "AIzaSyBgRq4w5xQB2uoY62aH9iryCoJv_1UadpA",
  authDomain: "torneos-quincho-pavon.firebaseapp.com",
  projectId: "torneos-quincho-pavon",
  storageBucket: "torneos-quincho-pavon.firebasestorage.app",
  messagingSenderId: "537330139354",
  appId: "1:537330139354:web:de5c120a1c4b6ecc5565e3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
