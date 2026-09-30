// src/modulos/portalAluno.js

export const VAGA_DETAILS = {
    GERENTE: {
        title: "Diretor / Gerente Geral",
        salary: "Remuneração Base: R$ 14.500/mês (Gestão)",
        desc: "Supervisão global da empresa, aprovação estratégica de ordens e coordenação de todos os setores na simulação."
    },
    RH_SUP: {
        title: "Supervisor(a) de RH & Pessoas",
        salary: "Remuneração Base: R$ 8.200/mês (Gestão de Pessoas)",
        desc: "Monitoramento do ponto digital, engajamento dos alunos, contratações e mediação de conflitos na equipe."
    },
    COMPRAS_SUP: {
        title: "Supervisor(a) de Compras & Logística",
        salary: "Remuneração Base: R$ 7.800/mês (Operacional/Logística)",
        desc: "Cotações de matéria-prima, recebimento de materiais no Kardex e controle de custos de suprimentos."
    },
    QUALIDADE_SUP: {
        title: "Analista de Qualidade & Processos",
        salary: "Remuneração Base: R$ 7.500/mês (Qualidade)",
        desc: "Inspeção de produtos, controle de retrabalho e garantia do cumprimento do índice SLA."
    },
    AUXILIAR: {
        title: "Auxiliar / Assistente Operacional",
        salary: "Remuneração Base: R$ 3.500/mês (Operação)",
        desc: "Execução das tarefas diárias, preenchimento de formulários e suporte aos líderes de setor."
    }
};

export const QUIZ_BANK = {
    GERENTE: [
        {
            label: "1. A linha de produção parou por falta de insumos e o cliente ameaça cancelar o contrato. Qual sua ação?",
            options: [
                { text: "Convoco os líderes de Compras, Operação e Financeiro para um plano de contingência e comunico o cliente.", points: 3 },
                { text: "Vou ao almoxarifado conferir o estoque físico para tentar achar itens substitutos.", points: 2 },
                { text: "Aguardo o setor de Compras resolver, pois cada um responde pela sua área.", points: 1 }
            ]
        }
    ],
    RH_SUP: [
        {
            label: "1. O indicador de faltas e atrasos subiu 15% na operação este mês. O que você faz?",
            options: [
                { text: "Analiso os dados do Ponto Digital, identifico gargalos por setor e aplico conversa individual.", points: 3 },
                { text: "Aplico desconto em folha e advertência em todos os faltosos para conter o problema.", points: 2 },
                { text: "Envio um comunicado geral no grupo pedindo colaboração da equipe.", points: 1 }
            ]
        }
    ],
    AUXILIAR: [
        {
            label: "1. Você identificou um lote com defeito visual no início da montagem. Qual o procedimento?",
            options: [
                { text: "Pauso o lote no sistema, notifico o Supervisor de Qualidade e abro um Relatório de Não Conformidade.", points: 3 },
                { text: "Separo as peças ruins no canto e continuo produzindo com as boas sem avisar o sistema.", points: 2 },
                { text: "Tento consertar as peças por conta própria para acelerar a entrega.", points: 1 }
            ]
        }
    ]
};

export function updateRoleDetails() {
    const roleSelect = document.getElementById('candJobSelect');
    if (!roleSelect) return;
    const role = roleSelect.value;
    
    // Atualiza Detalhes da Vaga
    const vaga = VAGA_DETAILS[role] || VAGA_DETAILS.AUXILIAR;
    const detailsContainer = document.getElementById('vagaDetailsContainer');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="vaga-title">${vaga.title}</div>
            <div class="vaga-salary">${vaga.salary}</div>
            <div class="vaga-desc"><strong>Descrição das Atividades:</strong> ${vaga.desc}</div>
        `;
    }

    // Atualiza Quiz
    const quizContainer = document.getElementById('quizQuestionsContainer');
    const questions = QUIZ_BANK[role] || QUIZ_BANK.AUXILIAR;
    if (quizContainer) {
        let html = '';
        questions.forEach((q, idx) => {
            html += `
                <div class="form-group" style="margin-bottom:1rem;">
                    <label style="color:var(--text-light); font-size:0.85rem;">${q.label}</label>
                    <select id="quizAnswer_${idx}" class="quiz-dynamic-answer">
                        ${q.options.map(opt => `<option value="${opt.points}">${opt.text}</option>`).join('')}
                    </select>
                </div>
            `;
        });
        quizContainer.innerHTML = html;
    }
}

export function processQuizAndSubmit(dbRef, currentState) {
    const name = document.getElementById('candName').value.trim();
    const phone = document.getElementById('candPhone').value.trim();
    const role = document.getElementById('candJobSelect').value;

    if (!name || !phone) {
        alert('Por favor, preencha seu nome e telefone!');
        return;
    }

    const answerElements = document.querySelectorAll('.quiz-dynamic-answer');
    let totalPoints = 0;
    let maxPoints = (answerElements.length || 1) * 3;

    answerElements.forEach(el => totalPoints += parseInt(el.value || '0', 10));

    let fitScore = Number(((totalPoints / maxPoints) * 10).toFixed(1));
    let profileLabel = fitScore >= 8.5 ? "🏆 Alta Aderência" : "📊 Boa Aderência";

    const studentId = 'STU_' + Math.floor(Math.random() * 8999 + 1000);
    const candidates = currentState.candidates || [];
    candidates.push({ id: studentId, name, phone, role, profileLabel, fitScore, status: 'PENDING' });

    const analytics = currentState.analytics || {};
    analytics[studentId] = { name, role, profileLabel, activeSeconds: 0, actionsCount: 0, score: fitScore };

    dbRef.update({ candidates, analytics });
    alert(`✅ Inscrição enviada!\n\nNota de Aderência: ${fitScore}/10.0\nAguarde aprovação do Professor.`);
}