// src/main.js
import { db, ref, refPath, onValue, update, auth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from './config/firebase.js';
import { updateRoleDetails, processQuizAndSubmit, VAGA_DETAILS } from './modulos/portalAluno.js';
import { renderAnalyticsTable } from './modulos/professor.js';
import { renderTurmasPanel, parseTurma } from './modulos/turmas.js';
import { renderEquipes, equipePadrao } from './modulos/equipes.js';

const S = { hud: { cash: 100000, inventory: 10, sla: 100 }, candidates: [], analytics: {}, turmas: {}, eu: null, org: {} };
let usuario = null;
let ehProf = false;
let ouvintes = [];
let ouvProf = null;

onValue(refPath('hud'), (s) => { if (s.val()) S.hud = { ...S.hud, ...s.val() }; updateUI(); }, () => {});

let orgChave = null;
function parar() { ouvintes.forEach(f => f()); ouvintes = []; orgChave = null; }

function ouvirProfessor() {
    ouvintes = [
        onValue(refPath('candidates'), (s) => { S.candidates = Object.values(s.val() || {}); updateUI(); }),
        onValue(refPath('analytics'), (s) => { S.analytics = s.val() || {}; updateUI(); }),
        onValue(refPath('turmas'), (s) => { S.turmas = s.val() || {}; updateUI(); }),
        onValue(refPath('organograma'), (s) => { S.org = s.val() || {}; updateUI(); })
    ];
}

function ouvirAluno(uid) {
    ouvintes = [onValue(refPath('candidates/' + uid), (s) => {
        S.eu = s.val();
        const ch = S.eu && S.eu.turmaChave;
        if (ch && orgChave !== ch) {
            orgChave = ch;
            ouvintes.push(onValue(refPath('organograma/' + ch), (o) => { S.org = { [ch]: o.val() || {} }; updateUI(); }, () => {}));
        }
        updateUI();
    }, () => {})];
}

function updateUI() {
    const $ = (id) => document.getElementById(id);
    $('hudCash').innerText = `R$ ${Number(S.hud.cash || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    $('hudInventory').innerText = `${S.hud.inventory || 0} Unid`;
    $('hudSLA').innerText = `${S.hud.sla ?? 100}%`;
    $('hudStudents').innerText = ehProf ? `${S.candidates.length} Inscritos` : '—';
    $('nav-tab1').style.display = ehProf ? 'inline-block' : 'none';
    $('btnSair').style.display = usuario ? 'inline-block' : 'none';
    $('loginCampos').style.display = usuario ? 'none' : 'flex';
    let txt = 'Acesso (aluno ou professor):';
    if (ehProf) txt = 'Professor conectado';
    else if (usuario) {
        const st = !S.eu ? '' : (S.eu.status === 'APPROVED'
            ? ` — aprovado como ${(VAGA_DETAILS[S.eu.role] || {}).title || S.eu.role}`
            : ' — aguardando aprovação do professor');
        txt = 'Aluno conectado' + (S.eu ? ': ' + S.eu.name : '') + st;
    }
    $('loginState').innerText = txt;
    renderAnalyticsTable(S.analytics, S.candidates, approveStudent, resetSenha);
    renderTurmasPanel($('turmasPanel'), S.turmas, ehProf);
    renderEquipes($('equipesPanel'), { ehProf, usuario, S });
}

function approveStudent(id) {
    const c = S.candidates.find(x => x.id === id);
    if (!c) return;
    const t = parseTurma(c.turma);
    const up = { ['spae_state_v4/candidates/' + id + '/status']: 'APPROVED' };
    if (t) up['spae_state_v4/organograma/' + t.chave + '/' + id] = { nome: c.name, cargo: c.role, equipe: equipePadrao(c.role) };
    update(ref(db), up)
        .then(() => alert(`Aluno ${c.name} aprovado!`))
        .catch(() => alert('Sem permissão. Entre como professor.'));
}

function resetSenha(id) {
    const c = S.candidates.find(x => x.id === id);
    if (!c || !c.email) return alert('Este aluno não tem e-mail cadastrado.');
    if (!confirm(`Enviar link para ${c.name} criar uma nova senha, no e-mail ${c.email}?`)) return;
    sendPasswordResetEmail(auth, c.email)
        .then(() => alert('Link enviado. Peça ao aluno para conferir o e-mail (e o spam).'))
        .catch(() => alert('Não foi possível enviar o link.'));
}

onAuthStateChanged(auth, (u) => {
    if (ouvProf) { ouvProf(); ouvProf = null; }
    parar();
    usuario = u; ehProf = false;
    S.candidates = []; S.analytics = {}; S.turmas = {}; S.eu = null; S.org = {};
    if (!u) { window.switchTab('tab0'); updateUI(); return; }
    ouvProf = onValue(ref(db, 'professores/' + u.uid), (s) => {
        parar();
        ehProf = s.exists();
        if (ehProf) ouvirProfessor(); else ouvirAluno(u.uid);
        updateUI();
    }, () => { parar(); ehProf = false; ouvirAluno(u.uid); updateUI(); });
});

window.doLogin = () => signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value.trim(), document.getElementById('loginPass').value)
    .then(() => { document.getElementById('loginPass').value = ''; })
    .catch(() => alert('E-mail ou senha incorretos.'));
window.doReset = () => {
    const e = document.getElementById('loginEmail').value.trim();
    if (!e) return alert('Digite seu e-mail no campo "e-mail" e clique de novo em "Esqueci minha senha".');
    sendPasswordResetEmail(auth, e)
        .then(() => alert('Se este e-mail estiver cadastrado, enviamos um link para criar uma nova senha. Confira também o spam.'))
        .catch(() => alert('E-mail inválido.'));
};
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
