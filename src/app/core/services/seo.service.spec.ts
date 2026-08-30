import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import { SITE } from '../data';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let seo: SeoService;
  let title: Title;
  let meta: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    seo = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);

    document.head.querySelector('link[rel="canonical"]')?.remove();
  });

  it('suffixes the document title with the company name', () => {
    seo.apply({ title: 'Serviços', description: 'Os nossos serviços.', path: '/servicos' });
    expect(title.getTitle()).toBe(`Serviços | ${SITE.name}`);
  });

  it('writes the description to both the meta tag and Open Graph', () => {
    seo.apply({ title: 'Contactos', description: 'Fale connosco.', path: '/contactos' });

    expect(meta.getTag('name="description"')?.content).toBe('Fale connosco.');
    expect(meta.getTag('property="og:description"')?.content).toBe('Fale connosco.');
  });

  it('resolves a root-relative path into an absolute canonical URL', () => {
    seo.apply({ title: 'Sobre Nós', description: 'Quem somos.', path: '/sobre-nos' });

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.href).toBe(`${SITE.url}/sobre-nos`);
  });

  it('reuses the single canonical link across navigations', () => {
    seo.apply({ title: 'A', description: 'a', path: '/' });
    seo.apply({ title: 'B', description: 'b', path: '/servicos' });

    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      `${SITE.url}/servicos`,
    );
  });

  it('falls back to the square logo when a page declares no image', () => {
    seo.apply({ title: 'Contactos', description: 'Fale connosco.', path: '/contactos' });

    expect(meta.getTag('property="og:image"')?.content).toBe(`${SITE.url}/${SITE.squareLogo}`);
  });

  describe('robots directive', () => {
    it('marks a private page noindex', () => {
      seo.apply({
        title: 'Painel',
        description: 'Área reservada.',
        path: '/gestao/painel',
        noIndex: true,
      });

      expect(meta.getTag('name="robots"')?.content).toBe('noindex, nofollow');
    });

    // The head is one shared document: leaving the tag behind after a visit to
    // /gestao would quietly make the whole public site unindexable.
    it('removes the directive again on the next public page', () => {
      seo.apply({ title: 'Painel', description: 'x', path: '/gestao/painel', noIndex: true });
      seo.apply({ title: 'Serviços', description: 'Os nossos serviços.', path: '/servicos' });

      expect(meta.getTag('name="robots"')).toBeNull();
    });

    it('adds no directive to a public page in the first place', () => {
      seo.apply({ title: 'Contactos', description: 'Fale connosco.', path: '/contactos' });

      expect(meta.getTag('name="robots"')).toBeNull();
    });
  });
});
