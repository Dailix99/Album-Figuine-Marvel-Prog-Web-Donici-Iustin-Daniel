class SearchableSelect {
    /**
     * Costruttore: inizializza configurazione e riferimenti agli elementi DOM
     * @param {Object} config - Configurazione dell'API e parametri
     */
    constructor(config) {
        this.apiUrl = config.apiUrl;
        this.minChars = config.minChars || 4;                          // Caratteri minimi per la ricerca
        this.searchInput = document.getElementById('select_superhero');
        this.selectedValue = document.getElementById('selected_Superhero');
        this.resultsDropdown = document.getElementById('resultsDropdown');
        this.searchResults = document.getElementById('searchResults');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.debounceTimeout = null;
        this.init();                                                  // Avvia il binding degli eventi
    }

    /** 
     * Inizializza gli event listener per input, focus e click esterno
     */
    init() {
        // Gestione input con debounce
        this.searchInput.addEventListener('input', () => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                const query = this.searchInput.value.trim();
                if (query.length >= this.minChars) {
                    this.performSearch(query);
                } else {
                    this.hideResults();
                }
            }, 300);
        });

        // Nasconde il dropdown cliccando fuori
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) &&
                !this.resultsDropdown.contains(e.target)) {
                this.hideResults();
            }
        });

        // Mostra i risultati al focus se ci sono elementi
        this.searchInput.addEventListener('focus', () => {
            if (this.searchResults.children.length > 0) {
                this.showResults();
            }
        });
    }

    /**
     * Esegue la chiamata all'API Marvel per cercare personaggi
     * @param {string} query - Testo di ricerca
     */
    async performSearch(query) {
        try {
            this.showLoading();
            const params = `nameStartsWith=${encodeURIComponent(query)}&orderBy=name&`;
            
            const response = await getMarvelCarachters(params);
            if (response.code !== 200) {
                throw new Error(`Risposta di rete non valida: ${response.code}`);
            }

            let data = response.data;

            // Se siamo nella pagina di creazione scambio, filtra le card già presenti
            if (window.location.pathname === '/create_exchange') {
                const userId = localStorage.getItem('_id');
                const albumId = localStorage.getItem('album_ID');
                if (userId && albumId) {
                    const filtered = [];
                    for (const character of data) {
                        try {
                            const checkRes = await fetch('/check_card_album', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    user_Id: userId,
                                    album_Id: albumId,
                                    card_Id: character.id
                                })
                            });
                            const result = await checkRes.json();
                            if (result.length < 1) {
                                filtered.push(character);
                            }
                        } catch (err) {
                            console.error('Errore durante il controllo della carta:', err);
                        }
                    }
                    data = filtered;
                }
            }

            this.displayResults(data);
        } catch (error) {
            console.error('Errore durante il fetch dei dati:', error);
            this.displayError('Errore nel recupero dei risultati');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Mostra la lista dei risultati ottenuti
     * @param {Array} data - Array di personaggi Marvel
     */
    displayResults(data) {
        this.searchResults.innerHTML = '';
        if (data.length === 0) {
            const noRes = document.createElement('li');
            noRes.className = 'search-item text-muted';
            noRes.textContent = 'Nessun risultato valido';
            this.searchResults.appendChild(noRes);
        } else {
            data.forEach(item => {
                const li = document.createElement('li');
                li.className = 'search-item';
                li.textContent = item.name;
                li.dataset.value = item.id;
                li.addEventListener('click', () => this.selectItem(item));
                this.searchResults.appendChild(li);
            });
        }
        this.showResults();
    }

    /**
     * Gestisce la selezione di un elemento dalla lista
     * @param {Object} item - Oggetto del personaggio selezionato
     */
    async selectItem(item) {
        // Imposta valori nel form e nasconde dropdown
        this.selectedValue.value = item.id;
        this.searchInput.value = item.name;
        this.hideResults();

        // Evento personalizzato di selezione
        const event = new CustomEvent('item-selected', { detail: item });
        this.searchInput.dispatchEvent(event);

        // Se siamo sulla pagina di dettaglio del personaggio, mostriamo i dati
        if (window.location.pathname === '/figurina') {
            this.showSuperEroe(item);
        }
    }

    /**
     * Mostra la scheda e i dettagli del personaggio selezionato
     * @param {Object} item - Dati del personaggio
     */
    async showSuperEroe(item) {
        // Dizionario HTML della card principale
        const cardHtml = `
            <div class="card card-shine-effect-metal" id="char-${item.id}">
                <div class="card-header">${item.name}</div>
                <div class="card-content">
                    <img src="${item.thumbnail.path}.${item.thumbnail.extension}" alt="${item.name}">
                </div>
                <div class="card-body">${item.description || 'Nessuna descrizione disponibile'}</div>
                <div class="card-footer">Dati forniti da ©Marvel</div>
            </div>
        `;
        document.getElementById('CardContainer').innerHTML = cardHtml;

        // Se utente loggato e album selezionato, mostra serie, eventi e fumetti
        const userId = localStorage.getItem('_id');
        const albumId = localStorage.getItem('album_ID');
        if (!userId || !albumId) return;

        try {
            const res = await fetch('/check_card_album', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_Id: userId, album_Id: albumId, card_Id: item.id })
            });
            if (!res.ok) throw new Error('Autenticazione non valida');
            const userData = await res.json();
            if (userData.length > 0) {
                let detailsHtml = '';
                if (item.series.available > 0) {
                    detailsHtml += '<hr><h3>Serie:</h3>';
                    item.series.items.forEach(s => {
                        detailsHtml += `<p>${s.name}</p>`;
                    });
                }
                if (item.events.available > 0) {
                    detailsHtml += '<hr><h3>Eventi:</h3>';
                    item.events.items.forEach(e => {
                        detailsHtml += `<p>${e.name}</p>`;
                    });
                }
                if (item.comics.available > 0) {
                    detailsHtml += '<hr><h3>Fumetti:</h3>';
                    item.comics.items.forEach(c => {
                        detailsHtml += `<p>${c.name}</p>`;
                    });
                }
                document.getElementById('character_details').innerHTML = detailsHtml;
            }
        } catch (error) {
            console.error('Errore nel caricamento dei dettagli:', error);
        }
    }

    /**
     * Visualizza un messaggio di errore nella lista dropdown
     * @param {string} message - Messaggio di errore da mostrare
     */
    displayError(message) {
        this.searchResults.innerHTML = `
            <li class="search-item text-danger">${message}</li>
        `;
        this.showResults();
    }

    /** Mostra il dropdown dei risultati */
    showResults() {
        this.resultsDropdown.classList.add('show');
    }

    /** Nasconde il dropdown dei risultati */
    hideResults() {
        this.resultsDropdown.classList.remove('show');
    }

    /** Mostra l'indicatore di caricamento */
    showLoading() {
        this.loadingIndicator.classList.remove('d-none');
    }

    /** Nasconde l'indicatore di caricamento */
    hideLoading() {
        this.loadingIndicator.classList.add('d-none');
    }

    /**
     * Imposta il supereroe selezionato in base all'ID
     * @param {number|string} id - ID del personaggio da caricare
     */
    async setSuperheroById(id) {
        try {
            this.showLoading();
            const response = await getSingleHero(id);
            if (response.data && response.data.length > 0) {
                this.selectItem(response.data[0]);
            } else {
                this.displayError('Supereroe non trovato');
            }
        } catch (error) {
            console.error('Errore caricamento supereroe:', error);
            this.displayError('Errore nel caricamento del supereroe');
        } finally {
            this.hideLoading();
        }
    }
}

