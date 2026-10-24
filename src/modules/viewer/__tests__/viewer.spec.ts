import { describe, expect, it } from 'vitest';
import { ApiError } from '@core/http/api-error';
import { formatCoins, formatDuration, plural, safeHexColor } from '../format';
import { messageFor } from '../messages';

describe('formatage', () => {
  it('durées, crédits, pluriels', () => {
    expect(formatDuration(null)).toBe('');
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(754)).toBe('13 min');
    expect(formatCoins(1250)).toBe('1 250');
    expect(plural(1, 'épisode')).toBe('1 épisode');
    expect(plural(12, 'épisode')).toBe('12 épisodes');
  });

  it('couleur de marque : hexadécimal uniquement (pas d’injection CSS)', () => {
    expect(safeHexColor('#E0325E')).toBe('#E0325E');
    expect(safeHexColor('#fff')).toBe('#fff');
    expect(safeHexColor('red; background:url(x)')).toBeNull();
    expect(safeHexColor(undefined)).toBeNull();
  });
});

describe('messages d’erreur', () => {
  it('par code, jamais le texte brut de l’API', () => {
    expect(
      messageFor(
        new ApiError({ code: 'INSUFFICIENT_BALANCE', message: 'détail interne', status: 409 }),
      ),
    ).toBe('Crédits insuffisants pour cet épisode.');
    expect(messageFor(new ApiError({ code: 'INCONNU', message: 'x', status: 500 }))).toBe(
      'Une erreur est survenue. Réessayez.',
    );
    expect(messageFor(new Error('boom'))).toBe('Une erreur est survenue. Réessayez.');
  });
});
