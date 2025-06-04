import express from "express";
import path from 'path';
import 'dotenv/config';
import { marvel } from "./config/prefs.js";
import * as database from './lib/database.js';
import * as marvel_API from './lib/marvel.js';
import * as Utils from './lib/utils.js';
import * as register from './lib/register.js';
import { login } from './lib/login.js';
import {
  serve as swaggerUiServe,
  setup as swaggerUiSetup,
} from "swagger-ui-express"
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './lib/api/docs/swagger-output.json' with { type: 'json' };; 


// Variabile globale per il database
global.db;

// Creazione dell’app Express
const app = express();
app.use(express.json());

// -------------------------------------------------------
// SEZIONE FETCH: routing per il rendering delle pagine HTML
// -------------------------------------------------------

// Cartella statica per i file pubblici (CSS, JS, immagini)
app.use(express.static(path.resolve("./public/")));

// Pagina di base (index.html)
app.get("/", async (_req, res) => {
  // #swagger.tags = ['fetch']
  // #swagger.description = 'Endpoint che restituisce la pagina index.html'
  res.sendFile(path.resolve("./public/html/index.html"));
});

// Pagina del pacchetto (package.html)
app.get("/package", (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che restituisce la pagina del pacchetto'
  res.sendFile(path.resolve("./public/html/package.html"));
});

// Pagina di dettaglio della carta (card_detail.html)
app.get("/card", async (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che restituisce la pagina di dettaglio della carta'
  res.sendFile(path.resolve("./public/html/card_detail.html"));
});

// Pagina di gestione utente (user_profile.html)
app.get("/user", async (req, res) => {
  // #swagger.tags = ['users']
  // #swagger.description = 'Endpoint che restituisce la pagina di gestione utente'
  res.sendFile(path.resolve("./public/html/user_profile.html"));
});

// Pagina del login (login.html)
app.get("/login", async (req, res) => {
  // #swagger.tags = ['users']
  // #swagger.description = 'Endpoint che restituisce la pagina del modal di login'
  res.sendFile(path.resolve("./public/html/login.html"));
});

// Pagina di registrazione (register.html)
app.get("/register", async (req, res) => {
  // #swagger.tags = ['users']
  // #swagger.description = 'Endpoint che restituisce la pagina di registrazione utente'
  res.sendFile(path.resolve("./public/html/register.html"));
});

// Pagina dell’album principale (album.html)
app.get("/album", async (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che restituisce la pagina dell’album'
  res.sendFile(path.resolve("./public/html/album.html"));
});

// Pagina per vendere le carte (sell_cards.html)
app.get("/sell_cards", async (req, res) => {
  // #swagger.tags = ['exchanges']
  // #swagger.description = 'Endpoint che restituisce la pagina per vendere carte'
  res.sendFile(path.resolve("./public/html/sell_cards.html"));
});

// Endpoint per ottenere gli album di un utente (JSON)
app.get("/albums/:userid", async (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che restituisce gli album dell’utente'
  try {
    const response = await database.getUserAlbums(req.params.userid);
    res.send(response);
  } catch (error) {
    console.error("Errore nel recupero degli album:", error.message);
    res.status(500).json({ error: "Impossibile recuperare gli album: " + error.message });
  }
});

// Endpoint per ottenere le carte all’interno di un album (con dati Marvel)
app.get("/albums_cards/:albumid", async (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che restituisce le carte di un album con dati Marvel'
  try {
    const response = await database.getAlbumsCards(req.params.albumid);

    // Per ogni carta, richiedi i dettagli dal Marvel API
    for (let i = 0; i < response.length; i++) {
      const marvelData = await marvel_API.getFromMarvel(
        req,
        `public/characters/${response[i].card_Id}`,
        ""
      );
      response[i].marvel_data = marvelData;
    }

    res.send(response);
  } catch (error) {
    console.error("Errore nel recupero delle carte dell’album:", error.message);
    res.status(500).json({ error: "Impossibile recuperare le carte: " + error.message });
  }
});

