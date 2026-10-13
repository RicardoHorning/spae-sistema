// src/modulos/mesas.js — mesas de trabalho das áreas (abas 3 a 7), painel estratégico e relatório de desempenho
import { EQUIPES, CARGOS } from './equipes.js';
import { ucNome } from './catalogo.js';
import { turmaAtual } from './tarefas.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hoje = () => new Date().toLocaleDateString('sv-SE');
const est = (t) => (t.status !== 'CONCLUIDA' && t.prazo && t.prazo < hoje() ? 'ATRASADA' : t.status);
const NOME = { PENDENTE: 'Pendente', ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída', ATRASADA: 'Atrasada' };
const noPrazo = (t) => t.status === 'CONCLUIDA' && (!t.concluidaEm || !t.prazo || t.concluidaEm <= new Date(t.prazo + 'T23:59:59').getTime());
const MESAS = { mesa4: ['Compras e Logística', ['COMPRAS']], mesa5: ['Operação e Produção', ['OPERACAO']], mesa6: ['Qualidade e Processos', ['QUALIDADE']], mesa7: ['Financeiro e Comercial', ['FIN', 'MKT']] };
let ultima = '', csv = '';

const soma = (ts, k) => ts.filter(t => t.status === 'CONCLUIDA' && t.efeito).reduce((s, t) => s + (Number(t.efeito[k]) || 0), 0);
const fmt = (n) => (n > 0 ? '+' : '') + n.toLocaleString('pt-BR');
const tabela = (ts) => `<table><thead><tr><th>Tarefa</th><th>Executa</th><th>Prazo</th><th>Status</th></tr></thead><tbody>${ts.sort((a, b) => (a.prazo || '').localeCompare(b.prazo || '')).map(t => `<tr><td>${esc(t.titulo)}<br><small>${esc(t.atividade || '')}</small></td><td>${esc(t.execNome)}</td><td>${esc(t.prazo || '')}</td><td>${NOME[est(t)]}</td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center">Nenhuma tarefa.</td></tr>'}</tbody></table>`;
const contagem = (ts) => ['PENDENTE', 'ANDAMENTO', 'CONCLUIDA', 'ATRASADA'].map(k => `${NOME[k]}: <strong>${ts.filter(t => est(t) === k).length}</strong>`).join(' · ');
const avisos = (a) => a.map(x => `<div class="alert-box">📣 <strong>${esc(x.titulo)}</strong> — ${esc(x.texto)}</div>`).join('');

function mesaArea(titulo, eqs, ts, pessoas) {
    const m = ts.filter(t => eqs.includes(t.eq));
    const eq = pessoas.filter(p => eqs.includes(p.equipe));
    return `<div class="card-box"><h3>${esc(titulo)}</h3>
        <p class="placeholder-text">Equipe: ${eq.map(p => `${esc(p.nome)} (${esc((CARGOS[p.cargo] || [p.cargo])[0])})`).join('; ') || 'ninguém ainda — defina na aba 2'}</p>
        <p class="placeholder-text">${contagem(m)}</p>
        <p class="placeholder-text">Resultado das tarefas concluídas: Caixa <strong>R$ ${fmt(soma(m, 'caixa'))}</strong> · Estoque <strong>${fmt(soma(m, 'estoque'))} un.</strong></p>${tabela(m)}</div>`;
}

function mesaGerencia(ts, pessoas, avs, ehProf) {
    const eqs = Object.keys(EQUIPES).filter(k => k !== 'SEM');
    const linhas = eqs.map(k => {
        const m = ts.filter(t => t.eq === k);
        if (!m.length) return '';
        const c = m.filter(t => t.status === 'CONCLUIDA').length, a = m.filter(t => est(t) === 'ATRASADA').length;
        return `<tr><td>${EQUIPES[k]}</td><td>${m.length}</td><td>${c}</td><td>${a}</td><td>${Math.round(100 * (m.length - a) / m.length)}%</td></tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center">Sem tarefas ainda.</td></tr>';
    const atras = ts.filter(t => est(t) === 'ATRASADA');
    let h = `${avisos(avs)}<div class="card-box"><h3>📊 Painel estratégico</h3>
        <p class="placeholder-text">Resultado acumulado das tarefas concluídas: Caixa <strong>R$ ${fmt(soma(ts, 'caixa'))}</strong> · Estoque <strong>${fmt(soma(ts, 'estoque'))} un.</strong> · ${contagem(ts)}</p>
        <table><thead><tr><th>Equipe</th><th>Tarefas</th><th>Concluídas</th><th>Atrasadas</th><th>No prazo</th></tr></thead><tbody>${linhas}</tbody></table></div>
        <div class="card-box" style="margin-top:1rem"><h3>⚠️ Gargalos (tarefas atrasadas)</h3>${atras.length ? tabela(atras) : '<p class="placeholder-text">Nenhuma tarefa atrasada.</p>'}</div>`;
    if (!ehProf) return h;
    const al = {}, uc = {};
    ts.forEach(t => {
        if (t.exec) {
            const a = al[t.exec] || (al[t.exec] = { n: t.execNome, t: 0, c: 0, p: 0, a: 0 });
            a.t++; if (t.status === 'CONCLUIDA') a.c++; if (noPrazo(t)) a.p++; if (est(t) === 'ATRASADA') a.a++;
        }
        const k = t.uc || '—', u = uc[k] || (uc[k] = { t: 0, c: 0, a: 0 });
        u.t++; if (t.status === 'CONCLUIDA') u.c++; if (est(t) === 'ATRASADA') u.a++;
    });
    const org = {}; pessoas.forEach(p => { org[p.uid] = p; });
    const rows = Object.keys(al).map(id => { const a = al[id], p = org[id] || {}; return [a.n, (CARGOS[p.cargo] || [''])[0], EQUIPES[p.equipe] || '', a.t, a.c, a.p, a.a, a.t ? Math.round(100 * a.p / a.t) + '%' : '0%']; });
    csv = '\uFEFF' + [['Aluno', 'Cargo', 'Equipe', 'Tarefas', 'Concluídas', 'No prazo', 'Atrasadas', '% no prazo'], ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    h += `<div class="card-box" style="margin-top:1rem"><h3>📈 Relatório de desempenho</h3>
        <table><thead><tr><th>Aluno</th><th>Tarefas</th><th>Concluídas</th><th>No prazo</th><th>Atrasadas</th><th>% no prazo</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td><td>${r[7]}</td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center">Sem dados.</td></tr>'}</tbody></table>
        <button class="btn btn-success" style="margin-top:0.8rem" onclick="baixarRelatorio()">⬇️ Baixar planilha (CSV)</button>
        <table><thead><tr><th>UC</th><th>Tarefas</th><th>Concluídas</th><th>Atrasadas</th></tr></thead><tbody>${Object.keys(uc).map(k => `<tr><td>${esc(k === '—' ? 'Tarefas avulsas' : ucNome(k))}</td><td>${uc[k].t}</td><td>${uc[k].c}</td><td>${uc[k].a}</td></tr>`).join('')}</tbody></table>
        <p class="placeholder-text">Apoio à avaliação: não substitui a avaliação oficial (média 6,0 e frequência de 75%).</p></div>`;
    return h;
}

export function renderMesas({ ehProf, usuario, S }) {
    const turma = ehProf ? turmaAtual() : (S.eu && S.eu.status === 'APPROVED' ? S.eu.turmaChave : '');
    const sig = JSON.stringify([ehProf, !!usuario, turma, S.tar, S.org, S.avs]);
    if (sig === ultima) return;
    ultima = sig;
    const org = (S.org || {})[turma] || {};
    const pessoas = Object.keys(org).map(uid => ({ uid, ...org[uid] }));
    const bruto = (S.tar || {})[turma] || {};
    const ts = Object.keys(bruto).map(id => ({ id, ...bruto[id], eq: bruto[id].equipe || (org[bruto[id].exec] || {}).equipe || '' }));
    const avs = Object.values((S.avs || {})[turma] || {}).sort((a, b) => b.ts - a.ts).slice(0, 3);
    const vazio = '<p class="placeholder-text">Entre como professor (com uma turma cadastrada) ou como aluno aprovado para ver a mesa de trabalho.</p>';
    const set = (id, h) => { const el = document.getElementById(id); if (el) el.innerHTML = h; };
    set('mesa3', turma ? mesaGerencia(ts, pessoas, avs, ehProf) : vazio);
    Object.keys(MESAS).forEach(id => set(id, turma ? avisos(avs) + mesaArea(MESAS[id][0], MESAS[id][1], ts, pessoas) : vazio));
}

window.baixarRelatorio = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'relatorio_desempenho_spae.csv';
    a.click();
};
