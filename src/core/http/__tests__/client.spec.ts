import { buildUrl } from '../client';

vi.mock('next/headers', () => ({ headers: vi.fn() }));

describe('buildUrl', () => {
  it('joint base et chemin sans doubler les barres obliques', () => {
    expect(buildUrl('http://api/api/v1/', '/storefront/home')).toBe(
      'http://api/api/v1/storefront/home',
    );
  });

  it('omet les paramètres vides et répète les clés des tableaux', () => {
    expect(
      buildUrl('http://api/api/v1', 'storefront/series', {
        genre: 'drame',
        cursor: undefined,
        q: '',
        ids: ['a', 'b'],
      }),
    ).toBe('http://api/api/v1/storefront/series?genre=drame&ids=a&ids=b');
  });
});
