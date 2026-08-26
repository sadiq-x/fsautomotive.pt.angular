import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SERVICES, VEHICLE_TYPES } from '../../core/data';
import {
  Accordion,
  AccordionItem,
  CtaBand,
  Icon,
  PageHero,
  PageSection,
  RevealDirective,
  SectionHeading,
  VehicleCard,
} from '../../shared';

/** Full service catalogue plus the accepted vehicle categories. */
@Component({
  selector: 'app-services',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Accordion,
    AccordionItem,
    CtaBand,
    Icon,
    PageHero,
    PageSection,
    RevealDirective,
    SectionHeading,
    VehicleCard,
  ],
  templateUrl: './services.html',
})
export class Services {
  protected readonly services = SERVICES;
  protected readonly vehicles = VEHICLE_TYPES;
}