// --- Inizializzazione del componente e listener globale ---
const searchSelect = new SearchableSelect({
    minChars: 4 // Caratteri minimi per far partire la ricerca
});

document.getElementById('select_superhero').addEventListener('item-selected', (e) => {
    // Qui puoi gestire l'evento di selezione
});

/**
 * Funzione di registrazione utente con validazione campi
 */
async function registrati() {
    // Riferimenti ai campi del form
    const email = document.getElementById('email');
    const username = document.getElementById('username');
    const password1 = document.getElementById('password1');
    const password2 = document.getElementById('password2');
    const name = document.getElementById('name');
    const surname = document.getElementById('surname');
    const dateOfBirth = document.getElementById('date_of_birth');
    const selectedSuperhero = document.getElementById('selected_Superhero');
    const superheroInput = document.getElementById('select_superhero');

    // Controllo password: uguali e lunghezza minima 9
    if (password1.value !== password2.value || password1.value.length < 9) {
        [password1, password2].forEach(el => {
            el.classList.add('border', 'border-danger');
        });
        alert('La password deve essere lunga almeno 9 caratteri e corrispondere alla conferma!');
        return;
    } else {
        [password1, password2].forEach(el => {
            el.classList.remove('border', 'border-danger');
        });
    }

    // Controllo formato data di nascita (YYYY-MM-DD)
    const dataPattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dataPattern.test(dateOfBirth.value)) {
        dateOfBirth.classList.add('border', 'border-danger');
        alert('La data di nascita deve essere nel formato YYYY-MM-DD!');
        return;
    } else {
        dateOfBirth.classList.remove('border', 'border-danger');
    }
}

 
// Funzioni di utilità per le validazioni dei campi
/**
 * Valida l'email con espressione regolare
 * @param {string} value
 */
