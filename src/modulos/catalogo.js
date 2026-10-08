// src/modulos/catalogo.js — Catálogo único de UCs (AA = Assistente Administrativo, PI = Processos Industriais Integrados)
const B = 'AA,PI';
const L = [
  ['Fundamentos da Comunicação e Informação', 20, 'BAS', B],
  ['Relações Socioprofissionais, Cidadania e Ética', 20, 'BAS', B],
  ['Saúde e Segurança do Trabalho', 20, 'BAS', B],
  ['Raciocínio Lógico e Análise de Dados', 20, 'BAS', B],
  ['Transformação Digital no Setor Industrial', 20, 'BAS', B],
  ['Planejamento e Organização do Trabalho', 20, 'BAS', B],
  ['Fundamentos da Administração', 80, 'GER', 'AA'],
  ['Gestão de Pessoas', 80, 'RH', 'AA'],
  ['Marketing, Comercial e Vendas', 80, 'MKT', 'AA'],
  ['Gestão Contábil e Financeira', 80, 'FIN', 'AA'],
  ['Gestão da Produção, Operações e Logística', 80, 'LOG', 'AA'],
  ['Tratamento e Gerenciamento de Dados Quantitativos', 80, 'DAD', 'AA'],
  ['Análise de Dados e Informática Aplicada', 32, 'DAD', 'PI'],
  ['Noções de Direito', 24, 'BAS', 'PI'],
  ['Introdução à Gestão Organizacional', 24, 'GER', 'PI'],
  ['Rotinas de Apoio Administrativo à Área de RH', 40, 'RH', 'PI'],
  ['Rotinas de Apoio Administrativo às Áreas de Marketing e Venda', 20, 'MKT', 'PI'],
  ['Rotinas de Apoio Administrativo às Áreas Contábil e Financeira', 40, 'FIN', 'PI'],
  ['Introdução ao Desenvolvimento de Projetos', 20, 'PRJ', 'PI'],
  ['Gestão da Qualidade', 40, 'QUA', 'PI'],
  ['Ferramentas da Qualidade', 40, 'QUA', 'PI'],
  ['Desenvolvimento de Ações de Melhoria', 40, 'QUA', 'PI'],
  ['Controle Dimensional', 40, 'QUA', 'PI'],
  ['Conceitos Básicos da Logística', 20, 'LOG', 'PI'],
  ['Modais de Transporte', 20, 'LOG', 'PI'],
  ['Logística de Recebimento', 20, 'LOG', 'PI'],
  ['Logística de Armazenagem', 40, 'LOG', 'PI'],
  ['Logística de Expedição', 20, 'LOG', 'PI']
];
export const CATALOGO = L.map(([nome, ch, area, cursos], i) => ({
  id: 'UC' + String(i + 1).padStart(2, '0'), nome, ch, area, cursos: cursos.split(',')
}));
export const ucNome = (id) => (CATALOGO.find(u => u.id === id) || { nome: id }).nome;

export const CURSOS = [
  { id: 'AA', nome: 'Assistente Administrativo', codigo: 'APB.00071', matriz: 'APB0007115', ch: 600 },
  { id: 'PI', nome: 'Assistente de Processos Industriais Integrados', codigo: 'APB.G0057', matriz: 'APBG005702', ch: 600 }
];
export const cursoNome = (id) => id === 'TODOS' ? 'Os dois cursos' : (CURSOS.find(c => c.id === id) || { nome: 'Curso não informado' }).nome;
