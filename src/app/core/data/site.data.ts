import type { SiteConfig } from '../models';

/**
 * Company-wide constants for FS Automotive.
 * This is the only place where a phone number, address or social URL is written.
 */
export const SITE: SiteConfig = {
  name: 'FS Automotive',
  legalName: 'FS Automotive',
  tagline: 'Oficina multimarca em Vialonga',
  description:
    'Oficina automóvel multimarca em Vialonga. Mecânica especializada, diagnóstico ' +
    'computorizado, pintura e carroçaria, pneus e pré-inspeção — com atendimento ' +
    'personalizado e transparência total.',
  owner: 'Miguel Faria',
  url: 'https://fsautomotive.pt',
  foundedYear: 2019,
  logo: 'images/brand/logo-fs-automotive.png',
  squareLogo: 'images/brand/logo-fs-automotive-square.png',
  phone: {
    display: '(+351) 933 678 865',
    href: 'tel:+351933678865',
    e164: '+351933678865',
  },
  email: 'fsautomotive.servicos@gmail.com',
  address: {
    street: 'Rua do Olival Santo 16b',
    postalCode: '2625-585',
    city: 'Vialonga',
    country: 'Portugal',
    countryCode: 'PT',
    latitude: 38.882677,
    longitude: -9.072793,
    directionsUrl: 'https://maps.app.goo.gl/popbTDGsMqgfEiqD6',
    embedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3101.762091871784!2d-9.072793624219933!3d38.88267764757284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd192f00582e9d45%3A0xe4bd238f46d9a5a8!2sTOPCAR%20-%20FS%20Automotive!5e1!3m2!1spt-PT!2spt!4v1743278960709!5m2!1spt-PT!2spt',
  },
  socials: [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/people/FSautomotive/100057153442586/',
      icon: 'facebook',
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/fs.automotive.oficina/',
      icon: 'instagram',
    },
    {
      label: 'E-mail',
      href: 'mailto:fsautomotive.servicos@gmail.com',
      icon: 'mail',
    },
  ],
};

/** Ready-made call to action reused by every "fale connosco" block. */
export const CALL_ACTION = {
  label: SITE.phone.display,
  icon: 'phone',
  href: SITE.phone.href,
  ariaLabel: `Ligar para a FS Automotive: ${SITE.phone.display}`,
} as const;

export const EMAIL_ACTION = {
  label: 'Enviar e-mail',
  icon: 'mail',
  href: `mailto:${SITE.email}`,
  ariaLabel: `Enviar e-mail para ${SITE.email}`,
} as const;

export const DIRECTIONS_ACTION = {
  label: 'Como chegar',
  icon: 'map-pin',
  href: SITE.address.directionsUrl,
  external: true,
  ariaLabel: 'Abrir a morada da FS Automotive no Google Maps',
} as const;
