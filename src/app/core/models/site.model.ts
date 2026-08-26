import type { IconName } from './icon.model';

export interface PostalAddress {
  readonly street: string;
  readonly postalCode: string;
  readonly city: string;
  readonly country: string;
  readonly countryCode: string;
  readonly latitude: number;
  readonly longitude: number;
  /** Short link that opens the workshop in Google Maps. */
  readonly directionsUrl: string;
  /** `google.com/maps/embed` URL used by the map component. */
  readonly embedUrl: string;
}

export interface SocialProfile {
  readonly label: string;
  readonly href: string;
  readonly icon: IconName;
}

/** Company-wide constants. Change once here, reflected across the whole site. */
export interface SiteConfig {
  readonly name: string;
  readonly legalName: string;
  readonly tagline: string;
  readonly description: string;
  readonly owner: string;
  readonly url: string;
  readonly foundedYear: number;
  readonly logo: string;
  readonly squareLogo: string;
  readonly phone: { readonly display: string; readonly href: string; readonly e164: string };
  readonly email: string;
  readonly address: PostalAddress;
  readonly socials: readonly SocialProfile[];
}