function validaEmail(value) {
    const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return pattern.test(value);
}

/**
 * Valida lo username: 4-16 caratteri, lettere, numeri e underscore
 * @param {string} value
 */
function validaUsername(value) {
    const pattern = /^[a-zA-Z0-9_]{4,16}$/;
    return pattern.test(value);
}

/**
 * Verifica che nome e cognome siano presenti
 * @param {string} value
 */
function validaAnagrafica(value) {
    return value && value.trim().length > 0;
}

/**
 * Controlla se è stato selezionato un supereroe
 * @param {string} value
 */
function validaSupereroe(value) {
    return Boolean(value);
}

// Gestione registrazione utente
async function registrati() {
    const email = document.getElementById('email');
    const username = document.getElementById('username');
    const password1 = document.getElementById('password1');
    const password2 = document.getElementById('password2');
    const name = document.getElementById('name');
    const surname = document.getElementById('surname');
    const dateOfBirth = document.getElementById('date_of_birth');
    const selectedSuperhero = document.getElementById('selected_Superhero');
    const superheroInput = document.getElementById('select_superhero');
    const button = document.querySelector('button');

    // Validazione password: almeno 7 caratteri e corrispondenza conferma
    if (password1.value && (password1.value !== password2.value || password1.value.length < 7)) {
        [password1, password2].forEach(el => el.classList.add('border', 'border-danger'));
        alert('La password deve essere lunga almeno 7 caratteri e corrispondere alla conferma!');
        return;
    } else {
        [password1, password2].forEach(el => el.classList.remove('border', 'border-danger'));
    }

    // Validazione data di nascita YYYY-MM-DD
    const dataPattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dataPattern.test(dateOfBirth.value)) {
        dateOfBirth.classList.add('border', 'border-danger');
        alert('La data di nascita deve essere nel formato YYYY-MM-DD!');
        return;
    } else {
        dateOfBirth.classList.remove('border', 'border-danger');
    }

    // Validazione email
    if (!validaEmail(email.value)) {
        email.classList.add('border', 'border-danger');
        alert('Inserisci un indirizzo email valido!');
        return;
    } else {
        email.classList.remove('border', 'border-danger');
    }

    // Validazione username
    if (!validaUsername(username.value)) {
        username.classList.add('border', 'border-danger');
        alert('Lo username deve essere tra 4 e 16 caratteri, con lettere, numeri e underscore!');
        return;
    } else {
        username.classList.remove('border', 'border-danger');
    }

    // Validazione nome e cognome
    if (!validaAnagrafica(name.value)) {
        name.classList.add('border', 'border-danger');
        alert('Inserisci il tuo nome!');
        return;
    } else {
        name.classList.remove('border', 'border-danger');
    }
    if (!validaAnagrafica(surname.value)) {
        surname.classList.add('border', 'border-danger');
        alert('Inserisci il tuo cognome!');
        return;
    } else {
        surname.classList.remove('border', 'border-danger');
    }

    // Validazione supereroe selezionato
    if (!validaSupereroe(selectedSuperhero.value)) {
        superheroInput.classList.add('border', 'border-danger');
        alert('Seleziona un supereroe!');
        return;
    } else {
        superheroInput.classList.remove('border', 'border-danger');
    }

    // Prepara dati per invio
    const data = {
        name: name.value,
        username: username.value,
        surname: surname.value,
        email: email.value,
        password: password1.value,
        date: dateOfBirth.value,
        superhero: selectedSuperhero.value,
        credits: 0.0
    };

    // Disabilita pulsante e mostra spinner
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registrazione...';

    try {
        const response = await fetch('/registrati', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        const result = await response.json();

        if (!response.ok) {
            const msg = response.status === 530 ? 'Username o email già in uso' : result.message;
            throw new Error(msg);
        }

        // Pulizia LocalStorage e mostra modale di login
        localStorage.clear();
        const loginModalEl = document.getElementById('loginModal');
        loginModalEl.addEventListener('hidden.bs.modal', () => window.location.href = '/');
        alert('Registrazione avvenuta con successo! Ora puoi effettuare il login.');
        const loginModal = new bootstrap.Modal(loginModalEl);
        loginModal.show();

    } catch (error) {
        button.disabled = false;
        button.innerHTML = 'Registrati';
        alert('Registrazione fallita. Riprova. ' + error.message);
        console.error('Registration failed:', error);
        document.getElementById('error-message').textContent = 'Registrazione fallita. Riprova.';
    }
}

