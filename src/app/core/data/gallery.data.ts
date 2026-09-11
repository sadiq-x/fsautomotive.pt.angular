import type { GalleryImage } from '../models';

/** Renditions generated for every workshop photo, alongside the 1920px original. */
const RESPONSIVE_WIDTHS = [480, 768, 1200] as const;

/**
 * Workshop photos all share the same source dimensions and rendition set, so
 * they are declared through one factory rather than repeated six times.
 */
const workshopPhoto = (index: number, alt: string): GalleryImage => ({
  src: `images/workshop/oficina-${index}.jpg`,
  alt,
  width: 1920,
  height: 1080,
  widths: RESPONSIVE_WIDTHS,
});

/**
 * Photographs of the workshop.
 *
 * `alt` is the only text carried with a photo. The photographs are shown
 * unlabelled — in the grid, in the hero and enlarged in the lightbox — so a
 * separate visible caption would have no reader; `alt` still describes each one
 * for assistive technology and for search engines.
 */
export const WORKSHOP_GALLERY: readonly GalleryImage[] = [
  workshopPhoto(1, 'Interior da oficina FS Automotive com viaturas em manutenção'),
  workshopPhoto(2, 'Área de trabalho da FS Automotive com equipamento de diagnóstico'),
  workshopPhoto(3, 'Viatura elevada num dos elevadores da FS Automotive'),
  workshopPhoto(4, 'Espaço de receção e sala de espera para clientes da FS Automotive'),
  workshopPhoto(5, 'Bancada de ferramentas da oficina FS Automotive'),
  workshopPhoto(6, 'Vista geral das instalações da FS Automotive'),
];

/** The subset used by the home page hero carousel. */
export const HERO_SLIDES: readonly GalleryImage[] = [
  WORKSHOP_GALLERY[0],
  WORKSHOP_GALLERY[2],
  WORKSHOP_GALLERY[5],
];
