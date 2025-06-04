// Fa il login dell'utente
async function login() {
   // Verifica validità form
   if (!validateForm()) return;
 
   const userField = document.getElementById('usernameOrEmail');
   const pwdField = document.getElementById('password');
   const payload = {
     email: userField.value,
     username: userField.value,
     password: pwdField.value,
   };
 
   const container = document.querySelector('.resultContainer');
   container.innerHTML = '';
 
   try {
     const response = await fetch('/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload)
     });
 
     if (!response.ok) {
       showMessage(container, 'Accesso fallito! Controlla le credenziali', 'danger');
       return;
     }
 
     const data = await response.json();
     saveUserData(data); // Memorizza dati utente
     showMessage(container, 'Accesso eseguito con successo!', 'success');
     setTimeout(() => window.location.href = '/', 1000);
   } catch (error) {
     showMessage(container, 'Errore di rete. Ritenta più tardi.', 'danger');
   }
 }
 
 // Controlla i campi del form di login
 function validateForm() {
   const userField = document.getElementById('usernameOrEmail');
   const pwdField = document.getElementById('password');
 
   // Rimuove stili di errore precedenti
   [userField, pwdField].forEach(el => el.classList.remove('border', 'border-danger'));
 
   const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   const isEmail = emailPattern.test(userField.value);
   const isUserValid = userField.value && userField.value.length >= 6 && userField.value.length <= 9;
 
   if (!isEmail && !isUserValid) {
     // Segnala campo non valido
     userField.classList.add('border', 'border-danger');
     alert('Username o email non valido!');
     return false;
   }
 
   if (!pwdField.value || pwdField.value.length < 9) {
     pwdField.classList.add('border', 'border-danger');
     alert('La password deve contenere almeno 9 caratteri!');
     return false;
   }
 
   return true;
 }
 
 // Visualizza messaggi di successo o errore
 function showMessage(container, text, type) {
   container.innerHTML = `
     <div class="alert alert-${type}" role="alert" aria-hidden="true">
       <h4 class="alert-heading">${text}</h4>
     </div>`;
 }
 
 // Salva le informazioni utente in localStorage
 function saveUserData({ _id, email, username, name, credits }) {
   localStorage.setItem('_id', _id);
   localStorage.setItem('email', email);
   localStorage.setItem('username', username);
   localStorage.setItem('name', name);
   localStorage.setItem('credits', credits);
 }