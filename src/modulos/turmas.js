// src/modulos/turmas.js — módulo de turmas: cadastro, manutenção, importação do PDF, limpeza e backup
import { db, ref, auth, update } from '../config/firebase.js';
import { CATALOGO, CURSOS, ucNome, cursoNome } from './catalogo.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const B = 'spae_state_v4/';

export function parseTurma(txt) {
    const c = (txt || '').trim().toUpperCase();
    const m = /^([A-Z]{3})-([A-Z])-(G\d{5})\/(\d{4})$/.exec(c);
    if (m) {
        const turnos = { V: 'Vespertino', M: 'Matutino', N: 'Noturno' };
        return { codigo: m[0], chave: m[0].replace('/', '-'), modalidade: m[1], turno: turnos[m[2]] || m[2], numero: m[3], ano: m[4] };
    }
    // outras escolas: código livre (letras, números, espaço, barra e traço)
    if (/^[A-Z0-9][A-Z0-9 _\/-]{2,29}$/.test(c)) return { codigo: c, chave: c.replace(/[\/ ]/g, '-'), modalidade: '', turno: 'Não informado', numero: c, ano: '—' };
    return null;
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

let marcadas = new Set(), todas = {}, cands = [], ultima = '';
const resumo = () => { const el = document.getElementById('tResumo'); if (el) el.textContent = marcadas.size + ' UC(s) marcada(s)'; };
const ucsHtml = (curso) => CATALOGO.filter(u => curso === 'TODOS' || u.cursos.includes(curso)).map(u =>
    `<label style="display:flex;gap:6px;font-size:0.78rem;margin:0"><input type="checkbox" value="${u.id}" style="width:auto" onchange="marcarUc(this)"${marcadas.has(u.id) ? ' checked' : ''}> ${esc(u.nome)} (${u.ch}h)${curso === 'TODOS' ? ' — ' + u.cursos.join('/') : ''}</label>`).join('');
const cursoDasUcs = () => {
    const cs = new Set();
    marcadas.forEach(id => { const u = CATALOGO.find(x => x.id === id); if (u && u.cursos.length === 1) cs.add(u.cursos[0]); });
    return cs.size > 1 ? 'TODOS' : (cs.size === 1 ? [...cs][0] : document.getElementById('tCurso').value);
};
const doTurma = (k) => cands.filter(c => c.turmaChave === k || (parseTurma(c.turma) || {}).chave === k);
const escolaAtual = () => (window.__perfil || {}).escola || '';
const pub = (p, esc2) => ({ codigo: p.codigo, turno: p.turno, ano: p.ano, escola: esc2 ?? escolaAtual() });
const gravar = (up, ok) => update(ref(db), up).then(() => ok && alert(ok)).catch(() => alert('Sem permissão. Entre como professor.'));
const baixar = (nome, texto) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + texto], { type: 'text/csv;charset=utf-8' })); a.download = nome; a.click(); };

window.marcarUc = (el) => { if (el.checked) marcadas.add(el.value); else marcadas.delete(el.value); resumo(); };
window.trocarCurso = () => { document.getElementById('tUcs').innerHTML = ucsHtml(document.getElementById('tCurso').value); };

window.preencherTurma = () => {
    const p = parseTurma(document.getElementById('tCodigo').value);
    const info = document.getElementById('tInfo');
    if (!p) { info.textContent = 'Digite o código no formato APB-V-G00270/2025.'; return; }
    const t = todas[p.chave];
    info.textContent = `Modalidade ${p.modalidade} · Turno ${p.turno} · Turma ${p.numero} · Início em ${p.ano}` + (t ? ' — já cadastrada (editando)' : ' — turma nova');
    if (!t) return;
    marcadas = new Set(t.ucs || []);
    if (t.curso) document.getElementById('tCurso').value = t.curso;
    document.getElementById('tUcs').innerHTML = ucsHtml(document.getElementById('tCurso').value);
    document.getElementById('tIni').value = t.inicioUc || '';
    document.getElementById('tFim').value = t.fimUc || '';
    resumo();
};
window.editarTurma = (k) => {
    document.getElementById('tCodigo').value = (todas[k] || {}).codigo || '';
    window.preencherTurma();
    document.getElementById('tCodigo').scrollIntoView({ behavior: 'smooth' });
};

window.salvarTurma = () => {
    const p = parseTurma(document.getElementById('tCodigo').value);
    if (!p) return alert('Código inválido. Use o formato APB-V-G00270/2025.');
    if (!marcadas.size) return alert('Marque ao menos uma UC da turma.');
    const status = (todas[p.chave] || {}).status || 'ATIVA';
    const b = B + 'turmas/' + p.chave + '/';
    const up = { [b + 'codigo']: p.codigo, [b + 'turno']: p.turno, [b + 'ano']: p.ano, [b + 'curso']: cursoDasUcs(), [b + 'ucs']: [...marcadas], [b + 'status']: status,
        [b + 'inicioUc']: document.getElementById('tIni').value || null, [b + 'fimUc']: document.getElementById('tFim').value || null,
        [b + 'prof']: (todas[p.chave] || {}).prof || auth.currentUser.uid, [b + 'escola']: (todas[p.chave] || {}).escola || escolaAtual() };
    if (!todas[p.chave]) up[B + 'turmasDoProf/' + auth.currentUser.uid + '/' + p.chave] = true;
    if (status === 'ATIVA') up[B + 'turmasAtivas/' + p.chave] = pub(p, (todas[p.chave] || {}).escola);
    gravar(up, 'Turma salva: ' + p.codigo);
};

