import { NextResponse, type NextRequest } from 'next/server';
import { clearSession, readSession, refreshTokens, writeSession } from '@core/session/session';
import { safeNext } from '@core/session/jwt';

/** Renouvelle la session puis revient à la page demandée (les pages ne peuvent pas écrire de cookie). */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  const s = await readSession();
  const tokens = s.refreshToken ? await refreshTokens(s.refreshToken) : null;
  if (tokens) await writeSession(tokens, s.phone);
  else await clearSession();
  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
