import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NAV_LINKS, SITE } from '../../core/data';
import { Icon } from '../../shared/components/icon/icon';
import { MapEmbed } from '../../shared/components/map-embed/map-embed';
import { OpeningHours } from '../../shared/components/opening-hours/opening-hours';
import { SocialLinks } from '../../shared/components/social-links/social-links';

/** Site footer: brand blurb, sitemap, contacts, opening hours and the map. */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, MapEmbed, OpeningHours, SocialLinks],
  templateUrl: './footer.html',
  host: { class: 'block' },
})
export class Footer {
  protected readonly site = SITE;
  protected readonly links = NAV_LINKS;
  protected readonly currentYear = new Date().getFullYear();
}
