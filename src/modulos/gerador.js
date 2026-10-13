// src/modulos/gerador.js — modelos de atividade por UC (piloto) e montagem das tarefas
// Para acrescentar uma UC: copie um bloco de MODELOS e ajuste. Cada passo é:
// [título, descrição, nível (1 gerente, 2 supervisor, 3 auxiliar), equipe, dias após o início, passo anterior (número ou null)]
import { CARGOS } from './equipes.js';

export const MODELOS = [
    {
        id: 'FOLHA', uc: 'UC08', titulo: 'Fechamento da folha de pagamento', empresa: 'Nexus Serviços & Tecnologia',
        passos: [
            ['Apurar o ponto dos colaboradores', 'Conferir os registros de ponto, faltas, atrasos e horas extras do mês.', 3, 'RH', 2, null],
            ['Calcular e fechar a folha', 'Calcular salários, adicionais, INSS, IR e vale-transporte com base na apuração do ponto.', 2, 'RH', 4, 0],
            ['Aprovar o pagamento da folha', 'Conferir o total da folha e aprovar o pagamento.', 1, 'GER', 5, 1],
            ['Arquivar holerites e documentos', 'Emitir os holerites e arquivar os documentos do fechamento.', 3, 'RH', 6, 2]
        ]
    },
    {
        id: 'RECEBIMENTO', uc: 'UC26', titulo: 'Recebimento de mercadoria com nota fiscal', empresa: 'LogiTech Centro de Distribuição',
        passos: [
            ['Conferir a nota fiscal com o pedido de compra', 'Comparar itens, quantidades e valores da nota fiscal com o pedido.', 3, 'COMPRAS', 1, null],
            ['Conferir quantidade e avarias na doca', 'Contar os volumes e registrar qualquer avaria ou divergência.', 3, 'COMPRAS', 2, 0],
            ['Registrar o recebimento e enviar ao estoque', 'Dar entrada no sistema e encaminhar a mercadoria ao endereço de armazenagem.', 2, 'COMPRAS', 3, 1],
            ['Resolver divergências e liberar o pagamento', 'Decidir sobre divergências com o fornecedor e liberar o pagamento.', 1, 'GER', 4, 2]
        ]
    },
    {
        id: 'QUALIDADE', uc: 'UC20', titulo: 'Não conformidade na linha: 5S e PDCA', empresa: 'BioAlimentos S/A',
        passos: [
            ['Registrar a não conformidade', 'Descrever o problema encontrado na linha, com local, data e evidências.', 3, 'QUALIDADE', 1, null],
            ['Analisar a causa (Espinha de Peixe)', 'Montar o diagrama de causa e efeito e identificar a causa raiz.', 2, 'QUALIDADE', 3, 0],
            ['Montar o plano de ação 5W2H', 'Definir o que, quem, quando, onde, por quê, como e quanto custa.', 2, 'QUALIDADE', 4, 1],
            ['Aprovar e acompanhar o ciclo PDCA', 'Aprovar o plano e acompanhar a execução até a verificação dos resultados.', 1, 'GER', 7, 2]
        ]
    }
];

// ---- Atividades das demais UCs (uma por UC). Passo: [nível, dias, título, descrição]. Os passos formam uma cadeia.
const A = (uc, titulo, empresa, eq, p) => ({ id: uc, uc, titulo, empresa,
    passos: p.map(([nv, dias, t, d], i) => [t, d, nv, nv === 1 ? 'GER' : eq, dias, i ? i - 1 : null]) });
