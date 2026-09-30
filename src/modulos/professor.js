export function renderAnalyticsTable(analytics = {}, candidates = []) {
    const tbody = document.getElementById('tblStudentAnalytics');
    if (!tbody) return;

    if (!candidates || candidates.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Nenhum aluno inscrito no momento.</td></tr>`;
        return;
    }

    tbody.innerHTML = candidates.map(c => {
        const diag = analytics[c.id] || { score: '90%', fit: 'Adequado' };
        const isApproved = c.status === 'APPROVED';

        return `
            <tr>
                <td><strong>${c.name}</strong><br><small style="color:var(--text-muted);">${c.email}</small></td>
                <td>${c.role}</td>
                <td>${diag.score}</td>
                <td><span style="color:var(--neon-green-glow);">${diag.fit}</span></td>
                <td>${isApproved ? '<span style="color:var(--neon-green); font-weight:bold;">Aprovado</span>' : '<span style="color:var(--accent-yellow);">Pendente</span>'}</td>
                <td>
                    ${isApproved 
                        ? '<button class="btn btn-completed" disabled>✅ Aprovado</button>' 
                        : `<button class="btn btn-success" onclick="window.approveStudentAction('${c.id}')">✔️ Aprovar Aluno</button>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}