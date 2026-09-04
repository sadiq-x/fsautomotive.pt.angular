/**
 * Which URLs count as the private area.
 *
 * This decides whether the public header, footer and mobile tab bar render at
 * all, so a wrong answer is either a management screen wearing the brochure
 * site's chrome, or a public page with no navigation.
 */
import { isPrivatePath } from './app';

describe('isPrivatePath', () => {
  it('claims the private area and everything under it', () => {
    expect(isPrivatePath('/gestao')).toBe(true);
    expect(isPrivatePath('/gestao/entrar')).toBe(true);
    expect(isPrivatePath('/gestao/painel')).toBe(true);
    expect(isPrivatePath('/gestao/clientes/42')).toBe(true);
  });

  it('leaves the public site alone', () => {
    expect(isPrivatePath('/')).toBe(false);
    expect(isPrivatePath('/sobre-nos')).toBe(false);
    expect(isPrivatePath('/servicos')).toBe(false);
    expect(isPrivatePath('/contactos')).toBe(false);
  });

  // The `/` boundary: a public route that merely starts with the same letters
  // must keep its header.
  it('does not match a path that only shares the prefix', () => {
    expect(isPrivatePath('/gestaoxyz')).toBe(false);
    expect(isPrivatePath('/gestao-comercial')).toBe(false);
  });

  it('ignores the query string and fragment', () => {
    expect(isPrivatePath('/gestao/entrar?redirect=/gestao/painel')).toBe(true);
    expect(isPrivatePath('/contactos#mapa')).toBe(false);
  });
});