const NEX = 'Nexus Serviços & Tecnologia', IND = 'Metalúrgica Indústria Forte S/A', LOG = 'LogiTech Centro de Distribuição', BIO = 'BioAlimentos S/A', FIN = 'FinCorp Consultoria Empresarial';
MODELOS.push(
    A('UC01', 'Comunicado interno e ata', NEX, 'RH', [[3, 1, 'Redigir o comunicado interno', 'Escrever o comunicado sobre a mudança de horário, com clareza.'], [2, 2, 'Revisar e corrigir o texto', 'Revisar gramática, coesão e tom do comunicado.'], [1, 3, 'Aprovar e divulgar o comunicado', 'Aprovar e liberar a divulgação aos colaboradores.']]),
    A('UC02', 'Conflito na equipe e conduta ética', NEX, 'RH', [[3, 1, 'Relatar a situação de conflito', 'Descrever o conflito com fatos, sem julgamentos.'], [2, 3, 'Mediar a conversa entre as pessoas', 'Ouvir os dois lados e propor um acordo respeitoso.'], [1, 4, 'Registrar a decisão e reforçar o código de conduta', 'Formalizar o resultado e orientar a equipe.']]),
    A('UC03', 'Inspeção de segurança e mapa de riscos', IND, 'OPERACAO', [[3, 1, 'Inspecionar o setor e anotar os riscos', 'Identificar riscos físicos, químicos e ergonômicos e o uso de EPI.'], [2, 3, 'Montar o mapa de riscos', 'Classificar os riscos e sinalizar o setor.'], [1, 5, 'Aprovar o plano de prevenção', 'Aprovar as ações de prevenção e o treinamento.']]),
    A('UC04', 'Desconto, lucro e porcentagem em planilha', FIN, 'FIN', [[3, 1, 'Montar a planilha de vendas do mês', 'Registrar vendas e calcular desconto e lucro com fórmulas.'], [2, 3, 'Conferir os cálculos e criar o gráfico', 'Conferir percentuais e gerar o gráfico de resultados.'], [1, 4, 'Analisar o resultado e decidir', 'Decidir sobre promoções com base nos números.']]),
    A('UC05', 'Digitalizar um processo em papel', IND, 'OPERACAO', [[3, 1, 'Mapear o processo feito em papel', 'Descrever as etapas atuais e onde há retrabalho.'], [2, 3, 'Propor a solução digital', 'Indicar a tecnologia (nuvem, IoT) e os cuidados de segurança digital.'], [1, 5, 'Aprovar o projeto de digitalização', 'Avaliar benefícios e riscos e aprovar o piloto.']]),
    A('UC06', 'Plano da semana com PDCA', NEX, 'OPERACAO', [[3, 1, 'Organizar a agenda e as prioridades', 'Listar compromissos e organizar o tempo da semana.'], [2, 3, 'Montar o plano da semana (PDCA)', 'Planejar, executar, checar e agir sobre as metas.'], [1, 5, 'Validar as metas e acompanhar a equipe', 'Aprovar as metas e acompanhar os resultados.']]),
    A('UC07', 'Análise SWOT da empresa', NEX, 'OPERACAO', [[3, 2, 'Levantar dados internos e externos', 'Reunir informações sobre forças, fraquezas, ameaças e oportunidades.'], [2, 4, 'Montar a matriz SWOT', 'Organizar a matriz e conferir a estrutura da empresa.'], [1, 6, 'Definir a estratégia', 'Escolher ações com base na SWOT.']]),
    A('UC09', 'Pedido de venda e atendimento ao cliente', BIO, 'MKT', [[3, 1, 'Atender o cliente e registrar o pedido', 'Atender com cordialidade e anotar produtos e prazo.'], [2, 3, 'Conferir preço, estoque e condições', 'Conferir a política de preço e a disponibilidade.'], [1, 4, 'Aprovar o pedido e a negociação', 'Aprovar descontos e confirmar a venda.']]),
    A('UC10', 'Fluxo de caixa e DRE do mês', FIN, 'FIN', [[3, 1, 'Lançar receitas e despesas do mês', 'Registrar entradas e saídas nas contas corretas.'], [2, 3, 'Montar o balancete e a DRE', 'Conferir os lançamentos e gerar balancete e DRE.'], [1, 5, 'Analisar o caixa e aprovar o fechamento', 'Avaliar o resultado e aprovar o fechamento do mês.']]),
    A('UC11', 'Ordem de produção e Kanban', IND, 'OPERACAO', [[3, 1, 'Abrir a ordem de produção', 'Identificar a demanda e registrar a ordem.'], [2, 3, 'Programar a produção e o Kanban', 'Planejar o lote, a capacidade e o quadro Kanban.'], [1, 5, 'Aprovar o plano e acompanhar os indicadores', 'Aprovar o plano mestre e acompanhar os indicadores.']]),
    A('UC12', 'Relatório de indicadores (KPIs) no Excel', FIN, 'FIN', [[3, 1, 'Organizar a base de dados', 'Limpar e padronizar a base na planilha.'], [2, 3, 'Aplicar fórmulas, PROCV e tabela dinâmica', 'Calcular indicadores com SE, PROCV e tabela dinâmica.'], [1, 4, 'Analisar o painel de KPIs e decidir', 'Interpretar o painel e decidir as ações.']]),
    A('UC13', 'Controle de pedidos com gráficos', FIN, 'FIN', [[3, 1, 'Digitar os pedidos na planilha', 'Registrar pedidos, valores e datas sem erros.'], [2, 3, 'Criar tabelas e gráficos', 'Montar o quadro resumo e o gráfico por cliente.'], [1, 4, 'Apresentar e validar os resultados', 'Conferir as informações e validar o relatório.']]),
    A('UC14', 'Contrato de trabalho e direitos básicos', NEX, 'RH', [[3, 1, 'Conferir o contrato e a jornada', 'Verificar se contrato, jornada e salário estão corretos.'], [2, 3, 'Verificar férias, FGTS e descontos', 'Conferir direitos básicos e descontos legais.'], [1, 4, 'Resolver a dúvida do colaborador', 'Orientar o colaborador e registrar a decisão.']]),
    A('UC15', 'Organograma e missão da empresa', NEX, 'OPERACAO', [[3, 1, 'Levantar funções e responsabilidades', 'Descobrir quem faz o quê em cada área.'], [2, 3, 'Desenhar o organograma', 'Montar o organograma com os níveis hierárquicos.'], [1, 4, 'Validar missão, visão e valores', 'Aprovar missão, visão e valores da empresa.']]),
    A('UC16', 'Controle de férias e frequência', NEX, 'RH', [[3, 1, 'Apurar frequência e faltas do mês', 'Conferir os registros de ponto.'], [2, 3, 'Programar as férias da equipe', 'Montar a escala de férias dentro da lei.'], [1, 4, 'Aprovar a escala de férias', 'Aprovar a escala sem prejudicar a operação.']]),
    A('UC17', 'Campanha de promoção e fidelização', BIO, 'MKT', [[3, 1, 'Pesquisar o perfil dos clientes', 'Levantar preferências e hábitos de compra.'], [2, 3, 'Montar a promoção (mix de marketing)', 'Definir produto, preço, praça e promoção.'], [1, 5, 'Aprovar a campanha e o orçamento', 'Aprovar a campanha e acompanhar as vendas.']]),
    A('UC18', 'Contas a pagar e a receber', FIN, 'FIN', [[3, 1, 'Conferir as notas e lançar as contas', 'Registrar contas a pagar e a receber.'], [2, 3, 'Programar pagamentos e cobranças', 'Organizar vencimentos e emitir cobranças.'], [1, 4, 'Aprovar os pagamentos do dia', 'Autorizar os pagamentos conforme o caixa.']]),
    A('UC19', 'Projeto com Canvas e cronograma', NEX, 'OPERACAO', [[3, 1, 'Levantar necessidades e escopo', 'Definir o objetivo e as entregas do projeto.'], [2, 3, 'Montar o Canvas e o cronograma', 'Preencher o Canvas e definir prazos e responsáveis.'], [1, 5, 'Aprovar o projeto', 'Aprovar escopo, custos e prazos.']]),
    A('UC21', 'Diagrama de Pareto das reclamações', BIO, 'QUALIDADE', [[3, 1, 'Coletar as reclamações do mês', 'Registrar e contar os tipos de reclamação.'], [2, 3, 'Montar o Diagrama de Pareto', 'Ordenar as causas e achar as mais frequentes.'], [1, 5, 'Definir as prioridades de ação', 'Escolher onde agir primeiro.']]),
    A('UC22', 'Melhoria contínua com 5S e PDCA', BIO, 'QUALIDADE', [[3, 1, 'Aplicar o 5S na área de trabalho', 'Separar, organizar, limpar, padronizar e manter.'], [2, 3, 'Medir o resultado e propor melhorias', 'Comparar antes e depois e propor ajustes.'], [1, 5, 'Padronizar e acompanhar a melhoria', 'Aprovar o novo padrão e acompanhar.']]),
    A('UC23', 'Inspeção dimensional de peças', IND, 'QUALIDADE', [[3, 1, 'Medir as peças com paquímetro', 'Medir amostras e anotar os valores.'], [2, 3, 'Comparar com as tolerâncias do desenho', 'Aprovar ou reprovar o lote conforme a tolerância.'], [1, 4, 'Liberar o lote ou abrir não conformidade', 'Decidir sobre a liberação do lote.']]),
    A('UC24', 'Cadeia de abastecimento e prazos', LOG, 'COMPRAS', [[3, 1, 'Mapear o fluxo do pedido até a entrega', 'Descrever as etapas da cadeia de abastecimento.'], [2, 3, 'Identificar custo, tempo e gargalos', 'Apontar onde há atraso ou custo alto.'], [1, 4, 'Aprovar a melhoria logística', 'Escolher a melhoria e aprovar.']]),
    A('UC25', 'Escolha do modal de transporte', LOG, 'COMPRAS', [[3, 1, 'Levantar prazo e custo de cada modal', 'Comparar rodoviário, ferroviário, aéreo e marítimo.'], [2, 3, 'Recomendar o melhor modal', 'Recomendar o modal mais adequado à carga.'], [1, 4, 'Aprovar o transporte', 'Aprovar o frete e o modal escolhido.']]),
    A('UC27', 'Armazenagem e inventário', LOG, 'COMPRAS', [[3, 1, 'Endereçar e guardar os materiais', 'Guardar cada item no endereço correto.'], [2, 3, 'Fazer o inventário e achar divergências', 'Contar o estoque e comparar com o sistema.'], [1, 4, 'Aprovar os ajustes de estoque', 'Aprovar os ajustes do inventário.']]),
    A('UC28', 'Expedição com picking', LOG, 'COMPRAS', [[3, 1, 'Separar os itens do pedido (picking)', 'Separar os itens e conferir a quantidade.'], [2, 3, 'Embalar e emitir a documentação', 'Embalar e emitir nota e romaneio.'], [1, 4, 'Liberar o carregamento', 'Autorizar a saída e acompanhar o despacho.']])
);

