// Importazione del modulo swagger-autogen usando CommonJS per differenziare la sintassi
const swaggerAutogen = require('swagger-autogen')();
// Importazione delle configurazioni dall'apposito file di preferenze
const { config } = require("../../../config/prefs.js");

// Specifica del file di output e dei file contenenti gli endpoint
const percorsoOutput = './swagger-output.json';
const fileEndpoint = [
  '../../*.js',      // Tutti i file .js nella cartella superiore e sottocartelle
  '../../../app.js'  // Il file principale dell'applicazione
];

// Definizione del documento Swagger con commenti in italiano
const documentoSwagger = {
  info: {
    title: "Personaggi Marvel",                                               // Titolo dell'API
    description: "Imposto API per il sistema di scambio figurine marvel",     // Descrizione dettagliata
    version: "1.0.0"                                                          // Versione dell'API
  },
  host: `${config.host}:${config.port}`,        // Host e porta presi dalle preferenze
  basePath: "/",                                // Percorso base per tutte le rotte
  schemes: ['http'],                            // Protocollo utilizzato
  consumes: ['application/json'],               // Formati accettati in input
  produces: ['application/json'],               // Formati restituiti in output

  // Elenco dei tag 
  tags: [
  
    {
      name: "utenti",
      description: "Gestione operazioni relative agli utenti"
    },
    {
      name: "aute",
      description: "Operazioni di login e autorizzazione"
    },
    {
      name: "fig",
      description: "Gestione delle figurine dell'album"
    },
    {
      name: "scambi",
      description: "Gestione degli scambi di figurine"
    },
    {
      name: "db",
      description: "Controllo stato connessione al database"
    }
  ],

  // Definizioni degli schemi di dati, con nomi cambiati rispetto all'originale
  definitions: {
    UtenteDiEsempio: {
      _id: "ObjectId('96f8b9c7d1a2e3f4b5c6d7e8')",        // ID di esempio
      nome: "Iustin Daniel",                              // Nome utente di esempio
      cognome: "Donici",                                  // Cognome di esempio
      username: "iustinDon",                              // Username di esempio
      email: "iustindaniel.donici@studenti.unimi.it",     // Email di esempio
      passwordHash: "hashed_password_esempio",            // Password hash di esempio
      punteggio: 250,                                     // Crediti o punteggio
      collezione: ["figura1", "figura2"]                  // Array di ID figurine
    },
    UtenteConnesso: {
      $_id: "96f8b9c7d1a2e3f4b5c6d7e8",                   // ID dell'utente connesso
      $username: "iustinDon",                             // Username con $
      $email: "iustindaniel.donici@studenti.unimi.it",    // Email con $
      $nome: "Iustin Daniel"                              // Nome con $
    },
    RichiestaAutenticazione: {
      email: "iustindaniel.donici@studenti.unimi.it",     // Email richiesta login
      username: "iustinDon",                              // Username richiesta login
      $password: "password123"                             // Password richiesta login (solo per esempio)
    }
  }
};

// Avvio della generazione del file Swagger
swaggerAutogen(percorsoOutput, fileEndpoint, documentoSwagger);
