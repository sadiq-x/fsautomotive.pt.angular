import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { VehicleType } from '../../../core/models';

/** Illustrated tile for one accepted vehicle category. */
@Component({
  selector: 'app-vehicle-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehicle-card.html',
  host: { class: 'block h-full' },
})
export class VehicleCard {
  readonly vehicle = input.required<VehicleType>();
}
