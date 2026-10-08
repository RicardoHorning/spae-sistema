// src/modulos/tarefas.js — tarefas com status, cobrança, comunicador por tarefa e gerador de atividades
import { db, ref, update } from '../config/firebase.js';
import { CARGOS } from './equipes.js';
import { MODELOS, montar } from './gerador.js';
import { ucNome } from './catalogo.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nivel = (c) => (CARGOS[c] || [])[1];
const hoje = () => new Date().toLocaleDateString('sv-SE');
const est = (t) => (t.status !== 'CONCLUIDA' && t.prazo && t.prazo < hoje() ? 'ATRASADA' : t.status);
const ST = { PENDENTE: ['Pendente', '#facc15'], ANDAMENTO: ['Em andamento', '#38bdf8'], CONCLUIDA: ['Concluída', '#22c55e'], ATRASADA: ['Atrasada', '#ef4444'] };
const lidoMap = () => { try { return JSON.parse(localStorage.getItem('spae_lido') || '{}'); } catch (e) { return {}; } };
const marcaLido = (id) => { try { const m = lidoMap(); m[id] = Date.now(); localStorage.setItem('spae_lido', JSON.stringify(m)); } catch (e) { /* sem armazenamento */ } };

let turmaSel = '', aberta = '', abertaAnt = '', ultima = '', elRef = null, ctxRef = null, C = null;

