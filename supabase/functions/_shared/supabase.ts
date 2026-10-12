/**
 * _shared/supabase.ts — Clientes de Supabase para las Edge Functions.
 * Módulo: Setup (helper compartido) — creado desde M1.
 *
 * SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase en el runtime de las
 * Edge Functions: NO van en ningún .env del frontend ni en el repo.
 * PERMISOS:
 *  - adminClient(): service role, SALTEA RLS. Usarlo solo para lo que RLS no puede hacer (Admin API de Auth,
 *    leer el rol en requireUser). Nunca para escribir datos de negocio en nombre del usuario.
 *  - userClient(jwt): actúa como el usuario que llama → RLS aplica (defensa en profundidad).
 */

// Versión fija (la misma que el frontend): evita que un release nuevo entre sin revisión.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

export function adminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), noSession);
}

export function userClient(jwt: string): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}