// Endpoint per ottenere le carte duplicate di un album (con dati Marvel)
app.get("/albums_duplicated_cards/:albumid", async (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che restituisce le carte duplicate di un album con dati Marvel'
  try {
    const response = await database.getDuplicatedAlbumsCards(req.params.albumid);

    for (let i = 0; i < response.length; i++) {
      const marvelData = await marvel_API.getFromMarvel(
        req,
        `public/characters/${response[i].card_Id}`,
        ""
      );
      response[i].marvel_data = marvelData;
    }

    res.send(response);
  } catch (error) {
    console.error("Errore nel recupero delle carte duplicate:", error.message);
    res.status(500).json({ error: "Impossibile recuperare le carte duplicate: " + error.message });
  }
});

// Pagina per creare uno scambio (create_exchange.html)
app.get("/create_exchange", async (req, res) => {
  // #swagger.tags = ['exchanges']
  // #swagger.description = 'Endpoint che restituisce la pagina per creare uno scambio'
  res.sendFile(path.resolve("./public/html/create_exchange.html"));
});

// Pagina di selezione dello scambio (select_exchange.html)
app.get("/exchange", async (req, res) => {
  // #swagger.tags = ['exchanges']
  // #swagger.description = 'Endpoint che restituisce la pagina di selezione scambio'
  res.sendFile(path.resolve("./public/html/select_exchange.html"));
});

// Pagina per acquistare crediti (get_credits.html)
app.get("/get-credits", async (req, res) => {
  // #swagger.tags = ['users']
  // #swagger.description = 'Endpoint che restituisce la pagina per acquistare crediti'
  res.sendFile(path.resolve("./public/html/get_credits.html"));
});

// Endpoint per ottenere i crediti di un utente (JSON)
app.get("/print-credits/:username", async (req, res) => {
  // #swagger.tags = ['users']
  // #swagger.description = 'Endpoint che restituisce i crediti dell’utente'
  try {
    const credits = await database.get_Credits(req.params.username);
    res.send(credits);
  } catch (error) {
    console.error("Errore nel recupero dei crediti:", error.message);
    res.status(500).json({ error: "Impossibile recuperare i crediti: " + error.message });
  }
});

// Endpoint per ottenere un singolo personaggio dal Marvel API (JSON)
app.get("/character/:id", async (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che restituisce un personaggio specifico dal Marvel API'
  try {
    const response = await marvel_API.getFromMarvel(req, `public/characters/${req.params.id}`, "");
    res.json(response);
  } catch (error) {
    console.error("Errore nel recupero del personaggio:", error);
    res.status(500).json({ error: "Impossibile recuperare il personaggio" });
  }
});

// ------------------------------------------------------------------
// ENDPOINTS POST: operazioni di creazione, modifica e verifica (JSON)
// ------------------------------------------------------------------

// Registrazione di un nuovo utente
app.post("/register", async (req, res) => {
  // #swagger.tags = ['auth']
  // #swagger.description = 'Endpoint che consente la registrazione di un nuovo utente'
  try {
    await register.register(res, req.body);
  } catch (error) {
    console.error("Errore durante la registrazione:", error.message);
    res.status(500).json({ error: "Errore interno durante la registrazione" });
  }
});

// Ottenere un pacchetto di carte (JSON)
app.post("/package", (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che restituisce un pacchetto di carte Marvel'
  marvel_API.returnPackage(req.body).then((response) => {
    res.send(response);
  }).catch((error) => {
    console.error("Errore nel return del pacchetto:", error.message);
    res.status(500).json({ error: "Impossibile ottenere il pacchetto" });
  });
});

// Creazione di un nuovo album
app.post("/create_album", (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che crea un nuovo album'
  database.createAlbum(req.body).then((response) => {
    res.send(response);
  }).catch((error) => {
    console.error("Errore nella creazione dell’album:", error.message);
    res.status(500).json({ error: "Impossibile creare l’album" });
  });
});

// Variazione dei crediti di un utente
app.post("/edit-credits", (req, res) => {
  // #swagger.tags = ['users']
  // #swagger.description = 'Endpoint che modifica i crediti di un utente'
  // #swagger.parameters['headers'] = {
  //   in: 'headers',
  //   description: 'Headers contenenti informazioni sulla variazione dei crediti',
  //   type: 'object',
  //   schema: { username: 'string', credits: 'number', operation: 'string' }
  // }
  database.variate_credits(req.headers).then((response) => {
    res.send(response);
  }).catch((error) => {
    console.error("Errore nella variazione dei crediti:", error.message);
    res.status(500).json({ error: "Impossibile modificare i crediti" });
  });
});

