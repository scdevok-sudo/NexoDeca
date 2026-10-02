/**
 * _shared/cors.ts — Headers CORS y manejo del preflight (OPTIONS).
 * Módulo: Setup (helper compartido de Edge Functions).
 *
 * TODO(SETUP): restringir Access-Control-Allow-Origin al dominio de Vercel en producción.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/** Devuelve una Response si es un preflight; null si hay que seguir procesando. */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return null;
}
