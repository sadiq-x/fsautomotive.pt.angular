import type { WorkshopService } from '../models';

/** The full service catalogue, rendered as an accordion on the services page. */
export const SERVICES: readonly WorkshopService[] = [
  {
    id: 'servicos-rapidos',
    title: 'Serviços Rápidos',
    description:
      'Manutenção corrente resolvida no próprio dia, sem marcações demoradas nem imprevistos.',
    icon: 'gauge',
    highlights: [
      'Troca de pastilhas e discos de travão',
      'Mudança de óleo e filtros',
      'Substituição e teste de baterias',
      'Carregamento de ar condicionado',
    ],
  },
  {
    id: 'pintura-carrocaria',
    title: 'Pintura e Carroçaria',
    description:
      'Reparação e acabamento com correspondência de cor de fábrica, do pequeno retoque à personalização completa.',
    icon: 'palette',
    highlights: [
      'Retoques e reparação de riscos',
      'Reparação de danos de colisão',
      'Polimento e tratamento de faróis',
      'Personalização e pintura integral',
    ],
  },
  {
    id: 'mecanica-especializada',
    title: 'Mecânica Especializada',
    description:
      'Intervenções de fundo no motor e na transmissão, executadas por técnicos com experiência multimarca.',
    icon: 'wrench',
    highlights: [
      'Motor: distribuição, juntas e revisões',
      'Embraiagem e caixas automáticas',
      'Sistemas de injeção diesel e gasolina',
      'Amortecedores, direção e suspensão',
    ],
  },
  {
    id: 'eletricidade-eletronica',
    title: 'Eletricidade e Eletrónica',
    description:
      'Diagnóstico e reparação dos sistemas elétricos e eletrónicos que hoje comandam quase todo o veículo.',
    icon: 'zap',
    highlights: [
      'Avarias elétricas e curto-circuitos',
      'Alternadores, motores de arranque e cablagens',
      'Sensores, centralinas e módulos',
      'Iluminação e sistemas de conforto',
    ],
  },
  {
    id: 'diagnostico-computorizado',
    title: 'Diagnóstico Computorizado',
    description:
      'Leitura de erros com equipamento multimarca para identificar a causa antes de trocar qualquer peça.',
    icon: 'cpu',
    highlights: [
      'Leitura e análise de códigos de avaria',
      'Testes dinâmicos em estrada',
      'Regeneração e verificação de filtro de partículas',
      'Relatório claro antes de qualquer intervenção',
    ],
  },
  {
    id: 'pneus',
    title: 'Pneus',
    description:
      'Montagem, equilibragem e alinhamento com medição de geometria — segurança e travagem no ponto certo.',
    icon: 'disc',
    highlights: [
      'Substituição de pneus de todas as medidas',
      'Equilibragem eletrónica',
      'Alinhamento de direção e geometria',
      'Reparação de furos e verificação de pressões',
    ],
  },
  {
    id: 'reparacao-pos-colisao',
    title: 'Reparação Pós-Colisão',
    description:
      'Restauro completo de veículos acidentados, com acompanhamento do processo do início ao fim.',
    icon: 'shield-check',
    highlights: [
      'Avaliação e orçamento detalhado do dano',
      'Endireitamento de estrutura e chapa',
      'Substituição de painéis e vidros',
      'Apoio na comunicação com a seguradora',
    ],
  },
  {
    id: 'escapes-exaustao',
    title: 'Escapes e Exaustão',
    description:
      'Manutenção e substituição da linha de escape para recuperar desempenho, consumo e silêncio.',
    icon: 'wind',
    highlights: [
      'Substituição de silenciosos e tubagens',
      'Catalisadores e sondas lambda',
      'Filtro de partículas (FAP/DPF)',
      'Deteção e correção de fugas',
    ],
  },
  {
    id: 'lubrificantes-oleo',
    title: 'Lubrificantes e Mudança de Óleo',
    description:
      'Óleos e filtros dentro da especificação do fabricante, com registo do plano de manutenção.',
    icon: 'droplet',
    highlights: [
      'Óleo de motor conforme especificação',
      'Filtros de óleo, ar, combustível e habitáculo',
      'Óleo de caixa e travões',
      'Registo e aviso da próxima revisão',
    ],
  },
  {
    id: 'pre-inspecao',
    title: 'Pré-Inspeção',
    description:
      'Verificação completa antes da inspeção obrigatória, para chegar ao centro com tudo conforme.',
    icon: 'clipboard-check',
    highlights: [
      'Travagem, suspensão e direção',
      'Luzes, sinalização e pneus',
      'Emissões de gases',
      'Correção das reprovações antes da inspeção',
    ],
  },
];