// Verifica della connessione al database
app.post("/check-db", async (req, res) => {
  // #swagger.tags = ['database']
  // #swagger.description = 'Endpoint che verifica la connessione al database'
  try {
    const result = await database.check_db_connection();
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Errore nel controllo del DB:", error.message);
    res.status(500).json({ error: "Errore durante il controllo del database" });
  }
});

// Ottenere personaggi dal Marvel API con query personalizzata (JSON)
app.post("/characters", (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che restituisce personaggi dal Marvel API con query personalizzata'
  marvel_API.getFromMarvel(req, "public/characters", req.query.query)
    .then((response) => {
      res.send(response);
    })
    .catch((error) => {
      console.error("Errore nel recupero dei personaggi:", error.message);
      res.status(500).json({ error: "Impossibile recuperare i personaggi" });
    });
});

// ----------------------------------------
// SEZIONE AUTENTICAZIONE (login, verifica)
// ----------------------------------------

// Login dell’utente
app.post("/login", async (req, res) => {
  // #swagger.tags = ['auth']
  // #swagger.description = 'Endpoint che consente il login dell’utente'
  try {
    login(req, res);
  } catch (error) {
    console.error("Errore durante il login:", error.message);
    res.status(500).json({ error: "Errore interno durante il login" });
  }
});

// Verifica dei dati utente (tuple _id, email, nickname)
app.post("/get_user_data", async (req, res) => {
  // #swagger.tags = ['auth']
  // #swagger.description = 'Endpoint che verifica se la tupla utente è valida'
  try {
    await register.authuser(req, res);
  } catch (error) {
    console.error("Errore nella verifica dell’utente:", error.message);
    res.status(500).json({ error: "Errore interno durante la verifica utente" });
  }
});

// Aggiornamento dati utente
app.put("/update-user", async (req, res) => {
  // #swagger.tags = ['users']
  // #swagger.description = 'Endpoint che modifica i dati di un utente'
  try {
    const response = await database.update_user(req.body);
    res.send(response);
  } catch (error) {
    console.error("Errore nell’aggiornamento utente:", error.message);
    res.status(500).json({ error: "Impossibile aggiornare l’utente" });
  }
});

// Eliminazione di un utente
app.delete("/delete-user/:userid", async (req, res) => {
  // #swagger.tags = ['users']
  // #swagger.description = 'Endpoint che elimina un utente'
  try {
    const response = await database.delete_user(req.params.userid);
    res.send(response);
  } catch (error) {
    console.error("Errore nell’eliminazione utente:", error.message);
    res.status(500).json({ error: "Impossibile eliminare l’utente" });
  }
});

// Eliminazione di uno scambio
app.delete("/delete-exchange/:exchangeid", async (req, res) => {
  // #swagger.tags = ['exchanges']
  // #swagger.description = 'Endpoint che elimina uno scambio'
  try {
    const response = await database.delete_exchange(req.params.exchangeid);
    res.send(response);
  } catch (error) {
    console.error("Errore nell’eliminazione dello scambio:", error.message);
    res.status(500).json({ error: "Impossibile eliminare lo scambio" });
  }
});

// Vendita di una carta
app.delete("/sell_card", async (req, res) => {
  // #swagger.tags = ['cards']
  // #swagger.description = 'Endpoint che rimuove una carta (vendita)'
  try {
    const response = await database.remove_card(req.body, "sell_card");
    res.send(response);
  } catch (error) {
    console.error("Errore nella vendita della carta:", error.message);
    res.status(500).json({ error: "Impossibile vendere la carta" });
  }
});

// ------------------------------------------------------------------
// SWAGGER: gestione documentazione API
// ------------------------------------------------------------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ------------------------------------------------------------------
// AVVIO DEL SERVER E CONTROLLI DI AVVIAMENTO
// ------------------------------------------------------------------

// Avvio del server sulla porta specificata nel file .env
app.listen(process.env.PORT, () => {
  console.log(`Server avviato sulla porta ${process.env.PORT}`);
});

// Controllo della connessione al database all’avvio
database
  .check_db_connection()
  .then(() => console.log("Connessione al database avvenuta con successo"))
  .catch((error) => console.error("Connessione al database fallita:", error));