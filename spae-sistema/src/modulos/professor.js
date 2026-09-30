// src/modulos/professor.js

export const UC_COMPANIES = {
    SST: { name: "Metalúrgica Indústria Forte S/A", sector: "Industrial Heavy", defaultBudget: 22000 },
    LOGISTICA: { name: "LogiTech Centro de Distribuição", sector: "Armazenagem & Frete", defaultBudget: 18000 },
    RH_ROTINAS: { name: "Nexus Serviços & Tecnologia", sector: "Corporate Services", defaultBudget: 15000 },
    QUALIDADE: { name: "BioAlimentos S/A", sector: "Processamento de Alimentos", defaultBudget: 25000 },
    FINANCEIRO_UC: { name: "FinCorp Consultoria Empresarial", sector: "Mercado Financeiro", defaultBudget: 30000 }
};

export function renderAnalyticsTable(analytics = {}, candidates = [], onApprove) {
    const tbody = document.getElementById('tblStudentAnalytics');
    if (!tbody) return;

    if (!analytics || Object.keys(analytics).length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhum aluno em atividade.</td></tr>';
        return;
    }

    let html = '';
    Object.keys(analytics).forEach(id => {
        const a = analytics[id];
        const cand = candidates.find(c => c.id === id) || {};
        const mins = Math.floor((a.activeSeconds || 0) / 60);
        const secs = (a.activeSeconds || 0) % 60;
        let badgeClass = a.score >= 8.0 ? 'grade-high' : (a.score >= 5.0 ? 'grade-med' : 'grade-low');
        const isApproved = cand.status === 'APPROVED';

        html += `
            <tr>
                <td><strong>${a.name}</strong></td>
                <td>${a.role || 'Assistente'}</td>
                <td><span style="color:var(--accent-yellow); font-weight:bold;">${a.profileLabel || 'Em Análise'}</span></td>
                <td>⏱️ ${mins}m ${secs}s</td>
                <td>🎯 ${a.actionsCount || 0}</td>
                <td><span class="metric-badge ${badgeClass}">${a.score || 5.0} / 10.0</span></td>
                <td>
                    ${isApproved ? 
                        `<span class="metric-badge grade-high">Aprovado</span>` : 
                        `<button class="btn btn-success" style="padding:2px 6px; font-size:0.7rem;" data-id="${id}">Aprovar Cargo</button>`
                    }
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;

    tbody.querySelectorAll('button[data-id]').forEach(btn => {
        btn.addEventListener('click', (e) => onApprove(e.target.getAttribute('data-id')));
    });
}