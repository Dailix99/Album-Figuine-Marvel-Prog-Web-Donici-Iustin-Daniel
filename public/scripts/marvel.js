async function getMarvelEroi(query) {
    return await fetch(`../eroi?query=${query}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        
        },
        body: JSON.stringify({})
        })
        .then(response => response.json())
        .catch(error => console.error(error))
}
async function getPacchetto() {
    return await fetch('../pacchetto',{
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({username: localStorage.getItem("username"), album_id:localStorage.getItem("album_ID"),user_id: localStorage.getItem("_id"),cards:5})
        })
        .then(response => response.json())
        .catch(error => console.error(error))

}

async function getAlbumFigurine(albumID) {
    return await fetch(`/album_figurine/${albumID}`,{
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
        })
        .then(response => response.json())
        .catch(error => console.error(error))

}

async function getDoppioni(albumID) {
    return await fetch(`/doppioni_figurine/${albumID}`,{
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
        })
        .then(response => response.json())
        .catch(error => console.error(error))

}

async function stampaPacchetto() {
await getPacchetto()
.then(response =>
    {  stampaCrediti();
         var i=0;
            var Div_Car = `<div class="row">
                        <div class="col-md-12 text-center"> `
            response.forEach(item => {
                if (i % 3 ==0 ) {
                    Div_Car = Div_Car + 
                    `   </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12 text-center"> `;
                }
                Div_Car =
                    Div_Car + 
                    '<div class="card card-shine-effect-metal" id="char-'+item.data.results[0].id+'">'+
                        '<div class="card-header">'+
                            item.data.results[0].name+
                        '</div>'+
                        //'<hr>'+
                        '<div class="card-content">'+
                            '<img src="'+item.data.results[0].thumbnail.path.replace(/"/g, "")+'.'+item.data.results[0].thumbnail.extension+'">'+
                        '</div>'+
                        '<div class="card-body">'+
                        item.data.results[0].description+
                        '</div>'+
                        '<div class="card-footer">'+
                        item.attributionText+
                        '</div>'+
                    '</div>';
                    i++;
            });
            Div_Car = Div_Car + `   </div>
                                </div>
                                <button onclick=window.location.reload(); class="btn btn-block btn-success w-100">OK</button>`;
            document.getElementById("pacchetto_figurine").innerHTML = Div_Car;
        }
)
.catch(response => console.error("Calculation error!"+response)) 
}

