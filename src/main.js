// src/main.js
import { db, ref, refPath, onValue, update, auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './config/firebase.js';
import { updateRoleDetails, processQuizAndSubmit } from './modulos/portalAluno.js';
import { renderAnalyticsTable } from './modulos/professor.js';
import { renderTurmasPanel } from './modulos/turmas.js';

const S = { hud: { cash: 100000, inventory: 10, sla: 100 }, candidates: [], analytics: {}, turmas: {} };
let logado = false;
let ouvintes = [];

// Dados públicos (painel superior): qualquer pessoa lê
onValue(refPath('hud'), (s) => { if (s.val()) S.hud = { ...S.hud, ...s.val() }; updateUI(); }, () => {});

function ouvirPrivados() {
    ouvintes = [
        onValue(refPath('candidates'), (s) => { S.candidates = Object.values(s.val() || {}); updateUI(); }),
        onValue(refPath('analytics'), (s) => { S.analytics = s.val() || {}; updateUI(); }),
        onValue(refPath('turmas'), (s) => { S.turmas = s.val() || {}; updateUI(); })
    ];
}

function updateUI() {
    const $ = (id) => document.getElementById(id);
    $('hudCash').innerText = `R$ ${Number(S.hud.cash || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    $('hudInventory').innerText = `${S.hud.inventory || 0} Unid`;
    $('hudSLA').innerText = `${S.hud.sla ?? 100}%`;
    $('hudStudents').innerText = logado ? `${S.candidates.length} Inscritos` : '—';
    $('nav-tab1').style.display = logado ? 'inline-block' : 'none';
    $('btnSair').style.display = logado ? 'inline-block' : 'none';
    $('loginState').innerText = logado ? 'Professor conectado' : 'Acesso do professor:';
    renderAnalyticsTable(S.analytics, S.candidates, approveStudent);
    renderTurmasPanel($('turmasPanel'), S.turmas, logado);
}

function approveStudent(id) {
    const c = S.candidates.find(x => x.id === id);
    if (!c) return;
    update(ref(db), { ['spae_state_v4/candidates/' + id + '/status']: 'APPROVED' })
        .then(() => alert(`Aluno ${c.name} aprovado!`))
        .catch(() => alert('Sem permissão. Entre como professor.'));
}

onAuthStateChanged(auth, (u) => {
    logado = !!u;
    if (u) ouvirPrivados();
    else {
        ouvintes.forEach(f => f()); ouvintes = [];
        S.candidates = []; S.analytics = {}; S.turmas = {};
        window.switchTab('tab0');
    }
    updateUI();
});

window.doLogin = () => signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value.trim(), document.getElementById('loginPass').value)
    .then(() => { document.getElementById('loginPass').value = ''; })
    .catch(() => alert('E-mail ou senha incorretos.'));
window.doLogout = () => signOut(auth);

window.submitCandidate = () => processQuizAndSubmit();
window.updateRoleDetails = updateRoleDetails;

window.switchTab = (tabId) => {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add('active');
    const targetNav = document.getElementById(tabId.replace('tab', 'nav-tab'));
    if (targetNav) targetNav.classList.add('active');
};

updateRoleDetails();
