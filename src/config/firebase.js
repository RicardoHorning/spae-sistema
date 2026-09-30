// src/config/firebase.js
let dbRef = null;
let onValue = null;
let set = null;

try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    const { getDatabase, ref, onValue: fOnValue, set: fSet } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js");

    const firebaseConfig = {
        databaseURL: "https://spae-sistema-default-rtdb.firebaseio.com"
    };

    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    dbRef = ref(database, 'spae_data');
    onValue = fOnValue;
    set = fSet;
} catch (error) {
    console.warn("SPAE Engine: Conectado em modo de armazenamento local.", error);
}

export { dbRef, onValue, set };