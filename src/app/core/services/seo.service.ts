import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { SITE } from '../data/site.data';
import type { PageMeta } from '../models';

/**
 * Keeps `<title>`, the meta description, Open Graph / Twitter tags and the
 * canonical link in sync with the active route.
 *
 * Wired up once in `App` via the router's `data.meta`, so feature components
 * never touch the document head themselves.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: PageMeta): void {
    const fullTitle = `${page.title} | ${SITE.name}`;
    const canonical = this.absoluteUrl(page.path);
    const image = this.absoluteUrl(page.image ?? SITE.squareLogo);

    this.title.setTitle(fullTitle);

    this.upsertName('description', page.description);
    this.upsertName('twitter:card', 'summary_large_image');
    this.upsertName('twitter:title', fullTitle);
    this.upsertName('twitter:description', page.description);
    this.upsertName('twitter:image', image);

    this.upsertProperty('og:type', 'website');
    this.upsertProperty('og:site_name', SITE.name);
    this.upsertProperty('og:locale', 'pt_PT');
    this.upsertProperty('og:title', fullTitle);
    this.upsertProperty('og:description', page.description);
    this.upsertProperty('og:url', canonical);
    this.upsertProperty('og:image', image);

    this.setCanonical(canonical);
  }

  private upsertName(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name="${name}"`);
  }

  private upsertProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property="${property}"`);
  }

  private setCanonical(href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }

    link.setAttribute('href', href);
  }

  private absoluteUrl(pathOrUrl: string): string {
    if (/^https?:\/\//.test(pathOrUrl)) {
      return pathOrUrl;
    }

    return new URL(pathOrUrl.replace(/^\//, ''), `${SITE.url}/`).toString();
  }
}
