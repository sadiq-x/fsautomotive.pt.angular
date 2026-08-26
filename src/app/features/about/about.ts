import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ABOUT_STORY, AMENITIES, SITE, WORKSHOP_GALLERY } from '../../core/data';
import {
  CtaBand,
  FeatureCard,
  GalleryGrid,
  Icon,
  OpeningHours,
  PageHero,
  PageSection,
  RevealDirective,
  SectionHeading,
  UiButton,
} from '../../shared';

/** Company story, customer amenities, gallery and opening hours. */
@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CtaBand,
    FeatureCard,
    GalleryGrid,
    Icon,
    OpeningHours,
    PageHero,
    PageSection,
    RevealDirective,
    SectionHeading,
    UiButton,
  ],
  templateUrl: './about.html',
})
export class About {
  protected readonly site = SITE;
  protected readonly story = ABOUT_STORY;
  protected readonly amenities = AMENITIES;
  protected readonly gallery = WORKSHOP_GALLERY;
}
