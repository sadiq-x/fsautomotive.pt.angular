import { DOCUMENT, Injectable, inject } from '@angular/core';

import { OPENING_HOURS } from '../data/opening-hours.data';
import { SERVICES } from '../data/services.data';
import { SITE } from '../data/site.data';

const SCRIPT_ID = 'ld-json-local-business';

/**
 * Publishes a `schema.org/AutoRepair` graph so search engines can surface the
 * workshop's address, phone number, opening hours and service catalogue.
 * Injected once at bootstrap — the payload is static.
 */
@Injectable({ providedIn: 'root' })
export class StructuredDataService {
  private readonly document = inject(DOCUMENT);

  publishLocalBusiness(): void {
    const payload = {
      '@context': 'https://schema.org',
      '@type': 'AutoRepair',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      legalName: SITE.legalName,
      description: SITE.description,
      url: SITE.url,
      logo: `${SITE.url}/${SITE.squareLogo}`,
      image: `${SITE.url}/${SITE.logo}`,
      telephone: SITE.phone.e164,
      email: SITE.email,
      founder: { '@type': 'Person', name: SITE.owner },
      foundingDate: String(SITE.foundedYear),
      priceRange: '€€',
      currenciesAccepted: 'EUR',
      areaServed: [
        { '@type': 'City', name: 'Vialonga' },
        { '@type': 'City', name: 'Alverca do Ribatejo' },
        { '@type': 'City', name: 'Vila Franca de Xira' },
        { '@type': 'City', name: 'Loures' },
        { '@type': 'AdministrativeArea', name: 'Lisboa' },
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: SITE.address.street,
        postalCode: SITE.address.postalCode,
        addressLocality: SITE.address.city,
        addressCountry: SITE.address.countryCode,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: SITE.address.latitude,
        longitude: SITE.address.longitude,
      },
      hasMap: SITE.address.directionsUrl,
      sameAs: SITE.socials.filter((s) => s.href.startsWith('http')).map((s) => s.href),
      openingHoursSpecification: this.openingHoursSpecification(),
      makesOffer: SERVICES.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.title,
          description: service.description,
        },
      })),
    };

    this.upsertScript(payload);
  }

  private openingHoursSpecification(): unknown[] {
    return OPENING_HOURS.filter((entry) => !entry.closed).flatMap((entry) =>
      (entry.schemaOpens ?? []).map((opens, index) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: entry.schemaDays.map((day) => `https://schema.org/${day}`),
        opens,
        closes: entry.schemaCloses?.[index],
      })),
    );
  }

  private upsertScript(payload: unknown): void {
    const head = this.document.head;
    let script = head.querySelector<HTMLScriptElement>(`script#${SCRIPT_ID}`);

    if (!script) {
      script = this.document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'application/ld+json';
      head.appendChild(script);
    }

    script.textContent = JSON.stringify(payload);
  }
}