// Efeito padrão (caixa em R$, estoque em unidades) aplicado quando a última tarefa da atividade é concluída
const EF = { RH: { caixa: -15000 }, FIN: { caixa: 8000 }, MKT: { caixa: 10000 }, COMPRAS: { caixa: -5000, estoque: 40 }, QUALIDADE: { caixa: -2000 }, OPERACAO: { caixa: -3000, estoque: 20 } };
MODELOS.find(m => m.uc === 'UC28').ef = { caixa: 12000, estoque: -30 };

export const EVENTOS = [
    { id: 'PEDIDO', titulo: 'Pedido grande de um cliente', texto: 'Um cliente fez um pedido acima do normal. Atendam, separem e entreguem no prazo.', modelos: ['UC09', 'UC28'] },
    { id: 'AUDITORIA', titulo: 'Auditoria de qualidade', texto: 'Há uma auditoria marcada para esta semana. Organizem a área e tratem as não conformidades.', modelos: ['UC22', 'QUALIDADE'] },
    { id: 'FORNECEDOR', titulo: 'Atraso de fornecedor', texto: 'Um fornecedor atrasou a entrega. Reorganizem o abastecimento e o estoque.', modelos: ['UC24', 'UC27'] },
    { id: 'FECHAMENTO', titulo: 'Fechamento do mês', texto: 'É hora de fechar o mês: folha de pagamento e resultado financeiro.', modelos: ['FOLHA', 'UC10'] },
    { id: 'SEGURANCA', titulo: 'Inspeção de segurança', texto: 'A empresa será inspecionada. Verifiquem riscos e uso de EPI.', modelos: ['UC03'] }
];

