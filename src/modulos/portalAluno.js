// src/modulos/portalAluno.js
import { db, ref, update } from '../config/firebase.js';
import { parseTurma } from './turmas.js';

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

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
            label: "1. A linha de produção parou por falta de insumos de Compras e o cliente principal ameaça cancelar o contrato com multa. Qual sua primeira ação?",
            options: [
                { text: "Convoco emergencialmente Compras, Operação e Financeiro para plano de contingência e comunico o cliente com transparência.", points: 3 },
                { text: "Vou pessoalmente ao almoxarifado conferir o estoque físico para tentar encontrar itens substitutos.", points: 2 },
                { text: "Aguardo o setor de Compras resolver o problema, pois cada um deve responder pela sua área.", points: 1 }
            ]
        },
        {
            label: "2. Os supervisores de Compras e Produção estão em conflito aberto, trocando acusações sobre atrasos e travando o fluxo. Como procede?",
            options: [
                { text: "Reúno ambos com dados do sistema, estabeleço meta comum e redefino papéis/SLAs formais de entrega.", points: 3 },
                { text: "Aplico uma advertência formal em ambos conforme o regulamento interno.", points: 2 },
                { text: "Deixo que eles se entendam sozinhos para não desgastar minha autoridade com discussões operacionais.", points: 1 }
            ]
        },
        {
            label: "3. O caixa da empresa está crítico e há duas demandas urgentes: comprar insumos para pedido de alta margem ou manutenção preventiva da fábrica. Como decide?",
            options: [
                { text: "Analiso o DRE e fluxo de caixa com o Financeiro, priorizando o pedido que gera receita imediata com manutenção emergencial mínima.", points: 3 },
                { text: "Cancelo a manutenção totalmente para focar 100% dos recursos na compra de matéria-prima.", points: 2 },
                { text: "Adio ambas as decisões até o caixa fechar positivo no próximo mês.", points: 1 }
            ]
        },
        {
            label: "4. Um setor estratégico está sobrecarregado e prestes a estourar o SLA, enquanto outro está ocioso. Qual a conduta gerencial?",
            options: [
                { text: "Mapeio o gargalo no sistema, rebalanceio temporariamente a equipe capacitada e ajusto o ritmo da linha.", points: 3 },
                { text: "Exijo hora extra imediata da equipe sobrecarregada sem analisar as causas do gargalo.", points: 2 },
                { text: "Aguardo a demanda do setor sobrecarregado diminuir naturalmente.", points: 1 }
            ]
        }
    ],
    RH_SUP: [
        {
            label: "1. O indicador de absenteísmo (faltas e atrasos) subiu 15% na operação este mês. Qual sua estratégia?",
            options: [
                { text: "Analiso os dados do Ponto Digital, identifico os setores afetados e aplico conversas individuais/pesquisa de clima.", points: 3 },
                { text: "Aplico desconto imediato em folha e advertência em todos os faltosos para conter o problema.", points: 2 },
                { text: "Envio um e-mail geral cobrando pontualidade sem investigar os motivos.", points: 1 }
            ]
        },
        {
            label: "2. O operador de maior produtividade descumpriu deliberadamente uma norma crítica de Segurança do Trabalho (SST). Como atuar?",
            options: [
                { text: "Interrompo a atividade imediatamente, aplico o protocolo de SST e alinho reciclagem, garantindo a regra igual para todos.", points: 3 },
                { text: "Aplico apenas um aviso verbal informal no final do expediente para não interromper a produção.", points: 2 },
                { text: "Tolero a falha sem registro devido ao alto rendimento e entregas do colaborador.", points: 1 }
            ]
        },
        {
            label: "3. Um colaborador possui excelente desempenho técnico, mas apresenta atritos recorrentes com a equipe. O que fazer?",
            options: [
                { text: "Realizo feedback estruturado (1-on-1), estabeleço um Plano de Desenvolvimento Individual (PDI) e monitoro a postura.", points: 3 },
                { text: "Solicito o desligamento imediato para manter a harmonia do grupo.", points: 2 },
                { text: "Ignoro os atritos, desde que as entregas técnicas continuem no prazo.", points: 1 }
            ]
        },
        {
            label: "4. Ruídos de comunicação entre turnos estão gerando retrabalho na fábrica. Qual ação do RH?",
            options: [
                { text: "Promovo um alinhamento de processos e comunicação passarela entre os turnos, padronizando o diário de bordo.", points: 3 },
                { text: "Troco os colaboradores de turno sem prévia consulta técnica.", points: 2 },
                { text: "Oriento a liderança direta a resolver as brigas verbalmente.", points: 1 }
            ]
        }
    ],
    COMPRAS_SUP: [
        {
            label: "1. Você recebeu três cotações: Fornecedor A (mais barato, entrega lenta), Fornecedor B (mais caro, entrega imediata/qualidade) e C (preço médio, sem garantia). Qual escolhe para um pedido urgente?",
            options: [
                { text: "Escolho o Fornecedor B para garantir o SLA e qualidade do cliente, negociando prazo de pagamento.", points: 3 },
                { text: "Escolho o Fornecedor A focado no menor custo, correndo o risco de atraso.", points: 2 },
                { text: "Escolho o Fornecedor C por ser a opção intermediária sem checar histórico.", points: 1 }
            ]
        },
        {
            label: "2. O saldo físico de insumos no almoxarifado não confere com o sistema Kardex. Qual o procedimento correto?",
            options: [
                { text: "Realizo inventário de emergência, abro Relatório de Divergência, identifico a causa raiz e ajusto o saldo oficial.", points: 3 },
                { text: "Altero manualmente o saldo no sistema para bater com a contagem sem investigar a causa.", points: 2 },
                { text: "Ignoro a diferença e continuo liberando materiais normalmente.", points: 1 }
            ]
        },
        {
            label: "3. A transportadora informou que a matéria-prima atrasará 24h e a linha pode parar em 2h. Como reage?",
            options: [
                { text: "Aciono fornecedor secundário para lote de emergência local, alinho com a Produção e rastreio a carga principal.", points: 3 },
                { text: "Aviso a Produção para parar a linha e aguardo a entrega da transportadora.", points: 2 },
                { text: "Cancelo o pedido com a transportadora sem buscar alternativas rápidas.", points: 1 }
            ]
        },
        {
            label: "4. Como otimizar as compras para atender a diretriz de redução de capital parado em estoque?",
            options: [
                { text: "Adoto cálculo de Lote Econômico de Compra (LEC) integrado ao ritmo do plano de produção (Just-in-Time).", points: 3 },
                { text: "Paro totalmente a compra de materiais até zerar o estoque atual.", points: 2 },
                { text: "Compro em grandes volumes para obter desconto, mesmo aumentando o custo de armazenagem.", points: 1 }
            ]
        }
    ],
    QUALIDADE_SUP: [
        {
            label: "1. Durante a inspeção por amostragem, você detecta 15% de peças com falha dimensional. Qual a primeira atitude?",
            options: [
                { text: "Bloqueio a liberação do lote, abro Relatório de Não Conformidade (RNC) e notifico a Produção para conter a causa.", points: 3 },
                { text: "Retiro as peças defeituosas visíveis e aprovo o restante da caixa sem testes adicionais.", points: 2 },
                { text: "Libero o lote avisando o cliente que haverá pequenas divergências.", points: 1 }
            ]
        },
        {
            label: "2. A Produção pressiona para aprovar um lote fora da especificação técnica para não perder o prazo de envio. Como atua?",
            options: [
                { text: "Mantenho o bloqueio técnico, proponho um plano emergencial de retrabalho com a Produção e preservo a qualidade.", points: 3 },
                { text: "Aprovo o lote condicionalmente para atender ao prazo comercial do cliente.", points: 2 },
                { text: "Repasso a decisão de aceitar a peça com defeito ao cliente final.", points: 1 }
            ]
        },
        {
            label: "3. Um cliente devolveu um lote alegando defeito de acabamento. Qual o fluxo correto da Qualidade?",
            options: [
                { text: "Instauro análise de causa raiz (5 Porquês / Ishikawa), reviso o Procedimento Operacional Padrão (POP) e alinho reciclagem.", points: 3 },
                { text: "Solicito apenas a refabricação das peças sem alterar o processo produtivo.", points: 2 },
                { text: "Recuso a devolução alegando que o produto saiu correto da fábrica.", points: 1 }
            ]
        },
        {
            label: "4. Qual a melhor estratégia para garantir que o Índice SLA da empresa se mantenha em 100%?",
            options: [
                { text: "Implemento rotina de auditoria de qualidade no posto de trabalho (Poka-Yoke/Checklists) e gestão à vista.", points: 3 },
                { text: "Aumento a quantidade de inspetores no final da linha de montagem.", points: 2 },
                { text: "Abaixo o nível de rigor das tolerâncias para aprovar mais peças rapidamente.", points: 1 }
            ]
        }
    ],
    AUXILIAR: [
        {
            label: "1. Ao iniciar a operação no seu posto de trabalho, você nota que o instrumento de medição está descalibrado. O que faz?",
            options: [
                { text: "Interrompo a medição, sinalizo o instrumento como não-conforme e solicito a troca à Qualidade/Supervisão.", points: 3 },
                { text: "Tento ajustar o instrumento por conta própria para não atrasar o trabalho.", points: 2 },
                { text: "Continuo trabalhando normalmente utilizando a ferramenta descalibrada.", points: 1 }
            ]
        },
        {
            label: "2. Você recebe duas ordens prioritárias de supervisores diferentes ao mesmo tempo. Como procede?",
            options: [
                { text: "Consulto a Ordem de Produção oficial no sistema, comunico os supervisores e sigo a prioridade técnica registrada.", points: 3 },
                { text: "Executo a tarefa do supervisor que pediu primeiro por ordem de chegada.", points: 2 },
                { text: "Escolho a atividade mais rápida de terminar para se livrar do volume.", points: 1 }
            ]
        },
        {
            label: "3. Seu posto de trabalho está acumulando resíduos que dificultam a movimentação com segurança. Qual sua atitude?",
            options: [
                { text: "Aplico os conceitos de 5S: organizo o posto, descarto resíduos no local correto e mantenho a área limpa.", points: 3 },
                { text: "Empurro os resíduos para o canto da bancada e continuo produzindo.", points: 2 },
                { text: "Deixo a limpeza para a equipe de apoio no encerramento do expediente.", points: 1 }
            ]
        },
        {
            label: "4. Você identifica um ruído anormal na máquina durante o funcionamento. Qual o protocolo correto?",
            options: [
                { text: "Paro o equipamento se necessário, aviso imediatamente a manutenção/supervisão e registro no diário de bordo.", points: 3 },
                { text: "Aumento a velocidade da operação para concluir a peça antes que a máquina pare.", points: 2 },
                { text: "Continuo operando até que a máquina apresente falha total.", points: 1 }
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

    // Atualiza Quiz de Triagem Situacional
    const quizContainer = document.getElementById('quizQuestionsContainer');
    const questions = QUIZ_BANK[role] || QUIZ_BANK.AUXILIAR;
    if (quizContainer) {
        let html = '<h4 style="color:var(--accent-yellow); margin-bottom:1rem;">📌 Questionário de Situações Práticas do Cargo</h4>';
        questions.forEach((q, idx) => {
            html += `
                <div class="form-group" style="margin-bottom:1.2rem; background: rgba(255,255,255,0.03); padding: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color);">
                    <label style="color:var(--text-light); font-size:0.85rem; font-weight:600; display:block; margin-bottom:0.5rem;">${q.label}</label>
                    <select id="quizAnswer_${idx}" class="quiz-dynamic-answer" style="width:100%;">
                        <option value="" selected disabled>Selecione...</option>${shuffle(q.options).map(opt => `<option value="${opt.points}">${opt.text}</option>`).join('')}
                    </select>
                </div>
            `;
        });
        quizContainer.innerHTML = html;
    }
}

export function processQuizAndSubmit() {
    const name = document.getElementById('candName').value.trim();
    const phone = document.getElementById('candPhone').value.trim();
    const role = document.getElementById('candJobSelect').value;

    const turma = parseTurma(document.getElementById('candTurma').value);
    if (!name || !phone) {
        alert('Por favor, preencha seu nome e telefone!');
        return;
    }
    if (!turma) {
        alert('Informe o código da turma no formato APB-V-G00270/2025.');
        return;
    }

    const answerElements = document.querySelectorAll('.quiz-dynamic-answer');
    let totalPoints = 0;
    let maxPoints = (answerElements.length || 1) * 3;

    if ([...answerElements].some(el => !el.value)) {
        alert('Responda todas as perguntas do quiz antes de enviar.');
        return;
    }
    answerElements.forEach(el => totalPoints += parseInt(el.value || '0', 10));

    let fitScore = Number(((totalPoints / maxPoints) * 10).toFixed(1));
    let profileLabel = "👥 Aderência Operacional (Em Formação)";
    if (fitScore >= 8.5) profileLabel = "🏆 Alta Aderência / Perfil Liderança";
    else if (fitScore >= 6.0) profileLabel = "📊 Boa Aderência Analítica";

    const studentId = 'STU_' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    const base = 'spae_state_v4/';
    update(ref(db), {
        [base + 'candidates/' + studentId]: { id: studentId, name, phone, role, turma: turma.codigo, profileLabel, fitScore, status: 'PENDING' },
        [base + 'analytics/' + studentId]: { name, role, turma: turma.codigo, profileLabel, activeSeconds: 0, actionsCount: 0, score: fitScore }
    }).catch(() => alert('Não foi possível enviar a inscrição. Tente de novo.'));
    alert(`✅ Inscrição e Avaliação enviadas com sucesso!\n\n• Cargo: ${VAGA_DETAILS[role]?.title || role}\n• Nota de Aderência Situacional: ${fitScore} / 10.0\n• Perfil: ${profileLabel}\n\nAguarde o aceite do Professor no painel.`);
}