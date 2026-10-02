/**
 * _shared/logger.ts — Logs básicos en JSON para depurar sin acceso directo a producción.
 * Módulo: Setup (helper compartido de Edge Functions).
 *
 * Spec "Requisitos técnicos": manejo de logs básico en las Edge Functions.
 * REGLA: no loguear datos sensibles (contraseñas, tokens, listados completos de personal).
 */

type Level = 'info' | 'warn' | 'error';

export function log(fn: string, level: Level, message: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({ fn, level, message, ...data, at: new Date().toISOString() }));
}