window.alternarTurma = (k) => {
    const t = todas[k];
    if (!t) return;
    const ativar = t.status === 'ENCERRADA';
    gravar({ [B + 'turmas/' + k + '/status']: ativar ? 'ATIVA' : 'ENCERRADA', [B + 'turmasAtivas/' + k]: ativar ? pub(parseTurma(t.codigo), t.escola) : null },
        ativar ? 'Turma reativada: volta a aceitar inscrições.' : 'Turma encerrada: não aceita novas inscrições. Os dados foram mantidos.');
};

window.excluirTurma = (k) => {
    if (doTurma(k).length) return alert('Esta turma tem alunos inscritos. Use "Encerrar" para guardar os dados.');
    if (!confirm('Excluir a turma ' + (todas[k] || {}).codigo + ' e a lista de alunos importada?')) return;
    const up = { [B + 'turmas/' + k]: null, [B + 'turmasAtivas/' + k]: null };
    if ((todas[k] || {}).prof === auth.currentUser.uid) up[B + 'turmasDoProf/' + auth.currentUser.uid + '/' + k] = null;
    gravar(up, 'Turma excluída.');
};

window.limparTurma = (k) => {
    const t = todas[k];
    if (!t || prompt('LIMPEZA: apaga inscrições, tarefas, mensagens, avisos e organograma desta turma (a turma e a lista de alunos importada continuam).\nDigite o código da turma para confirmar:') !== t.codigo) return alert('Código diferente: nada foi apagado.');
    const up = {};
    ['tarefas', 'mensagens', 'avisos', 'organograma', 'inscritos'].forEach(n => { up[B + n + '/' + k] = null; });
    doTurma(k).forEach(c => { up[B + 'alunos/' + c.id] = null; });
    gravar(up, 'Dados de teste da turma apagados. As contas de login continuam no Firebase.');
};

