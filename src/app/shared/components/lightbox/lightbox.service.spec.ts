import { TestBed } from '@angular/core/testing';

import type { GalleryImage } from '../../../core/models';
import { LightboxService } from './lightbox.service';

const IMAGES: readonly GalleryImage[] = [
  { src: 'a.jpg', alt: 'A' },
  { src: 'b.jpg', alt: 'B' },
  { src: 'c.jpg', alt: 'C' },
];

describe('LightboxService', () => {
  let lightbox: LightboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    lightbox = TestBed.inject(LightboxService);
  });

  it('starts closed', () => {
    expect(lightbox.isOpen()).toBe(false);
    expect(lightbox.current()).toBeNull();
  });

  it('opens at the requested index', () => {
    lightbox.open(IMAGES, 1);

    expect(lightbox.isOpen()).toBe(true);
    expect(lightbox.current()?.src).toBe('b.jpg');
    expect(lightbox.position()).toBe(2);
    expect(lightbox.total()).toBe(3);
  });

  it('clamps an out-of-range start index', () => {
    lightbox.open(IMAGES, 99);
    expect(lightbox.current()?.src).toBe('c.jpg');

    lightbox.open(IMAGES, -5);
    expect(lightbox.current()?.src).toBe('a.jpg');
  });

  it('ignores an empty collection', () => {
    lightbox.open([]);
    expect(lightbox.isOpen()).toBe(false);
  });

  it('wraps around when stepping past either end', () => {
    lightbox.open(IMAGES, 2);

    lightbox.next();
    expect(lightbox.current()?.src).toBe('a.jpg');

    lightbox.previous();
    expect(lightbox.current()?.src).toBe('c.jpg');
  });

  it('closes without discarding the current collection', () => {
    lightbox.open(IMAGES, 1);
    lightbox.close();

    expect(lightbox.isOpen()).toBe(false);
    expect(lightbox.total()).toBe(3);
  });
});
