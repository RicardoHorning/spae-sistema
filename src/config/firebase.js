// Módulo de Conexão Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, update, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAF2iJb2M94ULFzXKTwSINYs6571pTfLb0",
    authDomain: "spae-v3.firebaseapp.com",
    projectId: "spae-v3",
    storageBucket: "spae-v3.firebasestorage.app",
    messagingSenderId: "74282152756",
    appId: "1:74282152756:web:a8de1d441b99fd35e22b61",
    databaseURL: "https://spae-v3-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const dbRef = ref(db, 'spae_state_v4');
export const refPath = (p) => ref(db, 'spae_state_v4/' + p);
export { ref, onValue, set, update, child, signInWithEmailAndPassword, signOut, onAuthStateChanged };
