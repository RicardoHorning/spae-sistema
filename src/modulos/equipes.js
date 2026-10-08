// src/modulos/equipes.js — organograma: cargos, equipes e hierarquia da turma
import { db, ref, update } from '../config/firebase.js';
import { parseTurma } from './turmas.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const EQUIPES = { GER: 'Gerência', RH: 'RH e Pessoas', COMPRAS: 'Compras e Logística', QUALIDADE: 'Qualidade e Processos', OPERACAO: 'Operação e Produção', SEM: 'A definir' };
// [nome do cargo, nível: 1 gerência, 2 supervisão, 3 auxiliar]
export const CARGOS = {
    GERENTE: ['Diretor / Gerente Geral', 1],
    RH_SUP: ['Supervisor(a) de RH e Pessoas', 2],
    COMPRAS_SUP: ['Supervisor(a) de Compras e Logística', 2],
    QUALIDADE_SUP: ['Analista de Qualidade e Processos', 2],
    AUXILIAR: ['Auxiliar / Assistente Operacional', 3]
};
export const equipePadrao = (cargo) => ({ GERENTE: 'GER', RH_SUP: 'RH', COMPRAS_SUP: 'COMPRAS', QUALIDADE_SUP: 'QUALIDADE' }[cargo] || 'SEM');
const nomeCargo = (c) => (CARGOS[c] || [c])[0];
const nivel = (c) => (CARGOS[c] || [])[1];

function arvore(pessoas) {
    const por = (f) => pessoas.filter(f);
    const ger = por(p => nivel(p.cargo) === 1);
    let h = '<div class="org-no org-prof">👨‍🏫 Professor (Mercado)</div>';
    h += ger.length
        ? ger.map(p => `<div class="org-no">🏢 ${esc(p.nome)} <small>${esc(nomeCargo(p.cargo))}</small></div>`).join('')
        : '<div class="org-alerta">⚠️ Turma sem gerente</div>';
    ['RH', 'COMPRAS', 'QUALIDADE', 'OPERACAO'].forEach(k => {
        const eq = por(p => p.equipe === k && nivel(p.cargo) !== 1);
        if (!eq.length) return;
        const sup = eq.filter(p => nivel(p.cargo) === 2);
        const aux = eq.filter(p => nivel(p.cargo) === 3);
        h += `<div class="org-equipe"><strong>${EQUIPES[k]}</strong>`
            + (sup.length ? sup.map(p => `<div class="org-no">👤 ${esc(p.nome)} <small>${esc(nomeCargo(p.cargo))}</small></div>`).join('') : '<div class="org-alerta">⚠️ Equipe sem supervisor</div>')
            + aux.map(p => `<div class="org-aux">↳ ${esc(p.nome)} <small>${esc(nomeCargo(p.cargo))}</small></div>`).join('') + '</div>';
    });
    const sem = por(p => p.equipe === 'SEM' && nivel(p.cargo) !== 1);
    if (sem.length) h += `<div class="org-equipe"><strong>${EQUIPES.SEM}</strong>${sem.map(p => `<div class="org-aux">↳ ${esc(p.nome)} <small>${esc(nomeCargo(p.cargo))}</small></div>`).join('')}</div>`;
    return h;
}

let turmaSel = '', ultima = '', elRef = null, ctxRef = null;

