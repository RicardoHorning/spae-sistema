// src/main.js
import { dbRef, onValue, set } from './config/firebase.js';
import { updateRoleDetails, processQuizAndSubmit } from './modulos/portalAluno.js';
import { renderAnalyticsTable } from './modulos/professor.js';

let currentState = { cash: 100000, inventory: 10, sla: 100, candidates: [], analytics: {} };

onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) currentState = { ...currentState, ...data };
    else set(dbRef, currentState);
    updateUI();
});

function updateUI() {
    document.getElementById('hudCash').innerText = `R$ ${(currentState.cash || 0).toLocaleString('pt-BR')},00`;
    document.getElementById('hudInventory').innerText = `${currentState.inventory || 0} Unid`;
    document.getElementById('hudSLA').innerText = `${currentState.sla || 100}%`;
    document.getElementById('hudStudents').innerText = `${currentState.candidates ? currentState.candidates.length : 0} Inscritos`;

    renderAnalyticsTable(currentState.analytics, currentState.candidates, approveStudent);
}

function approveStudent(studentId) {
    const cand = currentState.candidates.find(c => c.id === studentId);
    if (cand) {
        cand.status = 'APPROVED';
        set(dbRef, currentState);
        alert(`Aluno ${cand.name} aprovado!`);
    }
}

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

// Inicialização automática
updateRoleDetails();