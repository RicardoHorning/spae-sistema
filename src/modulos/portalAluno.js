export const rolesData = {
    'GERENTE': {
        title: 'Diretor / Gerente Geral',
        salary: 'R$ 8.500,00',
        desc: 'Responsável pela tomada de decisão estratégica, gestão do caixa, alocação de metas e visão global da fábrica.'
    },
    'RH_SUP': {
        title: 'Supervisor(a) de RH & Pessoas',
        salary: 'R$ 5.200,00',
        desc: 'Gestão de talentos, controle de ponto digital, clima organizacional e avaliação de desempenho da equipe.'
    },
    'COMPRAS_SUP': {
        title: 'Supervisor(a) de Compras & Logística',
        salary: 'R$ 4.800,00',
        desc: 'Negociação com fornecedores, controle de estoque Kardex, cotações e garantia de suprimentos na linha.'
    },
    'QUALIDADE_SUP': {
        title: 'Analista de Qualidade & Processos',
        salary: 'R$ 4.500,00',
        desc: 'Inspeção AQL de lotes produzidos, abertura de RNCs, monitoramento do SLA e melhoria contínua.'
    },
    'AUXILIAR': {
        title: 'Auxiliar / Assistente Operacional',
        salary: 'R$ 2.900,00',
        desc: 'Execução direta da linha de montagem, movimentação de insumos e apoio às rotinas operacionais.'
    }
};

export const quizQuestions = [
    {
        id: 'q1',
        question: '1. Diante de um atraso crítico na entrega de insumos pela logística, qual sua primeira atitude?',
        options: [
            { text: 'Avisar imediatamente a Gerência e renegociar o prazo com o fornecedor.', value: 'GERENTE' },
            { text: 'Procurar fornecedores alternativos na aba de Compras.', value: 'COMPRAS_SUP' },
            { text: 'Reorganizar o turno de trabalho dos operadores no RH.', value: 'RH_SUP' },
            { text: 'Aumentar a inspeção dos itens em estoque.', value: 'QUALIDADE_SUP' }
        ]
    },
    {
        id: 'q2',
        question: '2. Como você reage quando identifica uma não-conformidade grave na linha de produção?',
        options: [
            { text: 'Paraliso a linha, abro uma RNC e investigo a causa raiz.', value: 'QUALIDADE_SUP' },
            { text: 'Avalio o impacto financeiro e o prejuízo do lote no caixa.', value: 'GERENTE' },
            { text: 'Realizo um feedback individual com o operador do turno.', value: 'RH_SUP' },
            { text: 'Solicito novos insumos para substituir as peças defeituosas.', value: 'COMPRAS_SUP' }
        ]
    }
];

export function updateRoleDetails() {
    const select = document.getElementById('candJobSelect');
    const container = document.getElementById('vagaDetailsContainer');
    if (!select || !container) return;

    const selectedRole = select.value;
    const data = rolesData[selectedRole];

    if (data) {
        container.innerHTML = `
            <div class="vaga-title">${data.title}</div>
            <div class="vaga-salary">Faixa Salarial Prevista: ${data.salary}</div>
            <div class="vaga-desc">${data.desc}</div>
        `;
    }

    renderQuiz();
}

function renderQuiz() {
    const container = document.getElementById('quizQuestionsContainer');
    if (!container) return;

    container.innerHTML = quizQuestions.map(q => `
        <div class="quiz-item-box">
            <label class="quiz-question-label">${q.question}</label>
            <select id="quiz_${q.id}">
                ${q.options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('')}
            </select>
        </div>
    `).join('');
}

export function processQuizAndSubmit(dbRef, currentState) {
    const name = document.getElementById('candName')?.value.trim();
    const email = document.getElementById('candEmail')?.value.trim();
    const phone = document.getElementById('candPhone')?.value.trim();
    const role = document.getElementById('candJobSelect')?.value;

    if (!name || !email) {
        alert('⚠️ Preencha o Nome e o E-mail para concluir sua inscrição.');
        return;
    }

    const candidateId = 'cand_' + Date.now();
    const candidateData = {
        id: candidateId,
        name,
        email,
        phone,
        role,
        status: 'PENDING',
        date: new Date().toLocaleDateString('pt-BR')
    };

    if (!currentState.candidates) currentState.candidates = [];
    currentState.candidates.push(candidateData);

    if (!currentState.analytics) currentState.analytics = {};
    currentState.analytics[candidateId] = {
        score: '92%',
        fit: 'Alta Aderência'
    };

    const btnSubmit = document.getElementById('btnSubmitCand');
    if (btnSubmit) {
        btnSubmit.classList.remove('btn-neon-pulse');
        btnSubmit.classList.add('btn-completed');
        btnSubmit.innerText = '✅ Inscrição Realizada com Sucesso!';
        btnSubmit.disabled = true;
    }

    const navTab0 = document.getElementById('nav-tab0');
    if (navTab0) navTab0.classList.remove('btn-neon-pulse');

    const navTab1 = document.getElementById('nav-tab1');
    if (navTab1) navTab1.classList.add('btn-neon-pulse');

    const gpsText = document.getElementById('gpsText');
    if (gpsText) {
        gpsText.innerHTML = `PASSO 2: Inscrição enviada! O Professor agora deve analisar seu perfil na aba "1. Mercado & Projetos UCs".`;
    }

    localStorage.setItem('spae_state', JSON.stringify(currentState));
    alert('🎉 Inscrição e Quiz concluídos com sucesso! Aguarde a aprovação do Professor.');
    
    if (window.switchTab) {
        window.switchTab('tab1');
    }
}