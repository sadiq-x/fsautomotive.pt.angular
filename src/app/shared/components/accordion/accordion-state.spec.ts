import { AccordionState } from './accordion-state';

describe('AccordionState', () => {
  let state: AccordionState;

  beforeEach(() => {
    state = new AccordionState();
  });

  it('starts with every panel closed', () => {
    expect(state.isOpen('pneus')).toBe(false);
    expect(state.openCount()).toBe(0);
  });

  it('opens and closes a panel by id', () => {
    state.toggle('pneus');
    expect(state.isOpen('pneus')).toBe(true);

    state.toggle('pneus');
    expect(state.isOpen('pneus')).toBe(false);
  });

  it('keeps only one panel open in single mode', () => {
    state.toggle('pneus');
    state.toggle('escapes');

    expect(state.isOpen('pneus')).toBe(false);
    expect(state.isOpen('escapes')).toBe(true);
    expect(state.openCount()).toBe(1);
  });

  it('keeps several panels open in multiple mode', () => {
    state.multiple.set(true);
    state.toggle('pneus');
    state.toggle('escapes');

    expect(state.isOpen('pneus')).toBe(true);
    expect(state.isOpen('escapes')).toBe(true);
    expect(state.openCount()).toBe(2);
  });

  it('closes everything at once', () => {
    state.multiple.set(true);
    state.toggle('pneus');
    state.toggle('escapes');
    state.closeAll();

    expect(state.openCount()).toBe(0);
  });
});