const nivel = (c) => (CARGOS[c] || [])[1];

export function montar(m, pessoas, inicio) {
    const base = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    const ids = m.passos.map((_, i) => 'T' + base + i);
    const usados = {};
    const exec = m.passos.map(([, , nv, eq]) => {
        let l = pessoas.filter(p => nivel(p.cargo) === nv && (nv === 1 || p.equipe === eq));
        if (!l.length && nv !== 1) l = pessoas.filter(p => p.equipe === eq && nivel(p.cargo) !== 1).sort((a, b) => nivel(a.cargo) - nivel(b.cargo));
        if (!l.length) l = pessoas.filter(p => nivel(p.cargo) === nv);
        const k = nv + eq;
        usados[k] = (usados[k] || 0) + 1;
        return l.length ? l[(usados[k] - 1) % l.length] : null;
    });
    const gerente = pessoas.find(p => nivel(p.cargo) === 1);
    const tarefas = {}, faltas = [];
    m.passos.forEach(([titulo, desc, nv, eq, dias, dep], i) => {
        const e = exec[i];
        if (!e) faltas.push(titulo);
        const prox = m.passos.findIndex(p => p[5] === i);
        const nvl = (p) => (p ? nivel(p.cargo) : 9);
        const prof = { uid: 'PROF', nome: 'Professor (Mercado)' };
        // cobra quem recebe o trabalho depois, se tiver cargo mais alto; senão o gerente (ou o professor, se o executor for o gerente)
        const c = prox >= 0 && exec[prox] && nvl(exec[prox]) < nvl(e) ? exec[prox] : (e && nvl(e) === 1 ? prof : (gerente || prof));
        const d = new Date(inicio + 'T12:00:00');
        d.setDate(d.getDate() + dias);
        tarefas[ids[i]] = {
            titulo, desc: `[${m.empresa}] ${desc}`, atividade: m.titulo,
            exec: e ? e.uid : '', execNome: e ? e.nome : 'Sem responsável',
            cobra: c.uid, cobraNome: c.nome, prazo: d.toLocaleDateString('sv-SE'),
            status: 'PENDENTE', depende: dep === null ? '' : ids[dep], criada: Date.now(), uc: m.uc, equipe: nv === 1 ? 'GER' : eq,
            ...(i === m.passos.length - 1 ? { efeito: m.ef || EF[m.passos[0][3]] || {} } : {})
        };
    });
    return { tarefas, faltas };
}
