/**
 * _shared/cors.ts — Headers CORS y manejo del preflight (OPTIONS).
 * Módulo: Setup (helper compartido de Edge Functions). Endurecido desde M1.
 *
 * El origen permitido sale del secret ALLOWED_ORIGIN (uno por entorno):
 *   producción → https://<dominio>.vercel.app   ·   local → http://localhost:5173
 *   (supabase secrets set ALLOWED_ORIGIN=... / supabase/functions/.env en local)
 * Si falta, NO se emite Access-Control-Allow-Origin: el navegador bloquea (falla cerrado, nunca '*').
 */

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')?.trim() ?? '';
if (!allowedOrigin) console.warn(JSON.stringify({ fn: 'cors', level: 'warn', message: 'Falta ALLOWED_ORIGIN' }));

export const corsHeaders: Record<string, string> = {
  ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '600',
  Vary: 'Origin',
};

/** Devuelve una Response si es un preflight; null si hay que seguir procesando. */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  return null;
}