// Popola il profilo utente dalla sessione
async function riempiFormUtente() {
    const email = localStorage.getItem('email');
    const username = localStorage.getItem('username');
    const _id = localStorage.getItem('_id');
    if (!email || !username || !_id) return console.error('Dati utente mancanti in LocalStorage');

    try {
        const res = await fetch('/get_user_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, _id })
        });
        if (!res.ok) throw new Error('Autenticazione non valida');
        const userData = await res.json();

        // Inserisce dati nei campi del form
        document.getElementById('username').value = userData.username;
        document.getElementById('email').value = userData.email;
        document.getElementById('name').value = userData.name;
        document.getElementById('surname').value = userData.surname;
        document.getElementById('date_of_birth').value = userData.date;

        // Selettore supereroe
        const selectEl = document.getElementById('selected_Superhero');
        if (selectEl) {
            selectEl.value = userData.superhero;
            const searchInput = document.getElementById('select_superhero');
            try {
                const heroRes = await getSingleHero(userData.superhero);
                if (heroRes.data.length > 0) {
                    searchInput.value = heroRes.data[0].name;
                } else {
                    searchInput.value = 'Supereroe non trovato';
                }
            } catch (e) {
                console.error('Errore caricamento supereroe:', e);
                searchInput.value = 'Errore caricamento supereroe';
            }
        }

    } catch (error) {
        console.error('Errore riempiFormUtente:', error);
    }
}



