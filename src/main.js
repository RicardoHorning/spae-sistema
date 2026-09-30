// src/main.js
import { dbRef, onValue, set } from './config/firebase.js';
import { updateRoleDetails, processQuizAndSubmit } from './modulos/portalAluno.js';

let currentState = { cash: 100000, inventory: 10, sla: 100, candidates: [], analytics: {} };

// Conecta o botão de envio diretamente ao escopo global
window.submitCandidate = () => processQuizAndSubmit(dbRef, currentState);
window.updateRoleDetails = updateRoleDetails;

window.switchTab = (tabId) => {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add('active');
    
    const targetNav = document.getElementById(tabId.replace('tab', 'nav-tab'));
    if (targetNav) targetNav.classList.add('active');
};

// Carrega os dados do Firebase se disponível
if (dbRef && onValue) {
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) currentState = { ...currentState, ...data };
    }, (error) => console.warn("Servidor rodando em modo offline."));
}

// Inicializa a interface
updateRoleDetails();