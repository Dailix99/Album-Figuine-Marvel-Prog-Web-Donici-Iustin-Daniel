import { getMD5, isValidDate, isValidString, isValidPassword, isValidUsername } from "./utils.js";
import * as database from "./database.js";

/**
  Effettua l'autenticazione di un utente utilizzando le credenziali fornite.
 
  Riceve req e res di Express, controlla _id e username e interroga il DB.
 */
export async function authuser(req, res) {
  const credenziali = req.body;
  if (!isValidString(credenziali._id)) {
    res.status(400).send('ID utente non valido');
    return;
  }
  if (!isValidString(credenziali.username)) {
    res.status(400).send('Nome utente non valido');
    return;
  }
  try {
    const utenteTrovato = await database.check_user_credentials(credenziali);
    if (!utenteTrovato) {
      res.status(401).send('Accesso negato');
    } else {
      res.json(utenteTrovato);
    }
  } catch (error) {
    res.status(500).send('Errore interno del server');
  }
}

/**
    res - Risposta Express.
    user - Dati dell'utente da registrare.
    
 
    Registra un nuovo utente nel sistema dopo aver validato e cifrato i dati.
 
    Controlla la presenza e la correttezza di tutti i campi, esegue l'hash della password e salva l'utente nel database.
 
 */
export async function register(res, user) {
  const { name, username, email, password, date } = user;

  // Verifica dei campi obbligatori
  if (!name || !username || !email || !password) {
    res.status(400).send('Parametro mancante');
    return;
  }

  // Verifica formato della data di nascita
  if (!isValidDate(date)) {
    res.status(400).send('Data non valida');
    return;
  }

  // Controllo validità delle stringhe
  if (![name, email, password].every(isValidString)) {
    res.status(400).send('Dati non validi, riprova');
    return;
  }

  // Controllo requisiti password
  if (!isValidPassword(password)) {
    res.status(400).send('La password deve essere lunga almeno 7 caratteri');
    return;
  }

  // Controllo formato dello username
  if (!isValidUsername(username)) {
    res.status(400).send('Username non conforme');
    return;
  }

  // Hash della password
  user.password = getMD5(password);

  try {
    const verifica = await database.check_username(user);
    if (verifica.status !== 200) {
      res.status(verifica.status).send();
      return;
    }
    await database.register_user(res, user);
    res.status(200).send('Utente registrato con successo');
  } catch (err) {
    res.status(500).send(`Errore di sistema: ${err}`);
  }
}
