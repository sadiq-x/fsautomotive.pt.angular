import { TestBed } from '@angular/core/testing';

import type { GalleryImage } from '../../../core/models';
import { Lightbox } from './lightbox';
import { LightboxService } from './lightbox.service';

const IMAGES: readonly GalleryImage[] = [
  { src: 'a.jpg', alt: 'A', width: 1920, height: 1080 },
  { src: 'b.jpg', alt: 'B', width: 1920, height: 1080 },
];

describe('Lightbox scroll lock', () => {
  let lightbox: LightboxService;
  let fixture: ReturnType<typeof TestBed.createComponent<Lightbox>>;
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollY', { value: 900, writable: true, configurable: true });
    Object.defineProperty(window, 'scrollTo', {
      value: scrollTo,
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({});
    lightbox = TestBed.inject(LightboxService);
    fixture = TestBed.createComponent(Lightbox);
    fixture.detectChanges();
  });

  afterEach(() => {
    lightbox.close();
    fixture.detectChanges();
  });

  it('leaves the page alone until something opens it', () => {
    expect(document.body.style.position).toBe('');
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('pins the body at the current offset while open', () => {
    lightbox.open(IMAGES, 0);
    fixture.detectChanges();

    // `overflow: hidden` alone does not hold on iOS Safari; the body has to be
    // taken out of flow at a negative offset.
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-900px');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('releases the body and replays the offset on close', () => {
    lightbox.open(IMAGES, 0);
    fixture.detectChanges();

    lightbox.close();
    fixture.detectChanges();

    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.overflow).toBe('');
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 900 }));
  });

  it('does not re-lock while stepping between images', () => {
    lightbox.open(IMAGES, 0);
    fixture.detectChanges();

    lightbox.next();
    fixture.detectChanges();

    expect(document.body.style.top).toBe('-900px');
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
