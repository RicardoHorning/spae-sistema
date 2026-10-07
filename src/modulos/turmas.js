// src/modulos/turmas.js — cadastro de turmas, UC ativa e importação da lista de alunos
import { db, ref, refPath, set, update } from '../config/firebase.js';
import { CATALOGO, CURSOS, ucNome, cursoNome } from './catalogo.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// UCs marcadas ficam guardadas aqui, então dá para marcar UCs de cursos diferentes na mesma turma
let marcadas = new Set();
const resumo = () => { const el = document.getElementById('tResumo'); if (el) el.textContent = marcadas.size + ' UC(s) marcada(s)'; };
const ucsHtml = (curso) => CATALOGO.filter(u => curso === 'TODOS' || u.cursos.includes(curso)).map(u =>
    `<label style="display:flex;gap:6px;font-size:0.78rem;margin:0"><input type="checkbox" class="tUc" value="${u.id}" style="width:auto" onchange="marcarUc(this)"${marcadas.has(u.id) ? ' checked' : ''}> ${esc(u.nome)} (${u.ch}h)${curso === 'TODOS' ? ' — ' + u.cursos.join('/') : ''}</label>`).join('');
const cursoDasUcs = () => {
    const cs = new Set();
    marcadas.forEach(id => { const u = CATALOGO.find(x => x.id === id); if (u && u.cursos.length === 1) cs.add(u.cursos[0]); });
    return cs.size > 1 ? 'TODOS' : (cs.size === 1 ? [...cs][0] : document.getElementById('tCurso').value);
};
window.marcarUc = (el) => { if (el.checked) marcadas.add(el.value); else marcadas.delete(el.value); resumo(); };
window.trocarCurso = () => { document.getElementById('tUcs').innerHTML = ucsHtml(document.getElementById('tCurso').value); };

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
    const ucs = [...marcadas];
    if (!ucs.length) return alert('Escolha ao menos uma UC ativa.');
    update(refPath('turmas/' + t.chave), { codigo: t.codigo, turno: t.turno, ano: t.ano, curso: cursoDasUcs(), ucs })
        .then(() => alert('Turma salva: ' + t.codigo))
        .catch(() => alert('Sem permissão. Entre como professor.'));
};

// Lê o PDF do diário no próprio navegador (nada é enviado para fora) e importa os alunos
function carregarPdfJs() {
    if (window.pdfjsLib) return Promise.resolve();
    return new Promise((ok, erro) => {
        const sc = document.createElement('script');
        sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        sc.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; ok(); };
        sc.onerror = erro;
        document.head.appendChild(sc);
    });
}

async function textoDoPdf(arquivo) {
    await carregarPdfJs();
    const pdf = await window.pdfjsLib.getDocument({ data: await arquivo.arrayBuffer() }).promise;
    let saida = '';
    for (let p = 1; p <= pdf.numPages; p++) {
        const itens = (await (await pdf.getPage(p)).getTextContent()).items;
        const linhas = {};
        itens.forEach(i => { const y = Math.round(i.transform[5] / 3); (linhas[y] = linhas[y] || []).push(i); });
        Object.keys(linhas).sort((a, b) => b - a).forEach(y => {
            saida += linhas[y].sort((a, b) => a.transform[4] - b.transform[4]).map(i => i.str).join(' ') + '\n';
        });
    }
    return saida;
}

