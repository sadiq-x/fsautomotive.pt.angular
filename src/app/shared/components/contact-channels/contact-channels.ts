import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SITE } from '../../../core/data';
import type { IconName } from '../../../core/models';
import { Icon } from '../icon/icon';

interface Channel {
  readonly icon: IconName;
  readonly label: string;
  readonly value: string;
  readonly href: string;
  readonly external: boolean;
  readonly hint: string;
}

/**
 * Phone / e-mail / address, as tappable cards.
 * Built from `SITE`, so the contact details exist in exactly one place.
 */
@Component({
  selector: 'app-contact-channels',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './contact-channels.html',
  host: { class: 'block' },
})
export class ContactChannels {
  readonly layout = input<'grid' | 'stack'>('grid');

  protected readonly channels: readonly Channel[] = [
    {
      icon: 'phone',
      label: 'Telefone',
      value: SITE.phone.display,
      href: SITE.phone.href,
      external: false,
      hint: 'Fale connosco durante o horário de funcionamento',
    },
    {
      icon: 'mail',
      label: 'E-mail',
      value: SITE.email,
      href: `mailto:${SITE.email}`,
      external: false,
      hint: 'Respondemos normalmente no mesmo dia útil',
    },
    {
      icon: 'map-pin',
      label: 'Morada',
      value: `${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}`,
      href: SITE.address.directionsUrl,
      external: true,
      hint: 'Abrir direções no Google Maps',
    },
  ];

  protected readonly listClasses = computed(() =>
    this.layout() === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-4',
  );
}
