// src/modulos/editor.js — editor de atividades: modelos próprios do professor, inclusive integrando duas UCs
import { db, ref, auth, update } from '../config/firebase.js';
import { CATALOGO, ucNome } from './catalogo.js';
import { EQUIPES } from './equipes.js';
import { MODELOS, EF } from './gerador.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NIV = { 3: 'Auxiliar', 2: 'Supervisor', 1: 'Gerente' };
const novoPasso = (nv = 3) => ({ titulo: '', desc: '', nv, eq: 'RH', dias: 1 });
let ed = null, S0 = { modelos: {} }, elRef = null, ultima = '';

const ucOpts = (sel, vazio) => (vazio ? `<option value="">— nenhuma —</option>` : '') + CATALOGO.map(u => `<option value="${u.id}"${u.id === sel ? ' selected' : ''}>${esc(u.nome)}</option>`).join('');
const eqOpts = (sel) => Object.keys(EQUIPES).filter(k => k !== 'SEM' && k !== 'GER').map(k => `<option value="${k}"${k === sel ? ' selected' : ''}>${EQUIPES[k]}</option>`).join('');

function formulario() {
    const p = ed.passos.map((x, i) => `<div class="turma-item"><strong>Etapa ${i + 1}</strong>
        <div class="grid-inputs"><div class="form-group"><label>Título</label><input value="${esc(x.titulo)}" oninput="edPasso(${i},'titulo',this.value)"></div>
        <div class="form-group"><label>Prazo (dias após o início)</label><input type="number" min="1" value="${esc(x.dias)}" oninput="edPasso(${i},'dias',this.value)"></div></div>
        <div class="form-group"><label>Descrição</label><input value="${esc(x.desc)}" oninput="edPasso(${i},'desc',this.value)"></div>
        <div class="grid-inputs"><div class="form-group"><label>Quem faz</label><select onchange="edPasso(${i},'nv',this.value);redEd()">${[3, 2, 1].map(n => `<option value="${n}"${Number(x.nv) === n ? ' selected' : ''}>${NIV[n]}</option>`).join('')}</select></div>
        <div class="form-group"><label>Equipe</label><select ${Number(x.nv) === 1 ? 'disabled' : ''} onchange="edPasso(${i},'eq',this.value)">${eqOpts(x.eq)}</select></div></div>
        <button class="btn" style="padding:2px 8px;font-size:0.72rem" onclick="edDel(${i})">Remover etapa</button></div>`).join('');
    return `<div class="card-box" style="margin-top:1rem"><h3>✏️ ${S0.modelos[ed.id] ? 'Editar' : 'Nova'} atividade</h3>
        <div class="grid-inputs"><div class="form-group"><label>Título *</label><input value="${esc(ed.titulo)}" oninput="edSet('titulo',this.value)"></div>
        <div class="form-group"><label>Empresa fictícia</label><input value="${esc(ed.empresa)}" oninput="edSet('empresa',this.value)"></div></div>
        <div class="grid-inputs"><div class="form-group"><label>UC principal *</label><select onchange="edSet('uc1',this.value)">${ucOpts(ed.uc1)}</select></div>
        <div class="form-group"><label>2ª UC (atividade integrada, opcional)</label><select onchange="edSet('uc2',this.value)">${ucOpts(ed.uc2, true)}</select></div></div>
        <div class="grid-inputs"><div class="form-group"><label>Efeito no Caixa (R$) ao concluir</label><input type="number" value="${esc(ed.caixa)}" oninput="edSet('caixa',this.value)"></div>
        <div class="form-group"><label>Efeito no Estoque (unid.)</label><input type="number" value="${esc(ed.estoque)}" oninput="edSet('estoque',this.value)"></div></div>
        <p class="placeholder-text">As etapas formam uma cadeia: cada uma só libera quando a anterior for concluída. Use números negativos para saída de caixa ou de estoque.</p>${p}
        <button class="btn" onclick="edAdd()">➕ Adicionar etapa</button>
        <button class="btn btn-success" style="margin-left:0.5rem" onclick="edSalvar()">Salvar atividade</button>
        <button class="btn" style="margin-left:0.5rem" onclick="edCancelar()">Cancelar</button></div>`;
}

