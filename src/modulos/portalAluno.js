export function processQuizAndSubmit(dbRef, currentState) {
    const name = document.getElementById('candName')?.value.trim();
    const phone = document.getElementById('candPhone')?.value.trim();
    const role = document.getElementById('candJobSelect')?.value || 'AUXILIAR';

    if (!name || !phone) {
        alert('⚠️ Por favor, preencha o Nome Completo e o Celular/WhatsApp!');
        return;
    }

    const answerElements = document.querySelectorAll('.quiz-dynamic-answer');
    let totalPoints = 0;
    let maxPoints = (answerElements.length || 1) * 3;

    answerElements.forEach(el => totalPoints += parseInt(el.value || '0', 10));

    let fitScore = Number(((totalPoints / maxPoints) * 10).toFixed(1));
    let profileLabel = "👥 Aderência Operacional (Em Formação)";
    if (fitScore >= 8.5) profileLabel = "🏆 Alta Aderência / Perfil Liderança";
    else if (fitScore >= 6.0) profileLabel = "📊 Boa Aderência Analítica";

    const studentId = 'STU_' + Math.floor(Math.random() * 8999 + 1000);
    const newCandidate = { id: studentId, name, phone, role, profileLabel, fitScore, status: 'PENDING' };

    currentState.candidates = currentState.candidates || [];
    currentState.candidates.push(newCandidate);

    currentState.analytics = currentState.analytics || {};
    currentState.analytics[studentId] = { name, role, profileLabel, activeSeconds: 0, actionsCount: 0, score: fitScore };

    // Salva localmente imediatamente
    localStorage.setItem('spae_local_candidate', JSON.stringify(newCandidate));

    // Exibe sucesso imediato para o usuário
    alert(`✅ Inscrição Enviada com Sucesso!\n\n• Candidato: ${name}\n• Cargo: ${VAGA_DETAILS[role]?.title || role}\n• Nota de Aderência: ${fitScore} / 10.0\n• Perfil: ${profileLabel}\n\nSua candidatura foi registrada e está aguardando avaliação!`);

    // Tenta sincronizar em segundo plano no Firebase
    if (dbRef && set) {
        set(dbRef, currentState).catch(err => console.warn("Modo Offline: Dados mantidos localmente.", err));
    }
}