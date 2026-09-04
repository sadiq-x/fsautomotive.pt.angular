/**
 * Every glyph the design system knows about.
 * Adding a new icon means adding a key here and a path in `ICON_PATHS`,
 * which keeps templates type-safe: `<app-icon name="…">` cannot be misspelled.
 */
export type IconName =
  // Navigation & UI
  | 'home'
  | 'info'
  | 'wrench'
  | 'phone'
  | 'mail'
  | 'map-pin'
  | 'clock'
  | 'calendar'
  | 'chevron-down'
  | 'chevron-right'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'check'
  | 'close'
  | 'menu'
  | 'external-link'
  | 'star'
  | 'quote'
  | 'chevron-left'
  | 'search'
  | 'plus'
  | 'refresh'
  | 'alert-triangle'
  | 'inbox'
  | 'lock'
  | 'log-out'
  // Management area
  | 'dashboard'
  | 'users'
  | 'user'
  | 'car'
  | 'clipboard-list'
  | 'settings'
  // Services
  | 'gauge'
  | 'palette'
  | 'zap'
  | 'cpu'
  | 'disc'
  | 'shield-check'
  | 'wind'
  | 'droplet'
  | 'clipboard-check'
  // Amenities
  | 'parking'
  | 'sofa'
  // Social
  | 'facebook'
  | 'instagram';