async function stampaFigurineAlbum(albumId) {
    document.getElementById("pacchetto_figurine")
    .innerHTML = '<i class="fas fa-spinner fa-spin fa-3x"></i>';
    await getAlbumFigurine(albumId)
    .then(response =>
        {   
             var i=0;
                var Div_Car = `<div class="row">
                            <div class="col-md-12 text-center"> `
                response.forEach(item => {
                    if (i % 3 ==0 ) {
                        Div_Car = Div_Car + 
                        `   </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12 text-center"> `;
                    }

                    Div_Car =
                        Div_Car + 
                        ' <a href="/card" onclick=localStorage.setItem("heroId","' + item.marvel_data.data[0].id + '")>'
                        +'<div class="card card-shine-effect-metal" id="char-'+item.marvel_data.data[0].id+'">'+
                            '<div class="card-header">'+
                                item.marvel_data.data[0].name+
                            '</div>'+
                            //'<hr>'+
                            '<div class="card-content">'+
                                '<img src="'+item.marvel_data.data[0].thumbnail.path.replace(/"/g, "")+'.'+item.marvel_data.data[0].thumbnail.extension+'">'+
                            '</div>'+
                            '<div class="card-body">'+
                            item.marvel_data.data[0].description+
                            '</div>'+
                            '<div class="card-footer">'+
                            'Data provided by ©Marvel'+
                            '</div>'+
                        '</div></a>';
                        i++;
                });
                Div_Car = Div_Car + `   </div>
                                    </div>`;
                document.getElementById("pacchetto_figurine").innerHTML = Div_Car;
                document.getElementById("pacchetto_figurine").classList.remove("hidden");
            }
    )
    .catch(response => console.error("Calculation error!"+response)) 
}

async function rimuoviFigurina(cardId) {
    var albumId = localStorage.getItem("album_ID");
    var username = localStorage.getItem("username");
    var user_id = localStorage.getItem("_id");
    if(confirm('Sei sicuro di voler eliminare questa figurina?')) {
        fetch('/figurine_eliminate', 
            { method: 'DELETE',
             headers: { 'Content-Type': 'application/json' }, 
             body: JSON.stringify({ card_id: cardId,
                                    album_id: albumId,
                                    username: username,
                                    user_id: user_id
                         }) 
            }
        )
        .then(() => window.location.reload());
}
}
    
async function StampaDoppioniFigurine(albumId) {
    document.getElementById("pacchetto_figurine")
    .innerHTML = '<i class="fas fa-spinner fa-spin fa-3x"></i>';
    var action =``;
    if (['/figurine_eliminate' ].includes(window.location.pathname))
        {   
            action = `<a onclick="rimuoviFigurina(`;
        } 
    else if (['/crea_scambio' ].includes(window.location.pathname))
   {    
        action = `<a onclick="toggletoExchange(`;
   } else {
        action = `<a onclick="alert(`;
   }
    await getDoppioni(albumId)
    .then(response =>
        {              
            var i=0;
            if (response.length > 0) {
                var Div_Car = `<div class="row">
                            <div class="col-md-12 text-center"> `
                response.forEach(item => {
                     
                    if (i % 3 ==0 ) {
                        Div_Car = Div_Car + 
                        `   </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12 text-center"> `;
                    }
                    
                    Div_Car =
                        Div_Car + action
                        +item.marvel_data.data[0].id+`)"> `+
                        `<div class="card card-shine-effect-metal" id="char-`+item.marvel_data.data[0].id+`">`+
                            `<div class="card-header">`+
                                item.marvel_data.data[0].name+
                            `</div>`+
                            //`<hr>`+
                            `<div class="card-content">`+
                                `<img src="`+item.marvel_data.data[0].thumbnail.path.replace(/"/g, "")+`.`+item.marvel_data.data[0].thumbnail.extension+`">`+
                            `</div>`+
                            `<div class="card-body">`+
                            item.marvel_data.data[0].description+
                            `</div>`+
                            `<div class="card-footer">`+
                           'Data provided by ©Marvel'+
                            `</div>`+
                        `</div> </a>`;
                        i++;
                        
                });
                Div_Car = Div_Car + `   </div>
                                    </div>`;
                
                document.getElementById("pacchetto_figurine").innerHTML = Div_Car;
                document.getElementById("pacchetto_figurine").classList.remove("hidden");
                if (['/crea_scambio' ].includes(window.location.pathname)) {
                document.getElementById("FigurinaRicevuta").classList.remove("hidden");
                document.getElementById("figurine_eliminate").classList.remove("hidden");
                }
            } else
            {
                document.getElementById("pacchetto_figurine").classList.remove("hidden");
                document.getElementById("pacchetto_figurine").innerHTML="<p> Nessun doppione da scambiare</p>"
                if (['/crea_scambio' ].includes(window.location.pathname)){
                    document.getElementById("figurine_vendute").disabled = true;
                }
                
            }
            }
    )
    .catch(response => console.error("Calculation error!"+response)) 
}


async function getEroe(id) {
    try {
        const response = await fetch(`../eroi/${id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Errore fetching supereroe:', error);
        throw error; 
    }
}

async function createAlbum(userid,name) {


    try{
        const response = await fetch(`../crea_album`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({userId:userid, name:name})
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            let JsonResponse = await response.json();
            
        localStorage.setItem("album_ID",JsonResponse.insertedId);
        alert("Album created");
        window.location.reload();
        }
    } catch (error) {
        console.error('Errore fetching supereroe:', error);
        throw error; // Rilancio l'eccezione per gestirla nella funzione chiamante
    }
}

async function caricaPersonaggio(){
    var heroID = localStorage.getItem("heroId");
    if (heroID) {
    try {
        const heroResponse = await getEroe(heroID);    
        const searchInput = document.getElementById('select_superhero');
        if (!heroResponse) {
            throw new Error('Nessuna risposta dalla fetch!');
        }
        
        if (heroResponse.data && heroResponse.data.length > 0) {
            const hero = heroResponse.data[0];
          
          
            var Div_Car =
            '<div class="card card-shine-effect-metal" id="char-'+hero.id+'">'+
                '<div class="card-header">'+
                hero.name+
                '</div>'+
                //'<hr>'+
                '<div class="card-content">'+
                    '<img src="'+hero.thumbnail.path.replace(/"/g, "")+'.'+hero.thumbnail.extension+'">'+
                '</div>'+
                '<div class="card-body">'+
                hero.description+
                '</div>'+
                '<div class="card-footer">'+
                'Data provided by ©Marvel'
                '</div>'+
            '</div>';
            document.getElementById("CardContainer").innerHTML = Div_Car;
            
          // Se l'utente ha effettuato il login, ha selezionato un album e possiede la card nell'album, presento tutti i dati
            var user_Id = localStorage.getItem("_id");
            var album_ID = localStorage.getItem("album_ID");

            if (!user_Id || !album_ID ) {
                return;
            }
            try {
                const response = await fetch('/check_card_album', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_Id: user_Id,
                        album_Id: album_ID,
                        card_Id: hero.id
                    })
                });

                if (!response.ok) {
                    throw new Error("Autenticazione non valida");
                }
                const userData = await response.json();
                if (userData.length>0) {
                const character_details = document.getElementById('character_details');
                 let seriesHtml=``;
                 let eventsHtml=``;
                 let comicsHtml=``;
                if ( hero.series.available>0 ){
                    seriesHtml = '<hr><h3>Series:</h3>';
                    for (let series of hero.series.items) {
                        seriesHtml += `<p>${series.name}</p>`;
                    }
                }
                if ( hero.events.available>0 ){
                    eventsHtml = '<hr><h3>Events:</h3>';
                    for (let events of hero.events.items) {
                        eventsHtml += `<p>${events.name}</p>`;
                    }
                }
                if ( hero.comics.available>0 ){
                    comicsHtml = '<hr><h3>Comics:</h3>';
                    for (let comic of hero.comics.items) {
                        comicsHtml += `<p>${comic.name}</p>`;
                    }
                }
                character_details.innerHTML = seriesHtml + eventsHtml + comicsHtml;
            }
                }
                
            catch (error) {
                console.error("Errore!",error);
                return "ERR";
            }        } else {
            console.error("Supereroe non trovato");
            searchInput.value = "Supereroe non trovato";
        }
        localStorage.removeItem("heroId");
    } catch (error) {
        console.error("Errore nel fetching", error);
        searchInput.value = "Errore caricamento supereroe";
    }
}
}
let collection = [];

function toggletoExchange (cardId)
{
    const found = collection.filter(item => item.id === cardId);
    if (found.length>0) {
        document.getElementById("char-"+cardId).style="";
        collection = collection.filter(item => item.id !== cardId);
    } else {
        document.getElementById("char-"+cardId).style="background-color: var(--bs-green);";
        collection.push({
            id: cardId,
        });
    }
}



async function creaScambio() {
    const userId = localStorage.getItem('_id');
    const cardToGet = document.getElementById('selected_Superhero').value;
    if (!userId || !cardToGet || !collection || collection.length === 0) {
        alert("Seleziona una o più carte da inviare e una carta che desideri.");
        throw new Error('Mancano i parametri necessari per lo scambio');
    }

    // controlliamo se la figurina è nella collezione
    if (collection.some(card => card.id === cardToGet)) {
        alert("Non puoi richiedere una carta che stai offrendo di inviare.");
        throw new Error('La carta richiesta è presente nella collezione da inviare');
    }
 
}

    try {
      const response = await fetch('/crea_scambio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          cardtoGet: cardToGet,
          cardtosend: collection,
            albumId: localStorage.getItem('album_ID')
        })
      });

      if (response.ok) {
        alert("scambio completato");
        window.location.href = '/scambio';
      } else {
        throw new Error('errore creazione scambio');
      }
    } catch (error) {
      console.error('Errore nella crezione dello scambio:', error);
      throw error;
    }


async function accettaScambio(exchangeId) {
    const userId = localStorage.getItem('_id');
    const albumId = localStorage.getItem('album_ID');

    try {
        const response = await fetch('/accetta_scambio', {
            method: 'POST', 
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            exchange_id: exchangeId,
            acceptingUserId: userId,
            album_id: albumId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        alert('scambio accettato con successo');
        window.location.reload();
    } catch (error) {
        console.error('Errore nell accettazione', error);
        alert('scambio non riuscito');
    }
}

async function eliminaScambio(exchangeID) {
    const userId = localStorage.getItem('_id');
    const albumId = localStorage.getItem('album_ID');

    try{
        const response = await fetch(`../elimina_scambio/${exchangeID}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        alert("scambio eliminato");
        //Gtorno alla honme
        window.location.reload();

    } catch (error) {
        console.error("Errore!",error);
        return "ERR";
    }
}