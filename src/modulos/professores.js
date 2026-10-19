// src/modulos/professores.js — cadastro de professores (somente administrador)
import { db, ref, update, auth, firebaseConfig, initializeApp, getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from '../config/firebase.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let ultima = '', perfis = {}, sec = null;

export function renderProfessores(el, { ehAdmin, S }) {
    if (!el) return;
    el.style.display = ehAdmin ? 'block' : 'none';
    perfis = S.perfis || {};
    const sig = ehAdmin + JSON.stringify(perfis);
    if (sig === ultima) return;
    ultima = sig;
    const linhas = Object.keys(perfis).map(uid => {
        const p = perfis[uid], on = p.ativo !== false;
        return `<tr><td>${esc(p.nome)}</td><td>${esc(p.email)}</td><td>${esc(p.escola)}</td><td>${on ? 'Ativo' : 'Desativado'}</td>
            <td><button class="btn" style="padding:2px 6px;font-size:0.7rem" onclick="reenviarProf('${esc(uid)}')">Reenviar e-mail</button>
            <button class="btn" style="padding:2px 6px;font-size:0.7rem" onclick="alternarProf('${esc(uid)}')">${on ? 'Desativar' : 'Reativar'}</button></td></tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center">Nenhum professor cadastrado além de você.</td></tr>';
    el.innerHTML = `<div class="card-box"><h3>➕ Cadastrar professor</h3>
        <div class="grid-inputs"><div class="form-group"><label>Nome completo *</label><input id="pNome"></div>
        <div class="form-group"><label>E-mail *</label><input type="email" id="pEmail"></div></div>
        <div class="form-group"><label>Escola / unidade *</label><input id="pEscola" placeholder="Ex.: SENAI Afonso Pena"></div>
        <button class="btn btn-success" onclick="cadastrarProf()">Cadastrar e enviar e-mail de acesso</button>
        <p class="placeholder-text">O professor recebe um e-mail para criar a própria senha. Ele só enxerga as turmas que ele mesmo cadastrar.</p></div>
        <div class="card-box" style="margin-top:1rem"><h3>Professores</h3><table><thead><tr><th>Nome</th><th>E-mail</th><th>Escola</th><th>Situação</th><th>Ações</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
}

window.cadastrarProf = async () => {
    const v = (id) => document.getElementById(id).value.trim();
    const nome = v('pNome'), email = v('pEmail').toLowerCase(), escola = v('pEscola');
    if (!nome || !escola || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Preencha nome, e-mail válido e escola.');
    try {
        sec = sec || initializeApp(firebaseConfig, 'secundario');
        const a2 = getAuth(sec);
        const senha = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(36)).join('') + 'Aa!1';
        const uid = (await createUserWithEmailAndPassword(a2, email, senha)).user.uid;
        await signOut(a2);
        await update(ref(db), { ['professores/' + uid]: 2, ['perfis/' + uid]: { nome, email, escola, ativo: true, criado: Date.now() } });
        await sendPasswordResetEmail(auth, email);
        alert('Professor cadastrado. Um e-mail foi enviado para ele criar a senha.');
    } catch (e) {
        alert(e.code === 'auth/email-already-in-use' ? 'Este e-mail já tem conta no sistema (como aluno ou professor).' : 'Não foi possível cadastrar. Tente de novo.');
    }
};

window.reenviarProf = (uid) => {
    const p = perfis[uid];
    if (p) sendPasswordResetEmail(auth, p.email).then(() => alert('E-mail enviado.')).catch(() => alert('Não foi possível enviar.'));
};

window.alternarProf = (uid) => {
    const p = perfis[uid];
    if (!p) return;
    const ativar = p.ativo === false;
    if (!ativar && !confirm('Desativar ' + p.nome + '? Ele perde o acesso de professor (as turmas e dados dele ficam guardados).')) return;
    update(ref(db), { ['professores/' + uid]: ativar ? 2 : null, ['perfis/' + uid + '/ativo']: ativar })
        .catch(() => alert('Sem permissão.'));
};