window.exportarTurma = (k) => {
    const linhas = [['Aluno', 'Cargo', 'Situação', 'Aderência'], ...doTurma(k).map(c => [c.name, c.role, c.status === 'APPROVED' ? 'Aprovado' : 'Aguardando', c.fitScore])];
    baixar('turma_' + k + '.csv', linhas.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n'));
};

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

function importar(p, alunos, texto) {
    const t = todas[p.chave];
    const n = Object.keys(alunos).length;
    const novos = Object.keys(alunos).filter(m => !((t || {}).alunos || {})[m]);
    if (!n) return alert('Não encontrei alunos na lista.');
    if (!confirm(`Turma ${p.codigo}: ${t ? 'já cadastrada' : 'NOVA (será cadastrada agora)'}.\n${novos.length} aluno(s) novo(s) e ${n - novos.length} que já estavam na lista.\nImportar?`)) return;
    const b = B + 'turmas/' + p.chave + '/';
    const up = {};
    if (!t) Object.assign(up, { [b + 'codigo']: p.codigo, [b + 'turno']: p.turno, [b + 'ano']: p.ano, [b + 'status']: 'ATIVA', [b + 'prof']: auth.currentUser.uid, [b + 'escola']: escolaAtual(), [B + 'turmasAtivas/' + p.chave]: pub(p), [B + 'turmasDoProf/' + auth.currentUser.uid + '/' + p.chave]: true });
    const curso = /Processos Industriais/i.test(texto) ? 'PI' : (/Assistente Administrativo/i.test(texto) ? 'AA' : null);
    if (curso && !(t || {}).curso) up[b + 'curso'] = curso;
    const per = /Per[ií]odo Comp\w*:?\s*(\d{2})\/(\d{2})\/(\d{4})\D{1,6}(\d{2})\/(\d{2})\/(\d{4})/.exec(texto);
    if (per && !(t || {}).inicioUc) { up[b + 'inicioUc'] = `${per[3]}-${per[2]}-${per[1]}`; up[b + 'fimUc'] = `${per[6]}-${per[5]}-${per[4]}`; }
    novos.forEach(m => { up[b + 'alunos/' + m] = alunos[m]; });
    gravar(up, `${novos.length} aluno(s) importado(s) na turma ${p.codigo}.` + (t ? '' : ' Marque as UCs da turma para ela ficar completa.'));
}

window.importarPdf = async () => {
    const arq = document.getElementById('tPdf').files[0];
    if (!arq) return alert('Escolha o arquivo PDF do diário de classe.');
    try {
        const texto = await textoDoPdf(arq);
        const achado = /APB-[A-Z]-G\d{5}\/\d{4}/.exec(texto);
        const p = achado ? parseTurma(achado[0]) : null;
        if (!p) return alert('Não encontrei o código da turma no PDF.');
        importar(p, lerLista(texto), texto);
    } catch (e) {
        alert('Não consegui ler o PDF. Confira a internet e tente de novo, ou use o campo de colar o texto.');
    }
};

window.importarLista = () => {
    const k = document.getElementById('tImpTurma').value;
    if (!k || !todas[k]) return alert('Escolha a turma.');
    importar(parseTurma(todas[k].codigo), lerLista(document.getElementById('tLista').value), '');
};

export function renderTurmasPanel(el, turmas, logado, candidatos) {
    if (!el) return;
    todas = turmas || {};
    cands = candidatos || [];
    el.style.display = logado ? 'block' : 'none';
    const sig = logado + JSON.stringify(todas) + cands.map(c => c.id + c.status + c.turma).join();
    if (sig === ultima) return;
    ultima = sig;
    const lista = Object.keys(todas).map(k => {
        const t = todas[k], ins = doTurma(k), ativa = t.status !== 'ENCERRADA';
        const btn = (txt, js) => `<button class="btn" style="padding:2px 6px;font-size:0.7rem;margin:2px" onclick="${js}('${esc(k)}')">${txt}</button>`;
        return `<div class="turma-item"><strong>${esc(t.codigo)}</strong> <small>${esc(cursoNome(t.curso))} · ${esc(t.turno)} · início em ${esc(t.ano)} · <span style="color:${ativa ? '#22c55e' : '#f59e0b'}">${ativa ? 'Ativa' : 'Encerrada'}</span>${t.inicioUc ? ` · UC de ${esc(t.inicioUc)} a ${esc(t.fimUc || '')}` : ''}</small><br>
            Alunos na lista: ${Object.keys(t.alunos || {}).length} · inscritos: ${ins.length} · aprovados: ${ins.filter(c => c.status === 'APPROVED').length}<br>UCs: ${(t.ucs || []).map(u => esc(ucNome(u))).join('; ') || 'nenhuma marcada'}<br>
            ${btn('Editar UCs', 'editarTurma')}${btn(ativa ? 'Encerrar' : 'Reativar', 'alternarTurma')}${btn('⬇️ Exportar', 'exportarTurma')}${btn('🧹 Limpar testes', 'limparTurma')}${btn('🗑️ Excluir', 'excluirTurma')}</div>`;
    }).join('') || '<p class="placeholder-text">Nenhuma turma cadastrada.</p>';
    el.innerHTML = `<div class="card-box"><h3>🏫 Cadastrar ou editar turma</h3><div class="grid-2col"><div>
            <div class="form-group"><label>Código da turma</label><input id="tCodigo" placeholder="APB-V-G00270/2025" oninput="preencherTurma()"></div>
            <p id="tInfo" class="placeholder-text">Digite o código no formato APB-V-G00270/2025.</p>
            <div class="grid-inputs"><div class="form-group"><label>Início da UC</label><input type="date" id="tIni"></div><div class="form-group"><label>Fim da UC</label><input type="date" id="tFim"></div></div>
            <div class="form-group"><label>Curso</label><select id="tCurso" onchange="trocarCurso()">${CURSOS.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}<option value="TODOS">Os dois cursos (integrar)</option></select></div>
            <div class="form-group"><label>UCs desta turma (marque uma ou mais)</label><div id="tUcs" style="max-height:220px;overflow:auto;border:1px solid var(--border-color);border-radius:6px;padding:0.4rem">${ucsHtml(CURSOS[0].id)}</div><small id="tResumo" style="color:var(--text-muted)">${marcadas.size} UC(s) marcada(s)</small></div>
            <button class="btn btn-success" onclick="salvarTurma()">Salvar turma</button></div>
        <div><div class="form-group"><label>Importar turma e alunos pelo PDF do diário de classe</label><input type="file" id="tPdf" accept="application/pdf"></div>
            <button class="btn btn-success" onclick="importarPdf()">Importar PDF</button>
            <p class="placeholder-text">A turma é cadastrada se ainda não existir, e ninguém é duplicado.</p>
            <div class="form-group" style="margin-top:1rem"><label>Ou cole as linhas do diário (alternativa)</label><select id="tImpTurma">${Object.keys(todas).map(k => `<option value="${esc(k)}">${esc(todas[k].codigo)}</option>`).join('')}</select></div>
            <textarea id="tLista" placeholder="1 01131617 M Nome do Aluno"></textarea><button class="btn" style="margin-top:0.5rem" onclick="importarLista()">Importar alunos</button></div></div></div>
        <div class="card-box" style="margin-top:1rem"><h3>Turmas cadastradas</h3>${lista}</div>`;
}
