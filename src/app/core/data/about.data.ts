import type { Feature } from '../models';

/** What the workshop stands for — used on the home and about pages. */
export const BRAND_VALUES: readonly Feature[] = [
  {
    icon: 'shield-check',
    title: 'Qualidade comprovada',
    description:
      'Peças dentro da especificação do fabricante e trabalho verificado antes de entregar a viatura.',
  },
  {
    icon: 'gauge',
    title: 'Eficiência',
    description:
      'Diagnóstico ao primeiro dia e prazos que cumprimos, para ficar sem carro o menor tempo possível.',
  },
  {
    icon: 'quote',
    title: 'Atendimento personalizado',
    description:
      'Explicamos o que precisa de ser feito, o que pode esperar e quanto custa — antes de começar.',
  },
];

/** The "sobre nós" narrative, kept as data so the layout stays generic. */
export const ABOUT_STORY: readonly Feature[] = [
  {
    icon: 'wrench',
    title: 'Uma oficina, uma equipa',
    description:
      'Somos uma equipa pequena e estável: quem recebe a sua viatura é quem trabalha nela e quem lhe explica o que foi feito. Sem intermediários e sem respostas vagas.',
  },
  {
    icon: 'star',
    title: 'O cliente no centro',
    description:
      'Desde a nossa fundação, o foco é garantir a satisfação dos clientes com serviços personalizados e eficientes para todos os tipos de veículos.',
  },
  {
    icon: 'cpu',
    title: 'Tecnologia de ponta',
    description:
      'Investimos continuamente em equipamento e nas melhores práticas do setor para oferecer soluções inovadoras e seguras.',
  },
  {
    icon: 'shield-check',
    title: 'Confiança e transparência',
    description:
      'Seja para uma simples manutenção ou uma reparação complexa, pode confiar em nós para cuidar do seu veículo com profissionalismo e transparência.',
  },
];

/** Comfort features available to customers at the workshop. */
export const AMENITIES: readonly Feature[] = [
  {
    icon: 'parking',
    title: 'Parque para Clientes',
    description: 'Estacionamento seguro e acessível junto à oficina.',
  },
  {
    icon: 'sofa',
    title: 'Sala de Espera',
    description: 'Espaço confortável para aguardar enquanto cuidamos do seu veículo.',
  },
];
