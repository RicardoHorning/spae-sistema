// src/main.js
import { dbRef, onValue, set } from './config/firebase.js';
import { updateRoleDetails, processQuizAndSubmit } from './modulos/portalAluno.js';
import { renderAnalyticsTable } from './modulos/professor.js';

let currentState = { cash: 100000, inventory: 10, sla: 100, candidates: [], analytics: {} };

// Exposição global das funções
window.submitCandidate = () => processQuizAndSubmit(dbRef, currentState);
window.updateRoleDetails = updateRoleDetails;

window.approveStudentAction = (studentId) => {
    const cand = (currentState.candidates || []).find(c => c.id === studentId);
    if (cand) {
        cand.status = 'APPROVED';
        
        // Remove pisca-pisca da aba 1 ao aprovar
        const navTab1 = document.getElementById('nav-tab1');
        if (navTab1) navTab1.classList.remove('btn-neon-pulse');
        
        // Passa o pisca-pisca para a próxima aba (Aba 2 - Setup RH)
        const navTab2 = document.getElementById('nav-tab2');
        if (navTab2) navTab2.classList.add('btn-neon-pulse');

        const gpsText = document.getElementById('gpsText');
        if (gpsText) {
            gpsText.innerHTML = `PASSO 3: Aluno ${cand.name} aprovado! Acesse a aba "2. Setup RH & Equipes" para alocar o cargo.`;
        }

        updateUI();
        if (dbRef && set) set(dbRef, currentState);
        alert(`✅ Aluno ${cand.name} aprovado com sucesso!`);
    }
};

window.switchTab = (tabId) => {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add('active');
    
    const targetNav = document.getElementById(tabId.replace('tab', 'nav-tab'));
    if (targetNav) targetNav.classList.add('active');
};

function updateUI() {
    document.getElementById('hudCash').innerText = `R$ ${(currentState.cash || 0).toLocaleString('pt-BR')},00`;
    document.getElementById('hudInventory').innerText = `${currentState.inventory || 0} Unid`;
    document.getElementById('hudSLA').innerText = `${currentState.sla || 100}%`;
    document.getElementById('hudStudents').innerText = `${currentState.candidates ? currentState.candidates.length : 0} Inscritos`;

    renderAnalyticsTable(currentState.analytics, currentState.candidates);
}

// Conexão Firebase com resiliência
if (dbRef && onValue) {
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) currentState = { ...currentState, ...data };
        updateUI();
    }, (err) => console.warn("Servidor operando localmente."));
}

// Inicialização da tela
updateRoleDetails();