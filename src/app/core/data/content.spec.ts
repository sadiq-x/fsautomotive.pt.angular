import { NAV_LINKS, OPENING_HOURS, SERVICES, SITE, VEHICLE_TYPES } from './index';
import { ICON_SHAPES } from '../../shared/components/icon/icon-paths';
import { routes } from '../../app.routes';

/**
 * The site is data-driven, so these guard the content itself: a typo in an icon
 * name or a nav path that no route serves would otherwise only show up at runtime.
 */
describe('site content', () => {
  it('gives every service a unique id', () => {
    const ids = SERVICES.map((service) => service.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every vehicle type a unique id', () => {
    const ids = VEHICLE_TYPES.map((vehicle) => vehicle.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references icons that exist in the registry', () => {
    const names = [
      ...SERVICES.map((s) => s.icon),
      ...NAV_LINKS.map((l) => l.icon),
      ...SITE.socials.map((s) => s.icon),
    ];

    for (const name of names) {
      expect(ICON_SHAPES[name], `missing icon: ${name}`).toBeDefined();
      expect(ICON_SHAPES[name].length).toBeGreaterThan(0);
    }
  });

  it('points every nav link at a declared route', () => {
    const declared = new Set(routes.map((route) => `/${route.path}`.replace(/\/$/, '') || '/'));

    for (const link of NAV_LINKS) {
      expect(declared.has(link.path), `no route for ${link.path}`).toBe(true);
    }
  });

  it('marks exactly one nav link as the exact-match home route', () => {
    expect(NAV_LINKS.filter((link) => link.exact).length).toBe(1);
  });

  it('pairs every opening and closing time on open days', () => {
    for (const entry of OPENING_HOURS) {
      if (entry.closed) {
        expect(entry.periods.length).toBe(0);
        continue;
      }

      expect(entry.schemaOpens?.length).toBe(entry.schemaCloses?.length);
      expect(entry.schemaOpens?.length).toBe(entry.periods.length);
    }
  });

  it('uses a dialable phone href', () => {
    expect(SITE.phone.href).toBe(`tel:${SITE.phone.e164}`);
    expect(SITE.phone.e164).toMatch(/^\+\d{6,15}$/);
  });
});
