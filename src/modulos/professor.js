// src/modulos/professor.js

export function renderAnalyticsTable(analytics, candidates, approveCallback) {
    const tableBody = document.getElementById('tblStudentAnalytics');
    if (!tableBody) return;

    const list = candidates || [];
    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum aluno inscrito no momento.</td></tr>`;
        return;
    }

    let html = '';
    list.forEach(c => {
        const isApproved = c.status === 'APPROVED';
        const statusBadge = isApproved 
            ? `<span style="color:var(--neon-green); font-weight:bold;">✅ Aprovado</span>` 
            : `<span style="color:var(--accent-yellow); font-weight:bold;">⏳ Em Análise</span>`;
            
        const actionButton = isApproved
            ? `<button class="btn btn-completed" disabled>Aprovado</button>`
            : `<button class="btn btn-success" onclick="window.approveStudentAction('${c.id}')">Aprovar Cargo</button>`;

        html += `
            <tr>
                <td><strong>${c.name}</strong><br><small style="color:var(--text-muted);">${c.phone || ''}</small></td>
                <td>${c.role}</td>
                <td>${c.profileLabel || 'Aderência Padrão'}</td>
                <td><strong style="color:var(--neon-blue);">${c.fitScore || '8.0'} / 10.0</strong></td>
                <td>${statusBadge}</td>
                <td>${actionButton}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}