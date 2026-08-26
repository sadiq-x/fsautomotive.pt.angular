import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CALL_ACTION, DIRECTIONS_ACTION, EMAIL_ACTION, SITE } from '../../core/data';
import {
  ContactChannels,
  Icon,
  MapEmbed,
  OpeningHours,
  PageHero,
  PageSection,
  RevealDirective,
  SectionHeading,
  SocialLinks,
  UiButton,
} from '../../shared';

/** Contact details, opening hours, socials and the map. */
@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ContactChannels,
    Icon,
    MapEmbed,
    OpeningHours,
    PageHero,
    PageSection,
    RevealDirective,
    SectionHeading,
    SocialLinks,
    UiButton,
  ],
  templateUrl: './contact.html',
})
export class Contact {
  protected readonly site = SITE;
  protected readonly callAction = CALL_ACTION;
  protected readonly emailAction = EMAIL_ACTION;
  protected readonly directionsAction = DIRECTIONS_ACTION;
}
