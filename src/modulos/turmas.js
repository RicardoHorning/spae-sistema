// src/modulos/turmas.js — cadastro de turmas, UC ativa e importação da lista de alunos
import { db, ref, refPath, set, update } from '../config/firebase.js';
import { CATALOGO, ucNome } from './catalogo.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function parseTurma(txt) {
    const m = /^([A-Z]{3})-([A-Z])-(G\d{5})\/(\d{4})$/.exec((txt || '').trim().toUpperCase());
    if (!m) return null;
    const turnos = { V: 'Vespertino', M: 'Matutino', N: 'Noturno' };
    return { codigo: m[0], chave: m[0].replace('/', '-'), modalidade: m[1], turno: turnos[m[2]] || m[2], numero: m[3], ano: m[4] };
}

// Lê linhas do diário de classe: "1 01131617 M Nome do Aluno . . . 0"
export function lerLista(texto) {
    const alunos = {};
    texto.split('\n').forEach(l => {
        const m = /^\s*\d+\s+(\d{6,9})\s+([A-Z])\s+(.+?)(?:\s+[.F](?:\s|$)|\s+\d+\s*$|$)/.exec(l);
        if (m && !alunos[m[1]]) alunos[m[1]] = { nome: m[3].trim(), sit: m[2] };
    });
    return alunos;
}

window.salvarTurma = () => {
    const t = parseTurma(document.getElementById('tCodigo').value);
    if (!t) return alert('Código inválido. Use o formato APB-V-G00270/2025.');
    const ucs = [...document.getElementById('tUcs').selectedOptions].map(o => o.value);
    if (!ucs.length) return alert('Escolha ao menos uma UC ativa.');
    update(refPath('turmas/' + t.chave), { codigo: t.codigo, turno: t.turno, ano: t.ano, ucs })
        .then(() => alert('Turma salva: ' + t.codigo))
        .catch(() => alert('Sem permissão. Entre como professor.'));
};

window.importarLista = () => {
    const chave = document.getElementById('tImpTurma').value;
    const alunos = lerLista(document.getElementById('tLista').value);
    const n = Object.keys(alunos).length;
    if (!chave || !n) return alert('Escolha a turma e cole a lista (linhas com número, código e nome).');
    update(refPath('turmas/' + chave + '/alunos'), alunos)
        .then(() => alert(n + ' alunos importados.'))
        .catch(() => alert('Sem permissão. Entre como professor.'));
};

let ultima = '';
export function renderTurmasPanel(el, turmas, logado) {
    if (!el) return;
    el.style.display = logado ? 'block' : 'none';
    const sig = logado + JSON.stringify(turmas);
    if (sig === ultima) return;
    ultima = sig;
    const lista = Object.keys(turmas || {}).map(k => {
        const t = turmas[k];
        return `<div class="turma-item"><strong>${esc(t.codigo)}</strong> <small>${esc(t.turno)} · ${Object.keys(t.alunos || {}).length} alunos</small><br>UC ativa: ${(t.ucs || []).map(u => esc(ucNome(u))).join('; ')}</div>`;
    }).join('') || '<p class="placeholder-text">Nenhuma turma cadastrada.</p>';
    el.innerHTML = `
        <h3>🏫 Turmas e UC ativa</h3>
        <div class="grid-2col">
            <div>
                <div class="form-group"><label>Código da turma</label><input id="tCodigo" placeholder="APB-V-G00270/2025"></div>
                <div class="form-group"><label>UC ativa (segure Ctrl para marcar mais de uma)</label>
                    <select id="tUcs" multiple size="8">${CATALOGO.map(u => `<option value="${u.id}">${esc(u.nome)} (${u.ch}h) — ${u.cursos.join('/')}</option>`).join('')}</select></div>
                <button class="btn btn-success" onclick="salvarTurma()">Salvar turma</button>
            </div>
            <div>
                <div class="form-group"><label>Importar lista de alunos (cole as linhas do diário)</label>
                    <select id="tImpTurma">${Object.keys(turmas || {}).map(k => `<option value="${esc(k)}">${esc(turmas[k].codigo)}</option>`).join('')}</select></div>
                <textarea id="tLista" placeholder="1 01131617 M Nome do Aluno"></textarea>
                <button class="btn btn-success" style="margin-top:0.5rem" onclick="importarLista()">Importar alunos</button>
            </div>
        </div>${lista}`;
}
