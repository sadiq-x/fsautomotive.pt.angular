import { TestBed } from '@angular/core/testing';

import type { GalleryImage } from '../../../core/models';
import { ResponsiveImage } from './responsive-image';

const PHOTO: GalleryImage = {
  src: 'images/workshop/oficina-1.jpg',
  alt: 'Oficina',
  width: 1920,
  height: 1080,
  widths: [480, 768, 1200],
};

function render(image: GalleryImage, sizes?: string) {
  const fixture = TestBed.createComponent(ResponsiveImage);
  fixture.componentRef.setInput('image', image);
  if (sizes) {
    fixture.componentRef.setInput('sizes', sizes);
  }
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('img') as HTMLImageElement;
}

describe('ResponsiveImage', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('derives every rendition plus the original from the naming convention', () => {
    expect(render(PHOTO).getAttribute('srcset')).toBe(
      'images/workshop/oficina-1-480.jpg 480w, ' +
        'images/workshop/oficina-1-768.jpg 768w, ' +
        'images/workshop/oficina-1-1200.jpg 1200w, ' +
        'images/workshop/oficina-1.jpg 1920w',
    );
  });

  it('keeps the full-size file as the src fallback', () => {
    expect(render(PHOTO).getAttribute('src')).toBe('images/workshop/oficina-1.jpg');
  });

  it('reserves layout space with intrinsic dimensions', () => {
    const img = render(PHOTO);
    expect(img.getAttribute('width')).toBe('1920');
    expect(img.getAttribute('height')).toBe('1080');
  });

  it('omits srcset and sizes when no renditions exist', () => {
    const img = render({ src: 'a/logo.png', alt: 'Logo', width: 200, height: 100 });
    expect(img.getAttribute('srcset')).toBeNull();
    expect(img.getAttribute('sizes')).toBeNull();
  });

  it('passes the slot hint through to sizes', () => {
    expect(render(PHOTO, '(min-width: 64rem) 30vw, 100vw').getAttribute('sizes')).toBe(
      '(min-width: 64rem) 30vw, 100vw',
    );
  });

  it('lazy-loads by default and eagerly when marked priority', () => {
    expect(render(PHOTO).getAttribute('loading')).toBe('lazy');

    const fixture = TestBed.createComponent(ResponsiveImage);
    fixture.componentRef.setInput('image', PHOTO);
    fixture.componentRef.setInput('priority', true);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });
});
