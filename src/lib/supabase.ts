/**
 * lib/supabase.ts — Cliente de Supabase ÚNICO de la app.
 * Módulo: Setup.
 *
 * REGLA DE NEGOCIO: todo acceso a datos pasa por este cliente. Nunca armar SQL a mano desde el frontend.
 * PERMISOS: la anon key es pública; lo que protege los datos es RLS y las Edge Functions.
 * TODO(SETUP): pasarle el tipo Database generado (createClient<Database>) cuando exista database.types.ts.
 */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('[supabase] Falta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copiá .env.example a .env.');
}

// Valores de relleno para que el esqueleto levante sin .env (las llamadas reales van a fallar).
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'anon-key-placeholder');