function desenhar() {
    if (!elRef) return;
    const meus = Object.keys(S0.modelos || {}).map(id => {
        const m = S0.modelos[id];
        return `<tr><td>${esc(m.titulo)}</td><td>${(m.ucs || [m.uc]).map(u => esc(ucNome(u))).join(' + ')}</td><td>${Object.keys(m.passos || {}).length}</td>
            <td><button class="btn" style="padding:2px 6px;font-size:0.7rem" onclick="edEditar('${esc(id)}')">Editar</button> <button class="btn" style="padding:2px 6px;font-size:0.7rem" onclick="edExcluir('${esc(id)}')">Excluir</button></td></tr>`;
    }).join('') || '<tr><td colspan="4" style="text-align:center">Você ainda não criou atividades.</td></tr>';
    const prontas = MODELOS.map(m => `<tr><td>${esc(m.titulo)}</td><td>${(m.ucs || [m.uc]).map(u => esc(ucNome(u))).join(' + ')}</td><td>${m.passos.length}</td><td><button class="btn" style="padding:2px 6px;font-size:0.7rem" onclick="edDup('${esc(m.id)}')">Duplicar e editar</button></td></tr>`).join('');
    elRef.innerHTML = `<div class="card-box"><h3>📚 Minhas atividades</h3><button class="btn btn-success" onclick="edNovo()">➕ Criar atividade</button>
        <table><thead><tr><th>Atividade</th><th>UC</th><th>Etapas</th><th>Ações</th></tr></thead><tbody>${meus}</tbody></table>
        <details style="margin-top:1rem"><summary style="cursor:pointer;color:var(--accent-blue)">Atividades prontas do sistema (${MODELOS.length}) — duplique para adaptar</summary>
        <table><thead><tr><th>Atividade</th><th>UC</th><th>Etapas</th><th>Ações</th></tr></thead><tbody>${prontas}</tbody></table></details></div>${ed ? formulario() : ''}`;
}

export function renderEditor(el, { ehProf, S }) {
    if (!el) return;
    elRef = el; S0 = S;
    const sig = ehProf + JSON.stringify(S.modelos || {});
    if (sig === ultima) return;
    ultima = sig;
    if (ehProf) desenhar(); else el.innerHTML = '';
}

const redes = () => { ultima = ''; desenhar(); };
window.redEd = redes;
window.edSet = (k, v) => { ed[k] = v; };
window.edPasso = (i, k, v) => { ed.passos[i][k] = v; };
window.edAdd = () => { ed.passos.push(novoPasso(2)); redes(); };
window.edDel = (i) => { if (ed.passos.length > 1) { ed.passos.splice(i, 1); redes(); } };
window.edCancelar = () => { ed = null; redes(); };
window.edNovo = () => { ed = { id: 'M' + Date.now().toString(36), titulo: '', empresa: '', uc1: 'UC08', uc2: '', caixa: 0, estoque: 0, passos: [novoPasso(3), novoPasso(1)] }; redes(); };
window.edEditar = (id) => {
    const m = S0.modelos[id];
    ed = { id, titulo: m.titulo, empresa: m.empresa || '', uc1: (m.ucs || [m.uc])[0], uc2: (m.ucs || [])[1] || '', caixa: (m.ef || {}).caixa || 0, estoque: (m.ef || {}).estoque || 0, passos: Object.values(m.passos || {}).map(p => ({ ...p })) };
    redes();
};
window.edDup = (id) => {
    const m = MODELOS.find(x => x.id === id), ef = m.ef || EF[m.passos[0][3]] || {};
    ed = { id: 'M' + Date.now().toString(36), titulo: m.titulo + ' (cópia)', empresa: m.empresa, uc1: (m.ucs || [m.uc])[0], uc2: (m.ucs || [])[1] || '', caixa: ef.caixa || 0, estoque: ef.estoque || 0,
        passos: m.passos.map(([titulo, desc, nv, eq, dias]) => ({ titulo, desc, nv, eq: eq === 'GER' ? 'RH' : eq, dias })) };
    redes();
};
window.edExcluir = (id) => {
    if (!confirm('Excluir esta atividade? As tarefas já geradas continuam nas turmas.')) return;
    update(ref(db), { ['spae_state_v4/modelos/' + auth.currentUser.uid + '/' + id]: null }).catch(() => alert('Sem permissão.'));
};
window.edSalvar = () => {
    if (!ed.titulo.trim()) return alert('Dê um título à atividade.');
    if (ed.passos.some(p => !p.titulo.trim())) return alert('Todas as etapas precisam de título.');
    const ucs = ed.uc2 && ed.uc2 !== ed.uc1 ? [ed.uc1, ed.uc2] : [ed.uc1];
    const obj = { titulo: ed.titulo.trim(), empresa: ed.empresa.trim(), uc: ed.uc1, ucs, ef: { caixa: Number(ed.caixa) || 0, estoque: Number(ed.estoque) || 0 },
        passos: ed.passos.map(p => ({ titulo: p.titulo.trim(), desc: (p.desc || '').trim(), nv: Number(p.nv), eq: Number(p.nv) === 1 ? 'GER' : p.eq, dias: Math.max(1, Number(p.dias) || 1) })) };
    update(ref(db), { ['spae_state_v4/modelos/' + auth.currentUser.uid + '/' + ed.id]: obj })
        .then(() => { alert('Atividade salva. Ela já aparece no gerador, na aba Tarefas.'); ed = null; redes(); })
        .catch(() => alert('Não foi possível salvar.'));
};
