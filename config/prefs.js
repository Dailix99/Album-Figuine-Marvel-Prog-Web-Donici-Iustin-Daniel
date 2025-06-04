import dotenv from 'dotenv';

dotenv.config();

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  🎯 Estrazione Variabili Env     ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
const { BASE_URL, PUBLIC_KEY, PRIVATE_KEY, HOST, PORT } = process.env;

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  🚀 Configurazione API Marvel    ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
/**
 * @typedef {Object} MarvelConfig
 * @property {string} baseUrl - URL base per gli endpoint dell'API Marvel
 * @property {string} publicKey - Chiave pubblica per l'autenticazione
 * @property {string} privateKey - Chiave privata per l'autenticazione
 */
const marvelConfig = {
  baseUrl: BASE_URL,
  publicKey: PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
};

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  🖥️ Configurazione Server Node.js ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
/**
 * @typedef {Object} ServerConfig
 * @property {string} host - Indirizzo host estratto dalle variabili d'ambiente
 * @property {string} port - Porta su cui avviare il server
 */
const serverConfig = {
  host: HOST,
  port: PORT,
};

// ─────────────────────────────────────────────────
// Esporta le configurazioni rinominate per chiarezza
// ─────────────────────────────────────────────────
export { marvelConfig as marvel, serverConfig as config };
