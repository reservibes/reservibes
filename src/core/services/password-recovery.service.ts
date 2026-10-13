import { randomInt } from "crypto";

/**
 * Servicio puro: genera claves provisorias legibles y las hashea.
 * No toca red, base de datos ni SDK. Se puede testear con Vitest sin mocks.
 */

// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/l, etc.)
// La clave es de 8 caracteres: legible para tipear desde el celular.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const KEY_LENGTH = 8;

/**
 * Genera una clave provisoria aleatoria y segura.
 * Usa crypto.randomInt (no Math.random) para que sea criptográficamente fuerte.
 */
export function generateProvisionalKey(): string {
  let key = "";
  for (let i = 0; i < KEY_LENGTH; i++) {
    key += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return key;
}

/**
 * Normaliza la clave para comparar: mayúsculas y sin espacios.
 * El usuario la puede tipear en minúsculas o con espacios sin problema.
 */
export function normalizeProvisionalKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Minutos que dura la clave provisoria desde que se genera.
 */
export const PROVISIONAL_KEY_TTL_MINUTES = 30;