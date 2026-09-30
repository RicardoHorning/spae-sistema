import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Configuração padrão do Firebase com tratamento de exceção para execução offline/local
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForLocalTest",
    authDomain: "spae-senai.firebaseapp.com",
    databaseURL: "https://spae-senai-default-rtdb.firebaseio.com",
    projectId: "spae-senai",
    storageBucket: "spae-senai.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

let dbRef = null;

try {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    dbRef = ref(db, 'spae_state');
} catch (e) {
    console.warn("Firebase operando em modo local via LocalStorage.");
}

export { dbRef, onValue, set };