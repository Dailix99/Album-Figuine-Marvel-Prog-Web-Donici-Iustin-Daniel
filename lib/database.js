import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { getMD5 } from "./utils.js";
import { error } from 'console';
import Decimal from 'decimal.js';

// Configurazione URI per MongoDB utilizzando le variabili d'ambiente
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/?${process.env.DB_OPTIONS}`;
let client;
let dbConnection;



export async function update_user(login) {
  try {
    // Mi collego al database
    const db = await connectToDatabase();
    const updateFields = {
      email: login.email,
      username: login.username,
      name: login.name,
      surname: login.surname,
      date: login.date,
      superhero: login.superhero
    };
    if (login.password) {
      updateFields.password = getMD5(login.password);
    }
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(login._id) },
      { $set: updateFields }
    );
    if (!result.acknowledged) {
      return {
        status: 401,
        message: 'Aggiornamento database non autorizzato o fallito'
      };
    } else {
      return {
        status: 200,
        message: 'Aggiornamento del database completato!',
        data: JSON.stringify(login)
      };
    }
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'utente nel database:', error);
    return {
      status: 401,
      message: 'Connessione al database non autorizzata o fallita',
      error: error.message
    };
  }
}

export async function delete_user(id) {
  try {
    // Mi collego al database
    const db = await connectToDatabase();

    // Rimuovo l'utente dalla collezione
    const result_users = await db.collection("users").deleteOne(
      { _id: new ObjectId(id) }
    );
    if (!result_users.acknowledged) {
      return {
        status: 401,
        message: 'Eliminazione nel database non autorizzata o fallita'
      };
    }

    // Elimino tutte le operazioni di scambio dell'utente
    const result_exchanges = await db.collection("exchanges").deleteMany(
      { user_id: new ObjectId(id) }
    );
    if (!result_exchanges.acknowledged) {
      return {
        status: 401,
        message: 'Eliminazione nel database non autorizzata o fallita'
      };
    }

    // Rimuovo tutte le carte associate all'utente
    const result_cards = await db.collection("cards").deleteMany(
      { user_id: new ObjectId(id) }
    );
    if (!result_cards.acknowledged) {
      return {
        status: 401,
        message: 'Eliminazione nel database non autorizzata o fallita'
      };
    }

    // Elimino tutti gli album dell'utente
    const result_albums = await db.collection("albums").deleteMany(
      { user_id: new ObjectId(id) }
    );
    if (!result_albums.acknowledged) {
      return {
        status: 401,
        message: 'Eliminazione nel database non autorizzata o fallita'
      };
    }

    // Cancello le associazioni tra scambi e carte per l'utente
    const result_exchange_card = await db.collection("exchanges_cards").deleteMany(
      { user_id: new ObjectId(id) }
    );
    if (!result_exchange_card.acknowledged) {
      return {
        status: 401,
        message: 'Eliminazione nel database non autorizzata o fallita'
      };
    }

    return {
      status: 200,
      message: 'Eliminazione completata! Utente rimosso'
    };

  } catch (error) {
    console.error('Errore durante la cancellazione dell\'utente nel database:', error);
    return {
      status: 401,
      message: 'Connessione al database non autorizzata o fallita',
      error: error.message
    };
  }
}

export async function getUserAlbums(id) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    const albums = await db.collection("albums").find({ user_Id: new ObjectId(id) }).toArray();
    if (!albums) {
      return {
        status: 404,
        message: 'Album non trovato'
      };
    } else {
      return albums;
    }
  } catch (error) {
    console.error('Errore recupero album:', error);
    throw error;
  }
}

export async function createAlbum(userid) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    const result = await db.collection("albums").insertOne({
      user_Id: new ObjectId(userid.userId),
      name: userid.name
    });
    if (!result) {
      return {
        status: 404,
        message: 'Impossibile creare l\'album'
      };
    } else {
      return result;
    }
  } catch (error) {
    console.error('Errore creazione album:', error);
    throw error;
  }
}




// Funzione asincrona per stabilire la connessione e memorizzarne l'istanza
async function connectToDatabase() {
  if (dbConnection) return dbConnection;

  try {
    client = new MongoClient(uri, {
          serverApi: {
              version: ServerApiVersion.v1,
              strict: true,
              deprecationErrors: true,
              useNewUrlParser: true,
              useUnifiedTopology: true,
              serverSelectionTimeoutMS: 5000,
              maxPoolSize: 10
          }
      });
    await client.connect();
    dbConnection = client.db(process.env.DB_DBNAME);
    return dbConnection;
  } catch (error) {
    console.error('Impossibile collegarsi a MongoDB', error);
    throw error;
  }
}

// Avvio immediato della connessione alla prima importazione del modulo
connectToDatabase().catch(console.error);

/**
 * Controlla se il database è raggiungibile effettuando un ping
 */
export async function check_db_connection() {
  try {
    const db = await connectToDatabase();
    await db.command({ ping: 1 });
    return {
      status: 200,
      message: 'Connessione al database avvenuta con successo'
    };
  } catch (error) {
    console.error('Connessione a MongoDB fallita:', error);
    return {
      status: 401,
      message: 'Connessione al database non autorizzata o fallita',
      error: error.message
    };
  }
}

// Verifica unicità di email o username
export async function check_username(user) {
  try {
    const db = await connectToDatabase();
    const existingUser = await db.collection("users").findOne({
      $or: [ { email: user.email }, { username: user.username } ]
    });

    if (existingUser) {
      return {
        status: 530,
        message: 'Username o email già in uso'
      };
    }

    return {
      status: 200,
      message: 'Utente non presente'
    };
  } catch (error) {
    console.error('Connessione a MongoDB fallita:', error);
    return {
      status: 500,
      message: 'Errore interno del server'
    };
  }
}

// Inserisce un nuovo utente nella collezione 'users'
export async function register_user(res, user) {
  try {
    user.credits = new Decimal(user.credits).toString();
    const db = await connectToDatabase();
    await db.collection("users").insertOne(user, function(err, result) {
      if (err) {
        return {
          status: 401,
          message: 'Inserimento nel database non riuscito',
          error: err.message
        };
      }
    });
  } catch (error) {
    console.error('Registrazione utente fallita nel database:', error);
    return {
      status: 401,
      message: 'Connessione al database non autorizzata o fallita',
      error: error.message
    };
  }
}

// Controlla le credenziali di login, utilizzando email, username o ObjectId
export async function check_user_credentials(login) {
  if (login._id) {
    login._id = new ObjectId(login._id);
  }

  const filter = {
    $or: [
      { $and: [ { email: login.email }, { password: login.password } ] },
      { $and: [ { username: login.username }, { password: login.password } ] },
      { $and: [ { _id: login._id },     { username: login.username } ] }
    ]
  };

  try {
    const db = await connectToDatabase();
    const response = await db.collection("users").findOne(filter);
    return response;
  } catch (error) {
    console.error('Errore!', error);
  }
}

// Modifica il saldo crediti di un utente controllando che non diventi negativo
export async function variate_credits(credits) {
  const db = await connectToDatabase();
  const user = await db.collection("users").findOne({ username: credits.username });

  const currentCredits = new Decimal(user.credits);
  const creditChange = new Decimal(credits.credits);
  const newCredits = currentCredits.plus(creditChange);

  if (newCredits.lessThan(0)) {
    return {
      status: 401,
      credits: currentCredits.toString()
    };
  }

  try {
    const result = await db.collection("users").updateOne(
      { username: credits.username },
      { $set: { credits: newCredits.toString() } }
    );

    const updatedUser = await db.collection("users").findOne({ username: credits.username });
    return {
      status: 200,
      result,
      credits: updatedUser.credits
    };
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dei crediti:', error);
    throw error;
  }
}


export async function get_Credits(user_param) {
  try {
    const db = await connectToDatabase();
    const user = await db.collection("users").findOne({ username: user_param });
    if (!user) {
      return {
        status: 401,
        message: 'Utente non trovato'
      };
    } else {
      // Conversione dei crediti in Decimal per mantenere precisione
      const credits = new Decimal(user.credits);
      return {
        status: 200,
        credits: credits.toString()
      };
    }
  } catch (error) {
    console.error('Errore durante il recupero dei crediti:', error);
    throw error;
  }
}



export async function get_valid_exchanges(params) {
  // Restituisce tutti gli scambi validi per l'album specificato
  try {
    const db = await connectToDatabase();
    const duplicates = await getDuplicatedAlbumsCards(params.albumid);
    const validExchanges = [];
    for (const dup of duplicates) {
      const exchanges = await db.collection("exchanges").find({ requestedCard: dup.card_Id.toString() }).toArray();
      if (!exchanges.length) continue;
      for (const exch of exchanges) {
        if (exch.user_id.toString() === params.userid) continue;
        const proposed = await db.collection("exchanges_cards").find({ exchange_id: exch._id }).toArray();
        let userHas = false;
        for (const c of proposed) {
          const hasCard = await check_card_album({ album_Id: params.albumid, user_Id: params.userid, card_Id: c.card_Id });
          if (hasCard && hasCard.length) { userHas = true; break; }
        }
        if (userHas) continue;
        validExchanges.push({
          exchange_ID: exch._id,
          requestedCard: exch.requestedCard,
          proposedCards: proposed.map(c => c.card_Id)
        });
      }
    }
    return { status: 200, exchanges: validExchanges };
  } catch (error) {
    console.error('Errore recupero scambi validi:', error);
    throw error;
  }
}


export async function create_exchange(params) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    // Inserisco il record principale dello scambio con album_id
    const exchange = await db.collection("exchanges").insertOne({
      user_id: new ObjectId(params.userId),
      album_id: params.albumId,
      requestedCard: params.cardtoGet
    });
    // Verifico che le carte proposte siano ancora disponibili
    for (const cardId of params.cardtosend) {
      // Recupero le carte possedute dall'utente
      const userCards = await db.collection("cards").find({
        user_Id: new ObjectId(params.userId),
        album_Id: params.albumId,
        card_Id: cardId.id
      }).toArray();
      // Calcolo quanti scambi già esistenti coinvolgono questa carta
      const existingExchanges = await db.collection("exchanges_cards").countDocuments({
        user_id: new ObjectId(params.userId),
        album_id: params.albumId,
        card_Id: cardId.id
      });
      // Se gli scambi ≥ carte possedute, la carta non è disponibile
      if (existingExchanges >= userCards.length) {
        throw new Error(`Carta ${cardId.id} non più disponibile per lo scambio`);
      }
    }
    // Inserisco tutte le carte proposte con il relativo exchange_id
    const cardPromises = params.cardtosend.map(cardId => {
      return db.collection("exchanges_cards").insertOne({
        exchange_id: exchange.insertedId,
        card_Id: cardId.id,
        user_id: new ObjectId(params.userId),
        album_id: params.albumId
      });
    });
    await Promise.all(cardPromises);
    return {
      status: 200,
      exchange_id: exchange.insertedId,
      message: 'Scambio creato con successo'
    };

  } catch (error) {
    console.error('Errore creazione scambio:', error);
    return {
      status: 500,
      message: 'Creazione scambio fallita',
      error: error.message
    };
  }
}

export async function remove_exchange_by_card(card) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    let result;
    if (card.type === 'Card_found') {
      // Trovo tutti gli scambi in cui la carta richiesta è stata trovata
      const exchanges = await db.collection("exchanges").find({
        requestedCard: card.cardId,
        user_id: new ObjectId(card.userId),
        album_id: card.albumId
      }).toArray();
      // Rimuovo le voci correlate in exchanges_cards
      const exchangeIds = exchanges.map(e => e._id);
      if (exchangeIds.length) {
        await db.collection("exchanges_cards").deleteMany({ exchange_id: { $in: exchangeIds } });
      }
      // Rimuovo gli scambi principali
      result = await db.collection("exchanges").deleteMany({
        requestedCard: card.cardId,
        user_id: new ObjectId(card.userId),
        album_id: card.albumId
      });
    } else if (card.type === 'Card_sold') {
      // Trovo le voci in exchanges_cards legate alla carta venduta
      const exchanges = await db.collection("exchanges_cards").find({
        card_Id: card.cardId,
        user_id: new ObjectId(card.userId),
        album_id: card.albumId
      }).toArray();
      const exchangeIds = exchanges.map(e => e.exchange_id);
      if (exchangeIds.length) {
        await db.collection("exchanges_cards").deleteMany({ exchange_id: { $in: exchangeIds } });
      }
      // Rimuovo gli scambi principali associati
      result = await db.collection("exchanges").deleteMany({
        _id: { $in: exchangeIds },
        user_id: new ObjectId(card.userId),
        album_id: card.albumId
      });
    }

    return {
      status: 200,
      message: 'Scambi rimossi con successo',
      deletedCount: result.deletedCount
    };

  } catch (error) {
    console.error('Errore rimozione scambi:', error);
    return {
      status: 500,
      message: 'Rimozione scambi fallita',
      error: error.message
    };
  }
}


export async function accept_exchange(params) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    // Recupero i dettagli dello scambio
    const exchange = await db.collection("exchanges").findOne({ _id: new ObjectId(params.exchange_id) });
    if (!exchange) throw new Error('Scambio non trovato');
    // Recupero tutte le carte proposte
    const proposed = await db.collection("exchanges_cards").find({ exchange_id: new ObjectId(params.exchange_id) }).toArray();
    // Rimuovo la carta richiesta dall'utente accettante
    await remove_card({ user_id: params.acceptingUserId, album_id: params.album_id, card_id: Number(exchange.requestedCard) }, 'exchange_cards');
    // Trasferisco la carta al creatore dello scambio
    await savecard({ userID: exchange.user_id.toString(), albumID: exchange.album_id, cardID: Number(exchange.requestedCard) });
    // Gestisco ogni carta proposta
    for (const card of proposed) {
      // Rimuovo dal creatore dello scambio
      await remove_card({ user_id: exchange.user_id.toString(), album_id: exchange.album_id, card_id: Number(card.card_Id) }, 'exchange_cards');
      // Trasferisco all'utente accettante
      await savecard({ userID: params.acceptingUserId, albumID: params.album_id, cardID: Number(card.card_Id) });
    }
    // Elimino lo scambio e le sue carte correlate
    await delete_exchange(params.exchange_id);
    return { status: 200, message: 'Scambio completato con successo' };
  } catch (error) {
    console.error('Errore completamento scambio:', error);
    return { status: 500, message: 'Completamento scambio fallito', error: error.message };
  }
}

export async function delete_exchange(exchangeId) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    // Elimino prima le voci in exchanges_cards
    await db.collection("exchanges_cards").deleteMany({ exchange_id: new ObjectId(exchangeId) });
    // Elimino lo scambio principale
    const result = await db.collection("exchanges").deleteOne({ _id: new ObjectId(exchangeId) });
    console.log('Delete->', result.deletedCount);
    if (result.deletedCount === 0) {
      return { status: 404, message: 'Scambio non trovato' };
    }
    return { status: 200, message: 'Scambio eliminato con successo' };
  } catch (error) {
    console.error('Errore eliminazione scambio:', error);
    return { status: 500, message: 'Eliminazione scambio fallita', error: error.message };
  }
}

export async function get_my_exchanges(params) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    // Recupero tutti gli scambi dell'utente
    const exchanges = await db.collection("exchanges").find({ user_id: new ObjectId(params.userid) }).toArray();
    const result = [];
    for (const exch of exchanges) {
      const cards = await db.collection("exchanges_cards").find({ exchange_id: exch._id }).toArray();
      result.push({ exchange_ID: exch._id, requestedCard: exch.requestedCard, proposedCards: cards.map(c => c.card_Id) });
    }
    return { status: 200, exchanges: result };
  } catch (error) {
    console.error('Errore recupero miei scambi:', error);
    throw error;
  }
}


export async function savecard(params) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    const card = await db.collection("cards").insertOne({
      user_Id: new ObjectId(params.userID),
      album_Id: params.albumID,
      card_Id: params.cardID
    });
    // Elimino eventuali scambi residui per questa carta
    await remove_exchange_by_card({ 
      cardId: params.cardID, 
      userId: params.userID,
      albumId: params.albumID,
      type: 'Card_found'
    });
    if (!card) {
      return {
        status: 404,
        message: 'Impossibile creare la figurina'
      };
    } else {
      return card;
    }
  } catch (error) {
    console.error('Errore inserimento figurina:', error);
    throw error;
  }
}

export async function check_card_album(params) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    const filter = {
      $and: [
        { user_Id: new ObjectId(params.user_Id) },
        { album_Id: params.album_Id },
        { card_Id: params.card_Id }
      ]
    };
    const cards = await db.collection("cards").find(filter).toArray();
    if (!cards) {
      return {
        status: 404,
        message: 'Carte non trovate'
      };
    } else {
      return cards;
    }
  } catch (error) {
    console.error('Errore recupero carte:', error);
    throw error;
  }
}

export async function getAlbumsCards(albumid) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    const cards = await db.collection("cards")
      .find({ album_Id: albumid })
      .sort({ card_Id: 1 })
      .toArray();
    if (!cards) {
      return {
        status: 404,
        message: 'Carte non trovate'
      };
    } else {
      return cards;
    }
  } catch (error) {
    console.error('Errore recupero carte:', error);
    throw error;
  }
}

export async function getDuplicatedAlbumsCards(albumid) {
  try {
    // Stabilisco la connessione al database
    const db = await connectToDatabase();
    const pipeline = [
      { $match: { album_Id: albumid } },
      { $group: {
          _id: { user_Id: "$user_Id", album_Id: "$album_Id", card_Id: "$card_Id" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gte: 2 } } }
    ];
    let cards = await db.collection("cards").aggregate(pipeline).toArray();
    if (!cards) {
      return {
        status: 404,
        message: 'Carte non trovate'
      };
    } else {
      // Riadatto la struttura per le carte duplicate
      cards = cards.map(card => ({
        user_Id: card._id.user_Id,
        album_Id: card._id.album_Id,
        card_Id: card._id.card_Id
      }));
      return cards;
    }
  } catch (error) {
    console.error('Errore recupero carte duplicate:', error);
    throw error;
  }
}

export async function remove_card(param, type) {
  const parameters = param;
  if (type === "sell_card") {
    try {
      // Crediti da assegnare per vendita
      parameters.credits = 0.2;
      await variate_credits(parameters);
      // Stabilisco la connessione al database
      const db = await connectToDatabase();
      const result = await db.collection("cards").deleteOne({
        user_Id: new ObjectId(parameters.user_id),
        album_Id: parameters.album_id,
        card_Id: parameters.card_id
      });
      if (!result.acknowledged) {
        return { status: 401, message: 'Eliminazione non autorizzata o fallita' };
      }
      // Verifico se rimuovere scambi associati
      const remaining = await db.collection("cards").find({
        user_Id: new ObjectId(parameters.user_id),
        album_Id: parameters.album_id,
        card_Id: parameters.card_id
      }).toArray();
      const exchangesCount = await db.collection("exchanges_cards").countDocuments({
        user_id: new ObjectId(parameters.user_id),
        album_id: parameters.album_id,
        card_Id: parameters.card_id
      });
      if (remaining.length <= exchangesCount) {
        await remove_exchange_by_card({
          cardId: parameters.card_id,
          userId: parameters.user_id,
          albumId: parameters.album_id,
          type: 'Card_sold'
        });
      }
      return { status: 200, message: 'Vendita completata' };
    } catch (error) {
      console.error('Errore eliminazione carta:', error);
      throw error;
    }
  } else if (type === "exchange_cards") {
    try {
      // Stabilisco la connessione al database
      const db = await connectToDatabase();
      const result = await db.collection("cards").deleteOne({
        user_Id: new ObjectId(parameters.user_id),
        album_Id: parameters.album_id,
        card_Id: parameters.card_id
      });
      if (!result.acknowledged) {
        return { status: 401, message: 'Eliminazione non autorizzata o fallita' };
      }
      return { status: 200, message: 'Scambio completato' };
    } catch (error) {
      console.error('Errore eliminazione carta per scambio:', error);
      throw error;
    }
  }
}
