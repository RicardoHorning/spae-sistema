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

const nivel = (c) => (CARGOS[c] || [])[1];

export function montar(m, pessoas, inicio) {
    const base = Date.now().toString(36);
    const ids = m.passos.map((_, i) => 'T' + base + i);
    const usados = {};
    const exec = m.passos.map(([, , nv, eq]) => {
        let l = pessoas.filter(p => nivel(p.cargo) === nv && (nv === 1 || p.equipe === eq));
        if (!l.length && nv !== 1) l = pessoas.filter(p => p.equipe === eq && nivel(p.cargo) !== 1).sort((a, b) => nivel(a.cargo) - nivel(b.cargo));
        const k = nv + eq;
        usados[k] = (usados[k] || 0) + 1;
        return l.length ? l[(usados[k] - 1) % l.length] : null;
    });
    const gerente = pessoas.find(p => nivel(p.cargo) === 1);
    const tarefas = {}, faltas = [];
    m.passos.forEach(([titulo, desc, , , dias, dep], i) => {
        const e = exec[i];
        if (!e) faltas.push(titulo);
        const prox = m.passos.findIndex(p => p[5] === i);
        const nv = (p) => (p ? nivel(p.cargo) : 9);
        const prof = { uid: 'PROF', nome: 'Professor (Mercado)' };
        // cobra quem recebe o trabalho depois, se tiver cargo mais alto; senão o gerente (ou o professor, se o executor for o gerente)
        const c = prox >= 0 && exec[prox] && nv(exec[prox]) < nv(e) ? exec[prox] : (e && nv(e) === 1 ? prof : (gerente || prof));
        const d = new Date(inicio + 'T12:00:00');
        d.setDate(d.getDate() + dias);
        tarefas[ids[i]] = {
            titulo, desc: `[${m.empresa}] ${desc}`, atividade: m.titulo,
            exec: e ? e.uid : '', execNome: e ? e.nome : 'Sem responsável',
            cobra: c.uid, cobraNome: c.nome, prazo: d.toLocaleDateString('sv-SE'),
            status: 'PENDENTE', depende: dep === null ? '' : ids[dep], criada: Date.now()
        };
    });
    return { tarefas, faltas };
}
