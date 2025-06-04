import { getMD5, isValidString, isValidEmail, isValidPassword } from "./utils.js";
import { check_user_credentials } from "./database.js";

/**
req - Richiesta Express contenente email/username e password.
res - Risposta Express per inviare esito e dati utente.
 Gestisce l'accesso di un utente verificando le credenziali fornite.
 Se l'autenticazione riesce, restituisce i dati essenziali dell'utente.
 */
export async function login(req, res) {
  const { email, username, password } = req.body;

  // Controllo parametri obbligatori
  if ((!email && !username) || !password) {
    res.status(400).send('Parametri mancanti');
    return;
  }

  // Validazione formato email o username
  if (email ? !isValidEmail(email) : !isValidString(username)) {
    res.status(400).send('Email o username non validi');
    return;
  }

  // Verifica validità della password
  if (!isValidString(password) || !isValidPassword(password)) {
    res.status(400).send('Password non conforme');
    return;
  }

  // Crittografa la password per il confronto
  const hashed = getMD5(password);
  const credentials = { password: hashed, ...(email ? { email } : { username }) };

  try {
    const user = await check_user_credentials(credentials);
    if (!user) {
      res.status(401).send('Accesso non autorizzato');
    } else {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        credits: user.credits
      });
    }
  } catch (err) {
    console.error('Errore durante login:', err);
    res.status(500).send('Errore interno, riprova più tardi');
  }
}