function vistaProf(S) {
    const chaves = Object.keys(S.turmas || {});
    if (!turmaSel || !chaves.includes(turmaSel)) turmaSel = chaves[0] || '';
    if (!turmaSel) return '<p class="placeholder-text">Cadastre uma turma na aba 1 para montar as equipes.</p>';
    const org = (S.org || {})[turmaSel] || {};
    const pessoas = S.candidates.filter(c => c.status === 'APPROVED' && (parseTurma(c.turma) || {}).chave === turmaSel).map(c => {
        const o = org[c.id] || {};
        const cargo = o.cargo || c.role;
        return { uid: c.id, nome: c.name, cargo, equipe: o.equipe || equipePadrao(cargo) };
    });
    const linhas = pessoas.map(p => `<tr data-uid="${esc(p.uid)}" data-nome="${esc(p.nome)}"><td>${esc(p.nome)}</td>
        <td><select class="org-cargo">${Object.keys(CARGOS).map(k => `<option value="${k}"${k === p.cargo ? ' selected' : ''}>${esc(CARGOS[k][0])}</option>`).join('')}</select></td>
        <td><select class="org-equipe-sel">${Object.keys(EQUIPES).map(k => `<option value="${k}"${k === p.equipe ? ' selected' : ''}>${EQUIPES[k]}</option>`).join('')}</select></td></tr>`).join('');
    return `<div class="card-box"><h3>🏗️ Equipes da turma</h3>
        <div class="form-group"><label>Turma</label><select onchange="escolherTurmaOrg(this.value)">${chaves.map(k => `<option value="${esc(k)}"${k === turmaSel ? ' selected' : ''}>${esc(S.turmas[k].codigo)}</option>`).join('')}</select></div>
        ${pessoas.length
            ? `<table><thead><tr><th>Aluno</th><th>Cargo</th><th>Equipe</th></tr></thead><tbody>${linhas}</tbody></table><button class="btn btn-success" style="margin-top:0.8rem" onclick="salvarOrg()">Salvar equipes</button>`
            : '<p class="placeholder-text">Nenhum aluno aprovado nesta turma ainda. Aprove os alunos na aba 1.</p>'}
        </div>
        <div class="card-box" style="margin-top:1rem"><h3>Organograma</h3>${arvore(pessoas)}</div>`;
}

function vistaAluno(S, usuario) {
    if (!usuario) return '<p class="placeholder-text">Entre com seu e-mail e senha para ver a sua equipe.</p>';
    const eu = S.eu;
    if (!eu) return '<p class="placeholder-text">Carregando...</p>';
    if (eu.status !== 'APPROVED') return '<p class="placeholder-text">Você está aguardando a aprovação do professor. Assim que for aprovado, o seu cargo e a sua equipe aparecem aqui.</p>';
    const org = (S.org || {})[eu.turmaChave] || {};
    const pessoas = Object.keys(org).map(uid => ({ uid, ...org[uid] }));
    const meu = org[eu.id] || { cargo: eu.role, equipe: equipePadrao(eu.role) };
    return `<div class="card-box"><h3>Minha posição</h3><p>Cargo: <strong>${esc(nomeCargo(meu.cargo))}</strong> · Equipe: <strong>${esc(EQUIPES[meu.equipe] || EQUIPES.SEM)}</strong></p></div>
        <div class="card-box" style="margin-top:1rem"><h3>Organograma da turma</h3>${arvore(pessoas)}</div>`;
}

export function renderEquipes(el, ctx) {
    if (!el) return;
    elRef = el; ctxRef = ctx;
    const { ehProf, usuario, S } = ctx;
    const sig = JSON.stringify([ehProf, !!usuario, S.org, S.eu, Object.keys(S.turmas || {}), turmaSel,
        ehProf ? S.candidates.filter(c => c.status === 'APPROVED').map(c => c.id + c.turma + c.name) : 0]);
    if (sig === ultima) return;
    ultima = sig;
    el.innerHTML = ehProf ? vistaProf(S) : vistaAluno(S, usuario);
}

window.escolherTurmaOrg = (v) => { turmaSel = v; ultima = ''; if (elRef && ctxRef) renderEquipes(elRef, ctxRef); };

window.salvarOrg = () => {
    const up = {};
    document.querySelectorAll('#equipesPanel tr[data-uid]').forEach(tr => {
        up['spae_state_v4/organograma/' + turmaSel + '/' + tr.dataset.uid] = { nome: tr.dataset.nome, cargo: tr.querySelector('.org-cargo').value, equipe: tr.querySelector('.org-equipe-sel').value };
    });
    if (!Object.keys(up).length) return alert('Nenhum aluno aprovado nesta turma.');
    update(ref(db), up).then(() => alert('Equipes salvas.')).catch(() => alert('Sem permissão. Entre como professor.'));
};
