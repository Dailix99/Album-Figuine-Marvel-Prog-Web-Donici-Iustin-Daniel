import { createHash } from 'crypto';

// Genera un numero intero casuale compreso tra due estremi inclusivi
// Scambia gli estremi se vengono forniti in ordine inverso e arrotonda i valori
export async function getRandomInt(min, max) {
  if (min > max) [min, max] = [max, min];
  const lower = Math.ceil(min);
  const upper = Math.floor(max);
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

// Restituisce l'hash MD5 di una stringa in formato esadecimale
export function getMD5(str) {
  return createHash('md5')
    .update(str)
    .digest('hex');
}

// Verifica che l'email rispetti il formato standard username@dominio.estensione
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Controlla che la password sia una stringa non vuota e lunga almeno 9 caratteri
export function isValidPassword(password) {
  return isValidString(password) && password.length >= 9;
}

// Valida lo username: lunghezza da 6 a 9 caratteri e nessuno spazio
export function isValidUsername(username) {
  if (typeof username !== 'string') return false;
  const len = username.length;
  return len >= 6 && len <= 9 && !username.includes(' ');
}

// Controlla che la data sia nel formato YYYY-MM-DD e rappresenti una data reale
export function isValidDate(dateString) {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(dateString)) return false;

  const [anno, mese, giorno] = dateString.split('-').map(Number);
  if (anno < 1000 || anno > 9999) return false;
  if (mese < 1 || mese > 12) return false;
  const maxDay = new Date(anno, mese, 0).getDate();
  return giorno >= 1 && giorno <= maxDay;
}

// Garantisce che una stringa sia definita, non nulla, di tipo stringa e non vuota dopo il trim
export function isValidString(str) {
  return (
    typeof str === 'string' &&
    str.trim().length > 0
  );
}
