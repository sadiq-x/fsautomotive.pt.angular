import type { GalleryImage } from '../models';

/** Photographs of the workshop. */
export const WORKSHOP_GALLERY: readonly GalleryImage[] = [
  {
    src: 'images/workshop/oficina-1.jpg',
    alt: 'Interior da oficina FS Automotive com viaturas em manutenção',
    caption: 'A nossa oficina em Vialonga',
  },
  {
    src: 'images/workshop/oficina-2.jpg',
    alt: 'Área de trabalho da FS Automotive com equipamento de diagnóstico',
    caption: 'Equipamento de diagnóstico multimarca',
  },
  {
    src: 'images/workshop/oficina-3.jpg',
    alt: 'Viatura elevada num dos elevadores da FS Automotive',
    caption: 'Elevadores para intervenções em segurança',
  },
  {
    src: 'images/workshop/oficina-4.jpg',
    alt: 'Espaço de receção e sala de espera para clientes da FS Automotive',
    caption: 'Receção e sala de espera para clientes',
  },
  {
    src: 'images/workshop/oficina-5.jpg',
    alt: 'Bancada de ferramentas da oficina FS Automotive',
    caption: 'Bancada e ferramenta especializada',
  },
  {
    src: 'images/workshop/oficina-6.jpg',
    alt: 'Vista geral das instalações da FS Automotive',
    caption: 'Instalações FS Automotive',
  },
];

/** The subset used by the home page hero carousel. */
export const HERO_SLIDES: readonly GalleryImage[] = [
  WORKSHOP_GALLERY[0],
  WORKSHOP_GALLERY[2],
  WORKSHOP_GALLERY[5],
];
