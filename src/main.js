// src/main.js
import { db, ref, refPath, onValue, update, auth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from './config/firebase.js';
import { updateRoleDetails, processQuizAndSubmit, VAGA_DETAILS } from './modulos/portalAluno.js';
import { renderAnalyticsTable } from './modulos/professor.js';
import { renderTurmasPanel, parseTurma } from './modulos/turmas.js';
import { renderEquipes, equipePadrao } from './modulos/equipes.js';
import { renderTarefas, turmaAtual } from './modulos/tarefas.js';
import { renderMesas } from './modulos/mesas.js';
import { renderProfessores } from './modulos/professores.js';

const S = { hud: { cash: 100000, inventory: 10, sla: 100 }, candidates: [], analytics: {}, turmas: {}, inscr: {}, eu: null, org: {}, tar: {}, msg: {}, avs: {}, ativas: {}, perfis: {}, perfil: null };
let usuario = null, ehProf = false, ehAdmin = false, ouvintes = [], ouvProf = null, orgChave = null;
const porTurma = {};
const h = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

onValue(refPath('turmasAtivas'), (s) => { S.ativas = s.val() || {}; updateUI(); }, () => {});
onValue(refPath('hud'), (s) => { if (s.val()) S.hud = { ...S.hud, ...s.val() }; updateUI(); }, () => {});

function recalc() {
    S.candidates = []; S.analytics = {};
    Object.values(S.inscr).forEach(g => Object.values(g || {}).forEach(r => { S.candidates.push(r); S.analytics[r.id] = r; }));
}

function resetS() {
    Object.assign(S, { candidates: [], analytics: {}, turmas: {}, inscr: {}, eu: null, org: {}, tar: {}, msg: {}, avs: {}, perfis: {}, perfil: null });
    orgChave = null;
}

function soltarTurma(k) {
    (porTurma[k] || []).forEach(f => f());
    delete porTurma[k];
    ['turmas', 'inscr', 'org', 'tar', 'msg', 'avs'].forEach(n => delete S[n][k]);
    recalc();
}

function parar() {
    ouvintes.forEach(f => f());
    ouvintes = [];
    Object.keys(porTurma).forEach(soltarTurma);
}

// Professor: escuta apenas as turmas dele (o administrador escuta todas)
function ouvirTurma(k) {
    if (porTurma[k]) return;
    const on = (nome, fn) => onValue(refPath(nome + '/' + k), (s) => { fn(s.val() || {}); updateUI(); }, () => {});
    porTurma[k] = [
        onValue(refPath('turmas/' + k), (s) => { if (s.val()) S.turmas[k] = s.val(); else delete S.turmas[k]; updateUI(); }, () => {}),
        on('inscritos', v => { S.inscr[k] = v; recalc(); }),
        on('organograma', v => { S.org[k] = v; }),
        on('tarefas', v => { S.tar[k] = v; }),
        on('mensagens', v => { S.msg[k] = v; }),
        on('avisos', v => { S.avs[k] = v; })
    ];
}

function ouvirProfessor(uid) {
    ouvintes.push(onValue(ehAdmin ? refPath('turmas') : refPath('turmasDoProf/' + uid), (s) => {
        const ks = Object.keys(s.val() || {});
        Object.keys(porTurma).filter(k => !ks.includes(k)).forEach(soltarTurma);
        ks.forEach(ouvirTurma);
        updateUI();
    }, () => {}));
    ouvintes.push(onValue(ref(db, 'perfis/' + uid), (s) => { S.perfil = s.val(); window.__perfil = S.perfil; updateUI(); }, () => {}));
    if (ehAdmin) ouvintes.push(onValue(ref(db, 'perfis'), (s) => { S.perfis = s.val() || {}; updateUI(); }, () => {}));
}

// Aluno: descobre a turma pelo ponteiro e escuta só o que é dele
function ouvirAluno(uid) {
    ouvintes = [onValue(refPath('alunos/' + uid), (s) => {
        const ch = s.val() && s.val().turmaChave;
        if (!ch || orgChave === ch) return;
        orgChave = ch;
        const on = (nome, fn) => ouvintes.push(onValue(refPath(nome + '/' + ch), (o) => { fn(o.val() || {}); updateUI(); }, () => {}));
        ouvintes.push(onValue(refPath('inscritos/' + ch + '/' + uid), (o) => { S.eu = o.val(); updateUI(); }, () => {}));
        on('organograma', v => { S.org = { [ch]: v }; });
        on('tarefas', v => { S.tar = { [ch]: v }; });
        on('mensagens', v => { S.msg = { [ch]: v }; });
        on('avisos', v => { S.avs = { [ch]: v }; });
    }, () => {})];
}

function updateUI() {
    const $ = (id) => document.getElementById(id);
    $('hudCash').innerText = `R$ ${Number(S.hud.cash || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    $('hudInventory').innerText = `${S.hud.inventory || 0} Unid`;
    $('hudSLA').innerText = `${S.hud.sla ?? 100}%`;
    const chaves = ehProf ? [turmaAtual()].filter(Boolean) : Object.keys(S.tar || {});
    const lista = [];
    chaves.forEach(k => Object.values((S.tar || {})[k] || {}).forEach(x => lista.push(x)));
    const hojeS = new Date().toLocaleDateString('sv-SE');
    const atras = lista.filter(x => x.status !== 'CONCLUIDA' && x.prazo && x.prazo < hojeS).length;
    const soma = (k) => lista.filter(x => x.status === 'CONCLUIDA' && x.efeito).reduce((s, x) => s + (Number(x.efeito[k]) || 0), 0);
    if (lista.length) $('hudSLA').innerText = Math.round(100 * (lista.length - atras) / lista.length) + '%';
    $('hudGargalos').innerText = atras;
    $('hudCash').innerText = `R$ ${(Number(S.hud.cash || 0) + soma('caixa')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    $('hudInventory').innerText = `${(Number(S.hud.inventory) || 0) + soma('estoque')} Unid`;
    $('hudStudents').innerText = ehProf ? `${S.candidates.length} Inscritos` : '—';
    $('nav-tab1').style.display = ehProf ? 'inline-block' : 'none';
    $('nav-tabTurmas').style.display = ehProf ? 'inline-block' : 'none';
    $('nav-tabProfs').style.display = ehAdmin ? 'inline-block' : 'none';
    $('btnSair').style.display = usuario ? 'inline-block' : 'none';
    $('loginCampos').style.display = usuario ? 'none' : 'flex';
    let txt = 'Acesso (aluno ou professor):';
    if (ehProf) txt = (ehAdmin ? 'Administrador conectado' : 'Professor conectado') + (S.perfil ? ': ' + S.perfil.nome : '');
    else if (usuario) {
        const st = !S.eu ? '' : (S.eu.status === 'APPROVED'
            ? ` — aprovado como ${(VAGA_DETAILS[S.eu.role] || {}).title || S.eu.role}`
            : ' — aguardando aprovação do professor');
        txt = 'Aluno conectado' + (S.eu ? ': ' + S.eu.name : '') + st;
    }
    $('loginState').innerText = txt;
    renderAnalyticsTable(S.analytics, S.candidates, approveStudent, resetSenha, excluirAluno);
    renderTurmasPanel($('turmasPanel'), S.turmas, ehProf, S.candidates);
    renderProfessores($('profsPanel'), { ehAdmin, S });
    const sel = $('candTurma');
    if (sel) {
        const html = '<option value="">Selecione a sua turma...</option>' + Object.values(S.ativas).map(t => `<option value="${h(t.codigo)}">${h(t.codigo)} — ${h(t.turno)}${t.escola ? ' — ' + h(t.escola) : ''}</option>`).join('');
        if (sel.dataset.h !== html) { const v = sel.value; sel.innerHTML = html; sel.dataset.h = html; sel.value = v; }
    }
    renderEquipes($('equipesPanel'), { ehProf, usuario, S });
    $('nav-tabTarefas').style.display = (ehProf || (usuario && S.eu && S.eu.status === 'APPROVED')) ? 'inline-block' : 'none';
    renderTarefas($('tarefasPanel'), { ehProf, usuario, S });
    renderMesas({ ehProf, usuario, S });
}

function approveStudent(id) {
    const c = S.candidates.find(x => x.id === id);
    const t = c && parseTurma(c.turma);
    if (!t) return;
    update(ref(db), {
        ['spae_state_v4/inscritos/' + t.chave + '/' + id + '/status']: 'APPROVED',
        ['spae_state_v4/organograma/' + t.chave + '/' + id]: { nome: c.name, cargo: c.role, equipe: equipePadrao(c.role) }
    }).then(() => alert(`Aluno ${c.name} aprovado!`)).catch(() => alert('Sem permissão. Entre como professor.'));
}

function excluirAluno(id) {
    const c = S.candidates.find(x => x.id === id) || {};
    const nome = c.name || id;
    const t = parseTurma(c.turma);
    if (!t) return;
    if (!confirm(`Excluir ${nome} do sistema?\n\nSerão apagados: inscrição, nota do quiz e posição no organograma. As tarefas dele ficam "sem responsável".\nA conta de login (e-mail) continua no Firebase.`)) return;
    const base = 'spae_state_v4/';
    const up = { [base + 'inscritos/' + t.chave + '/' + id]: null, [base + 'alunos/' + id]: null, [base + 'organograma/' + t.chave + '/' + id]: null };
    const tar = (S.tar || {})[t.chave] || {};
    Object.keys(tar).forEach(k => {
        const p = base + `tarefas/${t.chave}/${k}/`;
        if (tar[k].exec === id) { up[p + 'exec'] = ''; up[p + 'execNome'] = 'Sem responsável'; }
        if (tar[k].cobra === id) { up[p + 'cobra'] = 'PROF'; up[p + 'cobraNome'] = 'Professor (Mercado)'; }
    });
    update(ref(db), up).then(() => alert(nome + ' foi excluído do sistema.')).catch(() => alert('Sem permissão. Entre como professor.'));
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
    parar(); resetS();
    usuario = u; ehProf = false; ehAdmin = false;
    if (!u) { window.switchTab('tab0'); updateUI(); return; }
    ouvProf = onValue(ref(db, 'professores/' + u.uid), (s) => {
        parar(); resetS();
        const v = s.val();
        ehProf = v !== null; ehAdmin = v === 1;
        if (ehProf) ouvirProfessor(u.uid); else ouvirAluno(u.uid);
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

window.__atualizar = updateUI;
updateRoleDetails();