window.importarPdf = async () => {
    const arq = document.getElementById('tPdf').files[0];
    if (!arq) return alert('Escolha o arquivo PDF do diário de classe.');
    try {
        const texto = await textoDoPdf(arq);
        const achado = /APB-[A-Z]-G\d{5}\/\d{4}/.exec(texto);
        const turma = achado ? parseTurma(achado[0]) : null;
        if (!turma) return alert('Não encontrei o código da turma no PDF.');
        const alunos = lerLista(texto);
        const n = Object.keys(alunos).length;
        if (!n) return alert('Não encontrei alunos neste PDF.');
        if (!confirm(`Turma ${turma.codigo}: ${n} alunos encontrados. Importar?`)) return;
        const curso = /Processos Industriais/i.test(texto) ? 'PI' : (/Assistente Administrativo/i.test(texto) ? 'AA' : null);
        await update(refPath('turmas/' + turma.chave), { codigo: turma.codigo, turno: turma.turno, ano: turma.ano, ...(curso && !(todas[turma.chave] || {}).curso ? { curso } : {}) });
        await update(refPath('turmas/' + turma.chave + '/alunos'), alunos);
        alert(n + ' alunos importados na turma ' + turma.codigo + '.');
    } catch (e) {
        alert('Não consegui ler o PDF. Confira a internet e tente de novo, ou use o campo de colar o texto.');
    }
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
let todas = {};

window.preencherTurma = () => {
    const p = parseTurma(document.getElementById('tCodigo').value);
    const t = p && todas[p.chave];
    if (!t) return;
    marcadas = new Set(t.ucs || []);
    if (t.curso) document.getElementById('tCurso').value = t.curso;
    document.getElementById('tUcs').innerHTML = ucsHtml(document.getElementById('tCurso').value);
    resumo();
};
window.editarTurma = (chave) => {
    document.getElementById('tCodigo').value = (todas[chave] || {}).codigo || '';
    window.preencherTurma();
    document.getElementById('tCodigo').scrollIntoView({ behavior: 'smooth' });
};
export function renderTurmasPanel(el, turmas, logado) {
    if (!el) return;
    todas = turmas || {};
    el.style.display = logado ? 'block' : 'none';
    const sig = logado + JSON.stringify(turmas);
    if (sig === ultima) return;
    ultima = sig;
    const lista = Object.keys(turmas || {}).map(k => {
        const t = turmas[k];
        return `<div class="turma-item"><strong>${esc(t.codigo)}</strong> <small>${esc(cursoNome(t.curso))} · ${esc(t.turno)} · ${Object.keys(t.alunos || {}).length} alunos</small> <button class="btn" style="padding:2px 6px;font-size:0.7rem" onclick="editarTurma('${esc(k)}')">Editar UCs</button><br>UC ativa: ${(t.ucs || []).map(u => esc(ucNome(u))).join('; ')}</div>`;
    }).join('') || '<p class="placeholder-text">Nenhuma turma cadastrada.</p>';
    el.innerHTML = `
        <h3>🏫 Turmas e UC ativa</h3>
        <div class="grid-2col">
            <div>
                <div class="form-group"><label>Código da turma</label><input id="tCodigo" placeholder="APB-V-G00270/2025" oninput="preencherTurma()"></div>
                <div class="form-group"><label>Curso</label><select id="tCurso" onchange="trocarCurso()">${CURSOS.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}<option value="TODOS">Os dois cursos (integrar)</option></select></div>
                <div class="form-group"><label>UCs desta turma (marque uma ou mais)</label>
                    <div id="tUcs" style="max-height:220px;overflow:auto;border:1px solid var(--border-color);border-radius:6px;padding:0.4rem">${ucsHtml(CURSOS[0].id)}</div><small id="tResumo" style="color:var(--text-muted)">${marcadas.size} UC(s) marcada(s)</small></div>
                <button class="btn btn-success" onclick="salvarTurma()">Salvar turma</button>
            </div>
            <div>
                <div class="form-group"><label>Importar alunos pelo PDF do diário de classe</label>
                    <input type="file" id="tPdf" accept="application/pdf"></div>
                <button class="btn btn-success" onclick="importarPdf()">Importar PDF</button>
                <div class="form-group" style="margin-top:1rem"><label>Ou cole as linhas do diário (alternativa)</label>
                    <select id="tImpTurma">${Object.keys(turmas || {}).map(k => `<option value="${esc(k)}">${esc(turmas[k].codigo)}</option>`).join('')}</select></div>
                <textarea id="tLista" placeholder="1 01131617 M Nome do Aluno"></textarea>
                <button class="btn btn-success" style="margin-top:0.5rem" onclick="importarLista()">Importar alunos</button>
            </div>
        </div>${lista}`;
}
