import 'dotenv/config';
import * as database from './database.js';
import { getMD5, getRandomInt } from './utils.js';

// Tenere traccia del timestamp e generare i parametri di autenticazione per le chiamate Marvel
const timestamp = Date.now();
const authParams = () => `ts=${timestamp}&apikey=${process.env.PUBLIC_KEY}&hash=${getMD5(timestamp + process.env.PRIVATE_KEY + process.env.PUBLIC_KEY)}&`;

/**
 * Funzione di utilità che verifica se un personaggio Marvel è valido.
 * Un personaggio è considerato completo solo se ha nome, descrizione e immagine.
 */
function isCharacterValid(character) {
  return Boolean(character.name && character.description && character.thumbnail?.path);
}

/**
 * Effettua una richiesta generica all'API Marvel e filtra i risultati validi.
 * @param {string} res - Oggetto Express response (solo per coerenza API).
 * @param {string} url - Endpoint Marvel (es. 'public/characters').
 * @param {string} query - Stringa di query aggiuntiva.
 * @returns {Promise<Object>} Pacchetto con codice di stato e dati filtrati.
 */
export async function getFromMarvel(res, url, query) {
  try {
    const response = await fetch(`http://gateway.marvel.com/v1/${url}?${authParams()}${query}`);
    const data = await response.json();
    if (data.code === 'RequestThrottled') {
      return { code: 401, message: data.message };
    }

    const characters = data.data.results.filter(isCharacterValid);
    return { code: 200, data: characters };
  } catch (err) {
    console.error('Errore durante la chiamata a Marvel:', err);
    throw err;
  }
}

/**
 * Recupera il numero totale di personaggi disponibili.
 * Utilizza il limite 1 per ottenere solo il conteggio.
 */
export async function returnCharactersNumber() {
  try {
    const response = await fetch(`http://gateway.marvel.com/v1/public/characters?${authParams()}limit=1&`);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error('Errore nel recupero del numero di personaggi:', err);
    throw err;
  }
}

/**
 * Costruisce un pacchetto di personaggi casuali validi salvandoli nel database.
 * Riduce di 1 credito dall'utente per ogni esecuzione.
 * @param {Object} params - Parametri operativi (username, user_id, album_id, cards).
 * @returns {Promise<Array>} Array di risposte Marvel per ogni personaggio valido.
 */
export async function returnPackage(params) {
  const { username, user_id, album_id, cards } = params;
  const decrement = { username, credits: -1 };

  // Aggiorno i crediti utente
  try {
    await database.variate_credits(decrement);
  } catch (resp) {
    if (resp.code === 401) {
      throw { code: 401, message: 'Crediti insufficienti' };
    }
    throw resp;
  }

  // Recupero massimo personaggi disponibili
  const totalData = await returnCharactersNumber();
  const maxCharacters = totalData.data.total;

  const packageResults = [];
  let successful = 0;
  let attempts = 0;

  // Ciclo fino al raggiungimento del numero richiesto o al massimo di tentativi
  while (successful < cards && attempts < 200) {
    const offsetQuery = `limit=1&offset=${await getRandomInt(0, maxCharacters)}&`;
    try {
      const res = await fetch(`http://gateway.marvel.com/v1/public/characters?${authParams()}${offsetQuery}`);
      const obj = await res.json();
      const character = obj.data.results[0];

      if (isCharacterValid(character) && !packageResults.some(item => item.data.results[0].id === character.id)) {
        // Struttura del salvataggio e inserimento nel DB
        const cardData = { cardID: character.id, userID: user_id, albumID: album_id };
        await database.savecard(cardData);

        packageResults.push(obj);
        successful++;
      }
    } catch (err) {
      console.error('Errore nel ciclo di recupero personaggio:', err);
      throw err;
    }
    attempts++;
  }

  return packageResults;
}
