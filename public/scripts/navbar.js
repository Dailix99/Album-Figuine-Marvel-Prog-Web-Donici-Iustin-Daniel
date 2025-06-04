async function loadHTML() {
    fetch('/login')
        .then(response => response.text())
        .then(data => {
            htmlContent = data;
        });
}

if (!['/user'].includes(window.location.pathname)) {
    // Solo per le pagine che non richiedono il profilo
    window.addEventListener('load', () => {
        printNavBar().catch(error => {
            console.error('Caricamento navbar fallito:', error);
        });
    });
}

// ----- FUNZIONE: Controllo autenticazione utente -----
// Verifica se email, username e id sono presenti nel localStorage.
// Se l’utente non è loggato e si trova in una pagina protetta,
// lo reindirizza alla homepage.
// Ritorna `true` se l’utente è già autenticato, altrimenti `false`.

function checkUserLogged() {
    const id = localStorage.getItem("_id");
    const email = localStorage.getItem("email");
    const username = localStorage.getItem("username");
    if (email && username && id) {
        // L'utente è loggato
        return true;
    } else {
        // Se l'utente non è loggato e sono in una pagina protetta, reindirizzo alla homepage
        if (['/album', '/get-credits', '/package', '/exchange', '/user', '/sell_cards', '/create_exchanges']
            .includes(window.location.pathname)) {
            window.location.href = '/';
        }
        return false;
    }
}

function logout() {
    localStorage.clear();
    // Ritorno alla homepage
    window.location.href = '/';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', adaptNavbar);

async function printCredits() {
    const elements = document.getElementsByClassName('current_credits');
    const credits = await get_credits();
    Array.from(elements).forEach(element => {
        element.textContent = credits;
    });
}


async function get_credits() {
    return await fetch(`/print-credits/${localStorage.getItem("username")}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(response => response.credits);
}




async function printNavBar() {
    const basePath = '../images/';
    const logoIcon = `${basePath}logo.png`;
    const navbarContainer = document.getElementById('menu');

    // Inizio navbar centrata
    let HTML_code = `
      <nav class="navbar navbar-expand-lg">
      <div class="container-fluid justify-content-start" id="NavigationBar">

    `;

    if (checkUserLogged()) {
        HTML_code += `
              <!-- Elementi aggiuntivi per utenti loggati -->
              <li class="nav-item">
                <a class="nav-link" href="/pacchetto"
                   style="color:white;margin:0 24px;font-weight:bold;font-size:1.1rem;">
                  Pacchetti
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="/scambio"
                   style="color:white;margin:0 24px;font-weight:bold;font-size:1.1rem;">
                  Scambi
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="/album"
                   style="color:white;margin:0 24px;font-weight:bold;font-size:1.1rem;">
                  Album
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="/get-credits"
                   style="color:white;margin:0 24px;font-weight:bold;font-size:1.1rem;">
                  Crediti: <span class="current_credits">${await get_credits()}</span>
                </a>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userdropdown" role="button"
                   data-bs-toggle="dropdown" aria-expanded="false"
                   style="color:white;margin:0 24px;font-weight:bold;font-size:1.1rem;">
                  <i class="fas fa-user"></i> ${localStorage.getItem("name")}
                </a>
                <ul class="dropdown-menu" aria-labelledby="userdropdown"
                    style="background-color:#000;border:none;padding:0;">
                  <li>
                    <a class="dropdown-item" href="/user"
                       style="color:white;font-weight:bold;">
                      <i class="fas fa-address-card"></i> Profilo utente
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" role="button" onclick="logout()"
                       style="color:white;font-weight:bold;">
                      <i class="fas fa-right-from-bracket"></i> Esci
                    </a>
                  </li>
                </ul>
              </li>
        `;

    } else {
        try {
            const response = await fetch('/login');
            const text = await response.text();
            HTML_code += text;
        } catch (error) {
            console.error('Errore nel caricamento del modal di login:', error);
        }
    }
    // Chiudo i tag della navbar
    HTML_code += `
            </div>
        </div>
        </nav>
    `;
    navbarContainer.innerHTML = HTML_code;
    adaptNavbar();
}

