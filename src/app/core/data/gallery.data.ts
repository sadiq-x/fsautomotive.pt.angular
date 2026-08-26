import type { GalleryImage } from '../models';

/** Renditions generated for every workshop photo, alongside the 1920px original. */
const RESPONSIVE_WIDTHS = [480, 768, 1200] as const;

/**
 * Workshop photos all share the same source dimensions and rendition set, so
 * they are declared through one factory rather than repeated six times.
 */
const workshopPhoto = (index: number, alt: string, caption: string): GalleryImage => ({
  src: `images/workshop/oficina-${index}.jpg`,
  alt,
  caption,
  width: 1920,
  height: 1080,
  widths: RESPONSIVE_WIDTHS,
});

/** Photographs of the workshop. */
export const WORKSHOP_GALLERY: readonly GalleryImage[] = [
  workshopPhoto(
    1,
    'Interior da oficina FS Automotive com viaturas em manutenção',
    'A nossa oficina em Vialonga',
  ),
  workshopPhoto(
    2,
    'Área de trabalho da FS Automotive com equipamento de diagnóstico',
    'Equipamento de diagnóstico multimarca',
  ),
  workshopPhoto(
    3,
    'Viatura elevada num dos elevadores da FS Automotive',
    'Elevadores para intervenções em segurança',
  ),
  workshopPhoto(
    4,
    'Espaço de receção e sala de espera para clientes da FS Automotive',
    'Receção e sala de espera para clientes',
  ),
  workshopPhoto(
    5,
    'Bancada de ferramentas da oficina FS Automotive',
    'Bancada e ferramenta especializada',
  ),
  workshopPhoto(6, 'Vista geral das instalações da FS Automotive', 'Instalações FS Automotive'),
];

/** The subset used by the home page hero carousel. */
export const HERO_SLIDES: readonly GalleryImage[] = [
  WORKSHOP_GALLERY[0],
  WORKSHOP_GALLERY[2],
  WORKSHOP_GALLERY[5],
];