function montarHtml({ ehProf, usuario, S }) {
    let turma, me;
    if (ehProf) {
        const ch = Object.keys(S.turmas || {});
        if (!turmaSel || !ch.includes(turmaSel)) turmaSel = ch[0] || '';
        turma = turmaSel;
        me = { uid: 'PROF', nome: 'Professor (Mercado)', prof: true };
        if (!turma) return '<p class="placeholder-text">Cadastre uma turma na aba 1 primeiro.</p>';
    } else {
        const eu = S.eu;
        if (!usuario || !eu || eu.status !== 'APPROVED') return '<p class="placeholder-text">As tarefas aparecem aqui depois que o professor aprovar o seu cargo.</p>';
        turma = eu.turmaChave;
        me = { uid: eu.id, nome: eu.name, prof: false };
    }
    const org = (S.org || {})[turma] || {};
    const pessoas = Object.keys(org).map(uid => ({ uid, ...org[uid] }));
    const mp = org[me.uid] || {};
    const mn = me.prof ? 0 : nivel(mp.cargo);
    const alvos = pessoas.filter(p => me.prof || (mn === 1 && nivel(p.cargo) === 2) || (mn === 2 && nivel(p.cargo) === 3 && p.equipe === mp.equipe));
    const bruto = (S.tar || {})[turma] || {};
    const todas = Object.keys(bruto).map(id => ({ id, ...bruto[id] }));
    const porId = {};
    todas.forEach(t => { porId[t.id] = t; });
    const minhas = todas.filter(t => me.prof || t.exec === me.uid || t.cobra === me.uid).sort((a, b) => (a.prazo || '').localeCompare(b.prazo || ''));
    const msgs = (S.msg || {})[turma] || {};
    const lido = lidoMap();
    const lista = (id) => Object.values(msgs[id] || {}).sort((a, b) => a.ts - b.ts);
    const novas = (id) => lista(id).filter(m => m.ts > (lido[id] || 0) && m.de !== me.uid).length;
    C = { turma, me, pessoas, alvos, porId };

    const linhas = minhas.map(t => {
        const e = est(t), dep = t.depende && porId[t.depende], bloq = dep && dep.status !== 'CONCLUIDA';
        const euExec = t.exec === me.uid || me.prof, euCobra = me.prof || t.cobra === me.uid, n = novas(t.id);
        const b = (txt, js, cls = 'btn') => `<button class="${cls}" style="padding:2px 6px;font-size:0.7rem;margin:1px" onclick="${js}">${txt}</button>`;
        return `<tr><td title="${esc(t.desc)}"><strong>${esc(t.titulo)}</strong><br><small>${esc(t.atividade || '')}${bloq ? ' · 🔒 aguardando: ' + esc(dep.titulo) : ''}</small></td>
            <td>${esc(t.execNome)}</td><td>${esc(t.cobraNome)}</td><td>${esc(t.prazo || '')}</td>
            <td><span class="metric-badge" style="background:${ST[e][1]};color:#000">${ST[e][0]}</span></td>
            <td>${euExec && !bloq && t.status === 'PENDENTE' ? b('Iniciar', `mudarStatus('${t.id}','ANDAMENTO')`) : ''}${euExec && !bloq && t.status !== 'CONCLUIDA' ? b('Concluir', `mudarStatus('${t.id}','CONCLUIDA')`, 'btn btn-success') : ''}${euCobra && t.status !== 'CONCLUIDA' ? b('Cobrar', `cobrarTarefa('${t.id}')`) : ''}${b('💬' + (n ? ' 🔴' + n : ''), `abrirConversa('${t.id}')`)}</td></tr>`;
    }).join('') || '<tr><td colspan="6" style="text-align:center">Nenhuma tarefa por enquanto.</td></tr>';

    const cont = ['PENDENTE', 'ANDAMENTO', 'CONCLUIDA', 'ATRASADA'].map(k => `${ST[k][0]}: <strong>${minhas.filter(t => est(t) === k).length}</strong>`).join(' · ');
    const totalNovas = minhas.reduce((s, t) => s + novas(t.id), 0);

    const topo = me.prof ? `<div class="form-group"><label>Turma</label><select onchange="trocarTurmaTar(this.value)">${Object.keys(S.turmas).map(k => `<option value="${esc(k)}"${k === turma ? ' selected' : ''}>${esc(S.turmas[k].codigo)}</option>`).join('')}</select></div>` : '';
    const gerador = me.prof ? `<div class="card-box" style="margin-bottom:1rem"><h3>⚡ Gerador de atividades (UCs piloto)</h3>
        <div class="grid-inputs"><div class="form-group"><label>Atividade</label><select id="gModelo">${MODELOS.map(m => `<option value="${m.id}">${esc(m.titulo)} — ${esc(ucNome(m.uc))}</option>`).join('')}</select></div>
        <div class="form-group"><label>Data de início</label><input type="date" id="gInicio" value="${hoje()}"></div></div>
        <button class="btn btn-success" onclick="gerarAtividade()">Gerar tarefas para a turma</button>
        <p class="placeholder-text" style="margin-top:0.5rem">As tarefas são distribuídas pelo organograma (aba 2). Aprove os alunos e defina as equipes antes de gerar.</p></div>` : '';
    const nova = (me.prof || mn === 1 || mn === 2) ? `<div class="card-box" style="margin-bottom:1rem"><h3>➕ Nova tarefa</h3>
        ${alvos.length ? `<div class="grid-inputs"><div class="form-group"><label>Título *</label><input id="nTitulo"></div>
        <div class="form-group"><label>Quem executa *</label><select id="nExec">${alvos.map(p => `<option value="${esc(p.uid)}">${esc(p.nome)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Prazo *</label><input type="date" id="nPrazo" value="${hoje()}"></div>
        <div class="form-group"><label>Só libera depois de (opcional)</label><select id="nDep"><option value="">—</option>${minhas.map(t => `<option value="${t.id}">${esc(t.titulo)}</option>`).join('')}</select></div></div>
        <div class="form-group"><label>Descrição</label><input id="nDesc"></div><button class="btn btn-success" onclick="criarTarefa()">Criar tarefa</button>`
        : '<p class="placeholder-text">Você ainda não tem pessoas para quem passar tarefas.</p>'}</div>` : '';

    let conversa = '';
    const tc = aberta && porId[aberta];
    if (tc) {
        marcaLido(aberta);
        conversa = `<div class="card-box" style="margin-top:1rem"><h3>💬 ${esc(tc.titulo)}</h3><p class="placeholder-text">${esc(tc.desc)}</p>
            ${lista(aberta).map(m => `<div class="msg${m.de === me.uid ? ' msg-eu' : ''}"><small>${esc(m.deNome)} · ${new Date(m.ts).toLocaleString('pt-BR')}</small><br>${esc(m.texto)}</div>`).join('') || '<p class="placeholder-text">Nenhuma mensagem ainda.</p>'}
            <textarea id="tMsg" placeholder="Escreva sua mensagem..."></textarea><button class="btn btn-success" style="margin-top:0.5rem" onclick="enviarMsg()">Enviar</button>
            <button class="btn" style="margin:0.5rem 0 0 0.5rem" onclick="abrirConversa('')">Fechar</button></div>`;
    }
    return `${topo}${gerador}${nova}<div class="card-box"><h3>✅ Tarefas ${totalNovas ? `<span style="color:#ef4444">· 🔴 ${totalNovas} mensagem(ns) nova(s)</span>` : ''}</h3>
        <p class="placeholder-text">${cont}</p><table><thead><tr><th>Tarefa</th><th>Executa</th><th>Cobra</th><th>Prazo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${linhas}</tbody></table></div>${conversa}`;
}

export function renderTarefas(el, ctx) {
    if (!el) return;
    elRef = el; ctxRef = ctx;
    const { ehProf, usuario, S } = ctx;
    const sig = JSON.stringify([ehProf, !!usuario, S.tar, S.msg, S.org, S.eu && S.eu.status, turmaSel, aberta, Object.keys(S.turmas || {}), hoje()]);
    if (sig === ultima) return;
    ultima = sig;
    const rascunho = abertaAnt === aberta ? ((document.getElementById('tMsg') || {}).value || '') : '';
    abertaAnt = aberta;
    el.innerHTML = montarHtml(ctx);
    const ta = document.getElementById('tMsg');
    if (ta) ta.value = rascunho;
}

const redesenhar = () => { ultima = ''; if (elRef && ctxRef) renderTarefas(elRef, ctxRef); };
const caminho = (suf) => 'spae_state_v4/' + suf;
const gravar = (up, ok) => update(ref(db), up).then(() => ok && alert(ok)).catch(() => alert('Não foi possível salvar. Confira seu acesso.'));

window.trocarTurmaTar = (v) => { turmaSel = v; aberta = ''; redesenhar(); };
window.abrirConversa = (id) => { aberta = id; redesenhar(); };

window.mudarStatus = (id, st) => gravar({ [caminho(`tarefas/${C.turma}/${id}/status`)]: st });

window.enviarMsg = () => {
    const texto = (document.getElementById('tMsg').value || '').trim();
    if (!texto || !aberta) return;
    const mid = 'M' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    gravar({ [caminho(`mensagens/${C.turma}/${aberta}/${mid}`)]: { de: C.me.uid, deNome: C.me.nome, texto, ts: Date.now() } });
};

window.cobrarTarefa = (id) => {
    const t = C.porId[id];
    if (!t) return;
    const mid = 'M' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    gravar({ [caminho(`mensagens/${C.turma}/${id}/${mid}`)]: { de: C.me.uid, deNome: C.me.nome, texto: `🔔 Cobrança: como está a tarefa "${t.titulo}" (prazo ${t.prazo})?`, ts: Date.now() } }, 'Cobrança enviada.');
};

window.criarTarefa = () => {
    const v = (id) => (document.getElementById(id).value || '').trim();
    const exec = C.alvos.find(p => p.uid === v('nExec'));
    if (!v('nTitulo') || !exec || !v('nPrazo')) return alert('Preencha título, quem executa e prazo.');
    const id = 'T' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    gravar({ [caminho(`tarefas/${C.turma}/${id}`)]: {
        titulo: v('nTitulo'), desc: v('nDesc'), atividade: '', exec: exec.uid, execNome: exec.nome,
        cobra: C.me.uid, cobraNome: C.me.nome, prazo: v('nPrazo'), status: 'PENDENTE', depende: v('nDep'), criada: Date.now()
    } }, 'Tarefa criada.');
};

window.gerarAtividade = () => {
    const m = MODELOS.find(x => x.id === document.getElementById('gModelo').value);
    if (!m || !C.pessoas.length) return alert('Aprove alunos e monte as equipes (aba 2) antes de gerar.');
    const { tarefas, faltas } = montar(m, C.pessoas, document.getElementById('gInicio').value || hoje());
    if (faltas.length && !confirm('Sem responsável para: ' + faltas.join('; ') + '. Gerar mesmo assim?')) return;
    const up = {};
    Object.keys(tarefas).forEach(id => { up[caminho(`tarefas/${C.turma}/${id}`)] = tarefas[id]; });
    gravar(up, 'Atividade gerada: ' + Object.keys(tarefas).length + ' tarefas.');
};
