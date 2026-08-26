import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  BRAND_VALUES,
  CALL_ACTION,
  HERO_SLIDES,
  SERVICES,
  SITE,
  VEHICLE_TYPES,
  WORKSHOP_GALLERY,
} from '../../core/data';
import {
  Carousel,
  CtaBand,
  FeatureCard,
  GalleryGrid,
  Icon,
  OpeningHours,
  PageSection,
  RevealDirective,
  SectionHeading,
  UiButton,
  VehicleCard,
} from '../../shared';

/** Landing page: hero carousel, promise, services preview, vehicles and proof. */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Carousel,
    CtaBand,
    FeatureCard,
    GalleryGrid,
    Icon,
    OpeningHours,
    PageSection,
    RevealDirective,
    SectionHeading,
    UiButton,
    VehicleCard,
  ],
  templateUrl: './home.html',
})
export class Home {
  protected readonly site = SITE;
  protected readonly slides = HERO_SLIDES;
  protected readonly values = BRAND_VALUES;
  protected readonly vehicles = VEHICLE_TYPES;
  protected readonly gallery = WORKSHOP_GALLERY;
  protected readonly callAction = CALL_ACTION;

  /** The first six services, as a teaser for the full catalogue. */
  protected readonly featuredServices = SERVICES.slice(0, 6);
  protected readonly totalServices = SERVICES.length;
}