// Funzione per eliminare l’utente
async function cancellaUtente() {
    // Recupero l’ID utente da LocalStorage
    var _id = localStorage.getItem("_id");

    try {
        // Invio la richiesta DELETE al server
        const response = await fetch(`../delete-user/${_id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        // Informo l’utente, pulisco i dati locali e torno alla homepage
        alert("User successfully deleted. Now you will return to homepage");
        localStorage.clear();
        window.location.href = '/';
    } catch (error) {
        // In caso di errore, lo loggo in console
        console.error("Errore!", error);
        return "ERR";
    }
}

    

// Aggiorna i dati utente
async function aggiornoUtente() {
    const email = document.getElementById('email');
    const username = document.getElementById('username');
    const password1 = document.getElementById('password1');
    const password2 = document.getElementById('password2');
    const name = document.getElementById('name');
    const surname = document.getElementById('surname');
    const dateOfBirth = document.getElementById('date_of_birth');
    const selectedSuperhero = document.getElementById('selected_Superhero');
    const superheroInput = document.getElementById('select_superhero');
   

    // Validazioni campi (simili a registrati)
    if (password1.value && (password1.value !== password2.value || password1.value.length < 7)) {
        [password1, password2].forEach(el => el.classList.add('border', 'border-danger'));
        alert('La password deve essere lunga almeno 9 caratteri e corrispondere alla conferma!');
        return;
    } else {
        [password1, password2].forEach(el => el.classList.remove('border', 'border-danger'));
    }
    const dataPattern2 = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dataPattern2.test(dateOfBirth.value)) {
        dateOfBirth.classList.add('border', 'border-danger');
        alert('La data di nascita deve essere nel formato YYYY-MM-DD!');
        return;
    } else {
        dateOfBirth.classList.remove('border', 'border-danger');
    }
    if (!validaEmail(email.value)) {
        email.classList.add('border', 'border-danger');
        alert('Inserisci un indirizzo email valido!');
        return;
    } else {
        email.classList.remove('border', 'border-danger');
    }
    if (!validaUsername(username.value)) {
        username.classList.add('border', 'border-danger');
        alert('Lo username deve essere tra 6 e 9 caratteri!');
        return;
    } else {
        username.classList.remove('border', 'border-danger');
    }
    if (!validaAnagrafica(name.value)) {
        name.classList.add('border', 'border-danger');
        alert('Inserisci il tuo nome!');
        return;
    } else { name.classList.remove('border', 'border-danger'); }
    if (!validaAnagrafica(surname.value)) {
        surname.classList.add('border', 'border-danger');
        alert('Inserisci il tuo cognome!');
        return;
    } else { surname.classList.remove('border', 'border-danger'); }
    if (!validaSupereroe(selectedSuperhero.value)) {
        superheroInput.classList.add('border', 'border-danger');
        alert('Seleziona un supereroe!');
        return;
    } else { superheroInput.classList.remove('border', 'border-danger'); }


    // Funzione per aggiornare i dati dell’utente
    // Raccolgo i valori dal form e preparo l’oggetto da inviare
    var data = {
        name: name.value,
        _id: localStorage.getItem("_id"),
        username: username.value,
        password: password1.value,
        surname: surname.value,
        email: email.value,
        date: date_of_birth.value,
        superhero: selected_Superhero.value // ID del supereroe selezionato
    };

    // Disabilito il pulsante e mostro lo spinner
    const button = document.querySelector('button');
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registrazione...';

    try {
        // Invio la richiesta PUT al server
        const response = await fetch('/update-user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        // Attendo la risposta e la converto in JSON
        const result = await response.json();

        if (!response.ok) {
            // Se il server risponde con errore, sollevo un’eccezione
            throw new Error(result.message);
        }

        // Salvo le credenziali aggiornate in LocalStorage
        localStorage.setItem("email", data.email);
        localStorage.setItem("username", data.username);
        localStorage.setItem("name", data.name);

        alert("User update successfully!");
        // Ricarico la pagina per applicare le modifiche
        window.location.reload();
        return;
    } catch (error) {
        // In caso di errore, ripristino il pulsante
        button.disabled = false;
        button.innerHTML = 'Register';

        // Mostro l’errore in console e tramite alert
        console.error('Update failed:', error);
        alert('Update failed. Please try again. ' + error.message);

        // Inserisco il messaggio d’errore nell’elemento dedicato
        document.getElementById('error-message').textContent =
            'Update failed. Please try again.';
    }
}