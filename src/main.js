// src/main.js
import { dbRef, onValue, set } from './config/firebase.js';
import { updateRoleDetails, processQuizAndSubmit } from './modulos/portalAluno.js';
import { renderAnalyticsTable } from './modulos/professor.js';

// Carrega estado inicial do localStorage se existir
let currentState = { cash: 100000, inventory: 10, sla: 100, candidates: [], analytics: {} };
const savedState = localStorage.getItem('spae_state');
if (savedState) {
    try { currentState = JSON.parse(savedState); } catch(e) {}
}

// Vinculação Global Direta e Incondicional
window.switchTab = (tabId) => {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add('active');
    
    const targetNav = document.getElementById(tabId.replace('tab', 'nav-tab'));
    if (targetNav) targetNav.classList.add('active');
};

window.submitCandidate = () => processQuizAndSubmit(dbRef, currentState);
window.updateRoleDetails = updateRoleDetails;

window.approveStudentAction = (studentId) => {
    const cand = (currentState.candidates || []).find(c => c.id === studentId);
    if (cand) {
        cand.status = 'APPROVED';
        
        // Remove Neon da Aba 1 e passa para a Aba 2 (Setup RH)
        const navTab1 = document.getElementById('nav-tab1');
        if (navTab1) navTab1.classList.remove('btn-neon-pulse');
        
        const navTab2 = document.getElementById('nav-tab2');
        if (navTab2) navTab2.classList.add('btn-neon-pulse');

        const gpsText = document.getElementById('gpsText');
        if (gpsText) {
            gpsText.innerHTML = `PASSO 3: Aluno ${cand.name} aprovado! Acesse a aba "2. Setup RH & Equipes" para montar o time.`;
        }

        localStorage.setItem('spae_state', JSON.stringify(currentState));
        updateUI();
        if (dbRef && set) set(dbRef, currentState);
        alert(`✅ Aluno ${cand.name} aprovado com sucesso!`);
    }
};

function updateUI() {
    const hudCash = document.getElementById('hudCash');
    const hudInventory = document.getElementById('hudInventory');
    const hudSLA = document.getElementById('hudSLA');
    const hudStudents = document.getElementById('hudStudents');

    if (hudCash) hudCash.innerText = `R$ ${(currentState.cash || 0).toLocaleString('pt-BR')},00`;
    if (hudInventory) hudInventory.innerText = `${currentState.inventory || 0} Unid`;
    if (hudSLA) hudSLA.innerText = `${currentState.sla || 100}%`;
    if (hudStudents) hudStudents.innerText = `${currentState.candidates ? currentState.candidates.length : 0} Inscritos`;

    renderAnalyticsTable(currentState.analytics, currentState.candidates);
}

// Conexão e Sincronização em tempo real
if (dbRef && onValue) {
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) currentState = { ...currentState, ...data };
        updateUI();
    }, (err) => console.warn("Rodando em modo local."));
}

// Inicializa a interface no carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    updateRoleDetails();
    updateUI();
});

// Execução imediata de segurança
updateRoleDetails();
updateUI();